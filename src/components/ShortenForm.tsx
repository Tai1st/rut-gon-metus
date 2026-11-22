"use client";

import { useEffect, useRef, useState } from "react";
import { Clipboard, SlidersHorizontal } from "lucide-react";
import { api } from "@/lib/api";
import type { Domain, LinkItem } from "@/lib/types";
import { ErrorBox, inputCls, Label } from "./ui";
import { MODE_PLACEHOLDER, ModeToggle, type ShortenMode } from "./ModeToggle";
import { EMPTY_NORMAL, NormalOptions, normalBody, type NormalOpts } from "./NormalOptions";

type Available = { system: Domain[]; custom: Domain[] };

export const MAX_MULTI = 20;

/** Tách các dòng link hợp lệ (bỏ dòng trống và trùng, tối đa MAX_MULTI). */
export function parseLines(text: string) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const u = raw.trim();
    if (u && !seen.has(u)) {
      seen.add(u);
      out.push(u);
    }
  }
  return out;
}

/**
 * Biểu mẫu rút gọn dùng chung cho Bảng điều khiển và cửa sổ Ctrl+K: chọn loại (deeplink / link thường),
 * một link hoặc nhiều link, và bảng "Tùy chọn" (tên miền, chuyển hướng, mật khẩu, thẻ meta, quy tắc, tham số).
 */
export function ShortenForm({
  onCreated,
  deeplinkBlocked,
  autoFocus,
}: {
  /** Gọi sau mỗi lần tạo xong với danh sách link tạo thành công. */
  onCreated: (links: LinkItem[]) => void;
  /** Hết hạn mức deeplink: chặn nút Rút gọn ở chế độ deeplink. */
  deeplinkBlocked?: boolean;
  autoFocus?: boolean;
}) {
  const [mode, setMode] = useState<ShortenMode>("normal");
  const [multi, setMulti] = useState(false);
  // Link thường + link TikTok Shop: tự tạo deeplink làm đích (tắt sẵn, tick để bật; không tick thì rút gọn link TikTok như link thường).
  const [autoDeeplink, setAutoDeeplink] = useState(false);
  const [showOpts, setShowOpts] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [opts, setOpts] = useState<NormalOpts>(EMPTY_NORMAL);
  const [domain, setDomain] = useState("");
  const [domains, setDomains] = useState<Available>({ system: [], custom: [] });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const single = useRef<HTMLInputElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api<Available>("link-domains/available")
      .then(setDomains)
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (autoFocus) (multi ? area : single).current?.focus();
  }, [autoFocus, multi]);

  const lines = multi ? parseLines(url) : url.trim() ? [url.trim()] : [];
  const blocked = mode === "deeplink" && !!deeplinkBlocked;
  // Link thường + link TikTok: hệ thống tự tạo deeplink trước rồi rút gọn link thường trỏ tới deeplink đó.
  const hasTikTok = mode === "normal" && autoDeeplink && lines.some((l) => /^https:\/\/([a-z0-9-]+\.)*tiktok\.com(\/|$)/i.test(l));

  async function paste() {
    try {
      const t = (await navigator.clipboard.readText()).trim();
      if (!t) return;
      setUrl((cur) => (multi && cur.trim() ? `${cur.replace(/\s+$/, "")}\n${t}` : t));
    } catch {
      setError("Trình duyệt không cho đọc bộ nhớ tạm, hãy dán thủ công (Ctrl + V).");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!lines.length) return;
    setBusy(true);
    setError("");
    const list = lines.slice(0, MAX_MULTI);
    const ok: LinkItem[] = [];
    const failed: string[] = [];
    for (let i = 0; i < list.length; i++) {
      if (multi) setProgress(`Đang rút gọn ${i + 1}/${list.length}…`);
      try {
        const l = await api<LinkItem>("links", {
          method: "POST",
          body: {
            mode,
            url: list[i],
            ...(mode === "deeplink" ? !multi && title.trim() && { title: title.trim() } : { ...normalBody(opts, { multi }), autoDeeplink }),
            ...(domain && { domain }),
          },
        });
        ok.push(l);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Lỗi";
        failed.push(multi ? `${list[i]}: ${msg}` : msg);
        // Hết hạn mức thì các dòng sau cũng sẽ lỗi, dừng sớm để khỏi gọi vô ích.
        if (/hết|hạn mức|quota/i.test(msg)) break;
      }
    }
    setBusy(false);
    setProgress("");
    if (failed.length) setError(failed.join("\n"));
    if (ok.length) {
      // Chỉ xóa nội dung đã tạo xong; dòng lỗi giữ lại để người dùng sửa.
      if (multi && failed.length) setUrl(list.filter((u) => failed.some((f) => f.startsWith(u + ":"))).join("\n"));
      else {
        setUrl("");
        setTitle("");
        setOpts(EMPTY_NORMAL);
      }
      onCreated(ok);
    }
  }

  const domainField = (
    <div>
      <Label>Tên miền</Label>
      <p className="text-[11px] text-zinc-500 mb-1.5">Chọn tên miền rút gọn cho link (có thể thêm tên miền riêng trong mục Tên miền riêng)</p>
      <select className={`${inputCls} cursor-pointer`} value={domain} onChange={(e) => setDomain(e.target.value)} disabled={busy}>
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
  );

  const tabBtn = (active: boolean) =>
    `px-3 py-1 text-xs font-semibold transition-colors ${active ? "bg-zinc-600 text-white" : "text-zinc-400 hover:text-white"}`;

  return (
    <form onSubmit={submit} className="space-y-3">
      <ModeToggle value={mode} onChange={setMode} disabled={busy} />

      <div className="flex items-stretch gap-2">
        {multi ? (
          <textarea
            ref={area}
            className={`${inputCls} font-mono text-xs h-28 resize-y`}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={busy}
            placeholder={`Mỗi link một dòng (tối đa ${MAX_MULTI} link)\n${MODE_PLACEHOLDER[mode]}`}
          />
        ) : (
          <input ref={single} className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} disabled={busy} placeholder={MODE_PLACEHOLDER[mode]} />
        )}
        <button type="submit" className="tiktok-glow-btn text-white font-semibold px-5 rounded-xl text-sm shrink-0 self-start py-2.5" disabled={busy || !lines.length || blocked}>
          {busy ? "Đang tạo…" : "Rút gọn"}
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void paste()} disabled={busy} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-700 text-xs font-semibold text-zinc-300 hover:border-zinc-500 disabled:opacity-50">
            <Clipboard className="w-3.5 h-3.5" /> Dán
          </button>
          <button
            type="button"
            onClick={() => setShowOpts((v) => !v)}
            aria-expanded={showOpts}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${showOpts ? "border-zinc-500 bg-zinc-700 text-white" : "border-zinc-700 text-zinc-300 hover:border-zinc-500"}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> Tùy chọn
          </button>
          {multi && (
            <span className={`text-[11px] ${lines.length > MAX_MULTI ? "text-red-400" : "text-zinc-500"}`}>
              {lines.length}/{MAX_MULTI} link
            </span>
          )}
        </div>
        <div className="flex rounded-lg border border-zinc-700 overflow-hidden" role="radiogroup" aria-label="Số lượng link">
          <button type="button" role="radio" aria-checked={!multi} className={tabBtn(!multi)} disabled={busy} onClick={() => setMulti(false)}>
            Một link
          </button>
          <button type="button" role="radio" aria-checked={multi} className={tabBtn(multi)} disabled={busy} onClick={() => setMulti(true)}>
            Nhiều link
          </button>
        </div>
      </div>

      {showOpts &&
        (mode === "normal" ? (
          <div className="pt-2">
            <NormalOptions
              value={opts}
              onChange={setOpts}
              disabled={busy}
              multi={multi}
              domainField={domainField}
              prefix={`${domain || (typeof window !== "undefined" ? window.location.host : "")}/`}
            />
          </div>
        ) : (
          <div className="pt-2 grid sm:grid-cols-2 gap-4">
            {domainField}
            {!multi && (
              <div>
                <Label>Tiêu đề</Label>
                <p className="text-[11px] text-zinc-500 mb-1.5">Mặc định lấy tên sản phẩm</p>
                <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} disabled={busy} placeholder="Tiêu đề (tuỳ chọn)" />
              </div>
            )}
          </div>
        ))}

      {mode === "normal" && (
        <label className="flex items-start gap-2 text-xs text-zinc-300 cursor-pointer select-none">
          <input type="checkbox" className="mt-0.5" checked={autoDeeplink} disabled={busy} onChange={(e) => setAutoDeeplink(e.target.checked)} />
          <span>
            Tự động tạo deeplink TikTok làm link đích{" "}
            <span className="text-zinc-500">(khi nhập link TikTok Shop; deeplink tính vào hạn mức của gói)</span>
          </span>
        </label>
      )}
      {hasTikTok && (
        <p className="text-xs text-tiktok-cyan">
          Phát hiện link TikTok: hệ thống sẽ tạo deeplink trước, rồi link thường trỏ tới deeplink đó. Link TikTok không phải sản phẩm hay chiến dịch
          thì rút gọn như link thường.
        </p>
      )}
      {progress && <p className="text-xs text-zinc-400">{progress}</p>}
      <div className="whitespace-pre-line">
        <ErrorBox message={error} />
      </div>
    </form>
  );
}
