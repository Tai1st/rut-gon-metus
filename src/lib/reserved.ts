/**
 * Đường dẫn cấp một đã dùng cho trang của ứng dụng: link thường dạng `host/<mã>` không được trùng các tên này.
 * Giữ đồng bộ với danh sách trong backend (links/tiktok.util.ts) và với các thư mục trong src/app.
 */
export const RESERVED_CODES = new Set([
  "admin", "analytics", "api", "assets", "bio", "bulk", "dashboard", "domains", "expired", "favicon", "help", "inspector",
  "integrations", "login", "logout", "plans", "pricing", "privacy", "qr", "r", "register", "robots", "s", "settings",
  "sitemap", "static", "support", "terms", "www",
]);

export const isReservedCode = (code: string) => RESERVED_CODES.has(code.toLowerCase());
