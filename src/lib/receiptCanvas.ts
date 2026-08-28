import { Transaksi } from "@/types/database";
import { formatRupiah, formatDateIndo } from "@/lib/utils";

/**
 * Generates a clean, sleek, and minimalist receipt canvas using Roboto font
 * Focuses on clarity, generous whitespace, and prominent highlights for key transaction details.
 */
export function generateReceiptCanvas(tx: Transaksi): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  const width = 760;
  const padding = 40;
  const contentWidth = width - padding * 2;

  // Calculate dynamic height based on items count
  const itemsCount = tx.items?.length || 0;
  let estimatedHeight = 840 + itemsCount * 50;
  if (tx.catatan) estimatedHeight += 35;
  if (tx.deposit > 0) estimatedHeight += 22;
  if (tx.potongan > 0) estimatedHeight += 22;
  if (tx.denda > 0) estimatedHeight += 22;

  const height = estimatedHeight;

  // High-DPI scaling (2x for retina crispness)
  const scale = 2;
  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.scale(scale, scale);

  // Pure White Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // Clean Single Hairline Outer Frame
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 1;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  let y = 56;

  // Header: Minimalist Brand Title
  ctx.fillStyle = "#0F172A";
  ctx.font = "900 22px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("STITCH & MORAL", width / 2, y);

  y += 18;
  ctx.fillStyle = "#64748B";
  ctx.font = "500 10.5px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.letterSpacing = "1.5px";
  ctx.fillText("SEWA JAS & TUXEDO PALANGKARAYA", width / 2, y);

  // Single Subtle Divider
  y += 20;
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();

  // Meta Section (Minimalist 2-Column Grid)
  y += 24;
  ctx.textAlign = "left";
  ctx.font = "400 11px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#64748B";

  const leftX = padding;
  const rightX = width / 2 + 10;
  const colY = y;

  // Left Column (Transaction & Customer)
  ctx.fillText("No. Transaksi", leftX, colY);
  ctx.fillStyle = "#0F172A";
  ctx.font = "700 13px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(tx.kode_transaksi, leftX, colY + 16);

  ctx.fillStyle = "#64748B";
  ctx.font = "400 11px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("Customer", leftX, colY + 36);
  ctx.fillStyle = "#0F172A";
  ctx.font = "700 13px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(tx.nama_customer, leftX, colY + 52);

  ctx.fillStyle = "#64748B";
  ctx.font = "400 11px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("WhatsApp: +" + (tx.whatsapp || "-"), leftX, colY + 70);

  // Right Column (Right-Aligned to margin)
  ctx.textAlign = "right";
  const rightEdge = width - padding;

  ctx.fillText("Tgl Mulai Sewa", rightEdge, colY);
  ctx.fillStyle = "#0F172A";
  ctx.font = "500 12px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(formatDateIndo(tx.tanggal_sewa), rightEdge, colY + 16);

  ctx.fillStyle = "#64748B";
  ctx.font = "500 11px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("Tgl Wajib Kembali", rightEdge, colY + 36);
  ctx.fillStyle = "#0F172A";
  ctx.font = "700 13px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(formatDateIndo(tx.tanggal_kembali), rightEdge, colY + 52);

  ctx.fillStyle = "#64748B";
  ctx.font = "400 11px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("Status: " + tx.status, rightEdge, colY + 70);

  y += 88;

  // Table Header
  ctx.strokeStyle = "#CBD5E1";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();

  y += 16;
  ctx.fillStyle = "#64748B";
  ctx.font = "700 10.5px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("ITEM / VARIAN", padding, y);
  ctx.textAlign = "center";
  ctx.fillText("QTY", width - padding - 210, y);
  ctx.textAlign = "right";
  ctx.fillText("HARGA", width - padding - 110, y);
  ctx.fillText("TOTAL", width - padding, y);

  y += 10;
  ctx.strokeStyle = "#E2E8F0";
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();

  y += 18;

  // Table Items
  (tx.items || []).forEach((item) => {
    ctx.textAlign = "left";
    ctx.fillStyle = "#0F172A";
    ctx.font = "700 12px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(item.namaJas, padding, y);

    ctx.fillStyle = "#64748B";
    ctx.font = "400 11px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(`${item.warna || "-"} • Ukuran ${item.ukuran || "-"}`, padding, y + 14);

    ctx.fillStyle = "#0F172A";
    ctx.font = "400 12px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(item.jumlah), width - padding - 210, y + 5);

    ctx.textAlign = "right";
    ctx.fillText(formatRupiah(item.harga), width - padding - 110, y + 5);

    ctx.font = "700 12px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(formatRupiah(item.harga * item.jumlah), width - padding, y + 5);

    y += 34;
    ctx.strokeStyle = "#F1F5F9";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, y - 6);
    ctx.lineTo(width - padding, y - 6);
    ctx.stroke();
  });

  // Financial Breakdown
  y += 6;
  ctx.font = "400 11.5px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";

  // Subtotal
  ctx.textAlign = "left";
  ctx.fillStyle = "#64748B";
  ctx.fillText("Subtotal Sewa", padding, y);
  ctx.textAlign = "right";
  ctx.fillStyle = "#0F172A";
  ctx.font = "500 12px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(formatRupiah(tx.subtotal), width - padding, y);

  if (tx.deposit > 0) {
    y += 18;
    ctx.textAlign = "left";
    ctx.fillStyle = "#64748B";
    ctx.font = "400 11.5px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("Deposit Jaminan", padding, y);
    ctx.textAlign = "right";
    ctx.fillStyle = "#0F172A";
    ctx.font = "500 12px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(formatRupiah(tx.deposit), width - padding, y);
  }

  if (tx.potongan > 0) {
    y += 18;
    ctx.textAlign = "left";
    ctx.fillStyle = "#059669";
    ctx.font = "400 11.5px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("Potongan Diskon", padding, y);
    ctx.textAlign = "right";
    ctx.font = "700 12px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("-" + formatRupiah(tx.potongan), width - padding, y);
  }

  if (tx.denda > 0) {
    y += 18;
    ctx.textAlign = "left";
    ctx.fillStyle = "#E11D48";
    ctx.font = "400 11.5px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("Denda Keterlambatan", padding, y);
    ctx.textAlign = "right";
    ctx.font = "700 12px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("+" + formatRupiah(tx.denda), width - padding, y);
  }

  // TOTAL BAYAR Highlight Box
  y += 16;
  ctx.fillStyle = "#0F172A";
  ctx.fillRect(padding, y, contentWidth, 36);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 12px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("TOTAL PEMBAYARAN", padding + 12, y + 23);

  ctx.textAlign = "right";
  ctx.font = "900 15px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#34D399";
  ctx.fillText(formatRupiah(tx.total_bayar), width - padding - 12, y + 24);

  y += 50;

  // Payment Status Summary
  ctx.font = "400 12px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = "#64748B";
  ctx.fillText("Sudah Dibayar", padding, y);
  ctx.textAlign = "right";
  ctx.fillStyle = "#0F172A";
  ctx.font = "700 12px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(formatRupiah(tx.jumlah_dibayar || 0), width - padding, y);

  y += 20;
  if (tx.sisa_pembayaran > 0) {
    ctx.textAlign = "left";
    ctx.fillStyle = "#E11D48";
    ctx.font = "700 12px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("Sisa Pembayaran", padding, y);
    ctx.textAlign = "right";
    ctx.font = "700 13px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(formatRupiah(tx.sisa_pembayaran), width - padding, y);
  } else {
    ctx.fillStyle = "#ECFDF5";
    ctx.fillRect(padding, y - 12, contentWidth, 22);
    ctx.fillStyle = "#047857";
    ctx.font = "700 10.5px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✓ STATUS: PEMBAYARAN SUDAH LUNAS", width / 2, y + 3);
  }

  if (tx.catatan) {
    y += 24;
    ctx.textAlign = "left";
    ctx.fillStyle = "#64748B";
    ctx.font = "italic 10.5px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("Catatan: " + tx.catatan, padding, y);
  }

  // Syarat & Ketentuan Section (Minimalist & Compact)
  y += 28;
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(padding, y, contentWidth, 105);
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 1;
  ctx.strokeRect(padding, y, contentWidth, 105);

  ctx.fillStyle = "#0F172A";
  ctx.font = "700 10px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("SYARAT & KETENTUAN SEWA:", padding + 10, y + 16);

  ctx.font = "400 9.5px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#475569";
  const terms = [
    "1. Wajib menitipkan kartu identitas asli (KTP/SIM) selama masa sewa.",
    "2. Sistem sewa H-1 ambil & H+1 kembali. Keterlambatan dikenakan denda harian.",
    "3. Dilarang mencuci / menyetrika jas sendiri (laundry ditangani toko).",
    "4. Kerusakan / kehilangan jas & aksesoris dikenakan biaya penggantian.",
    "5. Harap cek kondisi jas saat serah terima & simpan struk ini.",
  ];

  let termY = y + 30;
  terms.forEach((term) => {
    ctx.fillText(term, padding + 10, termY);
    termY += 14;
  });

  // Footer Store Info
  y += 124;
  ctx.textAlign = "center";
  ctx.fillStyle = "#64748B";
  ctx.font = "400 9.5px 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("Stitch & Moral  •  WA: 081549193834  •  Jl. Pangeran Samudera Induk No. 11, Palangka Raya", width / 2, y);

  return canvas;
}
