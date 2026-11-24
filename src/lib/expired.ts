import { WEB_HOSTS } from "./config";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Địa chỉ trang bảng giá của web chính (tên miền riêng / dlieya.click không phục vụ trang web nên luôn trỏ về web chính). */
function plansUrl(): string {
  const host = [...WEB_HOSTS][0] ?? "link.metus.vn";
  return `https://${host}/plans`;
}

/** Trang HTML hiện khi mở link của gói Free đã quá hạn dùng, kêu gọi chủ link nâng cấp gói. */
export function renderExpiredPage(): string {
  const url = esc(plansUrl());
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Link đã hết hạn</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#0b0b10;color:#f4f4f5;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  .card{max-width:460px;width:100%;text-align:center;background:#141419;border:2px solid #ef4444;border-radius:24px;padding:36px 28px;position:relative;overflow:hidden;box-shadow:0 0 0 4px rgba(239,68,68,.12),0 20px 60px rgba(239,68,68,.18)}
  .card:before{content:"";position:absolute;top:0;left:0;right:0;height:6px;background:#ef4444}
  .icon{width:68px;height:68px;margin:0 auto 18px;border-radius:50%;background:#ef4444;color:#fff;display:flex;align-items:center;justify-content:center;font-size:38px;font-weight:900;line-height:1}
  h1{margin:0 0 14px;font-size:26px;font-weight:900;color:#ef4444;letter-spacing:.2px}
  .alert{margin:0 0 18px;padding:14px 16px;border-radius:14px;background:rgba(239,68,68,.14);border:1px solid rgba(239,68,68,.55);color:#fca5a5;font-size:17px;font-weight:800;line-height:1.45}
  p{margin:0 0 22px;font-size:14px;line-height:1.6;color:#a1a1aa}
  a.btn{display:inline-block;padding:13px 30px;border-radius:14px;background:#ef4444;color:#fff;font-weight:900;font-size:16px;text-decoration:none;box-shadow:0 8px 24px rgba(239,68,68,.35)}
  a.btn:hover{background:#dc2626}
  small{display:block;margin-top:18px;font-size:12px;color:#71717a}
</style>
</head>
<body>
  <div class="card">
    <div class="icon">!</div>
    <h1>Link đã hết hạn</h1>
    <div class="alert">Vui lòng nâng cấp gói để tiếp tục sử dụng link này.</div>
    <p>Link này được tạo bằng gói Miễn phí và đã hết thời hạn sử dụng. Nếu bạn là chủ sở hữu, hãy nâng cấp gói để kích hoạt lại link và tạo link không giới hạn thời gian.</p>
    <a class="btn" href="${url}">Nâng cấp gói</a>
    <small>Nếu bạn nhận link này từ người khác, hãy liên hệ họ để được link mới.</small>
  </div>
</body>
</html>
`;
}

/** Phản hồi 410 kèm trang hết hạn; không cho lưu bộ đệm để nâng cấp xong là mở lại được ngay. */
export function expiredResponse(): Response {
  return new Response(renderExpiredPage(), {
    status: 410,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store, max-age=0", "x-robots-tag": "noindex" },
  });
}
