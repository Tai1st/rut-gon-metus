/** Cấu hình phía server (không import từ component client). */
export const BE_URL = (process.env.ZALO_BE_URL ?? "http://localhost:4100").replace(/\/$/, "");
export const INTERNAL_KEY = process.env.INTERNAL_KEY ?? "";
/**
 * Tên miền chỉ dùng cho link rút gọn (cách nhau dấu phẩy): chỉ phục vụ /<mã>, /s/<mã> và /r/<mã>;
 * trang chủ, đăng nhập, bảng điều khiển và API của web đều trả 404 trên các tên miền này.
 */
export const LINK_ONLY_HOSTS = new Set(
  (process.env.LINK_ONLY_HOSTS ?? "dlieya.click")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);
export const SESSION_COOKIE = "ls_token";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 ngày, khớp JWT_EXPIRES_IN mặc định của backend
