import { PricelistConfig } from "@/types/pricelist";
import { formatRupiah, formatDateIndo } from "./utils";

/**
 * Generates a high-end minimalist editorial A4 Pricelist Canvas
 * Matching the monochromatic, typography-driven style (no colors, no emojis).
 */
export function generatePricelistCanvas(config: PricelistConfig): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  const width = 800;
  const paddingX = 40;
  const paddingY = 40;
  const contentWidth = width - paddingX * 2;

  // Fixed A4 Aspect Ratio: 800 x 1132
  const height = 1132;

  // High-DPI scaling (2x for retina crispness)
  const scale = 2;
  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.scale(scale, scale);

  // Background: Clean Pure White
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  const mainColor = "#181818";
  const subColor = "#4A4A4A";
  const borderColor = "#222222";

  let y = paddingY + 12;

  // 1. Top Bar (3-Column Subtitles)
  ctx.fillStyle = mainColor;
  ctx.font = "700 9.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.letterSpacing = "2.5px";

  // Left
  ctx.textAlign = "left";
  ctx.fillText((config.subtitle_left || "SEWA JAS & TUXEDO").toUpperCase(), paddingX, y);

  // Center
  ctx.textAlign = "center";
  ctx.fillText((config.subtitle_center || config.store_name || "STITCH & MORAL").toUpperCase(), width / 2, y);

  // Right
  ctx.textAlign = "right";
  ctx.fillText((config.subtitle_right || "PRICE LIST").toUpperCase(), width - paddingX, y);

  // 2. Hero Big Title: "PRICE LIST"
  y += 75;
  ctx.textAlign = "center";

  // Draw "PRICE" in heavy sans + "LIST" in italic serif
  ctx.font = "900 86px 'Arial Black', 'Impact', -apple-system, sans-serif";
  ctx.letterSpacing = "6px";
  const priceMetrics = ctx.measureText("PRICE");

  ctx.font = "italic 400 92px 'Playfair Display', 'Georgia', 'Times New Roman', serif";
  ctx.letterSpacing = "2px";
  const listMetrics = ctx.measureText(" LIST");

  const totalHeroWidth = priceMetrics.width + listMetrics.width;
  const heroStartX = (width - totalHeroWidth) / 2;

  ctx.textAlign = "left";
  ctx.fillStyle = mainColor;
  ctx.font = "900 86px 'Arial Black', 'Impact', -apple-system, sans-serif";
  ctx.letterSpacing = "6px";
  ctx.fillText("PRICE", heroStartX, y);

  ctx.font = "italic 400 92px 'Playfair Display', 'Georgia', 'Times New Roman', serif";
  ctx.letterSpacing = "2px";
  ctx.fillText(" LIST", heroStartX + priceMetrics.width, y);

  y += 24;

  // 3. Grid Container for Sections
  const gridTopY = y;
  const gridBottomY = height - paddingY - 38;
  const gridHeight = gridBottomY - gridTopY;
  const colWidth = contentWidth / 2;
  const midX = paddingX + colWidth;

  // Outer Grid Frame
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(paddingX, gridTopY, contentWidth, gridHeight);

  // Split packages into two categories or halves
  const mainPackages = config.packages.filter(
    (p) => !p.kategori || p.kategori === "PAKET UTAMA" || p.kategori === "SEWA UTAMA"
  );
  const additionalPackages = config.packages.filter(
    (p) => p.kategori === "TAMBAHAN" || p.kategori === "AKSESORIS"
  );

  // If no category distinction, split evenly
  const col1Packages = mainPackages.length > 0 ? mainPackages : config.packages.slice(0, Math.ceil(config.packages.length / 2));
  const col2Packages = additionalPackages.length > 0 ? additionalPackages : config.packages.slice(Math.ceil(config.packages.length / 2));

  const accentColor = "#FF4D00";

  // --- SECTION 1: PACKAGES ROW ---
  const sec1H = 220;

  // Section 1 Header: Left & Right
  ctx.fillStyle = mainColor;
  ctx.font = "900 13px 'Arial Black', 'Impact', sans-serif";
  ctx.letterSpacing = "1.5px";
  ctx.textAlign = "left";
  ctx.fillText("PAKET SEWA JAS", paddingX + 16, y + 24);
  ctx.fillText("TAMBAHAN & AKSESORIS", midX + 16, y + 24);

  // Sub-divider under headers
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(paddingX, y + 36);
  ctx.lineTo(width - paddingX, y + 36);
  ctx.stroke();

  // Vertical Divider in Middle
  ctx.beginPath();
  ctx.moveTo(midX, gridTopY);
  ctx.lineTo(midX, gridTopY + sec1H);
  ctx.stroke();

  // Render Column 1 Items
  let itemY = y + 58;
  col1Packages.forEach((pkg) => {
    ctx.textAlign = "left";
    ctx.fillStyle = mainColor;
    ctx.font = "700 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.letterSpacing = "0.5px";
    ctx.fillText(pkg.nama.toUpperCase(), paddingX + 16, itemY);

    if (pkg.bonus || pkg.deskripsi) {
      ctx.fillStyle = subColor;
      ctx.font = "400 9px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText((pkg.bonus || pkg.deskripsi || "").toUpperCase(), paddingX + 16, itemY + 12);
    }

    ctx.textAlign = "right";
    if (pkg.harga_diskon && pkg.harga_diskon < pkg.harga) {
      const rightX = midX - 16;
      ctx.fillStyle = "#777777";
      ctx.font = "500 9.5px 'Courier New', Courier, monospace";
      const normalPriceStr = formatRupiah(pkg.harga);
      const normalPriceW = ctx.measureText(normalPriceStr).width;
      ctx.fillText(normalPriceStr, rightX, itemY - 2);

      ctx.strokeStyle = "#777777";
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(rightX - normalPriceW, itemY - 5);
      ctx.lineTo(rightX, itemY - 5);
      ctx.stroke();

      ctx.fillStyle = accentColor;
      ctx.font = "900 11.5px 'Courier New', Courier, monospace";
      ctx.fillText(formatRupiah(pkg.harga_diskon), rightX, itemY + 12);
    } else {
      ctx.fillStyle = mainColor;
      ctx.font = "700 11px 'Courier New', Courier, monospace";
      ctx.fillText(formatRupiah(pkg.harga), midX - 16, itemY + 4);
    }

    itemY += 38;
  });

  // Render Column 2 Items
  itemY = y + 58;
  col2Packages.forEach((pkg) => {
    ctx.textAlign = "left";
    ctx.fillStyle = mainColor;
    ctx.font = "700 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.letterSpacing = "0.5px";
    ctx.fillText(pkg.nama.toUpperCase(), midX + 16, itemY);

    if (pkg.bonus || pkg.deskripsi) {
      ctx.fillStyle = subColor;
      ctx.font = "400 9px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText((pkg.bonus || pkg.deskripsi || "").toUpperCase(), midX + 16, itemY + 12);
    }

    ctx.textAlign = "right";
    const rightEdge = width - paddingX - 16;
    if (pkg.harga_diskon && pkg.harga_diskon < pkg.harga) {
      ctx.fillStyle = "#777777";
      ctx.font = "500 9.5px 'Courier New', Courier, monospace";
      const normalPriceStr = formatRupiah(pkg.harga);
      const normalPriceW = ctx.measureText(normalPriceStr).width;
      ctx.fillText(normalPriceStr, rightEdge, itemY - 2);

      ctx.strokeStyle = "#777777";
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(rightEdge - normalPriceW, itemY - 5);
      ctx.lineTo(rightEdge, itemY - 5);
      ctx.stroke();

      ctx.fillStyle = accentColor;
      ctx.font = "900 11.5px 'Courier New', Courier, monospace";
      ctx.fillText(formatRupiah(pkg.harga_diskon), rightEdge, itemY + 12);
    } else {
      ctx.fillStyle = mainColor;
      ctx.font = "700 11px 'Courier New', Courier, monospace";
      ctx.fillText(formatRupiah(pkg.harga), rightEdge, itemY + 4);
    }

    itemY += 38;
  });

  // Horizontal Divider after Section 1
  y += sec1H;
  ctx.beginPath();
  ctx.moveTo(paddingX, y);
  ctx.lineTo(width - paddingX, y);
  ctx.stroke();

  // --- SECTION 2: PROMO & SPECIAL OFFERS WITH VALIDITY DATES ---
  const activePromos = (config.promos || []).filter((p) => p.aktif);
  const promoRows = Math.ceil(activePromos.length / 2);
  const cardH = 80;
  const cardRowGap = 10;
  const cardColGap = 12;
  const cardW = (contentWidth - 32 - cardColGap) / 2; // (720 - 32 - 12) / 2 = 338
  const sec2H =
    activePromos.length === 0
      ? 55
      : 44 + promoRows * cardH + (promoRows - 1) * cardRowGap + 14;

  // Section 2 Header (Span Full Width)
  ctx.textAlign = "left";
  ctx.fillStyle = mainColor;
  ctx.font = "900 13px 'Arial Black', 'Impact', sans-serif";
  ctx.letterSpacing = "1.5px";
  ctx.fillText("PROMO & POTONGAN KHUSUS", paddingX + 16, y + 24);

  // Sub-divider under header
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(paddingX, y + 36);
  ctx.lineTo(width - paddingX, y + 36);
  ctx.stroke();

  // Render all active promos in a 2-column grid format (Boxed Cards matching Preview)
  activePromos.forEach((promo, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const cardX = paddingX + 16 + col * (cardW + cardColGap);
    const cardY = y + 46 + row * (cardH + cardRowGap);
    const padInnerX = 10;

    // Card background & border box
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 0.9;
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    // Discount Nominal on Right (e.g. -Rp 25.000)
    const discStr = `-${formatRupiah(promo.diskon_nominal)}`;
    ctx.textAlign = "right";
    ctx.fillStyle = accentColor;
    ctx.font = "900 11px 'Courier New', Courier, monospace";
    ctx.letterSpacing = "0px";
    const discW = ctx.measureText(discStr).width;
    ctx.fillText(discStr, cardX + cardW - padInnerX, cardY + 15);

    // Title on Left (Wrapped if too long)
    ctx.textAlign = "left";
    ctx.fillStyle = mainColor;
    ctx.font = "900 10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.letterSpacing = "0.2px";
    const maxTitleW = cardW - padInnerX * 2 - discW - 6;

    const titleWords = promo.judul.toUpperCase().split(" ");
    let tLine = "";
    let titleY = cardY + 15;
    for (let n = 0; n < titleWords.length; n++) {
      const testLine = tLine ? `${tLine} ${titleWords[n]}` : titleWords[n];
      if (ctx.measureText(testLine).width > maxTitleW && n > 0) {
        ctx.fillText(tLine, cardX + padInnerX, titleY);
        tLine = titleWords[n];
        titleY += 12;
      } else {
        tLine = testLine;
      }
    }
    if (tLine) {
      ctx.fillText(tLine, cardX + padInnerX, titleY);
    }

    // Validity Period
    let curY = titleY + 13;
    ctx.fillStyle = mainColor;
    ctx.font = "700 8.5px 'Courier New', Courier, monospace";
    ctx.letterSpacing = "0.3px";
    const dateText = promo.periode_label
      ? `PERIODE: ${promo.periode_label.toUpperCase()}`
      : promo.tanggal_mulai && promo.tanggal_berakhir
        ? `PERIODE: ${formatDateIndo(promo.tanggal_mulai).toUpperCase()} - ${formatDateIndo(promo.tanggal_berakhir).toUpperCase()}`
        : "PERIODE: BERLAKU SETIAP HARI";
    ctx.fillText(dateText, cardX + padInnerX, curY);

    // Requirements / Terms Text (Wrapped)
    curY += 12;
    ctx.fillStyle = subColor;
    ctx.font = "400 8.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.letterSpacing = "0px";
    const maxDescW = cardW - padInnerX * 2;
    const descWords = (promo.syarat || "").split(" ");
    let dLine = "";
    for (let n = 0; n < descWords.length; n++) {
      const testLine = dLine ? `${dLine} ${descWords[n]}` : descWords[n];
      if (ctx.measureText(testLine).width > maxDescW && n > 0) {
        ctx.fillText(dLine, cardX + padInnerX, curY);
        dLine = descWords[n];
        curY += 11;
      } else {
        dLine = testLine;
      }
    }
    if (dLine) {
      ctx.fillText(dLine, cardX + padInnerX, curY);
    }
  });

  // Horizontal Divider after Section 2
  y += sec2H;
  ctx.beginPath();
  ctx.moveTo(paddingX, y);
  ctx.lineTo(width - paddingX, y);
  ctx.stroke();

  // --- SECTION 3: TERMS & STORE RULES ---
  // Section 3 Header
  ctx.textAlign = "left";
  ctx.fillStyle = mainColor;
  ctx.font = "900 13px 'Arial Black', 'Impact', sans-serif";
  ctx.letterSpacing = "1.5px";
  ctx.fillText("KETENTUAN & FASILITAS SEWA", paddingX + 16, y + 24);

  // Sub-divider under header
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(paddingX, y + 36);
  ctx.lineTo(width - paddingX, y + 36);
  ctx.stroke();

  let termY = y + 54;
  ctx.fillStyle = mainColor;
  ctx.font = "500 9.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.letterSpacing = "0.2px";

  (config.ketentuan_sewa || []).forEach((term, idx) => {
    ctx.fillText(`${idx + 1}. ${term.toUpperCase()}`, paddingX + 16, termY);
    termY += 15;
  });

  // Notes: Deposit & Late Fee
  termY += 4;
  ctx.font = "700 9.5px 'Courier New', Courier, monospace";
  const notes = [
    config.deposit_info ? `[+] ${config.deposit_info.toUpperCase()}` : "",
    config.late_fee_info ? `[+] ${config.late_fee_info.toUpperCase()}` : "",
  ]
    .filter(Boolean)
    .join("  |  ");
  if (notes) {
    ctx.fillText(notes, paddingX + 16, termY);
  }

  // 4. Footer Bar (3-Column Minimalist Footer)
  const footerY = height - paddingY + 12;
  ctx.fillStyle = mainColor;
  ctx.font = "600 9px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.letterSpacing = "1px";

  // Left: Phone
  ctx.textAlign = "left";
  ctx.fillText(config.store_whatsapp || "+62 815-4919-3834", paddingX, footerY);

  // Center: Website / Social
  ctx.textAlign = "center";
  ctx.fillText(config.store_website || "WWW.STITCHANDMORAL.COM", width / 2, footerY);

  // Right: Address
  ctx.textAlign = "right";
  ctx.fillText(config.store_address || "PALANGKA RAYA, KALTENG", width - paddingX, footerY);

  return canvas;
}
