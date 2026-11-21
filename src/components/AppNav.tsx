"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Me } from "@/lib/types";
import { Badge, Logo } from "./ui";

const TABS = [
  { href: "/dashboard", label: "Tạo link" },
  { href: "/plans", label: "Gói & thanh toán" },
  { href: "/domains", label: "Tên miền" },
];

export function AppNav({ me }: { me: Me }) {
  const path = usePathname();
  const router = useRouter();
  const tabs = me.role === "admin" ? [...TABS, { href: "/admin", label: "Quản trị" }] : TABS;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 bg-tiktok-surface/90 backdrop-blur-md border-b border-tiktok-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex-shrink-0">
          <Logo />
        </Link>

        <nav className="hidden md:flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-tiktok-border">
          {tabs.map((t) => {
            const active = path === t.href || path.startsWith(t.href + "/");
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  active
                    ? "bg-tiktok-card text-white border border-tiktok-border shadow-sm"
                    : "text-slate-400 hover:text-white border border-transparent"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-tiktok-card border border-tiktok-border text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 max-w-[120px] truncate">{me.fullName || me.username}</span>
          </div>
          {me.role === "admin" && <Badge tone="blue">Admin</Badge>}
          <button
            onClick={logout}
            className="text-xs font-semibold text-slate-400 hover:text-tiktok-pink transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Điều hướng trên điện thoại */}
      <nav className="md:hidden flex overflow-x-auto gap-1 px-3 pb-2">
        {tabs.map((t) => {
          const active = path === t.href || path.startsWith(t.href + "/");
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                active ? "bg-tiktok-card text-white border border-tiktok-border" : "text-slate-400"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
