import type { LinkItem } from "./types";

/** Đường dẫn rút gọn: link thường và deeplink Shopee là `/<mã>`, deeplink TikTok là `/s/<mã>`. */
export const shortPath = (l: Pick<LinkItem, "kind" | "code">) => (l.kind === "url" || l.kind === "shopee" ? `/${l.code}` : `/s/${l.code}`);

/** URL đầy đủ để chia sẻ; `host` là tên miền của trang đang mở khi link không gắn domain riêng. */
export const shortUrl = (l: Pick<LinkItem, "kind" | "code" | "domain">, host: string) => `https://${l.domain || host}${shortPath(l)}`;
