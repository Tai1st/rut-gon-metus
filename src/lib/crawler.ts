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
 * Bot hoặc người dùng đến từ Facebook, nhận biết qua User-Agent: bot quét link của Facebook, hoặc trình duyệt trong
 * ứng dụng Facebook/Messenger (UA có FBAN, FBAV, FB_IAB, FBIOS, FB4A, Messenger).
 */
export const isFromFacebook = (ua: string) => isFacebookCrawler(ua) || /FBAN|FBAV|FB_IAB|FBIOS|FB4A|Messenger/i.test(ua);
