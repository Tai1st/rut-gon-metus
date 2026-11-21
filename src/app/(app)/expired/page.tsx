import { CalendarX } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export default function ExpiredPage() {
  return (
    <ComingSoon
      title="Liên kết đã hết hạn"
      description="Các link đã quá ngày hết hạn do bạn đặt."
      icon={<CalendarX />}
      features={[
        "Đặt ngày hết hạn cho từng link khi tạo",
        "Link hết hạn tự ngừng hoạt động",
        "Gia hạn lại link đã hết hạn chỉ với một lần bấm",
      ]}
    />
  );
}
