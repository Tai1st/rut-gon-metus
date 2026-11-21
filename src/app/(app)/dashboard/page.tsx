"use client";

import { useCallback, useEffect, useState } from "react";
import { api, copyText, fmtDate } from "@/lib/api";
import { PERIOD_VI, type Domain, type LinkItem, type Quota } from "@/lib/types";
import { Badge, btnDanger, btnGhost, btnPrimary, Card, ErrorBox, inputCls, Label } from "@/components/ui";

type Available = { system: Domain[]; custom: Domain[] };

export default function DashboardPage() {
  const [quota, setQuota] = useState<Quota | null>(null);
  const [domains, setDomains] = useState<Available>({ system: [], custom: [] });
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    try {
      const [q, d, l] = await Promise.all([
        api<Quota>("links/quota"),
        api<Available>("link-domains/available"),
        api<LinkItem[]>("links"),
      ]);
      setQuota(q);
      setDomains(d);
      setLinks(l);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const shortUrl = (l: LinkItem) => `https://${l.domain || window.location.host}/s/${l.code}`;

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

  async function remove(l: LinkItem) {
    if (!confirm(`Xóa link "${l.title}"?`)) return;
    try {
      await api(`links/${l.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xóa được");
    }
  }

  const exhausted = quota?.remaining === 0;

  return (
    <>
      <Card
        title="Tạo link mới"
        right={
          quota && (
            <Badge tone={exhausted ? "red" : "green"}>
              {quota.plan.name} ·{" "}
              {quota.limit === null
                ? "không giới hạn"
                : `còn ${quota.remaining}/${quota.limit} link/${PERIOD_VI[quota.period]}`}
            </Badge>
          )
        }
      >
        <form onSubmit={create} className="space-y-3">
          <div>
            <Label>Link TikTok Shop (sản phẩm hoặc chiến dịch)</Label>
            <input
              className={inputCls}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://vt.tiktok.com/ZS…/"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Tiêu đề (tuỳ chọn, mặc định lấy tên sản phẩm)</Label>
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Tên miền</Label>
              <select
                className={`${inputCls} cursor-pointer`}
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              >
                <option value="">Mặc định</option>
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
          </div>
          <ErrorBox message={error} />
          <button className={btnPrimary} disabled={busy || !url.trim() || exhausted}>
            {busy ? "Đang tạo…" : "Tạo link"}
          </button>
          {exhausted && <p className="text-xs text-red-400">Đã hết hạn mức, hãy nâng cấp gói ở tab “Gói & thanh toán”.</p>}
        </form>
      </Card>

      <Card title={`Link của bạn (${links.length})`}>
        {links.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có link nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed leading-normal text-sm min-w-[640px]">
              <thead>
                <tr className="text-xs text-slate-400 text-left">
                  <th className="pb-2 font-medium">Link</th>
                  <th className="pb-2 font-medium w-20">Lượt bấm</th>
                  <th className="pb-2 font-medium w-32">Tạo lúc</th>
                  <th className="pb-2 w-28" />
                </tr>
              </thead>
              <tbody>
                {links.map((l) => (
                  <tr key={l.id} className="hover:bg-tiktok-card/5 transition-colors">
                    <td className="py-2.5 pr-3 border-t border-tiktok-border/60 overflow-hidden">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[13px] font-medium text-white">{l.title}</span>
                          <Badge tone={l.kind === "campaign" ? "amber" : "blue"}>
                            {l.kind === "campaign" ? "Chiến dịch" : "Sản phẩm"}
                          </Badge>
                        </div>
                        <span className="truncate text-[11px] text-slate-500 font-mono mt-0.5">{shortUrl(l)}</span>
                      </div>
                    </td>
                    <td className="py-2.5 border-t border-tiktok-border/60 text-slate-200">{l.clicks}</td>
                    <td className="py-2.5 border-t border-tiktok-border/60 text-xs text-slate-400">{fmtDate(l.createdAt)}</td>
                    <td className="py-2.5 border-t border-tiktok-border/60 text-right space-x-2 whitespace-nowrap">
                      <button className={btnGhost} onClick={() => copy(l)}>
                        {copied === l.id ? "Đã chép ✓" : "Sao chép"}
                      </button>
                      <button className={btnDanger} onClick={() => remove(l)}>
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
