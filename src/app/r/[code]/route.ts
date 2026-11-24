import { cookies, headers } from "next/headers";
import { beFetch } from "@/lib/be";
import { INTERNAL_KEY } from "@/lib/config";
import { isAlBot, isFacebookCrawler, isFacebookTraffic, isMobileUa } from "@/lib/crawler";
import { expiredResponse } from "@/lib/expired";
import { isInterstitial, renderDeeplinkPage, renderInterstitial, resolveTarget, safeHttpUrl, shopeeFakeTarget, shopeeRedirectTarget, unlockCookieName, type PublicLinkData } from "@/lib/interstitial";

export const dynamic = "force-dynamic";

const BOT_UA = /facebookexternalhit|facebot|twitterbot|slackbot|whatsapp|telegrambot|linkedinbot|bot\b|crawler|spider|preview/i;

/**
 * Trang trung gian của link thường dưới dạng HTML thuần. `src/proxy.ts` viết lại /<code> (hoặc /s/<code>) sang đây khi link dùng trang trung gian,
 * nên địa chỉ người dùng thấy không đổi. Mọi điều kiện (mật khẩu, loại link) được kiểm tra lại ở đây
 * để truy cập thẳng /r/<code> không vượt được cổng mật khẩu.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim();
  const notFound = () => new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });

  const res = await beFetch(`/internal/links/${encodeURIComponent(code)}?host=${encodeURIComponent(host)}`, { internalKey: INTERNAL_KEY }).catch(() => null);
  if (!res || !res.ok) return notFound();
  const link = (await res.json()) as PublicLinkData;
  if (link.expired) return expiredResponse();
  if (!isInterstitial(link, (await cookies()).get(unlockCookieName(code))?.value)) return notFound();

  const ua = h.get("user-agent") ?? "";

  // Deeplink Shopee: chuyển 301 thẳng sang link Shopee gốc cho mọi User-Agent (giống cách các dịch vụ rút gọn Shopee khác);
  // Shopee tự lo phần mở app. Chỉ đếm lượt bấm, bot quét link không được tính.
  if (link.kind === "shopee") {
    // Bot Facebook và trình duyệt trong app Facebook (iOS/Android) nhận link Shopee thật; mọi nguồn khác nhận link giả
    // (cùng tên miền, chuỗi phía sau dấu / là chuỗi giả nên không lộ link affiliate).
    const real = shopeeRedirectTarget(link);
    const to = isFacebookTraffic(ua) ? real : (shopeeFakeTarget(link, INTERNAL_KEY) ?? real);
    if (!to) return notFound();
    if (!BOT_UA.test(ua)) {
      void beFetch(`/internal/links/${encodeURIComponent(code)}?count=1&host=${encodeURIComponent(host)}`, { internalKey: INTERNAL_KEY }).catch(() => null);
    }
    return new Response(null, { status: 301, headers: { location: to, "cache-control": "no-store, no-cache, must-revalidate" } });
  }

  // Deeplink TikTok: HTML thuần, chọn bản theo User-Agent (bot Facebook/Telegram, di động, còn lại). Chỉ đếm lượt bấm của người thật.
  if (link.kind === "product" || link.kind === "campaign") {
    if (!safeHttpUrl(link.webUrl) || !link.androidUrl) return notFound();
    if (!BOT_UA.test(ua)) {
      void beFetch(`/internal/links/${encodeURIComponent(code)}?count=1&host=${encodeURIComponent(host)}`, { internalKey: INTERNAL_KEY }).catch(() => null);
    }
    const variant = isAlBot(ua) ? "bot" : isMobileUa(ua) ? "mobile" : "desktop";
    return new Response(
      renderDeeplinkPage(variant, { title: link.title, image: link.image, webUrl: link.webUrl, androidUrl: link.androidUrl, iosUrl: link.iosUrl ?? link.androidUrl }),
      { headers: { "content-type": "text/html; charset=UTF-8", "cache-control": "no-store, no-cache, must-revalidate, max-age=0", vary: "User-Agent" } },
    );
  }

  const target = resolveTarget(link, {
    country: h.get("cf-ipcountry") ?? undefined,
    region: h.get("cf-region") ?? undefined,
    userAgent: ua,
    acceptLanguage: h.get("accept-language") ?? undefined,
  });
  if (!target) return notFound();

  // Bot quét link (Facebook…) không tính lượt bấm.
  if (!BOT_UA.test(ua)) {
    void beFetch(`/internal/links/${encodeURIComponent(code)}?count=1&host=${encodeURIComponent(host)}`, { internalKey: INTERNAL_KEY }).catch(() => null);
  }

  const html = renderInterstitial({
    title: link.title,
    description: link.description || `Đang chuyển hướng tới ${target.hostname}`,
    image: link.image,
    pageUrl: `https://${host}/${link.code}`,
    target: target.href,
    updatedTime: Math.floor(Date.now() / 1000),
    // Thẻ al:* chỉ dành cho bot Facebook.
    appLinks: isFacebookCrawler(ua) ? link.appLinks : undefined,
  });
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store, max-age=0", vary: "User-Agent" },
  });
}
