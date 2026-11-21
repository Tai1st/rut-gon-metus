// Chỉ cho phép link thuộc TikTok để tránh biến thành open-redirect.
const ALLOWED = /(^|\.)tiktok\.com$/i;

export function isTikTokUrl(u) {
  try {
    const x = new URL(u);
    return x.protocol === "https:" && ALLOWED.test(x.hostname);
  } catch {
    return false;
  }
}

// vt.tiktok.com / vm.tiktok.com -> theo 301 từng bước (chỉ trong tiktok.com) tới URL đích.
export async function resolveShort(u) {
  let cur = u;
  for (let i = 0; i < 5; i++) {
    const host = new URL(cur).hostname;
    if (!/^(vt|vm)\.tiktok\.com$/i.test(host)) return cur;
    const r = await fetch(cur, {
      redirect: "manual",
      headers: { "user-agent": "Mozilla/5.0 (Linux; Android 13) Chrome/120 Mobile Safari/537.36" },
    });
    const loc = r.headers.get("location");
    if (!loc) throw new Error("Không đọc được link rút gọn");
    cur = new URL(loc, cur).toString();
    if (!isTikTokUrl(cur)) throw new Error("Link rút gọn trỏ ra ngoài TikTok");
  }
  return cur;
}

export function parseProduct(webUrl) {
  const x = new URL(webUrl);
  const m = x.pathname.match(/\/view\/product\/(\d+)/);
  if (!m) return null;
  let title = "",
    image = "";
  try {
    const og = JSON.parse(x.searchParams.get("og_info") || "{}");
    title = og.title || "";
    image = og.image || "";
  } catch {}
  return { productId: m[1], title, image };
}

export function buildAppLink(webUrl, productId) {
  const q = new URLSearchParams({
    biz_type: "0",
    need_mall: "1",
    page_name: "reflow_pdp",
    params_url: webUrl,
    requestParams: JSON.stringify({ product_id: [productId] }),
    is_commerce: "1",
    refer: "web",
  });
  return "snssdk1180://ec/pdp?" + q.toString();
}

export function newCode() {
  const a = "abcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (const v of crypto.getRandomValues(new Uint8Array(8))) s += a[v % a.length];
  return s;
}

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
