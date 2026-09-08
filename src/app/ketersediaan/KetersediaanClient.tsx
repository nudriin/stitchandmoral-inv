"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shirt,
  Sparkles,
  Share2,
  Copy,
  PlusCircle,
  Filter,
  User,
  CalendarCheck,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import type { Inventori, Transaksi } from "@/types/database";
import { getSuitsWithSchedule, SuitWithSchedule } from "@/lib/suitSchedule";
import { formatDateIndo, formatRupiah } from "@/lib/utils";
import { useDialog } from "@/components/ModalDialogProvider";

interface KetersediaanClientProps {
  initialTransactions: Transaksi[];
  inventory: Inventori[];
}

export function KetersediaanClient({
  initialTransactions,
  inventory,
}: KetersediaanClientProps) {
  const { showAlert } = useDialog();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSize, setSelectedSize] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all"); // all, ready, booked, full

  // Date Range State
  const [startDate, setStartDate] = useState<string>("");
  const [returnDate, setReturnDate] = useState<string>("");

  // Calculate rental duration in days
  const rentalDays = useMemo(() => {
    if (!startDate || !returnDate) return 0;
    const startMs = new Date(startDate + "T00:00:00").getTime();
    const endMs = new Date(returnDate + "T00:00:00").getTime();
    return Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));
  }, [startDate, returnDate]);

  // Extract all unique sizes from inventory
  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    inventory.forEach((i) => {
      if (i.ukuran) sizes.add(i.ukuran);
    });
    return Array.from(sizes).sort();
  }, [inventory]);

  // Process suits with booking schedules
  const suitsWithSchedule: SuitWithSchedule[] = useMemo(() => {
    return getSuitsWithSchedule({
      inventory,
      transactions: initialTransactions,
      queriedStartDate: startDate || undefined,
      queriedReturnDate: returnDate || undefined,
    });
  }, [inventory, initialTransactions, startDate, returnDate]);

  // Filter suits based on search, size, and status
  const filteredSuits = useMemo(() => {
    return suitsWithSchedule.filter((itemData) => {
      const { item, availableToday, activeSchedules, availableOnQueriedDate } = itemData;

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.nama_jas.toLowerCase().includes(query);
        const matchCode = item.kode_jas.toLowerCase().includes(query);
        const matchColor = (item.warna || "").toLowerCase().includes(query);
        const matchCustomer = activeSchedules.some((s) =>
          s.nama_customer.toLowerCase().includes(query)
        );
        if (!matchName && !matchCode && !matchColor && !matchCustomer) return false;
      }

      // Size filter
      if (selectedSize !== "all" && item.ukuran !== selectedSize) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter === "ready") {
        if (startDate && returnDate) {
          if ((availableOnQueriedDate ?? 0) <= 0) return false;
        } else {
          if (availableToday <= 0) return false;
        }
      } else if (selectedStatusFilter === "booked") {
        if (startDate && returnDate) {
          if ((itemData.bookedOnQueriedDate ?? 0) <= 0) return false;
        } else {
          if (activeSchedules.length === 0) return false;
        }
      } else if (selectedStatusFilter === "full") {
        if (startDate && returnDate) {
          if ((availableOnQueriedDate ?? 0) > 0) return false;
        } else {
          if (availableToday > 0) return false;
        }
      }

      return true;
    });
  }, [suitsWithSchedule, searchQuery, selectedSize, selectedStatusFilter, startDate, returnDate]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalModels = inventory.length;
    let totalPhysicalStock = 0;
    let totalAvailableToday = 0;
    let totalBookedToday = 0;

    suitsWithSchedule.forEach((s) => {
      totalPhysicalStock += s.totalStock;
      totalAvailableToday += s.availableToday;
      if (s.isBookedToday) totalBookedToday += s.totalStock - s.availableToday;
    });

    return { totalModels, totalPhysicalStock, totalAvailableToday, totalBookedToday };
  }, [inventory, suitsWithSchedule]);

  // Quick Date Presets
  const setQuickPreset = (preset: "today" | "tomorrow" | "weekend" | "reset") => {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const formatYMD = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === "today") {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      setStartDate(formatYMD(today));
      setReturnDate(formatYMD(tomorrow));
    } else if (preset === "tomorrow") {
      const t1 = new Date(today);
      t1.setDate(today.getDate() + 1);
      const t2 = new Date(today);
      t2.setDate(today.getDate() + 2);
      setStartDate(formatYMD(t1));
      setReturnDate(formatYMD(t2));
    } else if (preset === "weekend") {
      // Find upcoming Saturday
      const sat = new Date(today);
      const day = today.getDay();
      const diff = (6 - day + 7) % 7 || 7;
      sat.setDate(today.getDate() + diff);

      const mon = new Date(sat);
      mon.setDate(sat.getDate() + 2); // Return Monday
      setStartDate(formatYMD(sat));
      setReturnDate(formatYMD(mon));
    } else {
      setStartDate("");
      setReturnDate("");
    }
  };

  // Copy availability message for customer inquiry
  const handleCopyAvailabilityMessage = (suitData: SuitWithSchedule) => {
    const { item, totalStock, availableOnQueriedDate, availableToday } = suitData;
    const isQueried = startDate && returnDate;
    const avail = isQueried ? (availableOnQueriedDate ?? 0) : availableToday;

    let text = "";
    if (isQueried) {
      text = `Halo kak! Untuk *${item.nama_jas}* (Ukuran: ${item.ukuran || "-"}) pada tanggal *${formatDateIndo(startDate)} s/d ${formatDateIndo(returnDate)}* (${rentalDays} Hari):\n\n`;
      if (avail > 0) {
        text += `✅ *Status: TERSEDIA (Sisa ${avail} dari ${totalStock} unit)*\n`;
        text += `💰 Harga Sewa: ${formatRupiah(item.harga_default || 150000)} / hari\n\n`;
        text += `Jika ingin dibooking sekarang, silakan kirim nama & nomor WA ya kak agar kami amankan slotnya 🙏🏻✨`;
      } else {
        text += `❌ *Status: FULL BOOKED (Habis)* untuk tanggal tersebut.\n`;
        text += `Silakan tanyakan untuk model atau tanggal alternatif lainnya ya kak 🙏🏻`;
      }
    } else {
      text = `Halo kak! Untuk *${item.nama_jas}* (Ukuran: ${item.ukuran || "-"}):\n`;
      text += `• Total Stok: ${totalStock} unit\n`;
      text += `• Status Hari Ini: ${availableToday > 0 ? `Ready ${availableToday} unit` : "Sedang Disewa"}\n`;
      text += `• Harga Sewa: ${formatRupiah(item.harga_default || 150000)} / hari\n\n`;
      text += `Kakak berencana sewa untuk tanggal berapa? Nanti kami cekkan ketersediaan pastinya ya kak 🙏🏻✨`;
    }

    navigator.clipboard.writeText(text);
    showAlert({
      title: "Info Ketersediaan Tersalin! 📋",
      message: "Format pesan info ketersediaan telah disalin ke clipboard dan siap dikirim ke WhatsApp customer.",
      type: "success",
    });
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                Cek Ketersediaan & Jadwal Jas
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Pantau jadwal sewa aktif dan cek ketersediaan jas untuk tanggal tertentu secara instan
              </p>
            </div>
          </div>
        </div>

        {/* Quick Link to Pricelist */}
        <div className="flex items-center gap-2">
          <Link
            href="/pricelist"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Pricelist & Promo</span>
          </Link>
          <Link
            href="/transaksi"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold transition shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buat Transaksi</span>
          </Link>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Model Jas</span>
            <Shirt className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-zinc-100 mt-1">
            {stats.totalModels} <span className="text-xs font-normal text-slate-400">Varian</span>
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Total Unit Fisik</span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-zinc-100 mt-1">
            {stats.totalPhysicalStock} <span className="text-xs font-normal text-slate-400">Pcs</span>
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Ready Hari Ini</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.totalAvailableToday} <span className="text-xs font-normal text-slate-400">Pcs</span>
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Disewa Hari Ini</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {stats.totalBookedToday} <span className="text-xs font-normal text-slate-400">Pcs</span>
          </p>
        </div>
      </div>

      {/* Date Checker Box (Highlight Filter) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-amber-50/40 dark:from-indigo-950/20 dark:via-zinc-900 dark:to-amber-950/10 border border-indigo-100 dark:border-indigo-900/40 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Pilih Tanggal Rencana Sewa
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Masukkan rentang tanggal untuk cek sisa kuota yang siap disewa secara otomatis
              </p>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Pintas:</span>
            <button
              onClick={() => setQuickPreset("today")}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-zinc-700 transition"
            >
              Hari Ini
            </button>
            <button
              onClick={() => setQuickPreset("tomorrow")}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-zinc-700 transition"
            >
              Besok
            </button>
            <button
              onClick={() => setQuickPreset("weekend")}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-zinc-700 transition"
            >
              Akhir Pekan (Sabtu-Senin)
            </button>
            {(startDate || returnDate) && (
              <button
                onClick={() => setQuickPreset("reset")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-xs font-medium hover:bg-rose-100 transition"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Tanggal</span>
              </button>
            )}
          </div>
        </div>

        {/* Date Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
              Tanggal Mulai Sewa
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (!returnDate || returnDate < e.target.value) {
                  // Default return is next day
                  const nextDay = new Date(e.target.value + "T00:00:00");
                  nextDay.setDate(nextDay.getDate() + 1);
                  const pad = (n: number) => String(n).padStart(2, "0");
                  setReturnDate(
                    `${nextDay.getFullYear()}-${pad(nextDay.getMonth() + 1)}-${pad(nextDay.getDate())}`
                  );
                }
              }}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
              Tanggal Wajib Kembali
            </label>
            <input
              type="date"
              value={returnDate}
              min={startDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-2 md:col-span-1 flex items-end">
            <div className="w-full px-3.5 py-2.5 rounded-xl bg-indigo-100/70 dark:bg-indigo-900/30 border border-indigo-200/80 dark:border-indigo-800/50 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
                  {startDate && returnDate ? "Durasi Sewa Terpilih" : "Mode Tampilan"}
                </span>
                <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  {startDate && returnDate
                    ? `${rentalDays} Hari (${formatDateIndo(startDate)} - ${formatDateIndo(returnDate)})`
                    : "Semua Jadwal Sewa Aktif"}
                </p>
              </div>
              {startDate && returnDate && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold">
                  {rentalDays} Hari
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama jas, kode, warna, atau nama penyewa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden shadow-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Size Filter */}
          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden shadow-xs cursor-pointer"
          >
            <option value="all">Semua Ukuran</option>
            {availableSizes.map((sz) => (
              <option key={sz} value={sz}>
                Ukuran {sz}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden shadow-xs cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="ready">🟢 Ready Saja</option>
            <option value="booked">🟡 Ada Booking / Sewa</option>
            <option value="full">🔴 Habis (Full Booked)</option>
          </select>
        </div>
      </div>

      {/* Suits Grid List */}
      {filteredSuits.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
          <Shirt className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300">
            Tidak ada jas yang cocok dengan filter
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">
            Coba ubah kata kunci pencarian atau sesuaikan filter ukuran dan tanggal.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSuits.map((suitData) => {
            const {
              item,
              totalStock,
              activeSchedules,
              availableToday,
              isBookedToday,
              availableOnQueriedDate,
              bookedOnQueriedDate,
            } = suitData;

            const isQueried = Boolean(startDate && returnDate);
            const displayAvailable = isQueried ? (availableOnQueriedDate ?? 0) : availableToday;
            const isFull = displayAvailable <= 0;

            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between rounded-2xl border transition-all duration-200 bg-white dark:bg-zinc-900 shadow-xs hover:shadow-md ${
                  isFull
                    ? "border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10"
                    : displayAvailable === totalStock
                    ? "border-emerald-200/80 dark:border-emerald-900/50"
                    : "border-amber-200/80 dark:border-amber-900/50"
                }`}
              >
                <div className="p-4 space-y-3.5">
                  {/* Item Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {item.foto_url ? (
                        <img
                          src={item.foto_url}
                          alt={item.nama_jas}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-300 font-bold shrink-0">
                          <Shirt className="w-6 h-6 text-slate-400" />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                            {item.kode_jas}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                            Size {item.ukuran || "-"}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 mt-1 leading-snug">
                          {item.nama_jas}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                          {item.warna || "Standar"} • {formatRupiah(item.harga_default || 150000)}/hari
                        </p>
                      </div>
                    </div>

                    {/* Total Stock Badge */}
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block font-medium">Stok Total</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                        {totalStock} Unit
                      </span>
                    </div>
                  </div>

                  {/* Availability Status Bar */}
                  <div
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      isFull
                        ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200"
                        : displayAvailable === totalStock
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200"
                        : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isFull ? (
                        <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      )}
                      <div>
                        <span className="text-xs font-bold block leading-none">
                          {isFull
                            ? "Habis / Full Booked"
                            : displayAvailable === totalStock
                            ? `Tersedia Penuh (${displayAvailable} Unit)`
                            : `Sisa ${displayAvailable} Unit Ready`}
                        </span>
                        <span className="text-[10px] opacity-80 mt-0.5 block">
                          {isQueried
                            ? `Pada tgl ${formatDateIndo(startDate)} - ${formatDateIndo(returnDate)}`
                            : "Status ketersediaan saat ini"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black">
                        {displayAvailable}/{totalStock}
                      </span>
                    </div>
                  </div>

                  {/* Active Bookings & Upcoming Schedules Timeline */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Jadwal Sewa & Booking ({activeSchedules.length})</span>
                      </span>
                    </div>

                    {activeSchedules.length === 0 ? (
                      <div className="py-2 px-3 rounded-lg bg-slate-50 dark:bg-zinc-800/50 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Bebas jadwal sewa (Tidak ada booking aktif)</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {activeSchedules.map((sch, idx) => {
                          const isOverlapWithQuery =
                            isQueried &&
                            sch.tanggal_sewa <= returnDate &&
                            sch.tanggal_kembali >= startDate;

                          return (
                            <div
                              key={idx}
                              className={`p-2 rounded-lg text-[11px] border transition ${
                                isOverlapWithQuery
                                  ? "bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60"
                                  : "bg-slate-50 dark:bg-zinc-800/60 border-slate-200/80 dark:border-zinc-700/60"
                              }`}
                            >
                              <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-zinc-100">
                                <div className="flex items-center gap-1.5 truncate mr-2">
                                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{sch.nama_customer}</span>
                                  <span className="text-[10px] text-slate-500 font-normal">
                                    ({sch.bookedQty} unit)
                                  </span>
                                </div>
                                <span
                                  className={`text-[9.5px] px-1.5 py-0.2 rounded font-medium shrink-0 ${
                                    sch.status === "Sedang Disewa"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                      : sch.status === "Booking"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                      : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                  }`}
                                >
                                  {sch.status}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400 mt-1">
                                <span>
                                  📅 {formatDateIndo(sch.tanggal_sewa)} ➔ {formatDateIndo(sch.tanggal_kembali)}
                                </span>
                                <span className="font-mono text-[9px] text-slate-400">
                                  #{sch.kode_transaksi}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center gap-2 rounded-b-2xl">
                  <button
                    onClick={() => handleCopyAvailabilityMessage(suitData)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition cursor-pointer shadow-xs"
                    title="Salin Info Ketersediaan Siap Kirim ke WhatsApp"
                  >
                    <Copy className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Salin Info WA</span>
                  </button>

                  <Link
                    href={`/transaksi?action=new&kodeJas=${encodeURIComponent(item.kode_jas)}${
                      startDate ? `&startDate=${encodeURIComponent(startDate)}` : ""
                    }${returnDate ? `&returnDate=${encodeURIComponent(returnDate)}` : ""}`}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs ${
                      isFull
                        ? "bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed"
                        : "bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950"
                    }`}
                  >
                    <span>Booking Jas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
