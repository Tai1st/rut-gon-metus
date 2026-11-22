import { normalizeRegion } from "./geo";

/** Quy tắc chuyển hướng và tham số của link thường (khớp dữ liệu từ backend). */
export type RedirectRules = {
  webUrl: string;
  geoRules?: { country: string; region?: string; url: string }[];
  deviceRules?: { device: string; url: string }[];
  langRules?: { lang: string; url: string }[];
  params?: { key: string; value: string }[];
};

export type Visitor = {
  /** Mã quốc gia ISO (header cf-ipcountry của Cloudflare). */
  country?: string;
  /** Tỉnh/thành (header cf-region, chỉ có khi bật "Add visitor location headers" ở Cloudflare). */
  region?: string;
  userAgent: string;
  acceptLanguage?: string;
};

export function detectDevice(ua: string): string {
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Windows/i.test(ua)) return "windows";
  if (/Macintosh|Mac OS X/i.test(ua)) return "macos";
  if (/Linux|X11|CrOS/i.test(ua)) return "linux";
  return "";
}

/** Ngôn ngữ ưu tiên cao nhất của trình duyệt, chỉ lấy 2 chữ cái đầu (vi-VN -> vi). */
export function detectLang(h?: string): string {
  const first = (h ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  return /^[a-z]{2}/.test(first) ? first.slice(0, 2) : "";
}

/**
 * Chọn đích theo thứ tự ưu tiên: địa lý (tỉnh/thành cụ thể trước, rồi cả quốc gia) > thiết bị > ngôn ngữ > URL mặc định.
 * Chỉ nhận đích http/https (đã kiểm tra ở backend, kiểm tra lại cho chắc).
 */
export function pickTarget(link: RedirectRules, v: Visitor): string {
  const country = (v.country ?? "").toUpperCase();
  const region = v.region ? normalizeRegion(v.region) : "";
  const geo = (link.geoRules ?? []).filter((r) => r.country.toUpperCase() === country);
  if (country && geo.length) {
    const byRegion =
      region &&
      geo.find((r) => {
        if (!r.region) return false;
        const want = normalizeRegion(r.region);
        return want === region || region.includes(want) || want.includes(region);
      });
    const hit = byRegion || geo.find((r) => !r.region);
    if (hit) return hit.url;
  }
  const dev = detectDevice(v.userAgent);
  const d = dev && (link.deviceRules ?? []).find((r) => r.device === dev);
  if (d) return d.url;
  const lang = detectLang(v.acceptLanguage);
  const l = lang && (link.langRules ?? []).find((r) => r.lang === lang);
  if (l) return l.url;
  return link.webUrl;
}

/** Gắn tham số (UTM…) vào đích; tham số cấu hình ghi đè tham số cùng tên có sẵn trên URL. */
export function withParams(target: string, params?: { key: string; value: string }[]): string {
  if (!params?.length) return target;
  try {
    const u = new URL(target);
    for (const p of params) if (p.key) u.searchParams.set(p.key, p.value);
    return u.href;
  } catch {
    return target;
  }
}
