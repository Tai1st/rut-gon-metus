"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ambient, btnPrimary, ErrorBox, inputCls, Label, Logo } from "@/components/ui";

/** Form đăng nhập / đăng ký dùng chung (mode quyết định các trường và đích gọi API). */
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const mismatch = isRegister && confirm !== "" && confirm !== password;
  const ready =
    username.trim() !== "" && password !== "" && (!isRegister || (password.length >= 8 && confirm === password));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(isRegister ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password, ...(isRegister && { fullName }) }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) throw new Error(data.message || (isRegister ? "Đăng ký thất bại" : "Đăng nhập thất bại"));
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col tech-grid-bg">
      <Ambient />
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        <Link href="/" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
          ← Về trang chủ
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 pb-16">
        <form
          onSubmit={submit}
          className="bg-tiktok-surface border border-tiktok-border rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-5 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-tiktok-cyan via-tiktok-pink to-tiktok-cyan" />

          <div className="space-y-1.5">
            <span className="text-xs font-extrabold uppercase tracking-widest text-tiktok-cyan">
              {isRegister ? "Tạo tài khoản" : "Chào mừng quay lại"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isRegister ? (
                <>
                  Đăng ký <span className="tiktok-text-shadow">miễn phí</span>
                </>
              ) : (
                <>
                  Đăng <span className="tiktok-text-shadow">nhập</span>
                </>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {isRegister
                ? "Tạo tài khoản để rút gọn link TikTok Shop. Gói Free dùng được ngay, không cần thẻ."
                : "Đăng nhập để tạo và quản lý link rút gọn của bạn."}
            </p>
          </div>

          {isRegister && (
            <div>
              <Label>Họ tên (tuỳ chọn)</Label>
              <input
                className={inputCls}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                placeholder="Nguyễn Văn A"
              />
            </div>
          )}

          <div>
            <Label>Tên đăng nhập</Label>
            <input
              className={inputCls}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              placeholder="vd: minhanh.review"
            />
            {isRegister && (
              <p className="text-[11px] text-slate-500 mt-1">3–32 ký tự: chữ, số, dấu chấm, gạch dưới, gạch ngang.</p>
            )}
          </div>

          <div>
            <Label>Mật khẩu</Label>
            <input
              className={inputCls}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder={isRegister ? "Tối thiểu 8 ký tự" : "••••••••"}
            />
          </div>

          {isRegister && (
            <div>
              <Label>Nhập lại mật khẩu</Label>
              <input
                className={`${inputCls} ${mismatch ? "border-red-500/60" : ""}`}
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
              {mismatch && <p className="text-[11px] text-red-400 mt-1">Mật khẩu nhập lại chưa khớp.</p>}
            </div>
          )}

          <ErrorBox message={error} />

          <button className={`${btnPrimary} w-full py-3.5 rounded-2xl text-base`} disabled={busy || !ready}>
            {busy ? "Đang xử lý…" : isRegister ? "Tạo tài khoản" : "Đăng nhập"}
          </button>

          <p className="text-center text-xs text-slate-400">
            {isRegister ? (
              <>
                Đã có tài khoản?{" "}
                <Link href="/login" className="font-bold text-tiktok-cyan hover:underline">
                  Đăng nhập
                </Link>
              </>
            ) : (
              <>
                Chưa có tài khoản?{" "}
                <Link href="/register" className="font-bold text-tiktok-pink hover:underline">
                  Đăng ký miễn phí
                </Link>
              </>
            )}
          </p>
        </form>
      </main>
    </div>
  );
}
