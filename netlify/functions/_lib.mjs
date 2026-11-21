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

// Link chiến dịch/khuyến mãi: https://www.tiktok.com/caravel/campaign?campaign_id=...
export function parseCampaign(webUrl) {
  const x = new URL(webUrl);
  if (!/^\/caravel\/campaign\/?$/.test(x.pathname)) return null;
  const campaignId = x.searchParams.get("campaign_id");
  return campaignId ? { campaignId } : null;
}

// Deeplink của TikTok cho trang chiến dịch: mở webview trong app tới oec-api.tiktokv.com với cùng tham số.
export function buildCampaignAppLink(webUrl) {
  const q = new URLSearchParams(new URL(webUrl).search);
  q.set("caravel_open_app", "facebook");
  q.set("caravel_open_method", "deeplink");
  const inner = "https://oec-api.tiktokv.com/caravel/campaign?" + q.toString();
  return "snssdk1180://webview?" + new URLSearchParams({ url: inner }).toString();
}

// Lấy ảnh (và mô tả) xem trước từ chính trang tiktok.com (host đã được kiểm tra là tiktok.com).
export async function fetchPreview(webUrl) {
  try {
    const r = await fetch(webUrl, {
      headers: { "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/21F90" },
      signal: AbortSignal.timeout(8000),
    });
    const h = await r.text();
    const og = (p) => {
      const m = h.match(new RegExp(`<meta[^>]+property="${p}"[^>]*content="([^"]*)"`));
      return m ? m[1].replace(/&amp;/g, "&") : "";
    };
    return { title: og("og:title"), image: og("og:image") };
  } catch {
    return { title: "", image: "" };
  }
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
    gd_label: "click_wap_p_product_detail_t_launch_pop_up_s_product_detail_e__f_product_detail_fp__fps_affiliate_links_rf_product_detail",
    need_mall: "1",
    needlaunchlog: "1",
    page_name: "reflow_pdp",
    params_url: webUrl,
    refer: "web",
    requestParams: JSON.stringify({ product_id: [productId] }),
    trackParams: "{}",
    is_commerce: "1",
  });
  // Giống deeplink gốc của TikTok: lặp lại các tham số của link web (chain_key, checksum, ...) ở cấp ngoài.
  for (const [k, v] of new URL(webUrl).searchParams) q.append(k, v);
  return "snssdk1180://ec/pdp?" + q.toString();
}

// Android Chrome: intent:// được phép tự chạy khi điều hướng, kèm fallback về web nếu chưa cài app.
export function buildIntentLink(appLink, webUrl) {
  const rest = appLink.replace(/^snssdk1180:\/\//, "");
  return (
    "intent://" + rest +
    "#Intent;scheme=snssdk1180;package=com.ss.android.ugc.trill;S.browser_fallback_url=" +
    encodeURIComponent(webUrl) + ";end"
  );
}

// iOS: universal link của TikTok (onelink) thay cho scheme tuỳ biến vốn bị Safari chặn khi tự chạy.
export function buildOnelink(appLink) {
  return (
    "https://snssdk1180.onelink.me/BAuo?domain_source=tiktok&af_dp=" + encodeURIComponent(appLink) +
    "&af_force_deeplink=true&refer=web&action=openapp"
  );
}

export function newCode() {
  const a = "abcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (const v of crypto.getRandomValues(new Uint8Array(8))) s += a[v % a.length];
  return s;
}

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
