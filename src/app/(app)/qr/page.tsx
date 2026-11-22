"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { api, copyText } from "@/lib/api";
import { shortUrl as shortUrlOf } from "@/lib/short";
import type { LinkItem } from "@/lib/types";
import { btnGhost, Card, ErrorBox, inputCls, Label } from "@/components/ui";

type Level = "L" | "M" | "Q" | "H";

const LEVELS: { key: Level; label: string; note: string }[] = [
  { key: "L", label: "Thấp (L)", note: "~7% có thể che" },
  { key: "M", label: "Vừa (M)", note: "~15%" },
  { key: "Q", label: "Cao (Q)", note: "~25%" },
  { key: "H", label: "Rất cao (H)", note: "~30%" },
];

const PRESETS = [
  { fg: "#000000", bg: "#ffffff", name: "Đen trắng" },
  { fg: "#fe2c55", bg: "#ffffff", name: "Hồng" },
  { fg: "#0b0b0e", bg: "#25f4ee", name: "Cyan" },
  { fg: "#5b21b6", bg: "#ffffff", name: "Tím" },
];

const HEX = /^#[0-9a-fA-F]{6}$/;

export default function QrPage() {
  const [text, setText] = useState("");
  const [fg, setFg] = useState("#000000");
  const [bg, setBg] = useState("#ffffff");
  const [size, setSize] = useState(512);
  const [margin, setMargin] = useState(2);
  const [level, setLevel] = useState<Level>("M");
  const [src, setSrc] = useState("");
  const [error, setError] = useState("");
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [copied, setCopied] = useState(false);
  const seq = useRef(0);

  // Các link của bạn để điền nhanh vào ô nhập.
  useEffect(() => {
    api<LinkItem[]>("links")
      .then(setLinks)
      .catch(() => {});
  }, []);

  const validColors = HEX.test(fg) && HEX.test(bg);
  // Độ tương phản thấp thì máy quét khó đọc: cảnh báo khi màu mã sáng hơn màu nền.
  const lowContrast = useMemo(() => {
    if (!validColors) return false;
    const lum = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const a = lum(fg);
    const b = lum(bg);
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    return ratio < 3 || a > b; // mã phải tối hơn nền để quét chắc chắn
  }, [fg, bg, validColors]);

  useEffect(() => {
    const value = text.trim();
    if (!value || !validColors) {
      setSrc("");
      setError("");
      return;
    }
    const id = ++seq.current;
    QRCode.toDataURL(value, { width: size, margin, errorCorrectionLevel: level, color: { dark: fg, light: bg } })
      .then((d) => {
        if (id === seq.current) {
          setSrc(d);
          setError("");
        }
      })
      .catch(() => {
        if (id === seq.current) {
          setSrc("");
          setError("Nội dung quá dài để tạo mã QR ở mức sửa lỗi này. Hãy rút ngắn nội dung hoặc chọn mức sửa lỗi thấp hơn.");
        }
      });
  }, [text, fg, bg, size, margin, level, validColors]);

  const shortUrl = (l: LinkItem) => shortUrlOf(l, window.location.host);

  async function copyImage() {
    if (!src) return;
    try {
      const blob = await (await fetch(src)).blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    } catch {
      await copyText(text.trim()); // trình duyệt không cho chép ảnh: chép nội dung thay thế
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const colorInput = (label: string, value: string, set: (v: string) => void) => (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={HEX.test(value) ? value : "#000000"}
          onChange={(e) => set(e.target.value)}
          className="w-11 h-10 rounded-lg bg-zinc-900 border border-zinc-700 cursor-pointer p-1"
          aria-label={label}
        />
        <input
          className={`${inputCls} font-mono text-xs`}
          value={value}
          onChange={(e) => set(e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`)}
          maxLength={7}
        />
      </div>
    </div>
  );

  return (
    <>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Tạo mã QR tùy chỉnh</h1>
        <p className="text-xs sm:text-sm text-zinc-400">Tạo mã QR cho bất kỳ đường dẫn hay nội dung nào, chọn màu, kích thước và tải ảnh PNG.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 space-y-6">
          <Card title="Nội dung">
            <div className="space-y-3">
              <div>
                <Label>Đường dẫn hoặc văn bản</Label>
                <textarea
                  className={`${inputCls} h-24 resize-y`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="https://link.metus.vn/abc12345"
                />
              </div>
              {links.length > 0 && (
                <div>
                  <Label>Hoặc chọn nhanh một link của bạn</Label>
                  <select
                    className={`${inputCls} cursor-pointer`}
                    value=""
                    onChange={(e) => {
                      const l = links.find((x) => x.id === e.target.value);
                      if (l) setText(shortUrl(l));
                    }}
                  >
                    <option value="">— Chọn link —</option>
                    {links.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title.slice(0, 50)} · {l.code}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </Card>

          <Card title="Tùy chỉnh">
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                {colorInput("Màu mã", fg, setFg)}
                {colorInput("Màu nền", bg, setBg)}
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setFg(p.fg);
                      setBg(p.bg);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
                  >
                    <span className="w-4 h-4 rounded border border-zinc-600" style={{ background: `linear-gradient(135deg, ${p.fg} 50%, ${p.bg} 50%)` }} />
                    {p.name}
                  </button>
                ))}
              </div>
              {!validColors && <p className="text-[11px] text-red-400">Màu phải có dạng #RRGGBB, ví dụ #fe2c55.</p>}
              {validColors && lowContrast && (
                <p className="text-[11px] text-amber-300">
                  Màu mã nên tối hơn màu nền và đủ tương phản, nếu không nhiều ứng dụng quét sẽ không đọc được.
                </p>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Kích thước: {size} × {size} px</Label>
                  <input type="range" min={128} max={1024} step={64} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full accent-pink-500" />
                </div>
                <div>
                  <Label>Viền trắng quanh mã: {margin} ô</Label>
                  <input type="range" min={0} max={8} step={1} value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="w-full accent-pink-500" />
                </div>
              </div>

              <div>
                <Label>Mức sửa lỗi</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {LEVELS.map((l) => (
                    <button
                      key={l.key}
                      type="button"
                      onClick={() => setLevel(l.key)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        level === l.key ? "border-tiktok-cyan bg-tiktok-cyan/10" : "border-zinc-800 bg-black/30 hover:border-zinc-700"
                      }`}
                    >
                      <div className="text-xs font-bold">{l.label}</div>
                      <div className="text-[10px] text-zinc-500">{l.note}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 lg:sticky lg:top-24">
          <Card title="Xem trước">
            <div className="space-y-4 text-center">
              <div
                className="mx-auto w-full max-w-[280px] aspect-square rounded-2xl border border-zinc-800 flex items-center justify-center overflow-hidden"
                style={{ background: validColors ? bg : "#141419" }}
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="Mã QR" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xs text-zinc-500 px-6">{text.trim() ? "Đang tạo…" : "Nhập nội dung để xem mã QR"}</span>
                )}
              </div>
              <ErrorBox message={error} />
              <div className="flex flex-wrap justify-center gap-2">
                <a
                  href={src || undefined}
                  download={`qr-${size}px.png`}
                  className={`${btnGhost} ${src ? "" : "pointer-events-none opacity-40"}`}
                >
                  Tải ảnh PNG
                </a>
                <button className={btnGhost} onClick={copyImage} disabled={!src}>
                  {copied ? "Đã chép ✓" : "Sao chép ảnh"}
                </button>
              </div>
              <p className="text-[11px] text-zinc-500">Ảnh tải về có kích thước {size} × {size} px. Hãy thử quét bằng điện thoại trước khi in.</p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
