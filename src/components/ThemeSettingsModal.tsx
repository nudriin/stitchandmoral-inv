"use client";

import { useThemeStyle } from "./ThemeStyleProvider";
import { useTheme } from "./ThemeProvider";
import { ThemeStyle } from "@/actions/theme";
import {
  Palette,
  Sparkles,
  Layers,
  Box,
  Moon,
  Sun,
  X,
  Database,
  Loader2,
  Check,
} from "lucide-react";

export function ThemeSettingsModal() {
  const { themeStyle, setThemeStyle, isThemeModalOpen, setIsThemeModalOpen, isSaving } = useThemeStyle();
  const { resolvedTheme, setTheme } = useTheme();

  if (!isThemeModalOpen) return null;

  const isDark = resolvedTheme === "dark";

  const themes = [
    {
      id: "default" as ThemeStyle,
      name: "Tema Default",
      badge: "Modern Clean",
      desc: "Tampilan solid modern dengan kontras tinggi, aksen sleek hitam/putih, dan performa gesit.",
      icon: Sparkles,
      iconBg: "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950",
      accentBorder: "border-slate-900 dark:border-zinc-100 ring-2 ring-slate-900/10 dark:ring-zinc-100/20",
    },
    {
      id: "glassmorphism" as ThemeStyle,
      name: "Tema Glassmorphism",
      badge: "Frosted Glass & Glow",
      desc: "Panel kaca transparan dengan efek blur halus (frosted glass), refleksi glossy, dan pendaran aura latar.",
      icon: Layers,
      iconBg: "bg-indigo-600 text-white",
      accentBorder: "border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-500/25",
    },
    {
      id: "neomorphism" as ThemeStyle,
      name: "Tema Neomorphism",
      badge: "Soft 3D Tactile",
      desc: "Efek timbul dan cekung 3D taktil yang lembut (embossed & inset shadows) dengan bayangan ganda yang mewah.",
      icon: Box,
      iconBg: "bg-blue-600 text-white",
      accentBorder: "border-blue-600 dark:border-blue-400 ring-2 ring-blue-500/25",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-xl p-5 sm:p-6 shadow-2xl space-y-5 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Pengaturan Tema Aplikasi
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Pilih gaya visual sistem &amp; otomatis tersimpan ke database
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsThemeModalOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 flex items-center justify-center text-sm cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Theme Selection Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Mode Terang / Gelap Switcher */}
          <div className="bg-slate-50 dark:bg-zinc-950/70 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {isDark ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">
                  Mode Warna: {isDark ? "Gelap (Dark Mode)" : "Terang (Light Mode)"}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Pilih mode gelap atau terang
                </span>
              </div>
            </div>

            <div className="flex bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  !isDark
                    ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                    : "text-slate-500 dark:text-zinc-400"
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Terang</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isDark
                    ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                    : "text-slate-500 dark:text-zinc-400"
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Gelap</span>
              </button>
            </div>
          </div>

          <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
            Pilih 3 Gaya Tema Utama:
          </label>

          {/* 3 Theme Cards */}
          <div className="space-y-3">
            {themes.map((opt) => {
              const Icon = opt.icon;
              const isSelected = themeStyle === opt.id;

              return (
                <div
                  key={opt.id}
                  onClick={() => setThemeStyle(opt.id)}
                  className={`group relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3.5 ${
                    isSelected
                      ? `${opt.accentBorder} bg-slate-50/80 dark:bg-zinc-950/70 shadow-sm`
                      : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${opt.iconBg}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                          {opt.name}
                        </h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                  </div>

                  {/* Selected Indicator */}
                  <div className="shrink-0">
                    {isSelected ? (
                      <div className="w-7 h-7 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-sm">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full border-2 border-slate-300 dark:border-zinc-700 group-hover:border-slate-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with Database Sync Status */}
        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            {isSaving ? (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <Loader2 className="w-3 h-3 animate-spin" />
                Menyimpan ke database...
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Tersimpan di tabel database (pengaturan) ✓
              </span>
            )}
          </div>

          <button
            onClick={() => setIsThemeModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-bold text-xs transition cursor-pointer shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
