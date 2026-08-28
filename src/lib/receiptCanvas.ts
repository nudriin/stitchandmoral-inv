import { Transaksi } from "@/types/database";
import { formatRupiah, formatDateIndo } from "@/lib/utils";

/**
 * Generates a high-resolution, pixel-perfect Receipt Canvas
 * Pure native Canvas 2D API — zero CSS dependency, 100% reliable across all browsers & iOS/Android devices.
 */
export function generateReceiptCanvas(tx: Transaksi): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  const width = 720;
  const padding = 40;
  const contentWidth = width - padding * 2;

  // Calculate dynamic height based on items count
  const itemsCount = tx.items?.length || 0;
  let estimatedHeight = 680 + itemsCount * 55;
  if (tx.catatan) estimatedHeight += 40;
  if (tx.deposit > 0) estimatedHeight += 25;
  if (tx.potongan > 0) estimatedHeight += 25;
  if (tx.denda > 0) estimatedHeight += 25;

  const height = estimatedHeight;

  // Set high-DPI scaling (2x for retina sharpness)
  const scale = 2;
  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // Outer Border & Card Shadow Simulation
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  let y = 50;

  // Top Header Logo / Name
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("STITCH & MORAL", width / 2, y);

  y += 22;
  ctx.fillStyle = "#64748B";
  ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("SEWA JAS & TUXEDO PALANGKARAYA", width / 2, y);

  y += 18;
  ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#94A3B8";
  ctx.fillText("Struk Bukti Sewa & Transaksi", width / 2, y);

  // Dashed separator
  y += 20;
  drawDashedLine(ctx, padding, y, width - padding, y);

  // Info Grid (2 Columns)
  y += 24;
  ctx.textAlign = "left";
  ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#475569";

  const leftX = padding;
  const rightX = width / 2 + 10;
  const colY = y;

  // Left Column
  ctx.fillText("No Transaksi", leftX, colY);
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(tx.kode_transaksi, leftX, colY + 18);

  ctx.fillStyle = "#475569";
  ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Customer", leftX, colY + 42);
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(tx.nama_customer, leftX, colY + 60);

  ctx.fillStyle = "#475569";
  ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("WhatsApp: +" + (tx.whatsapp || "-"), leftX, colY + 80);

  // Right Column
  ctx.fillText("Tgl Sewa", rightX, colY);
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(formatDateIndo(tx.tanggal_sewa), rightX, colY + 18);

  ctx.fillStyle = "#475569";
  ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Tgl Kembali", rightX, colY + 42);
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(formatDateIndo(tx.tanggal_kembali), rightX, colY + 60);

  ctx.fillStyle = "#475569";
  ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Status: " + tx.status, rightX, colY + 80);

  y += 105;
  drawDashedLine(ctx, padding, y, width - padding, y);

  // Items Table Header
  y += 18;
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(padding, y - 14, contentWidth, 26);
  ctx.fillStyle = "#334155";
  ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("ITEM / VARIAN", padding + 8, y + 3);
  ctx.textAlign = "center";
  ctx.fillText("QTY", width - padding - 210, y + 3);
  ctx.textAlign = "right";
  ctx.fillText("HARGA", width - padding - 110, y + 3);
  ctx.fillText("TOTAL", width - padding - 8, y + 3);

  y += 24;

  // Items List
  (tx.items || []).forEach((item) => {
    ctx.textAlign = "left";
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(item.namaJas, padding + 8, y);

    ctx.fillStyle = "#64748B";
    ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(`${item.warna || "-"} / ${item.ukuran || "-"}`, padding + 8, y + 16);

    ctx.fillStyle = "#0F172A";
    ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(item.jumlah), width - padding - 210, y + 6);

    ctx.textAlign = "right";
    ctx.fillText(formatRupiah(item.harga), width - padding - 110, y + 6);

    ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(formatRupiah(item.harga * item.jumlah), width - padding - 8, y + 6);

    y += 38;
    ctx.strokeStyle = "#F1F5F9";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, y - 8);
    ctx.lineTo(width - padding, y - 8);
    ctx.stroke();
  });

  y += 8;
  drawDashedLine(ctx, padding, y, width - padding, y);

  // Financial Breakdown
  y += 20;
  ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  // Subtotal
  ctx.textAlign = "left";
  ctx.fillStyle = "#475569";
  ctx.fillText("Subtotal", padding + 8, y);
  ctx.textAlign = "right";
  ctx.fillStyle = "#0F172A";
  ctx.fillText(formatRupiah(tx.subtotal), width - padding - 8, y);

  if (tx.deposit > 0) {
    y += 22;
    ctx.textAlign = "left";
    ctx.fillStyle = "#475569";
    ctx.fillText("Deposit Jaminan", padding + 8, y);
    ctx.textAlign = "right";
    ctx.fillStyle = "#0F172A";
    ctx.fillText(formatRupiah(tx.deposit), width - padding - 8, y);
  }

  if (tx.potongan > 0) {
    y += 22;
    ctx.textAlign = "left";
    ctx.fillStyle = "#059669";
    ctx.fillText("Potongan / Diskon", padding + 8, y);
    ctx.textAlign = "right";
    ctx.fillText("-" + formatRupiah(tx.potongan), width - padding - 8, y);
  }

  if (tx.denda > 0) {
    y += 22;
    ctx.textAlign = "left";
    ctx.fillStyle = "#E11D48";
    ctx.fillText("Denda Keterlambatan", padding + 8, y);
    ctx.textAlign = "right";
    ctx.fillText("+" + formatRupiah(tx.denda), width - padding - 8, y);
  }

  // TOTAL BAYAR Box
  y += 18;
  ctx.fillStyle = "#0F172A";
  ctx.fillRect(padding, y, contentWidth, 38);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("TOTAL BAYAR", padding + 14, y + 24);

  ctx.textAlign = "right";
  ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#34D399";
  ctx.fillText(formatRupiah(tx.total_bayar), width - padding - 14, y + 25);

  y += 54;

  // Payment Status Details
  ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = "#475569";
  ctx.fillText("Sudah Dibayar", padding + 8, y);
  ctx.textAlign = "right";
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(formatRupiah(tx.jumlah_dibayar || 0), width - padding - 8, y);

  y += 24;
  if (tx.sisa_pembayaran > 0) {
    ctx.textAlign = "left";
    ctx.fillStyle = "#E11D48";
    ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("Sisa Pembayaran (Belum Lunas)", padding + 8, y);
    ctx.textAlign = "right";
    ctx.fillText(formatRupiah(tx.sisa_pembayaran), width - padding - 8, y);
  } else {
    ctx.fillStyle = "#ECFDF5";
    ctx.fillRect(padding + 4, y - 14, contentWidth - 8, 26);
    ctx.fillStyle = "#047857";
    ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✓ STATUS: PEMBAYARAN LUNAS", width / 2, y + 4);
  }

  if (tx.catatan) {
    y += 28;
    ctx.textAlign = "left";
    ctx.fillStyle = "#64748B";
    ctx.font = "italic 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("Catatan: " + tx.catatan, padding + 8, y);
  }

  // Footer Note
  y += 35;
  drawDashedLine(ctx, padding, y, width - padding, y);
  y += 22;
  ctx.textAlign = "center";
  ctx.fillStyle = "#94A3B8";
  ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Terima kasih telah menyewa di Stitch & Moral.", width / 2, y);
  y += 16;
  ctx.fillText("Harap simpan struk ini sebagai bukti transaksi resmi.", width / 2, y);

  return canvas;
}

function drawDashedLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  ctx.save();
  ctx.strokeStyle = "#CBD5E1";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}
