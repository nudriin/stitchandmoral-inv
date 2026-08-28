import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Layers,
  Users,
  UserPlus,
  Wallet,
  Shirt,
  Calendar,
  Percent,
  Crown,
  DollarSign,
} from "lucide-react";
import type { Transaksi, ModalItem, Inventori, Pengeluaran, Customer } from "@/types/database";
import { PrintReportButton } from "./PrintReportButton";

export const revalidate = 0;

export default async function LaporanPage() {
  const supabase = await createClient();

  const [
    { data: transaksi = [] },
    { data: modal = [] },
    { data: inventori = [] },
    { data: pengeluaran = [] },
    { data: customer = [] },
  ] = await Promise.all([
    supabase.from("transaksi").select("*").order("tanggal_sewa", { ascending: false }),
    supabase.from("modal").select("*"),
    supabase.from("inventori").select("*"),
    supabase.from("pengeluaran").select("*"),
    supabase.from("customer").select("*"),
  ]);

  const txList = (transaksi as Transaksi[]) || [];
  const modalList = (modal as ModalItem[]) || [];
  const invList = (inventori as Inventori[]) || [];
  const expList = (pengeluaran as Pengeluaran[]) || [];
  const custList = (customer as Customer[]) || [];

  const validTx = txList.filter((t) => t.status !== "Dibatalkan");

  // 1. FINANCIAL & BEP
  const totalModal = modalList.reduce((sum, m) => sum + Number(m.total_harga || 0), 0);
  const totalPendapatan = validTx.reduce(
    (sum, t) =>
      sum +
      (Number(t.subtotal || t.total_bayar || 0) - Number(t.potongan || 0)) +
      Number(t.denda || 0),
    0
  );
  const totalPengeluaran = expList.reduce((sum, e) => sum + Number(e.jumlah || 0), 0);
  const labaBersih = totalPendapatan - totalPengeluaran;
  const sisaBep = totalModal - totalPendapatan;
  const bepPercent = totalModal > 0 ? Math.min(100, Math.round((totalPendapatan / totalModal) * 100)) : 100;
  const isBepReached = sisaBep <= 0;
  const avgOrderValue = validTx.length > 0 ? Math.round(totalPendapatan / validTx.length) : 0;

  // 2. PRODUCT & SIZE ANALYTICS
  const itemCounts: Record<string, number> = {};
  const suitColorCounts: Record<string, number> = {};
  const tieColorCounts: Record<string, number> = {};
  const suitSizeCounts: Record<string, number> = {};
  const pantsSizeCounts: Record<string, number> = {};
  let totalItemsRented = 0;

  validTx.forEach((t) => {
    if (Array.isArray(t.items)) {
      t.items.forEach((item) => {
        const qty = Number(item.jumlah) || 1;
        totalItemsRented += qty;

        const itemName = String(item.namaJas || "Item").trim();
        const rawCat = String(item.jenisJas || "").toLowerCase();
        const cat =
          rawCat ||
          (itemName.toLowerCase().includes("jas")
            ? "jas"
            : itemName.toLowerCase().includes("celana")
            ? "celana"
            : itemName.toLowerCase().includes("dasi")
            ? "dasi"
            : "lainnya");

        // Best Items overall
        itemCounts[itemName] = (itemCounts[itemName] || 0) + qty;

        // Suit Color vs Tie Color
        const color = String(item.warna || "").trim();
        if (color && color !== "-") {
          if (
            cat.includes("jas") ||
            itemName.toLowerCase().includes("kingsman") ||
            itemName.toLowerCase().includes("ygt") ||
            itemName.toLowerCase().includes("laurent")
          ) {
            suitColorCounts[color] = (suitColorCounts[color] || 0) + qty;
          } else if (cat.includes("dasi") || itemName.toLowerCase().includes("dasi")) {
            tieColorCounts[itemName] = (tieColorCounts[itemName] || 0) + qty;
          }
        }

        // Split Suit Sizes vs Pants Sizes
        const size = String(item.ukuran || "").trim();
        if (size && !["Standart", "Standard", "-", ""].includes(size)) {
          const isPants =
            cat.includes("celana") ||
            /^\d/.test(size) ||
            size.includes("32") ||
            size.includes("34") ||
            size.includes("28") ||
            size.includes("30");

          if (isPants) {
            pantsSizeCounts[size] = (pantsSizeCounts[size] || 0) + qty;
          } else {
            suitSizeCounts[size] = (suitSizeCounts[size] || 0) + qty;
          }
        }
      });
    }
  });

  const topItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const topSuitColors = Object.entries(suitColorCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topTieColors = Object.entries(tieColorCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topSuitSizes = Object.entries(suitSizeCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topPantsSizes = Object.entries(pantsSizeCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Max values for responsive bars
  const maxItemCount = Math.max(...topItems.map(([, v]) => v), 1);
  const maxSuitColor = Math.max(...topSuitColors.map(([, v]) => v), 1);
  const maxTieColor = Math.max(...topTieColors.map(([, v]) => v), 1);
  const maxSuitSize = Math.max(...topSuitSizes.map(([, v]) => v), 1);
  const maxPantsSize = Math.max(...topPantsSizes.map(([, v]) => v), 1);

  // 3. MONTHLY TRENDS
  const monthlyRevenue: Record<string, number> = {};
  const monthlyExpenses: Record<string, number> = {};

  validTx.forEach((t) => {
    if (t.tanggal_sewa) {
      const m = String(t.tanggal_sewa).slice(0, 7);
      const val = (Number(t.subtotal || t.total_bayar || 0) - Number(t.potongan || 0)) + Number(t.denda || 0);
      monthlyRevenue[m] = (monthlyRevenue[m] || 0) + val;
    }
  });

  expList.forEach((e) => {
    if (e.tanggal) {
      const m = String(e.tanggal).slice(0, 7);
      monthlyExpenses[m] = (monthlyExpenses[m] || 0) + Number(e.jumlah || 0);
    }
  });

  const allMonths = Array.from(new Set([...Object.keys(monthlyRevenue), ...Object.keys(monthlyExpenses)])).sort();
  const maxMonthRev = Math.max(...allMonths.map((m) => monthlyRevenue[m] || 0), 1);

  // 4. CUSTOMER RANKING (TOP SPENDERS & REPEAT CUSTOMERS) & NEW CUSTOMERS THIS MONTH
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const currentMonthName = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date());

  const customerFirstTxDate: Record<string, string> = {};
  validTx.forEach((t) => {
    const key = t.customer_id || t.nama_customer;
    if (!customerFirstTxDate[key] || (t.tanggal_sewa && t.tanggal_sewa < customerFirstTxDate[key])) {
      customerFirstTxDate[key] = t.tanggal_sewa;
    }
  });

  const customerTxCount: Record<string, { id?: string; nama: string; count: number; totalSpent: number; whatsapp: string; createdAt?: string }> = {};
  validTx.forEach((t) => {
    const key = t.customer_id || t.nama_customer;
    if (!customerTxCount[key]) {
      customerTxCount[key] = { id: t.customer_id || undefined, nama: t.nama_customer, count: 0, totalSpent: 0, whatsapp: t.whatsapp || "" };
    }
    customerTxCount[key].count += 1;
    customerTxCount[key].totalSpent +=
      (Number(t.subtotal || t.total_bayar || 0) - Number(t.potongan || 0)) + Number(t.denda || 0);
  });

  // Calculate new customers this month (by created_at or first rental date in current month)
  const newCustomersThisMonth = custList.filter((c) => {
    const createdMonth = c.created_at ? String(c.created_at).slice(0, 7) : "";
    const firstTxMonth = customerFirstTxDate[c.customer_id] ? customerFirstTxDate[c.customer_id].slice(0, 7) : "";
    return createdMonth === currentMonthKey || firstTxMonth === currentMonthKey;
  });
  const totalNewCustomersThisMonth = newCustomersThisMonth.length;

  const allCustomerStats = Object.values(customerTxCount);
  const topSpenders = [...allCustomerStats].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 8);
  const topRepeatRenters = [...allCustomerStats].sort((a, b) => b.count - a.count).slice(0, 8);
  const repeatCustomersCount = allCustomerStats.filter((c) => c.count > 1).length;
  const repeatRate = custList.length > 0 ? Math.round((repeatCustomersCount / custList.length) * 100) : 0;
  const maxSpenderVal = Math.max(...topSpenders.map((c) => c.totalSpent), 1);

  // 5. INVENTORY HEALTH
  const totalStokFisik = invList.reduce((acc, i) => acc + (Number(i.jumlah_stok) || 0), 0);
  const totalStokDisewa = invList.reduce((acc, i) => acc + (Number(i.stok_disewa) || 0), 0);
  const utilitasRate = totalStokFisik > 0 ? Math.round((totalStokDisewa / totalStokFisik) * 100) : 0;
  const lowStock = invList.filter((i) => Number(i.stok_tersedia) <= 0);
  const needLaundry = invList.filter((i) => i.status_laundry === "Perlu Laundry" || i.kondisi === "Perlu Laundry");

  return (
    <div className="space-y-8" id="reportPrintArea">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Laporan & Analitik Bisnis Komprehensif
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Analisis preferensi ukuran jas, ukuran celana, ranking spend customer, customer baru, dan performa finansial
          </p>
        </div>

        <PrintReportButton />
      </div>

      {/* 1. FINANCIAL & CUSTOMER OVERVIEW METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
            Total Omset Sewa
          </span>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 truncate">
            {formatRupiah(totalPendapatan)}
          </div>
          <span className="text-xs text-slate-400 dark:text-zinc-500 mt-1 block">
            {validTx.length} transaksi ({totalItemsRented} item)
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
            Biaya Operasional
          </span>
          <div className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 truncate">
            {formatRupiah(totalPengeluaran)}
          </div>
          <span className="text-xs text-slate-400 dark:text-zinc-500 mt-1 block">
            {expList.length} pengeluaran laundry/promo
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
            Laba Bersih
          </span>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-1 truncate">
            {formatRupiah(labaBersih)}
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 block font-medium">
            Margin: {totalPendapatan > 0 ? Math.round((labaBersih / totalPendapatan) * 100) : 0}%
          </span>
        </div>

        {/* METRIK BARU: TOTAL CUSTOMER BARU BULAN INI */}
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-sm bg-gradient-to-br from-indigo-50/40 to-transparent dark:from-indigo-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
              Customer Baru Bulan Ini
            </span>
            <UserPlus className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 truncate">
            {totalNewCustomersThisMonth} Orang
          </div>
          <span className="text-xs text-slate-400 dark:text-zinc-500 mt-1 block truncate">
            Bulan {currentMonthName} ({custList.length} total)
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
            Rata-rata Sewa (AOV)
          </span>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-1 truncate">
            {formatRupiah(avgOrderValue)}
          </div>
          <span className="text-xs text-slate-400 dark:text-zinc-500 mt-1 block">
            Per transaksi customer
          </span>
        </div>
      </div>

      {/* 2. BEP PROGRESS CARD */}
      <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Percent className="w-5 h-5 text-amber-500" />
              Progres Balik Modal Investasi (BEP)
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Total Investasi Modal Awal (CAPEX): <b>{formatRupiah(totalModal)}</b> ({modalList.length} aset jas & perlengkapan)
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className={`text-lg sm:text-xl font-bold ${isBepReached ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
              {isBepReached ? "SUDAH BEP! 🎉" : `Sisa ${formatRupiah(sisaBep)}`}
            </span>
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              Tercapai {bepPercent}% dari Modal
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-4 bg-slate-100 dark:bg-zinc-950 rounded-full overflow-hidden border border-slate-200 dark:border-zinc-800 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isBepReached ? "bg-emerald-500" : "bg-gradient-to-r from-amber-500 to-emerald-500"
            }`}
            style={{ width: `${bepPercent}%` }}
          />
        </div>
      </div>

      {/* 3. BUSINESS DEEP DIVE: UKURAN JAS vs UKURAN CELANA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* A. UKURAN JAS PALING LARIS */}
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Shirt className="w-4 h-4 text-indigo-500" />
                Ukuran Jas Paling Laris
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                Fitting Jas S, M, L, XL
              </span>
            </div>

            <div className="space-y-3">
              {topSuitSizes.length > 0 ? (
                topSuitSizes.map(([size, count], idx) => {
                  const pct = Math.round((count / maxSuitSize) * 100);
                  return (
                    <div key={size} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-800 dark:text-zinc-200">
                          <b>#{idx + 1} Ukuran {size}</b>
                        </span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                          {count} pcs disewa
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-zinc-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 dark:text-zinc-500 py-4 text-center">Belum ada data ukuran jas.</p>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/60 italic">
            💡 Ukuran M dan L merupakan ukuran jas yang paling dominan dibutuhkan pelanggan.
          </p>
        </div>

        {/* B. UKURAN CELANA PALING LARIS */}
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                Ukuran Celana Paling Laris
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                Fitting Celana (Waist Size)
              </span>
            </div>

            <div className="space-y-3">
              {topPantsSizes.length > 0 ? (
                topPantsSizes.map(([size, count], idx) => {
                  const pct = Math.round((count / maxPantsSize) * 100);
                  return (
                    <div key={size} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-800 dark:text-zinc-200">
                          <b>#{idx + 1} Ukuran {size}</b>
                        </span>
                        <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                          {count} pcs disewa
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-zinc-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 dark:text-zinc-500 py-4 text-center">Belum ada data ukuran celana.</p>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/60 italic">
            💡 Ukuran celana fleksibel (32-34) sangat praktis dan paling sering disewa bersama jas.
          </p>
        </div>
      </div>

      {/* 4. WARNA JAS & WARNA DASI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* WARNA JAS TERPOPULER */}
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Warna Jas Terpopuler
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                Pilihan Pelanggan
              </span>
            </div>

            <div className="space-y-3">
              {topSuitColors.length > 0 ? (
                topSuitColors.map(([color, count], idx) => {
                  const pct = Math.round((count / maxSuitColor) * 100);
                  return (
                    <div key={color} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-800 dark:text-zinc-200">
                          <b>#{idx + 1} Warna {color}</b>
                        </span>
                        <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
                          {count}x sewa
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-zinc-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 dark:text-zinc-500 py-4 text-center">Belum ada data warna jas.</p>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/60 italic">
            💡 Warna Hitam & Navy mendominasi kebutuhan acara formal & wisuda.
          </p>
        </div>

        {/* WARNA & MODEL DASI PALING SERING DISEWA */}
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                Dasi Paling Sering Disewa
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                Aksesoris Pelengkap
              </span>
            </div>

            <div className="space-y-3">
              {topTieColors.length > 0 ? (
                topTieColors.map(([tie, count], idx) => {
                  const pct = Math.round((count / maxTieColor) * 100);
                  return (
                    <div key={tie} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-800 dark:text-zinc-200 truncate max-w-[200px]" title={tie}>
                          <b>#{idx + 1} {tie}</b>
                        </span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                          {count}x sewa
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-zinc-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 dark:text-zinc-500 py-4 text-center">Belum ada data sewa dasi.</p>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/60 italic">
            💡 Dasi Salur & Netral menjadi paket favorit bersama jas utama.
          </p>
        </div>
      </div>

      {/* 5. CUSTOMER RANKING: TOP SPENDERS, REPEAT RENTERS, & CUSTOMER BARU BULAN INI */}
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* CARD: CUSTOMER RANKING SPEND (SPEND TERBANYAK) */}
          <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  Ranking Customer Paling Banyak Belanja (Top Spenders)
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                  VIP Customers
                </span>
              </div>

              <div className="space-y-2.5">
                {topSpenders.map((cust, idx) => {
                  const isTop1 = idx === 0;
                  const isTop3 = idx < 3;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs transition ${
                        isTop1
                          ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-300/80 dark:border-amber-700/60"
                          : "bg-slate-50 dark:bg-zinc-950/60 border-slate-200 dark:border-zinc-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                            isTop1
                              ? "bg-amber-500 text-white shadow-sm"
                              : isTop3
                              ? "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300"
                              : "bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                            {cust.nama}
                            {isTop1 && <Crown className="w-3.5 h-3.5 text-amber-500 inline" />}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                            {cust.count}x Transaksi Sewa
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 font-mono block">
                          {formatRupiah(cust.totalSpent)}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                          Avg: {formatRupiah(Math.round(cust.totalSpent / cust.count))}/sewa
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/60 italic">
              💡 Berikan diskon khusus atau reward loyalitas bagi Top Spender agar terus repeat order.
            </p>
          </div>

          {/* CUSTOMER FREKUENSI TERBANYAK (REPEAT RENTERS) */}
          <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  Customer Paling Sering Sewa (Frekuensi Transaksi)
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                  Repeat Rate: {repeatRate}%
                </span>
              </div>

              <div className="space-y-2.5">
                {topRepeatRenters.map((cust, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800/60 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 flex items-center justify-center font-bold text-[11px]">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-zinc-100">{cust.nama}</p>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                          Total belanja: {formatRupiah(cust.totalSpent)}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-mono text-xs">
                      {cust.count}x Sewa
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/60 italic">
              💡 {repeatCustomersCount} dari {custList.length} pelanggan telah kembali menyewa lebih dari 1 kali.
            </p>
          </div>
        </div>

        {/* DAFTAR CUSTOMER BARU BULAN INI */}
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-indigo-500" />
              Customer Baru Bulan Ini ({currentMonthName})
            </h3>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-mono">
              {totalNewCustomersThisMonth} Customer Baru
            </span>
          </div>

          {newCustomersThisMonth.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {newCustomersThisMonth.map((cust) => {
                const txInfo = customerTxCount[cust.customer_id] || customerTxCount[cust.nama];
                const dateStr = cust.created_at ? formatDateIndo(cust.created_at.slice(0, 10)) : "Bulan ini";
                return (
                  <div
                    key={cust.id || cust.customer_id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800/60 text-xs flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-zinc-100">{cust.nama}</p>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                          {cust.whatsapp || "-"}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                        Baru
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-zinc-800/60 text-[11px]">
                      <span className="text-slate-400 dark:text-zinc-500">
                        {dateStr}
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-zinc-300 font-mono">
                        {txInfo ? `${txInfo.count}x sewa (${formatRupiah(txInfo.totalSpent)})` : "Belum sewa"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-zinc-500 py-4 text-center">
              Belum ada customer baru yang terdaftar di bulan {currentMonthName}.
            </p>
          )}
        </div>
      </div>

      {/* 6. TOP 10 ITEMS & MONTHLY REVENUE/EXPENSE TREND */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Top 10 Barang Terlaris */}
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Top 10 Barang Paling Sering Disewa (Keseluruhan)
            </h3>
          </div>

          <div className="space-y-2.5">
            {topItems.map(([nama, count], idx) => {
              const pct = Math.round((count / maxItemCount) * 100);
              return (
                <div key={nama} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-800 dark:text-zinc-200 truncate max-w-[240px]">
                      <span className="font-bold text-slate-400 dark:text-zinc-500 mr-2">#{idx + 1}</span>
                      {nama}
                    </span>
                    <span className="font-semibold text-slate-600 dark:text-zinc-400 font-mono">
                      {count}x transaksi
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-zinc-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tren Pendapatan Bulanan */}
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-blue-500" />
            Tren Pendapatan & Pengeluaran Bulanan
          </h3>

          {allMonths.length > 0 ? (
            <div className="space-y-4">
              {allMonths.map((month) => {
                const rev = monthlyRevenue[month] || 0;
                const exp = monthlyExpenses[month] || 0;
                const pctRev = Math.max(6, Math.round((rev / maxMonthRev) * 100));

                return (
                  <div key={month} className="space-y-1.5 bg-slate-50 dark:bg-zinc-950/50 p-3 rounded-xl border border-slate-200/60 dark:border-zinc-800/60">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800 dark:text-zinc-200 font-mono">{month}</span>
                      <div className="space-x-3 font-mono">
                        <span className="text-emerald-600 dark:text-emerald-400">+{formatRupiah(rev)}</span>
                        {exp > 0 && <span className="text-rose-600 dark:text-rose-400">-{formatRupiah(exp)}</span>}
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 dark:bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${pctRev}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-zinc-500 py-6 text-center">Belum ada data bulanan.</p>
          )}
        </div>
      </div>

      {/* 7. INVENTORY HEALTH & STOCKS */}
      <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Utilitas Inventori & Stok Perlu Perhatian
          </h3>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
            Utilitas Stok: {utilitasRate}% ({totalStokDisewa} dari {totalStokFisik} item sedang disewa)
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800/80">
            <span className="font-semibold text-slate-700 dark:text-zinc-300 block mb-2">
              Stok Habis / 0 Tersedia ({lowStock.length} barang)
            </span>
            {lowStock.length > 0 ? (
              <div className="space-y-1.5">
                {lowStock.map((i) => (
                  <div
                    key={i.id}
                    className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-300 flex justify-between"
                  >
                    <span>{i.nama_jas} ({i.warna}/{i.ukuran})</span>
                    <span className="font-semibold">0 Tersisa</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 dark:text-zinc-500">Semua item memiliki stok tersedia.</p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800/80">
            <span className="font-semibold text-slate-700 dark:text-zinc-300 block mb-2">
              Perlu Laundry / Siap Bersih ({needLaundry.length} jas)
            </span>
            {needLaundry.length > 0 ? (
              <div className="space-y-1.5">
                {needLaundry.map((i) => (
                  <div
                    key={i.id}
                    className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-300 flex justify-between"
                  >
                    <span>{i.nama_jas} ({i.warna}/{i.ukuran})</span>
                    <span className="font-semibold">{i.status_laundry}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 dark:text-zinc-500">Semua jas berstatus ready laundry.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
