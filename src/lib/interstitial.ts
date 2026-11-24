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
  /** Deeplink Shopee: địa chỉ mở thẳng app Shopee (shopeevn://…). */
  androidUrl?: string;
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
  // Deeplink Shopee luôn dùng trang HTML thuần có đoạn JS mở app (không có mật khẩu hay chuyển hướng trực tiếp).
  if (link.kind === "shopee") return true;
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

/**
 * Trang của deeplink Shopee (HTML thuần, không kèm mã của Next.js): thẻ og:* cho bản xem trước, sau đó JavaScript gọi deeplink
 * `shopeevn://` để mở app Shopee, nếu sau 3 giây vẫn ở lại trang (chưa cài app hoặc bị chặn) thì chuyển sang trang web.
 * Nếu app đã mở (trang bị ẩn) thì hủy bước chuyển về web. Có nút bấm tay phòng khi trình duyệt chặn tự mở app.
 */
export function renderShopeeEvoke(p: { title: string; description: string; image: string; pageUrl: string; webUrl: string; deeplink: string }): string {
  const img = p.image
    ? `    <meta property="og:image" content="${esc(p.image)}" />
    <meta name="twitter:image" content="${esc(p.image)}">
`
    : "";
  return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(p.title)}</title>
    <meta name="description" content="${esc(p.description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${esc(p.pageUrl)}" />
    <meta property="og:title" content="${esc(p.title)}" />
    <meta property="og:description" content="${esc(p.description)}" />
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(p.title)}">
    <meta name="twitter:description" content="${esc(p.description)}">
${img}    <noscript>
        <meta http-equiv="refresh" content="3;url=${esc(p.webUrl)}">
    </noscript>
    <style>
        *{box-sizing:border-box}
        body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#f8f8f8;color:#222;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center}
        .box{max-width:360px;width:100%}
        .loader,.loader:after{border-radius:50%;width:4em;height:4em}
        .loader{margin:0 auto 18px;font-size:10px;text-indent:-9999em;border:.9em solid rgba(238,77,45,.2);border-left-color:#ee4d2d;animation:spin 1.1s infinite linear}
        @keyframes spin{to{transform:rotate(360deg)}}
        p{margin:0 0 16px;font-size:15px;color:#555}
        a.btn{display:inline-block;padding:12px 24px;border-radius:10px;background:#ee4d2d;color:#fff;font-weight:700;text-decoration:none}
        a.web{display:block;margin-top:14px;font-size:13px;color:#888}
    </style>
</head>
<body>
    <div class="box">
        <div class="loader">Redirecting</div>
        <p>Đang mở ứng dụng Shopee…</p>
        <a class="btn" href="${esc(p.deeplink)}">Mở ứng dụng Shopee</a>
        <a class="web" href="${esc(p.webUrl)}">Mở trên trình duyệt</a>
    </div>
    <script>
        (function () {
            var deep = ${js(p.deeplink)};
            var web = ${js(p.webUrl)};
            var fallback = true;
            // App đã mở thì trang bị ẩn: không chuyển về web nữa.
            document.addEventListener("visibilitychange", function () { if (document.hidden) fallback = false; });
            window.addEventListener("pagehide", function () { fallback = false; });
            setTimeout(function () { if (fallback) window.location.href = web; }, 3000);
            window.location.href = deep;
        })();
    </script>
</body>
</html>
`;
}
