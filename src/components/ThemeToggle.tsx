"use client";

import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
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

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/80 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-zinc-700/50 ${className}`}
      title={isDark ? "Ganti ke Mode Terang (Light Mode)" : "Ganti ke Mode Gelap (Dark Mode)"}
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Mode Terang</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-indigo-600" />
          <span className="hidden sm:inline">Mode Gelap</span>
        </>
      )}
    </button>
  );
}
