import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { Ambient } from "@/components/ui";
import { beFetch } from "@/lib/be";
import { SESSION_COOKIE } from "@/lib/config";
import type { Me } from "@/lib/types";

// Khu vực cần đăng nhập: kiểm tra phiên ở server trước khi render.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");

  const res = await beFetch("/link-auth/me", { token }).catch(() => null);
  if (!res || !res.ok) redirect("/login");
  const me = (await res.json().catch(() => null)) as Me | null;
  if (!me?.id) redirect("/login");

  return (
    <div className="flex-1 flex flex-col tech-grid-bg">
      <Ambient />
      <AppNav me={me} />
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">{children}</main>
    </div>
  );
}
