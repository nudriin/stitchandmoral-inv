"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Calendar as CalendarIcon,
  Shirt,
  Sparkles,
  Copy,
  PlusCircle,
  User,
  CalendarCheck,
  ArrowRight,
  LayoutGrid,
  MessageCircle,
  StickyNote,
  Clock,
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

  // Tab State: "cards" (Ringkasan Kartu) vs "schedule" (Jadwal & Catatan Booking Item)
  const [activeTab, setActiveTab] = useState<"cards" | "schedule">("cards");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSize, setSelectedSize] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("booked"); // default to sedang disewa/booking/habis

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
      const { item, activeSchedules, availableToday, availableOnQueriedDate } = itemData;

      // Text search (matches name, code, color, customer name, and transaction notes like pant sizes)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.nama_jas.toLowerCase().includes(query);
        const matchCode = item.kode_jas.toLowerCase().includes(query);
        const matchColor = (item.warna || "").toLowerCase().includes(query);
        const matchCustomer = activeSchedules.some((s) =>
          s.nama_customer.toLowerCase().includes(query)
        );
        const matchNote = activeSchedules.some((s) =>
          (s.catatan || "").toLowerCase().includes(query)
        );
        if (!matchName && !matchCode && !matchColor && !matchCustomer && !matchNote) return false;
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
    let totalSuitsWithBookings = 0;

    suitsWithSchedule.forEach((s) => {
      totalPhysicalStock += s.totalStock;
      totalAvailableToday += s.availableToday;
      if (s.isBookedToday) totalBookedToday += s.totalStock - s.availableToday;
      if (s.activeSchedules.length > 0) totalSuitsWithBookings++;
    });

    return { totalModels, totalPhysicalStock, totalAvailableToday, totalBookedToday, totalSuitsWithBookings };
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
      const sat = new Date(today);
      const day = today.getDay();
      const diff = (6 - day + 7) % 7 || 7;
      sat.setDate(today.getDate() + diff);

      const mon = new Date(sat);
      mon.setDate(sat.getDate() + 2);
      setStartDate(formatYMD(sat));
      setReturnDate(formatYMD(mon));
    } else {
      setStartDate("");
      setReturnDate("");
    }
  };

  const handleCopyAvailabilityMessage = (suitData: SuitWithSchedule) => {
    const { item, totalStock, availableOnQueriedDate, availableToday } = suitData;
    const isQueried = startDate && returnDate;
    const avail = isQueried ? (availableOnQueriedDate ?? 0) : availableToday;

    let text = `Halo kak! Untuk *${item.nama_jas}* (Ukuran: ${item.ukuran || "-"}):\n`;
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
      text += `• Total Stok: ${totalStock} unit\n`;
      text += `• Status Hari Ini: ${availableToday > 0 ? `Ready ${availableToday} unit` : "Sedang Disewa"}\n`;
      text += `• Harga Sewa: ${formatRupiah(item.harga_default || 150000)} / hari\n\n`;
      text += `Kakak berencana sewa untuk tanggal berapa? Nanti kami cekkan ketersediaan pastinya ya kak 🙏🏻✨`;
    }

    navigator.clipboard.writeText(text);
    showAlert({
      title: "Info Ketersediaan Tersalin! 📋",
      message: "Format pesan info ketersediaan telah disalin ke clipboard.",
      type: "success",
    });
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Top Header */}
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
                Pantau jadwal sewa aktif, cek ketersediaan kuota, dan lihat catatan ukuran celana per item
              </p>
            </div>
          </div>
        </div>

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

      {/* Date Range Selector Banner */}
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

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Pintas:</span>
            <button
              onClick={() => setQuickPreset("today")}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-zinc-700 transition cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              onClick={() => setQuickPreset("tomorrow")}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-zinc-700 transition cursor-pointer"
            >
              Besok
            </button>
            <button
              onClick={() => setQuickPreset("weekend")}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-zinc-700 transition cursor-pointer"
            >
              Weekend (Sab-Sen)
            </button>
            {(startDate || returnDate) && (
              <button
                onClick={() => setQuickPreset("reset")}
                className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-medium hover:bg-rose-100 transition cursor-pointer"
              >
                Reset Tanggal
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
              Tanggal Mulai Sewa (Ambil)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (returnDate && e.target.value > returnDate) {
                  setReturnDate(e.target.value);
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
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher & Filters */}
      <div className="space-y-3">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl w-full sm:w-fit border border-slate-200/70 dark:border-zinc-700/60 shadow-2xs">
          <button
            onClick={() => setActiveTab("cards")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "cards"
                ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-slate-600 dark:text-zinc-300" />
            <span>Ringkasan Stok Jas</span>
          </button>

          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "schedule"
                ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            }`}
          >
            <Clock className="w-4 h-4 text-indigo-500" />
            <span>Jadwal & Catatan Booking Item</span>
            {stats.totalSuitsWithBookings > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black">
                {stats.totalSuitsWithBookings}
              </span>
            )}
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama jas, kode, warna, penyewa, atau catatan (mis: celana 34)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2">
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

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden shadow-xs cursor-pointer"
            >
              <option value="booked">🟡 Ada Booking / Sewa</option>
              <option value="full">🔴 Habis (Full Booked)</option>
              <option value="ready">🟢 Ready Saja</option>
              <option value="all">Semua Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredSuits.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
          <Shirt className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300">
            Tidak ada jas yang cocok dengan filter
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">
            Coba ubah kata kunci pencarian, sesuaikan filter ukuran, tanggal, atau ganti status filter.
          </p>
        </div>
      ) : activeTab === "cards" ? (
        /* ==================== TAB 1: RINGKASAN KARTU STOK JAS ==================== */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSuits.map((suitData) => {
            const {
              item,
              totalStock,
              activeSchedules,
              availableToday,
              availableOnQueriedDate,
            } = suitData;
            const isQueried = Boolean(startDate && returnDate);
            const displayAvailable = isQueried ? (availableOnQueriedDate ?? 0) : availableToday;
            const isFull = displayAvailable <= 0;

            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between rounded-2xl border transition-all duration-200 bg-white dark:bg-zinc-900 shadow-xs hover:shadow-md ${
                  isFull ? "border-rose-200 dark:border-rose-900/50" : "border-slate-200 dark:border-zinc-800"
                }`}
              >
                <div className="p-4 space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {item.foto_url ? (
                        <img
                          src={item.foto_url}
                          alt={item.nama_jas}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-bold shrink-0">
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
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-2.5 rounded-xl border ${
                      isFull
                        ? "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300"
                        : "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300"
                    }`}
                  >
                    <span className="text-xs font-bold">
                      {isFull ? "Habis (Full Booked)" : `Ready: ${displayAvailable}/${totalStock}`}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Jadwal ({activeSchedules.length})</span>
                    </span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {activeSchedules.length === 0 ? (
                        <div className="p-2 rounded-xl text-[11px] bg-slate-50 dark:bg-zinc-800/40 text-slate-500 dark:text-zinc-400 text-center">
                          Tidak ada booking aktif
                        </div>
                      ) : (
                        activeSchedules.map((sch, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl text-[11px] border bg-slate-50 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700 space-y-1.5"
                          >
                            <div className="flex justify-between font-bold text-slate-900 dark:text-zinc-100">
                              <span>
                                {sch.nama_customer} ({sch.bookedQty} unit)
                              </span>
                              <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded text-[10px]">
                                {sch.status}
                              </span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500 dark:text-zinc-400">
                              <span>
                                📅 {formatDateIndo(sch.tanggal_sewa)} ➔ {formatDateIndo(sch.tanggal_kembali)}
                              </span>
                            </div>
                            {sch.catatan && (
                              <div className="px-2 py-1 rounded-lg bg-amber-100/80 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-[10.5px] text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
                                <StickyNote className="w-3 h-3 text-amber-700 dark:text-amber-400 mt-0.5 shrink-0" />
                                <div className="leading-tight">
                                  <span className="font-bold">Catatan: </span>
                                  {sch.catatan}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center gap-2 rounded-b-2xl">
                  <button
                    onClick={() => handleCopyAvailabilityMessage(suitData)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition cursor-pointer shadow-xs"
                    title="Salin Info Ketersediaan Siap Kirim ke WhatsApp"
                  >
                    <Copy className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Salin WA</span>
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
      ) : (
        /* ==================== TAB 2: JADWAL & CATATAN BOOKING PER ITEM ==================== */
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-indigo-900 dark:text-indigo-200">
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>
                Menampilkan seluruh jadwal sewa beserta <strong>catatan transaksi (ukuran celana, dasi, aksesoris)</strong> per model jas.
              </span>
            </div>
            <span className="text-[11px] font-bold bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800 shrink-0 self-start sm:self-auto">
              Total {filteredSuits.length} Model Jas Ditampilkan
            </span>
          </div>

          <div className="space-y-4">
            {filteredSuits.map((suitData) => {
              const {
                item,
                totalStock,
                activeSchedules,
                availableToday,
                availableOnQueriedDate,
              } = suitData;

              const isQueried = Boolean(startDate && returnDate);
              const displayAvailable = isQueried ? (availableOnQueriedDate ?? 0) : availableToday;
              const isFull = displayAvailable <= 0;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden"
                >
                  {/* Jas Header Bar */}
                  <div className="p-4 bg-slate-50/80 dark:bg-zinc-800/40 border-b border-slate-200/80 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {item.foto_url ? (
                        <img
                          src={item.foto_url}
                          alt={item.nama_jas}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-slate-500 font-bold shrink-0">
                          <Shirt className="w-6 h-6 text-slate-400" />
                        </div>
                      )}

                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300">
                            {item.kode_jas}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                            Size {item.ukuran || "-"}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-400">
                            {item.warna || "Standar"} • {formatRupiah(item.harga_default || 150000)}/hari
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 mt-0.5">
                          {item.nama_jas}
                        </h3>
                      </div>
                    </div>

                    {/* Stock & Quick Action */}
                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Ketersediaan</span>
                        <span
                          className={`text-xs font-extrabold px-2 py-0.5 rounded-lg border ${
                            isFull
                              ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300"
                              : displayAvailable === totalStock
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300"
                              : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300"
                          }`}
                        >
                          {isFull
                            ? "Habis (0 Unit Ready)"
                            : `${displayAvailable} dari ${totalStock} Unit Ready`}
                        </span>
                      </div>

                      <Link
                        href={`/transaksi?action=new&kodeJas=${encodeURIComponent(item.kode_jas)}${
                          startDate ? `&startDate=${encodeURIComponent(startDate)}` : ""
                        }${returnDate ? `&returnDate=${encodeURIComponent(returnDate)}` : ""}`}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Sewa</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Body: Schedule Timeline & Catatan */}
                  <div className="p-4">
                    {activeSchedules.length === 0 ? (
                      <div className="py-4 px-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-dashed border-slate-200 dark:border-zinc-700 text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Tidak ada booking aktif untuk jas ini (Seluruh {totalStock} unit siap disewa kapan saja).</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Daftar Booking & Catatan Ukuran ({activeSchedules.length} Transaksi)</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {activeSchedules.map((sch, sIdx) => {
                            const isOverlapWithQuery =
                              isQueried &&
                              sch.tanggal_sewa <= returnDate &&
                              sch.tanggal_kembali >= startDate;

                            const sStart = new Date(sch.tanggal_sewa + "T00:00:00").getTime();
                            const sEnd = new Date(sch.tanggal_kembali + "T00:00:00").getTime();
                            const sDays = Math.max(1, Math.round((sEnd - sStart) / (1000 * 60 * 60 * 24)));

                            return (
                              <div
                                key={sIdx}
                                className={`p-3.5 rounded-xl border transition flex flex-col justify-between space-y-2.5 ${
                                  isOverlapWithQuery
                                    ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60"
                                    : "bg-slate-50/70 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/60"
                                }`}
                              >
                                <div>
                                  {/* Top Line: Customer & Status */}
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-zinc-100 text-xs truncate">
                                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span className="truncate">{sch.nama_customer}</span>
                                      <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                                        ({sch.bookedQty} Unit)
                                      </span>
                                    </div>

                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 ${
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

                                  {/* Dates Line */}
                                  <div className="mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-800/80 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-700">
                                    <div className="flex items-center gap-1.5">
                                      <CalendarIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                      <span className="font-semibold">
                                        {formatDateIndo(sch.tanggal_sewa)} ➔ {formatDateIndo(sch.tanggal_kembali)}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shrink-0">
                                      {sDays} Hari
                                    </span>
                                  </div>

                                  {/* PROMINENT NOTE BOX (Ukuran Celana / Catatan Khusus) */}
                                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-900/60 text-amber-950 dark:text-amber-100">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-1">
                                      <StickyNote className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                      <span>Catatan Booking / Ukuran Celana:</span>
                                    </div>
                                    <p className="text-xs font-semibold pl-5 break-words">
                                      {sch.catatan && sch.catatan.trim() ? (
                                        sch.catatan
                                      ) : (
                                        <span className="text-slate-400 dark:text-zinc-500 font-normal italic">
                                          (Tidak ada catatan khusus)
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>

                                {/* Bottom Info: WhatsApp & Kode Transaksi */}
                                <div className="pt-2 border-t border-slate-200/70 dark:border-zinc-700/60 flex items-center justify-between text-[11px]">
                                  <span className="font-mono text-[10px] text-slate-400">
                                    #{sch.kode_transaksi}
                                  </span>

                                  {sch.whatsapp ? (
                                    <a
                                      href={`https://wa.me/${sch.whatsapp.replace(/\D/g, "")}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                      <span>+{sch.whatsapp}</span>
                                    </a>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
