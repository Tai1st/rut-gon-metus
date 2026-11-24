import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowUpRight, MessageCircle, Smartphone, Workflow } from "lucide-react";
import type { ReactNode } from "react";
import { Ambient, Logo } from "@/components/ui";
import { PricingBoard } from "@/components/PricingBoard";
import { SupportButtons } from "@/components/SupportButtons";
import { beFetch } from "@/lib/be";
import { SESSION_COOKIE } from "@/lib/config";

type PublicPlan = {
  code: string;
  name: string;
  description: string;
  limit: number;
  period: "day" | "week" | "month";
  prices: { months: number; price: number }[];
  maxCustomDomains: number;
  isRecommended: boolean;
};

/** Bảng giá công khai lấy từ backend; backend lỗi thì ẩn khu vực giá chứ không làm hỏng trang chủ. */
async function loadPlans(): Promise<PublicPlan[]> {
  try {
    const res = await beFetch("/public/link-plans");
    if (!res.ok) return [];
    const data = (await res.json()) as PublicPlan[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}


// Trang chủ (landing). Chỉ đọc cookie để đổi nút "Đăng nhập" thành "Vào trang quản lý", nên render động.
export const dynamic = "force-dynamic";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const FEATURES: { tone: "pink" | "cyan"; title: string; text: string; icon: ReactNode }[] = [
  {
    tone: "pink",
    title: "Link sản phẩm & chiến dịch",
    text: "Dán link chia sẻ vt.tiktok.com hoặc link tiktok.com của sản phẩm hay trang khuyến mãi, hệ thống tự nhận diện và tạo link ngắn.",
    icon: (
      <Icon>
        <path d="M9 17H7A5 5 0 0 1 7 7h2" />
        <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </Icon>
    ),
  },
  {
    tone: "cyan",
    title: "Tự mở ứng dụng TikTok",
    text: "Trên điện thoại đã cài TikTok, người xem bấm link là vào thẳng sản phẩm trong app, không phải bấm thêm bước nào.",
    icon: (
      <Icon>
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <line x1="11" y1="18" x2="13" y2="18" />
      </Icon>
    ),
  },
  {
    tone: "pink",
    title: "Giữ thông tin theo dõi",
    text: "Tham số chia sẻ và theo dõi trong link gốc của bạn được giữ nguyên khi chuyển sang TikTok.",
    icon: (
      <Icon>
        <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </Icon>
    ),
  },
  {
    tone: "cyan",
    title: "Gói theo hạn mức",
    text: "Bắt đầu với gói Free để dùng thử. Cần nhiều link hơn thì nâng cấp gói theo ngày, tuần hoặc tháng.",
    icon: (
      <Icon>
        <path d="M4 20V10" />
        <path d="M10 20V4" />
        <path d="M16 20v-7" />
        <path d="M22 20H2" />
      </Icon>
    ),
  },
  {
    tone: "pink",
    title: "Thanh toán QR, tự kích hoạt",
    text: "Chuyển khoản đúng nội dung theo mã QR, hệ thống đối chiếu và kích hoạt gói sau vài chục giây.",
    icon: (
      <Icon>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <path d="M14 14h3v3M21 14v.01M14 21h.01M21 21h-3v-3" />
      </Icon>
    ),
  },
  {
    tone: "cyan",
    title: "Tên miền riêng",
    text: "Ở các gói cho phép, bạn thêm tên miền của mình, xác minh bằng bản ghi DNS và tạo link trên tên miền đó.",
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </Icon>
    ),
  },
];

const STEPS = [
  { n: "01", title: "Dán link TikTok Shop", text: "Sao chép link chia sẻ sản phẩm hoặc chiến dịch từ ứng dụng TikTok rồi dán vào ô tạo link." },
  { n: "02", title: "Nhận link ngắn", text: "Hệ thống tạo link ngắn với tiêu đề và ảnh xem trước đúng sản phẩm. Bấm sao chép để dùng." },
  { n: "03", title: "Chia sẻ ở bất cứ đâu", text: "Dán link vào bình luận, bài viết hoặc tin nhắn. Người xem trên điện thoại được đưa vào thẳng ứng dụng TikTok." },
];

/** Một cột liên kết ở chân trang; liên kết ngoài mở ở tab mới. */
function FooterCol({ title, links, external }: { title: string; links: [string, string][]; external?: boolean }) {
  const cls = "text-xs text-slate-400 hover:text-tiktok-cyan transition-colors";
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-300">{title}</h4>
      <ul className="space-y-2">
        {links.map(([href, label]) => (
          <li key={href}>
            {external ? (
              <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                {label}
              </a>
            ) : href.startsWith("/") ? (
              <Link href={href} className={cls}>
                {label}
              </Link>
            ) : (
              <a href={href} className={cls}>
                {label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Các web khác trong hệ sinh thái Metus (mở ở tab mới). */
const ECOSYSTEM: { title: string; text: string; href: string; host: string; tone: "pink" | "cyan"; icon: ReactNode }[] = [
  {
    title: "Metus",
    text: "Bộ công cụ tự động hoá Facebook cho người bán hàng và làm marketing.",
    href: "https://metus.vn",
    host: "metus.vn",
    tone: "cyan",
    icon: <Workflow className="w-7 h-7" />,
  },
  {
    title: "Metus Zalo",
    text: "Quản lý nhiều tài khoản Zalo và gửi tin nhắn hàng loạt từ một nơi.",
    href: "https://zalo.metus.vn",
    host: "zalo.metus.vn",
    tone: "pink",
    icon: <MessageCircle className="w-7 h-7" />,
  },
  {
    title: "Metus AppStore",
    text: "Chứng chỉ và ứng dụng mở rộng trải nghiệm iPhone.",
    href: "https://appstore.metus.vn",
    host: "appstore.metus.vn",
    tone: "cyan",
    icon: <Smartphone className="w-7 h-7" />,
  },
];

const FAQ = [
  {
    q: "Link có mở thẳng ứng dụng TikTok không?",
    a: "Có, trên điện thoại đã cài TikTok. Nếu người xem dùng máy tính hoặc chưa cài ứng dụng, họ được chuyển sang trang web TikTok của sản phẩm.",
  },
  {
    q: "Có dùng được khi chia sẻ trong Facebook không?",
    a: "Link được thiết kế để mở ứng dụng từ trình duyệt trong Facebook. Kết quả thực tế có thể khác nhau tuỳ phiên bản ứng dụng và thiết bị, nên hãy thử link trên điện thoại của bạn trước khi chia sẻ rộng.",
  },
  {
    q: "Tôi có thể rút gọn loại link nào?",
    a: "Link sản phẩm TikTok Shop (dạng /view/product/…) và link chiến dịch khuyến mãi (dạng /caravel/campaign…), gồm cả link chia sẻ ngắn vt.tiktok.com và vm.tiktok.com. Các loại link khác hiện chưa được hỗ trợ.",
  },
  {
    q: "Gói Free giới hạn thế nào?",
    a: "Gói Free có hạn mức số link theo chu kỳ để bạn dùng thử. Muốn tạo nhiều hơn, vào mục “Gói & thanh toán” sau khi đăng nhập để xem các gói đang bán.",
  },
  {
    q: "Tôi có thể dùng tên miền riêng không?",
    a: "Tuỳ gói. Gói nào cho phép thì bạn thêm tên miền của mình, tạo bản ghi DNS TXT để xác minh quyền sở hữu rồi chọn tên miền đó khi tạo link.",
  },
];

export default async function Home() {
  const loggedIn = Boolean((await cookies()).get(SESSION_COOKIE)?.value);
  const plans = await loadPlans();

  return (
    <div className="flex-1 flex flex-col tech-grid-bg">
      <Ambient />
      <SupportButtons />

      {/* Thanh điều hướng */}
      <header className="sticky top-0 z-40 bg-tiktok-surface/90 backdrop-blur-md border-b border-tiktok-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <Link href="/">
            <Logo />
          </Link>

          <nav className="hidden md:flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-tiktok-border">
            {[
              ["#cach-hoat-dong", "Cách hoạt động"],
              ["#tinh-nang", "Tính năng"],
              ...(plans.length > 0 ? [["#bang-gia", "Bảng giá"]] : []),
              ["#he-sinh-thai", "Hệ sinh thái"],
              ["#hoi-dap", "Hỏi đáp"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {loggedIn ? (
              <Link href="/dashboard" className="tiktok-glow-btn text-white text-xs font-bold px-4 py-2 rounded-xl">
                Vào trang quản lý
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-block text-xs font-semibold px-3.5 py-2 rounded-xl bg-tiktok-card border border-tiktok-border text-slate-200 hover:border-tiktok-cyan transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link href="/register" className="tiktok-glow-btn text-white text-xs font-bold px-4 py-2 rounded-xl">
                  Đăng ký miễn phí
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-20 space-y-20 sm:space-y-28">
        {/* Hero */}
        <section className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-tiktok-pink/10 border border-tiktok-pink/30 text-tiktok-pink text-xs font-bold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-tiktok-pink animate-pulse" />
            DÀNH CHO NGƯỜI BÁN VÀ AFFILIATE TIKTOK SHOP
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
            Rút gọn link <span className="tiktok-text-shadow">TikTok Shop</span>
            <br className="hidden sm:block" />{" "}
            <span className="bg-gradient-to-r from-tiktok-cyan via-white to-tiktok-pink bg-clip-text text-transparent">
              mở thẳng ứng dụng
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Biến link sản phẩm và chiến dịch dài thành link ngắn gọn. Người xem trên điện thoại bấm một lần là vào thẳng{" "}
            <strong className="text-white">ứng dụng TikTok</strong>, không phải bấm thêm bước nào.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={loggedIn ? "/dashboard" : "/register"}
              className="tiktok-glow-btn text-white font-extrabold py-3.5 px-8 rounded-2xl text-sm sm:text-base w-full sm:w-auto"
            >
              {loggedIn ? "Vào trang quản lý" : "Bắt đầu miễn phí"}
            </Link>
            {!loggedIn && (
              <Link
                href="/login"
                className="font-bold py-3.5 px-8 rounded-2xl text-sm sm:text-base w-full sm:w-auto bg-tiktok-surface border border-tiktok-border hover:border-tiktok-cyan transition-colors"
              >
                Tôi đã có tài khoản
              </Link>
            )}
          </div>

          {/* Thẻ minh hoạ luồng: chỉ để minh hoạ, không phải số liệu thật */}
          <div className="max-w-2xl mx-auto bg-tiktok-surface border border-tiktok-border rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden text-left">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-tiktok-cyan via-tiktok-pink to-tiktok-cyan" />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0 space-y-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-tiktok-cyan/15 text-tiktok-cyan">VÍ DỤ MINH HOẠ</span>
                <div className="text-base sm:text-lg font-extrabold font-mono text-tiktok-cyan truncate">tenmien-cua-ban.com/s/ab12cd34</div>
                <div className="text-xs text-slate-500 truncate">→ tiktok.com/view/product/… (kèm tham số chia sẻ của bạn)</div>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold">
                <span className="px-3 py-1.5 rounded-xl bg-tiktok-pink/15 text-tiktok-pink border border-tiktok-pink/30">Mở ứng dụng TikTok</span>
              </div>
            </div>
          </div>
        </section>

        {/* Cách hoạt động */}
        <section id="cach-hoat-dong" className="space-y-8 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-tiktok-cyan">Cách hoạt động</span>
            <h2 className="text-2xl sm:text-4xl font-black">
              3 bước, <span className="text-tiktok-pink">chưa đến một phút</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-tiktok-surface border border-tiktok-border rounded-3xl p-6 space-y-3 hover:border-tiktok-cyan transition-colors">
                <div className="w-11 h-11 rounded-2xl bg-tiktok-card border border-tiktok-border text-tiktok-cyan font-black font-mono flex items-center justify-center">
                  {s.n}
                </div>
                <h3 className="text-lg font-extrabold">{s.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tính năng */}
        <section id="tinh-nang" className="space-y-8 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-tiktok-pink">Tính năng</span>
            <h2 className="text-2xl sm:text-4xl font-black">
              Mọi thứ để <span className="text-tiktok-cyan">chia sẻ link</span> gọn gàng
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`bg-tiktok-surface border border-tiktok-border rounded-3xl p-6 space-y-3 transition-colors ${
                  f.tone === "pink" ? "hover:border-tiktok-pink" : "hover:border-tiktok-cyan"
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                    f.tone === "pink" ? "bg-tiktok-pink/15 text-tiktok-pink" : "bg-tiktok-cyan/15 text-tiktok-cyan"
                  }`}
                >
                  {f.icon}
                </div>
                <h3 className="text-base font-extrabold">{f.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bảng giá (dữ liệu thật từ backend) */}
        {plans.length > 0 && (
          <section id="bang-gia" className="space-y-8 scroll-mt-24">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-tiktok-cyan">Linh hoạt mọi quy mô</span>
              <h2 className="text-2xl sm:text-4xl font-black">
                Gói <span className="text-tiktok-pink">sử dụng</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Bắt đầu miễn phí ngay hôm nay hoặc nâng cấp để tạo nhiều link hơn và dùng tên miền riêng.
              </p>
            </div>

            <div className="max-w-6xl mx-auto w-full">
              <PricingBoard mode="landing" plans={plans} loggedIn={loggedIn} />
            </div>
          </section>
        )}

        {/* Hệ sinh thái Metus */}
        <section id="he-sinh-thai" className="space-y-8 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-tiktok-pink">Hệ sinh thái Metus</span>
            <h2 className="text-2xl sm:text-4xl font-black">
              Thêm công cụ từ <span className="text-tiktok-cyan">Metus</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">Tài khoản và dịch vụ cùng một hệ sinh thái, dùng riêng hoặc kết hợp tùy nhu cầu.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto w-full">
            {ECOSYSTEM.map((e) => (
              <a
                key={e.href}
                href={e.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex items-center gap-4 bg-tiktok-surface border border-tiktok-border rounded-3xl p-5 transition-colors ${
                  e.tone === "pink" ? "hover:border-tiktok-pink" : "hover:border-tiktok-cyan"
                }`}
              >
                <div
                  className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${
                    e.tone === "pink" ? "bg-tiktok-pink/15 text-tiktok-pink" : "bg-tiktok-cyan/15 text-tiktok-cyan"
                  }`}
                >
                  {e.icon}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="text-base font-extrabold">{e.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{e.text}</p>
                  <span className="block text-[11px] font-mono text-slate-500 truncate">{e.host}</span>
                </div>
                <ArrowUpRight className="w-5 h-5 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
              </a>
            ))}
          </div>
        </section>

        {/* Hỏi đáp */}
        <section id="hoi-dap" className="max-w-3xl mx-auto w-full space-y-8 scroll-mt-24">
          <div className="text-center space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-tiktok-cyan">Hỏi đáp</span>
            <h2 className="text-2xl sm:text-4xl font-black">Câu hỏi thường gặp</h2>
          </div>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <details key={item.q} className="group bg-tiktok-surface border border-tiktok-border rounded-2xl open:border-tiktok-cyan/60 transition-colors">
                <summary className="flex items-center justify-between gap-4 p-4 sm:p-5">
                  <span className="text-sm sm:text-base font-bold">{item.q}</span>
                  <span className="faq-plus text-tiktok-pink text-xl leading-none transition-transform flex-shrink-0">+</span>
                </summary>
                <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Kêu gọi hành động */}
        <section className="max-w-4xl mx-auto w-full">
          <div className="bg-tiktok-surface border border-tiktok-border rounded-3xl p-8 sm:p-12 text-center space-y-5 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-tiktok-cyan via-tiktok-pink to-tiktok-cyan" />
            <h2 className="text-2xl sm:text-4xl font-black">
              Sẵn sàng tạo link <span className="tiktok-text-shadow">đầu tiên</span>?
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">Đăng ký miễn phí, dán link và nhận link ngắn ngay trong vài giây.</p>
            <Link
              href={loggedIn ? "/dashboard" : "/register"}
              className="tiktok-glow-btn inline-block text-white font-extrabold py-3.5 px-8 rounded-2xl text-sm sm:text-base"
            >
              {loggedIn ? "Vào trang quản lý" : "Đăng ký miễn phí"}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-tiktok-border/60 bg-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block">
              <Logo />
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              Rút gọn link thường và deeplink TikTok Shop: mở thẳng app, dùng tên miền riêng, quản lý số liệu trong một nơi.
            </p>
          </div>

          <FooterCol
            title="Sản phẩm"
            links={[
              ["#cach-hoat-dong", "Cách hoạt động"],
              ["#tinh-nang", "Tính năng"],
              ...(plans.length > 0 ? [["#bang-gia", "Bảng giá"] as [string, string]] : []),
              ["#hoi-dap", "Hỏi đáp"],
            ]}
          />

          <FooterCol
            title="Tài khoản"
            links={
              loggedIn
                ? [["/dashboard", "Trang quản lý"]]
                : [
                    ["/register", "Đăng ký miễn phí"],
                    ["/login", "Đăng nhập"],
                  ]
            }
          />

          <FooterCol
            title="Hệ sinh thái Metus"
            external
            links={ECOSYSTEM.map((e) => [e.href, e.title] as [string, string])}
          />
        </div>

        <div className="border-t border-tiktok-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-[11px] text-slate-500 text-center sm:text-left">
            © {new Date().getFullYear()} Metus Link. Bảo lưu mọi quyền.
          </div>
        </div>
      </footer>
    </div>
  );
}
