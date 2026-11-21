"use client";

import { useCallback, useEffect, useState } from "react";
import { api, fmtDate, vnd } from "@/lib/api";
import type { Order } from "@/lib/types";
import { Badge, btnGhost, Card, ErrorBox } from "@/components/ui";

const STATUS = {
  pending: { tone: "amber", label: "Chờ thanh toán" },
  paid: { tone: "green", label: "Đã thanh toán" },
  cancelled: { tone: "gray", label: "Đã hủy" },
} as const;

export function OrdersTab() {
  const [status, setStatus] = useState("pending");
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setOrders(await api<Order[]>(`link-orders${status ? `?status=${status}` : ""}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được đơn");
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmPaid(o: Order) {
    if (!confirm(`Xác nhận đã nhận ${vnd(o.amount)} cho đơn ${o.code}? Gói sẽ được kích hoạt ngay.`)) return;
    try {
      await api(`link-orders/${o.code}/confirm`, { method: "POST", body: {} });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không xác nhận được");
    }
  }

  return (
    <Card
      title="Đơn mua gói"
      right={
        <select
          className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="pending">Chờ thanh toán</option>
          <option value="paid">Đã thanh toán</option>
          <option value="cancelled">Đã hủy</option>
          <option value="">Tất cả</option>
        </select>
      }
    >
      <ErrorBox message={error} />
      <p className="text-[11px] text-gray-400 mb-2">
        Đơn tự xác nhận khi tiền về đúng số tiền và nội dung. Chỉ bấm “Đã nhận tiền” khi bạn đã kiểm tra giao dịch.
      </p>
      {orders.length === 0 ? (
        <p className="text-sm text-gray-400">Không có đơn.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-gray-100 first:border-t-0">
                  <td className="py-2 font-mono text-xs text-gray-500">{o.code}</td>
                  <td className="py-2 text-gray-800">
                    {o.planName} · {o.months} tháng
                  </td>
                  <td className="py-2 text-gray-700">{vnd(o.amount)}</td>
                  <td className="py-2 font-mono text-[11px] text-gray-400 max-w-[120px] truncate">{o.userId}</td>
                  <td className="py-2">
                    <Badge tone={STATUS[o.status].tone}>{STATUS[o.status].label}</Badge>
                  </td>
                  <td className="py-2 text-xs text-gray-400">{fmtDate(o.createdAt)}</td>
                  <td className="py-2 text-right">
                    {o.status === "pending" && (
                      <button className={btnGhost} onClick={() => confirmPaid(o)}>
                        Đã nhận tiền
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
