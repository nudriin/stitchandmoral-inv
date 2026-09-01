"use client";

import { useState, useMemo } from "react";
import { formatRupiah } from "@/lib/utils";
import { TrendingUp, Calendar, DollarSign, ArrowUpRight, ArrowDownRight, Tag, AlertCircle } from "lucide-react";
import type { Transaksi, Pengeluaran } from "@/types/database";

interface Props {
  transactions: Transaksi[];
  expenses?: Pengeluaran[];
}

export function MonthlyRevenueFilter({ transactions, expenses = [] }: Props) {
  const currentMonthKey = new Date().toISOString().slice(0, 7);

  // Extract all unique months from transactions and expenses
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    monthsSet.add(currentMonthKey);

    transactions.forEach((t) => {
      if (t.tanggal_sewa) {
        monthsSet.add(String(t.tanggal_sewa).slice(0, 7));
      }
    });

    expenses.forEach((e) => {
      if (e.tanggal) {
        monthsSet.add(String(e.tanggal).slice(0, 7));
      }
    });

    return Array.from(monthsSet).sort().reverse();
  }, [transactions, expenses, currentMonthKey]);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);

  function formatMonthName(mKey: string) {
    if (mKey === "ALL") return "Semua Periode (Keseluruhan)";
    const [year, month] = mKey.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(date);
  }

  // Filter transactions based on selected month
  const filteredData = useMemo(() => {
    const validTx = transactions.filter((t) => t.status !== "Dibatalkan");

    const monthTx =
      selectedMonth === "ALL"
        ? validTx
        : validTx.filter((t) => String(t.tanggal_sewa || "").startsWith(selectedMonth));

    const monthExp =
      selectedMonth === "ALL"
        ? expenses
        : expenses.filter((e) => String(e.tanggal || "").startsWith(selectedMonth));

    const totalSubtotal = monthTx.reduce((sum, t) => sum + Number(t.subtotal || 0), 0);
    const totalPotongan = monthTx.reduce((sum, t) => sum + Number(t.potongan || 0), 0);
    const totalDenda = monthTx.reduce((sum, t) => sum + Number(t.denda || 0), 0);
    const totalDeposit = monthTx.reduce((sum, t) => sum + Number(t.deposit || 0), 0);

    const omsetKotor = totalSubtotal + totalDenda;
    const pendapatanBersih = Math.max(0, totalSubtotal - totalPotongan) + totalDenda;
    const totalBiayaOperasional = monthExp.reduce((sum, e) => sum + Number(e.jumlah || 0), 0);
    const labaBersih = pendapatanBersih - totalBiayaOperasional;

    const totalTransaksi = monthTx.length;
    const avgOrderValue = totalTransaksi > 0 ? Math.round(pendapatanBersih / totalTransaksi) : 0;

    // Previous month comparison (if not ALL)
    let growthRate = 0;
    if (selectedMonth !== "ALL") {
      const [year, month] = selectedMonth.split("-").map(Number);
      const prevDate = new Date(year, month - 2, 1);
      const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

      const prevTx = validTx.filter((t) => String(t.tanggal_sewa || "").startsWith(prevMonthKey));
      const prevRevenue = prevTx.reduce(
        (sum, t) => sum + (Number(t.subtotal || t.total_bayar || 0) - Number(t.potongan || 0)) + Number(t.denda || 0),
        0
      );

      if (prevRevenue > 0) {
        growthRate = Math.round(((pendapatanBersih - prevRevenue) / prevRevenue) * 100);
      }
    }

    return {
      monthTx,
      totalSubtotal,
      totalPotongan,
      totalDenda,
      totalDeposit,
      omsetKotor,
      pendapatanBersih,
      totalBiayaOperasional,
      labaBersih,
      totalTransaksi,
      avgOrderValue,
      growthRate,
    };
  }, [transactions, expenses, selectedMonth]);

  return (
    <div className="bg-white dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Analisis Pendapatan &amp; Filter Bulanan
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Pilih periode bulan untuk melihat rincian omset, diskon, denda, dan laba operasional
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs font-bold py-2 px-3.5 pr-8 rounded-xl shadow-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Periode (Akumulasi)</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthName(m)} {m === currentMonthKey ? "(Bulan Ini)" : ""}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Pendapatan Bersih Sewa */}
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              Pendapatan Bersih Sewa
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 truncate">
              {formatRupiah(filteredData.pendapatanBersih)}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-zinc-400 font-medium">
              {filteredData.totalTransaksi} Transaksi
            </span>
            {selectedMonth !== "ALL" && filteredData.growthRate !== 0 && (
              <span
                className={`font-bold flex items-center gap-0.5 ${
                  filteredData.growthRate > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {filteredData.growthRate > 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {Math.abs(filteredData.growthRate)}%
              </span>
            )}
          </div>
        </div>

        {/* Potongan Diskon Diberikan */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              Total Diskon Diberikan
            </span>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1 truncate">
              {formatRupiah(filteredData.totalPotongan)}
            </div>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-zinc-500 mt-2 block">
            Subtotal: {formatRupiah(filteredData.totalSubtotal)}
          </span>
        </div>

        {/* Denda Keterlambatan */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              Denda Keterlambatan
            </span>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1 truncate">
              +{formatRupiah(filteredData.totalDenda)}
            </div>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-zinc-500 mt-2 block">
            Pemasukan dari denda
          </span>
        </div>

        {/* Biaya Operasional / Pengeluaran */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              Biaya Operasional
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-zinc-100 mt-1 truncate">
              {formatRupiah(filteredData.totalBiayaOperasional)}
            </div>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-zinc-500 mt-2 block">
            Laundry &amp; operasional
          </span>
        </div>

        {/* Rata-Rata Order (AOV) */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              Rata-rata Sewa (AOV)
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-zinc-100 mt-1 truncate">
              {formatRupiah(filteredData.avgOrderValue)}
            </div>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-zinc-500 mt-2 block">
            Per transaksi {formatMonthName(selectedMonth)}
          </span>
        </div>
      </div>
    </div>
  );
}
