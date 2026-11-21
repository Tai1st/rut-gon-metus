export type Me = { id: string; username: string; fullName?: string; role: "admin" | "user" | "shop" | string };

export type LinkItem = {
  id: string;
  code: string;
  kind: "product" | "campaign";
  title: string;
  image: string;
  webUrl: string;
  domain: string;
  clicks: number;
  createdAt: string;
  archivedAt: string | null;
};

export type InspectResult = {
  kind: "product" | "campaign";
  webUrl: string;
  androidUrl: string;
  iosUrl: string;
  title: string;
  image: string;
  productId: string;
  campaignId: string;
};

export type Quota = {
  plan: { code: string; name: string; expiresAt: string | null };
  period: "day" | "week" | "month";
  limit: number | null;
  used: number;
  remaining: number | null;
};

export type PricePoint = { months: number; price: number };

export type Plan = {
  id: string;
  code: string;
  name: string;
  description: string;
  limit: number;
  period: "day" | "week" | "month";
  prices: PricePoint[];
  currency: string;
  systemDomains: string[];
  maxCustomDomains: number;
  isActive: boolean;
  sortOrder: number;
};

export type Payment = {
  configured: boolean;
  bankId: string;
  accountNo: string;
  accountName: string;
  amount: number;
  content: string;
  qrUrl: string | null;
};

export type Order = {
  id: string;
  code: string;
  userId: string;
  planCode: string;
  planName: string;
  months: number;
  amount: number;
  status: "pending" | "paid" | "cancelled";
  paidAt: string | null;
  createdAt: string;
  payment?: Payment | null;
};

export type Domain = {
  id: string;
  host: string;
  kind: "system" | "custom";
  status: "pending" | "active" | "disabled";
  isDefault: boolean;
  dns?: { txt: { name: string; value: string }; pointTo: string | null } | null;
};

export type Membership = { id: string; userId: string; planCode: string; expiresAt: string | null };

export const PERIOD_VI = { day: "ngày", week: "tuần", month: "tháng" } as const;
