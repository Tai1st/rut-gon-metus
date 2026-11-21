"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Me } from "@/lib/types";
import { Badge } from "./ui";

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
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
        <nav className="flex overflow-x-auto">
          {tabs.map((t) => {
            const active = path === t.href || path.startsWith(t.href + "/");
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`py-3 px-3 text-xs font-medium whitespace-nowrap transition-colors ${
                  active ? "text-blue-600 border-b-2 border-blue-600 -mb-px" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2 pl-3 flex-shrink-0">
          <span className="text-xs text-gray-600">{me.username}</span>
          {me.role === "admin" && <Badge tone="blue">Admin</Badge>}
          <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600">
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}
