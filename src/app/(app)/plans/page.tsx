"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, CheckCircle2, Crown, ShieldCheck, X } from "lucide-react";
import { api, copyText, fmtDate, vnd } from "@/lib/api";
import { useMe } from "@/components/AppShell";
import { PERIOD_VI, type Order, type Plan, type Quota } from "@/lib/types";
import { Badge, btnDanger, btnGhost, btnPrimary, ErrorBox, Modal } from "@/components/ui";

const STATUS = {
  pending: { tone: "amber", label: "Chờ thanh toán" },
  paid: { tone: "green", label: "Đã thanh toán" },
  cancelled: { tone: "gray", label: "Đã hủy" },
} as const;

/** Nhãn chu kỳ: 1 tháng -> "01 tháng", 12 tháng -> "01 năm", còn lại "N tháng". */
function cycleLabel(m: number) {
  if (m === 12) return "01 năm";
  if (m % 12 === 0) return `${String(m / 12).padStart(2, "0")} năm`;
  return `${String(m).padStart(2, "0")} tháng`;
}

const priceAt = (p: Plan, m: number) => p.prices.find((x) => x.months === m)?.price;

/** Giá gốc (mua lẻ từng tháng) và phần trăm tiết kiệm của một kỳ dài so với mua từng tháng. */
function saving(p: Plan, m: number) {
  const base = priceAt(p, 1);
  const price = priceAt(p, m);
  if (!base || !price || m <= 1) return null;
  const original = base * m;
  const pct = Math.round((1 - price / original) * 100);
  return pct > 0 ? { original, pct } : null;
}

export default function PlansPage() {
  const me = useMe();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cycleSel, setCycleSel] = useState<number | null>(null);
  const [confirmPlan, setConfirmPlan] = useState<Plan | null>(null);
  const [open, setOpen] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, q, o] = await Promise.all([
        api<Plan[]>("link-plans"),
        api<Quota>("links/quota"),
        api<Order[]>("link-orders"),
      ]);
      setPlans(p);
      setQuota(q);
      setOrders(o);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const current = quota?.plan.code;
  const free = plans.find((p) => p.code === "free");
  const paid = useMemo(() => plans.filter((p) => p.code !== "free"), [plans]);
  // Các chu kỳ có bán (gộp từ mọi gói), từ ngắn đến dài.
  const cycles = useMemo(() => [...new Set(paid.flatMap((p) => p.prices.map((x) => x.months)))].sort((a, b) => a - b), [paid]);
  const cycle = cycleSel && cycles.includes(cycleSel) ? cycleSel : (cycles[0] ?? null);
  // Mức giảm lớn nhất của từng kỳ (để hiện huy hiệu trên nút chọn chu kỳ).
  const bestSaving = (m: number) => Math.max(0, ...paid.map((p) => saving(p, m)?.pct ?? 0));

  // Gói đang dùng có thể đã ngừng bán nên không còn trong danh sách: vẫn phải hiện để người dùng thấy.
  const currentMissing = !!quota && quota.plan.code !== "free" && !plans.some((p) => p.code === quota.plan.code);
  const cards: (Plan | "missing")[] = [...(free ? [free] : []), ...(currentMissing ? (["missing"] as const) : []), ...paid];

  async function startPayment() {
    if (!confirmPlan || !cycle) return;
    setBusy(true);
    setError("");
    try {
      const order = await api<Order>("link-orders", { method: "POST", body: { planCode: confirmPlan.code, months: cycle } });
      setConfirmPlan(null);
      setOpen(order);
      await load();
    } catch (e) {
      setConfirmPlan(null);
      setError(e instanceof Error ? e.message : "Không tạo được đơn");
    } finally {
      setBusy(false);
    }
  }

  async function reopen(o: Order) {
    try {
      setOpen(await api<Order>(`link-orders/${o.code}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không mở được đơn");
    }
  }

  async function cancel(o: Order) {
    if (!confirm(`Hủy đơn ${o.code}?`)) return;
    try {
      await api(`link-orders/${o.code}/cancel`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không hủy được");
    }
  }

  const features = (p: Plan) => [
    `${p.limit} link rút gọn / ${PERIOD_VI[p.period]}`,
    "Link sản phẩm và chiến dịch TikTok Shop",
    "Tự mở ứng dụng TikTok trên điện thoại",
    p.maxCustomDomains > 0 ? `Thêm tối đa ${p.maxCustomDomains} tên miền riêng` : "Dùng tên miền của hệ thống",
    ...(p.code === "free" ? [] : ["Thanh toán QR, tự động kích hoạt gói"]),
  ];

  return (
    <div className="space-y-10 py-2">
      {/* Tiêu đề + bộ chọn chu kỳ */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-semibold">
          <Crown className="w-3.5 h-3.5 text-amber-500" />
          <span>Nâng cấp gói để tạo nhiều link hơn</span>
        </div>

        <p className="text-sm sm:text-base text-zinc-400 font-medium">
          Giá cả minh bạch, không có phí ẩn để bạn luôn biết mình sẽ trả bao nhiêu.
        </p>

        {cycles.length > 0 && (
          <div className="flex justify-center pt-1">
            <div className="relative inline-flex flex-wrap items-center justify-center gap-1 p-1.5 rounded-full bg-[#16161D] border border-zinc-800 shadow-lg shadow-black/40 select-none">
              {cycles.map((m) => {
                const on = m === cycle;
                const pct = bestSaving(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCycleSel(m)}
                    className={`px-5 sm:px-7 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-1.5 ${
                      on ? "bg-violet-600 text-white shadow-md" : "text-zinc-300 hover:text-white"
                    }`}
                  >
                    <span>{cycleLabel(m)}</span>
                    {pct > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white">-{pct}%</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white pt-2">Chọn gói phù hợp với bạn</h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          {cycle ? (
            <>
              Đang hiển thị bảng giá theo chu kỳ <strong className="text-violet-400">{cycleLabel(cycle)}</strong> • Gia hạn cùng gói sẽ cộng thêm thời hạn.
            </>
          ) : (
            "Hiện chưa có gói trả phí nào được mở bán."
          )}
        </p>
        {quota && (
          <p className="text-xs text-zinc-500">
            Gói hiện tại của <span className="font-mono text-zinc-300">{me.username}</span>:{" "}
            <strong className={quota.disabled ? "text-red-400" : "text-emerald-400"}>{quota.plan.name.toUpperCase()}</strong>
            {quota.disabled
              ? " (gói miễn phí đã tắt, cần mua gói để tạo link mới)"
              : ` • ${quota.plan.expiresAt ? `hết hạn ${fmtDate(quota.plan.expiresAt)}` : "không hết hạn"}`}
          </p>
        )}
      </div>

      <ErrorBox message={error} />

      {/* Lưới thẻ gói */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {cards.map((c) => {
          if (c === "missing") {
            return (
              <div key="missing" className="bg-[#141419] border-2 border-emerald-500/60 rounded-3xl p-6 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-extrabold">{quota?.plan.name}</h3>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-500">Đang sử dụng</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Gói này hiện không còn mở bán, bạn vẫn dùng đến khi hết hạn.
                  </p>
                  <ul className="space-y-2.5 text-xs text-zinc-300">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{quota?.limit === null ? "Không giới hạn link" : `${quota?.limit} link rút gọn / ${quota ? PERIOD_VI[quota.period] : ""}`}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{quota?.plan.expiresAt ? `Hết hạn ${fmtDate(quota.plan.expiresAt)}` : "Không hết hạn"}</span>
                    </li>
                  </ul>
                </div>
                <button disabled className="w-full py-3 px-4 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-bold text-xs cursor-default">
                  ✓ Đang kích hoạt gói này
                </button>
              </div>
            );
          }

          const p = c;
          const isFree = p.code === "free";
          const isCurrent = current === p.code && !(isFree && quota?.disabled);
          const price = !isFree && cycle ? priceAt(p, cycle) : undefined;
          const sv = !isFree && cycle ? saving(p, cycle) : null;
          const sellable = !isFree && !!price && !!cycle;

          return (
            <div
              key={p.id}
              className={`bg-[#141419] rounded-3xl p-6 flex flex-col justify-between space-y-6 transition-all ${
                isCurrent ? "border-2 border-emerald-500/60" : "border border-zinc-800 hover:border-violet-500/50"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-extrabold">{p.name}</h3>
                  {isCurrent ? (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-500">Đang sử dụng</span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-400">
                      {isFree ? "Mặc định" : "Tiêu chuẩn"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed min-h-[36px]">{p.description || " "}</p>

                <div className="pt-2 pb-4 border-b border-zinc-800/80">
                  <div className="h-4 flex items-center">
                    {sv ? (
                      <span className="text-xs line-through text-zinc-500 font-mono">{vnd(sv.original)}</span>
                    ) : (
                      <span className="text-xs text-transparent select-none">—</span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    {isFree ? (
                      <span className="text-3xl font-extrabold tracking-tight">0đ</span>
                    ) : price ? (
                      <>
                        <span className="text-3xl font-extrabold tracking-tight">{vnd(price)}</span>
                        <span className="text-xs text-zinc-400 font-medium">/ {cycleLabel(cycle!)}</span>
                      </>
                    ) : (
                      <span className="text-xl font-extrabold tracking-tight text-zinc-300">
                        {p.prices.length === 0 ? "Liên hệ" : "Không bán kỳ này"}
                      </span>
                    )}
                  </div>
                  {sv ? (
                    <div className="text-[11px] font-semibold text-emerald-400 mt-1">Tiết kiệm {sv.pct}% so với mua từng tháng</div>
                  ) : (
                    <div className="text-[11px] text-zinc-500 mt-1">
                      {isFree ? "Miễn phí vĩnh viễn cho tài khoản cơ bản" : p.prices.length === 0 ? "Chưa mở bán trực tuyến" : " "}
                    </div>
                  )}
                </div>

                <ul className="space-y-2.5 text-xs text-zinc-300">
                  {features(p).map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2">
                {isCurrent ? (
                  isFree ? (
                    <button disabled className="w-full py-3 px-4 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-bold text-xs cursor-default">
                      ✓ Đang kích hoạt gói này
                    </button>
                  ) : sellable ? (
                    <button
                      type="button"
                      onClick={() => setConfirmPlan(p)}
                      className="w-full tiktok-glow-btn text-white py-3 px-4 rounded-xl font-bold text-xs"
                    >
                      Gia hạn {p.name}
                    </button>
                  ) : (
                    <button disabled className="w-full py-3 px-4 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-bold text-xs cursor-default">
                      ✓ Đang kích hoạt gói này
                    </button>
                  )
                ) : isFree ? (
                  <button disabled className="w-full py-3 px-4 rounded-xl bg-zinc-800 text-zinc-500 font-bold text-xs cursor-default">
                    Gói mặc định, không cần mua
                  </button>
                ) : sellable ? (
                  <button
                    type="button"
                    onClick={() => setConfirmPlan(p)}
                    className="w-full tiktok-glow-btn text-white py-3 px-4 rounded-xl font-bold text-xs"
                  >
                    Nâng cấp {p.name}
                  </button>
                ) : (
                  <button disabled className="w-full py-3 px-4 rounded-xl bg-zinc-800 text-zinc-400 font-bold text-xs cursor-default">
                    {p.prices.length === 0 ? "Liên hệ quản trị viên" : "Không bán theo chu kỳ này"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {cards.length === 0 && <p className="text-sm text-zinc-500">Chưa có gói nào.</p>}
      </div>

      {/* Bảng so sánh nhanh */}
      {plans.length > 0 && (
        <div className="bg-[#141419] border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold">So sánh nhanh các gói</h3>
              <p className="text-xs text-zinc-400">Hạn mức link, tên miền và giá theo chu kỳ đang chọn.</p>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-400 w-fit">Cập nhật tức thì khi nâng cấp</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 text-zinc-500 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-3">Tính năng</th>
                  {[...(free ? [free] : []), ...paid].map((p) => (
                    <th key={p.id} className={`py-3 px-3 ${p.code === current ? "text-emerald-400" : p.code === "free" ? "" : "text-violet-400"}`}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70">
                {(() => {
                  const cols = [...(free ? [free] : []), ...paid];
                  const rows: [string, (p: Plan) => string][] = [
                    ["Số lượng link rút gọn", (p) => `${p.limit} link / ${PERIOD_VI[p.period]}`],
                    ["Tên miền riêng", (p) => (p.maxCustomDomains > 0 ? `Tối đa ${p.maxCustomDomains}` : "—")],
                    ["Tên miền hệ thống", (p) => (p.systemDomains.length ? `${p.systemDomains.length} tên miền` : "Tất cả")],
                    [
                      cycle ? `Giá (${cycleLabel(cycle)})` : "Giá",
                      (p) => (p.code === "free" ? "Miễn phí" : cycle && priceAt(p, cycle) ? vnd(priceAt(p, cycle)!) : "Liên hệ"),
                    ],
                  ];
                  return rows.map(([label, fn]) => (
                    <tr key={label}>
                      <td className="py-3 px-3 font-medium">{label}</td>
                      {cols.map((p) => (
                        <td key={p.id} className="py-3 px-3">
                          {fn(p) === "—" ? <span className="text-zinc-500">—</span> : fn(p)}
                        </td>
                      ))}
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Đơn hàng */}
      <div className="bg-[#141419] border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <h3 className="text-base font-bold">Đơn hàng của bạn</h3>
        {orders.length === 0 ? (
          <p className="text-sm text-zinc-500">Chưa có đơn nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-zinc-800 first:border-t-0">
                    <td className="py-2.5 font-mono text-xs text-zinc-500">{o.code}</td>
                    <td className="py-2.5 text-white">
                      {o.planName} · {o.months} tháng
                    </td>
                    <td className="py-2.5 text-zinc-200">{vnd(o.amount)}</td>
                    <td className="py-2.5">
                      <Badge tone={STATUS[o.status].tone}>{STATUS[o.status].label}</Badge>
                    </td>
                    <td className="py-2.5 text-xs text-zinc-500">{fmtDate(o.createdAt)}</td>
                    <td className="py-2.5 text-right space-x-2 whitespace-nowrap">
                      {o.status === "pending" && (
                        <>
                          <button className={btnGhost} onClick={() => reopen(o)}>
                            Thanh toán
                          </button>
                          <button className={btnDanger} onClick={() => cancel(o)}>
                            Hủy
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hộp thoại xác nhận nâng cấp (giống bản mẫu) */}
      {confirmPlan && cycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" onClick={() => setConfirmPlan(null)}>
          <div
            className="bg-[#16161C] border border-zinc-800 max-w-md w-full rounded-3xl p-6 space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-violet-500" />
                <span>Xác nhận nâng cấp gói</span>
              </h3>
              <button onClick={() => setConfirmPlan(null)} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white" aria-label="Đóng">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Tài khoản kích hoạt</span>
                <span className="font-mono font-bold text-white">{me.username}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Gói lựa chọn</span>
                <span className="font-bold text-violet-400">{confirmPlan.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Chu kỳ thanh toán</span>
                <span className="font-semibold text-zinc-200">
                  {cycleLabel(cycle)}
                  {saving(confirmPlan, cycle) ? ` (-${saving(confirmPlan, cycle)!.pct}%)` : ""}
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-800 flex items-baseline justify-between">
                <span className="text-xs font-bold">Tổng thanh toán</span>
                <span className="text-xl font-extrabold text-tiktok-pink">{vnd(priceAt(confirmPlan, cycle) ?? 0)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-400">Phương thức thanh toán</label>
              <div className="flex items-center gap-2 p-3 rounded-xl border border-violet-500 bg-violet-500/10 text-xs font-semibold">
                <Check className="w-4 h-4 text-violet-400" />
                <span>Chuyển khoản QR / Ngân hàng (tự động kích hoạt)</span>
              </div>
              {current === confirmPlan.code ? (
                <p className="text-[11px] text-zinc-500">Gia hạn cùng gói sẽ cộng thêm thời hạn vào thời gian còn lại.</p>
              ) : (
                <p className="text-[11px] text-zinc-500">Gói mới áp dụng ngay sau khi thanh toán xong và thay thế gói hiện tại.</p>
              )}
            </div>

            <div className="flex gap-2.5 pt-1">
              <button type="button" onClick={() => setConfirmPlan(null)} className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 text-xs font-semibold">
                Để sau
              </button>
              <button
                type="button"
                onClick={startPayment}
                disabled={busy}
                className="flex-1 tiktok-glow-btn text-white font-bold py-2.5 px-4 rounded-xl text-xs"
              >
                {busy ? "Đang tạo đơn…" : "Tiếp tục thanh toán"}
              </button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <PaymentModal
          order={open}
          onClose={() => {
            setOpen(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

/** Hiện thông tin chuyển khoản và tự kiểm tra trạng thái đơn mỗi 5 giây cho tới khi thanh toán xong. */
function PaymentModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const [cur, setCur] = useState<Order>(order);
  const [copied, setCopied] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(async () => {
      try {
        const o = await api<Order>(`link-orders/${order.code}`);
        setCur(o);
        if (o.status !== "pending" && timer.current) clearInterval(timer.current);
      } catch {
        /* thử lại ở lần sau */
      }
    }, 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [order.code]);

  const pay = cur.payment ?? order.payment;

  async function copy(key: string, text: string) {
    await copyText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1200);
  }

  const row = (k: string, label: string, value: string) => (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-xs text-zinc-400">{label}</span>
      <span className="flex items-center gap-2 min-w-0">
        <span className="font-medium text-white truncate">{value}</span>
        <button className="text-xs text-tiktok-cyan hover:text-white flex-shrink-0" onClick={() => copy(k, value)}>
          {copied === k ? "Đã chép ✓" : "Chép"}
        </button>
      </span>
    </div>
  );

  return (
    <Modal title={`Đơn ${cur.code}`} onClose={onClose}>
      {cur.status === "paid" ? (
        <div className="text-center space-y-2 py-4">
          <div className="text-3xl">✅</div>
          <p className="text-sm font-medium text-white">Đã nhận thanh toán, gói {cur.planName} đã được kích hoạt.</p>
          <button className={btnPrimary} onClick={onClose}>
            Đóng
          </button>
        </div>
      ) : cur.status === "cancelled" ? (
        <p className="text-sm text-zinc-400">Đơn này đã bị hủy.</p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-zinc-400">
            {cur.planName} · {cur.months} tháng. Chuyển khoản <b>đúng số tiền</b> và <b>đúng nội dung</b>, gói sẽ tự kích
            hoạt sau vài chục giây.
          </p>
          {pay?.qrUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pay.qrUrl} alt="Mã QR chuyển khoản" className="mx-auto w-56 rounded-xl border border-zinc-800 bg-white p-1" />
          )}
          {pay && (
            <div className="space-y-2 border border-zinc-800 rounded-xl p-3 bg-black/30">
              {pay.accountNo && row("acc", `Số tài khoản (${pay.bankId})`, pay.accountNo)}
              {pay.accountName && row("name", "Chủ tài khoản", pay.accountName)}
              {row("amt", "Số tiền", String(pay.amount))}
              {row("content", "Nội dung", pay.content)}
            </div>
          )}
          {pay && !pay.configured && (
            <p className="text-xs text-amber-300">Chưa cấu hình tài khoản nhận tiền, vui lòng liên hệ quản trị viên.</p>
          )}
          <p className="text-[11px] text-zinc-500 text-center">Đang chờ thanh toán… trang tự cập nhật.</p>
        </div>
      )}
    </Modal>
  );
}
