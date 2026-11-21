import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { beFetch } from "@/lib/be";
import { SESSION_COOKIE } from "@/lib/config";
import type { Me } from "@/lib/types";

// Khu vực cần đăng nhập: kiểm tra phiên ở server trước khi render.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");

  const res = await beFetch("/auth/me", { token }).catch(() => null);
  if (!res || !res.ok) redirect("/login");
  const me = (await res.json()) as Me;
  if (me.role !== "admin" && me.role !== "user") redirect("/login");

  return (
    <>
      <AppNav me={me} />
      <main className="max-w-5xl w-full mx-auto p-4 space-y-4">{children}</main>
    </>
  );
}
