import Link from "next/link";
import type { ReactNode } from "react";

/** Trang giữ chỗ cho mục menu chưa làm xong: nói rõ sẽ có gì để người dùng không bị bất ngờ. */
export function ComingSoon({
  title,
  description,
  icon,
  features,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  features: string[];
}) {
  return (
    <>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        <p className="text-xs sm:text-sm text-zinc-400">{description}</p>
      </div>

      <div className="bg-[#141419] border border-zinc-800 rounded-2xl p-8 sm:p-12 text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-tiktok-cyan/10 border border-tiktok-cyan/30 text-tiktok-cyan flex items-center justify-center [&>svg]:w-7 [&>svg]:h-7">
          {icon}
        </div>
        <div className="space-y-1.5">
          <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-300">
            Sắp ra mắt
          </span>
          <h2 className="text-lg font-bold">Tính năng này đang được phát triển</h2>
        </div>
        <ul className="text-sm text-zinc-400 space-y-1.5 max-w-md mx-auto text-left list-disc pl-5">
          {features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <Link
          href="/dashboard"
          className="inline-block text-xs font-semibold px-4 py-2 rounded-xl bg-zinc-800 text-zinc-200 hover:bg-tiktok-cyan hover:text-black transition-colors"
        >
          ← Về bảng điều khiển
        </Link>
      </div>
    </>
  );
}
