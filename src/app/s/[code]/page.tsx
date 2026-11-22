import { cache } from "react";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { beFetch } from "@/lib/be";
import { INTERNAL_KEY } from "@/lib/config";
import { pickTarget, withParams, type RedirectRules } from "@/lib/redirect";
import { isUnlocked, unlockCookieName } from "@/lib/unlock";
import { unlockLink } from "./actions";

/** Đích hợp lệ của link thường: chỉ http/https (đã kiểm tra khi tạo, kiểm tra lại ở đây cho chắc). */
function safeHttpUrl(u: string): URL | null {
  try {
    const x = new URL(u);
    return x.protocol === "http:" || x.protocol === "https:" ? x : null;
  } catch {
    return null;
  }
}

// Trang công khai, luôn render ở server để Facebook crawler thấy sẵn thẻ og + App Links (al:*) trong HTML.
export const dynamic = "force-dynamic";

type PublicLink = {
  code: string;
  kind: "product" | "campaign" | "url";
  title: string;
  description?: string;
  redirectType?: "direct" | "interstitial";
  image: string;
  webUrl: string;
  androidUrl: string;
  iosUrl: string;
  hasPassword?: boolean;
  lockId?: string;
} & Omit<RedirectRules, "webUrl">;

type Props = { params: Promise<{ code: string }>; searchParams?: Promise<{ e?: string }> };

const BOT_UA = /facebookexternalhit|facebot|twitterbot|slackbot|whatsapp|telegrambot|linkedinbot|bot\b|crawler|spider|preview/i;

async function currentHost() {
  const h = await headers();
  return (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim();
}

// Mọi thiết bị / bot nhận cùng nội dung; chỉ khác là bot quét link không được tính lượt bấm.
const loadLink = cache(async (code: string, host: string): Promise<PublicLink | null> => {
  const res = await beFetch(`/internal/links/${encodeURIComponent(code)}?host=${encodeURIComponent(host)}`, {
    internalKey: INTERNAL_KEY,
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as PublicLink;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const link = await loadLink(code, await currentHost());
  if (!link) return {};
  if (link.kind === "url" && link.hasPassword) {
    // Link có mật khẩu: không để lộ mô tả/ảnh/đích trong thẻ xem trước.
    return { title: { absolute: link.title }, description: "Liên kết được bảo vệ bằng mật khẩu", robots: { index: false } };
  }
  if (link.kind === "url" && link.redirectType !== "direct") {
    const target = safeHttpUrl(link.webUrl);
    const description = link.description || (target ? `Đang chuyển hướng tới ${target.hostname}` : "");
    const images = link.image ? [link.image] : undefined;
    const host = await currentHost();
    return {
      title: { absolute: link.title },
      description,
      openGraph: { title: link.title, description, type: "website", url: `https://${host}/${link.code}`, images },
      // Như trang mẫu: luôn dùng thẻ lớn (summary_large_image).
      twitter: { card: "summary_large_image", title: link.title, description, images },
    };
  }
  return {
    // absolute: không gắn hậu tố thương hiệu, thẻ xem trước chỉ hiện tên sản phẩm.
    title: { absolute: link.title },
    // Mô tả đúng điểm đến để thẻ xem trước không lấy nhầm mô tả mặc định của trang chủ.
    description: "Xem trên TikTok Shop",
    openGraph: {
      title: link.title,
      description: "Xem trên TikTok Shop",
      images: link.image ? [link.image] : undefined,
    },
    // Khai báo app TikTok cho trình duyệt trong Facebook mở thẳng app, không hiện cảnh báo.
    appLinks: {
      ios: { url: link.iosUrl, app_store_id: "1235601864", app_name: "TikTok" },
      android: { package: "com.ss.android.ugc.trill", url: link.androidUrl, app_name: "TikTok" },
      web: { url: link.webUrl, should_fallback: true },
    },
  };
}

export default async function Page({ params, searchParams }: Props) {
  const { code } = await params;
  const { e: errCode } = (await searchParams) ?? {};
  const host = await currentHost();
  const link = await loadLink(code, host);
  if (!link) notFound();

  const ua = (await headers()).get("user-agent") ?? "";
  const countUrl = `/internal/links/${encodeURIComponent(code)}?count=1&host=${encodeURIComponent(host)}`;

  if (link.kind === "url") {
    // Link thường: trang trung gian có thẻ xem trước do người tạo đặt, rồi tự chuyển sau 0,5 giây.
    // Mọi người và mọi trình quét nhận cùng một trang; bot không được tính lượt bấm.
    if (link.hasPassword && !isUnlocked(code, link.lockId ?? "", (await cookies()).get(unlockCookieName(code))?.value)) {
      const msg = errCode === "1" ? "Mật khẩu không đúng." : errCode === "2" ? "Nhập sai quá nhiều lần, hãy thử lại sau ít phút." : errCode === "3" ? "Có lỗi xảy ra, hãy thử lại." : "";
      return (
        <div className="redir-page">
          <form action={unlockLink.bind(null, code)} className="redir-lock">
          <input type="hidden" name="next" value={link.kind === "url" ? `/${code}` : `/s/${code}`} />
            <h1 className="redir-lock-title">Liên kết được bảo vệ</h1>
            <p className="redir-text">Nhập mật khẩu để tiếp tục.</p>
            <input name="password" type="password" required autoFocus autoComplete="off" maxLength={64} placeholder="Mật khẩu" className="redir-lock-input" />
            {msg && <p className="redir-lock-error">{msg}</p>}
            <button type="submit" className="redir-lock-btn">
              Mở liên kết
            </button>
          </form>
        </div>
      );
    }
    // Chọn đích theo địa lý > thiết bị > ngôn ngữ (nếu người tạo đặt quy tắc), rồi gắn tham số UTM.
    const h = await headers();
    const picked = pickTarget(
      { ...link, webUrl: link.webUrl },
      {
        country: h.get("cf-ipcountry") ?? undefined,
        region: h.get("cf-region") ?? undefined,
        userAgent: ua,
        acceptLanguage: h.get("accept-language") ?? undefined,
      },
    );
    const target = safeHttpUrl(withParams(picked, link.params)) ?? safeHttpUrl(link.webUrl);
    if (!target) notFound();
    if (link.redirectType === "direct") {
      // Trực tiếp: chuyển hướng HTTP 307 ngay. Đếm xong rồi mới chuyển vì sau redirect() không chạy tiếp được.
      if (!BOT_UA.test(ua)) await beFetch(countUrl, { internalKey: INTERNAL_KEY }).catch(() => null);
      redirect(target.href);
    }
    if (!BOT_UA.test(ua)) void beFetch(countUrl, { internalKey: INTERNAL_KEY }).catch(() => null);
    const jj = (v: string) => JSON.stringify(v).replace(/</g, "\\u003c");
    return (
      // Trang trung gian theo mẫu: nền #f8f8f8, chỉ có vòng xoay "Redirecting", tự chuyển sau 0,5 giây.
      <div className="redir-page">
        {/* React 19 đưa thẻ <meta> lên <head>; thời điểm cập nhật nội dung theo giây, như trang mẫu */}
        <meta property="og:updated_time" content={String(Math.floor(Date.now() / 1000))} />
        <noscript>
          <meta httpEquiv="refresh" content={`0.5;url=${target.href}`} />
        </noscript>
        <div className="redir-loader">Redirecting</div>
        <script dangerouslySetInnerHTML={{ __html: `window.setTimeout(function(){window.location.href = ${jj(target.href)};}, 500);` }} />
      </div>
    );
  }

  if (!BOT_UA.test(ua)) {
    // Deeplink: đếm lượt bấm, không chờ kết quả để không làm chậm việc chuyển trang.
    void beFetch(countUrl, { internalKey: INTERNAL_KEY }).catch(() => null);
  }

  const j = (v: string) => JSON.stringify(v).replace(/</g, "\\u003c");
  // Điện thoại: mở app bằng deeplink snssdk1180://. Máy tính: sang trang web TikTok. Facebook đọc thẻ al:* ở trên.
  const script = `(function(){
var ua=navigator.userAgent;
var android=/Android/i.test(ua),ios=/iPhone|iPad|iPod/i.test(ua);
if(!android&&!ios){location.replace(${j(link.webUrl)});return;}
location.replace(${j(link.androidUrl)});
})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
