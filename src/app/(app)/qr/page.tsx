import { QrCode } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export default function QrPage() {
  return (
    <ComingSoon
      title="Tạo mã QR tùy chỉnh"
      description="Tạo mã QR cho bất kỳ đường dẫn nào với màu sắc và kích thước tuỳ chọn."
      icon={<QrCode />}
      features={[
        "Nhập đường dẫn bất kỳ để tạo mã QR",
        "Chọn màu mã, màu nền và kích thước",
        "Tải ảnh PNG chất lượng cao",
      ]}
    />
  );
}
