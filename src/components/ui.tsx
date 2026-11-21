"use client";

import type { ReactNode } from "react";

/** Thành phần giao diện dùng chung theo style tham chiếu: nền tối, thẻ kính mờ, nhấn hồng/cyan. */

export const inputCls =
  "w-full bg-zinc-900 border border-zinc-700 focus:border-tiktok-cyan rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-all disabled:opacity-50";

export const btnPrimary =
  "tiktok-glow-btn text-white font-bold py-2.5 px-5 rounded-xl text-sm inline-flex items-center justify-center gap-2";

export const btnGhost =
  "px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-200 hover:bg-tiktok-cyan hover:text-black transition-colors disabled:opacity-40";

export const btnDanger = "text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-40";

/** Ánh sáng nền (ambient glow) + lưới công nghiệp phía sau trang. */
export function Ambient() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 tech-grid-bg">
      <div className="absolute -top-36 -left-36 w-[420px] h-[420px] bg-tiktok-cyan/10 rounded-full blur-[130px]" />
      <div className="absolute top-1/4 -right-36 w-[420px] h-[420px] bg-tiktok-pink/10 rounded-full blur-[130px]" />
    </div>
  );
}

export function Card({ title, right, children }: { title?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-[#141419] border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4">
      {title && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-base font-bold text-white">{title}</h2>
          {right}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="block text-xs font-medium text-zinc-400 mb-1.5">{children}</label>;
}

const BADGE = {
  green: "text-emerald-400 bg-emerald-500/15",
  blue: "text-tiktok-cyan bg-tiktok-cyan/15",
  amber: "text-amber-300 bg-amber-500/15",
  gray: "text-zinc-400 bg-zinc-800",
  red: "text-red-400 bg-red-500/15",
  pink: "text-tiktok-pink bg-tiktok-pink/15",
} as const;

export function Badge({ tone = "gray", children }: { tone?: keyof typeof BADGE; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold rounded px-2 py-0.5 ${BADGE[tone]}`}>
      {children}
    </span>
  );
}

export function ErrorBox({ message }: { message: string }) {
  if (!message) return null;
  return <div className="text-xs bg-red-500/10 p-2.5 rounded-xl border border-red-500/30 text-red-300">{message}</div>;
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#141419] border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none">
            ×
          </button>
        </div>
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}

/** Logo: ô vuông đen có viền, icon liên kết, chữ ghép hồng/cyan. */
export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const box = size === "lg" ? "w-11 h-11 rounded-2xl" : "w-9 h-9 rounded-xl";
  const text = size === "lg" ? "text-2xl" : "text-lg sm:text-xl";
  return (
    <div className="flex items-center gap-2.5 group">
      <div
        className={`${box} bg-black border border-tiktok-border flex items-center justify-center relative overflow-hidden shadow-md group-hover:border-tiktok-cyan transition-colors`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-tiktok-cyan/25 to-tiktok-pink/25" />
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 text-white relative z-10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 17H7A5 5 0 0 1 7 7h2" />
          <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      </div>
      <span className={`${text} font-black tracking-tight text-white leading-none`}>
        Metus<span className="text-tiktok-pink"> Link</span>
      </span>
    </div>
  );
}
