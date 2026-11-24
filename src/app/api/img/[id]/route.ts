import { BE_URL } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * Ảnh người dùng tải lên (banner, avatar, ảnh sản phẩm) phục vụ ngay trên tên miền của trang: /api/img/<id>.
 * Trình duyệt và người xem không thấy địa chỉ máy chủ backend. Lấy từ endpoint công khai của backend, chỉ nhận PNG/JPEG.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[a-f0-9]{24}$/i.test(id)) return new Response("Not found", { status: 404 });
  const res = await fetch(`${BE_URL}/api/public/link-images/${id}`, { cache: "no-store", signal: AbortSignal.timeout(15_000) }).catch(() => null);
  const type = res?.headers.get("content-type") ?? "";
  if (!res || !res.ok || !/^image\/(png|jpeg)$/.test(type)) return new Response("Not found", { status: 404 });
  return new Response(await res.arrayBuffer(), {
    headers: {
      "content-type": type,
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'",
    },
  });
}
