import { getStore } from "@netlify/blobs";
import { esc, buildIntentLink, buildOnelink } from "./_lib.mjs";

const j = (v) => JSON.stringify(v).replace(/</g, "\\u003c");
import { HARDCODED } from "./hardcoded.mjs";

const html = (body, status = 200) =>
  new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });

// Mọi thiết bị / bot nhận cùng một trang (không đổi theo User-Agent).
export default async (req) => {
  const code = new URL(req.url).pathname.split("/").filter(Boolean).pop() || "";
  if (!/^[a-z0-9]{4,16}$/.test(code)) return html("<h1>Link không hợp lệ</h1>", 404);

  const rec = HARDCODED[code] ?? (await getStore("links").get(code, { type: "json" }));
  if (!rec) return html("<h1>Link không tồn tại</h1>", 404);

  const t = esc(rec.title);
  return html(`<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${t}</title>
<meta property="og:title" content="${t}">
${rec.image ? `<meta property="og:image" content="${esc(rec.image)}">` : ""}
<style>
body{font-family:system-ui,sans-serif;margin:0;min-height:100vh;display:grid;place-items:center;background:#f6f6f7;color:#111}
.c{background:#fff;border-radius:14px;padding:20px;max-width:380px;width:calc(100% - 32px);box-shadow:0 2px 14px #0001;text-align:center}
img{width:100%;max-width:260px;border-radius:10px}h1{font-size:16px;line-height:1.4}
a.b{display:block;background:#fe2c55;color:#fff;text-decoration:none;padding:12px;border-radius:10px;font-weight:600;margin-top:12px}
a.w{display:block;margin-top:10px;color:#555;font-size:14px}.s{color:#777;font-size:13px}
</style></head><body><div class="c">
${rec.image ? `<img src="${esc(rec.image)}" alt="">` : ""}
<h1>${t}</h1>
<p class="s" id="s">Đang mở TikTok Shop…</p>
<a class="b" id="app" href="${esc(rec.appLink)}">Mở trong ứng dụng TikTok</a>
<a class="w" href="${esc(rec.webUrl)}">Hoặc xem trên web</a>
</div>
<script>
(function(){
  var app=${j(rec.appLink)}, web=${j(rec.webUrl)}, intent=${j(buildIntentLink(rec.appLink, rec.webUrl))}, onelink=${j(buildOnelink(rec.appLink))};
  var ua=navigator.userAgent;
  var android=/Android/i.test(ua), ios=/iPhone|iPad|iPod/i.test(ua);
  if(!android && !ios){ location.replace(web); return; }
  var left=false;
  document.addEventListener('visibilitychange',function(){ if(document.hidden) left=true; });
  window.addEventListener('pagehide',function(){ left=true; });
  window.addEventListener('blur',function(){ left=true; });
  location.replace(android ? intent : app);
  setTimeout(function(){
    if(left || document.hidden) return;
    document.getElementById('s').textContent='Chưa mở được app. Nếu đang dùng Zalo/Facebook, hãy mở link bằng Chrome/Safari.';
    setTimeout(function(){ location.replace(web); },2500);
  },2500);
})();
</script></body></html>`);
};
