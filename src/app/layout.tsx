import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Metus Link – Rút gọn link TikTok Shop", template: "%s · Metus Link" },
  description: "Rút gọn link sản phẩm và chiến dịch TikTok Shop, tự mở ứng dụng TikTok trên điện thoại.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${inter.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col selection:bg-tiktok-pink selection:text-white">{children}</body>
    </html>
  );
}
