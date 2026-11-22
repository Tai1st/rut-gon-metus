"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, fmtDate, vnd } from "@/lib/api";
import { useMe } from "@/components/AppShell";
import { PERIOD_VI, type LinkItem, type Order, type Plan, type Quota } from "@/lib/types";
import { Badge, btnPrimary, Card, ErrorBox, inputCls, Label } from "@/components/ui";

const ROLE_VI: Record<string, string> = { admin: "Quản trị viên", user: "Người dùng", shop: "Thành viên" };
const ORDER_STATUS = {
  pending: { tone: "amber", label: "Chờ thanh toán" },
  paid: { tone: "green", label: "Đã thanh toán" },
  cancelled: { tone: "gray", label: "Đã hủy" },
} as const;

type Data = {
  quota: Quota | null;
  plan: Plan | null;
  links: LinkItem[];
  archived: LinkItem[];
  orders: Order[];
};

function Stat({ label, value, note, cls = "" }: { label: string; value: string; note?: string; cls?: string }) {
  return (
    <div className="bg-black/30 border border-zinc-800 rounded-xl p-4">
      <div className="text-[11px] uppercase text-zinc-500 mb-1">{label}</div>
      <div className={`text-xl font-extrabold ${cls}`}>{value}</div>
      {note && <div className="text-[11px] text-zinc-500 mt-0.5">{note}</div>}
    </div>
  );
}

export default function SettingsPage() {
  const me = useMe();
  const [data, setData] = useState<Data | null>(null);

  // Mỗi nguồn dữ liệu lỗi riêng thì chỉ bỏ phần đó, không làm hỏng cả trang.
  useEffect(() => {
    (async () => {
      const [quota, plans, links, archived, orders] = await Promise.all([
        api<Quota>("links/quota").catch(() => null),
        api<Plan[]>("link-plans").catch(() => [] as Plan[]),
        api<LinkItem[]>("links").catch(() => [] as LinkItem[]),
        api<LinkItem[]>("links?status=archived").catch(() => [] as LinkItem[]),
        api<Order[]>("link-orders").catch(() => [] as Order[]),
      ]);
      setData({
        quota,
        plan: quota ? (plans.find((p) => p.code === quota.plan.code) ?? null) : null,
        links,
        archived,
        orders,
      });
    })();
  }, []);

  // ---- Đổi mật khẩu ----
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  const mismatch = confirm !== "" && confirm !== next;
  const ready = current !== "" && next.length >= 8 && confirm === next;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError("");
    setOk(false);
    try {
      await api("link-auth/change-password", { method: "POST", body: { currentPassword: current, newPassword: next } });
      setCurrent("");
      setNext("");
      setConfirm("");
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đổi được mật khẩu");
    } finally {
      setBusy(false);
    }
  }

  const q = data?.quota ?? null;
  const unlimited = q?.limit === null;
  const pct = !q ? 0 : unlimited ? 100 : Math.min(100, Math.round((q.used / Math.max(q.limit ?? 1, 1)) * 100));
  const nearLimit = !!q && !unlimited && pct >= 80;
  const totalClicks = (data?.links ?? []).reduce((n, l) => n + l.clicks, 0);
  const display = me.fullName || me.username;

  return (
    <>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Cài đặt tài khoản</h1>
        <p className="text-xs sm:text-sm text-zinc-400">Thông tin tài khoản, gói cước đang dùng và bảo mật.</p>
      </div>

      {/* Hàng 1: thông tin tài khoản + đổi mật khẩu */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Thông tin tài khoản">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-400/20 border border-emerald-400/40 overflow-hidden shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <rect width="36" height="36" fill="#6ee7b7" />
                <polygon points="18,4 32,18 18,32 4,18" fill="#a7f3d0" />
                <circle cx="18" cy="18" r="6" fill="#34d399" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold truncate">{display}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge tone={me.role === "admin" ? "blue" : "gray"}>{ROLE_VI[me.role] ?? me.role}</Badge>
                {q && <Badge tone="pink">Gói {q.plan.name}</Badge>}
              </div>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-zinc-500 mb-1">Tên đăng nhập</dt>
              <dd className="font-mono text-zinc-200 truncate">{me.username}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500 mb-1">Họ tên</dt>
              <dd className="text-zinc-200 truncate">{me.fullName || "—"}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Đổi mật khẩu">
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>Mật khẩu hiện tại</Label>
              <input
                className={inputCls}
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Mật khẩu mới (tối thiểu 8 ký tự)</Label>
                <input
                  className={inputCls}
                  type="password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <Label>Nhập lại mật khẩu mới</Label>
                <input
                  className={`${inputCls} ${mismatch ? "border-red-500/60" : ""}`}
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>
            {mismatch && <p className="text-[11px] text-red-400">Mật khẩu nhập lại chưa khớp.</p>}
            <ErrorBox message={error} />
            {ok && <p className="text-xs text-emerald-400">Đã đổi mật khẩu thành công.</p>}
            <button className={btnPrimary} disabled={busy || !ready}>
              {busy ? "Đang lưu…" : "Đổi mật khẩu"}
            </button>
          </form>
        </Card>
      </div>

      {/* Hàng 2: gói cước */}
      <Card
        title="Gói cước hiện tại"
        right={
          <Link href="/plans" className="tiktok-glow-btn text-white text-xs font-semibold px-4 py-2 rounded-xl">
            Nâng cấp gói
          </Link>
        }
      >
        {!q ? (
          <p className="text-sm text-zinc-500">{data ? "Không tải được thông tin gói." : "Đang tải…"}</p>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold">{q.plan.name}</span>
                  <Badge tone={q.disabled ? "red" : "green"}>{q.disabled ? "Đã tắt" : "Đang hoạt động"}</Badge>
                </div>
                {data?.plan?.description && <p className="text-xs text-zinc-400">{data.plan.description}</p>}
              </div>
              <div className="text-right text-xs">
                <div className="text-zinc-500">Thời hạn</div>
                <div className="font-semibold text-amber-400">
                  {q.plan.expiresAt ? `Đến ${fmtDate(q.plan.expiresAt)}` : "Không hết hạn"}
                </div>
              </div>
            </div>

            {/* Thanh mức sử dụng */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  Đã dùng {q.used}
                  {unlimited ? " link" : ` / ${q.limit} link`} trong {q.period === "day" ? "hôm nay" : `${PERIOD_VI[q.period]} này`}
                </span>
                <span className={nearLimit ? "text-red-400 font-semibold" : "text-zinc-500"}>{unlimited ? "∞" : `${pct}%`}</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${nearLimit ? "bg-red-500" : "bg-gradient-to-r from-tiktok-cyan to-tiktok-pink"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {q.disabled && (
                <p className="text-[11px] text-red-400">
                  Gói miễn phí hiện đã tắt, bạn cần mua gói để tạo deeplink mới (link thường vẫn không giới hạn). Các link đã tạo vẫn hoạt động.
                </p>
              )}
              {!q.disabled && nearLimit && (
                <p className="text-[11px] text-red-400">Sắp hết hạn mức, bạn có thể nâng cấp để tạo thêm deeplink.</p>
              )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat
                label="Hạn mức"
                value={unlimited ? "Không giới hạn" : `${q.limit} link`}
                note={unlimited ? undefined : `mỗi ${PERIOD_VI[q.period]}`}
              />
              <Stat label="Còn lại" value={unlimited ? "∞" : String(q.remaining)} cls={q.remaining === 0 ? "text-red-400" : "text-emerald-400"} />
              <Stat
                label="Tên miền riêng"
                value={data?.plan ? (data.plan.maxCustomDomains > 0 ? `Tối đa ${data.plan.maxCustomDomains}` : "Không hỗ trợ") : "—"}
                note={data?.plan ? (data.plan.systemDomains.length ? `${data.plan.systemDomains.length} tên miền hệ thống` : "Mọi tên miền hệ thống") : undefined}
              />
              <Stat label="Chu kỳ làm mới" value={q.period === "day" ? "Hằng ngày" : q.period === "week" ? "Hằng tuần" : "Hằng tháng"} note="Tính theo giờ Việt Nam" />
            </div>
          </div>
        )}
      </Card>

      {/* Hàng 3: thống kê sử dụng */}
      <Card title="Tổng quan sử dụng">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Link đang hoạt động" value={data ? String(data.links.length) : "—"} cls="text-tiktok-cyan" />
          <Stat label="Link đã lưu trữ" value={data ? String(data.archived.length) : "—"} />
          <Stat label="Tổng lượt bấm" value={data ? String(totalClicks) : "—"} cls="text-tiktok-pink" />
          <Stat label="Đơn đã thanh toán" value={data ? String(data.orders.filter((o) => o.status === "paid").length) : "—"} />
        </div>
      </Card>

      {/* Hàng 4: lịch sử đơn */}
      <Card
        title="Lịch sử đơn hàng"
        right={
          <Link href="/plans" className="text-xs font-semibold text-tiktok-cyan hover:underline">
            Xem các gói →
          </Link>
        }
      >
        {!data || data.orders.length === 0 ? (
          <p className="text-sm text-zinc-500">Bạn chưa có đơn hàng nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <tbody>
                {data.orders.slice(0, 5).map((o) => (
                  <tr key={o.id} className="border-t border-zinc-800 first:border-t-0">
                    <td className="py-2.5 font-mono text-xs text-zinc-500">{o.code}</td>
                    <td className="py-2.5 text-zinc-200">
                      {o.planName} · {o.months} tháng
                    </td>
                    <td className="py-2.5 text-zinc-300">{vnd(o.amount)}</td>
                    <td className="py-2.5">
                      <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                    </td>
                    <td className="py-2.5 text-xs text-zinc-500 text-right">{fmtDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
