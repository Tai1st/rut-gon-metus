"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, copyText, fmtDate } from "@/lib/api";
import { useMe } from "@/components/AppShell";
import { QrModal } from "@/components/QrModal";
import { PERIOD_VI, type Domain, type LinkItem, type Quota } from "@/lib/types";
import { Badge, btnGhost, btnPrimary, ErrorBox, inputCls, Modal } from "@/components/ui";

type Available = { system: Domain[]; custom: Domain[] };
type Tab = "active" | "archived";

const cardCls = "bg-[#141419] border border-zinc-800 rounded-2xl";

function Kpi({
  label,
  value,
  note,
  valueCls = "",
  noteCls = "text-zinc-500",
  dot,
}: {
  label: string;
  value: string;
  note: string;
  valueCls?: string;
  noteCls?: string;
  dot: string;
}) {
  return (
    <div className={`${cardCls} p-5`}>
      <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
        <span className="uppercase">{label}</span>
        <span className={`w-2 h-2 rounded-full ${dot}`} />
      </div>
      <div className={`text-2xl sm:text-3xl font-extrabold ${valueCls}`}>{value}</div>
      <div className={`text-[11px] mt-1 ${noteCls}`}>{note}</div>
    </div>
  );
}

export default function DashboardPage() {
  const me = useMe();
  const router = useRouter();
  const [quota, setQuota] = useState<Quota | null>(null);
  const [domains, setDomains] = useState<Available>({ system: [], custom: [] });
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [archived, setArchived] = useState<LinkItem[]>([]);
  const [tab, setTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [qr, setQr] = useState<LinkItem | null>(null);
  const [editing, setEditing] = useState<LinkItem | null>(null);

  const load = useCallback(async () => {
    try {
      const [q, d, l, a] = await Promise.all([
        api<Quota>("links/quota"),
        api<Available>("link-domains/available"),
        api<LinkItem[]>("links"),
        api<LinkItem[]>("links?status=archived"),
      ]);
      setQuota(q);
      setDomains(d);
      setLinks(l);
      setArchived(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu");
    }
  }, []);

  useEffect(() => {
    void load();
    // Link vừa được tạo từ cửa sổ Ctrl+K thì tải lại danh sách.
    const onChanged = () => void load();
    window.addEventListener("links:changed", onChanged);
    return () => window.removeEventListener("links:changed", onChanged);
  }, [load]);

  const shortUrl = (l: LinkItem) => `https://${l.domain || window.location.host}/s/${l.code}`;

  const totals = useMemo(
    () => ({
      clicks: links.reduce((n, l) => n + l.clicks, 0),
      products: links.filter((l) => l.kind === "product").length,
      campaigns: links.filter((l) => l.kind === "campaign").length,
    }),
    [links],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (tab === "active" ? links : archived).filter(
      (l) =>
        (!kind || l.kind === kind) &&
        (!q || l.title.toLowerCase().includes(q) || l.code.toLowerCase().includes(q) || l.domain.toLowerCase().includes(q)),
    );
  }, [tab, links, archived, search, kind]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("links", {
        method: "POST",
        body: { url: url.trim(), ...(title.trim() && { title: title.trim() }), ...(domain && { domain }) },
      });
      setUrl("");
      setTitle("");
      await load();
      router.refresh(); // cập nhật thẻ hạn mức ở thanh bên
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được link");
    } finally {
      setBusy(false);
    }
  }

  async function copy(l: LinkItem) {
    await copyText(shortUrl(l));
    setCopied(l.id);
    setTimeout(() => setCopied(""), 1500);
  }

  async function setArchivedState(l: LinkItem, value: boolean) {
    setError("");
    try {
      await api(`links/${l.id}`, { method: "PATCH", body: { archived: value } });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thực hiện được");
    }
  }

  async function remove(l: LinkItem) {
    if (!confirm(`Xóa link "${l.title}"? Link sẽ ngừng hoạt động.`)) return;
    try {
      await api(`links/${l.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xóa được");
    }
  }

  const exhausted = quota?.remaining === 0;
  const unlimited = quota?.limit === null;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Bảng điều khiển</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Xin chào <strong className="text-white">{me.fullName || me.username}</strong>, đây là tổng quan link rút gọn của bạn.
          </p>
        </div>
        <a
          href="#tao-link"
          className="tiktok-glow-btn text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
        >
          <span className="text-base leading-none">+</span>
          <span>Tạo liên kết mới</span>
        </a>
      </div>

      {/* 4 thẻ chỉ số (số liệu thật) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="Tổng liên kết"
          value={String(links.length)}
          note={`${totals.products} sản phẩm · ${totals.campaigns} chiến dịch`}
          dot="bg-tiktok-cyan"
        />
        <Kpi label="Tổng lượt bấm" value={String(totals.clicks)} note="Không tính bot quét link" dot="bg-tiktok-pink" />
        <Kpi
          label="Còn lại hôm nay"
          value={quota ? (unlimited ? "∞" : String(quota.remaining)) : "—"}
          valueCls={exhausted ? "text-red-400" : "text-emerald-400"}
          note={quota ? (unlimited ? "Không giới hạn" : `Trên ${quota.limit} link/${PERIOD_VI[quota.period]}`) : "Đang tải…"}
          noteCls={exhausted ? "text-red-400" : "text-zinc-500"}
          dot="bg-emerald-400"
        />
        <Kpi
          label="Gói hiện tại"
          value={quota?.plan.name ?? "—"}
          note={quota ? (quota.plan.expiresAt ? `Hết hạn ${fmtDate(quota.plan.expiresAt)}` : "Không hết hạn") : "Đang tải…"}
          noteCls="text-amber-400"
          dot="bg-amber-400"
        />
      </div>

      {/* Khung tạo link nhanh */}
      <div id="tao-link" className={`${cardCls} p-5 sm:p-6 scroll-mt-24`}>
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <span className="text-tiktok-pink">⚡</span>
          Tạo nhanh liên kết rút gọn
        </h3>
        <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-7">
            <input
              className={inputCls}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Dán link TikTok Shop (vt.tiktok.com/… hoặc link sản phẩm, chiến dịch)"
            />
          </div>
          <div className="md:col-span-5">
            <select className={`${inputCls} cursor-pointer`} value={domain} onChange={(e) => setDomain(e.target.value)}>
              <option value="">Tên miền mặc định</option>
              {domains.system.map((d) => (
                <option key={d.id} value={d.host}>
                  {d.host}
                </option>
              ))}
              {domains.custom.map((d) => (
                <option key={d.id} value={d.host}>
                  {d.host} (của bạn)
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-7">
            <input
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tiêu đề (tuỳ chọn, mặc định lấy tên sản phẩm)"
            />
          </div>
          <div className="md:col-span-5">
            <button
              type="submit"
              className="w-full tiktok-glow-btn text-white font-semibold py-2.5 px-4 rounded-xl text-sm"
              disabled={busy || !url.trim() || exhausted}
            >
              {busy ? "Đang tạo…" : "Rút gọn ngay"}
            </button>
          </div>
        </form>
        <div className="mt-3 space-y-2">
          <ErrorBox message={error} />
          {exhausted && <p className="text-xs text-red-400">Đã hết hạn mức, hãy nâng cấp gói ở mục “Gói & thanh toán”.</p>}
        </div>
      </div>

      {/* Danh sách link: tab, tìm kiếm, lọc */}
      <div className={`${cardCls} p-5 sm:p-6 space-y-4`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-zinc-800 w-fit">
            {(
              [
                ["active", "Đang hoạt động", links.length],
                ["archived", "Lưu trữ", archived.length],
              ] as const
            ).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  tab === key ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                {label}
                <span className="text-[10px] font-mono bg-zinc-900 text-zinc-300 px-1.5 rounded-full">{count}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              className={`${inputCls} lg:w-64 py-2 text-xs`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tiêu đề, mã link, tên miền…"
            />
            <select
              className={`${inputCls} w-auto py-2 text-xs cursor-pointer`}
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <option value="">Tất cả loại</option>
              <option value="product">Sản phẩm</option>
              <option value="campaign">Chiến dịch</option>
            </select>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="text-center py-10 text-sm text-zinc-500">
            {search || kind
              ? "Không có link nào khớp bộ lọc."
              : tab === "active"
                ? "Chưa có liên kết nào. Dán link ở khung phía trên để bắt đầu."
                : "Chưa có link nào được lưu trữ."}
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((l) => (
              <div
                key={l.id}
                className="bg-[#141419] border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
              >
                <div className="space-y-1 overflow-hidden min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-sm sm:text-base text-tiktok-cyan truncate">{shortUrl(l)}</span>
                    <Badge tone={l.kind === "campaign" ? "amber" : "pink"}>
                      {l.kind === "campaign" ? "Chiến dịch" : "Sản phẩm"}
                    </Badge>
                    <span className="text-[11px] text-zinc-500">• {l.clicks} lượt bấm</span>
                  </div>
                  <div className="text-xs text-zinc-400 truncate max-w-xl">{l.title}</div>
                  <div className="text-[10px] text-zinc-500">
                    Tạo: {fmtDate(l.createdAt)}
                    {l.archivedAt && ` • Lưu trữ: ${fmtDate(l.archivedAt)}`}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {tab === "active" ? (
                    <>
                      <button
                        onClick={() => copy(l)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-tiktok-cyan hover:text-black text-xs font-semibold transition-colors"
                      >
                        {copied === l.id ? "Đã chép ✓" : "Sao chép"}
                      </button>
                      <a
                        href={shortUrl(l)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-tiktok-cyan/15 text-tiktok-cyan hover:bg-tiktok-cyan hover:text-black text-xs font-semibold transition-colors"
                      >
                        Mở thử
                      </a>
                      <button onClick={() => setQr(l)} className={btnGhost}>
                        QR
                      </button>
                      <button onClick={() => setEditing(l)} className={btnGhost}>
                        Sửa
                      </button>
                      <button onClick={() => setArchivedState(l, true)} className={btnGhost}>
                        Lưu trữ
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setArchivedState(l, false)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-semibold"
                    >
                      Khôi phục
                    </button>
                  )}
                  <button
                    onClick={() => remove(l)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-red-400 text-xs font-semibold transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {qr && <QrModal url={shortUrl(qr)} title={qr.title} onClose={() => setQr(null)} />}
      {editing && (
        <EditTitleModal
          link={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}
    </>
  );
}

/** Đổi tiêu đề hiển thị khi chia sẻ link (tên sản phẩm trong thẻ xem trước). */
function EditTitleModal({ link, onClose, onSaved }: { link: LinkItem; onClose: () => void; onSaved: () => Promise<void> }) {
  const [title, setTitle] = useState(link.title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`links/${link.id}`, { method: "PATCH", body: { title: title.trim() } });
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được");
      setBusy(false);
    }
  }

  return (
    <Modal title="Sửa tiêu đề" onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <p className="text-[11px] text-zinc-500">Tiêu đề hiện trong thẻ xem trước khi bạn chia sẻ link (ví dụ trên Facebook).</p>
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} autoFocus />
        <ErrorBox message={error} />
        <div className="flex gap-2">
          <button className={btnPrimary} disabled={busy || !title.trim()}>
            Lưu
          </button>
          <button type="button" className={btnGhost} onClick={onClose}>
            Hủy
          </button>
        </div>
      </form>
    </Modal>
  );
}
