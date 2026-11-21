"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, copyText } from "@/lib/api";
import type { Domain, LinkItem } from "@/lib/types";
import { Badge, btnGhost, ErrorBox, inputCls, Modal } from "./ui";
import { QrModal } from "./QrModal";

type Available = { system: Domain[]; custom: Domain[] };

/** Cửa sổ tạo link nhanh (mở bằng Ctrl+K hoặc ô "Tạo link nhanh…" trên thanh trên). */
export function QuickCreateModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("");
  const [domains, setDomains] = useState<Available>({ system: [], custom: [] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<LinkItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    api<Available>("link-domains/available")
      .then(setDomains)
      .catch(() => {});
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const shortUrl = (l: LinkItem) => `https://${l.domain || window.location.host}/s/${l.code}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const l = await api<LinkItem>("links", {
        method: "POST",
        body: { url: url.trim(), ...(title.trim() && { title: title.trim() }), ...(domain && { domain }) },
      });
      setCreated(l);
      router.refresh(); // cập nhật thẻ hạn mức ở thanh bên và danh sách
      window.dispatchEvent(new Event("links:changed"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được link");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!created) return;
    await copyText(shortUrl(created));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <Modal title={created ? "Đã tạo link" : "Tạo link nhanh"} onClose={onClose}>
        {created ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone="green">Tạo thành công</Badge>
              <Badge tone={created.kind === "campaign" ? "amber" : "pink"}>
                {created.kind === "campaign" ? "Chiến dịch" : "Sản phẩm"}
              </Badge>
            </div>
            <div className="font-mono font-bold text-tiktok-cyan break-all">{shortUrl(created)}</div>
            <div className="text-xs text-zinc-400 truncate">{created.title}</div>
            <div className="flex flex-wrap gap-2">
              <button className={btnGhost} onClick={copy}>
                {copied ? "Đã chép ✓" : "Sao chép"}
              </button>
              <button className={btnGhost} onClick={() => setQr(true)}>
                Mã QR
              </button>
              <button
                className={btnGhost}
                onClick={() => {
                  setCreated(null);
                  setUrl("");
                  setTitle("");
                }}
              >
                Tạo link khác
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input
              ref={input}
              className={inputCls}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Dán link TikTok Shop (sản phẩm hoặc chiến dịch)"
            />
            <input
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tiêu đề (tuỳ chọn)"
            />
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
            <ErrorBox message={error} />
            <button
              type="submit"
              className="w-full tiktok-glow-btn text-white font-semibold py-2.5 px-4 rounded-xl text-sm"
              disabled={busy || !url.trim()}
            >
              {busy ? "Đang tạo…" : "Rút gọn ngay"}
            </button>
            <p className="text-[11px] text-zinc-500 text-center">Mẹo: nhấn Ctrl + K ở bất kỳ trang nào để mở cửa sổ này.</p>
          </form>
        )}
      </Modal>
      {qr && created && <QrModal url={shortUrl(created)} title={created.title} onClose={() => setQr(false)} />}
    </>
  );
}
