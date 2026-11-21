"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, ErrorBox, inputCls, Label } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) throw new Error(data.message || "Đăng nhập thất bại");
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
      setBusy(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white shadow-md rounded-lg w-full max-w-sm p-6 space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Rút gọn link TikTok Shop</h1>
          <p className="text-xs text-gray-400 mt-0.5">Đăng nhập để tạo và quản lý link</p>
        </div>
        <div>
          <Label>Tên đăng nhập</Label>
          <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </div>
        <div>
          <Label>Mật khẩu</Label>
          <input
            className={inputCls}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <ErrorBox message={error} />
        <button className={`${btnPrimary} w-full`} disabled={busy || !username || !password}>
          {busy ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
      </form>
    </main>
  );
}
