import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { headers } from "next/headers";
import { BioView, type BioData } from "@/components/BioView";
import { beFetch } from "@/lib/be";
import { INTERNAL_KEY } from "@/lib/config";

export const dynamic = "force-dynamic";

type PublicBio = BioData & { slug: string };
type Props = { params: Promise<{ slug: string }> };

const BOT_UA = /facebookexternalhit|facebot|twitterbot|slackbot|whatsapp|telegrambot|linkedinbot|bot\b|crawler|spider|preview/i;

/** Dữ liệu trang Bio công khai (chỉ trang đã xuất bản và chủ trang đang có gói trả phí). Dùng chung cho metadata và nội dung. */
const loadBio = cache(async (slug: string, count: boolean): Promise<PublicBio | null> => {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{2,31}$/.test(slug)) return null;
  const res = await beFetch(`/internal/bios/${encodeURIComponent(slug)}${count ? "?count=1" : ""}`, { internalKey: INTERNAL_KEY }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as PublicBio;
});

/** Lượt xem chỉ tính cho người thật. */
async function isHuman() {
  return !BOT_UA.test((await headers()).get("user-agent") ?? "");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const bio = await loadBio(slug, await isHuman());
  if (!bio) return { title: "Không tìm thấy trang", robots: { index: false } };
  const desc = bio.description.replace(/\s+/g, " ").trim().slice(0, 160) || `Trang liên kết của ${bio.name}`;
  return {
    title: { absolute: bio.handle ? `${bio.name} (${bio.handle})` : bio.name },
    description: desc,
    openGraph: { title: bio.name, description: desc, images: bio.avatar ? [bio.avatar] : undefined },
  };
}

export default async function BioPage({ params }: Props) {
  const { slug } = await params;
  const bio = await loadBio(slug, await isHuman());
  if (!bio) notFound();
  return (
    <div className="min-h-screen flex justify-center bg-black">
      <div className="w-full max-w-md">
        <BioView bio={bio} />
      </div>
    </div>
  );
}
