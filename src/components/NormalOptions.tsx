"use client";

import { useState } from "react";
import { ChevronDown, Settings2 } from "lucide-react";
import { inputCls, Label } from "./ui";

/** Tùy chọn của link rút gọn thường (theo mẫu: chuyển hướng, URL tùy chỉnh, mô tả, thẻ meta). */
export type NormalOpts = {
  redirectType: "direct" | "interstitial";
  alias: string;
  note: string;
  title: string;
  description: string;
  image: string;
};

export const EMPTY_NORMAL: NormalOpts = {
  redirectType: "interstitial",
  alias: "",
  note: "",
  title: "",
  description: "",
  image: "",
};

/** Phần body gửi lên API từ tùy chọn (bỏ trường rỗng). */
export function normalBody(o: NormalOpts) {
  return {
    redirectType: o.redirectType,
    ...(o.alias.trim() && { alias: o.alias.trim() }),
    ...(o.note.trim() && { note: o.note.trim() }),
    ...(o.title.trim() && { title: o.title.trim() }),
    // Thẻ xem trước chỉ có tác dụng với trang trung gian.
    ...(o.redirectType === "interstitial" && o.description.trim() && { description: o.description.trim() }),
    ...(o.redirectType === "interstitial" && o.image.trim() && { image: o.image.trim() }),
  };
}

function Section({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <p className="text-[11px] text-zinc-500 mb-1.5">{hint}</p>
      {children}
    </div>
  );
}

export function NormalOptions({
  value,
  onChange,
  prefix,
  disabled,
}: {
  value: NormalOpts;
  onChange: (v: NormalOpts) => void;
  /** Phần đầu của đường dẫn rút gọn hiển thị trước ô tên tùy chỉnh, ví dụ "link.metus.vn/s/". */
  prefix: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const set = <K extends keyof NormalOpts>(k: K, v: NormalOpts[K]) => onChange({ ...value, [k]: v });
  const direct = value.redirectType === "direct";

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Section label="Chuyển hướng" hint="Chọn cách chuyển hướng khi bấm vào link rút gọn">
          <select
            className={`${inputCls} cursor-pointer`}
            value={value.redirectType}
            disabled={disabled}
            onChange={(e) => set("redirectType", e.target.value as NormalOpts["redirectType"])}
          >
            <option value="interstitial">Trang trung gian (có thẻ xem trước)</option>
            <option value="direct">Trực tiếp</option>
          </select>
        </Section>

        <Section label="Tùy chỉnh URL" hint="Đặt tên riêng thay cho mã ngẫu nhiên (3–32 ký tự: chữ, số, - và _)">
          <div className="flex items-center rounded-xl bg-zinc-900 border border-zinc-700 focus-within:border-tiktok-cyan overflow-hidden">
            <span className="px-2.5 text-[11px] font-mono text-zinc-500 border-r border-zinc-700 py-2.5 whitespace-nowrap">{prefix}</span>
            <input
              className="w-full px-2.5 py-2.5 bg-transparent outline-none text-sm font-mono"
              value={value.alias}
              disabled={disabled}
              onChange={(e) => set("alias", e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
              maxLength={32}
              placeholder="khuyen-mai-11-11"
            />
          </div>
        </Section>
      </div>

      <Section label="Mô tả" hint="Ghi chú nội bộ để phân biệt với các link khác của bạn (không hiển thị cho người bấm)">
        <input
          className={inputCls}
          value={value.note}
          disabled={disabled}
          onChange={(e) => set("note", e.target.value)}
          maxLength={200}
          placeholder="Nhập mô tả của bạn ở đây"
        />
      </Section>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
      >
        <Settings2 className="w-4 h-4" />
        <span>Tùy chỉnh thẻ xem trước (Meta Tags)</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="rounded-xl border border-zinc-800 bg-black/30 overflow-hidden">
          <div className="px-4 py-3 bg-zinc-900/70 flex items-center justify-between">
            <span className="text-sm font-bold">Meta Tags</span>
            <button
              type="button"
              className="px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
              onClick={() => onChange({ ...value, title: "", description: "", image: "" })}
            >
              Clear
            </button>
          </div>
          <div className="p-4 space-y-4">
            {direct && (
              <p className="text-[11px] text-amber-300">
                Chuyển hướng “Trực tiếp” không có trang trung gian nên mô tả và ảnh xem trước không được dùng. Chọn “Trang trung gian”
                để thẻ xem trước hiển thị khi chia sẻ.
              </p>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Tiêu đề meta</Label>
                <input className={inputCls} value={value.title} disabled={disabled} onChange={(e) => set("title", e.target.value)} maxLength={200} placeholder="Nhập tiêu đề meta tùy chỉnh của bạn" />
              </div>
              <div>
                <Label>Mô tả meta</Label>
                <input
                  className={inputCls}
                  value={value.description}
                  disabled={disabled || direct}
                  onChange={(e) => set("description", e.target.value)}
                  maxLength={300}
                  placeholder="Nhập mô tả meta tùy chỉnh của bạn"
                />
              </div>
            </div>
            <div>
              <Label>Banner tùy chỉnh (đường dẫn ảnh https)</Label>
              <input
                className={inputCls}
                value={value.image}
                disabled={disabled || direct}
                onChange={(e) => set("image", e.target.value)}
                placeholder="https://… (ảnh PNG hoặc JPEG)"
              />
              {value.image.trim() && !direct && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={value.image.trim()} alt="Xem trước banner" className="mt-2 h-28 rounded-lg border border-zinc-800 object-cover" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
