import { pickTarget, withParams, type RedirectRules } from "./redirect";
import { isUnlocked, unlockCookieName } from "./unlock";

/** Dữ liệu công khai của link (khớp /internal/links/:code của backend). */
export type PublicLinkData = {
  code: string;
  kind: "product" | "campaign" | "url" | "shopee";
  title: string;
  description?: string;
  redirectType?: "direct" | "interstitial";
  image: string;
  webUrl: string;
  /** Deeplink Shopee: link Shopee gốc người dùng nhập; /<mã> chuyển 301 thẳng tới đây. */
  sourceUrl?: string;
  /** Deeplink TikTok: địa chỉ mở thẳng app (snssdk1180://…) và địa chỉ cho iOS (onelink). */
  androidUrl?: string;
  iosUrl?: string;
  hasPassword?: boolean;
  lockId?: string;
  /** Link của gói Free đã quá hạn dùng: hiện trang nâng cấp thay vì chuyển hướng. */
  expired?: boolean;
  /** Có khi link thường trỏ tới deeplink của hệ thống: dữ liệu App Links để khai báo thẻ al:*. */
  appLinks?: { androidUrl: string; iosUrl: string; webUrl: string };
} & Omit<RedirectRules, "webUrl">;

/** Đích hợp lệ: chỉ http/https. */
export function safeHttpUrl(u: string): URL | null {
  try {
    const x = new URL(u);
    return x.protocol === "http:" || x.protocol === "https:" ? x : null;
  } catch {
    return null;
  }
}

/** Link thường dùng trang trung gian và đã qua cổng mật khẩu (nếu có): được phục vụ bằng HTML thuần. */
export function isInterstitial(link: PublicLinkData, cookieValue: string | undefined): boolean {
  // Deeplink Shopee do route /r/<mã> xử lý: chuyển 301 sang link Shopee gốc (Shopee tự lo phần mở app).
  if (link.kind === "shopee") return true;
  // Deeplink TikTok (sản phẩm, chiến dịch) cũng do /r/<mã> phục vụ bằng HTML thuần, chọn bản theo User-Agent ở máy chủ.
  if (link.kind === "product" || link.kind === "campaign") return !link.hasPassword || isUnlocked(link.code, link.lockId ?? "", cookieValue);
  if (link.kind !== "url" || link.redirectType === "direct") return false;
  return !link.hasPassword || isUnlocked(link.code, link.lockId ?? "", cookieValue);
}

export { unlockCookieName };

/** Chọn đích theo địa lý > thiết bị > ngôn ngữ rồi gắn tham số UTM. */
export function resolveTarget(
  link: PublicLinkData,
  v: { country?: string; region?: string; userAgent: string; acceptLanguage?: string },
): URL | null {
  return safeHttpUrl(withParams(pickTarget(link, v), link.params)) ?? safeHttpUrl(link.webUrl);
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Nhúng chuỗi vào <script>: JSON và chặn "</script>" hay "<!--". */
const js = (s: string) =>
  JSON.stringify(s)
    .replace(/</g, "\\u003c")
    .replace(new RegExp(String.fromCharCode(0x2028), "g"), "\\u2028")
    .replace(new RegExp(String.fromCharCode(0x2029), "g"), "\\u2029");

/**
 * Trang trung gian là HTML thuần giống mẫu BocLink: thẻ meta trong <head>, vòng xoay "Redirecting" trong <body>,
 * tự chuyển sau 0,5 giây (có noscript meta refresh). Không kèm mã của Next.js.
 */
export function renderInterstitial(p: {
  title: string;
  description: string;
  image: string;
  pageUrl: string;
  target: string;
  updatedTime: number;
  appLinks?: { androidUrl: string; iosUrl: string; webUrl: string };
}): string {
  // Khai báo App Links (giống trang deeplink) để Facebook mở thẳng app TikTok khi bấm vào chính đường dẫn này.
  const al = p.appLinks
    ? `    <meta property="al:ios:url" content="${esc(p.appLinks.iosUrl)}" />
    <meta property="al:ios:app_store_id" content="1235601864" />
    <meta property="al:ios:app_name" content="TikTok" />
    <meta property="al:android:package" content="com.ss.android.ugc.trill" />
    <meta property="al:android:url" content="${esc(p.appLinks.androidUrl)}" />
    <meta property="al:android:app_name" content="TikTok" />
    <meta property="al:web:url" content="${esc(p.appLinks.webUrl)}" />
    <meta property="al:web:should_fallback" content="true" />
`
    : "";
  const img = p.image
    ? `    <meta property="og:image" content="${esc(p.image)}" />\n    <meta name="twitter:image" content="${esc(p.image)}">\n`
    : "";
  return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>${esc(p.title)}</title>
    <meta name="description" content="${esc(p.description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${esc(p.pageUrl)}" />
    <meta property="og:title" content="${esc(p.title)}" />
    <meta property="og:description" content="${esc(p.description)}" />
    <meta property="og:updated_time" content="${p.updatedTime}" />
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(p.title)}">
    <meta name="twitter:description" content="${esc(p.description)}">
${img}${al}    <noscript>
        <meta http-equiv="refresh" content="0.5;url=${esc(p.target)}">
    </noscript>
    <style>
        body {
            background: #f8f8f8;
            position: relative;
        }

        .loader,
        .loader:after {
            border-radius: 50%;
            width: 5em;
            height: 5em
        }

        .loader {
            position: absolute !important;
            top: 250px;
            display: block;
            left: 48%;
            left: calc(50vw - 5em);
            font-size: 10px;
            text-indent: -9999em;
            border-top: 1.1em solid rgba(128, 128, 128, .2);
            border-right: 1.1em solid rgba(128, 128, 128, .2);
            border-bottom: 1.1em solid rgba(128, 128, 128, .2);
            border-left: 1.1em solid grey;
            -webkit-transform: translateZ(0);
            -ms-transform: translateZ(0);
            transform: translateZ(0);
            -webkit-animation: load8 1.1s infinite linear;
            animation: load8 1.1s infinite linear
        }

        @-webkit-keyframes load8 {
            0% {
                -webkit-transform: rotate(0);
                transform: rotate(0)
            }

            100% {
                -webkit-transform: rotate(360deg);
                transform: rotate(360deg)
            }
        }

        @keyframes load8 {
            0% {
                -webkit-transform: rotate(0);
                transform: rotate(0)
            }

            100% {
                -webkit-transform: rotate(360deg);
                transform: rotate(360deg)
            }
        }
    </style>

    <script>
        window.setTimeout(function(){
                                window.location.href = ${js(p.target)};
                            }, 500);
    </script>
</head>

<body>
    <div class="loader">Redirecting</div>
</body>

</html>
`;
}

/** Đích chuyển 301 của deeplink Shopee: chỉ nhận link https thuộc Shopee (shopee.vn, s.shopee.vn, shp.ee, vn.shp.ee). */
export function shopeeRedirectTarget(link: Pick<PublicLinkData, "sourceUrl" | "webUrl">): string | null {
  const u = safeHttpUrl(link.sourceUrl || link.webUrl);
  if (!u || u.protocol !== "https:") return null;
  return /(^|\.)(shopee\.vn|shp\.ee)$/i.test(u.hostname) ? u.toString() : null;
}

/** Chuỗi nhúng trong <script>: giống JSON nhưng ký tự & viết thành \u0026 và chặn "</script>". */
const jsAmp = (v: string) => js(v).replace(/&/g, "\u0026");

export type DeeplinkVariant = "bot" | "mobile" | "desktop";

/**
 * Trang deeplink TikTok bằng HTML thuần, chọn một trong ba bản theo User-Agent (cách các dịch vụ rút gọn TikTok khác làm):
 * - bot: thẻ og:* và al:* (App Links) để Facebook mở thẳng app TikTok, không có JavaScript;
 * - mobile: thẻ og:* và một dòng JS gọi thẳng app (snssdk1180://);
 * - desktop (và bot khác): thẻ og:* và một dòng JS chuyển sang trang web TikTok Shop.
 */
export function renderDeeplinkPage(
  variant: DeeplinkVariant,
  p: { title: string; image: string; webUrl: string; androidUrl: string; iosUrl: string },
): string {
  const t = esc(p.title);
  const image = p.image ? `<meta property="og:image" content="${esc(p.image)}">` : "";
  const open = '<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
  if (variant === "bot") {
    return (
      open +
      `<title>${t}</title><meta property="og:type" content="product"><meta property="og:site_name" content="TikTok Shop"><meta property="og:title" content="${t}"><meta property="og:url" content="${esc(p.webUrl)}">${image}` +
      `<meta property="al:web:url" content="${esc(p.webUrl)}"><meta property="al:android:url" content="${esc(p.androidUrl)}"><meta property="al:android:package" content="com.ss.android.ugc.trill"><meta property="al:android:app_name" content="TikTok">` +
      `<meta property="al:ios:url" content="${esc(p.iosUrl)}"><meta property="al:ios:app_store_id" content="1235601864"><meta property="al:ios:app_name" content="TikTok"><meta property="al:web:should_fallback" content="true"></head><body></body></html>`
    );
  }
  const go = variant === "mobile" ? p.androidUrl : p.webUrl;
  return (
    open +
    `<meta property="og:type" content="product"><meta property="og:site_name" content="TikTok Shop"><title>${t}</title><meta property="og:title" content="${t}">${image}</head>` +
    `<body><script>window.location.replace(${jsAmp(go)});</script></body></html>`
  );
}
