/** Cấu hình phía server (không import từ component client). */
export const BE_URL = (process.env.ZALO_BE_URL ?? "http://localhost:4100").replace(/\/$/, "");
export const INTERNAL_KEY = process.env.INTERNAL_KEY ?? "";
/**
 * Tên miền chỉ dùng cho link rút gọn (cách nhau dấu phẩy): chỉ phục vụ /<mã>, /s/<mã> và /r/<mã>;
 * trang chủ, đăng nhập, bảng điều khiển và API của web đều trả 404 trên các tên miền này.
 */
const hostSet = (v: string) =>
  new Set(
    v
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
export const LINK_ONLY_HOSTS = hostSet(process.env.LINK_ONLY_HOSTS ?? "dlieya.click");
/** Tên miền phục vụ trang web (cách nhau dấu phẩy). Mọi tên miền khác (kể cả tên miền riêng của người dùng) chỉ phục vụ link rút gọn. */
export const WEB_HOSTS = hostSet(process.env.WEB_HOSTS ?? "link.metus.vn");

/** Tên miền này chỉ được phục vụ link rút gọn, không phục vụ trang web. */
export function isLinkOnlyHost(rawHost: string): boolean {
  const h = rawHost.split(":")[0].toLowerCase();
  if (!h || h === "localhost" || /^\d{1,3}(\.\d{1,3}){3}$/.test(h) || h.endsWith(".localhost")) return LINK_ONLY_HOSTS.has(h);
  if (LINK_ONLY_HOSTS.has(h)) return true;
  return !WEB_HOSTS.has(h);
}
export const SESSION_COOKIE = "ls_token";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 ngày, khớp JWT_EXPIRES_IN mặc định của backend
