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
      ctx.fillStyle = "#666666";
      ctx.font = "500 9.5px 'Courier New', Courier, monospace";
      const normalPriceStr = formatRupiah(pkg.harga);
      const normalPriceW = ctx.measureText(normalPriceStr).width;
      ctx.fillText(normalPriceStr, rightX, itemY - 2);

      ctx.strokeStyle = "#666666";
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(rightX - normalPriceW, itemY - 5);
      ctx.lineTo(rightX, itemY - 5);
      ctx.stroke();

      ctx.fillStyle = mainColor;
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
      ctx.fillStyle = "#666666";
      ctx.font = "500 9.5px 'Courier New', Courier, monospace";
      const normalPriceStr = formatRupiah(pkg.harga);
      const normalPriceW = ctx.measureText(normalPriceStr).width;
      ctx.fillText(normalPriceStr, rightEdge, itemY - 2);

      ctx.strokeStyle = "#666666";
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(rightEdge - normalPriceW, itemY - 5);
      ctx.lineTo(rightEdge, itemY - 5);
      ctx.stroke();

      ctx.fillStyle = mainColor;
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
  const sec2H = 260;

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

  // Vertical Divider for Promos
  ctx.beginPath();
  ctx.moveTo(midX, y + 36);
  ctx.lineTo(midX, y + sec2H);
  ctx.stroke();

  // Render Left Promo (e.g. Promo 1)
  const promo1 = activePromos[0];
  if (promo1) {
    let pY = y + 58;
    ctx.textAlign = "left";
    ctx.fillStyle = mainColor;
    ctx.font = "900 11.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(promo1.judul.toUpperCase(), paddingX + 16, pY);

    pY += 16;
    // Validity Period Box
    ctx.fillStyle = mainColor;
    ctx.font = "700 9.5px 'Courier New', Courier, monospace";
    const dateText = promo1.periode_label
      ? `PERIODE: ${promo1.periode_label.toUpperCase()}`
      : promo1.tanggal_mulai && promo1.tanggal_berakhir
        ? `PERIODE: ${formatDateIndo(promo1.tanggal_mulai).toUpperCase()} - ${formatDateIndo(promo1.tanggal_berakhir).toUpperCase()}`
        : "PERIODE: BERLAKU SETIAP HARI";
    ctx.fillText(dateText, paddingX + 16, pY);

    pY += 16;
    ctx.font = "700 10.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(`POTONGAN: ${formatRupiah(promo1.diskon_nominal)}`, paddingX + 16, pY);

    pY += 16;
    ctx.fillStyle = subColor;
    ctx.font = "400 9px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    // Text wrapping for promo requirement
    const maxW = colWidth - 32;
    const words = promo1.syarat.split(" ");
    let line = "";
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxW && n > 0) {
        ctx.fillText(line, paddingX + 16, pY);
        line = words[n] + " ";
        pY += 13;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, paddingX + 16, pY);
  }

  // Render Right Promo (e.g. Promo 2)
  const promo2 = activePromos[1];
  if (promo2) {
    let pY = y + 58;
    ctx.textAlign = "left";
    ctx.fillStyle = mainColor;
    ctx.font = "900 11.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(promo2.judul.toUpperCase(), midX + 16, pY);

    pY += 16;
    // Validity Period Box
    ctx.fillStyle = mainColor;
    ctx.font = "700 9.5px 'Courier New', Courier, monospace";
    const dateText = promo2.periode_label
      ? `PERIODE: ${promo2.periode_label.toUpperCase()}`
      : promo2.tanggal_mulai && promo2.tanggal_berakhir
        ? `PERIODE: ${formatDateIndo(promo2.tanggal_mulai).toUpperCase()} - ${formatDateIndo(promo2.tanggal_berakhir).toUpperCase()}`
        : "PERIODE: BERLAKU SETIAP HARI";
    ctx.fillText(dateText, midX + 16, pY);

    pY += 16;
    ctx.font = "700 10.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(`POTONGAN: ${formatRupiah(promo2.diskon_nominal)}`, midX + 16, pY);

    pY += 16;
    ctx.fillStyle = subColor;
    ctx.font = "400 9px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    // Text wrapping for promo requirement
    const maxW = colWidth - 32;
    const words = promo2.syarat.split(" ");
    let line = "";
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxW && n > 0) {
        ctx.fillText(line, midX + 16, pY);
        line = words[n] + " ";
        pY += 13;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, midX + 16, pY);
  }

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
