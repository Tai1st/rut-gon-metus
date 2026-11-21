"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, copyText, fmtDate, vnd } from "@/lib/api";
import { PERIOD_VI, type Order, type Plan, type Quota } from "@/lib/types";
import { Badge, btnDanger, btnGhost, btnPrimary, Card, ErrorBox, Modal } from "@/components/ui";

const STATUS = {
  pending: { tone: "amber", label: "Chờ thanh toán" },
  paid: { tone: "green", label: "Đã thanh toán" },
  cancelled: { tone: "gray", label: "Đã hủy" },
} as const;

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [open, setOpen] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      const [p, q, o] = await Promise.all([
        api<Plan[]>("link-plans"),
        api<Quota>("links/quota"),
        api<Order[]>("link-orders"),
      ]);
      setPlans(p.filter((x) => x.prices.length > 0));
      setQuota(q);
      setOrders(o);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function buy(plan: Plan, months: number) {
    setBusy(`${plan.code}-${months}`);
    setError("");
    try {
      const order = await api<Order>("link-orders", { method: "POST", body: { planCode: plan.code, months } });
      setOpen(order);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tạo được đơn");
    } finally {
      setBusy("");
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

  return (
    <>
      {quota && (
        <Card title="Gói hiện tại">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-200">
            <Badge tone="blue">{quota.plan.name}</Badge>
            <span>
              {quota.limit === null
                ? "Không giới hạn link"
                : `${quota.limit} link/${PERIOD_VI[quota.period]} · đã dùng ${quota.used}`}
            </span>
            <span className="text-xs text-slate-500">
              {quota.plan.expiresAt ? `Hết hạn ${fmtDate(quota.plan.expiresAt)}` : "Không hết hạn"}
            </span>
          </div>
        </Card>
      )}

      <ErrorBox message={error} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.id} className="bg-tiktok-surface border border-tiktok-border rounded-3xl shadow-xl p-5 flex flex-col gap-3 hover:border-tiktok-cyan transition-colors">
            <div>
              <h3 className="text-sm font-semibold text-white">{p.name}</h3>
              {p.description && <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>}
            </div>
            <ul className="text-xs text-slate-300 space-y-1">
              <li>
                {p.limit} link/{PERIOD_VI[p.period]}
              </li>
              <li>{p.maxCustomDomains > 0 ? `Thêm tối đa ${p.maxCustomDomains} tên miền riêng` : "Dùng tên miền của hệ thống"}</li>
            </ul>
            <div className="mt-auto space-y-2">
              {p.prices.map((pr) => (
                <button
                  key={pr.months}
                  className={`${btnPrimary} w-full`}
                  disabled={busy === `${p.code}-${pr.months}`}
                  onClick={() => buy(p, pr.months)}
                >
                  {pr.months} tháng · {vnd(pr.price)}
                </button>
              ))}
            </div>
          </div>
        ))}
        {plans.length === 0 && <p className="text-sm text-slate-500">Chưa có gói nào đang bán.</p>}
      </div>

      <Card title="Đơn hàng của bạn">
        {orders.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có đơn nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-tiktok-border/60 first:border-t-0">
                    <td className="py-2 font-mono text-xs text-slate-400">{o.code}</td>
                    <td className="py-2 text-white">
                      {o.planName} · {o.months} tháng
                    </td>
                    <td className="py-2 text-slate-200">{vnd(o.amount)}</td>
                    <td className="py-2">
                      <Badge tone={STATUS[o.status].tone}>{STATUS[o.status].label}</Badge>
                    </td>
                    <td className="py-2 text-xs text-slate-500">{fmtDate(o.createdAt)}</td>
                    <td className="py-2 text-right space-x-2 whitespace-nowrap">
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
      </Card>

      {open && (
        <PaymentModal
          order={open}
          onClose={() => {
            setOpen(null);
            void load();
          }}
        />
      )}
    </>
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
      <span className="text-xs text-slate-400">{label}</span>
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
        <p className="text-sm text-slate-400">Đơn này đã bị hủy.</p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            {cur.planName} · {cur.months} tháng. Chuyển khoản <b>đúng số tiền</b> và <b>đúng nội dung</b>, gói sẽ tự kích
            hoạt sau vài chục giây.
          </p>
          {pay?.qrUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pay.qrUrl} alt="Mã QR chuyển khoản" className="mx-auto w-56 rounded-md border border-tiktok-border" />
          )}
          {pay && (
            <div className="space-y-2 border border-tiktok-border/60 rounded-md p-3 bg-black/30">
              {pay.accountNo && row("acc", `Số tài khoản (${pay.bankId})`, pay.accountNo)}
              {pay.accountName && row("name", "Chủ tài khoản", pay.accountName)}
              {row("amt", "Số tiền", String(pay.amount))}
              {row("content", "Nội dung", pay.content)}
            </div>
          )}
          {pay && !pay.configured && (
            <p className="text-xs text-amber-300">Chưa cấu hình tài khoản nhận tiền, vui lòng liên hệ quản trị viên.</p>
          )}
          <p className="text-[11px] text-slate-500 text-center">Đang chờ thanh toán… trang tự cập nhật.</p>
        </div>
      )}
    </Modal>
  );
}
