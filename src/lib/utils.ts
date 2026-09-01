import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(value: number | string | null | undefined): string {
  const num = Number(value || 0);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDateIndo(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateStr);
  }
}

export function getDriveThumbnail(url: string | null | undefined, width = 360): string {
  if (!url) return "";
  const match = String(url).match(/[-\w]{25,}/);
  return match ? `https://drive.google.com/thumbnail?id=${match[0]}&sz=w${width}` : url;
}

export function calculateRentalDays(startDate: string | null | undefined, returnDate: string | null | undefined): number {
  if (!startDate || !returnDate) return 1;
  try {
    const start = new Date(String(startDate).slice(0, 10) + "T00:00:00").getTime();
    const end = new Date(String(returnDate).slice(0, 10) + "T00:00:00").getTime();
    if (isNaN(start) || isNaN(end)) return 1;
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  } catch {
    return 1;
  }
}

