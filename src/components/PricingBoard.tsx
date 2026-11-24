"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { Award, Check, Crown, Flame, Gem, Send, Sparkles, X } from "lucide-react";

/** Gói ở dạng đủ để hiển thị (dùng chung cho trang chủ công khai và trang /plans đã đăng nhập). */
export type BoardPlan = {
  code: string;
  name: string;
  description: string;
  limit: number;
  period: "day" | "week" | "month";
  prices: { months: number; price: number }[];
  maxCustomDomains: number;
  isRecommended?: boolean;
};

type Props = {
  plans: BoardPlan[];
  /** Mã gói người dùng đang dùng (chỉ ở trang /plans). */
  currentCode?: string | null;
  /** Gói free đã bị admin tắt (không còn "đang dùng" gói free). */
  freeDisabled?: boolean;
  /** landing: nút dẫn tới đăng ký/đăng nhập; app: nút gọi onUpgrade. */
  mode: "landing" | "app";
  loggedIn?: boolean;
  onUpgrade?: (plan: BoardPlan, months: number) => void;
};

const PERIOD_VI = { day: "ngày", week: "tuần", month: "tháng" } as const;
export const vnd = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

/** 1 -> "01 tháng", 12 -> "01 năm", 24 -> "02 năm". */
export function cycleLabel(m: number) {
  if (m % 12 === 0) return `${String(m / 12).padStart(2, "0")} năm`;
  return `${String(m).padStart(2, "0")} tháng`;
}
/** Đơn vị ngắn sau giá: "/tháng", "/năm", "/3 tháng". */
function cycleUnit(m: number) {
  if (m === 1) return "tháng";
  if (m === 12) return "năm";
  if (m % 12 === 0) return `${m / 12} năm`;
  return `${m} tháng`;
}

const priceAt = (p: BoardPlan, m: number) => p.prices.find((x) => x.months === m)?.price;

function savingPct(p: BoardPlan, m: number) {
  const base = priceAt(p, 1);
  const price = priceAt(p, m);
  if (!base || !price || m <= 1) return 0;
  return Math.max(0, Math.round((1 - price / (base * m)) * 100));
}

const ICONS = [Award, Gem, Crown, Sparkles, Flame];
const GRAD = "url(#plan-grad)";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className="font-semibold text-zinc-100 text-right">{children}</span>
    </div>
  );
}
/** Link tạo bằng gói Free hết hạn sau số ngày này (khớp LINKS_FREE_LINK_DAYS của backend, mặc định 3). */
const FREE_LINK_DAYS = 3;

const Yes = () => <Check className="w-4 h-4 text-emerald-400 inline" />;
const No = () => <X className="w-4 h-4 text-red-400 inline" />;

export function PricingBoard({ plans, currentCode, freeDisabled, mode, loggedIn, onUpgrade }: Props) {
  const free = plans.find((p) => p.code === "free");
  const paid = useMemo(() => plans.filter((p) => p.code !== "free"), [plans]);
  const cycles = useMemo(() => [...new Set(paid.flatMap((p) => p.prices.map((x) => x.months)))].sort((a, b) => a - b), [paid]);
  const [sel, setSel] = useState<number | null>(null);
  const cycle = sel && cycles.includes(sel) ? sel : (cycles[0] ?? null);
  const bestSaving = (m: number) => Math.max(0, ...paid.map((p) => savingPct(p, m)));

  const freeDeeplink = !freeDisabled && (free?.limit ?? 0) > 0;
  const freeIsCurrent = currentCode === "free" && !freeDisabled;
  const cols = Math.min(Math.max(paid.length, 1), 4);

  function freeCta() {
    if (mode === "app") {
      return (
        <button disabled className="px-6 py-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold text-sm cursor-default">
          {freeIsCurrent ? "✓ Đang sử dụng" : "Gói mặc định"}
        </button>
      );
    }
    return (
      <Link href={loggedIn ? "/dashboard" : "/register"} className="px-6 py-3 rounded-xl tiktok-glow-btn text-white font-bold text-sm text-center">
        Bắt đầu miễn phí
      </Link>
    );
  }

  function paidCta(p: BoardPlan) {
    const isCurrent = currentCode === p.code;
    const price = cycle ? priceAt(p, cycle) : undefined;
    const sellable = !!price && !!cycle;
    const base = "w-full text-center py-3 rounded-xl font-bold text-sm transition-all";

    if (mode === "app") {
      if (!sellable)
        return (
          <button disabled className={`${base} bg-zinc-800 text-zinc-400 cursor-default`}>
            {p.prices.length === 0 ? "Liên hệ quản trị viên" : "Không bán theo chu kỳ này"}
          </button>
        );
      if (isCurrent)
        return (
          <button type="button" onClick={() => onUpgrade?.(p, cycle!)} className={`${base} bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25`}>
            ✓ Đang sử dụng · Gia hạn
          </button>
        );
      return (
        <button type="button" onClick={() => onUpgrade?.(p, cycle!)} className={`${base} tiktok-glow-btn text-white`}>
          Nâng cấp {p.name}
        </button>
      );
    }

    // Trang chủ công khai
    const href = loggedIn ? "/plans" : "/register";
    return (
      <Link href={href} className={`${base} ${sellable ? "tiktok-glow-btn text-white" : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"}`}>
        {sellable ? (loggedIn ? `Nâng cấp ${p.name}` : "Đăng ký để nâng cấp") : "Đăng ký để liên hệ"}
      </Link>
    );
  }

  return (
    <div className="space-y-8">
      {/* Bảng màu gradient dùng chung cho icon (hồng -> cyan) */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <linearGradient id="plan-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fe2c55" />
            <stop offset="100%" stopColor="#25f4ee" />
          </linearGradient>
        </defs>
      </svg>

      {/* Bộ chọn chu kỳ */}
      {cycles.length > 0 && (
        <div className="flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-1 p-1.5 rounded-full bg-[#16161D] border border-zinc-800 shadow-lg shadow-black/40 select-none">
            {cycles.map((m) => {
              const on = m === cycle;
              const pct = bestSaving(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSel(m)}
                  className={`px-5 sm:px-8 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                    on ? "bg-tiktok-pink text-white shadow-md" : "text-zinc-300 hover:text-white"
                  }`}
                >
                  <span>{cycleLabel(m)}</span>
                  {pct > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white">-{pct}%</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Hàng gói miễn phí (nằm ngang, toàn chiều rộng) */}
      {free && (
        <div
          className={`rounded-2xl border p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8 bg-tiktok-cyan/5 ${
            freeIsCurrent ? "border-emerald-500/60" : "border-tiktok-cyan/20"
          }`}
        >
          <div className="flex items-center gap-4 lg:w-64 shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-tiktok-pink to-tiktok-cyan flex items-center justify-center shrink-0">
              <Send className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xl font-extrabold">{free.name}</div>
              <div className="text-xs font-bold text-tiktok-cyan">Miễn phí</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-2 flex-1 text-xs">
            <div className="space-y-2">
              <div>
                <strong className="text-white">{freeDisabled ? 0 : free.limit}</strong>{" "}
                <span className="text-zinc-400">deeplink TikTok / {PERIOD_VI[free.period]}</span>
              </div>
              <div>
                <strong className="text-white">{free.maxCustomDomains > 0 ? free.maxCustomDomains : "—"}</strong>{" "}
                <span className="text-zinc-400">tên miền riêng</span>
              </div>
              <div>
                <strong className="text-white">{FREE_LINK_DAYS} ngày</strong>{" "}
                <span className="text-zinc-400">thời hạn mỗi link</span>
              </div>
            </div>
            <div className="space-y-2 text-zinc-300">
              {/* Hạn mức deeplink bằng 0 thì gói không có tính năng deeplink TikTok. */}
              <div className={`flex items-center gap-1.5 ${freeDeeplink ? "" : "text-zinc-500"}`}>
                {freeDeeplink ? <Yes /> : <No />} Link sản phẩm và chiến dịch
              </div>
              <div className={`flex items-center gap-1.5 ${freeDeeplink ? "" : "text-zinc-500"}`}>
                {freeDeeplink ? <Yes /> : <No />} Link TikTok mở thẳng app
              </div>
            </div>
            <div className="space-y-2 text-zinc-300">
              <div className="flex items-center gap-1.5">
                <Yes /> Dùng tên miền hệ thống
              </div>
              <div className="flex items-center gap-1.5 text-zinc-500">
                <No /> Thanh toán / gia hạn
              </div>
            </div>
          </div>

          <div className="lg:ml-auto shrink-0">{freeCta()}</div>
        </div>
      )}

      {freeDisabled && mode === "app" && (
        <p className="text-xs text-red-400 text-center">Gói miễn phí hiện đã tắt, bạn cần mua một gói bên dưới để tạo link mới.</p>
      )}

      {/* Các gói trả phí */}
      {paid.length > 0 ? (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 ${
            cols >= 4 ? "lg:grid-cols-4" : cols === 3 ? "lg:grid-cols-3" : cols === 2 ? "lg:grid-cols-2 max-w-3xl mx-auto w-full" : "max-w-md mx-auto w-full"
          }`}
        >
          {paid.map((p, i) => {
            const Icon = ICONS[i % ICONS.length];
            const price = cycle ? priceAt(p, cycle) : undefined;
            const pct = cycle ? savingPct(p, cycle) : 0;
            const isCurrent = currentCode === p.code;
            return (
              <div
                key={p.code}
                className={`relative bg-[#141419] rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-5 transition-all ${
                  isCurrent
                    ? "border-2 border-emerald-500/60"
                    : p.isRecommended
                      ? "border-2 border-tiktok-cyan shadow-xl shadow-tiktok-cyan/10"
                      : "border border-zinc-800 hover:border-zinc-600"
                }`}
              >
                {(p.isRecommended || isCurrent) && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                      isCurrent ? "bg-emerald-500 text-black" : "bg-tiktok-cyan text-black"
                    }`}
                  >
                    {isCurrent ? "Đang sử dụng" : "Khuyên chọn"}
                  </span>
                )}

                <div className="space-y-4">
                  <div className="flex justify-center pt-1">
                    <Icon className="w-12 h-12" stroke={GRAD} strokeWidth={1.6} />
                  </div>
                  <h3 className="text-center text-2xl font-extrabold">{p.name}</h3>

                  <div className="text-center">
                    {price ? (
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-black bg-gradient-to-r from-tiktok-pink to-tiktok-cyan bg-clip-text text-transparent">{vnd(price)}</span>
                        <span className="text-sm font-bold text-tiktok-cyan">/{cycleUnit(cycle!)}</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-black text-zinc-300">{p.prices.length === 0 ? "Liên hệ" : "Không bán kỳ này"}</div>
                    )}
                    <div className="h-5 mt-1 text-xs font-semibold text-emerald-400">
                      {pct > 0 ? `Tiết kiệm ${pct}% khi thanh toán theo ${cycle === 12 ? "năm" : cycleLabel(cycle!)}` : ""}
                    </div>
                  </div>

                  {p.description && <p className="text-center text-xs text-zinc-500">{p.description}</p>}

                  <div className="divide-y divide-zinc-800/80">
                    <Row label="Deeplink TikTok Shop">
                      {p.limit}/{PERIOD_VI[p.period]}
                    </Row>
                    <Row label="Link rút gọn thường">Không giới hạn</Row>
                    <Row label="Thời hạn link">Không giới hạn</Row>
                    <Row label="Tên miền riêng">{p.maxCustomDomains > 0 ? p.maxCustomDomains : <No />}</Row>
                    <Row label="Link sản phẩm & chiến dịch">{p.limit > 0 ? <Yes /> : <No />}</Row>
                    <Row label="Link TikTok mở thẳng app">{p.limit > 0 ? <Yes /> : <No />}</Row>
                    <Row label="Thanh toán QR, tự kích hoạt">
                      <Yes />
                    </Row>
                  </div>
                </div>

                <div>{paidCta(p)}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-sm text-zinc-500">Hiện chưa có gói trả phí nào được mở bán.</p>
      )}
    </div>
  );
}
