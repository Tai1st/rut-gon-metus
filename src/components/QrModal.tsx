"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { btnGhost, Modal } from "./ui";

/** Hiện mã QR của một đường dẫn (tạo ngay trên trình duyệt) và cho tải về PNG. */
export function QrModal({ url, title, onClose }: { url: string; title?: string; onClose: () => void }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, { width: 512, margin: 2, errorCorrectionLevel: "M" })
      .then((d) => {
        if (!cancelled) setSrc(d);
      })
      .catch(() => {
        if (!cancelled) setSrc("");
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <Modal title="Mã QR" onClose={onClose}>
      <div className="space-y-4 text-center">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="Mã QR" className="mx-auto w-60 h-60 rounded-xl bg-white p-2" />
        ) : (
          <div className="mx-auto w-60 h-60 rounded-xl bg-zinc-900 animate-pulse" />
        )}
        {title && <div className="text-xs text-zinc-400 truncate">{title}</div>}
        <div className="font-mono text-xs text-tiktok-cyan break-all">{url}</div>
        <a
          href={src || undefined}
          download="qr-link.png"
          className={`${btnGhost} inline-block ${src ? "" : "pointer-events-none opacity-40"}`}
        >
          Tải ảnh PNG
        </a>
      </div>
    </Modal>
  );
}
