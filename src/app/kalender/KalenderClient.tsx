"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ReceiptText,
  User,
  MessageCircle,
  MapPin,
  X,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
  Filter,
  Tag,
  Grid,
} from "lucide-react";
import { formatRupiah, formatDateIndo, calculateRentalDays } from "@/lib/utils";
import type { Transaksi, Inventori, Customer } from "@/types/database";

interface KalenderClientProps {
  initialTransactions: Transaksi[];
  inventory: Inventori[];
  customers: Customer[];
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAY_NAMES = ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"];

export function KalenderClient({
  initialTransactions,
  inventory,
  customers,
}: KalenderClientProps) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Calendar view states
  // Default is "kalender" mode as requested by user
  const [mainMode, setMainMode] = useState<"kalender" | "gantt">("kalender");
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [viewMode, setViewMode] = useState<"bulan" | "minggu">("bulan");

  // Selected date for week view or day preview
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Semua"); // Semua | Booking | Sedang Disewa | Terlambat | Selesai
  const [ganttCategory, setGanttCategory] = useState<string>("Semua"); // Semua | Jas | Celana | Dasi | Lainnya

  // Modals
  const [selectedTx, setSelectedTx] = useState<Transaksi | null>(null);
  const [dayEventsModalDate, setDayEventsModalDate] = useState<string | null>(null);

  // Days in currently selected month for Gantt Chart
  const daysInCurrentMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  // Navigate month or week
  function handlePrevMonth() {
    if (mainMode === "gantt" || viewMode === "bulan") {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear((y) => y - 1);
      } else {
        setCurrentMonth((m) => m - 1);
      }
    } else {
      // Prev week
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 7);
      setSelectedDate(d.toISOString().slice(0, 10));
      setCurrentMonth(d.getMonth());
      setCurrentYear(d.getFullYear());
    }
  }

  function handleNextMonth() {
    if (mainMode === "gantt" || viewMode === "bulan") {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear((y) => y + 1);
      } else {
        setCurrentMonth((m) => m + 1);
      }
    } else {
      // Next week
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 7);
      setSelectedDate(d.toISOString().slice(0, 10));
      setCurrentMonth(d.getMonth());
      setCurrentYear(d.getFullYear());
    }
  }

  function handleGoToday() {
    const d = new Date();
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
    setSelectedDate(d.toISOString().slice(0, 10));
  }

  // Filtered transactions (defensive against date anomaly or status filter)
  const activeTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();

    return initialTransactions.filter((tx) => {
      // Status filter
      if (statusFilter !== "Semua") {
        if (statusFilter === "Aktif" && tx.status !== "Sedang Disewa") return false;
        if (statusFilter !== "Aktif" && tx.status !== statusFilter) return false;
      }

      // Search filter
      if (!q) return true;

      const matchCust = tx.nama_customer?.toLowerCase().includes(q);
      const matchCode = tx.kode_transaksi?.toLowerCase().includes(q);
      const matchWa = tx.whatsapp?.includes(q);
      const matchItems = tx.items?.some((itm) => itm.namaJas?.toLowerCase().includes(q));

      return matchCust || matchCode || matchWa || matchItems;
    });
  }, [initialTransactions, statusFilter, search]);

  // Generate calendar grid for month view (Monday first)
  const monthCalendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Monday-based day of week: 0 = Mon, 6 = Sun
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysInCurrentMonth = lastDayOfMonth.getDate();

    const cells: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Leading days (previous month)
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonthDate = new Date(currentYear, currentMonth - 1, dayNum);
      const dateStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      cells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Trailing days to fill 5 or 6 weeks (multiple of 7)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextMonthDate = new Date(currentYear, currentMonth + 1, i);
      const dateStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      cells.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return cells;
  }, [currentYear, currentMonth, todayStr]);

  // Generate 7 days for Week View
  const weekCalendarDays = useMemo(() => {
    const current = new Date(selectedDate);
    let dayOfWeek = current.getDay() - 1; // 0 = Mon, 6 = Sun
    if (dayOfWeek === -1) dayOfWeek = 6;

    const monday = new Date(current);
    monday.setDate(current.getDate() - dayOfWeek);

    const weekDays: {
      dateStr: string;
      dayNumber: number;
      dayName: string;
      isToday: boolean;
    }[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      weekDays.push({
        dateStr,
        dayNumber: d.getDate(),
        dayName: DAY_NAMES[i],
        isToday: dateStr === todayStr,
      });
    }

    return weekDays;
  }, [selectedDate, todayStr]);

  // Helper to get transactions active on a specific date (DEFENSIVE against return date anomalies)
  function getTransactionsOnDate(dateStr: string) {
    return activeTransactions.filter((tx) => {
      const start = tx.tanggal_sewa?.slice(0, 10);
      const rawEnd = tx.tanggal_kembali?.slice(0, 10);
      if (!start) return false;
      const end = rawEnd && rawEnd >= start ? rawEnd : start;
      return dateStr >= start && dateStr <= end;
    });
  }

  // Get status pill styling
  function getStatusStyle(status: string) {
    switch (status) {
      case "Booking":
        return {
          pill: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800/80 hover:bg-blue-200 dark:hover:bg-blue-900/90",
          dot: "bg-blue-500",
          badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300",
          label: "Booking",
        };
      case "Sedang Disewa":
      case "Aktif":
        return {
          pill: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800/80 hover:bg-emerald-200 dark:hover:bg-emerald-900/90",
          dot: "bg-emerald-500",
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300",
          label: "Aktif",
        };
      case "Terlambat":
        return {
          pill: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800/80 hover:bg-rose-200 dark:hover:bg-rose-900/90",
          dot: "bg-rose-500",
          badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300",
          label: "Terlambat",
        };
      case "Selesai":
        return {
          pill: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700",
          dot: "bg-slate-400",
          badge: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300",
          label: "Selesai",
        };
      default:
        return {
          pill: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
          dot: "bg-slate-400",
          badge: "bg-slate-50 text-slate-600 border-slate-200",
          label: status,
        };
    }
  }

  // Summary counts for current month
  const monthStats = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    const txThisMonth = initialTransactions.filter(
      (t) => t.tanggal_sewa?.startsWith(monthPrefix) || t.tanggal_kembali?.startsWith(monthPrefix)
    );

    const bookingCount = txThisMonth.filter((t) => t.status === "Booking").length;
    const activeCount = txThisMonth.filter((t) => t.status === "Sedang Disewa").length;
    const overdueCount = txThisMonth.filter((t) => t.status === "Terlambat").length;
    const finishedCount = txThisMonth.filter((t) => t.status === "Selesai").length;

    return {
      total: txThisMonth.length,
      bookingCount,
      activeCount,
      overdueCount,
      finishedCount,
    };
  }, [initialTransactions, currentYear, currentMonth]);

  // Gantt Chart: Filtered Inventory List
  const filteredInventoryForGantt = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inventory.filter((inv) => {
      // Category filter
      if (ganttCategory !== "Semua") {
        if (ganttCategory === "Lainnya") {
          if (["Jas", "Celana", "Dasi"].includes(inv.jenis_jas)) return false;
        } else if (inv.jenis_jas !== ganttCategory) {
          return false;
        }
      }

      // Search query
      if (!q) return true;
      return (
        inv.nama_jas.toLowerCase().includes(q) ||
        inv.kode_jas.toLowerCase().includes(q) ||
        (inv.warna && inv.warna.toLowerCase().includes(q)) ||
        (inv.ukuran && inv.ukuran.toLowerCase().includes(q))
      );
    });
  }, [inventory, ganttCategory, search]);

  // Gantt Chart: Array of days for the current month
  const ganttDaysList = useMemo(() => {
    const list: {
      dayNum: number;
      dateStr: string;
      dayName: string;
      isToday: boolean;
      isWeekend: boolean;
    }[] = [];

    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayObj = new Date(currentYear, currentMonth, d);
      const dayIdx = dayObj.getDay(); // 0 = Sun, 6 = Sat
      const indonesianDayIdx = (dayIdx + 6) % 7; // 0 = Mon, 6 = Sun
      const dayName = DAY_NAMES[indonesianDayIdx];
      const isWeekend = dayIdx === 0 || dayIdx === 6;

      list.push({
        dayNum: d,
        dateStr,
        dayName,
        isToday: dateStr === todayStr,
        isWeekend,
      });
    }

    return list;
  }, [currentYear, currentMonth, daysInCurrentMonth, todayStr]);

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 sm:p-5 rounded-3xl shadow-xs">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            {mainMode === "kalender" ? (
              <CalendarIcon className="w-5 h-5" />
            ) : (
              <Layers className="w-5 h-5" />
            )}
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              {mainMode === "kalender" ? "Kalender Booking" : "Gantt Chart Jadwal Jas"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {mainMode === "kalender"
                ? "Jadwal persewaan, booking aktif, dan pengembalian jas"
                : "Timeline visual ketersediaan jas & pemakaian per inventori"}
            </p>
          </div>
        </div>

        {/* Controls: Mode Switcher, Sub-view & Navigation */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Main Mode Toggle: Kalender (Default) | Gantt Chart */}
          <div className="bg-slate-100 dark:bg-zinc-950 p-1 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 flex items-center gap-1">
            <button
              onClick={() => setMainMode("kalender")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                mainMode === "kalender"
                  ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Kalender</span>
            </button>
            <button
              onClick={() => setMainMode("gantt")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                mainMode === "gantt"
                  ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Gantt Chart</span>
            </button>
          </div>

          {/* Sub-view toggle when in Calendar mode: Bulan | Minggu */}
          {mainMode === "kalender" && (
            <div className="bg-slate-100 dark:bg-zinc-950 p-1 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 flex items-center gap-1">
              <button
                onClick={() => setViewMode("bulan")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "bulan"
                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100"
                }`}
              >
                <span>Bulan</span>
              </button>
              <button
                onClick={() => setViewMode("minggu")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "minggu"
                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100"
                }`}
              >
                <span>Minggu</span>
              </button>
            </div>
          )}

          {/* Quick "Hari Ini" Button */}
          <button
            onClick={handleGoToday}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-700 transition cursor-pointer"
          >
            Hari ini
          </button>

          {/* Month/Week Navigation */}
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-1 shadow-2xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 font-bold text-xs sm:text-sm text-slate-900 dark:text-zinc-100 min-w-[120px] text-center font-sans">
              {mainMode === "gantt" || viewMode === "bulan"
                ? `${MONTH_NAMES[currentMonth]} ${currentYear}`
                : `Minggu, ${formatDateIndo(weekCalendarDays[0].dateStr).slice(0, 6)} - ${formatDateIndo(weekCalendarDays[6].dateStr)}`}
            </span>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* New Transaction Button */}
          <Link
            href="/transaksi"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-xs font-bold rounded-2xl flex items-center gap-1.5 transition shadow-xs cursor-pointer ml-auto sm:ml-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Sewa</span>
          </Link>
        </div>
      </div>

      {/* Legend & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3 sm:p-4 rounded-3xl">
        {/* Status Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setStatusFilter("Semua")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer border ${
              statusFilter === "Semua"
                ? "bg-slate-900 text-white border-slate-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                : "bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:bg-slate-100"
            }`}
          >
            Semua ({monthStats.total})
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === "Booking" ? "Semua" : "Booking")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer border ${
              statusFilter === "Booking"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-blue-50/80 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60 hover:bg-blue-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Booking</span>
            <span className="text-[10px] opacity-75">({monthStats.bookingCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === "Aktif" ? "Semua" : "Aktif")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer border ${
              statusFilter === "Aktif"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-emerald-50/80 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60 hover:bg-emerald-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Aktif</span>
            <span className="text-[10px] opacity-75">({monthStats.activeCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === "Terlambat" ? "Semua" : "Terlambat")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer border ${
              statusFilter === "Terlambat"
                ? "bg-rose-600 text-white border-rose-600"
                : "bg-rose-50/80 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60 hover:bg-rose-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Terlambat</span>
            <span className="text-[10px] opacity-75">({monthStats.overdueCount})</span>
          </button>
        </div>

        {/* Search Input & Legend Hint */}
        <div className="flex items-center gap-3">
          <span className="hidden lg:inline text-[11px] text-slate-400 font-medium font-mono">
            ► mulai • ·· berjalan • ⮌ kembali
          </span>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari customer / jas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-zinc-100 outline-none focus:border-slate-400 dark:focus:border-zinc-600"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= GANTT CHART VIEW ================= */}
      {mainMode === "gantt" ? (
        <div className="space-y-3">
          {/* Gantt Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {["Semua", "Jas", "Celana", "Dasi", "Lainnya"].map((cat) => (
              <button
                key={cat}
                onClick={() => setGanttCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 border ${
                  ganttCategory === cat
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800"
                }`}
              >
                {cat}
              </button>
            ))}
            <span className="text-[11px] text-slate-400 ml-auto hidden sm:inline">
              Menampilkan {filteredInventoryForGantt.length} item inventori
            </span>
          </div>

          {/* Gantt Timeline Container */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[900px] divide-y divide-slate-100 dark:divide-zinc-800/80">
                {/* Timeline Header Row */}
                <div className="flex bg-slate-50/90 dark:bg-zinc-950/90 sticky top-0 z-20 border-b border-slate-200 dark:border-zinc-800">
                  {/* Left Column Header (Sticky) */}
                  <div className="w-56 sm:w-64 shrink-0 px-3.5 py-3 font-bold text-xs text-slate-700 dark:text-zinc-300 border-r border-slate-200 dark:border-zinc-800 sticky left-0 bg-slate-50 dark:bg-zinc-950 z-30 flex items-center justify-between">
                    <span>Item Inventori</span>
                    <span className="text-[10px] text-slate-400">Total Stok</span>
                  </div>

                  {/* Days of Month Header Columns */}
                  <div
                    className="grid flex-1"
                    style={{
                      gridTemplateColumns: `repeat(${daysInCurrentMonth}, minmax(40px, 1fr))`,
                    }}
                  >
                    {ganttDaysList.map((d) => (
                      <div
                        key={d.dayNum}
                        className={`text-center py-2 border-r border-slate-100 dark:border-zinc-800/70 ${
                          d.isWeekend ? "bg-slate-100/50 dark:bg-zinc-900/40" : ""
                        }`}
                      >
                        <span className="text-[9.5px] font-bold text-slate-400 block uppercase leading-none">
                          {d.dayName}
                        </span>
                        <span
                          className={`inline-flex items-center justify-center text-xs font-bold mt-1 rounded-full ${
                            d.isToday
                              ? "w-5 h-5 bg-emerald-600 text-white font-black shadow-2xs"
                              : "text-slate-800 dark:text-zinc-200"
                          }`}
                        >
                          {d.dayNum}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline Rows per Inventory Item */}
                {filteredInventoryForGantt.length > 0 ? (
                  filteredInventoryForGantt.map((inv) => {
                    const monthStartStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
                    const monthEndStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(daysInCurrentMonth).padStart(2, "0")}`;

                    // Find bookings for this specific inventory item that overlap with current month
                    const itemBookings = activeTransactions.filter((tx) => {
                      const hasItem = Array.isArray(tx.items) && tx.items.some((i) => i.kodeJas === inv.kode_jas);
                      if (!hasItem) return false;

                      const s = tx.tanggal_sewa?.slice(0, 10);
                      const rawE = tx.tanggal_kembali?.slice(0, 10);
                      if (!s) return false;
                      const e = rawE && rawE >= s ? rawE : s;

                      return s <= monthEndStr && e >= monthStartStr;
                    });

                    return (
                      <div key={inv.id || inv.kode_jas} className="flex hover:bg-slate-50/40 dark:hover:bg-zinc-800/20 transition group">
                        {/* Sticky Left Item Info */}
                        <div className="w-56 sm:w-64 shrink-0 px-3.5 py-3 border-r border-slate-200 dark:border-zinc-800 sticky left-0 bg-white dark:bg-zinc-900 group-hover:bg-slate-50/90 dark:group-hover:bg-zinc-850 z-10">
                          <p className="font-bold text-xs text-slate-900 dark:text-zinc-100 truncate" title={inv.nama_jas}>
                            {inv.nama_jas}
                          </p>
                          <div className="flex items-center justify-between mt-0.5 text-[10.5px] text-slate-500 dark:text-zinc-400">
                            <span>
                              {inv.warna || "-"} • {inv.ukuran || "-"}
                            </span>
                            <span className="font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                              {inv.jumlah_stok ?? inv.stok_tersedia ?? 1} unit
                            </span>
                          </div>
                        </div>

                        {/* Days Grid & Booking Bars */}
                        <div
                          className="relative flex-1 grid py-2"
                          style={{
                            gridTemplateColumns: `repeat(${daysInCurrentMonth}, minmax(40px, 1fr))`,
                            minHeight: itemBookings.length > 0 ? "52px" : "44px",
                          }}
                        >
                          {/* Background Grid Cells */}
                          {ganttDaysList.map((d) => (
                            <Link
                              key={d.dayNum}
                              href="/transaksi"
                              className={`border-r border-slate-100 dark:border-zinc-800/60 h-full flex items-center justify-center transition opacity-0 hover:opacity-100 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 text-indigo-600 ${
                                d.isWeekend ? "bg-slate-50/30 dark:bg-zinc-950/20" : ""
                              }`}
                              title={`Klik untuk buat sewa ${inv.nama_jas} pada ${d.dateStr}`}
                            >
                              <Plus className="w-3 h-3 text-slate-400" />
                            </Link>
                          ))}

                          {/* Event Bars Overlay */}
                          {itemBookings.map((tx) => {
                            const s = tx.tanggal_sewa?.slice(0, 10) || monthStartStr;
                            const rawE = tx.tanggal_kembali?.slice(0, 10) || s;
                            const e = rawE >= s ? rawE : s;

                            // Calculate column start and end (1-indexed, inclusive)
                            const startCol = s < monthStartStr ? 1 : Math.max(1, parseInt(s.slice(8, 10), 10));
                            const endCol = e > monthEndStr ? daysInCurrentMonth : Math.min(daysInCurrentMonth, parseInt(e.slice(8, 10), 10));

                            const style = getStatusStyle(tx.status);

                            return (
                              <button
                                key={tx.id || tx.kode_transaksi}
                                onClick={() => setSelectedTx(tx)}
                                style={{
                                  gridColumn: `${startCol} / ${endCol + 1}`,
                                }}
                                className={`absolute inset-y-2 left-1 right-1 z-10 px-2 rounded-xl text-[10.5px] font-bold border flex items-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer truncate ${style.pill}`}
                                title={`${tx.nama_customer} (${tx.status}) — ${tx.kode_transaksi}\nPeriode: ${formatDateIndo(tx.tanggal_sewa)} s/d ${formatDateIndo(tx.tanggal_kembali)}`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-current opacity-70" />
                                <span className="truncate">{tx.nama_customer}</span>
                                <span className="opacity-70 font-mono text-[9.5px] hidden sm:inline shrink-0">
                                  ({tx.status})
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500">
                    Tidak ada item inventori yang cocok dengan filter atau pencarian &quot;{search}&quot;.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : viewMode === "bulan" ? (
        /* ================= BULAN (MONTH GRID VIEW) ================= */
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
          {/* Day Headers (SEN, SEL, RAB, KAM, JUM, SAB, MIN) */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/70">
            {DAY_NAMES.map((day, idx) => (
              <div
                key={day}
                className={`py-3 text-center text-xs font-bold tracking-wider uppercase ${
                  idx >= 5 ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-zinc-400"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-zinc-800/80">
            {monthCalendarGrid.map((cell, cellIdx) => {
              const events = getTransactionsOnDate(cell.dateStr);
              const maxDisplay = 3;
              const displayedEvents = events.slice(0, maxDisplay);
              const extraCount = events.length - maxDisplay;

              return (
                <div
                  key={cellIdx}
                  onClick={() => setSelectedDate(cell.dateStr)}
                  className={`min-h-[110px] sm:min-h-[130px] p-1.5 sm:p-2 flex flex-col justify-between transition group relative ${
                    cell.isCurrentMonth
                      ? "bg-white dark:bg-zinc-900"
                      : "bg-slate-50/40 dark:bg-zinc-950/40 text-slate-400 dark:text-zinc-600"
                  } ${
                    cell.dateStr === selectedDate
                      ? "ring-2 ring-indigo-500/50 inset-ring-2"
                      : "hover:bg-slate-50/80 dark:hover:bg-zinc-800/30"
                  }`}
                >
                  {/* Date Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`inline-flex items-center justify-center text-xs font-bold rounded-full w-6 h-6 transition ${
                        cell.isToday
                          ? "bg-emerald-600 text-white shadow-xs font-black scale-105"
                          : cell.isCurrentMonth
                          ? "text-slate-800 dark:text-zinc-200 group-hover:text-indigo-600"
                          : "text-slate-400 dark:text-zinc-600"
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Quick + button on hover */}
                    <Link
                      href={`/transaksi`}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 transition text-[10px]"
                      title={`Buat transaksi baru untuk ${cell.dateStr}`}
                    >
                      <Plus className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* Events Bars */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {displayedEvents.map((tx) => {
                      const style = getStatusStyle(tx.status);
                      const s = tx.tanggal_sewa?.slice(0, 10);
                      const rawE = tx.tanggal_kembali?.slice(0, 10);
                      const e = rawE && rawE >= s ? rawE : s;

                      const isStart = s === cell.dateStr;
                      const isEnd = e === cell.dateStr;

                      let indicator = "··";
                      if (isStart) indicator = "►";
                      else if (isEnd) indicator = "⮌";

                      return (
                        <button
                          key={tx.id || tx.kode_transaksi}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTx(tx);
                          }}
                          className={`w-full text-left px-1.5 py-0.5 rounded-lg text-[10.5px] font-semibold border flex items-center gap-1 truncate shadow-2xs transition active:scale-95 cursor-pointer ${style.pill}`}
                          title={`${tx.nama_customer} (${tx.status}) - ${tx.kode_transaksi}`}
                        >
                          <span className="font-mono text-[9px] opacity-75 shrink-0">{indicator}</span>
                          <span className="truncate">{tx.nama_customer}</span>
                        </button>
                      );
                    })}

                    {extraCount > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDayEventsModalDate(cell.dateStr);
                        }}
                        className="w-full text-left px-1.5 py-0.5 rounded-md text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 hover:underline"
                      >
                        +{extraCount} lainnya
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ================= MINGGU (WEEK VIEW) ================= */
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-zinc-800">
            {weekCalendarDays.map((wDay) => {
              const dayEvents = getTransactionsOnDate(wDay.dateStr);

              return (
                <div
                  key={wDay.dateStr}
                  className={`min-h-[360px] p-3 flex flex-col ${
                    wDay.isToday ? "bg-indigo-50/20 dark:bg-indigo-950/10" : ""
                  }`}
                >
                  {/* Day Header */}
                  <div className="pb-2.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {wDay.dayName}
                      </span>
                      <span
                        className={`inline-flex items-center justify-center font-bold text-sm rounded-full ${
                          wDay.isToday
                            ? "w-6 h-6 bg-emerald-600 text-white shadow-xs"
                            : "text-slate-900 dark:text-zinc-100"
                        }`}
                      >
                        {wDay.dayNumber}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                      {dayEvents.length}
                    </span>
                  </div>

                  {/* Day Event Cards */}
                  <div className="space-y-2 mt-3 flex-1 overflow-y-auto max-h-[500px]">
                    {dayEvents.length > 0 ? (
                      dayEvents.map((tx) => {
                        const style = getStatusStyle(tx.status);
                        const s = tx.tanggal_sewa?.slice(0, 10);
                        const rawE = tx.tanggal_kembali?.slice(0, 10);
                        const e = rawE && rawE >= s ? rawE : s;

                        const isStart = s === wDay.dateStr;
                        const isEnd = e === wDay.dateStr;

                        return (
                          <div
                            key={tx.id || tx.kode_transaksi}
                            onClick={() => setSelectedTx(tx)}
                            className="p-2.5 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-600 shadow-2xs space-y-1.5 transition cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs text-slate-900 dark:text-zinc-100 truncate">
                                {tx.nama_customer}
                              </span>
                              <span
                                className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${style.badge}`}
                              >
                                {tx.status}
                              </span>
                            </div>

                            <div className="text-[10.5px] text-slate-500 dark:text-zinc-400 space-y-0.5 font-sans">
                              {isStart && (
                                <span className="inline-block font-bold text-emerald-600 dark:text-emerald-400 text-[10px]">
                                  ► Mulai Sewa
                                </span>
                              )}
                              {isEnd && (
                                <span className="inline-block font-bold text-rose-600 dark:text-rose-400 text-[10px]">
                                  ⮌ Wajib Kembali
                                </span>
                              )}
                              {!isStart && !isEnd && (
                                <span className="text-[10px] text-slate-400">·· Berjalan</span>
                              )}

                              <p className="truncate text-slate-700 dark:text-zinc-300 font-medium">
                                {tx.items?.map((i) => i.namaJas).join(", ") || "1 Jas"}
                              </p>
                              <p className="font-mono text-[10px] text-slate-400">
                                {formatRupiah(tx.total_bayar)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-[11px] text-slate-400 dark:text-zinc-600">
                        Tidak ada sewa
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= MODAL: DETAIL BOOKING / TRANSAKSI ================= */}
      {selectedTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <ReceiptText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-zinc-100 text-sm">
                    Detail Sewa & Booking
                  </h2>
                  <span className="font-mono text-[11px] text-slate-400 dark:text-zinc-500">
                    {selectedTx.kode_transaksi}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
              {/* Customer Info */}
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Pelanggan
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusStyle(selectedTx.status).badge}`}
                  >
                    {selectedTx.status}
                  </span>
                </div>

                <p className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                  {selectedTx.nama_customer}
                </p>

                {selectedTx.whatsapp && (
                  <a
                    href={`https://wa.me/${selectedTx.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    +{selectedTx.whatsapp}
                  </a>
                )}
              </div>

              {/* Periode Sewa & Durasi */}
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 space-y-1.5 text-slate-700 dark:text-zinc-300">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Periode Persewaan
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mulai Sewa:</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100">
                    {formatDateIndo(selectedTx.tanggal_sewa)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Wajib Kembali:</span>
                  <span className="font-bold text-slate-900 dark:text-zinc-100">
                    {formatDateIndo(selectedTx.tanggal_kembali)}
                  </span>
                </div>
                <div className="flex justify-between text-indigo-600 dark:text-indigo-400 font-bold pt-1 border-t border-slate-200/60 dark:border-zinc-800">
                  <span>Durasi Sewa:</span>
                  <span>{calculateRentalDays(selectedTx.tanggal_sewa, selectedTx.tanggal_kembali)} Hari</span>
                </div>
              </div>

              {/* Daftar Item Jas */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Jas & Aksesoris yang Disewa
                </span>
                <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800">
                  {selectedTx.items?.map((item, idx) => {
                    const days = item.durasi_hari || calculateRentalDays(selectedTx.tanggal_sewa, selectedTx.tanggal_kembali);
                    const daily = item.harga_per_hari || (days ? Math.round(item.harga / days) : item.harga);

                    return (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-zinc-100">{item.namaJas}</p>
                          <p className="text-[10px] text-slate-500">
                            {item.warna || "-"} • Ukuran {item.ukuran || "-"} ({item.jumlah}x @ {formatRupiah(daily)}/hr)
                          </p>
                        </div>
                        <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">
                          {formatRupiah(item.harga * item.jumlah)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tagihan & Pembayaran */}
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 space-y-1 text-slate-700 dark:text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Tagihan:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">
                    {formatRupiah(selectedTx.total_bayar)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status Bayar:</span>
                  <span className="font-bold text-slate-900 dark:text-zinc-100">
                    {selectedTx.status_pembayaran}
                  </span>
                </div>
                {selectedTx.sisa_pembayaran > 0 && (
                  <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold pt-1 border-t border-slate-200 dark:border-zinc-800">
                    <span>Sisa Tagihan:</span>
                    <span>{formatRupiah(selectedTx.sisa_pembayaran)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 flex items-center justify-between gap-2 shrink-0">
              <Link
                href={`/transaksi?search=${selectedTx.kode_transaksi}`}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
              >
                <span>Buka di Halaman Transaksi</span>
                <ExternalLink className="w-3 h-3" />
              </Link>

              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ALL EVENTS ON A SINGLE DAY (+X LAINNYA) ================= */}
      {dayEventsModalDate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-sm">
                  Daftar Persewaan
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {formatDateIndo(dayEventsModalDate)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDayEventsModalDate(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2 overflow-y-auto flex-1 text-xs">
              {getTransactionsOnDate(dayEventsModalDate).map((tx) => {
                const style = getStatusStyle(tx.status);
                const s = tx.tanggal_sewa?.slice(0, 10);
                const rawE = tx.tanggal_kembali?.slice(0, 10);
                const e = rawE && rawE >= s ? rawE : s;

                const isStart = s === dayEventsModalDate;
                const isEnd = e === dayEventsModalDate;

                return (
                  <div
                    key={tx.id || tx.kode_transaksi}
                    onClick={() => {
                      setDayEventsModalDate(null);
                      setSelectedTx(tx);
                    }}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 hover:border-slate-400 transition cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-zinc-100">
                          {tx.nama_customer}
                        </span>
                        <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md border ${style.badge}`}>
                          {tx.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isStart && "► Mulai sewa"}
                        {isEnd && "⮌ Wajib kembali"}
                        {!isStart && !isEnd && "·· Berjalan"} • {tx.items?.map((i) => i.namaJas).join(", ")}
                      </p>
                    </div>

                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-zinc-100">
                      {formatRupiah(tx.total_bayar)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
