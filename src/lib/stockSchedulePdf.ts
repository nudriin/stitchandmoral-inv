import jsPDF from "jspdf";
import type { SuitWithSchedule } from "./suitSchedule";

function formatDateIndo(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateStr);
  }
}

export type PrintStatusFilter = "all" | "booking" | "disewa" | "rented_and_booked";

export interface PdfExportOptions {
  storeName?: string;
  storeTagline?: string;
  storeAddress?: string;
  storeCity?: string;
  storeWhatsapp?: string;
  startDate?: string;
  returnDate?: string;
  statusFilter?: PrintStatusFilter;
  includeReadyItems?: boolean;
}

// Safely resolve jsPDF constructor for both Next.js browser bundler and Node.js ESM test runner
function createJsPdfInstance(options: any): jsPDF {
  const PDFConstructor: any = typeof jsPDF === "function" ? jsPDF : (jsPDF as any)?.jsPDF || jsPDF;
  return new PDFConstructor(options);
}

// Signature Palette: Monochromatic Base (#181818) + Clean Border + Signature Orange Text (#FF4D00 / #FF6B00)
const COLORS = {
  white: [255, 255, 255] as [number, number, number],
  black: [24, 24, 24] as [number, number, number], // #181818
  headerDark: [24, 24, 24] as [number, number, number], // #181818
  headerOrange: [255, 107, 0] as [number, number, number], // #FF6B00 Bright High-Contrast Orange
  headerOrangeLight: [255, 161, 84] as [number, number, number], // #FFA154
  subDark: [74, 74, 74] as [number, number, number], // #4A4A4A
  muted: [148, 163, 184] as [number, number, number], // #94A3B8
  borderDark: [34, 34, 34] as [number, number, number], // #222222
  borderLight: [226, 232, 240] as [number, number, number], // #E2E8F0
  tableHeaderBg: [248, 250, 252] as [number, number, number], // #F8FAFC
  rowZebra: [250, 250, 250] as [number, number, number],
  // Signature Orange Accents
  orangePrimary: [255, 77, 0] as [number, number, number], // #FF4D00
  orangeDark: [194, 65, 12] as [number, number, number], // #C2410C
  orangeLightBg: [255, 247, 237] as [number, number, number], // #FFF7ED
  orangeBorder: [254, 215, 170] as [number, number, number], // #FED7AA
  // Emerald
  emeraldDark: [5, 150, 105] as [number, number, number],
  emeraldLightBg: [240, 253, 244] as [number, number, number],
  // Blue for Disewa
  blueDark: [29, 78, 216] as [number, number, number],
  blueLightBg: [239, 246, 255] as [number, number, number],
};

function filterSuitsForPrint(
  suits: SuitWithSchedule[],
  statusFilter?: PrintStatusFilter,
  includeReadyItems: boolean = true
): SuitWithSchedule[] {
  return suits
    .map((suitData) => {
      let schedules = suitData.activeSchedules;
      if (statusFilter === "booking") {
        schedules = suitData.activeSchedules.filter((s) => s.status === "Booking");
      } else if (statusFilter === "disewa") {
        schedules = suitData.activeSchedules.filter(
          (s) => s.status === "Sedang Disewa" || s.status === "Terlambat"
        );
      }
      return {
        ...suitData,
        activeSchedules: schedules,
      };
    })
    .filter((suitData) => {
      if (!includeReadyItems && suitData.activeSchedules.length === 0) {
        return false;
      }
      return true;
    });
}

function getFilterLabel(
  statusFilter?: PrintStatusFilter
): string {
  if (statusFilter === "booking") {
    return "HANYA JADWAL BOOKING";
  } else if (statusFilter === "disewa") {
    return "HANYA SEDANG DISEWA";
  }
  return "SEMUA (DISEWA & BOOKING)";
}

/**
 * Helper to draw the authentic dual typography header matching the receipt invoice style
 * ("STOCK Control" / "SCHEDULE Notes" with hairline divider & 2-column meta)
 */
function drawEditorialHeader(
  doc: jsPDF,
  options: {
    heroWord1: string;
    heroWord2: string;
    docSubTitle: string;
    statusFilter?: PrintStatusFilter;
    startDate?: string;
    returnDate?: string;
    storeName?: string;
    storeAddress?: string;
    storeCity?: string;
    storeWhatsapp?: string;
    totalSuits?: number;
    totalPhysical?: number;
    totalActiveTx?: number;
    pageWidth: number;
    marginX: number;
    contentWidth: number;
    startY: number;
  }
): number {
  const {
    heroWord1,
    heroWord2,
    docSubTitle,
    statusFilter = "all",
    startDate,
    returnDate,
    storeName = "STITCH AND MORAL",
    storeAddress = "JL. PANGERAN SAMUDERA INDUK NO. 11",
    storeCity = "PALANGKA RAYA",
    storeWhatsapp = "0815-4919-3834",
    totalSuits,
    totalPhysical,
    totalActiveTx,
    pageWidth,
    marginX,
    contentWidth,
    startY,
  } = options;

  let y = startY;

  // 1. HERO BIG TITLE: Dual Typography ("INVOICE Receipt" / "STOCK Control" / "SCHEDULE Notes")
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  const w1 = doc.getTextWidth(heroWord1);

  doc.setFont("times", "italic");
  doc.setFontSize(28);
  const w2 = doc.getTextWidth(heroWord2);

  const totalHeroWidth = w1 + w2 + 2;
  const heroStartX = (pageWidth - totalHeroWidth) / 2;

  // Draw Word 1 (Bold Sans-Serif Solid Black)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...COLORS.black);
  doc.text(heroWord1, heroStartX, y + 8);

  // Draw Word 2 (Italic Serif Solid Black)
  doc.setFont("times", "italic");
  doc.setFontSize(28);
  doc.setTextColor(...COLORS.black);
  doc.text(heroWord2, heroStartX + w1 + 2.5, y + 8);

  y += 12;

  // Hairline Divider below Title
  doc.setDrawColor(...COLORS.borderDark);
  doc.setLineWidth(0.4);
  doc.line(marginX, y, marginX + contentWidth, y);

  y += 4.5;

  // 2. TWO-COLUMN METADATA SECTION
  const rightEdge = marginX + contentWidth;
  const isQueried = Boolean(startDate && returnDate);
  const filterLabel = getFilterLabel(statusFilter);

  const nowStr = new Date().toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Left Column (Structured details)
  doc.setFont("courier", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.black);
  doc.text(`DOKUMEN          : ${docSubTitle.toUpperCase()}`, marginX, y);
  y += 3.8;
  doc.text(`STATUS CETAK     : ${filterLabel}`, marginX, y);
  y += 3.8;
  if (isQueried && startDate && returnDate) {
    const periodStr = `${formatDateIndo(startDate).toUpperCase()} S/D ${formatDateIndo(returnDate).toUpperCase()}`;
    doc.text(`PERIODE FILTER   : ${periodStr}`, marginX, y);
    y += 3.8;
  } else if (totalSuits !== undefined && totalPhysical !== undefined && totalActiveTx !== undefined) {
    doc.text(`TOTAL DATA       : ${totalSuits} MODEL | ${totalPhysical} UNIT | ${totalActiveTx} TRANSAKSI`, marginX, y);
    y += 3.8;
  }
  doc.text(`WAKTU CETAK      : ${nowStr.toUpperCase()} WIB`, marginX, y);

  // Right Column (Store Brand & Address)
  const rightYStart = y - (isQueried ? 11.4 : 11.4);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.black);
  doc.text(storeName.toUpperCase(), rightEdge, rightYStart, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.subDark);
  doc.text(storeAddress.toUpperCase(), rightEdge, rightYStart + 3.8, { align: "right" });
  doc.text(storeCity.toUpperCase(), rightEdge, rightYStart + 7.4, { align: "right" });
  doc.text(`WA: ${storeWhatsapp}`, rightEdge, rightYStart + 11, { align: "right" });

  y += 4.5;

  // Thin bottom separator
  doc.setDrawColor(...COLORS.borderLight);
  doc.setLineWidth(0.3);
  doc.line(marginX, y, marginX + contentWidth, y);

  y += 3.5;

  return y;
}

/**
 * 1. GENERATE PDF PAPAN KONTROL STOK & SEMUA JADWAL BOOKING (A4 LANDSCAPE)
 * Authentic Receipt-Style Header + Clean Minimalist Table
 */
export function generateStockSummaryPdf(
  rawSuits: SuitWithSchedule[],
  options: PdfExportOptions = {}
): jsPDF {
  const {
    storeName = "STITCH AND MORAL",
    storeAddress = "JL. PANGERAN SAMUDERA INDUK NO. 11",
    storeCity = "PALANGKA RAYA",
    storeWhatsapp = "0815-4919-3834",
    startDate,
    returnDate,
    statusFilter = "all",
    includeReadyItems = true,
  } = options;

  const suits = filterSuitsForPrint(rawSuits, statusFilter, includeReadyItems);

  // A4 Landscape: 297mm width x 210mm height
  const doc = createJsPdfInstance({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const marginX = 12;
  const contentWidth = pageWidth - marginX * 2; // 273mm
  let currentY = 8;

  const totalPhysical = suits.reduce((acc, s) => acc + s.totalStock, 0);
  const totalBookedActive = suits.reduce((acc, s) => acc + s.activeSchedules.length, 0);

  // Column definitions (Total: 273mm)
  const cols = {
    no: { x: marginX, w: 8 }, // 8mm (X: 12)
    kodeSize: { x: marginX + 8, w: 38 }, // 38mm (X: 20)
    namaJas: { x: marginX + 46, w: 42 }, // 42mm (X: 58)
    stok: { x: marginX + 88, w: 22 }, // 22mm (X: 100)
    jadwal: { x: marginX + 110, w: 95 }, // 95mm (X: 122)
    catatan: { x: marginX + 205, w: 68 }, // 68mm (X: 217)
  };

  const drawPageHeader = (pageNum: number) => {
    currentY = 8;
    currentY = drawEditorialHeader(doc, {
      heroWord1: "STOCK",
      heroWord2: "Control",
      docSubTitle: "PAPAN KONTROL STOK & JADWAL SEWA",
      statusFilter,
      startDate,
      returnDate,
      storeName,
      storeAddress,
      storeCity,
      storeWhatsapp,
      totalSuits: suits.length,
      totalPhysical,
      totalActiveTx: totalBookedActive,
      pageWidth,
      marginX,
      contentWidth,
      startY: currentY,
    });
  };

  // TABLE HEADER WITH CLEAN BLACK TEXT (#181818)
  const drawTableHeader = () => {
    doc.setFillColor(...COLORS.tableHeaderBg);
    doc.rect(marginX, currentY, contentWidth, 7, "F");

    doc.setDrawColor(...COLORS.borderDark);
    doc.setLineWidth(0.4);
    doc.line(marginX, currentY, marginX + contentWidth, currentY);
    doc.line(marginX, currentY + 7, marginX + contentWidth, currentY + 7);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(...COLORS.black); // Clean Black Header Text

    let scheduleHeaderTitle = "TANGGAL BOOKING & SEWA (BOLD) - PENYEWA";
    if (statusFilter === "booking") scheduleHeaderTitle = "TANGGAL BOOKING (BOLD) - PENYEWA";
    if (statusFilter === "disewa") scheduleHeaderTitle = "TANGGAL SEDANG DISEWA (BOLD) - PENYEWA";

    doc.text("NO", cols.no.x + 2, currentY + 4.8);
    doc.text("KODE JAS & UKURAN", cols.kodeSize.x + 2, currentY + 4.8);
    doc.text("NAMA MODEL JAS", cols.namaJas.x + 2, currentY + 4.8);
    doc.text("JUMLAH STOK", cols.stok.x + 2, currentY + 4.8);
    doc.text(scheduleHeaderTitle, cols.jadwal.x + 2, currentY + 4.8);
    doc.text("CATATAN UKURAN CELANA (SESUAI PENYEWA)", cols.catatan.x + 2, currentY + 4.8);

    currentY += 7;
  };

  const ensureSpace = (heightNeeded: number) => {
    if (currentY + heightNeeded > pageHeight - 10) {
      doc.addPage();
      currentY = 8;
      drawPageHeader(doc.getNumberOfPages());
      drawTableHeader();
    }
  };

  drawPageHeader(1);
  drawTableHeader();

  // Render Rows
  suits.forEach((suitData, index) => {
    const { item, totalStock, activeSchedules } = suitData;

    const subRowHeights: number[] = [];
    if (activeSchedules.length === 0) {
      subRowHeights.push(7);
    } else {
      activeSchedules.forEach((sch) => {
        const noteText = sch.catatan && sch.catatan.trim() ? sch.catatan.trim() : "";
        let noteLinesCount = 1;
        if (noteText) {
          doc.setFontSize(6.5);
          const lines = doc.splitTextToSize(noteText, cols.catatan.w - 6);
          noteLinesCount = Array.isArray(lines) ? lines.length : 1;
        }
        const h = Math.max(6.5, noteLinesCount * 3.5 + 2.8);
        subRowHeights.push(h);
      });
    }

    const totalScheduleHeight = subRowHeights.reduce((a, b) => a + b, 0);

    doc.setFontSize(7.2);
    const kodeText = doc.splitTextToSize(item.kode_jas || "-", cols.kodeSize.w - 4);
    const kodeLines = Array.isArray(kodeText) ? kodeText.length : 1;
    const leftHeight = Math.max(11, kodeLines * 3.5 + 7.5);

    const rowHeight = Math.max(leftHeight, totalScheduleHeight + 2);

    ensureSpace(rowHeight);

    if (index % 2 === 1) {
      doc.setFillColor(...COLORS.rowZebra);
      doc.rect(marginX, currentY, contentWidth, rowHeight, "F");
    }

    doc.setDrawColor(...COLORS.borderLight);
    doc.setLineWidth(0.25);
    doc.line(marginX, currentY + rowHeight, marginX + contentWidth, currentY + rowHeight);

    // Column separators
    doc.line(cols.kodeSize.x, currentY, cols.kodeSize.x, currentY + rowHeight);
    doc.line(cols.namaJas.x, currentY, cols.namaJas.x, currentY + rowHeight);
    doc.line(cols.stok.x, currentY, cols.stok.x, currentY + rowHeight);
    doc.line(cols.jadwal.x, currentY, cols.jadwal.x, currentY + rowHeight);
    doc.line(cols.catatan.x, currentY, cols.catatan.x, currentY + rowHeight);

    // 1. Column NO
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.subDark);
    doc.text(String(index + 1), cols.no.x + 2.5, currentY + 5);

    // 2. Column KODE JAS & UKURAN
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(...COLORS.black);
    doc.text(kodeText, cols.kodeSize.x + 2, currentY + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(...COLORS.subDark);
    doc.text(
      `Size: ${item.ukuran || "-"} | ${item.warna || "Standar"}`,
      cols.kodeSize.x + 2,
      currentY + 4.5 + kodeLines * 3.5
    );

    // 3. Column NAMA MODEL JAS
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(...COLORS.black);
    const namaLines = doc.splitTextToSize(item.nama_jas, cols.namaJas.w - 4);
    doc.text(namaLines, cols.namaJas.x + 2, currentY + 4.5);

    // 4. Column STOK (Display total physical stock without status ready pill)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.black);
    doc.text(`${totalStock} Unit`, cols.stok.x + 2, currentY + 5.5);

    // 5 & 6. COLUMNS JADWAL & CATATAN (BOLD BOOKING DATES)
    if (activeSchedules.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.emeraldDark);
      const emptyMsg =
        statusFilter === "booking"
          ? "[READY] Tidak ada jadwal booking"
          : statusFilter === "disewa"
            ? "[READY] Tidak ada barang sedang disewa"
            : "[READY] Seluruh unit ready (Tidak ada booking)";
      doc.text(emptyMsg, cols.jadwal.x + 2, currentY + 5);

      doc.setTextColor(...COLORS.muted);
      doc.text("-", cols.catatan.x + 2, currentY + 5);
    } else {
      let subY = currentY + 0.8;

      activeSchedules.forEach((sch, sIdx) => {
        const subH = subRowHeights[sIdx];
        const isDisewa = sch.status === "Sedang Disewa" || sch.status === "Terlambat";

        if (sIdx > 0) {
          doc.setDrawColor(...COLORS.borderLight);
          doc.setLineWidth(0.15);
          doc.line(cols.jadwal.x, subY, marginX + contentWidth, subY);
        }

        // --- LEFT COLUMN: BOLD DATE RANGE & CUSTOMER ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.2); // BOLD & PROMINENT
        if (isDisewa) {
          doc.setTextColor(...COLORS.blueDark);
        } else {
          doc.setTextColor(...COLORS.black); // BOLD SOLID BLACK FOR CLARITY
        }

        const dateStr = `${sIdx + 1}. ${formatDateIndo(sch.tanggal_sewa)} - ${formatDateIndo(sch.tanggal_kembali)}`;
        doc.text(dateStr, cols.jadwal.x + 2, subY + 3.8);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.8);
        doc.setTextColor(...COLORS.subDark);
        const custStr = `: ${sch.nama_customer} (${sch.bookedQty} unit)`;
        doc.text(custStr, cols.jadwal.x + 44, subY + 3.8);

        // Status Badge
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.2);
        if (isDisewa) {
          doc.setTextColor(...COLORS.blueDark);
        } else {
          doc.setTextColor(...COLORS.orangePrimary);
        }
        doc.text(`[${sch.status.toUpperCase()}]`, cols.jadwal.x + cols.jadwal.w - 2, subY + 3.8, {
          align: "right",
        });

        // --- RIGHT COLUMN: 1-TO-1 PAIRED NOTE WITH ORANGE HIGHLIGHT BOX ---
        const noteText = sch.catatan && sch.catatan.trim() ? sch.catatan.trim() : "";

        if (noteText) {
          doc.setFillColor(...COLORS.orangeLightBg);
          doc.setDrawColor(...COLORS.orangePrimary);
          doc.setLineWidth(0.2);
          doc.roundedRect(cols.catatan.x + 1.5, subY + 0.6, cols.catatan.w - 3, subH - 1.2, 0.8, 0.8, "FD");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(6.5);
          doc.setTextColor(...COLORS.orangeDark);

          const noteWithPrefix = `${sch.nama_customer}: ${noteText}`;
          const noteLines = doc.splitTextToSize(noteWithPrefix, cols.catatan.w - 6);
          doc.text(noteLines, cols.catatan.x + 3, subY + 3.6);
        } else {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(6.8);
          doc.setTextColor(...COLORS.muted);
          doc.text("-", cols.catatan.x + 3, subY + 3.8);
        }

        subY += subH;
      });
    }

    currentY += rowHeight;
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLORS.borderLight);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 8, marginX + contentWidth, pageHeight - 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.orangePrimary);
    doc.text("STITCH & MORAL PALANGKA RAYA", marginX, pageHeight - 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      `Papan Kontrol Stok & Jadwal Sewa | Halaman ${i} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 4.5,
      { align: "center" }
    );

    doc.text("OFFICIAL INVENTORY SHEET", marginX + contentWidth, pageHeight - 4.5, { align: "right" });
  }

  return doc;
}

/**
 * 2. GENERATE PDF JADWAL & CATATAN UKURAN CELANA DETAIL (A4 PORTRAIT)
 * Authentic Receipt-Style Header + Dark Suit Headers with Total Stock Count
 */
export function generateScheduleNotesPdf(
  rawSuits: SuitWithSchedule[],
  options: PdfExportOptions = {}
): jsPDF {
  const {
    storeName = "STITCH AND MORAL",
    storeAddress = "JL. PANGERAN SAMUDERA INDUK NO. 11",
    storeCity = "PALANGKA RAYA",
    storeWhatsapp = "0815-4919-3834",
    startDate,
    returnDate,
    statusFilter = "all",
    includeReadyItems = true,
  } = options;

  const suits = filterSuitsForPrint(rawSuits, statusFilter, includeReadyItems);

  const doc = createJsPdfInstance({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 12;
  const contentWidth = pageWidth - marginX * 2; // 186mm
  let currentY = 10;

  const totalPhysical = suits.reduce((acc, s) => acc + s.totalStock, 0);
  const totalBookedActive = suits.reduce((acc, s) => acc + s.activeSchedules.length, 0);

  const drawPageHeader = (pageNum: number) => {
    currentY = 10;
    currentY = drawEditorialHeader(doc, {
      heroWord1: "SCHEDULE",
      heroWord2: "Notes",
      docSubTitle: "JADWAL SEWA & CATATAN UKURAN CELANA",
      statusFilter,
      startDate,
      returnDate,
      storeName,
      storeAddress,
      storeCity,
      storeWhatsapp,
      totalSuits: suits.length,
      totalPhysical,
      totalActiveTx: totalBookedActive,
      pageWidth,
      marginX,
      contentWidth,
      startY: currentY,
    });
  };

  const ensureSpace = (heightNeeded: number) => {
    if (currentY + heightNeeded > pageHeight - 12) {
      doc.addPage();
      currentY = 10;
      drawPageHeader(doc.getNumberOfPages());
    }
  };

  drawPageHeader(1);

  // Render Each Suit as a Clean Structured Docket Section
  suits.forEach((suitData) => {
    const { item, totalStock, activeSchedules } = suitData;

    ensureSpace(25);

    // --- 1. SUIT HEADER BOX: DARK BACKGROUND (#181818) & ORANGE TEXT (#FF6B00) ---
    doc.setFillColor(...COLORS.headerDark);
    doc.setDrawColor(...COLORS.headerDark);
    doc.rect(marginX, currentY, contentWidth, 7.5, "FD");

    // Suit Code & Model Name in High-Contrast Orange
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.headerOrange);
    const suitHeaderTitle = `[${item.kode_jas}] ${item.nama_jas} - Size ${item.ukuran || "-"} (${item.warna || "Standar"})`;
    doc.text(suitHeaderTitle, marginX + 4, currentY + 5.2);

    // Total Physical Stock Count on Right ("Stok: 3 Unit")
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.white);
    doc.text(`Stok: ${totalStock} Unit`, marginX + contentWidth - 4, currentY + 5.2, {
      align: "right",
    });

    currentY += 7.5;

    // --- 2. SUIT BOOKINGS LIST ---
    if (activeSchedules.length === 0) {
      // Clean Boxed Ready State
      doc.setFillColor(...COLORS.white);
      doc.setDrawColor(...COLORS.borderLight);
      doc.setLineWidth(0.25);
      doc.rect(marginX, currentY, contentWidth, 7, "FD");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.muted);
      const emptyMsg =
        statusFilter === "booking"
          ? "[READY] Tidak ada jadwal booking (Seluruh unit siap disewa)"
          : statusFilter === "disewa"
            ? "[READY] Tidak ada barang sedang disewa saat ini"
            : "[READY] Tidak ada jadwal booking aktif (Seluruh unit siap disewa)";
      doc.text(emptyMsg, marginX + 4, currentY + 4.5);

      currentY += 9;
    } else {
      activeSchedules.forEach((sch, sIdx) => {
        const isDisewa = sch.status === "Sedang Disewa" || sch.status === "Terlambat";
        const hasNote = Boolean(sch.catatan && sch.catatan.trim());
        const rawNoteText = hasNote ? sch.catatan!.trim() : "";

        // Calculate card height based on text note lines
        let cardH = 13;
        let noteLines: string[] = [];
        if (hasNote) {
          doc.setFontSize(7);
          const splitRes = doc.splitTextToSize(`Catatan / Ukuran Celana: ${rawNoteText}`, contentWidth - 10);
          noteLines = Array.isArray(splitRes) ? splitRes : [splitRes];
          cardH = Math.max(13, 7 + noteLines.length * 3.5);
        }

        ensureSpace(cardH + 2);

        // Card Container Box (Clean White Background with Slate Border)
        doc.setFillColor(...COLORS.white);
        doc.setDrawColor(...COLORS.borderLight);
        doc.setLineWidth(0.25);
        doc.rect(marginX, currentY, contentWidth, cardH, "FD");

        // --- ROW 1: BOLD BOOKING DATE, STATUS, CUSTOMER, WA & TRX ---
        // 1. TANGGAL BOOKING / SEWA (BOLD 8pt SOLID BLACK)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.black);
        const dateStr = `${formatDateIndo(sch.tanggal_sewa)} s/d ${formatDateIndo(sch.tanggal_kembali)}`;
        doc.text(dateStr, marginX + 4, currentY + 4.8);

        // 2. Status Badge (Right beside date)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.8);
        if (isDisewa) {
          doc.setTextColor(...COLORS.blueDark);
        } else {
          doc.setTextColor(...COLORS.orangePrimary);
        }
        doc.text(`[${sch.status.toUpperCase()}]`, marginX + 62, currentY + 4.8);

        // 3. Customer Name & Qty
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(...COLORS.black);
        const custNameStr = `${sIdx + 1}. ${sch.nama_customer} (${sch.bookedQty} unit)`;
        doc.text(custNameStr, marginX + 86, currentY + 4.8);

        // 4. TRX Code & WA (Right-aligned)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(...COLORS.subDark);
        const rightMetaStr = `[#${sch.kode_transaksi}]${sch.whatsapp ? ` | WA: ${sch.whatsapp}` : ""}`;
        doc.text(rightMetaStr, marginX + contentWidth - 4, currentY + 4.8, { align: "right" });

        // --- ROW 2: CATATAN / UKURAN CELANA (TEXT ONLY WITHOUT ORANGE BOX) ---
        if (hasNote) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7);
          doc.setTextColor(...COLORS.orangeDark);
          doc.text(noteLines, marginX + 4, currentY + 9.5);
        } else {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(6.8);
          doc.setTextColor(...COLORS.muted);
          doc.text("(Tidak ada catatan khusus)", marginX + 4, currentY + 9.5);
        }

        currentY += cardH;
      });

      currentY += 2.5; // Gap between suits
    }
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLORS.borderLight);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 8, marginX + contentWidth, pageHeight - 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.orangePrimary);
    doc.text("STITCH & MORAL PALANGKA RAYA", marginX, pageHeight - 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      `Papan Kontrol Jadwal & Ukuran Celana | Halaman ${i} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 4.5,
      { align: "center" }
    );

    doc.text("OFFICIAL WORKSHOP SHEET", marginX + contentWidth, pageHeight - 4.5, { align: "right" });
  }

  return doc;
}

/**
 * Handler helper to download Stock Summary PDF with dynamic filter
 */
export function downloadStockSummaryPdf(suits: SuitWithSchedule[], options: PdfExportOptions = {}) {
  const doc = generateStockSummaryPdf(suits, options);
  const now = new Date();
  const dateSuffix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;

  let scopePrefix = "Papan_Kontrol_Stok_Semua";
  if (options.statusFilter === "booking") scopePrefix = "Papan_Stok_Hanya_Booking";
  if (options.statusFilter === "disewa") scopePrefix = "Papan_Stok_Sedang_Disewa";

  doc.save(`${scopePrefix}_StitchAndMoral_${dateSuffix}.pdf`);
}

/**
 * Handler helper to download Schedule & Notes PDF with dynamic filter
 */
export function downloadScheduleNotesPdf(suits: SuitWithSchedule[], options: PdfExportOptions = {}) {
  const doc = generateScheduleNotesPdf(suits, options);
  const now = new Date();
  const dateSuffix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;

  let scopePrefix = "Jadwal_Catatan_Semua";
  if (options.statusFilter === "booking") scopePrefix = "Jadwal_Hanya_Booking";
  if (options.statusFilter === "disewa") scopePrefix = "Jadwal_Sedang_Disewa";

  doc.save(`${scopePrefix}_StitchAndMoral_${dateSuffix}.pdf`);
}
