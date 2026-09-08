import type { Inventori, Transaksi } from "@/types/database";
import { isDateRangeOverlapping } from "./bookingValidation";
import type { ConflictingBooking } from "./bookingValidation";

export interface SuitBookingScheduleItem {
  kode_transaksi: string;
  nama_customer: string;
  whatsapp?: string;
  tanggal_sewa: string;
  tanggal_kembali: string;
  status: string;
  bookedQty: number;
}

export interface SuitWithSchedule {
  item: Inventori;
  totalStock: number;
  activeSchedules: SuitBookingScheduleItem[];
  availableToday: number;
  isBookedToday: boolean;
  availableOnQueriedDate?: number;
  bookedOnQueriedDate?: number;
  isFullyBookedOnQueriedDate?: boolean;
}

/**
 * Extracts and organizes all upcoming and active bookings for every suit in inventory.
 */
export function getSuitsWithSchedule({
  inventory,
  transactions,
  queriedStartDate,
  queriedReturnDate,
}: {
  inventory: Inventori[];
  transactions: Transaksi[];
  queriedStartDate?: string;
  queriedReturnDate?: string;
}): SuitWithSchedule[] {
  const todayStr = new Date().toISOString().slice(0, 10);

  return inventory.map((inv) => {
    const totalStock = Number(inv.jumlah_stok ?? inv.stok_tersedia ?? 1);
    const schedules: SuitBookingScheduleItem[] = [];
    let bookedTodayCount = 0;

    for (const tx of transactions) {
      if (!["Booking", "Sedang Disewa", "Terlambat"].includes(tx.status)) continue;
      if (!tx.tanggal_sewa || !tx.tanggal_kembali) continue;

      // Check if this transaction contains this suit
      if (Array.isArray(tx.items)) {
        for (const itm of tx.items) {
          if (itm.kodeJas === inv.kode_jas) {
            const qty = Number(itm.jumlah) || 1;
            schedules.push({
              kode_transaksi: tx.kode_transaksi,
              nama_customer: tx.nama_customer,
              whatsapp: tx.whatsapp,
              tanggal_sewa: tx.tanggal_sewa,
              tanggal_kembali: tx.tanggal_kembali,
              status: tx.status,
              bookedQty: qty,
            });

            // Check if active today
            if (isDateRangeOverlapping(todayStr, todayStr, tx.tanggal_sewa, tx.tanggal_kembali)) {
              bookedTodayCount += qty;
            }
          }
        }
      }
    }

    // Sort schedules chronologically by start date
    schedules.sort((a, b) => a.tanggal_sewa.localeCompare(b.tanggal_sewa));

    const availableToday = Math.max(0, totalStock - bookedTodayCount);

    const result: SuitWithSchedule = {
      item: inv,
      totalStock,
      activeSchedules: schedules,
      availableToday,
      isBookedToday: bookedTodayCount > 0,
    };

    // If query dates provided, calculate specific date availability
    if (queriedStartDate && queriedReturnDate) {
      let bookedOnDate = 0;
      for (const sch of schedules) {
        if (
          isDateRangeOverlapping(
            queriedStartDate,
            queriedReturnDate,
            sch.tanggal_sewa,
            sch.tanggal_kembali
          )
        ) {
          bookedOnDate += sch.bookedQty;
        }
      }
      const availableOnDate = Math.max(0, totalStock - bookedOnDate);
      result.bookedOnQueriedDate = bookedOnDate;
      result.availableOnQueriedDate = availableOnDate;
      result.isFullyBookedOnQueriedDate = availableOnDate <= 0;
    }

    return result;
  });
}
