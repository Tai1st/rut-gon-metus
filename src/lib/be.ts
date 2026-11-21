import { BE_URL } from "./config";

type Init = {
  method?: string;
  body?: string;
  token?: string;
  internalKey?: string;
  /** IP thật của khách; backend dùng để giới hạn tốc độ theo từng người thay vì theo IP của server Next. */
  ip?: string;
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
  return fetch(`${BE_URL}/api${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
}
