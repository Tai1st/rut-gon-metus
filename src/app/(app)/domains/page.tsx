import { redirect } from "next/navigation";

// Trang tên miền đã gộp vào mục "Tích hợp".
export default function DomainsRedirect() {
  redirect("/integrations");
}
