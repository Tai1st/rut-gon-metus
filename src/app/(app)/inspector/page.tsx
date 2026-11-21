"use client";

import { useState } from "react";
import { api, copyText } from "@/lib/api";
import type { InspectResult } from "@/lib/types";
import { Badge, btnGhost, Card, ErrorBox, inputCls, Label } from "@/components/ui";

function Field({ label, value }: { label: string; value: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-zinc-400">{label}</span>
        <button
          className="text-[11px] text-tiktok-cyan hover:underline"
          onClick={async () => {
            await copyText(value);
            setOk(true);
            setTimeout(() => setOk(false), 1200);
          }}
        >
          {ok ? "Đã chép ✓" : "Sao chép"}
        </button>
      </div>
      <div className="font-mono text-[11px] text-zinc-300 bg-black/40 border border-zinc-800 rounded-xl p-3 break-all max-h-40 overflow-auto">
        {value}
      </div>
    </div>
  );
}

export default function InspectorPage() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [res, setRes] = useState<InspectResult | null>(null);

  async function inspect(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setRes(null);
    try {
      setRes(await api<InspectResult>("links/inspect", { method: "POST", body: { url: url.trim() } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không kiểm tra được link");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Kiểm tra deeplink</h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Dán một link TikTok Shop để xem hệ thống nhận diện thế nào và sinh ra những đường dẫn nào. Không tạo link mới và không tính hạn mức.
        </p>
      </div>

      <Card title="Link cần kiểm tra">
        <form onSubmit={inspect} className="space-y-3">
          <div>
            <Label>Link TikTok (vt.tiktok.com, vm.tiktok.com hoặc tiktok.com)</Label>
            <input
              className={inputCls}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://vt.tiktok.com/ZS…/"
            />
          </div>
          <ErrorBox message={error} />
          <button
            className="tiktok-glow-btn text-white font-semibold py-2.5 px-5 rounded-xl text-sm"
            disabled={busy || !url.trim()}
          >
            {busy ? "Đang kiểm tra…" : "Kiểm tra"}
          </button>
        </form>
      </Card>

      {res && (
        <Card
          title="Kết quả"
          right={<Badge tone={res.kind === "campaign" ? "amber" : "pink"}>{res.kind === "campaign" ? "Chiến dịch" : "Sản phẩm"}</Badge>}
        >
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              {res.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={res.image} alt="" className="w-20 h-20 rounded-xl object-cover border border-zinc-800" />
              )}
              <div className="min-w-0 space-y-1 text-sm">
                <div className="text-zinc-300">{res.title || "(trang không có tiêu đề riêng)"}</div>
                <div className="text-[11px] text-zinc-500 font-mono">
                  {res.productId ? `product_id: ${res.productId}` : `campaign_id: ${res.campaignId}`}
                </div>
              </div>
            </div>
            <Field label="URL web đích (sau khi giải mã link rút gọn)" value={res.webUrl} />
            <Field label="Deeplink mở ứng dụng (Android / trình duyệt)" value={res.androidUrl} />
            <Field label="Link mở ứng dụng trên iPhone (onelink)" value={res.iosUrl} />
            <button className={btnGhost} onClick={() => window.open(res.webUrl, "_blank", "noopener")}>
              Mở trang web đích
            </button>
          </div>
        </Card>
      )}
    </>
  );
}
