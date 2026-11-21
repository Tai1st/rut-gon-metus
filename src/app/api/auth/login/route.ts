import { NextResponse } from "next/server";
import { beFetch } from "@/lib/be";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/config";

type LoginBody = { username?: string; password?: string };

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as LoginBody;
  const res = await beFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: body.username ?? "", password: body.password ?? "" }),
  }).catch(() => null);

  if (!res) return NextResponse.json({ message: "Không kết nối được máy chủ" }, { status: 502 });
  const data = (await res.json().catch(() => ({}))) as {
    accessToken?: string;
    user?: { role?: string };
    message?: string | string[];
  };
  if (!res.ok || !data.accessToken) {
    const message = Array.isArray(data.message) ? data.message.join(", ") : data.message;
    return NextResponse.json({ message: message || "Đăng nhập thất bại" }, { status: res.status || 401 });
  }
  // Tính năng này chỉ dành cho quản trị viên và người dùng thường.
  if (data.user?.role !== "admin" && data.user?.role !== "user") {
    return NextResponse.json({ message: "Tài khoản này không có quyền dùng công cụ rút gọn link" }, { status: 403 });
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
