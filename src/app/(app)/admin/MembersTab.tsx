"use client";

import { useCallback, useEffect, useState } from "react";
import { api, fmtDate } from "@/lib/api";
import type { Membership, Plan } from "@/lib/types";
import { btnPrimary, Card, ErrorBox, inputCls, Label } from "@/components/ui";

export function MembersTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [members, setMembers] = useState<Membership[]>([]);
  const [userId, setUserId] = useState("");
  const [planCode, setPlanCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    try {
      const [p, m] = await Promise.all([api<Plan[]>("link-plans/admin/all"), api<Membership[]>("link-plans/memberships")]);
      setPlans(p);
      setMembers(m);
      setPlanCode((c) => c || p[0]?.code || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function assign(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");
    try {
      await api("link-plans/assign", {
        method: "PUT",
        body: { userId: userId.trim(), planCode, ...(expiresAt && { expiresAt: new Date(expiresAt).toISOString() }) },
      });
      setOk("Đã gán gói.");
      setUserId("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không gán được gói");
    }
  }

  return (
    <>
      <Card title="Gán gói cho người dùng">
        <form onSubmit={assign} className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label>ID người dùng</Label>
              <input className={`${inputCls} font-mono text-xs`} value={userId} onChange={(e) => setUserId(e.target.value)} />
            </div>
            <div>
              <Label>Gói</Label>
              <select className={`${inputCls} cursor-pointer`} value={planCode} onChange={(e) => setPlanCode(e.target.value)}>
                {plans.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Hết hạn (để trống = không hết hạn)</Label>
              <input className={inputCls} type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
          </div>
          <ErrorBox message={error} />
          {ok && <p className="text-xs text-emerald-400">{ok}</p>}
          <button className={btnPrimary} disabled={!userId.trim() || !planCode}>
            Gán gói
          </button>
        </form>
      </Card>

      <Card title={`Người đang dùng gói được gán (${members.length})`}>
        {members.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có ai được gán gói.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-tiktok-border/60 first:border-t-0">
                  <td className="py-2 font-mono text-[11px] text-slate-400">{m.userId}</td>
                  <td className="py-2 text-white">{m.planCode}</td>
                  <td className="py-2 text-xs text-slate-500">{m.expiresAt ? `Hết hạn ${fmtDate(m.expiresAt)}` : "Không hết hạn"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
