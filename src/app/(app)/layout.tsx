import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell, type Counts } from "@/components/AppShell";
import { beFetch } from "@/lib/be";
import { SESSION_COOKIE } from "@/lib/config";
import type { Me, Quota } from "@/lib/types";

// Khu vực cần đăng nhập: kiểm tra phiên ở server trước khi render.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");

  const [meRes, quotaRes, countsRes] = await Promise.all([
    beFetch("/link-auth/me", { token }).catch(() => null),
    beFetch("/links/quota", { token }).catch(() => null),
    beFetch("/links/counts", { token }).catch(() => null),
  ]);
  if (!meRes || !meRes.ok) redirect("/login");
  const me = (await meRes.json().catch(() => null)) as Me | null;
  if (!me?.id) redirect("/login");

  // Hạn mức chỉ để hiển thị ở thanh bên; lỗi thì bỏ qua, không chặn trang.
  const quota = quotaRes?.ok ? ((await quotaRes.json().catch(() => null)) as Quota | null) : null;

  // Link hết hạn chưa có tính năng ở backend nên luôn là 0.
  const raw = countsRes?.ok ? ((await countsRes.json().catch(() => null)) as Partial<Counts> | null) : null;
  const counts: Counts = { active: raw?.active ?? 0, archived: raw?.archived ?? 0, expired: 0 };

  return (
    <AppShell me={me} quota={quota} counts={counts}>
      {children}
    </AppShell>
  );
}
