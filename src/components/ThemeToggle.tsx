"use client";

import { useTheme } from "@/components/ThemeProvider";
import { useThemeStyle } from "@/components/ThemeStyleProvider";
import { useEffect, useState } from "react";
import { Moon, Sun, Palette, Sparkles, Layers, Box } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { themeStyle, setIsThemeModalOpen } = useThemeStyle();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent ${className}`} />
    );
  }

  const isDark = resolvedTheme === "dark";

  const themeIcons = {
    default: Sparkles,
    glassmorphism: Layers,
    neomorphism: Box,
  };

  const ThemeIcon = themeIcons[themeStyle] || Sparkles;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* 1-Click Light/Dark Toggle */}
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="p-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-zinc-700/50"
        title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600" />
        )}
      </button>

      {/* Theme Style Customizer Modal Button */}
      <button
        onClick={() => setIsThemeModalOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 transition cursor-pointer"
        title="Buka Pengaturan Tema (Default, Glassmorphism, Neomorphism)"
      >
        <Palette className="w-3.5 h-3.5 text-indigo-500" />
        <span className="capitalize hidden sm:inline">{themeStyle}</span>
      </button>
    </div>
  );
}
