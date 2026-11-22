"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { beFetch, clientIp } from "@/lib/be";
import { INTERNAL_KEY } from "@/lib/config";
import { unlockCookieName, unlockToken } from "@/lib/unlock";

/** Kiểm tra mật khẩu của link; đúng thì đặt cookie xác nhận rồi quay lại trang link. */
export async function unlockLink(code: string, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim();
  // Quay lại đúng địa chỉ người dùng đang xem: /<mã> (link thường) hoặc /s/<mã>. Chỉ nhận hai dạng này.
  const asked = String(formData.get("next") ?? "");
  const back = asked === `/${code}` ? `/${encodeURIComponent(code)}` : `/s/${encodeURIComponent(code)}`;

  const res = await beFetch(`/internal/links/${encodeURIComponent(code)}/unlock`, {
    method: "POST",
    body: JSON.stringify({ password }),
    internalKey: INTERNAL_KEY,
    ip: clientIp(h),
  }).catch(() => null);
  if (!res) redirect(`${back}?e=3`);
  if (res.status === 429) redirect(`${back}?e=2`);
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
  if (!res.ok || !data.ok) redirect(`${back}?e=1`);

  // Lấy lockId hiện tại để gắn vào cookie (đổi mật khẩu thì cookie cũ hết hiệu lực).
  const info = await beFetch(`/internal/links/${encodeURIComponent(code)}?host=${encodeURIComponent(host)}`, {
    internalKey: INTERNAL_KEY,
  }).catch(() => null);
  const link = info?.ok ? ((await info.json()) as { lockId?: string }) : null;
  if (!link) redirect(`${back}?e=3`);

  (await cookies()).set(unlockCookieName(code), unlockToken(code, link.lockId ?? ""), {
    httpOnly: true,
    secure: h.get("x-forwarded-proto") === "https",
    sameSite: "lax",
    path: "/", // tên cookie đã gắn theo mã nên dùng chung cho cả /<mã> và /s/<mã>
    maxAge: 60 * 60 * 12,
  });
  redirect(back);
}
