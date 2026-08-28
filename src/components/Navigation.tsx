"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Users,
  ReceiptText,
  BarChart3,
  Wallet,
  LogOut,
  Sparkles,
} from "lucide-react";
import { logout } from "@/app/login/actions";
import { ThemeToggle } from "./ThemeToggle";
import { useThemeStyle } from "./ThemeStyleProvider";
import { Palette } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/transaksi", label: "Transaksi", icon: ReceiptText },
  { href: "/inventori", label: "Inventori", icon: Layers },
  { href: "/customers", label: "Customer", icon: Users },
  { href: "/laporan", label: "Laporan", icon: BarChart3 },
  { href: "/biaya", label: "Biaya", icon: Wallet },
];

export function Sidebar() {
  const pathname = usePathname();
  const { themeStyle, setIsThemeModalOpen } = useThemeStyle();

  // Don't show sidebar on login page
  if (pathname === "/login") return null;

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/70 backdrop-blur-xl h-screen sticky top-0 px-4 py-6 justify-between transition-colors">
      <div>
        {/* Brand */}
        <div className="px-3 mb-8 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950 font-bold shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-900 dark:text-zinc-100 tracking-tight">
              Stitch & Moral
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">Sewa Jas PKY</p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold shadow-sm"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900/80"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? "text-white dark:text-zinc-950"
                      : "text-slate-500 dark:text-zinc-400"
                  }`}
                />
                <span>{item.label === "Home" ? "Dashboard" : item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls: Theme Customizer, Theme Toggle & Logout */}
      <div className="pt-4 border-t border-slate-200 dark:border-zinc-800/80 space-y-2">
        <button
          onClick={() => setIsThemeModalOpen(true)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 bg-slate-100/80 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition cursor-pointer border border-slate-200 dark:border-zinc-700/60"
          title="Pengaturan Tema (Default, Glassmorphism, Neomorphism)"
        >
          <div className="flex items-center gap-2.5">
            <Palette className="w-3.5 h-3.5 text-indigo-500" />
            <span>Gaya Tema</span>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
            {themeStyle}
          </span>
        </button>

        <ThemeToggle className="w-full justify-between" />

        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </aside>
  );
}

export function MobileHeader() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <header className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-zinc-950/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-zinc-800/80 px-4 pt-[max(0.75rem,calc(env(safe-area-inset-top)+0.35rem))] pb-3 flex items-center justify-between transition-colors shadow-xs">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950 font-bold shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div>
          <h1 className="font-bold text-xs text-slate-900 dark:text-zinc-100 tracking-tight leading-none">
            Stitch & Moral
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-none mt-0.5">Sewa Jas PKY</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <button
          onClick={() => logout()}
          className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
          title="Keluar Akun"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  // Don't show bottom nav on login page
  if (pathname === "/login") return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-zinc-950/90 border-t border-slate-200 dark:border-zinc-800 backdrop-blur-2xl px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl flex items-center justify-around transition-colors">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl text-[10px] font-medium transition active:scale-95 ${
              isActive
                ? "text-slate-950 dark:text-zinc-50 font-bold"
                : "text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300"
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-all ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs scale-105"
                  : ""
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <span className="truncate max-w-[54px] mt-0.5 leading-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
