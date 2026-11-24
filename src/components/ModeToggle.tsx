"use client";

import { Link2, ShoppingBag } from "lucide-react";
import { SHOPEE_UI } from "@/lib/features";

/** Logo TikTok (lucide không có biểu tượng thương hiệu nên vẽ trực tiếp bằng SVG). */
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

export type ShortenMode = "deeplink" | "normal" | "shopee";

export const MODE_PLACEHOLDER: Record<ShortenMode, string> = {
  deeplink: "Dán link TikTok Shop (vt.tiktok.com/… hoặc link sản phẩm, chiến dịch)",
  normal: "Dán đường dẫn bất kỳ (https://…)",
  shopee: "Dán link Shopee (s.shopee.vn/… hoặc link sản phẩm shopee.vn)",
};

/** Chọn loại rút gọn: Deeplink TikTok Shop (mở thẳng app) hoặc Link thường (chuyển hướng tới trang bất kỳ). */
export function ModeToggle({
  value,
  onChange,
  disabled,
}: {
  value: ShortenMode;
  onChange: (m: ShortenMode) => void;
  disabled?: boolean;
}) {
  const opts: { key: ShortenMode; title: string; note: string; icon: React.ReactNode; active: string }[] = [
    {
      key: "normal",
      title: "Link thường",
      note: "Chuyển hướng tới trang bất kỳ",
      icon: <Link2 className="w-4 h-4 text-tiktok-cyan shrink-0" />,
      active: "border-tiktok-cyan bg-tiktok-cyan/10",
    },
    ...(SHOPEE_UI ? [{
      key: "shopee" as const,
      title: "Deeplink Shopee",
      note: "Mở thẳng ứng dụng Shopee",
      icon: (
        <span className="w-[28px] h-[28px] rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
          <ShoppingBag className="w-4 h-4 text-white" />
        </span>
      ),
      active: "border-orange-500 bg-orange-500/10",
    }] : []),
    {
      key: "deeplink",
      title: "Deeplink TikTok Shop",
      note: "Mở thẳng ứng dụng TikTok",
      icon: <span className="p-[1.5px] rounded-lg bg-gradient-to-br from-tiktok-pink to-tiktok-cyan shrink-0">
          <span className="w-[25px] h-[25px] rounded-[6.5px] bg-black flex items-center justify-center">
            <TikTokIcon className="w-[14px] h-[14px] text-white tiktok-shake" />
          </span>
        </span>,
      active: "border-tiktok-pink bg-tiktok-pink/10",
    },
  ];
  return (
    <div className={`grid grid-cols-1 ${SHOPEE_UI ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-2.5`} role="radiogroup" aria-label="Loại rút gọn">
      {opts.map((o) => (
        <button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={value === o.key}
          disabled={disabled}
          onClick={() => onChange(o.key)}
          className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 disabled:opacity-50 ${
            value === o.key ? o.active : "border-zinc-800 bg-black/40 hover:border-zinc-700"
          }`}
        >
          {o.icon}
          <div className="overflow-hidden">
            <div className="text-xs font-semibold text-white truncate">{o.title}</div>
            <div className="text-[10px] text-zinc-400 truncate">{o.note}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
