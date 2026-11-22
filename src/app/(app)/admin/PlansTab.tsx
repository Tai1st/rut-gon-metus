"use client";

import { useCallback, useEffect, useState } from "react";
import { api, vnd } from "@/lib/api";
import { PERIOD_VI, type Plan, type PricePoint } from "@/lib/types";
import { Badge, btnDanger, btnGhost, btnPrimary, Card, ErrorBox, inputCls, Label } from "@/components/ui";

const EMPTY = {
  code: "",
  name: "",
  description: "",
  limit: 5,
  period: "day" as Plan["period"],
  price1: "",
  disc3: 17,
  disc12: 24,
  systemDomains: "",
  maxCustomDomains: 0,
  isActive: true,
  isRecommended: false,
};

/** Giá 3 tháng / 12 tháng tính từ giá 1 tháng và % giảm, làm tròn đến nghìn đồng. */
function buildPrices(price1: number, disc3: number, disc12: number): PricePoint[] {
  if (!price1 || price1 <= 0) return [];
  const at = (months: number, disc: number) => Math.round((price1 * months * (1 - disc / 100)) / 1000) * 1000;
  return [
    { months: 1, price: price1 },
    { months: 3, price: at(3, disc3) },
    { months: 12, price: at(12, disc12) },
  ];
}

export function PlansTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setPlans(await api<Plan[]>("link-plans/admin/all"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được gói");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function edit(p: Plan) {
    setEditing(p.code);
    setForm({
      code: p.code,
      name: p.name,
      description: p.description,
      limit: p.limit,
      period: p.period,
      price1: String(p.prices.find((x) => x.months === 1)?.price ?? ""),
      disc3: p.discount3 ?? 17,
      disc12: p.discount12 ?? 24,
      systemDomains: p.systemDomains.join(", "),
      maxCustomDomains: p.maxCustomDomains,
      isActive: p.isActive,
      isRecommended: !!p.isRecommended,
    });
    setError("");
  }

  function reset() {
    setEditing(null);
    setForm(EMPTY);
    setError("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const price1 = Number(form.price1) || 0;
    if (form.price1.trim() && (!Number.isInteger(price1) || price1 < 0)) {
      setError("Giá 1 tháng phải là số nguyên không âm");
      setBusy(false);
      return;
    }
    // Chỉ gửi giá 1 tháng; backend tự tính giá 3 tháng và 1 năm theo % giảm.
    const prices: PricePoint[] = price1 > 0 ? [{ months: 1, price: price1 }] : [];
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      limit: Number(form.limit),
      period: form.period,
      prices,
      discount3: Number(form.disc3) || 0,
      discount12: Number(form.disc12) || 0,
      systemDomains: form.systemDomains
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
      maxCustomDomains: Number(form.maxCustomDomains),
      isActive: form.isActive,
      isRecommended: form.isRecommended,
    };
    try {
      if (editing) await api(`link-plans/${editing}`, { method: "PATCH", body: payload });
      else await api("link-plans", { method: "POST", body: { code: form.code.trim().toLowerCase(), ...payload } });
      reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được gói");
    } finally {
      setBusy(false);
    }
  }

  async function deactivate(p: Plan) {
    const msg =
      p.code === "free"
        ? "Tắt gói miễn phí? Người chưa mua gói sẽ KHÔNG tạo được link mới (link đã tạo vẫn hoạt động). Bật lại bằng nút Sửa, tick Đang bán."
        : `Ngừng bán gói ${p.name}? Người đang dùng vẫn giữ gói đến khi hết hạn.`;
    if (!confirm(msg)) return;
    try {
      await api(`link-plans/${p.code}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không ngừng bán được");
    }
  }

  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <Card title={editing ? `Sửa gói ${editing}` : "Tạo gói mới"}>
        <form onSubmit={save} className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label>Mã gói</Label>
              <input
                className={inputCls}
                value={form.code}
                disabled={!!editing}
                onChange={(e) => set("code", e.target.value)}
                placeholder="pro"
              />
            </div>
            <div>
              <Label>Tên gói</Label>
              <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <Label>Mô tả</Label>
              <input className={inputCls} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label>Số deeplink mỗi chu kỳ</Label>
              <input
                className={inputCls}
                type="number"
                min={1}
                value={form.limit}
                onChange={(e) => set("limit", Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Chu kỳ</Label>
              <select
                className={`${inputCls} cursor-pointer`}
                value={form.period}
                onChange={(e) => set("period", e.target.value as Plan["period"])}
              >
                <option value="day">Ngày</option>
                <option value="week">Tuần</option>
                <option value="month">Tháng</option>
              </select>
            </div>
            <div>
              <Label>Số tên miền riêng được thêm (0 = không)</Label>
              <input
                className={inputCls}
                type="number"
                min={0}
                value={form.maxCustomDomains}
                onChange={(e) => set("maxCustomDomains", Number(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <Label>Giá 1 tháng (đ, để trống = không bán)</Label>
                <input className={inputCls} type="number" min={0} step={1000} value={form.price1} onChange={(e) => set("price1", e.target.value)} placeholder="299000" />
              </div>
              <div>
                <Label>Giảm giá khi mua 3 tháng (%)</Label>
                <input className={inputCls} type="number" min={0} max={90} value={form.disc3} onChange={(e) => set("disc3", Number(e.target.value))} />
              </div>
              <div>
                <Label>Giảm giá khi mua 1 năm (%)</Label>
                <input className={inputCls} type="number" min={0} max={90} value={form.disc12} onChange={(e) => set("disc12", Number(e.target.value))} />
              </div>
            </div>
            <p className="text-xs text-zinc-400">
              {buildPrices(Number(form.price1) || 0, Number(form.disc3) || 0, Number(form.disc12) || 0).length
                ? buildPrices(Number(form.price1) || 0, Number(form.disc3) || 0, Number(form.disc12) || 0)
                    .map((x) => `${x.months === 12 ? "1 năm" : `${x.months} tháng`}: ${vnd(x.price)}`)
                    .join(" · ")
                : "Gói không bán (cấp thủ công)."}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Tên miền hệ thống gói được dùng (để trống = tất cả)</Label>
              <input
                className={inputCls}
                value={form.systemDomains}
                onChange={(e) => set("systemDomains", e.target.value)}
                placeholder="abc.com, xyz.com"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
              Đang bán
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={form.isRecommended} onChange={(e) => set("isRecommended", e.target.checked)} />
              Gắn nhãn “Khuyên chọn” trên bảng giá
            </label>
          </div>
          <ErrorBox message={error} />
          <div className="flex gap-2">
            <button className={btnPrimary} disabled={busy || !form.name.trim() || (!editing && !form.code.trim())}>
              {editing ? "Lưu thay đổi" : "Tạo gói"}
            </button>
            {editing && (
              <button type="button" className={btnGhost} onClick={reset}>
                Hủy sửa
              </button>
            )}
          </div>
        </form>
      </Card>

      <Card title={`Các gói (${plans.length})`}>
        <div className="space-y-2">
          {plans.map((p) => (
            <div key={p.id} className="border border-tiktok-border bg-black/30 rounded-xl p-3 flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-white">{p.name}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{p.code}</span>
                  {!p.isActive && <Badge tone="gray">Ngừng bán</Badge>}
                </div>
                <p className="text-xs text-slate-300">
                  {p.limit} deeplink/{PERIOD_VI[p.period]} · domain riêng: {p.maxCustomDomains || "không"} ·{" "}
                  {p.systemDomains.length ? `domain: ${p.systemDomains.join(", ")}` : "mọi domain hệ thống"}
                </p>
                <p className="text-xs text-slate-500">
                  {p.code === "free" ? "Gói miễn phí (không bán)" : p.prices.length ? p.prices.map((x) => `${x.months}th ${vnd(x.price)}`).join(" · ") : "Không bán (cấp thủ công)"}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button className={btnGhost} onClick={() => edit(p)}>
                  Sửa
                </button>
                {p.isActive && (
                  <button className={btnDanger} onClick={() => deactivate(p)}>
                    Ngừng bán
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
