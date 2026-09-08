import jsPDF from "jspdf";
import { PricelistConfig } from "@/types/pricelist";
import { generatePricelistCanvas } from "./pricelistCanvas";

/**
 * Generates an official A4 PDF document from the Pricelist Canvas
 */
export function generatePricelistPdf(config: PricelistConfig): jsPDF {
  const canvas = generatePricelistCanvas(config);
  // High quality JPEG (0.90) compresses file size from ~10MB down to ~800KB - 1.5MB while retaining razor-sharp text
  const imgData = canvas.toDataURL("image/jpeg", 0.90);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const margin = 14;
  const printWidth = pageWidth - margin * 2; // 182 mm
  const imgAspectRatio = canvas.height / canvas.width;
  const printHeight = printWidth * imgAspectRatio;

  // Center horizontally, top margin with FAST compression
  doc.addImage(
    imgData,
    "JPEG",
    margin,
    margin,
    printWidth,
    Math.min(printHeight, pageHeight - margin * 2),
    undefined,
    "FAST"
  );

  return doc;
}

/**
 * Helper to download or share the pricelist PDF directly to WhatsApp
 */
export async function shareOrDownloadPricelistPdf({
  config,
  onStatus,
}: {
  config: PricelistConfig;
  onStatus?: (msg: string) => void;
}) {
  const doc = generatePricelistPdf(config);
  const blob = doc.output("blob");
  const fileName = `Pricelist_StitchAndMoral_${new Date().toISOString().slice(0, 10)}.pdf`;
  const file = new File([blob], fileName, { type: "application/pdf" });

  // Check if Web Share API with files is supported (e.g. mobile Safari / Chrome)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: "Pricelist & Promo Sewa Jas Stitch & Moral",
        text: "Berikut adalah daftar harga sewa dan promo aktif Stitch & Moral Palangka Raya.",
        files: [file],
      });
      onStatus?.("Berhasil membagikan PDF ke WhatsApp / Media Sosial!");
      return;
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.warn("Web Share API failed, falling back to download:", err);
      } else {
        return;
      }
    }
  }

  // Fallback: Automatic download and open WhatsApp web
  doc.save(fileName);
  onStatus?.("Dokumen PDF berhasil diunduh. Anda dapat langsung melampirkannya di chat WhatsApp!");
}
