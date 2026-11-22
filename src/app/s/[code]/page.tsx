import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { beFetch } from "@/lib/be";
import { INTERNAL_KEY } from "@/lib/config";

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
};

type Props = { params: Promise<{ code: string }> };

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
  if (link.kind === "url" && link.redirectType !== "direct") {
    const target = safeHttpUrl(link.webUrl);
    const description = link.description || (target ? `Đang chuyển hướng tới ${target.hostname}` : "");
    const images = link.image ? [link.image] : undefined;
    const host = await currentHost();
    return {
      title: { absolute: link.title },
      description,
      openGraph: { title: link.title, description, type: "website", url: `https://${host}/s/${link.code}`, images },
      twitter: { card: images ? "summary_large_image" : "summary", title: link.title, description, images },
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

export default async function Page({ params }: Props) {
  const { code } = await params;
  const host = await currentHost();
  const link = await loadLink(code, host);
  if (!link) notFound();

  const ua = (await headers()).get("user-agent") ?? "";
  const countUrl = `/internal/links/${encodeURIComponent(code)}?count=1&host=${encodeURIComponent(host)}`;

  if (link.kind === "url") {
    // Link thường: trang trung gian có thẻ xem trước do người tạo đặt, rồi tự chuyển sau 0,5 giây.
    // Mọi người và mọi trình quét nhận cùng một trang; bot không được tính lượt bấm.
    const target = safeHttpUrl(link.webUrl);
    if (!target) notFound();
    if (link.redirectType === "direct") {
      // Trực tiếp: chuyển hướng HTTP 307 ngay. Đếm xong rồi mới chuyển vì sau redirect() không chạy tiếp được.
      if (!BOT_UA.test(ua)) await beFetch(countUrl, { internalKey: INTERNAL_KEY }).catch(() => null);
      redirect(target.href);
    }
    if (!BOT_UA.test(ua)) void beFetch(countUrl, { internalKey: INTERNAL_KEY }).catch(() => null);
    const jj = (v: string) => JSON.stringify(v).replace(/</g, "\\u003c");
    return (
      <div className="redir-page">
        <div className="redir-loader" aria-hidden>
          Redirecting
        </div>
        <p className="redir-text">
          Đang chuyển hướng tới <strong>{target.hostname}</strong>…
        </p>
        <a className="redir-link" href={target.href} rel="noopener noreferrer">
          Bấm vào đây nếu trang không tự chuyển
        </a>
        <script dangerouslySetInnerHTML={{ __html: `setTimeout(function(){location.replace(${jj(target.href)})},500);` }} />
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
