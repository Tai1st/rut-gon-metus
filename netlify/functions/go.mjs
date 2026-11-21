import { getStore } from "@netlify/blobs";
import { esc, buildOnelink } from "./_lib.mjs";
import { HARDCODED } from "./hardcoded.mjs";

const j = (v) => JSON.stringify(v).replace(/</g, "\\u003c");

const html = (body, status = 200) =>
  new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=UTF-8", "cache-control": "no-store, no-cache, must-revalidate, max-age=0" },
  });

const meta = (p, c) => `<meta property="${p}" content="${esc(c)}">`;

// Mọi thiết bị / bot nhận CÙNG một trang (không đổi theo User-Agent).
// Cấu trúc theo link gốc: thẻ og + thẻ App Links (al:*) trong <head>, thân trang chỉ có một lệnh location.replace.
export default async (req) => {
  const code = new URL(req.url).pathname.split("/").filter(Boolean).pop() || "";
  if (!/^[a-z0-9]{4,16}$/.test(code)) return html("<h1>Link không hợp lệ</h1>", 404);

  const rec = HARDCODED[code] ?? (await getStore("links").get(code, { type: "json" }));
  if (!rec) return html("<h1>Link không tồn tại</h1>", 404);

  const head = [
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    meta("og:type", "product"),
    `<title>${esc(rec.title)}</title>`,
    meta("og:title", rec.title),
    rec.image ? meta("og:image", rec.image) : "",
    // App Links: khai báo app TikTok để trình duyệt trong Facebook mở thẳng app.
    meta("al:web:url", rec.webUrl),
    meta("al:android:url", rec.appLink),
    meta("al:android:package", "com.ss.android.ugc.trill"),
    meta("al:android:app_name", "TikTok"),
    // Trang chiến dịch: TikTok khai báo cùng deeplink cho iOS; trang sản phẩm dùng onelink.
    meta("al:ios:url", rec.kind === "campaign" ? rec.appLink : buildOnelink(rec.appLink)),
    meta("al:ios:app_store_id", "1235601864"),
    meta("al:ios:app_name", "TikTok"),
    meta("al:web:should_fallback", "true"),
  ].join("");

  const script = `(function(){
var app=${j(rec.appLink)},web=${j(rec.webUrl)};
if(!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)){location.replace(web);return;}
location.replace(app);
})();`;

  return html(`<!DOCTYPE html><html lang="vi"><head>${head}</head><body><script>${script}</script></body></html>`);
};
