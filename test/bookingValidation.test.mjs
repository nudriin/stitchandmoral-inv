import test from "node:test";
import assert from "node:assert/strict";
import {
  isDateRangeOverlapping,
  calculateBookedQuantity,
  getItemBookingAvailability,
  checkBookingConflicts,
} from "../src/lib/bookingValidation.ts";

test("isDateRangeOverlapping: deteksi tumpang tindih tanggal secara presisi", () => {
  // 1. Rentang tanggal sama persis
  assert.equal(
    isDateRangeOverlapping("2026-09-30", "2026-10-01", "2026-09-30", "2026-10-01"),
    true,
    "Sama persis harus overlap"
  );

  // 2. Beririsan di hari terakhir A / hari pertama B
  assert.equal(
    isDateRangeOverlapping("2026-09-30", "2026-10-01", "2026-10-01", "2026-10-02"),
    true,
    "Hari pengembalian sama dengan hari mulai sewa harus dianggap overlap (karena jas baru kembali)"
  );

  // 3. Rentang B ada di dalam rentang A
  assert.equal(
    isDateRangeOverlapping("2026-09-25", "2026-10-05", "2026-09-30", "2026-10-01"),
    true,
    "B di dalam A harus overlap"
  );

  // 4. Rentang A ada di dalam rentang B
  assert.equal(
    isDateRangeOverlapping("2026-09-30", "2026-10-01", "2026-09-25", "2026-10-05"),
    true,
    "A di dalam B harus overlap"
  );

  // 5. Tidak beririsan sama sekali (sebelumnya)
  assert.equal(
    isDateRangeOverlapping("2026-09-20", "2026-09-25", "2026-09-30", "2026-10-01"),
    false,
    "Rentang sebelum harus tidak overlap"
  );

  // 6. Tidak beririsan sama sekali (sesudahnya)
  assert.equal(
    isDateRangeOverlapping("2026-10-05", "2026-10-07", "2026-09-30", "2026-10-01"),
    false,
    "Rentang setelah harus tidak overlap"
  );

  // 7. Normalisasi defensif jika tanggal_kembali < tanggal_sewa
  assert.equal(
    isDateRangeOverlapping("2026-09-30", "2026-09-01", "2026-09-30", "2026-10-01"),
    true,
    "Tanggal kembali terbalik harus dinormalisasi defensif sehingga minimal mencakup tanggal_sewa"
  );
});

test("checkBookingConflicts: mendeteksi bentrok booking untuk stok 1 unit", () => {
  const mockInventory = [
    {
      id: "inv-1",
      kode_jas: "JAS-YGT-XL",
      nama_jas: "Jas YGT Black Stretch XL",
      jumlah_stok: 1,
      stok_tersedia: 1,
      stok_disewa: 0,
    },
    {
      id: "inv-2",
      kode_jas: "JAS-KING-M",
      nama_jas: "Kingsman M Black",
      jumlah_stok: 3,
      stok_tersedia: 3,
      stok_disewa: 0,
    },
  ];

  const mockTransactions = [
    {
      id: "tx-wahyu",
      kode_transaksi: "TRX-20260903-1769",
      nama_customer: "Wahyu",
      tanggal_sewa: "2026-09-30",
      tanggal_kembali: "2026-10-01",
      status: "Booking",
      items: [
        {
          kodeJas: "JAS-YGT-XL",
          namaJas: "Jas YGT Black Stretch XL",
          jumlah: 1,
        },
      ],
    },
  ];

  // Kasus A: Mencoba booking Jas YGT XL di tanggal 30 Sep - 1 Okt -> HARUS BENTROK
  const conflictsA = checkBookingConflicts({
    startDate: "2026-09-30",
    returnDate: "2026-10-01",
    items: [{ kodeJas: "JAS-YGT-XL", jumlah: 1 }],
    transactions: mockTransactions,
    inventory: mockInventory,
  });

  assert.equal(conflictsA.length, 1, "Harus ada 1 konflik untuk JAS-YGT-XL");
  assert.equal(conflictsA[0].kodeJas, "JAS-YGT-XL");
  assert.equal(conflictsA[0].availableQty, 0, "Sisa kuota harus 0");
  assert.equal(conflictsA[0].conflictingBookings[0].nama_customer, "Wahyu");

  // Kasus B: Booking jas yang sama di tanggal berbeda (2 Okt - 3 Okt) -> TIDAK BENTROK
  const conflictsB = checkBookingConflicts({
    startDate: "2026-10-02",
    returnDate: "2026-10-03",
    items: [{ kodeJas: "JAS-YGT-XL", jumlah: 1 }],
    transactions: mockTransactions,
    inventory: mockInventory,
  });

  assert.equal(conflictsB.length, 0, "Harus tidak ada konflik untuk tanggal yang berbeda");

  // Kasus C: Mode Edit transaksi Wahyu sendiri (excludeTransactionId) -> TIDAK BENTROK DENGAN DIRI SENDIRI
  const conflictsC = checkBookingConflicts({
    startDate: "2026-09-30",
    returnDate: "2026-10-01",
    items: [{ kodeJas: "JAS-YGT-XL", jumlah: 1 }],
    transactions: mockTransactions,
    inventory: mockInventory,
    excludeTransactionId: "tx-wahyu",
  });

  assert.equal(conflictsC.length, 0, "Edit transaksi sendiri tidak boleh memblokir diri sendiri");
});

test("checkBookingConflicts: mendukung multi-stok (stok > 1 unit)", () => {
  const mockInventory = [
    {
      id: "inv-2",
      kode_jas: "JAS-KING-M",
      nama_jas: "Kingsman M Black",
      jumlah_stok: 3,
      stok_tersedia: 3,
      stok_disewa: 0,
    },
  ];

  const mockTransactions = [
    {
      id: "tx-1",
      kode_transaksi: "TRX-001",
      nama_customer: "Customer A",
      tanggal_sewa: "2026-09-10",
      tanggal_kembali: "2026-09-12",
      status: "Booking",
      items: [{ kodeJas: "JAS-KING-M", jumlah: 1 }],
    },
    {
      id: "tx-2",
      kode_transaksi: "TRX-002",
      nama_customer: "Customer B",
      tanggal_sewa: "2026-09-11",
      tanggal_kembali: "2026-09-13",
      status: "Sedang Disewa",
      items: [{ kodeJas: "JAS-KING-M", jumlah: 1 }],
    },
  ];

  // Dari 3 stok, sudah terpakai 2 unit di tanggal 11-12 September
  // Request 1 unit -> Tersisa 1 unit -> HARUS LOLOS (TIDAK BENTROK)
  const conflicts1 = checkBookingConflicts({
    startDate: "2026-09-11",
    returnDate: "2026-09-12",
    items: [{ kodeJas: "JAS-KING-M", jumlah: 1 }],
    transactions: mockTransactions,
    inventory: mockInventory,
  });
  assert.equal(conflicts1.length, 0, "Masih ada sisa 1 unit, tidak boleh bentrok");

  // Request 2 unit -> Tersisa hanya 1 unit -> HARUS BENTROK
  const conflicts2 = checkBookingConflicts({
    startDate: "2026-09-11",
    returnDate: "2026-09-12",
    items: [{ kodeJas: "JAS-KING-M", jumlah: 2 }],
    transactions: mockTransactions,
    inventory: mockInventory,
  });
  assert.equal(conflicts2.length, 1, "Minta 2 unit padahal sisa 1 harus bentrok");
  assert.equal(conflicts2[0].availableQty, 1);
});

test("checkBookingConflicts: mengabaikan transaksi Selesai dan Dibatalkan", () => {
  const mockInventory = [
    {
      id: "inv-1",
      kode_jas: "JAS-YGT-XL",
      nama_jas: "Jas YGT Black Stretch XL",
      jumlah_stok: 1,
      stok_tersedia: 1,
      stok_disewa: 0,
    },
  ];

  const mockTransactions = [
    {
      id: "tx-selesai",
      kode_transaksi: "TRX-DONE",
      nama_customer: "Budi",
      tanggal_sewa: "2026-09-30",
      tanggal_kembali: "2026-10-01",
      status: "Selesai",
      items: [{ kodeJas: "JAS-YGT-XL", jumlah: 1 }],
    },
    {
      id: "tx-batal",
      kode_transaksi: "TRX-CANCEL",
      nama_customer: "Joko",
      tanggal_sewa: "2026-09-30",
      tanggal_kembali: "2026-10-01",
      status: "Dibatalkan",
      items: [{ kodeJas: "JAS-YGT-XL", jumlah: 1 }],
    },
  ];

  const conflicts = checkBookingConflicts({
    startDate: "2026-09-30",
    returnDate: "2026-10-01",
    items: [{ kodeJas: "JAS-YGT-XL", jumlah: 1 }],
    transactions: mockTransactions,
    inventory: mockInventory,
  });

  assert.equal(conflicts.length, 0, "Transaksi Selesai & Dibatalkan tidak boleh memblokir sewa baru");
});
