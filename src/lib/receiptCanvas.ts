import { Transaksi } from "@/types/database";
import { ReceiptConfig, DEFAULT_RECEIPT_CONFIG } from "@/types/receipt";
import { formatRupiah, formatDateIndo } from "@/lib/utils";

/**
 * Generates an Indonesian minimalist boxed-grid invoice receipt canvas
 * Matching the exact typography-driven editorial aesthetic from the Pricelist (Hero title + 3-column top bar)
 */
export function generateReceiptCanvas(
  tx: Transaksi,
  customConfig?: ReceiptConfig
): HTMLCanvasElement {
  const config = customConfig || DEFAULT_RECEIPT_CONFIG;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  const width = 800;
  const padding = 40;
  const contentWidth = width - padding * 2;

  // Fixed A4 Aspect Ratio: 800 x 1132
  const height = 1132;

  // High-DPI scaling (2x for retina crispness)
  const scale = 2;
  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.scale(scale, scale);

  // Background: Pure White
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  const mainColor = "#181818";
  const subColor = "#4A4A4A";
  const borderColor = "#222222";
  const accentColor = "#FF4D00";

  let y = padding + 12;

  // 1. TOP BAR (3-Column Subtitles - Identical to Pricelist)
  ctx.fillStyle = mainColor;
  ctx.font = "700 9.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.letterSpacing = "2.5px";

  // Left
  ctx.textAlign = "left";
  ctx.fillText((config.brand_sub || "SEWA JAS & TUXEDO").toUpperCase(), padding, y);

  // Center
  ctx.textAlign = "center";
  ctx.fillText((config.brand_name || "STITCH & MORAL").toUpperCase(), width / 2, y);

  // Right
  ctx.textAlign = "right";
  ctx.fillText("OFFICIAL INVOICE", width - padding, y);

  // Hairline Divider under Top Bar
  y += 12;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();

  // 2. HERO BIG TITLE: "INVOICE Receipt" (Dual Typography - Identical to Pricelist "PRICE List")
  y += 62;
  ctx.textAlign = "center";

  // Word 1 in Heavy Sans ("INVOICE") + Word 2 in Italic Serif (" Receipt")
  ctx.font = "900 68px 'Arial Black', 'Impact', -apple-system, sans-serif";
  ctx.letterSpacing = "5px";
  const heroWord1 = (config.title || "INVOICE").toUpperCase();
  const word1Metrics = ctx.measureText(heroWord1);

  ctx.font = "italic 400 74px 'Playfair Display', 'Georgia', 'Times New Roman', serif";
  ctx.letterSpacing = "2px";
  const heroWord2 = " Receipt";
  const word2Metrics = ctx.measureText(heroWord2);

  const totalHeroWidth = word1Metrics.width + word2Metrics.width;
  const heroStartX = (width - totalHeroWidth) / 2;

  ctx.textAlign = "left";
  ctx.fillStyle = mainColor;
  ctx.font = "900 68px 'Arial Black', 'Impact', -apple-system, sans-serif";
  ctx.letterSpacing = "5px";
  ctx.fillText(heroWord1, heroStartX, y);

  ctx.font = "italic 400 74px 'Playfair Display', 'Georgia', 'Times New Roman', serif";
  ctx.letterSpacing = "2px";
  ctx.fillText(heroWord2, heroStartX + word1Metrics.width, y);

  // Hairline Divider under Hero Title
  y += 20;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();

  // 3. META & STORE INFO SECTION (2 Columns)
  y += 20;
  const rightEdge = width - padding;

  // Left Column: Transaction Dates
  ctx.textAlign = "left";
  ctx.fillStyle = mainColor;
  ctx.font = "700 10.5px 'Courier New', Courier, monospace";
  ctx.fillText(`NOMOR TRANSAKSI : #${tx.kode_transaksi}`, padding, y);
  y += 15;
  ctx.fillText(`TANGGAL SEWA    : ${formatDateIndo(tx.tanggal_sewa).toUpperCase()}`, padding, y);
  y += 15;
  ctx.fillText(`TGL PENGEMBALIAN: ${formatDateIndo(tx.tanggal_kembali).toUpperCase()}`, padding, y);

  // Right Column: Store Details
  const rightMetaY = y - 30;
  ctx.textAlign = "right";
  ctx.fillStyle = mainColor;
  ctx.font = "900 11.5px 'Arial Black', -apple-system, sans-serif";
  ctx.fillText((config.brand_name || "STITCH & MORAL").toUpperCase(), rightEdge, rightMetaY);

  ctx.fillStyle = subColor;
  ctx.font = "500 9px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText((config.store_address || "JL. PANGERAN SAMUDERA INDUK NO. 11").toUpperCase(), rightEdge, rightMetaY + 14);
  ctx.fillText((config.store_city || "PALANGKA RAYA").toUpperCase(), rightEdge, rightMetaY + 26);
  ctx.fillText(`WA: ${config.store_whatsapp || "+62 815-4919-3834"}`, rightEdge, rightMetaY + 38);

  y += 24;

  // 4. CUSTOMER DETAILS ("DITAGIHKAN KEPADA")
  const startMs = new Date(String(tx.tanggal_sewa).slice(0, 10) + "T00:00:00").getTime();
  const endMs = new Date(String(tx.tanggal_kembali).slice(0, 10) + "T00:00:00").getTime();
  const rentalDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24))) || 1;

  ctx.textAlign = "left";
  ctx.fillStyle = mainColor;
  ctx.font = "700 10.5px 'Courier New', Courier, monospace";
  ctx.fillText("DITAGIHKAN KEPADA:", padding, y);
  y += 16;

  ctx.font = "900 13.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(tx.nama_customer.toUpperCase(), padding, y);
  y += 15;

  ctx.fillStyle = subColor;
  ctx.font = "500 10px 'Courier New', Courier, monospace";
  ctx.fillText(`WHATSAPP : +${tx.whatsapp || "-"}`, padding, y);
  y += 14;
  ctx.fillText(`STATUS   : ${tx.status.toUpperCase()} (${rentalDays} HARI SEWA)`, padding, y);

  y += 20;

  // 5. TABLE SECTION (Box-Grid Monochromatic Style)
  const colDescW = 340;
  const colQtyW = 70;
  const colPriceW = 150;
  const col1X = padding;
  const col2X = col1X + colDescW;
  const col3X = col2X + colQtyW;
  const col4X = col3X + colPriceW;
  const tableRight = padding + contentWidth;

  const rowHeight = 34;
  const tableHeaderY = y;

  // Header Box
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(padding, tableHeaderY, contentWidth, rowHeight);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(padding, tableHeaderY, contentWidth, rowHeight);

  // Vertical Header Lines
  ctx.beginPath();
  ctx.moveTo(col2X, tableHeaderY);
  ctx.lineTo(col2X, tableHeaderY + rowHeight);
  ctx.moveTo(col3X, tableHeaderY);
  ctx.lineTo(col3X, tableHeaderY + rowHeight);
  ctx.moveTo(col4X, tableHeaderY);
  ctx.lineTo(col4X, tableHeaderY + rowHeight);
  ctx.stroke();

  // Header Texts
  ctx.fillStyle = mainColor;
  ctx.font = "900 10.5px 'Courier New', Courier, monospace";
  ctx.letterSpacing = "1px";

  ctx.textAlign = "left";
  ctx.fillText("DESKRIPSI / ITEM", col1X + 12, tableHeaderY + 21);

  ctx.textAlign = "center";
  ctx.fillText("JUMLAH", col2X + colQtyW / 2, tableHeaderY + 21);

  ctx.textAlign = "right";
  ctx.fillText("HARGA / HARI", col3X + colPriceW - 12, tableHeaderY + 21);
  ctx.fillText("SUBTOTAL", tableRight - 12, tableHeaderY + 21);

  let currentY = tableHeaderY + rowHeight;
  const items = tx.items || [];
  const minRows = Math.max(items.length, 3);

  // Render Item Rows
  for (let i = 0; i < minRows; i++) {
    const item = items[i];
    const rH = item ? 40 : 34;

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 0.9;
    ctx.strokeRect(padding, currentY, contentWidth, rH);

    ctx.beginPath();
    ctx.moveTo(col2X, currentY);
    ctx.lineTo(col2X, currentY + rH);
    ctx.moveTo(col3X, currentY);
    ctx.lineTo(col3X, currentY + rH);
    ctx.moveTo(col4X, currentY);
    ctx.lineTo(col4X, currentY + rH);
    ctx.stroke();

    if (item) {
      const itemDays = item.durasi_hari || rentalDays;
      const dailyPrice = item.harga_per_hari || Math.round(item.harga / itemDays) || item.harga;
      const itemTotal = item.harga * item.jumlah;

      ctx.textAlign = "left";
      ctx.fillStyle = mainColor;
      ctx.font = "700 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(item.namaJas.toUpperCase(), col1X + 12, currentY + 16);

      ctx.fillStyle = subColor;
      ctx.font = "400 9px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(`${item.warna || "-"} • UKURAN ${item.ukuran || "-"} (${itemDays} HARI)`.toUpperCase(), col1X + 12, currentY + 29);

      ctx.fillStyle = mainColor;
      ctx.font = "700 10.5px 'Courier New', Courier, monospace";
      ctx.textAlign = "center";
      ctx.fillText(String(item.jumlah).padStart(2, "0"), col2X + colQtyW / 2, currentY + 22);

      ctx.textAlign = "right";
      ctx.fillText(formatRupiah(dailyPrice), col3X + colPriceW - 12, currentY + 22);

      ctx.font = "900 10.5px 'Courier New', Courier, monospace";
      ctx.fillText(formatRupiah(itemTotal), tableRight - 12, currentY + 22);
    }

    currentY += rH;
  }

  // 6. FINANCIAL SUMMARY ROWS
  const renderSummaryRow = (label: string, valueStr: string, isTotal: boolean = false, isAccent: boolean = false) => {
    const sH = isTotal ? 40 : 30;

    if (isTotal) {
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(padding, currentY, contentWidth, sH);
    }

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = isTotal ? 1.4 : 0.9;
    ctx.strokeRect(padding, currentY, contentWidth, sH);

    ctx.beginPath();
    ctx.moveTo(col4X, currentY);
    ctx.lineTo(col4X, currentY + sH);
    ctx.stroke();

    ctx.textAlign = "right";
    if (isTotal) {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 11px 'Courier New', Courier, monospace";
      ctx.letterSpacing = "1.5px";
      ctx.fillText(label.toUpperCase(), col4X - 16, currentY + 25);

      ctx.fillStyle = accentColor;
      ctx.font = "900 14px 'Courier New', Courier, monospace";
      ctx.fillText(valueStr, tableRight - 14, currentY + 25);
    } else {
      ctx.fillStyle = mainColor;
      ctx.font = "700 10px 'Courier New', Courier, monospace";
      ctx.letterSpacing = "0.5px";
      ctx.fillText(label.toUpperCase(), col4X - 16, currentY + 19);

      ctx.fillStyle = isAccent ? accentColor : mainColor;
      ctx.font = "700 10.5px 'Courier New', Courier, monospace";
      ctx.fillText(valueStr, tableRight - 14, currentY + 19);
    }

    currentY += sH;
  };

  renderSummaryRow("SUBTOTAL SEWA", formatRupiah(tx.subtotal));

  if (tx.potongan > 0) {
    renderSummaryRow("POTONGAN DISKON", `-${formatRupiah(tx.potongan)}`, false, true);
  }

  if (tx.deposit > 0) {
    renderSummaryRow("DEPOSIT JAMINAN", formatRupiah(tx.deposit));
  }

  if (tx.denda > 0) {
    renderSummaryRow("DENDA KETERLAMBATAN", `+${formatRupiah(tx.denda)}`, false, true);
  }

  // TOTAL BAYAR
  renderSummaryRow("TOTAL PEMBAYARAN", formatRupiah(tx.total_bayar), true);

  renderSummaryRow("SUDAH DIBAYAR", formatRupiah(tx.jumlah_dibayar || 0));

  if (tx.sisa_pembayaran > 0) {
    renderSummaryRow("SISA PEMBAYARAN", formatRupiah(tx.sisa_pembayaran), false, true);
  } else {
    renderSummaryRow("STATUS PEMBAYARAN", "LUNAS ✓", false, false);
  }

  if (tx.catatan) {
    currentY += 10;
    ctx.textAlign = "left";
    ctx.fillStyle = subColor;
    ctx.font = "italic 9.5px 'Roboto', -apple-system, sans-serif";
    ctx.fillText(`Catatan: ${tx.catatan}`, padding, currentY);
  }

  // 7. FOOTER: TERMS & CONDITIONS & SIGNATURE
  const footerTopY = height - padding - 120;

  // Left: Terms & Conditions
  const termsW = 350;
  ctx.textAlign = "left";
  ctx.fillStyle = mainColor;
  ctx.font = "900 10px 'Arial Black', -apple-system, sans-serif";
  ctx.letterSpacing = "0.5px";
  ctx.fillText("SYARAT & KETENTUAN", padding, footerTopY);

  let termY = footerTopY + 15;
  ctx.fillStyle = subColor;
  ctx.font = "400 8.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const termsList = config.terms && config.terms.length > 0 ? config.terms : DEFAULT_RECEIPT_CONFIG.terms;

  termsList.forEach((term, idx) => {
    ctx.fillText(`${idx + 1}. ${term}`, padding, termY);
    termY += 12.5;
  });

  // Middle: Contact Box
  const midColX = padding + termsW + 10;
  ctx.fillStyle = mainColor;
  ctx.font = "700 8.5px 'Courier New', Courier, monospace";
  ctx.fillText("INFORMASI & BANTUAN:", midColX, footerTopY + 10);
  ctx.fillStyle = subColor;
  ctx.font = "400 8px 'Courier New', Courier, monospace";
  ctx.fillText("WHATSAPP:", midColX, footerTopY + 23);
  ctx.fillText(config.store_whatsapp || "+62 815-4919-3834", midColX, footerTopY + 34);

  // Right: Signature Area
  const sigRightX = tableRight;
  const sigWidth = 150;
  const sigStartX = sigRightX - sigWidth;

  if (config.show_signature !== false) {
    ctx.strokeStyle = "#181818";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sigStartX + 10, footerTopY + 42);
    ctx.bezierCurveTo(sigStartX + 30, footerTopY + 15, sigStartX + 60, footerTopY + 55, sigStartX + 85, footerTopY + 28);
    ctx.bezierCurveTo(sigStartX + 105, footerTopY + 10, sigStartX + 125, footerTopY + 46, sigStartX + 140, footerTopY + 38);
    ctx.stroke();
  }

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(sigStartX, footerTopY + 52);
  ctx.lineTo(sigRightX, footerTopY + 52);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = mainColor;
  ctx.font = "900 9.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText((config.manager_name || "ADMIN STITCH & MORAL").toUpperCase(), sigStartX + sigWidth / 2, footerTopY + 65);

  ctx.fillStyle = subColor;
  ctx.font = "600 8px 'Courier New', Courier, monospace";
  ctx.fillText((config.manager_title || "PENANGGUNG JAWAB").toUpperCase(), sigStartX + sigWidth / 2, footerTopY + 76);

  return canvas;
}
