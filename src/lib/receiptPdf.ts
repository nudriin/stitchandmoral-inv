import jsPDF from "jspdf";
import { Transaksi } from "@/types/database";
import { generateReceiptCanvas } from "./receiptCanvas";

/**
 * Generates an official A4 PDF document from the receipt canvas
 */
export function generateReceiptPdf(tx: Transaksi): jsPDF {
  const canvas = generateReceiptCanvas(tx);
  const imgData = canvas.toDataURL("image/png");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const margin = 18;
  const printWidth = pageWidth - margin * 2; // 174 mm
  const imgAspectRatio = canvas.height / canvas.width;
  const printHeight = printWidth * imgAspectRatio;

  // Center horizontally, top margin
  doc.addImage(imgData, "PNG", margin, margin, printWidth, Math.min(printHeight, pageHeight - margin * 2));

  return doc;
}
