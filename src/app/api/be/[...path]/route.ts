import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { beFetch } from "@/lib/be";
import { SESSION_COOKIE } from "@/lib/config";

/**
 * Proxy từ trình duyệt tới backend: gắn JWT lấy từ cookie httpOnly (trình duyệt không bao giờ thấy token)
 * và chỉ cho đi tới các nhóm route của tính năng này.
 */
const ALLOWED = ["links", "link-plans", "link-orders", "link-domains"];
const ALLOWED_AUTH = new Set(["me", "change-password"]);

type Ctx = { params: Promise<{ path: string[] }> };

async function forward(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  const [head, second] = path;
  const ok = ALLOWED.includes(head) || (head === "auth" && ALLOWED_AUTH.has(second));
  if (!ok) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });

  const hasBody = req.method !== "GET" && req.method !== "DELETE";
  const body = hasBody ? await req.text() : undefined;
  const res = await beFetch(`/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`, {
    method: req.method,
    body: body || undefined,
    token,
  }).catch(() => null);
  if (!res) return NextResponse.json({ message: "Không kết nối được máy chủ" }, { status: 502 });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
