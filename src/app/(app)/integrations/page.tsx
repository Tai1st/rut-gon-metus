import { GitFork } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export default function IntegrationsPage() {
  return (
    <ComingSoon
      title="Tích hợp"
      description="Kết nối link rút gọn của bạn với các công cụ khác."
      icon={<GitFork />}
      features={["Mã theo dõi (TikTok Pixel, Facebook Pixel)", "Khóa API để tạo link từ hệ thống của bạn"]}
    />
  );
}
