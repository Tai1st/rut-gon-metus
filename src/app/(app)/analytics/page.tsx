import { BarChart2 } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export default function AnalyticsPage() {
  return (
    <ComingSoon
      title="Thống kê"
      description="Theo dõi hiệu suất các link rút gọn của bạn."
      icon={<BarChart2 />}
      features={[
        "Lượt bấm theo ngày, tuần, tháng",
        "Phân loại theo thiết bị (iPhone, Android, máy tính) và nguồn truy cập",
        "Nhật ký truy cập gần đây",
      ]}
    />
  );
}
