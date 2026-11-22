"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { copyText } from "@/lib/api";
import type { LinkItem } from "@/lib/types";
import { Badge, btnGhost, Modal } from "./ui";
import { QrModal } from "./QrModal";
import { ShortenForm } from "./ShortenForm";

/** Cửa sổ tạo link nhanh (mở bằng Ctrl+K hoặc ô "Tạo link nhanh…" trên thanh trên). */
export function QuickCreateModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [created, setCreated] = useState<LinkItem[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<LinkItem | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const shortUrl = (l: LinkItem) => `https://${l.domain || window.location.host}/s/${l.code}`;

  async function copyAll() {
    if (!created) return;
    await copyText(created.map(shortUrl).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <Modal title={created ? `Đã tạo ${created.length} link` : "Tạo link nhanh"} onClose={onClose} wide={!created}>
        {created ? (
          <div className="space-y-4">
            <div className="space-y-3 max-h-80 overflow-auto">
              {created.map((l) => (
                <div key={l.id} className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone="green">Thành công</Badge>
                    <Badge tone={l.kind === "campaign" ? "amber" : l.kind === "url" ? "blue" : "pink"}>
                      {l.kind === "campaign" ? "Chiến dịch" : l.kind === "url" ? "Link thường" : "Sản phẩm"}
                    </Badge>
                    {l.hasPassword && <Badge tone="gray">Có mật khẩu</Badge>}
                    {created.length === 1 && (
                      <button className={btnGhost} onClick={() => setQr(l)}>
                        Mã QR
                      </button>
                    )}
                  </div>
                  <div className="font-mono font-bold text-tiktok-cyan break-all">{shortUrl(l)}</div>
                  <div className="text-xs text-zinc-400 truncate">{l.title}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button className={btnGhost} onClick={copyAll}>
                {copied ? "Đã chép ✓" : created.length > 1 ? "Sao chép tất cả" : "Sao chép"}
              </button>
              <button className={btnGhost} onClick={() => setCreated(null)}>
                Tạo link khác
              </button>
            </div>
          </div>
        ) : (
          <>
            <ShortenForm
              autoFocus
              onCreated={(links) => {
                setCreated(links);
                router.refresh(); // cập nhật thẻ hạn mức ở thanh bên và danh sách
                window.dispatchEvent(new Event("links:changed"));
              }}
            />
            <p className="text-[11px] text-zinc-500 text-center mt-3">Mẹo: nhấn Ctrl + K ở bất kỳ trang nào để mở cửa sổ này.</p>
          </>
        )}
      </Modal>
      {qr && <QrModal url={shortUrl(qr)} title={qr.title} onClose={() => setQr(null)} />}
    </>
  );
}
