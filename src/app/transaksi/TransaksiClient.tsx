"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import {
  Plus,
  Search,
  ReceiptText,
  Calendar,
  DollarSign,
  Printer,
  Share2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  LayoutGrid,
  List,
  MessageCircle,
  Download,
  ChevronDown,
  Check,
  Tag,
  Trash2,
  RotateCcw,
} from "lucide-react";
import type { Transaksi, Inventori, Customer, TransactionItem } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

function formatThousand(num: number): string {
  if (!num) return "";
  return new Intl.NumberFormat("id-ID").format(num);
}

interface CurrencyInputProps {
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  className?: string;
  prefix?: string;
}

function CurrencyInput({
  value,
  onChange,
  placeholder = "0",
  className = "",
  prefix = "Rp",
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState(value ? formatThousand(value) : "");

  useEffect(() => {
    setDisplayValue(value ? formatThousand(value) : "");
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setDisplayValue("");
      onChange(0);
      return;
    }
    const num = parseInt(raw, 10);
    setDisplayValue(formatThousand(num));
    onChange(num);
  }

  return (
    <div className="relative flex items-center w-full min-w-0">
      {prefix && (
        <span className="absolute left-3 text-xs font-semibold text-slate-400 dark:text-zinc-500 pointer-events-none select-none z-10">
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        placeholder={placeholder}
        onChange={handleChange}
        className={`w-full min-w-0 box-border ${prefix ? "pl-9 pr-3" : "px-3"} ${className}`}
      />
    </div>
  );
}

interface SearchableItemPickerProps {
  inventory: Inventori[];
  selectedCode: string;
  onSelect: (item: Inventori) => void;
}

function SearchableItemPicker({
  inventory,
  selectedCode,
  onSelect,
}: SearchableItemPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedItem = inventory.find((i) => i.kode_jas === selectedCode);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [open]);

  const filtered = inventory.filter((inv) => {
    const q = search.toLowerCase();
    return (
      inv.nama_jas.toLowerCase().includes(q) ||
      inv.kode_jas.toLowerCase().includes(q) ||
      (inv.warna && inv.warna.toLowerCase().includes(q)) ||
      (inv.ukuran && inv.ukuran.toLowerCase().includes(q)) ||
      (inv.jenis_jas && inv.jenis_jas.toLowerCase().includes(q))
    );
  });

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-left text-xs text-slate-900 dark:text-zinc-100 flex items-center justify-between gap-2 transition hover:border-slate-300 dark:hover:border-zinc-700 shadow-sm cursor-pointer"
      >
        {selectedItem ? (
          <div className="truncate flex-1">
            <span className="font-semibold text-slate-900 dark:text-zinc-100">
              {selectedItem.nama_jas}
            </span>
            <span className="text-slate-500 dark:text-zinc-400 ml-1.5 text-[11px]">
              ({selectedItem.warna || "-"}/{selectedItem.ukuran || "-"}) • Stok: {selectedItem.stok_tersedia}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            Cari jas, celana, dasi, ukuran...
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Popover Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-full sm:min-w-[320px] max-w-[420px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-64 animate-in fade-in zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/60 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Ketik nama, warna, ukuran (XL, 33)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* List of Items */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
            {filtered.length > 0 ? (
              filtered.map((inv) => {
                const isSelected = inv.kode_jas === selectedCode;
                const isOutOfStock = inv.stok_tersedia <= 0;

                return (
                  <button
                    key={inv.id || inv.kode_jas}
                    type="button"
                    onClick={() => {
                      onSelect(inv);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800"
                        : "hover:bg-slate-50 dark:hover:bg-zinc-800/60 text-slate-800 dark:text-zinc-200"
                    }`}
                  >
                    <div className="truncate">
                      <p className="font-bold truncate">{inv.nama_jas}</p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        {inv.warna || "-"} • Ukuran: <b className="text-slate-700 dark:text-zinc-300">{inv.ukuran || "-"}</b> • {inv.jenis_jas}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(inv.harga_default)}
                      </p>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                          isOutOfStock
                            ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                            : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        Stok: {inv.stok_tersedia}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-zinc-500">
                Tidak ada item yang cocok dengan pencarian &quot;{search}&quot;.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  initialTransactions: Transaksi[];
  inventory: Inventori[];
  customers: Customer[];
}

export function TransaksiClient({
  initialTransactions,
  inventory,
  customers,
}: Props) {
  const [transactions, setTransactions] = useState<Transaksi[]>(initialTransactions);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [sharingWa, setSharingWa] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaksi | null>(null);

  // Pay Modal State
  const [payAmount, setPayAmount] = useState(0);
  const [payStatus, setPayStatus] = useState("Lunas");

  // New Transaction Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [newCustName, setNewCustName] = useState("");
  const [newCustWa, setNewCustWa] = useState("");
  const [newCustAlamat, setNewCustAlamat] = useState("");
  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [tanggalSewa, setTanggalSewa] = useState(todayStr);
  const [tanggalKembali, setTanggalKembali] = useState(tomorrowStr);
  const [potongan, setPotongan] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [jumlahDibayar, setJumlahDibayar] = useState(0);
  const [metodePembayaran, setMetodePembayaran] = useState("Transfer");
  const [catatan, setCatatan] = useState("");

  const [selectedItems, setSelectedItems] = useState<TransactionItem[]>([
    { kodeJas: "", namaJas: "", jenisJas: "Jas", warna: "", ukuran: "", jumlah: 1, harga: 0 },
  ]);

  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  // Calculations for new transaction
  const subtotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.harga * item.jumlah, 0),
    [selectedItems]
  );
  const totalBayar = Math.max(0, subtotal - potongan);
  const sisaPembayaran = Math.max(0, totalBayar - jumlahDibayar);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      const matchSearch =
        !q ||
        t.kode_transaksi.toLowerCase().includes(q) ||
        t.nama_customer.toLowerCase().includes(q) ||
        t.whatsapp?.includes(q) ||
        t.items?.some((i) => i.namaJas?.toLowerCase().includes(q));

      const matchStatus = statusFilter === "Semua" || t.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [transactions, search, statusFilter]);

  function addItemRow() {
    setSelectedItems((prev) => [
      ...prev,
      { kodeJas: "", namaJas: "", jenisJas: "Jas", warna: "", ukuran: "", jumlah: 1, harga: 0 },
    ]);
  }

  function removeItemRow(index: number) {
    if (selectedItems.length <= 1) {
      setSelectedItems([
        { kodeJas: "", namaJas: "", jenisJas: "Jas", warna: "", ukuran: "", jumlah: 1, harga: 0 },
      ]);
      return;
    }
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleItemChange(index: number, kodeJas: string) {
    const inv = inventory.find((i) => i.kode_jas === kodeJas);
    if (!inv) return;

    setSelectedItems((prev) => {
      const next = [...prev];
      next[index] = {
        kodeJas: inv.kode_jas,
        namaJas: inv.nama_jas,
        jenisJas: inv.jenis_jas,
        warna: inv.warna,
        ukuran: inv.ukuran,
        jumlah: 1,
        harga: Number(inv.harga_default || 0),
      };
      return next;
    });
  }

  function updateItemQtyOrPrice(index: number, field: "jumlah" | "harga", val: number) {
    setSelectedItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  }

  async function handleCreateTransaction(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const validItems = selectedItems.filter((i) => i.kodeJas && i.jumlah > 0);
      if (validItems.length === 0) {
        alert("Pilih minimal 1 item sewa.");
        setSaving(false);
        return;
      }

      // Check customer
      let custId = selectedCustomerId;
      let custName = newCustName;
      let custWa = newCustWa.replace(/\D/g, "");

      if (custId) {
        const found = customers.find((c) => c.customer_id === custId);
        if (found) {
          custName = found.nama;
          custWa = found.whatsapp;
        }
      } else {
        if (!newCustName) {
          alert("Nama customer wajib diisi.");
          setSaving(false);
          return;
        }
        if (custWa.startsWith("0")) custWa = "62" + custWa.slice(1);
        else if (!custWa.startsWith("62") && custWa.length > 5) custWa = "62" + custWa;

        custId = `CUS-${Date.now().toString().slice(-6)}`;
        await supabase.from("customer").insert([
          {
            customer_id: custId,
            nama: custName,
            whatsapp: custWa,
            alamat: newCustAlamat,
          },
        ]);
      }

      const isBooking = tanggalSewa > todayStr;
      const status = isBooking ? "Booking" : "Sedang Disewa";
      const status_pembayaran =
        totalBayar <= 0
          ? "Lunas"
          : jumlahDibayar >= totalBayar
          ? "Lunas"
          : jumlahDibayar > 0
          ? "DP"
          : "Belum Bayar";

      const kode_transaksi = `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now()
        .toString()
        .slice(-4)}`;

      const newTxPayload = {
        kode_transaksi,
        customer_id: custId,
        nama_customer: custName,
        whatsapp: custWa,
        items: validItems,
        jumlah_total: validItems.reduce((s, i) => s + i.jumlah, 0),
        subtotal,
        potongan,
        deposit,
        total_bayar: totalBayar,
        tanggal_sewa: tanggalSewa,
        tanggal_kembali: tanggalKembali,
        status,
        denda: 0,
        status_pembayaran,
        jumlah_dibayar: jumlahDibayar,
        sisa_pembayaran: sisaPembayaran,
        metode_pembayaran: metodePembayaran,
        catatan,
      };

      const { data, error } = await supabase
        .from("transaksi")
        .insert([newTxPayload])
        .select()
        .single();

      if (error) {
        alert("Gagal membuat transaksi: " + error.message);
        setSaving(false);
        return;
      }

      // Update stok inventori jika langsung Sedang Disewa
      if (status === "Sedang Disewa") {
        for (const itm of validItems) {
          const inv = inventory.find((i) => i.kode_jas === itm.kodeJas);
          if (inv) {
            const newAvail = Math.max(0, inv.stok_tersedia - itm.jumlah);
            const newRented = inv.stok_disewa + itm.jumlah;
            await supabase
              .from("inventori")
              .update({ stok_tersedia: newAvail, stok_disewa: newRented })
              .eq("id", inv.id);
          }
        }
      }

      setTransactions((prev) => [data as Transaksi, ...prev]);
      setCreateModalOpen(false);
      setSelectedTx(data as Transaksi);
      setReceiptModalOpen(true);
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmPickup(tx: Transaksi) {
    if (!confirm(`Konfirmasi pengambilan jas untuk transaksi ${tx.kode_transaksi}?`)) return;

    const { data, error } = await supabase
      .from("transaksi")
      .update({ status: "Sedang Disewa" })
      .eq("id", tx.id)
      .select()
      .single();

    if (error) {
      alert("Gagal update status: " + error.message);
      return;
    }

    // Kurangi stok
    if (Array.isArray(tx.items)) {
      for (const itm of tx.items) {
        const inv = inventory.find((i) => i.kode_jas === itm.kodeJas);
        if (inv) {
          await supabase
            .from("inventori")
            .update({
              stok_tersedia: Math.max(0, inv.stok_tersedia - itm.jumlah),
              stok_disewa: inv.stok_disewa + itm.jumlah,
            })
            .eq("id", inv.id);
        }
      }
    }

    setTransactions((prev) => prev.map((t) => (t.id === tx.id ? (data as Transaksi) : t)));
  }

  async function handleFinishTransaction(tx: Transaksi) {
    if (!confirm(`Selesaikan transaksi ${tx.kode_transaksi} (jas sudah dikembalikan)?`)) return;

    const returnDate = todayStr;
    const { data, error } = await supabase
      .from("transaksi")
      .update({
        status: "Selesai",
        tanggal_dikembalikan: returnDate,
      })
      .eq("id", tx.id)
      .select()
      .single();

    if (error) {
      alert("Gagal menyelesaikan transaksi: " + error.message);
      return;
    }

    // Kembalikan stok inventori
    if (Array.isArray(tx.items)) {
      for (const itm of tx.items) {
        const inv = inventory.find((i) => i.kode_jas === itm.kodeJas);
        if (inv) {
          await supabase
            .from("inventori")
            .update({
              stok_tersedia: inv.stok_tersedia + itm.jumlah,
              stok_disewa: Math.max(0, inv.stok_disewa - itm.jumlah),
            })
            .eq("id", inv.id);
        }
      }
    }

    setTransactions((prev) => prev.map((t) => (t.id === tx.id ? (data as Transaksi) : t)));
  }

  async function handleCancelTransaction(tx: Transaksi) {
    if (!confirm(`Batalkan transaksi ${tx.kode_transaksi}?`)) return;

    const { data, error } = await supabase
      .from("transaksi")
      .update({ status: "Dibatalkan" })
      .eq("id", tx.id)
      .select()
      .single();

    if (error) {
      alert("Gagal membatalkan transaksi: " + error.message);
      return;
    }

    // Kembalikan stok jika tadinya sedang disewa
    if (["Sedang Disewa", "Terlambat"].includes(tx.status) && Array.isArray(tx.items)) {
      for (const itm of tx.items) {
        const inv = inventory.find((i) => i.kode_jas === itm.kodeJas);
        if (inv) {
          await supabase
            .from("inventori")
            .update({
              stok_tersedia: inv.stok_tersedia + itm.jumlah,
              stok_disewa: Math.max(0, inv.stok_disewa - itm.jumlah),
            })
            .eq("id", inv.id);
        }
      }
    }

    setTransactions((prev) => prev.map((t) => (t.id === tx.id ? (data as Transaksi) : t)));
  }

  async function handleUpdatePayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedTx) return;

    const dibayar = payAmount;
    const spStatus = payStatus;
    const sisa = Math.max(0, selectedTx.total_bayar - dibayar);

    const { data, error } = await supabase
      .from("transaksi")
      .update({
        jumlah_dibayar: dibayar,
        sisa_pembayaran: sisa,
        status_pembayaran: spStatus,
      })
      .eq("id", selectedTx.id)
      .select()
      .single();

    if (error) {
      alert("Gagal update pembayaran: " + error.message);
    } else {
      setTransactions((prev) => prev.map((t) => (t.id === selectedTx.id ? (data as Transaksi) : t)));
      setPayModalOpen(false);
    }
  }

  async function shareToWhatsApp(tx: Transaksi) {
    if (!tx.whatsapp) {
      alert("Nomor WhatsApp tidak tersedia.");
      return;
    }

    const itemsText = tx.items
      ?.map(
        (i) => `  • ${i.namaJas} (${i.warna || "-"}/${i.ukuran || "-"}) x${i.jumlah} = ${formatRupiah(i.harga * i.jumlah)}`
      )
      .join("\n");

    const message = `🧥 *Struk Sewa Jas - Stitch & Moral*
━━━━━━━━━━━━━━━━━━━
No Transaksi : ${tx.kode_transaksi}
Customer     : ${tx.nama_customer}
Tgl Sewa     : ${formatDateIndo(tx.tanggal_sewa)}
Tgl Kembali  : ${formatDateIndo(tx.tanggal_kembali)}
━━━━━━━━━━━━━━━━━━━
*Item yang Disewa:*
${itemsText}
━━━━━━━━━━━━━━━━━━━
Subtotal  : ${formatRupiah(tx.subtotal)}
Deposit   : ${formatRupiah(tx.deposit)}
${tx.potongan > 0 ? `Potongan  : -${formatRupiah(tx.potongan)}\n` : ""}*Total Bayar : ${formatRupiah(tx.total_bayar)}*
━━━━━━━━━━━━━━━━━━━
Status Sewa       : ${tx.status}
Status Pembayaran : *${tx.status_pembayaran}*
Sudah Dibayar     : ${formatRupiah(tx.jumlah_dibayar)}
${tx.sisa_pembayaran > 0 ? `Sisa Pembayaran   : ${formatRupiah(tx.sisa_pembayaran)}\n` : ""}
Terima kasih sudah mempercayakan sewa jas di Stitch & Moral! 🙏`;

    setSharingWa(true);
    try {
      const el = document.getElementById("printableReceipt");
      if (el) {
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(el, { scale: 3, backgroundColor: "#ffffff" });
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
        
        if (blob) {
          const file = new File([blob], `Struk_${tx.kode_transaksi}.png`, { type: "image/png" });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Struk Sewa - ${tx.kode_transaksi}`,
              text: message,
            });
            setSharingWa(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn("Web Share API not supported or user cancelled:", err);
    } finally {
      setSharingWa(false);
    }

    const cleanPhone = tx.whatsapp.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("0") ? `62${cleanPhone.slice(1)}` : cleanPhone.startsWith("62") ? cleanPhone : `62${cleanPhone}`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, "_blank");
  }

  function printReceipt(tx: Transaksi) {
    const rows = (tx.items || [])
      .map(
        (item) => `
        <tr>
          <td>
            <b>${item.namaJas}</b><br>
            <span style="color:#666; font-size:11px">${item.warna || "-"} / ${item.ukuran || "-"}</span>
          </td>
          <td style="text-align:right">${item.jumlah}</td>
          <td style="text-align:right">${formatRupiah(item.harga)}</td>
          <td style="text-align:right"><b>${formatRupiah(item.harga * item.jumlah)}</b></td>
        </tr>
      `
      )
      .join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Harap izinkan popup di browser untuk mencetak struk.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Struk Sewa Jas - ${tx.kode_transaksi}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              margin: 0;
              padding: 24px;
              color: #111827;
              background: #fff;
            }
            .receipt {
              width: 100%;
              max-width: 100%;
              margin: 0 auto;
            }
            h1 {
              font-size: 22px;
              font-weight: 800;
              margin: 0 0 4px;
              text-align: center;
              letter-spacing: -0.3px;
            }
            .muted {
              color: #6b7280;
              font-size: 13px;
              text-align: center;
              margin-bottom: 24px;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              font-size: 13px;
              line-height: 1.6;
              padding-bottom: 14px;
              border-bottom: 1px dashed #d1d5db;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th {
              border-bottom: 2px solid #374151;
              padding: 10px 4px;
              font-size: 13px;
              font-weight: 700;
              text-align: left;
              color: #111827;
            }
            td {
              border-bottom: 1px solid #e5e7eb;
              padding: 10px 4px;
              font-size: 13px;
              text-align: left;
              vertical-align: top;
            }
            th:nth-child(n+2),
            td:nth-child(n+2) {
              text-align: right;
            }
            .financial-section {
              font-size: 13px;
              line-height: 1.7;
              margin-top: 14px;
            }
            .total-row {
              font-weight: 800;
              font-size: 16px;
              color: #111827;
              padding: 8px 0;
              border-top: 1px solid #e5e7eb;
              border-bottom: 1px solid #e5e7eb;
              margin: 8px 0;
            }
            .badge-lunas {
              display: inline-block;
              padding: 2px 8px;
              background: #ecfdf5;
              color: #047857;
              font-weight: 700;
              border-radius: 4px;
              border: 1px solid #a7f3d0;
            }
            .footer-note {
              text-align: center;
              margin-top: 40px;
              font-size: 12px;
              color: #6b7280;
              border-top: 1px dashed #d1d5db;
              padding-top: 14px;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <h1>Stitch and Moral - Sewa Jas PKY</h1>
            <div class="muted">Struk Bukti Sewa & Transaksi</div>

            <div class="meta-grid">
              <div>
                <b>No. Transaksi:</b> ${tx.kode_transaksi}<br>
                <b>Customer:</b> ${tx.nama_customer}<br>
                <b>WhatsApp:</b> +${tx.whatsapp || "-"}
              </div>
              <div style="text-align:right">
                <b>Tanggal Sewa:</b> ${formatDateIndo(tx.tanggal_sewa)}<br>
                <b>Tanggal Kembali:</b> ${formatDateIndo(tx.tanggal_kembali)}<br>
                <b>Status Sewa:</b> ${tx.status}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Item / Varian</th>
                  <th>Qty</th>
                  <th>Harga Sewa</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>

            <div class="financial-section">
              <div style="display:flex; justify-content:space-between">
                <span>Subtotal:</span>
                <span>${formatRupiah(tx.subtotal)}</span>
              </div>
              ${tx.deposit > 0 ? `
              <div style="display:flex; justify-content:space-between">
                <span>Deposit Jaminan:</span>
                <span>${formatRupiah(tx.deposit)}</span>
              </div>` : ""}
              ${tx.potongan > 0 ? `
              <div style="display:flex; justify-content:space-between; color:#047857">
                <span>Potongan / Diskon:</span>
                <span>-${formatRupiah(tx.potongan)}</span>
              </div>` : ""}
              ${tx.denda > 0 ? `
              <div style="display:flex; justify-content:space-between; color:#b91c1c">
                <span>Denda Keterlambatan:</span>
                <span>+${formatRupiah(tx.denda)}</span>
              </div>` : ""}

              <div class="total-row" style="display:flex; justify-content:space-between">
                <span>TOTAL BAYAR:</span>
                <span>${formatRupiah(tx.total_bayar)}</span>
              </div>

              <div style="display:flex; justify-content:space-between">
                <span>Sudah Dibayar:</span>
                <span><b>${formatRupiah(tx.jumlah_dibayar || 0)}</b></span>
              </div>

              ${tx.sisa_pembayaran > 0 ? `
              <div style="display:flex; justify-content:space-between; color:#b91c1c; font-weight:700">
                <span>Sisa Pembayaran:</span>
                <span>${formatRupiah(tx.sisa_pembayaran)}</span>
              </div>` : `
              <div style="display:flex; justify-content:space-between; margin-top:4px">
                <span>Status Pembayaran:</span>
                <span class="badge-lunas">LUNAS ✓</span>
              </div>`}

              ${tx.catatan ? `
              <div style="margin-top:10px; color:#4b5563">
                <b>Catatan:</b> ${tx.catatan}
              </div>` : ""}
            </div>

            <div class="footer-note">
              Terima kasih telah menyewa jas di <b>Stitch and Moral</b>.<br>
              Harap simpan struk ini sebagai bukti pengambilan & pengembalian jas.
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  async function downloadReceiptImage() {
    const el = document.getElementById("printableReceipt");
    if (!el) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(el, { scale: 3, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `Struk_${selectedTx?.kode_transaksi || "Sewa"}.png`;
      link.click();
    } catch (err) {
      console.error("Gagal mendownload gambar struk:", err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
            <ReceiptText className="w-7 h-7 text-slate-500 dark:text-zinc-400" />
            Transaksi Sewa
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Pencatatan booking, sewa aktif, pembayaran DP/Lunas, dan struk
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setViewMode("card")}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "card"
                  ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm"
                  : "text-slate-400 dark:text-zinc-400"
              }`}
              title="Tampilan Card"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "list"
                  ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm"
                  : "text-slate-400 dark:text-zinc-400"
              }`}
              title="Tampilan List"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold text-sm transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Transaksi Baru</span>
          </button>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Cari transaksi, customer, nomor WA..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 focus:border-slate-400 dark:focus:border-zinc-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none shadow-sm"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {["Semua", "Sedang Disewa", "Booking", "Selesai", "Terlambat", "Dibatalkan"].map(
            (st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  statusFilter === st
                    ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow"
                    : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                {st}
              </button>
            )
          )}
        </div>
      </div>

      {/* Content View: Card vs List */}
      {viewMode === "card" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length > 0 ? (
            filtered.map((t) => (
              <div
                key={t.id || t.kode_transaksi}
                className="bg-white dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800/90 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-zinc-700 transition shadow-sm space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 font-semibold block">
                        {t.kode_transaksi}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100 mt-0.5">
                        {t.nama_customer}
                      </h3>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          t.status === "Selesai"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60"
                            : t.status === "Sedang Disewa"
                            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60"
                            : t.status === "Booking"
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60"
                            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/60"
                        }`}
                      >
                        {t.status}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          t.status_pembayaran === "Lunas"
                            ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30"
                            : t.status_pembayaran === "DP"
                            ? "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30"
                            : "text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30"
                        }`}
                      >
                        {t.status_pembayaran}
                      </span>
                    </div>
                  </div>

                  {/* Items chip */}
                  <div className="space-y-1.5 my-3">
                    {t.items?.map((item, i) => (
                      <div
                        key={i}
                        className="text-xs bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800/70 rounded-lg p-2 flex justify-between items-center text-slate-700 dark:text-zinc-300"
                      >
                        <span className="truncate max-w-[180px]">
                          {item.namaJas} ({item.ukuran || "-"})
                        </span>
                        <span className="font-semibold text-slate-400 dark:text-zinc-400 font-mono">
                          x{item.jumlah}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Meta Dates & Financials */}
                  <div className="text-xs space-y-1 text-slate-500 dark:text-zinc-400 pt-2 border-t border-slate-100 dark:border-zinc-800/60">
                    <div className="flex justify-between">
                      <span>Sewa:</span>
                      <span className="text-slate-800 dark:text-zinc-200 font-medium">
                        {formatDateIndo(t.tanggal_sewa)} → {formatDateIndo(t.tanggal_kembali)}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold text-slate-900 dark:text-zinc-100 pt-1">
                      <span>Total:</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{formatRupiah(t.total_bayar)}</span>
                    </div>
                    {t.sisa_pembayaran > 0 && (
                      <div className="flex justify-between text-rose-600 dark:text-rose-400 text-[11px] font-medium">
                        <span>Sisa Bayar:</span>
                        <span>{formatRupiah(t.sisa_pembayaran)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedTx(t);
                      setReceiptModalOpen(true);
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Lihat Struk"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Struk</span>
                  </button>

                  <button
                    onClick={() => shareToWhatsApp(t)}
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Kirim Struk WA"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WA</span>
                  </button>

                  {t.status === "Booking" && (
                    <button
                      onClick={() => handleConfirmPickup(t)}
                      className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ambil</span>
                    </button>
                  )}

                  {["Sedang Disewa", "Terlambat"].includes(t.status) && (
                    <button
                      onClick={() => handleFinishTransaction(t)}
                      className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Selesai</span>
                    </button>
                  )}

                  {!["Selesai", "Dibatalkan"].includes(t.status) && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedTx(t);
                          setPayAmount(t.jumlah_dibayar || t.total_bayar);
                          setPayStatus(t.status_pembayaran || "Lunas");
                          setPayModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Bayar</span>
                      </button>
                      <button
                        onClick={() => handleCancelTransaction(t)}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-semibold cursor-pointer"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-sm text-slate-400 dark:text-zinc-500">
              Tidak ada transaksi yang cocok.
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-zinc-200">
              <thead className="bg-slate-50 dark:bg-zinc-950/80 text-slate-500 dark:text-zinc-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Kode</th>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Item Jas</th>
                  <th className="py-3.5 px-4 font-semibold">Tgl Sewa</th>
                  <th className="py-3.5 px-4 font-semibold">Total Bayar</th>
                  <th className="py-3.5 px-4 font-semibold">Status Sewa</th>
                  <th className="py-3.5 px-4 font-semibold">Pembayaran</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {filtered.length > 0 ? (
                  filtered.map((t) => (
                    <tr key={t.id || t.kode_transaksi} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/30 transition">
                      <td className="py-3 px-4 font-mono text-xs text-slate-500 dark:text-zinc-400">
                        {t.kode_transaksi}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 dark:text-zinc-100">{t.nama_customer}</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-500 font-mono">+{t.whatsapp}</p>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 dark:text-zinc-300">
                        {t.items?.map((i) => `${i.namaJas} x${i.jumlah}`).join(", ")}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 dark:text-zinc-300">
                        {formatDateIndo(t.tanggal_sewa)} - {formatDateIndo(t.tanggal_kembali)}
                      </td>
                      <td className="py-3 px-4 font-medium text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(t.total_bayar)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span
                          className={`font-semibold ${
                            t.status_pembayaran === "Lunas"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {t.status_pembayaran}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedTx(t);
                              setReceiptModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
                            title="Struk"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => shareToWhatsApp(t)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900 cursor-pointer"
                            title="Kirim WA"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-slate-400 dark:text-zinc-500">
                      Tidak ada transaksi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Transaksi Baru */}
      {createModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[calc(100dvh-4rem)] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
              <h2 className="font-bold text-slate-900 dark:text-zinc-100 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-500" />
                Buat Transaksi Sewa Baru
              </h2>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateTransaction} className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-slate-700 dark:text-zinc-200">
              {/* Customer Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800/80 space-y-3">
                <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                  Informasi Customer
                </label>
                <div>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value);
                      if (e.target.value) {
                        const found = customers.find((c) => c.customer_id === e.target.value);
                        if (found) {
                          setNewCustName(found.nama);
                          setNewCustWa(found.whatsapp);
                          setNewCustAlamat(found.alamat || "");
                        }
                      } else {
                        setNewCustName("");
                        setNewCustWa("");
                        setNewCustAlamat("");
                      }
                    }}
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 outline-none text-xs"
                  >
                    <option value="">+ Customer Baru / Input Manual</option>
                    {customers.map((c) => (
                      <option key={c.customer_id} value={c.customer_id}>
                        {c.nama} (+{c.whatsapp}) {c.alamat ? `- ${c.alamat}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {!selectedCustomerId && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-zinc-400 mb-1">Nama Customer *</label>
                      <input
                        type="text"
                        required
                        placeholder="Nama lengkap"
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-zinc-400 mb-1">WhatsApp *</label>
                      <input
                        type="text"
                        required
                        placeholder="08123456789"
                        value={newCustWa}
                        onChange={(e) => setNewCustWa(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 text-xs outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-zinc-400 mb-1">Alamat (Opsional)</label>
                      <input
                        type="text"
                        placeholder="Alamat domisili"
                        value={newCustAlamat}
                        onChange={(e) => setNewCustAlamat(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 text-xs outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Tanggal Sewa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Tanggal Mulai Sewa *
                  </label>
                  <input
                    type="date"
                    required
                    value={tanggalSewa}
                    onChange={(e) => setTanggalSewa(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Tanggal Wajib Kembali *
                  </label>
                  <input
                    type="date"
                    required
                    value={tanggalKembali}
                    onChange={(e) => setTanggalKembali(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Item Sewa List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                    Item Jas & Aksesoris yang Disewa
                  </label>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                  >
                    + Tambah Item Lain
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedItems.map((item, index) => (
                    <div
                      key={index}
                      className="bg-slate-50 dark:bg-zinc-950/60 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 text-xs space-y-3"
                    >
                      {/* Item Card Header with Delete/Clear button */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-zinc-800/80">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-zinc-200 text-xs">
                            Item #{index + 1}
                          </span>
                          {item.kodeJas && (
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold">
                              {item.kodeJas}
                            </span>
                          )}
                        </div>

                        {selectedItems.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeItemRow(index)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-bold text-[11px] transition cursor-pointer border border-rose-200/60 dark:border-rose-900/50"
                            title="Hapus baris item ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus Item</span>
                          </button>
                        ) : item.kodeJas ? (
                          <button
                            type="button"
                            onClick={() => removeItemRow(index)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-200/70 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 font-semibold text-[11px] transition cursor-pointer"
                            title="Kosongkan pilihan item"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Kosongkan</span>
                          </button>
                        ) : null}
                      </div>

                      {/* Fields: Picker, Qty, Harga */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-6 min-w-0">
                          <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                            Pilih / Cari Jas atau Aksesoris *
                          </label>
                          <SearchableItemPicker
                            inventory={inventory}
                            selectedCode={item.kodeJas}
                            onSelect={(inv) => {
                              setSelectedItems((prev) => {
                                const next = [...prev];
                                next[index] = {
                                 kodeJas: inv.kode_jas,
                                 namaJas: inv.nama_jas,
                                 jenisJas: inv.jenis_jas,
                                 warna: inv.warna,
                                 ukuran: inv.ukuran,
                                 jumlah: next[index].jumlah || 1,
                                 harga: Number(inv.harga_default || 0),
                                };
                                return next;
                              });
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-2 sm:col-span-6 gap-2.5 min-w-0">
                          <div className="min-w-0">
                            <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                              Qty / Jumlah
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.jumlah}
                              onChange={(e) => updateItemQtyOrPrice(index, "jumlah", Number(e.target.value))}
                              className="w-full min-w-0 box-border bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 outline-none text-center font-mono text-xs shadow-sm focus:border-slate-400 dark:focus:border-zinc-600"
                              placeholder="1"
                            />
                          </div>

                          <div className="min-w-0">
                            <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                              Harga Sewa (Rp)
                            </label>
                            <CurrencyInput
                              value={item.harga}
                              onChange={(val) => updateItemQtyOrPrice(index, "harga", val)}
                              placeholder="0"
                              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 text-slate-900 dark:text-zinc-100 outline-none font-mono text-xs shadow-sm focus:border-slate-400 dark:focus:border-zinc-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="min-w-0">
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                      Potongan / Diskon
                    </label>
                    <CurrencyInput
                      value={potongan}
                      onChange={(val) => setPotongan(val)}
                      placeholder="0"
                      className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 text-slate-900 dark:text-zinc-100 outline-none font-mono text-xs shadow-sm"
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                      Deposit Jaminan
                    </label>
                    <CurrencyInput
                      value={deposit}
                      onChange={(val) => setDeposit(val)}
                      placeholder="0"
                      className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 text-slate-900 dark:text-zinc-100 outline-none font-mono text-xs shadow-sm"
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                      Bayar Sekarang (DP/Lunas)
                    </label>
                    <CurrencyInput
                      value={jumlahDibayar}
                      onChange={(val) => setJumlahDibayar(val)}
                      placeholder="0"
                      className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 text-slate-900 dark:text-zinc-100 outline-none font-mono font-bold text-xs shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">Metode Bayar</label>
                    <select
                      value={metodePembayaran}
                      onChange={(e) => setMetodePembayaran(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 outline-none text-xs shadow-sm"
                    >
                      <option value="Transfer">Transfer BCA / BRI / Mandiri</option>
                      <option value="Cash">Cash / Tunai</option>
                      <option value="QRIS">QRIS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">Catatan Sewa</label>
                    <input
                      type="text"
                      placeholder="Fitting, wisuda, jaminan SIM..."
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 outline-none text-xs shadow-sm"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-zinc-800/80 space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal Item:</span>
                    <span className="font-mono font-semibold">{formatRupiah(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-zinc-100">
                    <span>TOTAL BAYAR:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatRupiah(totalBayar)}</span>
                  </div>
                  {sisaPembayaran > 0 ? (
                    <div className="flex justify-between font-semibold text-rose-600 dark:text-rose-400">
                      <span>Sisa Pembayaran:</span>
                      <span className="font-mono">{formatRupiah(sisaPembayaran)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Status Pembayaran:</span>
                      <span>LUNAS ✓</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit / Action Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold shadow cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Menyimpan Transaksi..." : "Buat Transaksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Pembayaran */}
      {payModalOpen && selectedTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-md max-h-[calc(100dvh-4rem)] sm:max-h-[90vh] flex flex-col p-5 sm:p-6 shadow-2xl overflow-y-auto">
            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 mb-4">
              Update Pembayaran — {selectedTx.kode_transaksi}
            </h2>

            <div className="bg-slate-50 dark:bg-zinc-950/60 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 text-xs space-y-2 mb-4 text-slate-700 dark:text-zinc-300">
              <div className="flex justify-between">
                <span>Total Tagihan:</span>
                <span className="font-bold text-slate-900 dark:text-zinc-100 font-mono">
                  {formatRupiah(selectedTx.total_bayar)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sudah Dibayar:</span>
                <span className="font-mono font-medium">
                  {formatRupiah(selectedTx.jumlah_dibayar || 0)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-rose-600 dark:text-rose-400 border-t border-slate-200 dark:border-zinc-800/80 pt-1.5">
                <span>Sisa Tagihan:</span>
                <span className="font-mono">{formatRupiah(selectedTx.sisa_pembayaran || 0)}</span>
              </div>
            </div>

            <form onSubmit={handleUpdatePayment} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Jumlah Dibayar Sekarang (Kumulatif Rp)
                </label>
                <CurrencyInput
                  value={payAmount}
                  onChange={(val) => setPayAmount(val)}
                  placeholder="0"
                  className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 text-slate-900 dark:text-zinc-100 outline-none font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Status Pembayaran
                </label>
                <select
                  value={payStatus}
                  onChange={(e) => setPayStatus(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 outline-none text-xs"
                >
                  <option value="Lunas">Lunas</option>
                  <option value="DP">DP</option>
                  <option value="Belum Bayar">Belum Bayar</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 font-medium cursor-pointer text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold shadow cursor-pointer text-xs"
                >
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Struk & PDF (Fixed Viewport, Scrollable Body, Persistent Buttons) */}
      {receiptModalOpen && selectedTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-xl max-h-[calc(100dvh-5rem)] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header (Fixed) */}
            <div className="flex justify-between items-center px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
              <h2 className="font-bold text-slate-900 dark:text-zinc-100 text-sm flex items-center gap-2">
                <ReceiptText className="w-4 h-4 text-indigo-500" />
                Struk Transaksi Sewa
              </h2>
              <button
                onClick={() => setReceiptModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Receipt Body */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-50 dark:bg-zinc-950/60">
              <div
                id="printableReceipt"
                className="bg-white text-zinc-950 p-5 sm:p-8 rounded-2xl border border-slate-200 font-sans shadow-sm text-xs space-y-4"
              >
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-center text-slate-900 tracking-tight">
                    Stitch and Moral - Sewa Jas PKY
                  </h1>
                  <p className="text-center text-slate-500 text-xs mt-0.5">Struk Bukti Sewa & Transaksi</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-700 leading-relaxed border-y border-dashed border-slate-200 py-3 text-[11px] sm:text-xs">
                  <div>
                    <p>No: <b>{selectedTx.kode_transaksi}</b></p>
                    <p>Customer: <b>{selectedTx.nama_customer}</b></p>
                    <p>WhatsApp: +{selectedTx.whatsapp || "-"}</p>
                  </div>
                  <div className="text-right">
                    <p>Tgl Sewa: <b>{formatDateIndo(selectedTx.tanggal_sewa)}</b></p>
                    <p>Tgl Kembali: <b>{formatDateIndo(selectedTx.tanggal_kembali)}</b></p>
                    <p>Status Sewa: <b>{selectedTx.status}</b></p>
                  </div>
                </div>

                <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-300 text-slate-800 font-bold">
                      <th className="py-2.5 px-1">Item / Varian</th>
                      <th className="py-2.5 px-1 text-right">Qty</th>
                      <th className="py-2.5 px-1 text-right">Harga Sewa</th>
                      <th className="py-2.5 px-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedTx.items?.map((item, i) => (
                      <tr key={i} className="align-top">
                        <td className="py-2 px-1">
                          <b>{item.namaJas}</b>
                          <p className="text-[10px] text-slate-500">{item.warna || "-"} / {item.ukuran || "-"}</p>
                        </td>
                        <td className="py-2 px-1 text-right font-mono">{item.jumlah}</td>
                        <td className="py-2 px-1 text-right font-mono">{formatRupiah(item.harga)}</td>
                        <td className="py-2 px-1 text-right font-mono font-bold">{formatRupiah(item.harga * item.jumlah)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="space-y-1.5 text-slate-700 leading-relaxed border-t border-slate-200 pt-3 text-[11px] sm:text-xs">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono font-medium">{formatRupiah(selectedTx.subtotal)}</span>
                  </div>
                  {selectedTx.deposit > 0 && (
                    <div className="flex justify-between">
                      <span>Deposit Jaminan:</span>
                      <span className="font-mono">{formatRupiah(selectedTx.deposit)}</span>
                    </div>
                  )}
                  {selectedTx.potongan > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Potongan / Diskon:</span>
                      <span className="font-mono font-medium">-{formatRupiah(selectedTx.potongan)}</span>
                    </div>
                  )}
                  {selectedTx.denda > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Denda Keterlambatan:</span>
                      <span className="font-mono font-medium">+{formatRupiah(selectedTx.denda)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-900 border-y border-slate-200 py-1.5 my-1">
                    <span>TOTAL BAYAR:</span>
                    <span className="font-mono text-emerald-600">{formatRupiah(selectedTx.total_bayar)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Sudah Dibayar:</span>
                    <span className="font-mono font-bold">{formatRupiah(selectedTx.jumlah_dibayar || 0)}</span>
                  </div>

                  {selectedTx.sisa_pembayaran > 0 ? (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>Sisa Pembayaran:</span>
                      <span className="font-mono">{formatRupiah(selectedTx.sisa_pembayaran)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md mt-1">
                      <span>Status Pembayaran:</span>
                      <span>LUNAS ✓</span>
                    </div>
                  )}

                  {selectedTx.catatan && (
                    <p className="text-[11px] text-slate-500 pt-1">
                      <b>Catatan:</b> {selectedTx.catatan}
                    </p>
                  )}
                </div>

                <div className="text-center pt-3 border-t border-dashed border-slate-200 text-[10px] text-slate-500">
                  Terima kasih sudah menyewa di Stitch and Moral. Simpan struk ini sebagai bukti transaksi.
                </div>
              </div>
            </div>

            {/* Modal Action Buttons (Fixed at Bottom - Always Visible) */}
            <div className="px-4 sm:px-6 py-3 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2 shrink-0 pb-[max(0.75rem,calc(env(safe-area-inset-bottom)+0.35rem))]">
              <button
                onClick={() => printReceipt(selectedTx)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-xs font-bold flex items-center justify-center gap-2 transition shadow cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Struk (Layout Full A4)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={downloadReceiptImage}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Gambar PNG</span>
                </button>

                <button
                  onClick={() => shareToWhatsApp(selectedTx)}
                  disabled={sharingWa}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-60"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{sharingWa ? "Menyiapkan Struk..." : "Kirim Struk + Gambar WA"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

