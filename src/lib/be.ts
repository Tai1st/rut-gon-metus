import { BE_URL } from "./config";

export type ClickMeta = { ua?: string; referer?: string | null; country?: string | null };

/** Header chỉ nhận ký tự ASCII in được; cắt ngắn để không phình. */
const ascii = (v: string | null | undefined, max: number) => (v ?? "").replace(/[^\x20-\x7E]/g, "").slice(0, max);

/** Lấy thông tin lượt bấm từ header của request (User-Agent, Referer, quốc gia do Cloudflare đặt). */
export function clickMeta(h: Headers): ClickMeta {
  return { ua: h.get("user-agent") ?? "", referer: h.get("referer"), country: h.get("cf-ipcountry") };
}

type Init = {
  method?: string;
  body?: string;
  token?: string;
  internalKey?: string;
  /** IP thật của khách; backend dùng để giới hạn tốc độ theo từng người thay vì theo IP của server Next. */
  ip?: string;
  /** Thông tin lượt bấm gửi kèm khi tăng bộ đếm (trang Thống kê); backend không lưu IP. */
  meta?: ClickMeta;
};

/**
 * IP thật của khách: ưu tiên header do Cloudflare / nginx đặt. Chỉ trả đúng một địa chỉ để backend
 * (trust proxy = 1) coi đó là IP khách.
 */
export function clientIp(h: Headers): string | undefined {
  const raw = h.get("cf-connecting-ip") ?? h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0];
  const ip = raw?.trim();
  return ip && /^[0-9a-fA-F:.]+$/.test(ip) ? ip : undefined;
}

/** Gọi backend metus-zalo-be từ server Next. Đường dẫn không kèm tiền tố /api. */
export function beFetch(path: string, init: Init = {}) {
  const headers: Record<string, string> = {};
  if (init.body !== undefined) headers["content-type"] = "application/json";
  if (init.token) headers.authorization = `Bearer ${init.token}`;
  if (init.internalKey) headers["x-internal-key"] = init.internalKey;
  if (init.ip) headers["x-forwarded-for"] = init.ip;
  if (init.meta) {
    headers["x-click-ua"] = ascii(init.meta.ua, 400);
    headers["x-click-referer"] = ascii(init.meta.referer, 300);
    headers["x-click-country"] = ascii(init.meta.country, 2);
  }
  return fetch(`${BE_URL}/api${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
}
