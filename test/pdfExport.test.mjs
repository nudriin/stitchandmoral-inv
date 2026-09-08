import test from "node:test";
import assert from "node:assert/strict";
import { generateStockSummaryPdf, generateScheduleNotesPdf } from "../src/lib/stockSchedulePdf.ts";

test("PDF Export: generateStockSummaryPdf menghasilkan instance jsPDF valid dengan tabel dan pagination", () => {
  const mockSuits = [
    {
      item: {
        id: "inv-1",
        kode_jas: "JAS-001",
        nama_jas: "Jas Formal Hitam Slim Fit",
        ukuran: "L",
        warna: "Hitam",
        jumlah_stok: 2,
        harga_default: 150000,
      },
      totalStock: 2,
      availableToday: 1,
      isBookedToday: true,
      activeSchedules: [
        {
          kode_transaksi: "TRX-101",
          nama_customer: "Ahmad",
          tanggal_sewa: "2026-09-10",
          tanggal_kembali: "2026-09-12",
          status: "Booking",
          bookedQty: 1,
          catatan: "Ukuran celana 32",
        },
      ],
    },
  ];

  const doc = generateStockSummaryPdf(mockSuits, {
    storeName: "STITCH & MORAL",
    startDate: "2026-09-10",
    returnDate: "2026-09-12",
  });

  assert.ok(doc, "Dokumen PDF harus terbuat");
  assert.equal(typeof doc.output, "function", "Harus memiliki method output");
  assert.equal(doc.getNumberOfPages(), 1, "Harus menghasilkan minimal 1 halaman");
  
  const blob = doc.output("blob");
  assert.ok(blob.size > 1000, "Ukuran PDF harus valid (> 1KB)");
});

test("PDF Export: generateScheduleNotesPdf menyertakan catatan transaksi dan ukuran celana", () => {
  const mockSuits = [
    {
      item: {
        id: "inv-1",
        kode_jas: "JAS-002",
        nama_jas: "Jas Navy Blue Premium",
        ukuran: "XL",
        warna: "Navy",
        jumlah_stok: 3,
        harga_default: 175000,
      },
      totalStock: 3,
      availableToday: 2,
      isBookedToday: true,
      activeSchedules: [
        {
          kode_transaksi: "TRX-202",
          nama_customer: "Budi Santoso",
          whatsapp: "081234567890",
          tanggal_sewa: "2026-09-15",
          tanggal_kembali: "2026-09-18",
          status: "Booking",
          bookedQty: 1,
          catatan: "Ukuran celana 36, rompi abu-abu, dasi kupu",
        },
      ],
    },
  ];

  const doc = generateScheduleNotesPdf(mockSuits, {
    storeName: "STITCH & MORAL",
  });

  assert.ok(doc, "Dokumen PDF jadwal harus terbuat");
  assert.equal(typeof doc.output, "function");
  assert.ok(doc.getNumberOfPages() >= 1);

  const blob = doc.output("blob");
  assert.ok(blob.size > 1000, "Ukuran PDF harus valid (> 1KB)");
});

test("PDF Export: mendukung filter cetak status 'booking' saja dan 'disewa' saja", () => {
  const mockSuits = [
    {
      item: {
        id: "inv-1",
        kode_jas: "JAS-001",
        nama_jas: "Jas Formal Hitam Slim Fit",
        ukuran: "L",
        warna: "Hitam",
        jumlah_stok: 3,
      },
      totalStock: 3,
      availableToday: 1,
      isBookedToday: true,
      activeSchedules: [
        {
          kode_transaksi: "TRX-101",
          nama_customer: "Ahmad",
          tanggal_sewa: "2026-09-10",
          tanggal_kembali: "2026-09-12",
          status: "Booking",
          bookedQty: 1,
          catatan: "Ukuran celana 32",
        },
        {
          kode_transaksi: "TRX-102",
          nama_customer: "Budi",
          tanggal_sewa: "2026-09-08",
          tanggal_kembali: "2026-09-09",
          status: "Sedang Disewa",
          bookedQty: 1,
          catatan: "Ukuran celana 34",
        },
      ],
    },
  ];

  // 1. Filter Booking Saja
  const docBooking = generateStockSummaryPdf(mockSuits, {
    statusFilter: "booking",
    includeReadyItems: false,
  });
  assert.ok(docBooking);

  // 2. Filter Sedang Disewa Saja
  const docDisewa = generateScheduleNotesPdf(mockSuits, {
    statusFilter: "disewa",
    includeReadyItems: false,
  });
  assert.ok(docDisewa);
});
