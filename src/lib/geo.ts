/** Danh mục dùng cho quy tắc chuyển hướng (dùng được cả ở server lẫn trình duyệt). */

export const COUNTRIES: [code: string, name: string][] = [
  ["VN", "Việt Nam"],
  ["US", "Hoa Kỳ"],
  ["GB", "Vương quốc Anh"],
  ["JP", "Nhật Bản"],
  ["KR", "Hàn Quốc"],
  ["CN", "Trung Quốc"],
  ["TW", "Đài Loan"],
  ["HK", "Hồng Kông"],
  ["SG", "Singapore"],
  ["TH", "Thái Lan"],
  ["MY", "Malaysia"],
  ["ID", "Indonesia"],
  ["PH", "Philippines"],
  ["KH", "Campuchia"],
  ["LA", "Lào"],
  ["MM", "Myanmar"],
  ["IN", "Ấn Độ"],
  ["AU", "Úc"],
  ["NZ", "New Zealand"],
  ["CA", "Canada"],
  ["FR", "Pháp"],
  ["DE", "Đức"],
  ["IT", "Ý"],
  ["ES", "Tây Ban Nha"],
  ["PT", "Bồ Đào Nha"],
  ["NL", "Hà Lan"],
  ["BE", "Bỉ"],
  ["CH", "Thụy Sĩ"],
  ["SE", "Thụy Điển"],
  ["NO", "Na Uy"],
  ["DK", "Đan Mạch"],
  ["FI", "Phần Lan"],
  ["PL", "Ba Lan"],
  ["CZ", "Séc"],
  ["RU", "Nga"],
  ["UA", "Ukraina"],
  ["TR", "Thổ Nhĩ Kỳ"],
  ["AE", "Các Tiểu vương quốc Ả Rập Thống nhất"],
  ["SA", "Ả Rập Xê Út"],
  ["IL", "Israel"],
  ["EG", "Ai Cập"],
  ["ZA", "Nam Phi"],
  ["BR", "Brazil"],
  ["MX", "Mexico"],
  ["AR", "Argentina"],
  ["CL", "Chile"],
  ["CO", "Colombia"],
];

export const VN_PROVINCES = [
  "An Giang", "Bà Rịa - Vũng Tàu", "Bạc Liêu", "Bắc Giang", "Bắc Kạn", "Bắc Ninh", "Bến Tre", "Bình Dương", "Bình Định",
  "Bình Phước", "Bình Thuận", "Cà Mau", "Cao Bằng", "Cần Thơ", "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai",
  "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh", "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình",
  "Hồ Chí Minh", "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Lạng Sơn", "Lào Cai", "Lâm Đồng", "Long An",
  "Nam Định", "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi",
  "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa",
  "Thừa Thiên Huế", "Tiền Giang", "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái",
];

export const DEVICES: [value: string, label: string][] = [
  ["windows", "Windows"],
  ["macos", "macOS"],
  ["linux", "Linux"],
  ["ios", "iOS (iPhone / iPad)"],
  ["android", "Android"],
];

export const LANGUAGES: [code: string, name: string][] = [
  ["vi", "Tiếng Việt"],
  ["en", "English"],
  ["zh", "中文"],
  ["ja", "日本語"],
  ["ko", "한국어"],
  ["th", "ไทย"],
  ["id", "Bahasa Indonesia"],
  ["ms", "Bahasa Melayu"],
  ["fr", "Français"],
  ["de", "Deutsch"],
  ["es", "Español"],
  ["pt", "Português"],
  ["ru", "Русский"],
  ["ar", "العربية"],
  ["hi", "हिन्दी"],
];

/** Bỏ dấu, bỏ tiền tố hành chính, gộp liền để so tên tỉnh/thành giữa tiếng Việt và tên Latin của GeoIP. */
export function normalizeRegion(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/\b(tinh|thanh pho|tp|city|province|municipality)\b/g, " ")
    // Bỏ hết khoảng trắng/gạch nối: "Hà Nội" (ha noi) và "Hanoi" của GeoIP phải khớp nhau.
    .replace(/[^a-z0-9]+/g, "");
}
