/** Gọi API từ trình duyệt qua proxy /api/be (cookie đăng nhập tự đi kèm). */
export async function api<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`/api/be/${path}`, {
    method: opts.method ?? "GET",
    headers: opts.body !== undefined ? { "content-type": "application/json" } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { message?: string | string[] };
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Phiên đăng nhập đã hết hạn");
  }
  if (!res.ok) {
    const m = data.message;
    throw new Error((Array.isArray(m) ? m.join(", ") : m) || `Lỗi ${res.status}`);
  }
  return data as T;
}

export const vnd = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

export const fmtDate = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "—";

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}
