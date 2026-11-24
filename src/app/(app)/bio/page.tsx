"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ImagePlus } from "lucide-react";
import { api, copyText } from "@/lib/api";
import { BIO_TEMPLATES, BioView, type BioData, type BioTemplate } from "@/components/BioView";
import { btnGhost, btnPrimary, ErrorBox, inputCls, Label } from "@/components/ui";

const cardCls = "bg-[#141419] border border-zinc-800 rounded-2xl";
const MAX_IMG = 500 * 1024;
const MAX_ITEMS = 20;

type Saved = BioData & { slug: string; published: boolean; views?: number };
type Mine = { bio: Saved | null; canPublish: boolean };

const SAMPLE: Saved = {
  slug: "",
  template: "neon",
  name: "Tên của bạn",
  handle: "@ten.cua.ban",
  avatar: "",
  description: "🔥 Tổng hợp deal hời mỗi ngày\n👇 Bấm link bên dưới để mở thẳng App nhận mã giảm giá!",
  buttons: [{ title: "Link sản phẩm mới", url: "https://" }],
  products: [],
  published: false,
};

/** Tải ảnh PNG/JPEG ≤ 500KB lên máy chủ, trả về đường dẫn https công khai. */
async function uploadImage(file: File): Promise<string> {
  if (file.type !== "image/png" && file.type !== "image/jpeg") throw new Error("Ảnh phải là PNG hoặc JPEG");
  if (file.size > MAX_IMG) throw new Error("Ảnh tối đa 500KB");
  const data = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Không đọc được ảnh"));
    r.readAsDataURL(file);
  });
  return (await api<{ url: string }>("links/banner", { method: "POST", body: { data } })).url;
}

export default function BioPage() {
  const [bio, setBio] = useState<Saved>(SAMPLE);
  const [canPublish, setCanPublish] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [upBusy, setUpBusy] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [copied, setCopied] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<Mine>("link-bios/mine")
      .then((r) => {
        setCanPublish(r.canPublish);
        if (r.bio) setBio({ ...SAMPLE, ...r.bio });
        setLoaded(true);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Không tải được trang Bio");
        setLoaded(true);
      });
  }, []);

  const set = <K extends keyof Saved>(k: K, v: Saved[K]) => setBio((b) => ({ ...b, [k]: v }));
  const setBtn = (i: number, k: "title" | "url", v: string) => set("buttons", bio.buttons.map((b, j) => (j === i ? { ...b, [k]: v } : b)));
  const setProd = (i: number, k: "title" | "price" | "image" | "url", v: string) =>
    set("products", bio.products.map((p, j) => (j === i ? { ...p, [k]: v } : p)));

  async function pickImage(file: File | undefined, apply: (url: string) => void, id: string) {
    if (!file) return;
    setUpBusy(id);
    setError("");
    try {
      apply(await uploadImage(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được ảnh");
    } finally {
      setUpBusy("");
    }
  }

  async function save(publish: boolean) {
    setBusy(true);
    setError("");
    setOk("");
    try {
      const body = {
        slug: bio.slug.trim().toLowerCase(),
        template: bio.template,
        name: bio.name,
        handle: bio.handle,
        avatar: bio.avatar,
        description: bio.description,
        buttons: bio.buttons.filter((b) => b.url.trim() && b.url.trim() !== "https://"),
        products: bio.products.filter((p) => p.url.trim() && p.url.trim() !== "https://"),
        published: publish,
      };
      const saved = await api<Saved>("link-bios/mine", { method: "PUT", body });
      setBio({ ...SAMPLE, ...saved });
      setOk(publish ? "Đã lưu và xuất bản trang Bio." : "Đã lưu bản nháp (chưa xuất bản).");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không lưu được");
    } finally {
      setBusy(false);
    }
  }

  const host = typeof window !== "undefined" ? window.location.host : "link.metus.vn";
  const publicUrl = bio.slug ? `https://${host}/bio/${bio.slug.toLowerCase()}` : "";
  const tpl = BIO_TEMPLATES.find((t) => t.key === bio.template) ?? BIO_TEMPLATES[0];

  if (!loaded) return <div className={`${cardCls} p-8 text-center text-sm text-zinc-500`}>Đang tải…</div>;

  return (
    <>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Trình tạo trang Bio Link</h1>
        <p className="text-xs sm:text-sm text-zinc-400">Gom tất cả link sản phẩm, mạng xã hội vào một trang duy nhất gắn trên tiểu sử TikTok.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className={`lg:col-span-7 ${cardCls} p-5 sm:p-6 space-y-5`}>
          <div className="space-y-2">
            <Label>Chọn mẫu giao diện Bio (3 mẫu)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {BIO_TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => set("template", t.key as BioTemplate)}
                  className={`p-3 rounded-xl text-left transition-all ${bio.template === t.key ? `border-2 ${t.tone}` : "border border-zinc-700 opacity-75 hover:opacity-100"}`}
                >
                  <span className={`text-xs font-extrabold block mb-1 ${bio.template === t.key ? "" : "text-zinc-200"}`}>{t.short}</span>
                  <p className="text-[11px] text-zinc-400">{t.note}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Địa chỉ trang Bio</Label>
            <div className="flex items-stretch rounded-xl border border-zinc-700 bg-black/30 overflow-hidden focus-within:border-tiktok-cyan">
              <span className="px-3 flex items-center text-[11px] sm:text-xs font-mono text-zinc-500 border-r border-zinc-700 bg-zinc-900/60 shrink-0">{host}/bio/</span>
              <input
                className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm outline-none font-mono"
                value={bio.slug}
                onChange={(e) => set("slug", e.target.value.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 32))}
                placeholder="ten-cua-ban"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">3-32 ký tự: chữ, số, gạch ngang. Mỗi người một trang.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Tên hiển thị</Label>
              <input className={inputCls} maxLength={60} value={bio.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <Label>TikTok handle</Label>
              <input className={inputCls} maxLength={40} value={bio.handle} onChange={(e) => set("handle", e.target.value)} placeholder="@ten.cua.ban" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Ảnh avatar trang Bio</Label>
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <input className={`${inputCls} flex-1 font-mono text-xs`} value={bio.avatar} onChange={(e) => set("avatar", e.target.value.trim())} placeholder="Dán link ảnh (https://…) hoặc tải ảnh lên" />
              <div className="flex gap-2">
                <button type="button" onClick={() => avatarInput.current?.click()} disabled={upBusy === "avatar"} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-tiktok-cyan/15 text-tiktok-cyan border border-tiktok-cyan/30 hover:bg-tiktok-cyan/25 text-xs font-bold shrink-0 disabled:opacity-50">
                  <ImagePlus className="w-3.5 h-3.5" />
                  {upBusy === "avatar" ? "Đang tải…" : "Tải ảnh lên"}
                </button>
                <button type="button" onClick={() => set("avatar", "")} className="px-3 py-2 rounded-xl bg-zinc-800 text-xs font-semibold hover:text-red-400 shrink-0">
                  Mặc định
                </button>
                <input ref={avatarInput} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { void pickImage(e.target.files?.[0], (u) => set("avatar", u), "avatar"); e.target.value = ""; }} />
              </div>
            </div>
          </div>

          <div>
            <Label>Giới thiệu ngắn</Label>
            <textarea className={`${inputCls} h-20 resize-none`} maxLength={300} value={bio.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          <div className="pt-2 border-t border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Các nút liên kết</span>
              <button type="button" disabled={bio.buttons.length >= MAX_ITEMS} onClick={() => set("buttons", [...bio.buttons, { title: "Link sản phẩm mới", url: "https://" }])} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-tiktok-cyan/15 text-tiktok-cyan disabled:opacity-40">
                + Thêm nút
              </button>
            </div>
            {bio.buttons.length === 0 && <p className="text-xs text-zinc-500">Chưa có nút nào.</p>}
            {bio.buttons.map((b, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input className={`${inputCls} flex-1 py-1.5 text-xs`} maxLength={60} value={b.title} onChange={(e) => setBtn(i, "title", e.target.value)} placeholder="Tên nút" />
                <input className={`${inputCls} flex-1 py-1.5 text-xs font-mono`} value={b.url} onChange={(e) => setBtn(i, "url", e.target.value)} placeholder="https://…" />
                <button type="button" onClick={() => set("buttons", bio.buttons.filter((_, j) => j !== i))} aria-label="Xóa nút" className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg text-xs">
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-zinc-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-sm font-bold block">Sản phẩm nổi bật (ảnh + tiêu đề + giá + link)</span>
                <span className="text-[11px] text-zinc-500">Hiển thị thẻ sản phẩm kèm ảnh và giá ngay trên trang Bio</span>
              </div>
              <button type="button" disabled={bio.products.length >= MAX_ITEMS} onClick={() => set("products", [...bio.products, { title: "Sản phẩm hot", price: "129.000đ", image: "", url: "https://" }])} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-tiktok-pink/15 text-tiktok-pink border border-tiktok-pink/30 hover:bg-tiktok-pink/25 shrink-0 disabled:opacity-40">
                + Thêm sản phẩm
              </button>
            </div>
            {bio.products.length === 0 && <div className="text-xs text-zinc-500 p-3 rounded-xl border border-dashed border-zinc-800 text-center">Chưa có sản phẩm nào. Nhấn “+ Thêm sản phẩm” để thêm ảnh, tiêu đề, giá và link.</div>}
            {bio.products.map((p, i) => (
              <div key={i} className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-tiktok-cyan">Sản phẩm #{i + 1}</span>
                  <button type="button" onClick={() => set("products", bio.products.filter((_, j) => j !== i))} className="text-[11px] text-red-400 hover:underline">
                    Xóa sản phẩm
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input className={`${inputCls} sm:col-span-8 py-1.5 text-xs`} maxLength={120} value={p.title} onChange={(e) => setProd(i, "title", e.target.value)} placeholder="Tiêu đề sản phẩm…" />
                  <input className={`${inputCls} sm:col-span-4 py-1.5 text-xs font-mono`} maxLength={30} value={p.price} onChange={(e) => setProd(i, "price", e.target.value)} placeholder="Giá (vd: 149k)" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <input className={`${inputCls} sm:col-span-9 py-1.5 text-xs font-mono`} value={p.image} onChange={(e) => setProd(i, "image", e.target.value.trim())} placeholder="Link ảnh sản phẩm (https://…)" />
                  <label className="sm:col-span-3 cursor-pointer text-center py-1.5 px-2 rounded-lg bg-zinc-800 hover:bg-tiktok-cyan/20 text-[11px] font-semibold truncate">
                    {upBusy === `p${i}` ? "Đang tải…" : "Chọn ảnh"}
                    <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { void pickImage(e.target.files?.[0], (u) => setProd(i, "image", u), `p${i}`); e.target.value = ""; }} />
                  </label>
                </div>
                <input className={`${inputCls} py-1.5 text-xs font-mono`} value={p.url} onChange={(e) => setProd(i, "url", e.target.value)} placeholder="Link sản phẩm (https://shopee.vn/… hoặc https://vt.tiktok.com/…)" />
              </div>
            ))}
          </div>

          <ErrorBox message={error} />
          {ok && <p className="text-xs text-emerald-400">{ok}</p>}

          {!canPublish && (
            <p className="text-xs text-amber-400">
              Gói Miễn phí chỉ lưu được bản nháp. Để xuất bản trang Bio công khai, hãy{" "}
              <Link href="/plans" className="underline font-semibold">
                nâng cấp gói
              </Link>
              .
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" onClick={() => void save(true)} disabled={busy || !canPublish || !bio.slug.trim()} className={`${btnPrimary} flex-1`}>
              {busy ? "Đang lưu…" : "Lưu & Xuất bản Bio"}
            </button>
            <button type="button" onClick={() => void save(false)} disabled={busy || !bio.slug.trim()} className={btnGhost}>
              Lưu nháp
            </button>
            {bio.published && publicUrl && (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    await copyText(publicUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 text-sm font-semibold"
                >
                  {copied ? "Đã chép ✓" : "Copy link Bio"}
                </button>
                <a href={publicUrl} target="_blank" rel="noreferrer" className="px-4 py-2.5 rounded-xl bg-tiktok-cyan/15 text-tiktok-cyan text-sm font-semibold">
                  Mở trang Bio
                </a>
              </>
            )}
          </div>
          {bio.published && <p className="text-[11px] text-zinc-500">Trạng thái: đã xuất bản · {bio.views ?? 0} lượt xem · {publicUrl}</p>}
        </div>

        <div className="lg:col-span-5 flex flex-col items-center space-y-3">
          <div className="text-xs font-semibold text-zinc-400">
            Xem trước trực tiếp: <strong className="text-tiktok-cyan">{tpl.label}</strong>
          </div>
          <div className="w-[310px] h-[600px] rounded-[42px] p-3 bg-zinc-900 border-2 border-zinc-700 shadow-2xl relative">
            <div className="w-24 h-5 bg-black rounded-full mx-auto absolute top-5 left-1/2 -translate-x-1/2 z-10" />
            <div className="w-full h-full rounded-[32px] overflow-y-auto overflow-x-hidden [scrollbar-width:none]">
              <BioView bio={bio} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
