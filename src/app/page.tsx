import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import Link from "next/link";
import {
  Layers,
  ShoppingBag,
  TrendingUp,
  Users,
  AlertCircle,
  Clock,
  Plus,
  ArrowUpRight,
  Sparkles,
  Calendar,
} from "lucide-react";
import type { Inventori, Transaksi, Customer, Pengeluaran } from "@/types/database";
import { NotificationManager } from "@/components/NotificationManager";
import { MonthlyRevenueFilter } from "@/components/MonthlyRevenueFilter";
import { CategoryStockCards } from "@/components/CategoryStockCards";

export const revalidate = 15; // Enable Stale-While-Revalidate Caching for instant navigation

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch metrics in parallel
  const [
    { data: inventori = [] },
    { data: transaksi = [] },
    { data: customer = [] },
    { data: pengeluaran = [] },
  ] = await Promise.all([
    supabase.from("inventori").select("*"),
    supabase.from("transaksi").select("*"),
    supabase.from("customer").select("*"),
    supabase.from("pengeluaran").select("*"),
  ]);

  const items = (inventori as Inventori[]) || [];
  const txList = (transaksi as Transaksi[]) || [];
  const custList = (customer as Customer[]) || [];
  const expList = (pengeluaran as Pengeluaran[]) || [];

  // Metrics
  const totalStokTersedia = items.reduce((acc, i) => acc + (Number(i.stok_tersedia) || 0), 0);
  const totalStokDisewa = items.reduce((acc, i) => acc + (Number(i.stok_disewa) || 0), 0);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().slice(0, 10);

  const monthTx = txList.filter(
    (t) => String(t.tanggal_sewa || "").startsWith(currentMonth) && t.status !== "Dibatalkan"
  );

  const pendapatanBulanIni = monthTx.reduce(
    (acc, t) =>
      acc +
      (Number(t.subtotal || t.total_bayar || 0) - Number(t.potongan || 0)) +
      Number(t.denda || 0),
    0
  );

  // Reminders
  const dueToday = txList.filter(
    (t) => t.tanggal_kembali === today && ["Sedang Disewa", "Booking"].includes(t.status)
  );

  const overdue = txList.filter(
    (t) => t.tanggal_kembali < today && ["Sedang Disewa", "Terlambat"].includes(t.status)
  );

  // Top Items
  const itemCounts: Record<string, number> = {};
  txList.forEach((t) => {
    if (t.status !== "Dibatalkan" && Array.isArray(t.items)) {
      t.items.forEach((item) => {
        const name = item.namaJas || "Item";
        itemCounts[name] = (itemCounts[name] || 0) + (Number(item.jumlah) || 1);
      });
    }
  });

  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
            Dashboard
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800/50">
              Live
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Ringkasan operasional rental jas, stok barang, dan pengembalian
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/kalender"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 font-semibold text-sm transition shadow-2xs"
          >
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>Kalender Sewa</span>
          </Link>
          <Link
            href="/transaksi"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold text-sm transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Transaksi Baru</span>
          </Link>
        </div>
      </div>

      {/* 1. Monthly Revenue & Filter */}
      <MonthlyRevenueFilter transactions={txList} expenses={expList} />

      {/* 2. Category Stock Availability Cards */}
      <CategoryStockCards inventory={items} />

      {/* 3. Push Notification Manager & 12:00 PM System Alert */}
      <NotificationManager />

      {/* Notifications & Reminders */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Pengembalian Hari Ini */}
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <h2 className="font-semibold text-sm text-slate-900 dark:text-zinc-200">
                Pengembalian Hari Ini ({dueToday.length})
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-zinc-400">{formatDateIndo(today)}</span>
          </div>

          <div className="space-y-2.5">
            {dueToday.length > 0 ? (
              dueToday.map((t) => (
                <div
                  key={t.kode_transaksi}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800/60"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">{t.nama_customer}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      {t.items?.map((i) => i.namaJas).join(", ")}
                    </p>
                  </div>
                  <Link
                    href={`/transaksi?search=${t.kode_transaksi}`}
                    className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-zinc-100"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 dark:text-zinc-500 py-6 text-center">
                Tidak ada jadwal pengembalian hari ini.
              </p>
            )}
          </div>
        </div>

        {/* Keterlambatan */}
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              <h2 className="font-semibold text-sm text-slate-900 dark:text-zinc-200">
                Keterlambatan ({overdue.length})
              </h2>
            </div>
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400/80">Perlu Follow-up</span>
          </div>

          <div className="space-y-2.5">
            {overdue.length > 0 ? (
              overdue.map((t) => (
                <div
                  key={t.kode_transaksi}
                  className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30"
                >
                  <div>
                    <p className="text-sm font-medium text-red-900 dark:text-red-200">{t.nama_customer}</p>
                    <p className="text-xs text-red-600/80 dark:text-zinc-400">
                      Harusnya kembali: {formatDateIndo(t.tanggal_kembali)}
                    </p>
                  </div>
                  <Link
                    href={`/transaksi?search=${t.kode_transaksi}`}
                    className="p-2 text-red-600 hover:text-red-900 dark:text-red-300 dark:hover:text-red-100"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 dark:text-zinc-500 py-6 text-center">
                Semua jas dikembalikan tepat waktu.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Top Jas Terlaris */}
      <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 dark:text-yellow-400" />
            <h2 className="font-semibold text-sm text-slate-900 dark:text-zinc-200">Jas Paling Sering Disewa</h2>
          </div>
          <Link href="/laporan" className="text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200">
            Lihat Laporan Lengkap →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {topItems.length > 0 ? (
            topItems.map(([nama, count], idx) => (
              <div
                key={nama}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800/60 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:text-zinc-300">
                    #{idx + 1}
                  </span>
                  <p className="text-sm font-medium text-slate-800 dark:text-zinc-200 mt-2 line-clamp-2">{nama}</p>
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mt-3">
                  {count}x transaksi
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 dark:text-zinc-500 py-4 col-span-full text-center">
              Belum ada data transaksi.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
