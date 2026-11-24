"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, type ReactNode } from "react";

export type BioTemplate = "neon" | "glass" | "sunset";
export type BioData = {
  template: BioTemplate;
  name: string;
  handle: string;
  avatar: string;
  description: string;
  buttons: { title: string; url: string }[];
  products: { title: string; price: string; image: string; url: string }[];
};

export const BIO_TEMPLATES: { key: BioTemplate; label: string; short: string; note: string; tone: string }[] = [
  { key: "neon", label: "Mẫu 01 - Neon Dark", short: "01. Neon Dark", note: "Chuẩn TikTok tối sang trọng, nổi bật nút CTA.", tone: "border-tiktok-cyan bg-tiktok-cyan/10 text-tiktok-cyan" },
  { key: "glass", label: "Mẫu 02 - Glass Light", short: "02. Glass Light", note: "Nền sáng trong suốt, nhẹ nhàng, dễ đọc.", tone: "border-sky-400 bg-sky-400/10 text-sky-400" },
  { key: "sunset", label: "Mẫu 03 - Sunset Deal", short: "03. Sunset Deal", note: "Gam cam đỏ nóng, hợp trang săn deal.", tone: "border-amber-500 bg-amber-500/10 text-amber-500" },
];

const PLACEHOLDER = "https://placehold.co/120x120/18181D/25F4EE?text=Deal";

/** Chỉ cho phép đường dẫn http(s) (chặn javascript: và các scheme khác) trước khi gắn vào href. */
const safe = (u: string) => (/^https?:\/\//i.test(u) ? u : "#");

/** Ảnh có dự phòng: tải lỗi thì thay bằng ảnh mặc định để thẻ liên kết vẫn hiện đầy đủ, không để ô trống. */
function Img({ src, alt, className, fallback }: { src: string; alt: string; className: string; fallback: string }) {
  const [bad, setBad] = useState(false);
  useEffect(() => setBad(false), [src]);
  return <img src={bad || !src ? fallback : src} alt={alt} className={className} loading="lazy" referrerPolicy="no-referrer" onError={() => setBad(true)} />;
}

/** Ảnh đại diện: lỗi hoặc để trống thì hiện chữ cái đầu của tên. */
function Avatar({ src, initial, shape }: { src: string; initial: string; shape: string }) {
  const [bad, setBad] = useState(false);
  useEffect(() => setBad(false), [src]);
  if (!src || bad) return <>{initial}</>;
  return <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setBad(true)} className={`w-full h-full object-cover ${shape}`} />;
}

type Style = {
  screen: string;
  ring: string;
  inner: string;
  handle: string;
  desc: string;
  footer: string;
  avatarShape: string;
  card: string;
  price: string;
  link: (i: number) => string;
  linkPrefix: (i: number) => string;
};

const STYLES: Record<BioTemplate, Style> = {
  neon: {
    screen: "bg-[#0D0D11] text-white",
    ring: "bg-gradient-to-tr from-tiktok-cyan to-tiktok-pink rounded-full",
    inner: "bg-zinc-900 text-tiktok-cyan rounded-full",
    handle: "text-zinc-400",
    desc: "text-zinc-300",
    footer: "text-zinc-600",
    avatarShape: "rounded-full",
    card: "bg-zinc-900/95 border-zinc-800 text-white hover:border-tiktok-cyan/50",
    price: "text-tiktok-cyan",
    link: (i) =>
      `rounded-xl ${i === 0 ? "bg-zinc-900 border border-tiktok-cyan/60 shadow-[0_0_12px_rgba(37,244,238,0.2)]" : "bg-zinc-800/90 hover:bg-tiktok-pink/20 border border-zinc-700"} font-semibold text-white`,
    linkPrefix: () => "",
  },
  glass: {
    screen: "bg-gradient-to-b from-sky-100 via-indigo-50 to-white text-slate-900",
    ring: "bg-gradient-to-tr from-sky-400 to-indigo-500 rounded-full shadow-md",
    inner: "bg-white text-indigo-600 rounded-full",
    handle: "text-indigo-600 font-semibold",
    desc: "text-slate-600",
    footer: "text-slate-400",
    avatarShape: "rounded-full",
    card: "bg-white/90 border-indigo-200/80 text-slate-900 hover:bg-white",
    price: "text-rose-600",
    link: () => "rounded-2xl bg-white/85 hover:bg-white backdrop-blur-md border border-indigo-200/80 shadow-sm font-bold text-slate-800",
    linkPrefix: () => "",
  },
  sunset: {
    screen: "bg-gradient-to-br from-[#231118] via-[#2b1414] to-[#140c10] text-white",
    ring: "bg-gradient-to-tr from-amber-400 to-rose-500 rounded-2xl shadow-lg",
    inner: "bg-[#1e0f12] text-amber-400 rounded-[14px]",
    handle: "text-amber-400 font-semibold",
    desc: "text-rose-100/80",
    footer: "text-rose-300/40",
    avatarShape: "rounded-[14px]",
    card: "bg-white/10 border-amber-400/30 text-white hover:bg-white/15",
    price: "text-amber-400",
    link: (i) =>
      `rounded-xl ${i === 0 ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-rose-500/25 font-extrabold" : "bg-white/10 hover:bg-white/15 border border-amber-400/30 text-amber-50 font-semibold"}`,
    linkPrefix: (i) => (i === 0 ? "🔥 " : ""),
  },
};

/** Giao diện trang Bio: dùng cho khung điện thoại xem trước trong trình soạn và cho trang công khai /bio/<tên>. */
export function BioView({ bio, footer }: { bio: BioData; footer?: ReactNode }) {
  const s = STYLES[bio.template] ?? STYLES.neon;
  const initial = (bio.name || "B").trim().slice(0, 2).toUpperCase();
  return (
    <div className={`w-full min-h-full ${s.screen} pt-12 pb-6 px-4 flex flex-col items-center text-center`}>
      <div className={`w-16 h-16 p-0.5 mb-2.5 shrink-0 overflow-hidden ${s.ring}`}>
        <div className={`w-full h-full flex items-center justify-center font-extrabold overflow-hidden ${s.inner}`}>
          <Avatar src={bio.avatar} initial={initial} shape={s.avatarShape} />
        </div>
      </div>
      <h1 className="font-bold text-base">{bio.name || "Tên của bạn"}</h1>
      {bio.handle && <p className={`text-xs mb-2 ${s.handle}`}>{bio.handle}</p>}
      {bio.description && <p className={`text-[11px] whitespace-pre-line mb-4 ${s.desc}`}>{bio.description}</p>}

      <div className="w-full space-y-2.5">
        {bio.buttons.map((b, i) => (
          <a key={i} href={safe(b.url)} target="_blank" rel="noopener noreferrer nofollow" className={`block w-full py-2.5 px-3.5 text-xs transition-all truncate ${s.link(i)}`}>
            {s.linkPrefix(i)}
            {b.title || "Liên kết"}
          </a>
        ))}
      </div>

      {bio.products.length > 0 && (
        <div className="w-full space-y-2 mt-4 text-left">
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1.5">Sản phẩm nổi bật</div>
          {bio.products.map((p, i) => (
            <a key={i} href={safe(p.url)} target="_blank" rel="noopener noreferrer nofollow" className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${s.card}`}>
              <Img src={p.image} fallback={PLACEHOLDER} alt={p.title || "Sản phẩm"} className="w-11 h-11 rounded-lg object-cover shrink-0 bg-zinc-800" />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold leading-snug line-clamp-2">{p.title || "Sản phẩm"}</div>
                {p.price && <div className={`text-[11px] font-mono font-bold mt-0.5 ${s.price}`}>{p.price}</div>}
              </div>
            </a>
          ))}
        </div>
      )}

      <div className={`text-[10px] mt-6 font-mono ${s.footer}`}>{footer ?? "Metus Link Bio"}</div>
    </div>
  );
}
