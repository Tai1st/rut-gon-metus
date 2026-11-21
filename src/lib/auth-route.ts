import { NextResponse } from "next/server";
import { beFetch } from "./be";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "./config";

type BeSession = {
  accessToken?: string;
  user?: { role?: string };
  message?: string | string[];
};

/**
 * Gọi route đăng nhập/đăng ký của backend (/link-auth/*), nhận JWT rồi đặt vào cookie httpOnly.
 * Trình duyệt chỉ nhận thông tin người dùng, không bao giờ thấy token.
 */
export async function authViaBackend(path: "/link-auth/login" | "/link-auth/register", payload: unknown) {
  const res = await beFetch(path, { method: "POST", body: JSON.stringify(payload) }).catch(() => null);
  if (!res) return NextResponse.json({ message: "Không kết nối được máy chủ" }, { status: 502 });

  const data = (await res.json().catch(() => ({}))) as BeSession;
  if (!res.ok || !data.accessToken) {
    const message = Array.isArray(data.message) ? data.message.join(", ") : data.message;
    return NextResponse.json({ message: message || "Yêu cầu thất bại" }, { status: res.status || 400 });
  }

  const out = NextResponse.json({ user: data.user });
  out.cookies.set(SESSION_COOKIE, data.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return out;
}
