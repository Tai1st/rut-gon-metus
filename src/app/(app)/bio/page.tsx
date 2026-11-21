import { Smartphone } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export default function BioPage() {
  return (
    <ComingSoon
      title="Tạo trang Bio Link"
      description="Gom nhiều link vào một trang duy nhất để gắn trên tiểu sử TikTok."
      icon={<Smartphone />}
      features={[
        "Một trang công khai chứa danh sách các link bạn chọn",
        "Tuỳ chỉnh tên hiển thị, mô tả và giao diện",
        "Xem trước trang ngay trong lúc chỉnh sửa",
      ]}
    />
  );
}
