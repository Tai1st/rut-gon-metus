import { createHmac, timingSafeEqual } from "node:crypto";
import { INTERNAL_KEY } from "./config";

/** Cookie xác nhận đã nhập đúng mật khẩu của một link. Chỉ dùng ở server. */
export const unlockCookieName = (code: string) => `lk_${code}`;

/**
 * Giá trị cookie = HMAC(INTERNAL_KEY, code + lockId). lockId đổi khi người tạo đổi hoặc gỡ mật khẩu
 * nên các cookie cũ tự mất hiệu lực. Khách không đoán được nếu không có INTERNAL_KEY.
 */
export function unlockToken(code: string, lockId: string): string {
  return createHmac("sha256", INTERNAL_KEY).update(`unlock:${code}:${lockId}`).digest("hex");
}

export function isUnlocked(code: string, lockId: string, cookie: string | undefined): boolean {
  if (!cookie || !INTERNAL_KEY) return false;
  const a = Buffer.from(cookie);
  const b = Buffer.from(unlockToken(code, lockId));
  return a.length === b.length && timingSafeEqual(a, b);
}
