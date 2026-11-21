"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Domain } from "@/lib/types";
import { Badge, btnDanger, btnGhost, btnPrimary, Card, ErrorBox, inputCls, Label } from "@/components/ui";

export function DomainsTab() {
  const [items, setItems] = useState<Domain[]>([]);
  const [host, setHost] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setItems(await api<Domain[]>("link-domains/system"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được tên miền");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(fn: () => Promise<unknown>) {
    setError("");
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Thao tác thất bại");
    }
  }

  return (
    <>
      <Card title="Thêm tên miền hệ thống">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await api("link-domains/system", { method: "POST", body: { host, isDefault } });
              setHost("");
              setIsDefault(false);
            });
          }}
          className="space-y-3"
        >
          <div>
            <Label>Tên miền (đã trỏ DNS và có HTTPS về trang này)</Label>
            <input className={inputCls} value={host} onChange={(e) => setHost(e.target.value)} placeholder="abc.com" />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
            Đặt làm tên miền mặc định
          </label>
          <ErrorBox message={error} />
          <button className={btnPrimary} disabled={!host.trim()}>
            Thêm
          </button>
        </form>
      </Card>

      <Card title={`Kho tên miền (${items.length})`}>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có tên miền nào. Khi chưa có, link dùng tên miền của trang đang truy cập.</p>
        ) : (
          <div className="space-y-2">
            {items.map((d) => (
              <div key={d.id} className="border border-tiktok-border bg-black/30 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate text-[13px] font-medium text-white">{d.host}</span>
                  {d.isDefault && <Badge tone="blue">Mặc định</Badge>}
                  <Badge tone={d.status === "active" ? "green" : "gray"}>{d.status === "active" ? "Đang bật" : "Đã tắt"}</Badge>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!d.isDefault && d.status === "active" && (
                    <button
                      className={btnGhost}
                      onClick={() => run(() => api(`link-domains/system/${d.id}`, { method: "PATCH", body: { isDefault: true } }))}
                    >
                      Đặt mặc định
                    </button>
                  )}
                  {d.status === "active" ? (
                    <button className={btnDanger} onClick={() => run(() => api(`link-domains/system/${d.id}`, { method: "DELETE" }))}>
                      Tắt
                    </button>
                  ) : (
                    <button
                      className={btnGhost}
                      onClick={() => run(() => api(`link-domains/system/${d.id}`, { method: "PATCH", body: { isActive: true } }))}
                    >
                      Bật lại
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
