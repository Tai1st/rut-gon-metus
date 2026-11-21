import { getStore } from "@netlify/blobs";
import { isTikTokUrl, resolveShort, parseProduct, buildAppLink, newCode } from "./_lib.mjs";

const json = (o, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json; charset=utf-8" } });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const key = Netlify.env.get("ADMIN_KEY");
  if (key && req.headers.get("x-admin-key") !== key) return json({ error: "Sai ADMIN_KEY" }, 401);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON không hợp lệ" }, 400);
  }
  const input = String(body.url || "").trim();
  if (!isTikTokUrl(input)) return json({ error: "Chỉ nhận link https của tiktok.com (vt/vm/www)" }, 400);

  let webUrl;
  try {
    webUrl = await resolveShort(input);
  } catch (e) {
    return json({ error: e.message }, 400);
  }
  if (!isTikTokUrl(webUrl)) return json({ error: "Đích không thuộc TikTok" }, 400);

  const p = parseProduct(webUrl);
  if (!p) return json({ error: "Không phải link sản phẩm TikTok Shop (/view/product/…)" }, 400);

  const title = String(body.title || "").trim().slice(0, 200) || p.title || "Sản phẩm TikTok Shop";
  const rec = {
    webUrl,
    appLink: buildAppLink(webUrl, p.productId),
    productId: p.productId,
    title,
    image: p.image,
    createdAt: Date.now(),
  };

  const code = newCode();
  await getStore("links").setJSON(code, rec);

  const origin = new URL(req.url).origin;
  return json({ code, short: `${origin}/s/${code}`, title, productId: p.productId });
};
