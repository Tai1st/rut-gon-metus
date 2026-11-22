"use client";

import { useRef, useState } from "react";
import { ChevronDown, Globe, Hash, ImagePlus, Languages, Lock, MapPin, Plus, Settings2, Smartphone, Tag, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { COUNTRIES, DEVICES, LANGUAGES, VN_PROVINCES } from "@/lib/geo";
import type { DeviceRule, GeoRule, LangRule, UrlParam } from "@/lib/types";
import { ErrorBox, inputCls, Label } from "./ui";

/** Tùy chọn của link rút gọn thường (chuyển hướng, URL tùy chỉnh, mật khẩu, thẻ meta, quy tắc theo địa lý/thiết bị/ngôn ngữ, tham số). */
export type NormalOpts = {
  redirectType: "direct" | "interstitial";
  alias: string;
  note: string;
  password: string;
  title: string;
  description: string;
  image: string;
  geoRules: GeoRule[];
  deviceRules: DeviceRule[];
  langRules: LangRule[];
  params: UrlParam[];
};

export const EMPTY_NORMAL: NormalOpts = {
  redirectType: "interstitial",
  alias: "",
  note: "",
  password: "",
  title: "",
  description: "",
  image: "",
  geoRules: [],
  deviceRules: [],
  langRules: [],
  params: [],
};

/** Phần body gửi lên API từ tùy chọn (bỏ trường rỗng và dòng quy tắc chưa nhập đủ). */
export function cleanRules(o: NormalOpts) {
  return {
    geoRules: o.geoRules.filter((r) => r.country && r.url.trim()).map((r) => ({ country: r.country, ...(r.region && { region: r.region }), url: r.url.trim() })),
    deviceRules: o.deviceRules.filter((r) => r.device && r.url.trim()).map((r) => ({ device: r.device, url: r.url.trim() })),
    langRules: o.langRules.filter((r) => r.lang && r.url.trim()).map((r) => ({ lang: r.lang, url: r.url.trim() })),
    params: o.params.filter((p) => p.key.trim()).map((p) => ({ key: p.key.trim(), value: p.value })),
  };
}

export function normalBody(o: NormalOpts, opts: { multi?: boolean } = {}) {
  const { geoRules: geo, deviceRules: dev, langRules: lang, params } = cleanRules(o);
  return {
    redirectType: o.redirectType,
    // Tên tùy chỉnh là duy nhất nên không dùng được cho nhiều link cùng lúc.
    ...(!opts.multi && o.alias.trim() && { alias: o.alias.trim() }),
    ...(o.note.trim() && { note: o.note.trim() }),
    ...(o.password && { password: o.password }),
    ...(o.title.trim() && { title: o.title.trim() }),
    // Thẻ xem trước chỉ có tác dụng với trang trung gian.
    ...(o.redirectType === "interstitial" && o.description.trim() && { description: o.description.trim() }),
    ...(o.redirectType === "interstitial" && o.image.trim() && { image: o.image.trim() }),
    ...(geo.length && { geoRules: geo }),
    ...(dev.length && { deviceRules: dev }),
    ...(lang.length && { langRules: lang }),
    ...(params.length && { params }),
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

function IconInput({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center rounded-xl bg-zinc-900 border border-zinc-700 focus-within:border-tiktok-cyan overflow-hidden">
      <span className="pl-3 text-zinc-500 shrink-0">{icon}</span>
      {children}
    </div>
  );
}

const bareInput = "w-full px-2.5 py-2.5 bg-transparent outline-none text-sm text-white placeholder-zinc-500 disabled:opacity-50";
const selectCls = `${inputCls} cursor-pointer`;

/** Khối quy tắc có tiêu đề, mô tả và nút "Thêm". */
function RuleCard({ icon, title, hint, onAdd, disabled, children }: { icon: React.ReactNode; title: string; hint: string; onAdd: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black/30 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-bold">
          <span className="text-zinc-400">{icon}</span>
          {title}
        </div>
        <button type="button" disabled={disabled} onClick={onAdd} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold disabled:opacity-50">
          <Plus className="w-3.5 h-3.5" /> Thêm
        </button>
      </div>
      <p className="text-[11px] text-zinc-500">{hint}</p>
      {children}
    </div>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Xóa dòng" className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 shrink-0">
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

const MAX_BANNER = 500 * 1024;

export function NormalOptions({
  value,
  onChange,
  prefix,
  disabled,
  multi,
  domainField,
  hideAlias,
  passwordSlot,
}: {
  value: NormalOpts;
  onChange: (v: NormalOpts) => void;
  /** Phần đầu của đường dẫn rút gọn hiển thị trước ô tên tùy chỉnh, ví dụ "link.metus.vn/". */
  prefix: string;
  disabled?: boolean;
  /** Chế độ nhiều link: không dùng được tên tùy chỉnh. */
  multi?: boolean;
  /** Ô chọn tên miền do form cha cung cấp (nằm ở hàng đầu cùng ô Chuyển hướng). */
  domainField?: React.ReactNode;
  /** Ẩn ô tên tùy chỉnh (khi sửa link đã tạo thì không đổi được mã). */
  hideAlias?: boolean;
  /** Nội dung thêm dưới ô mật khẩu (ví dụ ô chọn gỡ mật khẩu khi sửa). */
  passwordSlot?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [upError, setUpError] = useState("");
  const [preview, setPreview] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const set = <K extends keyof NormalOpts>(k: K, v: NormalOpts[K]) => onChange({ ...value, [k]: v });
  const direct = value.redirectType === "direct";

  function patchAt<T>(key: "geoRules" | "deviceRules" | "langRules" | "params", i: number, p: Partial<T>) {
    const arr = [...(value[key] as T[])];
    arr[i] = { ...arr[i], ...p };
    set(key, arr as never);
  }
  const removeAt = (key: "geoRules" | "deviceRules" | "langRules" | "params", i: number) =>
    set(key, (value[key] as unknown[]).filter((_, k) => k !== i) as never);

  async function onFile(f: File | undefined) {
    if (!f) return;
    setUpError("");
    if (f.type !== "image/png" && f.type !== "image/jpeg") return setUpError("Banner phải là ảnh PNG hoặc JPEG");
    if (f.size > MAX_BANNER) return setUpError("Banner tối đa 500KB");
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((ok, bad) => {
        const r = new FileReader();
        r.onload = () => ok(String(r.result));
        r.onerror = () => bad(new Error("Không đọc được tệp"));
        r.readAsDataURL(f);
      });
      const res = await api<{ url: string }>("links/banner", { method: "POST", body: { data: dataUrl } });
      setPreview(dataUrl);
      set("image", res.url);
    } catch (e) {
      setUpError(e instanceof Error ? e.message : "Không tải được banner");
    } finally {
      setUploading(false);
      if (file.current) file.current.value = "";
    }
  }

  const shownImage = preview || value.image.trim();

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        {domainField}
        <Section label="Chuyển hướng" hint="Chọn cách chuyển hướng khi bấm vào link rút gọn">
          <select className={selectCls} value={value.redirectType} disabled={disabled} onChange={(e) => set("redirectType", e.target.value as NormalOpts["redirectType"])}>
            <option value="interstitial">Trang trung gian (có thẻ xem trước)</option>
            <option value="direct">Trực tiếp</option>
          </select>
        </Section>

        {!hideAlias && <Section label="Tùy chỉnh URL" hint={multi ? "Không dùng được khi rút gọn nhiều link" : "Đặt tên riêng thay cho mã ngẫu nhiên (3–32 ký tự: chữ, số, - và _)"}>
          <div className="flex items-center rounded-xl bg-zinc-900 border border-zinc-700 focus-within:border-tiktok-cyan overflow-hidden">
            <span className="px-2.5 text-[11px] font-mono text-zinc-500 border-r border-zinc-700 py-2.5 whitespace-nowrap">{prefix}</span>
            <input
              className="w-full px-2.5 py-2.5 bg-transparent outline-none text-sm font-mono text-white placeholder-zinc-500 disabled:opacity-50"
              value={multi ? "" : value.alias}
              disabled={disabled || multi}
              onChange={(e) => set("alias", e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
              maxLength={32}
              placeholder="khuyen-mai-11-11"
            />
          </div>
        </Section>}

        <Section label="Mật khẩu bảo vệ" hint="Người bấm phải nhập mật khẩu mới được chuyển tới trang đích">
          <IconInput icon={<Lock className="w-4 h-4" />}>
            <input
              className={bareInput}
              type="text"
              autoComplete="off"
              value={value.password}
              disabled={disabled}
              onChange={(e) => set("password", e.target.value)}
              maxLength={64}
              placeholder="Nhập mật khẩu tại đây (tối thiểu 4 ký tự)"
            />
          </IconInput>
          {passwordSlot}
        </Section>

        <Section label="Mô tả" hint="Ghi chú nội bộ để phân biệt với các link khác của bạn (không hiển thị cho người bấm)">
          <IconInput icon={<Tag className="w-4 h-4" />}>
            <input className={bareInput} value={value.note} disabled={disabled} onChange={(e) => set("note", e.target.value)} maxLength={200} placeholder="Nhập mô tả của bạn ở đây" />
          </IconInput>
        </Section>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
      >
        <Settings2 className="w-4 h-4" />
        <span>Tùy chỉnh</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-black/30 overflow-hidden">
            <div className="px-4 py-3 bg-zinc-900/70 flex items-center justify-between">
              <span className="text-sm font-bold">Meta Tags</span>
              <button
                type="button"
                className="px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
                onClick={() => {
                  setPreview("");
                  onChange({ ...value, title: "", description: "", image: "" });
                }}
              >
                Clear
              </button>
            </div>
            <div className="p-4 space-y-4">
              {direct && (
                <p className="text-[11px] text-amber-300">
                  Chuyển hướng “Trực tiếp” không có trang trung gian nên mô tả và ảnh xem trước không được dùng. Chọn “Trang trung gian” để thẻ xem trước hiển thị khi chia sẻ.
                </p>
              )}
              <div>
                <Label>Banner tùy chỉnh</Label>
                <div className="flex items-start gap-3">
                  <div className="w-36 h-24 rounded-lg border border-dashed border-zinc-700 bg-black/40 flex items-center justify-center text-[11px] text-zinc-500 overflow-hidden shrink-0">
                    {shownImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={shownImage} alt="Xem trước banner" className="w-full h-full object-cover" />
                    ) : (
                      "No image"
                    )}
                  </div>
                  <div className="space-y-2 min-w-0 flex-1">
                    <input ref={file} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
                    <button
                      type="button"
                      disabled={disabled || direct || uploading}
                      onClick={() => file.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold disabled:opacity-50"
                    >
                      <ImagePlus className="w-4 h-4" />
                      {uploading ? "Đang tải…" : "Tải banner"}
                    </button>
                    <p className="text-[11px] text-zinc-500">Banner phải là PNG hoặc JPEG (tối đa 500KB).</p>
                    <input
                      className={inputCls}
                      value={value.image}
                      disabled={disabled || direct}
                      onChange={(e) => {
                        setPreview("");
                        set("image", e.target.value);
                      }}
                      placeholder="hoặc dán đường dẫn ảnh https://…"
                    />
                    <ErrorBox message={upError} />
                  </div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Tiêu đề meta</Label>
                  <input className={inputCls} value={value.title} disabled={disabled} onChange={(e) => set("title", e.target.value)} maxLength={200} placeholder="Nhập tiêu đề meta tùy chỉnh của bạn" />
                </div>
                <div>
                  <Label>Mô tả meta</Label>
                  <input className={inputCls} value={value.description} disabled={disabled || direct} onChange={(e) => set("description", e.target.value)} maxLength={300} placeholder="Nhập mô tả meta tùy chỉnh của bạn" />
                </div>
              </div>
            </div>
          </div>

          <RuleCard
            icon={<MapPin className="w-4 h-4" />}
            title="Chuyển hướng theo địa lý"
            hint="Nếu bạn có các trang khác nhau cho các quốc gia khác nhau, hãy chuyển hướng người dùng đến trang đó bằng cùng một URL. Chỉ cần chọn quốc gia và nhập URL. Tỉnh/thành chỉ có tác dụng khi hệ thống nhận được vị trí chi tiết của khách."
            disabled={disabled || value.geoRules.length >= 30}
            onAdd={() => set("geoRules", [...value.geoRules, { country: "VN", url: "" }])}
          >
            {value.geoRules.map((r, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-zinc-800/80 p-3">
                <div className="grid sm:grid-cols-2 gap-2">
                  <IconInput icon={<Globe className="w-4 h-4" />}>
                    <select className={`${bareInput} cursor-pointer bg-transparent`} value={r.country} onChange={(e) => patchAt<GeoRule>("geoRules", i, { country: e.target.value, region: undefined })}>
                      {COUNTRIES.map(([c, n]) => (
                        <option key={c} value={c} className="bg-zinc-900">
                          {n}
                        </option>
                      ))}
                    </select>
                  </IconInput>
                  <IconInput icon={<MapPin className="w-4 h-4" />}>
                    <select
                      className={`${bareInput} cursor-pointer bg-transparent`}
                      value={r.region ?? ""}
                      disabled={r.country !== "VN"}
                      onChange={(e) => patchAt<GeoRule>("geoRules", i, { region: e.target.value || undefined })}
                    >
                      <option value="" className="bg-zinc-900">
                        Tất cả Tỉnh / Thành
                      </option>
                      {r.country === "VN" &&
                        VN_PROVINCES.map((p) => (
                          <option key={p} value={p} className="bg-zinc-900">
                            {p}
                          </option>
                        ))}
                    </select>
                  </IconInput>
                </div>
                <div className="flex items-center gap-2">
                  <input className={inputCls} value={r.url} onChange={(e) => patchAt<GeoRule>("geoRules", i, { url: e.target.value })} placeholder="Nhập URL để chuyển hướng người dùng đến." />
                  <RemoveBtn onClick={() => removeAt("geoRules", i)} />
                </div>
              </div>
            ))}
          </RuleCard>

          <RuleCard
            icon={<Smartphone className="w-4 h-4" />}
            title="Chuyển hướng theo thiết bị"
            hint="Nếu bạn có các trang khác nhau cho các thiết bị khác nhau (chẳng hạn như điện thoại di động, máy tính bảng, v.v.), hãy chuyển hướng người dùng đến trang đó bằng cùng một URL rút gọn. Chỉ cần chọn thiết bị và nhập URL."
            disabled={disabled || value.deviceRules.length >= 10}
            onAdd={() => {
              const used = new Set(value.deviceRules.map((r) => r.device));
              const next = DEVICES.find(([d]) => !used.has(d))?.[0] ?? "windows";
              set("deviceRules", [...value.deviceRules, { device: next, url: "" }]);
            }}
          >
            {value.deviceRules.map((r, i) => (
              <div key={i} className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] gap-2 items-center">
                <IconInput icon={<Smartphone className="w-4 h-4" />}>
                  <select className={`${bareInput} cursor-pointer bg-transparent`} value={r.device} onChange={(e) => patchAt<DeviceRule>("deviceRules", i, { device: e.target.value })}>
                    {DEVICES.map(([d, n]) => (
                      <option key={d} value={d} className="bg-zinc-900">
                        {n}
                      </option>
                    ))}
                  </select>
                </IconInput>
                <input className={inputCls} value={r.url} onChange={(e) => patchAt<DeviceRule>("deviceRules", i, { url: e.target.value })} placeholder="Nhập URL để chuyển hướng người dùng đến." />
                <RemoveBtn onClick={() => removeAt("deviceRules", i)} />
              </div>
            ))}
          </RuleCard>

          <RuleCard
            icon={<Languages className="w-4 h-4" />}
            title="Chuyển hướng theo ngôn ngữ"
            hint="Nếu bạn có các trang khác nhau cho các ngôn ngữ khác nhau, hãy chuyển hướng người dùng đến trang đó bằng cùng một URL. Chỉ cần chọn ngôn ngữ và nhập URL."
            disabled={disabled || value.langRules.length >= 30}
            onAdd={() => set("langRules", [...value.langRules, { lang: "en", url: "" }])}
          >
            {value.langRules.map((r, i) => (
              <div key={i} className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] gap-2 items-center">
                <IconInput icon={<Languages className="w-4 h-4" />}>
                  <select className={`${bareInput} cursor-pointer bg-transparent`} value={r.lang} onChange={(e) => patchAt<LangRule>("langRules", i, { lang: e.target.value })}>
                    {LANGUAGES.map(([c, n]) => (
                      <option key={c} value={c} className="bg-zinc-900">
                        {n}
                      </option>
                    ))}
                  </select>
                </IconInput>
                <input className={inputCls} value={r.url} onChange={(e) => patchAt<LangRule>("langRules", i, { url: e.target.value })} placeholder="Nhập URL để chuyển hướng người dùng đến." />
                <RemoveBtn onClick={() => removeAt("langRules", i)} />
              </div>
            ))}
          </RuleCard>

          <RuleCard
            icon={<Hash className="w-4 h-4" />}
            title="Trình tạo tham số"
            hint="Bạn có thể thêm các tham số tùy chỉnh như UTM vào liên kết ở trên bằng cách sử dụng công cụ này. Chọn tên tham số và sau đó chỉ định một giá trị. Chúng sẽ được thêm vào trong quá trình chuyển hướng."
            disabled={disabled || value.params.length >= 10}
            onAdd={() => set("params", [...value.params, { key: "", value: "" }])}
          >
            {value.params.map((p, i) => (
              <div key={i} className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-center">
                <input className={inputCls} value={p.key} maxLength={40} onChange={(e) => patchAt<UrlParam>("params", i, { key: e.target.value.replace(/[^A-Za-z0-9_.-]/g, "") })} placeholder="Tên tham số (vd: utm_source)" />
                <input className={inputCls} value={p.value} maxLength={200} onChange={(e) => patchAt<UrlParam>("params", i, { value: e.target.value })} placeholder="Giá trị tham số" />
                <RemoveBtn onClick={() => removeAt("params", i)} />
              </div>
            ))}
          </RuleCard>
        </div>
      )}
    </div>
  );
}
