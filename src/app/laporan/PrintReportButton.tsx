"use client";

import { Printer } from "lucide-react";

export function PrintReportButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold text-sm transition shadow-sm cursor-pointer"
    >
      <Printer className="w-4 h-4" />
      <span>Print / Simpan PDF Laporan</span>
    </button>
  );
}
