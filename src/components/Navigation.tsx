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
} from "lucide-react";
import { logout } from "@/app/login/actions";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transaksi", label: "Transaksi", icon: ReceiptText },
  { href: "/inventori", label: "Inventori", icon: Layers },
  { href: "/customers", label: "Customer", icon: Users },
  { href: "/laporan", label: "Laporan", icon: BarChart3 },
  { href: "/biaya", label: "Biaya & Modal", icon: Wallet },
];

export function Sidebar() {
  const pathname = usePathname();

  // Don't show sidebar on login page
  if (pathname === "/login") return null;

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/70 backdrop-blur-xl h-screen sticky top-0 px-4 py-6 justify-between transition-colors">
      <div>
        {/* Brand */}
        <div className="px-3 mb-8">
          <h1 className="font-bold text-base text-slate-900 dark:text-zinc-100 tracking-tight">
            Stitch & Moral
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Sewa Jas PKY</p>
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
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls: Theme Toggle & Logout */}
      <div className="pt-4 border-t border-slate-200 dark:border-zinc-800/80 space-y-1.5">
        <ThemeToggle className="w-full justify-start" />
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  // Don't show bottom nav on login page
  if (pathname === "/login") return null;

  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50 bg-white/95 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 backdrop-blur-xl rounded-2xl p-1.5 shadow-2xl flex items-center justify-around transition-colors">
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
            className={`flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-xl text-[10px] font-medium transition ${
              isActive
                ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold shadow"
                : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            }`}
          >
            <Icon className="w-4 h-4 mb-0.5" />
            <span className="truncate max-w-[50px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
