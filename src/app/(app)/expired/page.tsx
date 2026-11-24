"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarX } from "lucide-react";
import { api, fmtDate } from "@/lib/api";
import { shortUrl as shortUrlOf } from "@/lib/short";
import type { LinkItem } from "@/lib/types";
import { Badge, ErrorBox } from "@/components/ui";

const cardCls = "bg-[#141419] border border-zinc-800 rounded-2xl";

/** Liên kết đã hết hạn: link tạo bằng gói Free quá thời hạn dùng. Nâng cấp gói là mở lại toàn bộ. */
export default function ExpiredPage() {
  const [links, setLinks] = useState<LinkItem[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<LinkItem[]>("links?status=expired&limit=200")
      .then(setLinks)
      .catch((e) => setError(e instanceof Error ? e.message : "Không tải được danh sách"));
  }, []);

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center">
          <CalendarX className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Liên kết đã hết hạn</h1>
          <p className="text-xs sm:text-sm text-zinc-400">Link tạo bằng gói Miễn phí tự ngừng hoạt động sau 3 ngày kể từ ngày tạo.</p>
        </div>
      </div>

      <ErrorBox message={error} />

      {links && links.length > 0 && (
        <div className="rounded-2xl border-2 border-red-500/70 bg-red-500/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm sm:text-base font-extrabold text-red-400">
            {links.length} link dùng thử đã hết hạn, vui lòng nâng cấp gói để kích hoạt lại.
          </p>
          <Link href="/plans" className="inline-block text-center text-sm font-extrabold px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors">
            Nâng cấp gói
          </Link>
        </div>
      )}

      {!links ? (
        !error && <div className={`${cardCls} p-8 text-center text-sm text-zinc-500`}>Đang tải…</div>
      ) : links.length === 0 ? (
        <div className={`${cardCls} p-8 text-center space-y-1`}>
          <p className="text-sm font-semibold text-zinc-200">Không có link nào hết hạn</p>
          <p className="text-xs text-zinc-500">Link của bạn đang hoạt động bình thường. Gói trả phí không bị giới hạn thời gian.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((l) => (
            <div key={l.id} className="bg-[#141419] border border-red-500/40 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-sm sm:text-base text-zinc-400 line-through truncate">{shortUrlOf(l, window.location.host)}</span>
                  <Badge tone={l.kind === "campaign" || l.kind === "shopee" ? "amber" : l.kind === "url" ? "blue" : "pink"}>
                    {l.kind === "campaign" ? "Chiến dịch" : l.kind === "url" ? "Link thường" : l.kind === "shopee" ? "Shopee" : "Sản phẩm"}
                  </Badge>
                  <span className="text-[11px] text-zinc-500">• {l.clicks} lượt bấm</span>
                </div>
                <div className="text-xs text-zinc-400 truncate max-w-xl">{l.title}</div>
                <div className="text-[10px] text-zinc-500">
                  Tạo: {fmtDate(l.createdAt)}
                  {l.expiresAt && ` • Hết hạn: ${fmtDate(l.expiresAt)}`}
                </div>
              </div>
              <div className="text-xs font-extrabold text-red-500 shrink-0">Link dùng thử đã hết hạn</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
