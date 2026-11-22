/**
 * Bot quét link của Facebook/Meta. Thẻ App Links (al:*) chỉ cần cho bot này (Facebook lưu lại rồi dùng khi người dùng bấm link),
 * nên chỉ bot mới nhận thẻ; người thật nhận bản không có thẻ.
 */
export const isFacebookCrawler = (ua: string) => /facebookexternalhit|facebot|meta-externalagent|meta-externalfetcher/i.test(ua);
