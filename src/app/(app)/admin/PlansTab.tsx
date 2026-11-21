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
  prices: "",
  systemDomains: "",
  maxCustomDomains: 0,
  isActive: true,
};

/** "1:99000, 3:249000" -> [{months:1, price:99000}, ...] */
function parsePrices(text: string): PricePoint[] {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [m, p] = s.split(":").map((x) => Number(x.trim()));
      return { months: m, price: p };
    });
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
      prices: p.prices.map((x) => `${x.months}:${x.price}`).join(", "),
      systemDomains: p.systemDomains.join(", "),
      maxCustomDomains: p.maxCustomDomains,
      isActive: p.isActive,
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
    const prices = parsePrices(form.prices);
    if (prices.some((p) => !Number.isInteger(p.months) || !Number.isInteger(p.price))) {
      setError('Giá nhập theo dạng "tháng:giá", ví dụ 1:99000, 3:249000');
      setBusy(false);
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      limit: Number(form.limit),
      period: form.period,
      prices,
      systemDomains: form.systemDomains
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
      maxCustomDomains: Number(form.maxCustomDomains),
      isActive: form.isActive,
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
    if (!confirm(`Ngừng bán gói ${p.name}? Người đang dùng vẫn giữ gói đến khi hết hạn.`)) return;
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
              <Label>Số link mỗi chu kỳ</Label>
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
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Giá theo thời hạn (tháng:giá, cách nhau dấu phẩy; để trống = không bán)</Label>
              <input
                className={inputCls}
                value={form.prices}
                onChange={(e) => set("prices", e.target.value)}
                placeholder="1:99000, 3:249000, 12:899000"
              />
            </div>
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
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
            Đang bán
          </label>
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
            <div key={p.id} className="border border-gray-200 bg-gray-50/60 rounded-md p-3 flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-gray-800">{p.name}</span>
                  <span className="text-[11px] text-gray-400 font-mono">{p.code}</span>
                  {!p.isActive && <Badge tone="gray">Ngừng bán</Badge>}
                </div>
                <p className="text-xs text-gray-600">
                  {p.limit} link/{PERIOD_VI[p.period]} · domain riêng: {p.maxCustomDomains || "không"} ·{" "}
                  {p.systemDomains.length ? `domain: ${p.systemDomains.join(", ")}` : "mọi domain hệ thống"}
                </p>
                <p className="text-xs text-gray-400">
                  {p.prices.length ? p.prices.map((x) => `${x.months}th ${vnd(x.price)}`).join(" · ") : "Không bán (gói miễn phí)"}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button className={btnGhost} onClick={() => edit(p)}>
                  Sửa
                </button>
                {p.code !== "free" && p.isActive && (
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
