import jsPDF from "jspdf";
import { Transaksi } from "@/types/database";
import { ReceiptConfig } from "@/types/receipt";
import { generateReceiptCanvas } from "./receiptCanvas";

/**
 * Generates an official A4 PDF document from the receipt canvas
 */
export function generateReceiptPdf(tx: Transaksi, config?: ReceiptConfig): jsPDF {
  const canvas = generateReceiptCanvas(tx, config);
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

  // Center horizontally, top margin
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
