"use client";

import { Link2, Smartphone } from "lucide-react";

export type ShortenMode = "deeplink" | "normal";

export const MODE_PLACEHOLDER: Record<ShortenMode, string> = {
  deeplink: "Dán link TikTok Shop (vt.tiktok.com/… hoặc link sản phẩm, chiến dịch)",
  normal: "Dán đường dẫn bất kỳ (https://…)",
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
      key: "deeplink",
      title: "Deeplink TikTok Shop",
      note: "Mở thẳng ứng dụng TikTok",
      icon: <Smartphone className="w-4 h-4 text-tiktok-pink shrink-0" />,
      active: "border-tiktok-pink bg-tiktok-pink/10",
    },
    {
      key: "normal",
      title: "Link thường",
      note: "Chuyển hướng tới trang bất kỳ",
      icon: <Link2 className="w-4 h-4 text-tiktok-cyan shrink-0" />,
      active: "border-tiktok-cyan bg-tiktok-cyan/10",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Loại rút gọn">
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
