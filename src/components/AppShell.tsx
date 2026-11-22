"use client";

import Link from "next/link";
import { Suspense, createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  BarChart2,
  CalendarX,
  ChevronDown,
  CreditCard,
  Crown,
  FolderKanban,
  GitFork,
  Layers,
  Link as LinkIcon,
  Link2,
  LogOut,
  Menu,
  Smartphone,
  QrCode,
  ScanSearch,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  User,
  X,
  Zap,
} from "lucide-react";
import { PERIOD_VI, type Me, type Quota } from "@/lib/types";
import { QuickCreateModal } from "./QuickCreateModal";

const MeContext = createContext<Me | null>(null);
/** Người dùng đang đăng nhập (lấy từ server ở layout). */
export function useMe() {
  const me = useContext(MeContext);
  if (!me) throw new Error("useMe phải dùng bên trong AppShell");
  return me;
}

export type Counts = { active: number; archived: number; expired: number };

const ITEM =
  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-zinc-400 hover:text-white hover:bg-white/5";
const ACTIVE = "bg-white/10 text-white font-semibold";
const SUB =
  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-zinc-400 hover:text-white hover:bg-white/5";

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-tiktok-cyan to-tiktok-pink p-[1.5px]">
        <div className="w-full h-full bg-[#141312] rounded-[6px] flex items-center justify-center">
          <Link2 className="w-4 h-4 text-white" />
        </div>
      </div>
      <span className="text-lg font-extrabold tracking-tight text-white">
        Metus<span className="text-tiktok-pink"> Link</span>
      </span>
    </div>
  );
}

function CountBadge({ n, tone = "default" }: { n: number; tone?: "default" | "muted" }) {
  return (
    <span
      className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
        tone === "muted" ? "bg-zinc-800/60 text-zinc-400" : "bg-zinc-800 text-zinc-300"
      }`}
    >
      {n}
    </span>
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
          <span className="flex items-center gap-1 text-emerald-400 font-semibold truncate max-w-[120px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {quota.plan.name}
          </span>
        </div>
        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-tiktok-cyan to-tiktok-pink h-full" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-[10px] text-zinc-500 flex justify-between gap-2">
          <span className={quota.disabled ? "text-red-400" : ""}>
            {quota.disabled
              ? "Gói miễn phí đã tắt"
              : unlimited
                ? "Không giới hạn link"
                : `Đã dùng ${quota.used}/${quota.limit} deeplink/${PERIOD_VI[quota.period]}`}
          </span>
          <Link href="/plans" className="text-tiktok-cyan hover:underline shrink-0">
            Nâng cấp
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Nội dung thanh bên, dùng chung cho desktop và ngăn kéo trên điện thoại. */
function SidebarBody({ me, quota, counts, onNavigate }: { me: Me; quota: Quota | null; counts: Counts; onNavigate?: () => void }) {
  const path = usePathname();
  const tab = useSearchParams().get("tab");
  const inTools = ["/bio", "/bulk", "/qr", "/inspector"].some((p) => path.startsWith(p));
  const [tools, setTools] = useState(true);

  const onDashboard = path === "/dashboard";
  const isActive = {
    dashboard: onDashboard && !tab,
    links: onDashboard && tab === "active",
    archived: onDashboard && tab === "archived",
    analytics: path.startsWith("/analytics"),
    expired: path.startsWith("/expired"),
    integrations: path.startsWith("/integrations"),
    settings: path.startsWith("/settings"),
    admin: path.startsWith("/admin"),
  };
  const cls = (on: boolean, extra = "") => `${ITEM} ${on ? ACTIVE : ""} ${extra}`;

  return (
    <>
      <div className="h-16 px-6 flex items-center justify-between border-b border-zinc-800/80 shrink-0">
        <Link href="/" onClick={onNavigate}>
          <Brand />
        </Link>
        {quota && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-tiktok-cyan/15 text-tiktok-cyan border border-tiktok-cyan/30 uppercase truncate max-w-[72px]">
            {quota.plan.code}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <Link href="/dashboard" onClick={onNavigate} className={cls(isActive.dashboard)}>
          <SlidersHorizontal className="w-4 h-4 shrink-0" />
          <span>Bảng điều khiển</span>
        </Link>

        <Link href="/analytics" onClick={onNavigate} className={cls(isActive.analytics)}>
          <BarChart2 className="w-4 h-4 shrink-0" />
          <span>Thống kê</span>
        </Link>

        <div className="pt-5 pb-1.5 px-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Quản lý liên kết</span>
        </div>

        <Link href="/dashboard?tab=active#danh-sach" onClick={onNavigate} className={cls(isActive.links, "justify-between")}>
          <div className="flex items-center gap-3">
            <LinkIcon className="w-4 h-4 shrink-0" />
            <span>Liên kết</span>
          </div>
          <CountBadge n={counts.active} />
        </Link>
        <Link href="/dashboard?tab=archived#danh-sach" onClick={onNavigate} className={cls(isActive.archived, "justify-between")}>
          <div className="flex items-center gap-3">
            <Archive className="w-4 h-4 shrink-0" />
            <span>Liên kết đã lưu trữ</span>
          </div>
          <CountBadge n={counts.archived} tone="muted" />
        </Link>
        <Link href="/expired" onClick={onNavigate} className={cls(isActive.expired, "justify-between")}>
          <div className="flex items-center gap-3">
            <CalendarX className="w-4 h-4 shrink-0" />
            <span>Liên kết đã hết hạn</span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">{counts.expired}</span>
        </Link>
        <Link href="/integrations" onClick={onNavigate} className={cls(isActive.integrations)}>
          <GitFork className="w-4 h-4 shrink-0" />
          <span>Tích hợp</span>
        </Link>

        {/* Công cụ (menu xổ xuống) */}
        <div>
          <button onClick={() => setTools((v) => !v)} className={`${ITEM} justify-between ${inTools ? "text-white" : ""}`}>
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Công cụ</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${tools ? "" : "-rotate-90"}`} />
          </button>
          {tools && (
            <div className="mt-1 pl-7 pr-1 space-y-1">
              {[
                { href: "/bio", label: "Tạo trang Bio Link", icon: <Smartphone className="w-3.5 h-3.5 text-tiktok-cyan" /> },
                { href: "/bulk", label: "Rút gọn hàng loạt", icon: <Layers className="w-3.5 h-3.5 text-tiktok-pink" /> },
                { href: "/qr", label: "Tạo mã QR tùy chỉnh", icon: <QrCode className="w-3.5 h-3.5 text-emerald-400" /> },
                { href: "/inspector", label: "Kiểm tra Deep Link", icon: <ScanSearch className="w-3.5 h-3.5 text-purple-400" /> },
              ].map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  onClick={onNavigate}
                  className={`${SUB} ${path.startsWith(t.href) ? "bg-white/10 text-white font-semibold" : ""}`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="pt-5 pb-1.5 px-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Tài khoản</span>
        </div>
        <Link href="/settings" onClick={onNavigate} className={cls(isActive.settings)}>
          <Settings className="w-4 h-4 shrink-0" />
          <span>Cài đặt tài khoản</span>
        </Link>
        {me.role === "admin" && (
          <Link href="/admin" onClick={onNavigate} className={cls(isActive.admin)}>
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Quản trị</span>
          </Link>
        )}
      </div>

      <PlanCard quota={quota} />
    </>
  );
}

/** Thanh điều hướng dưới cùng trên điện thoại (Tạo link, Liên kết, Tài khoản). */
function BottomNav({ onCreate }: { onCreate: () => void }) {
  const path = usePathname();
  const tab = useSearchParams().get("tab");
  const item = (on: boolean) =>
    `flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl ${on ? "text-tiktok-pink" : "text-zinc-400"}`;
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#14141A]/95 backdrop-blur-lg border-t border-zinc-800 px-2 py-1.5 flex items-center justify-around">
      <button onClick={onCreate} className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-zinc-400 hover:text-white">
        <Link2 className="w-5 h-5 text-tiktok-cyan" />
        <span className="text-[10px] font-medium">Tạo link</span>
      </button>
      <Link href="/dashboard?tab=active#danh-sach" className={item(path === "/dashboard")}>
        <FolderKanban className="w-5 h-5" />
        <span className="text-[10px] font-medium">{tab === "archived" ? "Lưu trữ" : "Liên kết"}</span>
      </Link>
      <Link href="/settings" className={item(path.startsWith("/settings"))}>
        <User className="w-5 h-5" />
        <span className="text-[10px] font-medium">Tài khoản</span>
      </Link>
    </nav>
  );
}

/** Nút hồ sơ ở thanh trên: avatar + tên + mũi tên; bấm mở menu tài khoản (giống bản mẫu, thêm Đăng xuất). */
function ProfileMenu({ me, display, plan, onLogout }: { me: Me; display: string; plan?: string; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  // Đóng khi bấm ra ngoài, nhấn Esc, hoặc chuyển trang.
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const row = "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl hover:bg-zinc-800/80 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 36 36" className="w-full h-full">
            <rect width="36" height="36" fill="#6ee7b7" />
            <polygon points="18,4 32,18 18,32 4,18" fill="#a7f3d0" />
            <circle cx="18" cy="18" r="6" fill="#34d399" />
          </svg>
        </div>
        <span className="text-xs sm:text-sm font-semibold text-zinc-200 max-w-[110px] truncate">{display}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 bg-[#16161C] border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 p-2 z-50"
        >
          <div className="px-3 py-2.5 border-b border-zinc-800 mb-1 space-y-1">
            <div className="text-sm font-bold text-white truncate">{display}</div>
            <div className="text-[11px] font-mono text-zinc-500 truncate">@{me.username}</div>
            <div className="flex items-center gap-1.5 pt-1">
              {me.role === "admin" && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-tiktok-cyan/15 text-tiktok-cyan">Admin</span>
              )}
              {plan && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-tiktok-pink/15 text-tiktok-pink uppercase">
                  Gói {plan}
                </span>
              )}
            </div>
          </div>
          <Link href="/settings" role="menuitem" className={row}>
            <Settings className="w-4 h-4" />
            <span>Cài đặt tài khoản</span>
          </Link>
          <Link href="/plans" role="menuitem" className={row}>
            <CreditCard className="w-4 h-4" />
            <span>Gói & thanh toán</span>
          </Link>
          {me.role === "admin" && (
            <Link href="/admin" role="menuitem" className={row}>
              <ShieldCheck className="w-4 h-4" />
              <span>Quản trị</span>
            </Link>
          )}
          <div className="border-t border-zinc-800 mt-1 pt-1">
            <button onClick={onLogout} role="menuitem" className={`${row} hover:text-tiktok-pink`}>
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AppShell({ me, quota, counts, children }: { me: Me; quota: Quota | null; counts: Counts; children: ReactNode }) {
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
          <Suspense fallback={null}>
            <SidebarBody me={me} quota={quota} counts={counts} />
          </Suspense>
        </aside>

        {/* Ngăn kéo menu (điện thoại) */}
        {drawer && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div onClick={() => setDrawer(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="relative w-72 max-w-[80vw] h-full bg-[#141312] text-zinc-300 flex flex-col overflow-y-auto">
              <button
                onClick={() => setDrawer(false)}
                className="absolute top-4 right-3 z-10 p-1.5 rounded-lg bg-zinc-800 text-zinc-400"
                aria-label="Đóng menu"
              >
                <X className="w-4 h-4" />
              </button>
              <Suspense fallback={null}>
                <SidebarBody me={me} quota={quota} counts={counts} onNavigate={() => setDrawer(false)} />
              </Suspense>
            </div>
          </div>
        )}

        <div className="flex-1 lg:pl-64 flex flex-col min-h-screen bg-plus-pattern">
          {/* Thanh trên */}
          <header className="sticky top-0 z-30 h-16 bg-[#111115]/85 backdrop-blur-md border-b border-zinc-800/90 px-4 sm:px-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 lg:hidden">
              <button onClick={() => setDrawer(true)} className="p-2 rounded-xl bg-zinc-800 text-zinc-200" aria-label="Mở menu">
                <Menu className="w-5 h-5" />
              </button>
              <Link href="/" className="font-extrabold text-base tracking-tight text-white" aria-label="Về trang chủ">
                Metus<span className="text-tiktok-pink"> Link</span>
              </Link>
            </div>

            <div className="flex-1 max-w-md hidden sm:block">
              <button
                onClick={() => setQuick(true)}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-full bg-zinc-900 border border-zinc-800 hover:border-tiktok-pink/50 text-zinc-400 text-xs sm:text-sm transition-all shadow-sm"
              >
                <span className="flex items-center gap-2 truncate">
                  <Zap className="w-3.5 h-3.5 text-tiktok-pink shrink-0" />
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
                <Crown className="w-3.5 h-3.5" />
                <span>Nâng cấp</span>
              </Link>

              <ProfileMenu me={me} display={display} plan={quota?.plan.name} onLogout={logout} />
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-10 max-w-7xl w-full mx-auto space-y-6">{children}</main>
        </div>
      </div>

      <Suspense fallback={null}>
        <BottomNav onCreate={() => setQuick(true)} />
      </Suspense>
      {quick && <QuickCreateModal onClose={() => setQuick(false)} />}
    </MeContext.Provider>
  );
}
