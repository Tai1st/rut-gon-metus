"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PERIOD_VI, type Me, type Quota } from "@/lib/types";
import { QuickCreateModal } from "./QuickCreateModal";

const MeContext = createContext<Me | null>(null);
/** Người dùng đang đăng nhập (lấy từ server ở layout). */
export function useMe() {
  const me = useContext(MeContext);
  if (!me) throw new Error("useMe phải dùng bên trong AppShell");
  return me;
}

type NavItem = { href: string; label: string; icon: ReactNode };

const ic = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

const ICONS = {
  dashboard: ic(
    <>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
    </>,
  ),
  plans: ic(
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </>,
  ),
  domains: ic(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>,
  ),
  admin: ic(
    <>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
    </>,
  ),
  bulk: ic(
    <>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </>,
  ),
  inspect: ic(
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.5" y2="16.5" />
    </>,
  ),
  settings: ic(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>,
  ),
  home: ic(
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </>,
  ),
};

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-tiktok-cyan to-tiktok-pink p-[1.5px]">
        <div className="w-full h-full bg-[#141312] rounded-[6px] flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 17H7A5 5 0 0 1 7 7h2" />
            <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </div>
      </div>
      <span className="text-lg font-extrabold tracking-tight text-white">
        Rút gọn<span className="text-tiktok-pink"> link</span>
      </span>
    </div>
  );
}

/** Thẻ gói ở đáy thanh bên: gói đang dùng + thanh hạn mức (số liệu thật từ backend). */
function PlanCard({ quota }: { quota: Quota | null }) {
  if (!quota) return null;
  const unlimited = quota.limit === null;
  const pct = unlimited ? 100 : Math.min(100, Math.round((quota.used / Math.max(quota.limit ?? 1, 1)) * 100));
  return (
    <div className="p-3 border-t border-zinc-800/80">
      <div className="bg-zinc-900/90 rounded-xl p-3 border border-zinc-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400">Gói hiện tại</span>
          <span className="font-semibold text-tiktok-cyan truncate max-w-[110px]">{quota.plan.name}</span>
        </div>
        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-tiktok-cyan to-tiktok-pink h-full" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-[10px] text-zinc-500 flex justify-between gap-2">
          <span>
            {unlimited
              ? "Không giới hạn link"
              : `Đã dùng ${quota.used}/${quota.limit} link/${PERIOD_VI[quota.period]}`}
          </span>
          <Link href="/plans" className="text-tiktok-cyan hover:underline shrink-0">
            Nâng cấp
          </Link>
        </div>
      </div>
    </div>
  );
}

type NavGroup = { label?: string; items: NavItem[] };

function Sidebar({ groups, quota, onNavigate }: { groups: NavGroup[]; quota: Quota | null; onNavigate?: () => void }) {
  const path = usePathname();
  const renderItem = (it: NavItem) => {
    const active = path === it.href || path.startsWith(it.href + "/");
    return (
      <Link
        key={it.href}
        href={it.href}
        onClick={onNavigate}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          active ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"
        }`}
      >
        <span className={active ? "text-tiktok-pink" : ""}>{it.icon}</span>
        <span>{it.label}</span>
      </Link>
    );
  };
  return (
    <>
      <div className="h-16 px-6 flex items-center justify-between border-b border-zinc-800/80 shrink-0">
        <Link href="/" onClick={onNavigate}>
          <Brand />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <Link
          href="/"
          onClick={onNavigate}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          {ICONS.home}
          <span>Trang chủ</span>
        </Link>
        {groups.map((g, i) => (
          <div key={g.label ?? i} className="space-y-1">
            {g.label && (
              <div className="pt-5 pb-1.5 px-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{g.label}</span>
              </div>
            )}
            {g.items.map(renderItem)}
          </div>
        ))}
      </div>
      <PlanCard quota={quota} />
    </>
  );
}

export function AppShell({ me, quota, children }: { me: Me; quota: Quota | null; children: ReactNode }) {
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [quick, setQuick] = useState(false);

  // Ctrl+K (hoặc ⌘K) mở cửa sổ tạo link nhanh ở mọi trang trong khu vực quản lý.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuick(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const groups: NavGroup[] = [
    {
      items: [
        { href: "/dashboard", label: "Bảng điều khiển", icon: ICONS.dashboard },
        { href: "/plans", label: "Gói & thanh toán", icon: ICONS.plans },
        { href: "/domains", label: "Tên miền", icon: ICONS.domains },
      ],
    },
    {
      label: "Công cụ",
      items: [
        { href: "/bulk", label: "Rút gọn hàng loạt", icon: ICONS.bulk },
        { href: "/inspector", label: "Kiểm tra deeplink", icon: ICONS.inspect },
      ],
    },
    { label: "Tài khoản", items: [{ href: "/settings", label: "Cài đặt tài khoản", icon: ICONS.settings }] },
    ...(me.role === "admin"
      ? [{ label: "Hệ thống", items: [{ href: "/admin", label: "Quản trị", icon: ICONS.admin }] }]
      : []),
  ];
  const display = me.fullName || me.username;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  return (
    <MeContext.Provider value={me}>
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#0B0B0E] text-slate-100">
        {/* Thanh bên (desktop) */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#141312] text-slate-300 border-r border-zinc-800/90 z-40 select-none">
          <Sidebar groups={groups} quota={quota} />
        </aside>

        {/* Ngăn kéo (điện thoại) */}
        {drawer && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="w-64 flex flex-col bg-[#141312] border-r border-zinc-800/90">
              <Sidebar groups={groups} quota={quota} onNavigate={() => setDrawer(false)} />
            </div>
            <div className="flex-1 bg-black/60" onClick={() => setDrawer(false)} />
          </div>
        )}

        <div className="flex-1 lg:pl-64 flex flex-col min-h-screen bg-plus-pattern">
          {/* Thanh trên */}
          <header className="sticky top-0 z-30 h-16 bg-[#111115]/85 backdrop-blur-md border-b border-zinc-800/90 px-4 sm:px-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 lg:hidden">
              <button onClick={() => setDrawer(true)} className="p-2 rounded-xl bg-zinc-800 text-zinc-200" aria-label="Mở menu">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              </button>
              <span className="font-extrabold text-base tracking-tight text-white">
                Rút gọn<span className="text-tiktok-pink"> link</span>
              </span>
            </div>

            <div className="flex-1 max-w-md hidden sm:block">
              <button
                onClick={() => setQuick(true)}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-full bg-zinc-900 border border-zinc-800 hover:border-tiktok-pink/50 text-zinc-400 text-sm transition-all shadow-sm"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="text-tiktok-pink">⚡</span>
                  <span>Tạo link nhanh…</span>
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-zinc-400">
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">CTRL</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">K</kbd>
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-4">
              <Link
                href="/plans"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
              >
                <span>♛</span>
                <span>Nâng cấp</span>
              </Link>

              <div className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center overflow-hidden">
                  <svg viewBox="0 0 36 36" className="w-full h-full">
                    <rect width="36" height="36" fill="#6ee7b7" />
                    <polygon points="18,4 32,18 18,32 4,18" fill="#a7f3d0" />
                    <circle cx="18" cy="18" r="6" fill="#34d399" />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-zinc-200 max-w-[110px] truncate">{display}</span>
                {me.role === "admin" && (
                  <span className="hidden sm:inline text-[10px] font-semibold px-1.5 py-0.5 rounded bg-tiktok-cyan/15 text-tiktok-cyan">Admin</span>
                )}
              </div>
              <button onClick={logout} className="text-xs font-semibold text-zinc-400 hover:text-tiktok-pink transition-colors">
                Đăng xuất
              </button>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-10 max-w-7xl w-full mx-auto space-y-6">{children}</main>
        </div>
      </div>
      {quick && <QuickCreateModal onClose={() => setQuick(false)} />}
    </MeContext.Provider>
  );
}
