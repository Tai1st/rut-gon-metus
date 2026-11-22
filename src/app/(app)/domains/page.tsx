"use client";

import { useCallback, useEffect, useState } from "react";
import { api, copyText } from "@/lib/api";
import type { Domain } from "@/lib/types";
import { Badge, btnDanger, btnGhost, btnPrimary, Card, ErrorBox, inputCls, Label } from "@/components/ui";

export default function DomainsPage() {
  const [items, setItems] = useState<Domain[]>([]);
  const [host, setHost] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      setItems(await api<Domain[]>("link-domains/mine"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy("add");
    setError("");
    setNote("");
    try {
      await api("link-domains/mine", { method: "POST", body: { host } });
      setHost("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thêm được tên miền");
    } finally {
      setBusy("");
    }
  }

  async function verify(d: Domain) {
    setBusy(d.id);
    setError("");
    setNote("");
    try {
      await api(`link-domains/mine/${d.id}/verify`, { method: "POST" });
      setNote(`Đã xác minh ${d.host}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chưa xác minh được");
    } finally {
      setBusy("");
    }
  }

  async function remove(d: Domain) {
    if (!confirm(`Xóa tên miền ${d.host}? Link đang dùng tên miền này sẽ không còn mở được.`)) return;
    try {
      await api(`link-domains/mine/${d.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xóa được");
    }
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Tên miền riêng</h1>
        <p className="text-xs sm:text-sm text-zinc-400">Dùng tên miền của bạn để rút gọn link thay cho tên miền mặc định.</p>
      </div>

      <Card title="Thêm tên miền riêng">
        <form onSubmit={add} className="space-y-3">
          <div>
            <Label>Tên miền (không kèm https://)</Label>
            <input
              className={inputCls}
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="go.example.com"
            />
          </div>
          <ErrorBox message={error} />
          {note && <p className="text-xs text-emerald-400">{note}</p>}
          <button className={btnPrimary} disabled={busy === "add" || !host.trim()}>
            Thêm tên miền
          </button>
          <p className="text-[11px] text-slate-500">
            Chỉ các gói có hỗ trợ tên miền riêng mới thêm được. Sau khi thêm, bạn làm theo hướng dẫn DNS hiện ra bên dưới để kích hoạt.
          </p>
        </form>
      </Card>

      <Card title={`Tên miền của bạn (${items.length})`}>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có tên miền riêng nào.</p>
        ) : (
          <div className="space-y-3">
            {items.map((d) => (
              <div key={d.id} className="border border-tiktok-border rounded-xl p-3 bg-black/30 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate text-[13px] font-medium text-white">{d.host}</span>
                    <Badge tone={d.status === "active" ? "green" : "amber"}>
                      {d.status === "active" ? "Đang hoạt động" : "Chờ xác minh"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {d.status !== "active" && (
                      <button className={btnGhost} disabled={busy === d.id} onClick={() => verify(d)}>
                        {busy === d.id ? "Đang kiểm tra…" : "Xác minh"}
                      </button>
                    )}
                    <button className={btnDanger} onClick={() => remove(d)}>
                      Xóa
                    </button>
                  </div>
                </div>
                {d.status !== "active" && d.dns?.nameServers && d.dns.nameServers.length > 0 && (
                  <div className="text-xs text-slate-300 space-y-1">
                    <p>Đổi nameserver của tên miền tại nơi đăng ký thành hai địa chỉ sau, đợi vài phút (có thể tới vài giờ) rồi bấm “Xác minh”:</p>
                    {d.dns.nameServers.map((ns, i) => (
                      <DnsRow key={ns} label={`Nameserver ${i + 1}`} value={ns} />
                    ))}
                    <p className="text-[11px] text-slate-500">
                      Lưu ý: sau khi đổi, toàn bộ DNS của tên miền (email, tên miền phụ khác) sẽ do hệ thống quản lý. Nên dùng tên miền riêng cho link và nhập tên miền gốc (ví dụ example.com).
                    </p>
                  </div>
                )}
                {d.status !== "active" && d.dns?.txt && (
                  <div className="text-xs text-slate-300 space-y-1">
                    <p>Thêm bản ghi DNS sau tại nơi quản lý tên miền, đợi vài phút rồi bấm “Xác minh”:</p>
                    <DnsRow label="TXT · tên" value={d.dns.txt.name} />
                    <DnsRow label="TXT · giá trị" value={d.dns.txt.value} />
                    {d.dns.pointTo && <DnsRow label="Trỏ CNAME về" value={d.dns.pointTo} />}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {[
          ["Mã theo dõi (Pixel)", "Gắn TikTok Pixel và Facebook Pixel vào trang chuyển hướng để đo chuyển đổi."],
          ["Khóa API", "Tạo khóa API để tạo và quản lý link từ ứng dụng hoặc hệ thống của bạn."],
        ].map(([title, text]) => (
          <div key={title} className="bg-[#141419] border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold">{title}</h3>
              <Badge tone="amber">Sắp ra mắt</Badge>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function DnsRow({ label, value }: { label: string; value: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="flex items-center justify-between gap-2 bg-tiktok-card border border-tiktok-border rounded px-2 py-1">
      <span className="text-slate-500 flex-shrink-0">{label}</span>
      <span className="font-mono text-[11px] truncate">{value}</span>
      <button
        className="text-tiktok-cyan hover:text-white flex-shrink-0"
        onClick={async () => {
          await copyText(value);
          setOk(true);
          setTimeout(() => setOk(false), 1200);
        }}
      >
        {ok ? "✓" : "Chép"}
      </button>
    </div>
  );
}
