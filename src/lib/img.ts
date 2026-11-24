/** Ảnh tải lên được phục vụ tại /api/img/<id> trên tên miền của trang (không lộ địa chỉ backend). */
const LEGACY = /^https:\/\/api-v3\.metus\.vn\/api\/public\/link-images\/([a-f0-9]{24})$/i;

/** Địa chỉ ảnh để hiển thị: ảnh tải lên từ trước (lưu theo địa chỉ backend) được đổi sang /api/img/<id>; ảnh ngoài giữ nguyên. */
export function imgSrc(u: string): string {
  const m = LEGACY.exec(u);
  return m ? `/api/img/${m[1]}` : u;
}
