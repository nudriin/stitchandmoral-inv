import type { PricelistConfig } from "@/types/pricelist";
import { formatRupiah, formatDateIndo } from "./utils";

/**
 * Formats a PricelistConfig into a clean, minimalist WhatsApp message
 * strictly without emojis and focusing on clean typography and promo validity.
 */
export function formatPricelistWhatsApp(config: PricelistConfig): string {
  const lines: string[] = [];

  // Header
  lines.push(`*${config.store_name}*`);
  if (config.subtitle_left || config.subtitle_right) {
    lines.push(`${config.subtitle_left || "SEWA JAS"} | ${config.subtitle_right || "PRICE LIST"}`);
  }
  if (config.store_address) {
    lines.push(config.store_address);
  }
  lines.push("----------------------------------------");

  // Greeting
  if (config.header_greeting) {
    lines.push(config.header_greeting);
    lines.push("");
  }

  // Packages List
  if (config.packages && config.packages.length > 0) {
    lines.push("*DAFTAR HARGA SEWA:*");
    config.packages.forEach((pkg) => {
      const bonusText = pkg.bonus ? ` (${pkg.bonus})` : "";
      if (pkg.harga_diskon && pkg.harga_diskon < pkg.harga) {
        lines.push(
          `- ${pkg.nama}${bonusText} : ~${formatRupiah(pkg.harga)}~ -> *${formatRupiah(pkg.harga_diskon)}*`
        );
      } else {
        lines.push(`- ${pkg.nama}${bonusText} : *${formatRupiah(pkg.harga)}*`);
      }
    });
    lines.push("");
  }

  // Promos with Validity Date
  const activePromos = (config.promos || []).filter((p) => p.aktif);
  if (activePromos.length > 0) {
    lines.push("*PROMO & POTONGAN KHUSUS:*");
    activePromos.forEach((promo) => {
      lines.push(`[+] *${promo.judul}*`);

      // Date Validity
      if (promo.periode_label) {
        lines.push(`    Periode: ${promo.periode_label}`);
      } else if (promo.tanggal_mulai && promo.tanggal_berakhir) {
        lines.push(
          `    Periode: ${formatDateIndo(promo.tanggal_mulai)} s/d ${formatDateIndo(promo.tanggal_berakhir)}`
        );
      }

      lines.push(`    Syarat: ${promo.syarat}`);
      lines.push("");
    });
  }

  // Terms & Conditions
  if (config.ketentuan_sewa && config.ketentuan_sewa.length > 0) {
    lines.push("*KETENTUAN SEWA:*");
    config.ketentuan_sewa.forEach((term, idx) => {
      lines.push(`${idx + 1}. ${term}`);
    });
    lines.push("");
  }

  // Deposit & Late Fee Notes
  if (config.deposit_info || config.late_fee_info) {
    if (config.deposit_info) lines.push(`- ${config.deposit_info}`);
    if (config.late_fee_info) lines.push(`- ${config.late_fee_info}`);
    lines.push("");
  }

  // Footer Closing
  if (config.footer_text) {
    lines.push(config.footer_text);
  }

  return lines.join("\n");
}
