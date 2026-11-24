"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { LinkItem } from "@/lib/types";
import { ErrorBox, inputCls } from "@/components/ui";

type Row = { key: string; clicks: number };
type Recent = {
  at: string;
  code: string;
  title: string;
  device: string;
  os: string;
  source: string;
  refererHost: string;
  country: string;
  ua: string;
};
type Stats = {
  days: number;
  total: number;
  today: number;
  byDay: { date: string; clicks: number }[];
  devices: Row[];
  os: Row[];
  sources: Row[];
  countries: Row[];
  topLinks: { code: string; title: string; clicks: number }[];
  recent: Recent[];
};

const cardCls = "bg-[#141419] border border-zinc-800 rounded-2xl";

const DEVICE: Record<string, string> = { iphone: "iPhone", ipad: "iPad", android: "Android", desktop: "Máy tính", other: "Khác" };
const SOURCE: Record<string, string> = {
  facebook: "Facebook",
  zalo: "Zalo",
  instagram: "Instagram",
  tiktok: "TikTok",
  telegram: "Telegram",
  google: "Google",
  youtube: "YouTube",
  direct: "Trực tiếp",
  other: "Khác",
};

const regionName = (cc: string) => {
  try {
    return new Intl.DisplayNames(["vi"], { type: "region" }).of(cc) ?? cc;
  } catch {
    return cc;
  }
};

const fmtTime = (s: string) =>
  new Date(s).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });

/** Danh sách có thanh phần trăm. */
function Breakdown({ title, rows, label }: { title: string; rows: Row[]; label: (k: string) => string }) {
  const total = rows.reduce((a, r) => a + r.clicks, 0);
  return (
    <div className={`${cardCls} p-5`}>
      <h3 className="text-sm font-bold mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-zinc-500">Chưa có dữ liệu.</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r) => {
            const pct = total ? Math.round((r.clicks / total) * 100) : 0;
            return (
              <div key={r.key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-200 truncate">{label(r.key)}</span>
                  <span className="text-zinc-400 shrink-0 ml-2">
                    {r.clicks} · {pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-tiktok-cyan to-tiktok-pink" style={{ width: `${Math.max(pct, 2)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className={`${cardCls} p-4 sm:p-5`}>
      <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">{label}</div>
      <div className="text-2xl sm:text-3xl font-black mt-1 truncate">{value}</div>
      {note && <div className="text-[11px] text-zinc-500 mt-1 truncate">{note}</div>}
    </div>
  );
}

/** Biểu đồ cột lượt bấm theo ngày (không dùng thư viện biểu đồ). */
function DayChart({ data }: { data: { date: string; clicks: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.clicks));
  const every = Math.ceil(data.length / 8);
  return (
    <div>
      <div className="flex items-end gap-[2px] sm:gap-1 h-40">
        {data.map((d) => (
          <div key={d.date} className="flex-1 min-w-0 h-full flex items-end group relative" title={`${d.date}: ${d.clicks} lượt bấm`}>
            <div
              className={`w-full rounded-t ${d.clicks ? "bg-gradient-to-t from-tiktok-pink to-tiktok-cyan" : "bg-zinc-800"}`}
              style={{ height: d.clicks ? `${Math.max((d.clicks / max) * 100, 4)}%` : "2px" }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-[2px] sm:gap-1 mt-1.5">
        {data.map((d, i) => (
          <div key={d.date} className="flex-1 min-w-0 text-center text-[9px] text-zinc-500 overflow-visible whitespace-nowrap">
            {i % every === 0 || i === data.length - 1 ? d.date.slice(5).replace("-", "/") : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [code, setCode] = useState("");
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<LinkItem[]>("links?limit=200")
      .then(setLinks)
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStats(await api<Stats>(`links/stats?days=${days}${code ? `&code=${encodeURIComponent(code)}` : ""}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được thống kê");
    } finally {
      setLoading(false);
    }
  }, [days, code]);

  useEffect(() => {
    void load();
  }, [load]);

  const top = (rows?: Row[]) => rows?.[0]?.key;
  const topSource = top(stats?.sources);
  const topDevice = top(stats?.devices);
  const title = useMemo(() => (code ? (links.find((l) => l.code === code)?.title ?? code) : "Tất cả link"), [code, links]);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Thống kê</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Lượt bấm của người thật vào link của bạn (không tính bot quét link). Dữ liệu được ghi từ khi bật tính năng và giữ 90 ngày.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className={`${inputCls} w-auto py-2 text-xs cursor-pointer max-w-[220px]`} value={code} onChange={(e) => setCode(e.target.value)}>
            <option value="">Tất cả link</option>
            {links.map((l) => (
              <option key={l.id} value={l.code}>
                {l.title.slice(0, 40)} ({l.code})
              </option>
            ))}
          </select>
          <div className="flex rounded-lg border border-zinc-700 overflow-hidden" role="radiogroup" aria-label="Khoảng thời gian">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={days === d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${days === d ? "bg-zinc-600 text-white" : "text-zinc-400 hover:text-white"}`}
              >
                {d} ngày
              </button>
            ))}
          </div>
        </div>
      </div>

      <ErrorBox message={error} />

      {!stats ? (
        <div className={`${cardCls} p-8 text-center text-sm text-zinc-500`}>{loading ? "Đang tải…" : "Không có dữ liệu."}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi label={`Lượt bấm ${days} ngày`} value={String(stats.total)} note={title} />
            <Kpi label="Hôm nay" value={String(stats.today)} note="Tính theo giờ Việt Nam" />
            <Kpi label="Nguồn nhiều nhất" value={topSource ? (SOURCE[topSource] ?? topSource) : "—"} note={stats.sources[0] ? `${stats.sources[0].clicks} lượt` : "Chưa có dữ liệu"} />
            <Kpi label="Thiết bị nhiều nhất" value={topDevice ? (DEVICE[topDevice] ?? topDevice) : "—"} note={stats.devices[0] ? `${stats.devices[0].clicks} lượt` : "Chưa có dữ liệu"} />
          </div>

          <div className={`${cardCls} p-5 sm:p-6`}>
            <h3 className="text-sm font-bold mb-4">Lượt bấm theo ngày</h3>
            {stats.total === 0 ? (
              <p className="text-xs text-zinc-500 py-8 text-center">Chưa có lượt bấm nào trong khoảng này. Chia sẻ link rồi quay lại xem nhé.</p>
            ) : (
              <DayChart data={stats.byDay} />
            )}
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Breakdown title="Thiết bị" rows={stats.devices} label={(k) => DEVICE[k] ?? k} />
            <Breakdown title="Hệ điều hành" rows={stats.os} label={(k) => k} />
            <Breakdown title="Nguồn truy cập" rows={stats.sources} label={(k) => SOURCE[k] ?? k} />
            <Breakdown title="Quốc gia" rows={stats.countries} label={regionName} />
          </div>

          {!code && stats.topLinks.length > 0 && (
            <div className={`${cardCls} p-5`}>
              <h3 className="text-sm font-bold mb-3">Link nhiều lượt bấm nhất</h3>
              <div className="divide-y divide-zinc-800">
                {stats.topLinks.map((t) => (
                  <button key={t.code} type="button" onClick={() => setCode(t.code)} className="w-full flex items-center justify-between gap-3 py-2 text-left hover:text-tiktok-cyan transition-colors">
                    <span className="min-w-0">
                      <span className="block text-xs font-mono text-tiktok-cyan">{t.code}</span>
                      <span className="block text-xs text-zinc-400 truncate">{t.title}</span>
                    </span>
                    <span className="text-sm font-bold shrink-0">{t.clicks}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={`${cardCls} p-5 overflow-x-auto`}>
            <h3 className="text-sm font-bold mb-3">Nhật ký truy cập gần đây</h3>
            {stats.recent.length === 0 ? (
              <p className="text-xs text-zinc-500">Chưa có lượt bấm nào.</p>
            ) : (
              <table className="w-full text-xs min-w-[640px]">
                <thead>
                  <tr className="text-left text-zinc-500 border-b border-zinc-800">
                    <th className="py-2 pr-3 font-semibold">Thời gian</th>
                    <th className="py-2 pr-3 font-semibold">Link</th>
                    <th className="py-2 pr-3 font-semibold">Thiết bị</th>
                    <th className="py-2 pr-3 font-semibold">Hệ điều hành</th>
                    <th className="py-2 pr-3 font-semibold">Nguồn</th>
                    <th className="py-2 pr-3 font-semibold">Quốc gia</th>
                    <th className="py-2 font-semibold">User-Agent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {stats.recent.map((r, i) => (
                    <tr key={`${r.at}-${i}`} className="align-top">
                      <td className="py-2 pr-3 whitespace-nowrap text-zinc-300">{fmtTime(r.at)}</td>
                      <td className="py-2 pr-3">
                        <span className="font-mono text-tiktok-cyan">{r.code}</span>
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">{DEVICE[r.device] ?? r.device}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{r.os}</td>
                      <td className="py-2 pr-3 whitespace-nowrap" title={r.refererHost || undefined}>
                        {SOURCE[r.source] ?? r.source}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">{r.country ? regionName(r.country) : "—"}</td>
                      <td className="py-2 max-w-[260px] truncate text-zinc-500" title={r.ua}>
                        {r.ua || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </>
  );
}
