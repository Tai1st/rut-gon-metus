import { NextResponse, type NextRequest } from "next/server";
import { beFetch } from "@/lib/be";
import { INTERNAL_KEY } from "@/lib/config";
import { isInterstitial, unlockCookieName, type PublicLinkData } from "@/lib/interstitial";

/**
 * Link thường dùng trang trung gian được phục vụ bằng HTML thuần (giống mẫu BocLink, không kèm mã của Next.js)
 * bởi route /r/<code>. Các loại còn lại (deeplink TikTok, chuyển hướng trực tiếp, trang nhập mật khẩu) đi qua trang /s/<code> như cũ.
 */
export async function proxy(req: NextRequest) {
  if (req.method !== "GET") return NextResponse.next();
  const code = req.nextUrl.pathname.split("/")[2];
  if (!code) return NextResponse.next();

  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(",")[0].trim();
  const res = await beFetch(`/internal/links/${encodeURIComponent(code)}?host=${encodeURIComponent(host)}`, { internalKey: INTERNAL_KEY }).catch(() => null);
  if (!res || !res.ok) return NextResponse.next();
  const link = (await res.json()) as PublicLinkData;
  if (!isInterstitial(link, req.cookies.get(unlockCookieName(code))?.value)) return NextResponse.next();

  return NextResponse.rewrite(new URL(`/r/${encodeURIComponent(code)}`, req.url));
}

export const config = {
  matcher: "/s/:code",
};
