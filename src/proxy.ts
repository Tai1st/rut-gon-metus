import { NextResponse, type NextRequest } from "next/server";
import { beFetch } from "@/lib/be";
import { INTERNAL_KEY } from "@/lib/config";
import { isInterstitial, unlockCookieName, type PublicLinkData } from "@/lib/interstitial";
import { isReservedCode } from "@/lib/reserved";

/**
 * Định tuyến đường dẫn rút gọn:
 * - `/<mã>` (link thường, không có tiền tố /s) và `/s/<mã>` (deeplink, và cách cũ của link thường) đều dùng được.
 * - Link thường dùng trang trung gian được phục vụ bằng HTML thuần (giống mẫu BocLink, không kèm mã của Next.js) bởi route /r/<mã>.
 * - Các loại còn lại (deeplink TikTok, chuyển hướng trực tiếp, trang nhập mật khẩu) do trang /s/<mã> xử lý.
 * Đường dẫn cấp một trùng tên trang của ứng dụng (login, dashboard…) được bỏ qua ngay, không gọi backend.
 */
export async function proxy(req: NextRequest) {
  const parts = req.nextUrl.pathname.split("/").filter(Boolean);
  // Mã chỉ gồm chữ, số, gạch ngang và gạch dưới (loại luôn tên tệp như favicon.ico).
  const bare = parts.length === 1 && /^[A-Za-z0-9_-]+$/.test(parts[0]) && !isReservedCode(parts[0]);
  const prefixed = parts.length === 2 && parts[0] === "s";
  if (!bare && !prefixed) return NextResponse.next();
  const code = parts[parts.length - 1];

  // Gửi form mở khóa (server action) tới địa chỉ không có /s: chuyển sang trang xử lý thật.
  if (req.method !== "GET") {
    return bare ? NextResponse.rewrite(new URL(`/s/${encodeURIComponent(code)}`, req.url)) : NextResponse.next();
  }

  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(",")[0].trim();
  const res = await beFetch(`/internal/links/${encodeURIComponent(code)}?host=${encodeURIComponent(host)}`, { internalKey: INTERNAL_KEY }).catch(() => null);
  if (!res || !res.ok) return NextResponse.next(); // /s/<mã> tự hiện 404; /<mã> không có trang nào khớp nên cũng 404

  const link = (await res.json()) as PublicLinkData;
  if (isInterstitial(link, req.cookies.get(unlockCookieName(code))?.value)) {
    return NextResponse.rewrite(new URL(`/r/${encodeURIComponent(code)}`, req.url));
  }
  return bare ? NextResponse.rewrite(new URL(`/s/${encodeURIComponent(code)}`, req.url)) : NextResponse.next();
}

export const config = {
  // Bỏ qua tệp tĩnh (có dấu chấm) và tài nguyên nội bộ của Next.
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
