/** Cấu hình phía server (không import từ component client). */
export const BE_URL = (process.env.ZALO_BE_URL ?? "http://localhost:4100").replace(/\/$/, "");
export const INTERNAL_KEY = process.env.INTERNAL_KEY ?? "";
export const SESSION_COOKIE = "ls_token";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 ngày, khớp JWT_EXPIRES_IN mặc định của backend
