"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, copyText } from "@/lib/api";
import { shortUrl as shortUrlOf } from "@/lib/short";
import type { LinkItem } from "@/lib/types";
import { Badge, btnGhost, Card, ErrorBox, inputCls } from "@/components/ui";
import { ModeToggle, type ShortenMode } from "@/components/ModeToggle";

const MAX_LINES = 20;

type Row = { url: string; status: "wait" | "run" | "ok" | "fail"; short?: string; title?: string; error?: string };

/** Tách các dòng hợp lệ (bỏ dòng trống, bỏ trùng, tối đa MAX_LINES). */
function parseLines(text: string) {
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

export default function BulkPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [mode, setMode] = useState<ShortenMode>("normal");
  const [domain, setDomain] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const stop = useRef(false);

  const lines = parseLines(text);
  const over = lines.length > MAX_LINES;

  async function run() {
    stop.current = false;
    setError("");
    const list = lines.slice(0, MAX_LINES);
    setRows(list.map((url) => ({ url, status: "wait" })));
    setRunning(true);
    const patch = (i: number, p: Partial<Row>) => setRows((rs) => rs.map((r, k) => (k === i ? { ...r, ...p } : r)));

    for (let i = 0; i < list.length; i++) {
      if (stop.current) break;
      patch(i, { status: "run" });
      try {
        const l = await api<LinkItem>("links", {
          method: "POST",
          body: { mode, url: list[i], ...(domain.trim() && { domain: domain.trim() }) },
        });
        patch(i, { status: "ok", short: shortUrlOf(l, window.location.host), title: l.title });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Lỗi";
        patch(i, { status: "fail", error: msg });
        // Hết hạn mức thì các dòng sau cũng sẽ lỗi, dừng sớm để khỏi gọi vô ích.
        if (/hết|hạn mức|quota/i.test(msg)) {
          setError(msg);
          break;
        }
      }
    }
    setRunning(false);
    router.refresh(); // cập nhật hạn mức ở thanh bên
  }

  const done = rows.filter((r) => r.status === "ok");

  async function copyAll() {
    await copyText(done.map((r) => r.short).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Rút gọn hàng loạt</h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Chọn loại rút gọn rồi dán nhiều link, mỗi link một dòng (tối đa {MAX_LINES} link mỗi lượt). Chỉ deeplink TikTok tính vào hạn mức của gói, link thường không giới hạn.
        </p>
      </div>

      <Card title="Danh sách link">
        <div className="space-y-3">
          <ModeToggle value={mode} onChange={setMode} disabled={running} />
          <textarea
            className={`${inputCls} font-mono text-xs h-44 resize-y`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              mode === "normal"
                ? "https://example.com/trang-1\nhttps://example.com/trang-2"
                : "https://vt.tiktok.com/ZS…/\nhttps://vt.tiktok.com/ZS…/\nhttps://www.tiktok.com/view/product/…"
            }
            disabled={running}
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              className={inputCls}
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Tên miền (tuỳ chọn, để trống = mặc định)"
              disabled={running}
            />
            <div className="flex items-center gap-2 text-xs">
              <Badge tone={over ? "red" : "blue"}>
                {lines.length}/{MAX_LINES} link
              </Badge>
              {over && <span className="text-red-400">Chỉ xử lý {MAX_LINES} link đầu tiên.</span>}
            </div>
          </div>
          <ErrorBox message={error} />
          <div className="flex gap-2">
            <button
              className="tiktok-glow-btn text-white font-semibold py-2.5 px-5 rounded-xl text-sm"
              disabled={running || lines.length === 0}
              onClick={run}
            >
              {running ? "Đang xử lý…" : `Rút gọn ${Math.min(lines.length, MAX_LINES)} link`}
            </button>
            {running && (
              <button className={btnGhost} onClick={() => (stop.current = true)}>
                Dừng
              </button>
            )}
          </div>
        </div>
      </Card>

      {rows.length > 0 && (
        <Card
          title={`Kết quả (${done.length}/${rows.length} thành công)`}
          right={
            done.length > 0 && (
              <button className={btnGhost} onClick={copyAll}>
                {copied ? "Đã chép ✓" : "Sao chép tất cả"}
              </button>
            )
          }
        >
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="bg-black/30 border border-zinc-800 rounded-xl p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge tone={r.status === "ok" ? "green" : r.status === "fail" ? "red" : r.status === "run" ? "blue" : "gray"}>
                    {r.status === "ok" ? "Xong" : r.status === "fail" ? "Lỗi" : r.status === "run" ? "Đang chạy" : "Chờ"}
                  </Badge>
                  {r.short && <span className="font-mono text-sm font-bold text-tiktok-cyan truncate">{r.short}</span>}
                </div>
                <div className="text-[11px] text-zinc-500 truncate">{r.url}</div>
                {r.title && <div className="text-xs text-zinc-400 truncate">{r.title}</div>}
                {r.error && <div className="text-xs text-red-400">{r.error}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
