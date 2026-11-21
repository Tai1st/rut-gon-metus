"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useMe } from "@/components/AppShell";
import { Badge, btnPrimary, Card, ErrorBox, inputCls, Label } from "@/components/ui";

const ROLE_VI: Record<string, string> = { admin: "Quản trị viên", user: "Người dùng", shop: "Thành viên" };

export default function SettingsPage() {
  const me = useMe();
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
      await api("link-auth/change-password", {
        method: "POST",
        body: { currentPassword: current, newPassword: next },
      });
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

  return (
    <>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Cài đặt tài khoản</h1>
        <p className="text-xs sm:text-sm text-zinc-400">Thông tin tài khoản và đổi mật khẩu.</p>
      </div>

      <Card title="Thông tin tài khoản">
        <dl className="grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-xs text-zinc-500 mb-1">Tên đăng nhập</dt>
            <dd className="font-mono text-zinc-200">{me.username}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 mb-1">Họ tên</dt>
            <dd className="text-zinc-200">{me.fullName || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 mb-1">Vai trò</dt>
            <dd>
              <Badge tone={me.role === "admin" ? "blue" : "gray"}>{ROLE_VI[me.role] ?? me.role}</Badge>
            </dd>
          </div>
        </dl>
      </Card>

      <Card title="Đổi mật khẩu">
        <form onSubmit={submit} className="space-y-3 max-w-md">
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
            {mismatch && <p className="text-[11px] text-red-400 mt-1">Mật khẩu nhập lại chưa khớp.</p>}
          </div>
          <ErrorBox message={error} />
          {ok && <p className="text-xs text-emerald-400">Đã đổi mật khẩu thành công.</p>}
          <button className={btnPrimary} disabled={busy || !ready}>
            {busy ? "Đang lưu…" : "Đổi mật khẩu"}
          </button>
        </form>
      </Card>
    </>
  );
}
