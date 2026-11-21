import { BE_URL } from "./config";

type Init = {
  method?: string;
  body?: string;
  token?: string;
  internalKey?: string;
};

/** Gọi backend metus-zalo-be từ server Next. Đường dẫn không kèm tiền tố /api. */
export function beFetch(path: string, init: Init = {}) {
  const headers: Record<string, string> = {};
  if (init.body !== undefined) headers["content-type"] = "application/json";
  if (init.token) headers.authorization = `Bearer ${init.token}`;
  if (init.internalKey) headers["x-internal-key"] = init.internalKey;
  return fetch(`${BE_URL}/api${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
}
