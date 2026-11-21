// Link cứng để thử nghiệm (không cần Netlify Blobs). Truy cập: /s/test
import { buildAppLink } from "./_lib.mjs";

const webUrl = "https://www.tiktok.com/view/product/1729602289666132512";
const productId = "1729602289666132512";

export const HARDCODED = {
  test: {
    webUrl,
    appLink: buildAppLink(webUrl, productId),
    productId,
    title: "Lẻ Khăn Tắm, Gội, Khăn Mặt Châu Âu Lotustowel Làm Từ Sợi Cotton Cao Cấp Mềm Mịn, Thấm Hút, Không Ra Màu Dùng cho Nhà Tắm, Spa, Khách sạn, Resort",
    image: "https://p16-oec-sg.ibyteimg.com/tos-alisg-i-aphluv4xwc-sg/847c60f0d5f4412cb4525200e92224be~tplv-aphluv4xwc-resize-webp:260:260.webp?dr=15582&t=555f072d&ps=933b5bde&shp=7745054a&shcp=9b759fb9&idc=my&from=2001012042",
  },
};
