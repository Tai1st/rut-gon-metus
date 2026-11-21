"use client";

import { useState } from "react";
import { OrdersTab } from "./OrdersTab";
import { PlansTab } from "./PlansTab";
import { DomainsTab } from "./DomainsTab";
import { MembersTab } from "./MembersTab";

const TABS = [
  { key: "orders", label: "Đơn hàng" },
  { key: "plans", label: "Gói link" },
  { key: "domains", label: "Tên miền hệ thống" },
  { key: "members", label: "Gán gói" },
] as const;

export default function AdminPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("orders");
  return (
    <>
      <div className="flex border-b border-tiktok-border bg-tiktok-card rounded-t-lg">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`py-2.5 flex-1 text-xs font-medium transition-colors ${
              tab === t.key ? "text-tiktok-cyan border-b-2 border-tiktok-pink -mb-px" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "orders" && <OrdersTab />}
      {tab === "plans" && <PlansTab />}
      {tab === "domains" && <DomainsTab />}
      {tab === "members" && <MembersTab />}
    </>
  );
}
