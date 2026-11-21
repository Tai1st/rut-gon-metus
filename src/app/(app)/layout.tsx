import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { beFetch } from "@/lib/be";
import { SESSION_COOKIE } from "@/lib/config";
import type { Me, Quota } from "@/lib/types";

// Khu vực cần đăng nhập: kiểm tra phiên ở server trước khi render.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");

  const [meRes, quotaRes] = await Promise.all([
    beFetch("/link-auth/me", { token }).catch(() => null),
    beFetch("/links/quota", { token }).catch(() => null),
  ]);
  if (!meRes || !meRes.ok) redirect("/login");
  const me = (await meRes.json().catch(() => null)) as Me | null;
  if (!me?.id) redirect("/login");

  // Hạn mức chỉ để hiển thị ở thanh bên; lỗi thì bỏ qua, không chặn trang.
  const quota = quotaRes?.ok ? ((await quotaRes.json().catch(() => null)) as Quota | null) : null;

  return (
    <AppShell me={me} quota={quota}>
      {children}
    </AppShell>
  );
}
