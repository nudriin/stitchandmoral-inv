"use client";

import { Shirt, Layers, Sparkles, Box, CheckCircle2 } from "lucide-react";
import type { Inventori } from "@/types/database";

interface Props {
  inventory: Inventori[];
}

export function CategoryStockCards({ inventory }: Props) {
  const categories = [
    {
      id: "jas",
      title: "Stok Jas Lengkap",
      subtitle: "Jas Formal, Slimfit & Tuxedo",
      icon: Shirt,
      color: "from-indigo-500 to-blue-600",
      textColor: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-800/60",
      filter: (i: Inventori) => {
        const type = (i.jenis_jas || "").trim().toLowerCase();
        if (type) return type === "jas";
        const name = (i.nama_jas || "").trim().toLowerCase();
        return name.startsWith("jas") || name.includes("jas ");
      },
    },
    {
      id: "celana",
      title: "Stok Celana Bahan",
      subtitle: "Celana Formal & Waist Size",
      icon: Layers,
      color: "from-blue-500 to-cyan-600",
      textColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-800/60",
      filter: (i: Inventori) => {
        const type = (i.jenis_jas || "").trim().toLowerCase();
        if (type) return type === "celana";
        const name = (i.nama_jas || "").trim().toLowerCase();
        return name.startsWith("celana") || name.includes("celana ");
      },
    },
    {
      id: "dasi",
      title: "Stok Dasi & Pita",
      subtitle: "Dasi Salur, Polos & Bowtie",
      icon: Sparkles,
      color: "from-amber-500 to-yellow-600",
      textColor: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/60",
      filter: (i: Inventori) => {
        const type = (i.jenis_jas || "").trim().toLowerCase();
        if (type) return type === "dasi";
        const name = (i.nama_jas || "").trim().toLowerCase();
        return name.startsWith("dasi") || name.includes("dasi ");
      },
    },
    {
      id: "lainnya",
      title: "Kemeja, Vest & Aksesoris",
      subtitle: "Cover, Hanger & Tambahan",
      icon: Box,
      color: "from-purple-500 to-pink-600",
      textColor: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/40 border-purple-200/80 dark:border-purple-800/60",
      filter: (i: Inventori) => {
        const type = (i.jenis_jas || "").trim().toLowerCase();
        if (type) return !["jas", "celana", "dasi"].includes(type);
        const name = (i.nama_jas || "").trim().toLowerCase();
        const isJas = name.startsWith("jas") || name.includes("jas ");
        const isCelana = name.startsWith("celana") || name.includes("celana ");
        const isDasi = name.startsWith("dasi") || name.includes("dasi ");
        return !isJas && !isCelana && !isDasi;
      },
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Shirt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Ketersediaan Stok Kategori Bulan Ini
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Monitoring fisik barang tersedia vs sedang disewa per kategori
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {categories.map((cat) => {
          const items = inventory.filter(cat.filter);
          const totalFisik = items.reduce((acc, i) => acc + (Number(i.jumlah_stok) || 0), 0);
          const totalTersedia = items.reduce((acc, i) => acc + (Number(i.stok_tersedia) || 0), 0);
          const totalDisewa = items.reduce((acc, i) => acc + (Number(i.stok_disewa) || 0), 0);
          const percentAvailable = totalFisik > 0 ? Math.round((totalTersedia / totalFisik) * 100) : 0;
          const Icon = cat.icon;

          return (
            <div
              key={cat.id}
              className={`rounded-2xl p-4 sm:p-5 border transition shadow-xs flex flex-col justify-between ${cat.bgColor}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl bg-white dark:bg-zinc-900 shadow-xs ${cat.textColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 leading-tight">
                        {cat.title}
                      </h3>
                      <p className="text-[10.5px] text-slate-500 dark:text-zinc-400">{cat.subtitle}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100">
                      {totalTersedia}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 ml-1.5">
                      / {totalFisik} Pcs
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {percentAvailable}% Ready
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-white/70 dark:bg-zinc-900/70 rounded-full overflow-hidden mt-2 p-0.5">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${cat.color} transition-all duration-500`}
                    style={{ width: `${percentAvailable}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-zinc-800/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-600 dark:text-zinc-400">Sedang Disewa:</span>
                <span className="font-bold text-slate-900 dark:text-zinc-200 font-mono">
                  {totalDisewa} Pcs
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
