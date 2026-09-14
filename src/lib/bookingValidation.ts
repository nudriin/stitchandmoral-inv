import type { Transaksi, Inventori, TransactionItem } from "@/types/database";

/**
 * Memeriksa apakah suatu item pada transaksi cocok dengan barang di inventori.
 * Prioritas 1: Pencocokan kode_jas eksak (kodeJas === kode_jas)
 * Prioritas 2 (Fallback): Pencocokan berdasarkan nama_jas, ukuran, dan warna (tahan terhadap mutasi kode/edit stok)
 */
export function isTransactionItemMatch(
  txItem: { kodeJas?: string; namaJas?: string; ukuran?: string; warna?: string; jenisJas?: string },
  target: { kode_jas?: string; nama_jas?: string; ukuran?: string; warna?: string; jenis_jas?: string }
): boolean {
  if (!txItem || !target) return false;

  // 1. Exact match by code
  if (txItem.kodeJas && target.kode_jas && txItem.kodeJas === target.kode_jas) {
    return true;
  }

  // 2. Robust fallback match by name + size + color
  if (txItem.namaJas && target.nama_jas) {
    const normalize = (s?: string) => (s || "").trim().toLowerCase();
    const sameName = normalize(txItem.namaJas) === normalize(target.nama_jas);
    const sameSize = !txItem.ukuran || !target.ukuran || normalize(txItem.ukuran) === normalize(target.ukuran);
    const sameColor = !txItem.warna || !target.warna || normalize(txItem.warna) === normalize(target.warna);

    if (sameName && sameSize && sameColor) {
      return true;
    }
  }

  return false;
}

/**
 * Memeriksa apakah dua rentang tanggal saling bertumpukan (overlap).
 * Interval A: [startA, endA]
 * Interval B: [startB, endB]
 *
 * Dua interval sewa bertumpukan jika:
 * startA <= endB && endA >= startB
 */
export function isDateRangeOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  if (!startA || !endA || !startB || !endB) return false;

  const sA = startA.slice(0, 10);
  const rawEndA = endA.slice(0, 10);
  const sB = startB.slice(0, 10);
  const rawEndB = endB.slice(0, 10);

  // Normalisasi defensif jika ada data yang tanggal_kembali < tanggal_sewa
  const eA = rawEndA >= sA ? rawEndA : sA;
  const eB = rawEndB >= sB ? rawEndB : sB;

  return sA <= eB && eA >= sB;
}

export interface ConflictingBooking {
  kode_transaksi: string;
  nama_customer: string;
  tanggal_sewa: string;
  tanggal_kembali: string;
  status: string;
  bookedQty: number;
}

export interface ItemBookingConflict {
  kodeJas: string;
  namaJas: string;
  requestedQty: number;
  availableQty: number;
  totalStock: number;
  conflictingBookings: ConflictingBooking[];
}

/**
 * Menghitung jumlah kuota jas yang sudah terpakai (dibooking/disewa)
 * pada rentang tanggal tertentu oleh transaksi aktif.
 */
export function calculateBookedQuantity({
  kodeJas,
  targetItem,
  startDate,
  returnDate,
  transactions,
  excludeTransactionId,
}: {
  kodeJas?: string;
  targetItem?: { kode_jas?: string; nama_jas?: string; ukuran?: string; warna?: string; jenis_jas?: string };
  startDate: string;
  returnDate: string;
  transactions: Transaksi[];
  excludeTransactionId?: string;
}): { bookedQty: number; conflictingBookings: ConflictingBooking[] } {
  const target = targetItem || (kodeJas ? { kode_jas: kodeJas } : null);
  if (!target || !startDate || !returnDate) {
    return { bookedQty: 0, conflictingBookings: [] };
  }

  const conflictingBookings: ConflictingBooking[] = [];
  let bookedQty = 0;

  for (const tx of transactions) {
    // Lewati transaksi yang sedang diedit agar tidak memblokir diri sendiri
    if (excludeTransactionId && tx.id === excludeTransactionId) continue;

    // Hanya periksa transaksi aktif (Booking, Sedang Disewa, Terlambat)
    // Transaksi 'Selesai' (sudah kembali) dan 'Dibatalkan' tidak memblokir
    if (!["Booking", "Sedang Disewa", "Terlambat"].includes(tx.status)) continue;

    if (!tx.tanggal_sewa || !tx.tanggal_kembali) continue;

    if (isDateRangeOverlapping(startDate, returnDate, tx.tanggal_sewa, tx.tanggal_kembali)) {
      if (Array.isArray(tx.items)) {
        for (const item of tx.items) {
          if (isTransactionItemMatch(item, target)) {
            const qty = Number(item.jumlah) || 1;
            bookedQty += qty;
            conflictingBookings.push({
              kode_transaksi: tx.kode_transaksi,
              nama_customer: tx.nama_customer,
              tanggal_sewa: tx.tanggal_sewa,
              tanggal_kembali: tx.tanggal_kembali,
              status: tx.status,
              bookedQty: qty,
            });
          }
        }
      }
    }
  }

  return { bookedQty, conflictingBookings };
}

/**
 * Menghitung sisa kuota inventori yang tersedia pada rentang tanggal yang dipilih.
 */
export function getItemBookingAvailability({
  item,
  startDate,
  returnDate,
  transactions,
  excludeTransactionId,
}: {
  item: Inventori;
  startDate: string;
  returnDate: string;
  transactions: Transaksi[];
  excludeTransactionId?: string;
}): {
  totalStock: number;
  bookedQty: number;
  availableQty: number;
  isFullyBooked: boolean;
  conflictingBookings: ConflictingBooking[];
} {
  const totalStock = Number(item.jumlah_stok ?? item.stok_tersedia ?? 1);
  const { bookedQty, conflictingBookings } = calculateBookedQuantity({
    kodeJas: item.kode_jas,
    targetItem: item,
    startDate,
    returnDate,
    transactions,
    excludeTransactionId,
  });

  const availableQty = Math.max(0, totalStock - bookedQty);
  const isFullyBooked = availableQty <= 0;

  return {
    totalStock,
    bookedQty,
    availableQty,
    isFullyBooked,
    conflictingBookings,
  };
}

/**
 * Memvalidasi apakah seluruh item yang ingin dibooking/disewa
 * memiliki kuota yang cukup pada rentang tanggal tersebut.
 */
export function checkBookingConflicts({
  startDate,
  returnDate,
  items,
  transactions,
  inventory,
  excludeTransactionId,
}: {
  startDate: string;
  returnDate: string;
  items: { kodeJas: string; namaJas?: string; jumlah: number; ukuran?: string; warna?: string }[];
  transactions: Transaksi[];
  inventory: Inventori[];
  excludeTransactionId?: string;
}): ItemBookingConflict[] {
  const conflicts: ItemBookingConflict[] = [];

  for (const requestedItem of items) {
    if (!requestedItem.kodeJas || requestedItem.jumlah <= 0) continue;

    const inv = inventory.find((i) => isTransactionItemMatch(requestedItem, i));
    const totalStock = inv ? Number(inv.jumlah_stok ?? inv.stok_tersedia ?? 1) : 1;
    const namaJas = inv?.nama_jas || requestedItem.namaJas || requestedItem.kodeJas;

    const { bookedQty, conflictingBookings } = calculateBookedQuantity({
      kodeJas: requestedItem.kodeJas,
      targetItem: inv || requestedItem,
      startDate,
      returnDate,
      transactions,
      excludeTransactionId,
    });

    const availableQty = Math.max(0, totalStock - bookedQty);

    if (requestedItem.jumlah > availableQty) {
      conflicts.push({
        kodeJas: requestedItem.kodeJas,
        namaJas,
        requestedQty: requestedItem.jumlah,
        availableQty,
        totalStock,
        conflictingBookings,
      });
    }
  }

  return conflicts;
}
