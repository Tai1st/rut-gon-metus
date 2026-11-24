/**
 * Bot quét link của Facebook/Meta. Thẻ App Links (al:*) chỉ cần cho bot này (Facebook lưu lại rồi dùng khi người dùng bấm link),
 * nên chỉ bot mới nhận thẻ; người thật nhận bản không có thẻ.
 */
export const isFacebookCrawler = (ua: string) => /facebookexternalhit|facebot|meta-externalagent|meta-externalfetcher/i.test(ua);

/**
 * Bot nhận bản deeplink TikTok có thẻ App Links (al:*): bot Facebook (facebookexternalhit, Facebot) và Telegram.
 * Bot khác (Googlebot, meta-externalagent…) và người dùng thật không nhận thẻ al:*.
 */
export const isAlBot = (ua: string) => /facebookexternalhit|facebot|telegrambot/i.test(ua);

/** Trình duyệt di động (kể cả trình duyệt trong ứng dụng Facebook, Zalo…): gọi thẳng app TikTok. */
export const isMobileUa = (ua: string) => /Android|iPhone|iPad|iPod/i.test(ua);

/**
 * Người dùng hoặc bot đến từ Facebook: bot quét link của Facebook, trình duyệt trong ứng dụng Facebook/Messenger
 * (UA có FBAN, FBAV, FB_IAB, FBIOS) hoặc Referer thuộc facebook.com / messenger.com.
 */
export function isFromFacebook(ua: string, referer: string | null | undefined): boolean {
  if (isFacebookCrawler(ua) || /FBAN|FBAV|FB_IAB|FBIOS|FB4A|Messenger/i.test(ua)) return true;
  if (!referer) return false;
  try {
    return /(^|\.)(facebook\.com|fb\.com|messenger\.com)$/i.test(new URL(referer).hostname);
  } catch {
    return false;
  }
}
