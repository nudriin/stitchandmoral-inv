"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { formatRupiah, formatDateIndo, calculateRentalDays } from "@/lib/utils";
import {
  checkBookingConflicts,
  getItemBookingAvailability,
} from "@/lib/bookingValidation";
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
  AlertCircle,
  LayoutGrid,
  List,
  MessageCircle,
  Download,
  FileText,
  ChevronDown,
  Check,
  Tag,
  Trash2,
  RotateCcw,
  Eye,
  Edit2,
  ArrowUpDown,
  X,
  MapPin,
} from "lucide-react";
import type { Transaksi, Inventori, Customer, TransactionItem } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { generateReceiptCanvas } from "@/lib/receiptCanvas";
import { generateReceiptPdf } from "@/lib/receiptPdf";

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
  startDate?: string;
  returnDate?: string;
  transactions?: Transaksi[];
  excludeTransactionId?: string;
}

function SearchableItemPicker({
  inventory,
  selectedCode,
  onSelect,
  startDate,
  returnDate,
  transactions = [],
  excludeTransactionId,
}: SearchableItemPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedItem = inventory.find((i) => i.kode_jas === selectedCode);

  const selectedAvailability = useMemo(() => {
    if (!selectedItem || !startDate || !returnDate) return null;
    return getItemBookingAvailability({
      item: selectedItem,
      startDate,
      returnDate,
      transactions,
      excludeTransactionId,
    });
  }, [selectedItem, startDate, returnDate, transactions, excludeTransactionId]);

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
        className={`w-full bg-white dark:bg-zinc-900 border rounded-xl px-3 py-2 text-left text-xs text-slate-900 dark:text-zinc-100 flex items-center justify-between gap-2 transition shadow-sm cursor-pointer ${
          selectedAvailability?.isFullyBooked
            ? "border-rose-400 bg-rose-50/30 dark:border-rose-800 dark:bg-rose-950/20"
            : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
        }`}
      >
        {selectedItem ? (
          <div className="truncate flex-1">
            <span className="font-semibold text-slate-900 dark:text-zinc-100">
              {selectedItem.nama_jas}
            </span>
            <span className="text-slate-500 dark:text-zinc-400 ml-1.5 text-[11px]">
              ({selectedItem.warna || "-"}/{selectedItem.ukuran || "-"})
            </span>
            {selectedAvailability ? (
              <span
                className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  selectedAvailability.isFullyBooked
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                }`}
              >
                {selectedAvailability.isFullyBooked
                  ? "Sudah Dibooking"
                  : `Tersedia: ${selectedAvailability.availableQty}/${selectedAvailability.totalStock}`}
              </span>
            ) : (
              <span className="text-slate-400 dark:text-zinc-500 ml-1.5 text-[11px]">
                • Stok: {selectedItem.stok_tersedia}
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            Cari jas, celana, dasi, ukuran...
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Warning if selected item is already booked */}
      {selectedAvailability?.isFullyBooked && (
        <p className="mt-1 text-[10.5px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-2 py-0.5 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>
            Jas ini sudah dibooking pada tanggal tersebut oleh{" "}
            {selectedAvailability.conflictingBookings.map((b) => b.nama_customer).join(", ")}!
          </span>
        </p>
      )}

      {/* Popover Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-full sm:min-w-[340px] max-w-[460px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-64 animate-in fade-in zoom-in-95 duration-100">
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
                className="text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer flex items-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* List of Items */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
            {filtered.length > 0 ? (
              filtered.map((inv) => {
                const isSelected = inv.kode_jas === selectedCode;
                const availability = startDate && returnDate
                  ? getItemBookingAvailability({
                      item: inv,
                      startDate,
                      returnDate,
                      transactions,
                      excludeTransactionId,
                    })
                  : null;

                const isFullyBooked = availability
                  ? availability.isFullyBooked
                  : inv.stok_tersedia <= 0;

                return (
                  <button
                    key={inv.id || inv.kode_jas}
                    type="button"
                    onClick={() => {
                      if (isFullyBooked) {
                        const who = availability?.conflictingBookings
                          ?.map((b) => `${b.nama_customer} (${formatDateIndo(b.tanggal_sewa)} - ${formatDateIndo(b.tanggal_kembali)})`)
                          .join(", ");
                        alert(
                          `⚠️ Tidak dapat memilih jas ini!\n\n"${inv.nama_jas}" sudah dibooking/disewa penuh pada rentang tanggal tersebut${
                            who ? ` oleh: ${who}` : ""
                          }.\n\nSilakan pilih jas lain atau ganti tanggal sewa.`
                        );
                        return;
                      }
                      onSelect(inv);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800"
                        : isFullyBooked
                        ? "opacity-60 bg-slate-50 dark:bg-zinc-950/40 hover:opacity-100"
                        : "hover:bg-slate-50 dark:hover:bg-zinc-800/60 text-slate-800 dark:text-zinc-200"
                    }`}
                  >
                    <div className="truncate flex-1">
                      <p className={`font-bold truncate ${isFullyBooked ? "text-slate-500 line-through" : ""}`}>
                        {inv.nama_jas}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        {inv.warna || "-"} • Ukuran: <b className="text-slate-700 dark:text-zinc-300">{inv.ukuran || "-"}</b> • {inv.jenis_jas}
                      </p>
                      {isFullyBooked && availability?.conflictingBookings?.length ? (
                        <p className="text-[10px] text-rose-500 font-semibold truncate mt-0.5">
                          Dibooking: {availability.conflictingBookings[0].nama_customer} (
                          {formatDateIndo(availability.conflictingBookings[0].tanggal_sewa).slice(0, 6)} -{" "}
                          {formatDateIndo(availability.conflictingBookings[0].tanggal_kembali).slice(0, 6)})
                        </p>
                      ) : null}
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <p className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(inv.harga_default)}
                      </p>
                      {availability ? (
                        <span
                          className={`text-[9.5px] px-1.5 py-0.5 rounded-md font-bold inline-block mt-0.5 ${
                            availability.isFullyBooked
                              ? "bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400 border border-rose-200 dark:border-rose-900"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                          }`}
                        >
                          {availability.isFullyBooked
                            ? "Sudah Dibooking"
                            : `Sisa: ${availability.availableQty}/${availability.totalStock}`}
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                            inv.stok_tersedia <= 0
                              ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                              : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
                          }`}
                        >
                          Stok: {inv.stok_tersedia}
                        </span>
                      )}
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
  const [sortBy, setSortBy] = useState<string>("date-desc");

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [sharingWa, setSharingWa] = useState(false);
  const [sharingPdf, setSharingPdf] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaksi | null>(null);

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetailTx, setSelectedDetailTx] = useState<Transaksi | null>(null);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaksi | null>(null);
  const [editCustName, setEditCustName] = useState("");
  const [editCustWa, setEditCustWa] = useState("");
  const [editTanggalSewa, setEditTanggalSewa] = useState("");
  const [editTanggalKembali, setEditTanggalKembali] = useState("");
  const [editPotongan, setEditPotongan] = useState(0);
  const [editDeposit, setEditDeposit] = useState(0);
  const [editDenda, setEditDenda] = useState(0);
  const [editJumlahDibayar, setEditJumlahDibayar] = useState(0);
  const [editStatusPembayaran, setEditStatusPembayaran] = useState("Lunas");
  const [editStatus, setEditStatus] = useState("Sedang Disewa");
  const [editMetodePembayaran, setEditMetodePembayaran] = useState("Transfer");
  const [editCatatan, setEditCatatan] = useState("");
  const [editSelectedItems, setEditSelectedItems] = useState<TransactionItem[]>([]);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<Transaksi | null>(null);
  const [deleting, setDeleting] = useState(false);

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
  const createRentalDays = useMemo(
    () => calculateRentalDays(tanggalSewa, tanggalKembali),
    [tanggalSewa, tanggalKembali]
  );

  const editRentalDays = useMemo(
    () => calculateRentalDays(editTanggalSewa, editTanggalKembali),
    [editTanggalSewa, editTanggalKembali]
  );

  const subtotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.harga * item.jumlah, 0),
    [selectedItems]
  );
  const totalBayar = Math.max(0, subtotal - potongan);
  const sisaPembayaran = Math.max(0, totalBayar - jumlahDibayar);

  // Calculations for edit transaction
  const editSubtotal = useMemo(
    () => editSelectedItems.reduce((sum, item) => sum + item.harga * item.jumlah, 0),
    [editSelectedItems]
  );
  const editTotalBayar = Math.max(0, editSubtotal - editPotongan) + editDenda;
  const editSisaPembayaran = Math.max(0, editTotalBayar - editJumlahDibayar);

  function handleTanggalSewaChange(newStart: string) {
    setTanggalSewa(newStart);
    let newEnd = tanggalKembali;
    if (newEnd && newEnd < newStart) {
      newEnd = newStart;
      setTanggalKembali(newStart);
    }
    const newDays = calculateRentalDays(newStart, newEnd);
    setSelectedItems((prev) =>
      prev.map((item) => {
        const daily = item.harga_per_hari ?? (item.durasi_hari ? Math.round(item.harga / item.durasi_hari) : item.harga);
        return {
          ...item,
          harga_per_hari: daily,
          durasi_hari: newDays,
          harga: daily * newDays,
        };
      })
    );
  }

  function handleTanggalKembaliChange(newEnd: string) {
    setTanggalKembali(newEnd);
    const newDays = calculateRentalDays(tanggalSewa, newEnd);
    setSelectedItems((prev) =>
      prev.map((item) => {
        const daily = item.harga_per_hari ?? (item.durasi_hari ? Math.round(item.harga / item.durasi_hari) : item.harga);
        return {
          ...item,
          harga_per_hari: daily,
          durasi_hari: newDays,
          harga: daily * newDays,
        };
      })
    );
  }

  function handleEditTanggalSewaChange(newStart: string) {
    setEditTanggalSewa(newStart);
    let newEnd = editTanggalKembali;
    if (newEnd && newEnd < newStart) {
      newEnd = newStart;
      setEditTanggalKembali(newStart);
    }
    const newDays = calculateRentalDays(newStart, newEnd);
    setEditSelectedItems((prev) =>
      prev.map((item) => {
        const daily = item.harga_per_hari ?? (item.durasi_hari ? Math.round(item.harga / item.durasi_hari) : item.harga);
        return {
          ...item,
          harga_per_hari: daily,
          durasi_hari: newDays,
          harga: daily * newDays,
        };
      })
    );
  }

  function handleEditTanggalKembaliChange(newEnd: string) {
    setEditTanggalKembali(newEnd);
    const newDays = calculateRentalDays(editTanggalSewa, newEnd);
    setEditSelectedItems((prev) =>
      prev.map((item) => {
        const daily = item.harga_per_hari ?? (item.durasi_hari ? Math.round(item.harga / item.durasi_hari) : item.harga);
        return {
          ...item,
          harga_per_hari: daily,
          durasi_hari: newDays,
          harga: daily * newDays,
        };
      })
    );
  }

  function updateItemDailyPrice(index: number, dailyPrice: number) {
    setSelectedItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        harga_per_hari: dailyPrice,
        durasi_hari: createRentalDays,
        harga: dailyPrice * createRentalDays,
      };
      return next;
    });
  }

  function updateEditItemDailyPrice(index: number, dailyPrice: number) {
    setEditSelectedItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        harga_per_hari: dailyPrice,
        durasi_hari: editRentalDays,
        harga: dailyPrice * editRentalDays,
      };
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = transactions.filter((t) => {
      const matchSearch =
        !q ||
        t.kode_transaksi.toLowerCase().includes(q) ||
        t.nama_customer.toLowerCase().includes(q) ||
        t.whatsapp?.includes(q) ||
        t.items?.some((i) => i.namaJas?.toLowerCase().includes(q));

      const matchStatus = statusFilter === "Semua" || t.status === statusFilter;

      return matchSearch && matchStatus;
    });

    return result.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.nama_customer.localeCompare(b.nama_customer);
        case "name-desc":
          return b.nama_customer.localeCompare(a.nama_customer);
        case "total-desc":
          return Number(b.total_bayar || 0) - Number(a.total_bayar || 0);
        case "total-asc":
          return Number(a.total_bayar || 0) - Number(b.total_bayar || 0);
        case "return-asc":
          return String(a.tanggal_kembali || "").localeCompare(String(b.tanggal_kembali || ""));
        case "date-asc":
          return String(a.tanggal_sewa || "").localeCompare(String(b.tanggal_sewa || ""));
        case "unpaid-desc":
          return Number(b.sisa_pembayaran || 0) - Number(a.sisa_pembayaran || 0);
        case "date-desc":
        default:
          return String(b.tanggal_sewa || "").localeCompare(String(a.tanggal_sewa || ""));
      }
    });
  }, [transactions, search, statusFilter, sortBy]);

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
    const daily = Number(inv.harga_default || 0);

    setSelectedItems((prev) => {
      const next = [...prev];
      next[index] = {
        kodeJas: inv.kode_jas,
        namaJas: inv.nama_jas,
        jenisJas: inv.jenis_jas,
        warna: inv.warna,
        ukuran: inv.ukuran,
        jumlah: next[index]?.jumlah || 1,
        harga_per_hari: daily,
        durasi_hari: createRentalDays,
        harga: daily * createRentalDays,
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
      if (tanggalKembali < tanggalSewa) {
        alert("Tanggal wajib kembali tidak boleh sebelum tanggal mulai sewa.");
        setSaving(false);
        return;
      }

      const validItems = selectedItems.filter((i) => i.kodeJas && i.jumlah > 0);
      if (validItems.length === 0) {
        alert("Pilih minimal 1 item sewa.");
        setSaving(false);
        return;
      }

      // Check double booking conflicts across all items
      const conflicts = checkBookingConflicts({
        startDate: tanggalSewa,
        returnDate: tanggalKembali,
        items: validItems,
        transactions,
        inventory,
      });

      if (conflicts.length > 0) {
        const details = conflicts
          .map((c) => {
            const bookedBy = c.conflictingBookings
              .map(
                (b) =>
                  `${b.nama_customer} (${b.kode_transaksi}, ${formatDateIndo(b.tanggal_sewa).slice(0, 6)} - ${formatDateIndo(b.tanggal_kembali)})`
              )
              .join(", ");
            return `• ${c.namaJas}: Sisa kuota ${c.availableQty} unit dari total ${c.totalStock} unit. Sudah dibooking oleh: ${bookedBy}`;
          })
          .join("\n\n");

        alert(
          `⚠️ BENTROK BOOKING (DOUBLE BOOKING TERDETEKSI):\n\nItem berikut tidak dapat disewa karena kuota sudah penuh pada rentang tanggal tersebut:\n\n${details}\n\nSilakan pilih tanggal lain atau ganti item sewa.`
        );
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

  function handleOpenDetail(tx: Transaksi) {
    setSelectedDetailTx(tx);
    setDetailModalOpen(true);
  }

  function handleOpenEdit(tx: Transaksi) {
    const duration = calculateRentalDays(tx.tanggal_sewa, tx.tanggal_kembali);
    setEditingTx(tx);
    setEditCustName(tx.nama_customer || "");
    setEditCustWa(tx.whatsapp || "");
    setEditTanggalSewa(tx.tanggal_sewa || "");
    setEditTanggalKembali(tx.tanggal_kembali || "");
    setEditPotongan(Number(tx.potongan) || 0);
    setEditDeposit(Number(tx.deposit) || 0);
    setEditDenda(Number(tx.denda) || 0);
    setEditJumlahDibayar(Number(tx.jumlah_dibayar) || 0);
    setEditStatusPembayaran(tx.status_pembayaran || "Lunas");
    setEditStatus(tx.status || "Sedang Disewa");
    setEditMetodePembayaran(tx.metode_pembayaran || "Transfer");
    setEditCatatan(tx.catatan || "");
    setEditSelectedItems(
      Array.isArray(tx.items) && tx.items.length > 0
        ? tx.items.map((i) => {
            const itemDays = i.durasi_hari || duration;
            const daily = i.harga_per_hari ?? (itemDays ? Math.round(i.harga / itemDays) : i.harga);
            return {
              ...i,
              harga_per_hari: daily,
              durasi_hari: itemDays,
              harga: i.harga || daily * itemDays,
            };
          })
        : [{ kodeJas: "", namaJas: "", jenisJas: "Jas", warna: "", ukuran: "", jumlah: 1, harga: 0, harga_per_hari: 0, durasi_hari: duration }]
    );
    setEditModalOpen(true);
  }

  function addEditItemRow() {
    setEditSelectedItems((prev) => [
      ...prev,
      { kodeJas: "", namaJas: "", jenisJas: "Jas", warna: "", ukuran: "", jumlah: 1, harga: 0, harga_per_hari: 0, durasi_hari: editRentalDays },
    ]);
  }

  function removeEditItemRow(index: number) {
    if (editSelectedItems.length <= 1) {
      setEditSelectedItems([
        { kodeJas: "", namaJas: "", jenisJas: "Jas", warna: "", ukuran: "", jumlah: 1, harga: 0, harga_per_hari: 0, durasi_hari: editRentalDays },
      ]);
      return;
    }
    setEditSelectedItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleEditItemChange(index: number, kodeJas: string) {
    const inv = inventory.find((i) => i.kode_jas === kodeJas);
    if (!inv) return;
    const daily = Number(inv.harga_default || 0);

    setEditSelectedItems((prev) => {
      const next = [...prev];
      next[index] = {
        kodeJas: inv.kode_jas,
        namaJas: inv.nama_jas,
        jenisJas: inv.jenis_jas,
        warna: inv.warna,
        ukuran: inv.ukuran,
        jumlah: next[index]?.jumlah || 1,
        harga_per_hari: daily,
        durasi_hari: editRentalDays,
        harga: daily * editRentalDays,
      };
      return next;
    });
  }

  function updateEditItemQtyOrPrice(index: number, field: "jumlah" | "harga", val: number) {
    setEditSelectedItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTx) return;
    setSaving(true);

    try {
      if (editTanggalKembali < editTanggalSewa) {
        alert("Tanggal wajib kembali tidak boleh sebelum tanggal mulai sewa.");
        setSaving(false);
        return;
      }

      const validItems = editSelectedItems.filter((i) => i.kodeJas && i.jumlah > 0);
      if (validItems.length === 0) {
        alert("Pilih minimal 1 item sewa.");
        setSaving(false);
        return;
      }

      // Check double booking conflicts, excluding the current transaction being edited
      const conflicts = checkBookingConflicts({
        startDate: editTanggalSewa,
        returnDate: editTanggalKembali,
        items: validItems,
        transactions,
        inventory,
        excludeTransactionId: editingTx.id,
      });

      if (conflicts.length > 0) {
        const details = conflicts
          .map((c) => {
            const bookedBy = c.conflictingBookings
              .map(
                (b) =>
                  `${b.nama_customer} (${b.kode_transaksi}, ${formatDateIndo(b.tanggal_sewa).slice(0, 6)} - ${formatDateIndo(b.tanggal_kembali)})`
              )
              .join(", ");
            return `• ${c.namaJas}: Sisa kuota ${c.availableQty} unit dari total ${c.totalStock} unit. Sudah dibooking oleh: ${bookedBy}`;
          })
          .join("\n\n");

        alert(
          `⚠️ BENTROK BOOKING (DOUBLE BOOKING TERDETEKSI):\n\nItem berikut tidak dapat disimpan karena kuota sudah penuh pada rentang tanggal tersebut:\n\n${details}\n\nSilakan pilih tanggal lain atau ganti item sewa.`
        );
        setSaving(false);
        return;
      }

      const totalItemsCount = validItems.reduce((acc, i) => acc + Number(i.jumlah), 0);
      const sub = validItems.reduce((sum, item) => sum + item.harga * item.jumlah, 0);
      const total = Math.max(0, sub - editPotongan) + editDenda;
      const sisa = Math.max(0, total - editJumlahDibayar);

      let cleanWa = editCustWa.replace(/\D/g, "");
      if (cleanWa.startsWith("0")) cleanWa = "62" + cleanWa.slice(1);
      else if (!cleanWa.startsWith("62") && cleanWa.length > 5) cleanWa = "62" + cleanWa;

      const payload = {
        nama_customer: editCustName,
        whatsapp: cleanWa,
        tanggal_sewa: editTanggalSewa,
        tanggal_kembali: editTanggalKembali,
        items: validItems,
        jumlah_total: totalItemsCount,
        subtotal: sub,
        potongan: editPotongan,
        deposit: editDeposit,
        denda: editDenda,
        total_bayar: total,
        jumlah_dibayar: editJumlahDibayar,
        sisa_pembayaran: sisa,
        status_pembayaran: editStatusPembayaran,
        status: editStatus,
        metode_pembayaran: editMetodePembayaran,
        catatan: editCatatan,
      };

      const { data, error } = await supabase
        .from("transaksi")
        .update(payload)
        .eq("id", editingTx.id)
        .select()
        .single();

      if (error) {
        alert("Gagal mengupdate transaksi: " + error.message);
        setSaving(false);
        return;
      }

      // Sync inventory stock if status changed
      const oldActive = ["Sedang Disewa", "Booking", "Terlambat"].includes(editingTx.status);
      const newActive = ["Sedang Disewa", "Booking", "Terlambat"].includes(editStatus);

      if (oldActive && !newActive) {
        // Status changed from active to finished/cancelled -> return all old items to stock
        for (const itm of editingTx.items || []) {
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
      } else if (!oldActive && newActive) {
        // Status changed from finished to active -> deduct new items from stock
        for (const itm of validItems) {
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

      setTransactions((prev) => prev.map((t) => (t.id === editingTx.id ? (data as Transaksi) : t)));
      if (selectedDetailTx && selectedDetailTx.id === editingTx.id) {
        setSelectedDetailTx(data as Transaksi);
      }
      setEditModalOpen(false);
    } catch (err: any) {
      alert("Terjadi kesalahan: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  }

  function handleOpenDelete(tx: Transaksi) {
    setTxToDelete(tx);
    setDeleteModalOpen(true);
  }

  async function handleConfirmDelete() {
    if (!txToDelete) return;
    setDeleting(true);

    try {
      // Revert stock if transaction was active/rented
      if (["Sedang Disewa", "Terlambat"].includes(txToDelete.status) && Array.isArray(txToDelete.items)) {
        for (const itm of txToDelete.items) {
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

      const { error } = await supabase.from("transaksi").delete().eq("id", txToDelete.id);
      if (error) {
        alert("Gagal menghapus transaksi: " + error.message);
        setDeleting(false);
        return;
      }

      setTransactions((prev) => prev.filter((t) => t.id !== txToDelete.id));
      if (selectedDetailTx && selectedDetailTx.id === txToDelete.id) {
        setDetailModalOpen(false);
        setSelectedDetailTx(null);
      }
      setDeleteModalOpen(false);
      setTxToDelete(null);
    } catch (err: any) {
      alert("Terjadi kesalahan saat menghapus: " + (err.message || err));
    } finally {
      setDeleting(false);
    }
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

    const message = `Halo Kak ${tx.nama_customer}, berikut bukti struk sewa jas dari *Stitch & Moral*:

📄 *No. Transaksi:* ${tx.kode_transaksi}
📅 *Sewa:* ${formatDateIndo(tx.tanggal_sewa)} s/d ${formatDateIndo(tx.tanggal_kembali)}
💰 *Total:* ${formatRupiah(tx.total_bayar)} (${tx.status_pembayaran === "Lunas" ? "LUNAS ✓" : `Sisa ${formatRupiah(tx.sisa_pembayaran)}`})

File struk resmi terlampir. Terima kasih! 🙏`;

    setSharingWa(true);
    try {
      const canvas = generateReceiptCanvas(tx);
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
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.warn("Native share failed or user dismissed:", err);
      }
    } finally {
      setSharingWa(false);
    }

    // Direct WhatsApp fallback: Also trigger automatic receipt image download
    downloadReceiptImage();
    const cleanPhone = tx.whatsapp.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("0") ? `62${cleanPhone.slice(1)}` : cleanPhone.startsWith("62") ? cleanPhone : `62${cleanPhone}`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, "_blank");
  }

  async function sharePdfToWhatsApp(tx: Transaksi) {
    if (!tx.whatsapp) {
      alert("Nomor WhatsApp tidak tersedia.");
      return;
    }

    const message = `Halo Kak ${tx.nama_customer}, berikut bukti dokumen struk sewa jas (PDF) dari *Stitch & Moral*:

📄 *No. Transaksi:* ${tx.kode_transaksi}
📅 *Sewa:* ${formatDateIndo(tx.tanggal_sewa)} s/d ${formatDateIndo(tx.tanggal_kembali)}
💰 *Total:* ${formatRupiah(tx.total_bayar)} (${tx.status_pembayaran === "Lunas" ? "LUNAS ✓" : `Sisa ${formatRupiah(tx.sisa_pembayaran)}`})

Dokumen PDF resmi terlampir. Terima kasih! 🙏`;

    setSharingPdf(true);
    try {
      const doc = generateReceiptPdf(tx);
      const blob = doc.output("blob");
      const file = new File([blob], `Struk_${tx.kode_transaksi}.pdf`, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Struk Sewa Jas - ${tx.kode_transaksi}`,
          text: message,
        });
        setSharingPdf(false);
        return;
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.warn("Native PDF share failed or dismissed:", err);
      }
    } finally {
      setSharingPdf(false);
    }

    // Fallback: Download PDF & open WhatsApp link
    downloadPdfReceipt();
    const cleanPhone = tx.whatsapp.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("0") ? `62${cleanPhone.slice(1)}` : cleanPhone.startsWith("62") ? cleanPhone : `62${cleanPhone}`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, "_blank");
  }

  function downloadPdfReceipt() {
    if (!selectedTx) return;
    try {
      const doc = generateReceiptPdf(selectedTx);
      doc.save(`Struk_${selectedTx.kode_transaksi || "Sewa"}.pdf`);
    } catch (err) {
      console.error("Gagal mendownload PDF struk:", err);
      alert("Gagal mendownload PDF struk.");
    }
  }

  function printReceipt(tx: Transaksi) {
    const duration = calculateRentalDays(tx.tanggal_sewa, tx.tanggal_kembali);
    const rows = (tx.items || [])
      .map((item) => {
        const days = item.durasi_hari || duration;
        const daily = item.harga_per_hari || (days ? Math.round(item.harga / days) : item.harga);
        return `
        <tr>
          <td>
            <div style="font-weight:700; color:#0f172a; font-size:12px">${item.namaJas}</div>
            <div style="color:#64748b; font-size:10.5px">${item.warna || "-"} • Ukuran ${item.ukuran || "-"} (${days} Hari)</div>
          </td>
          <td style="text-align:center; font-family:'Roboto', sans-serif; font-size:12px">${item.jumlah}</td>
          <td style="text-align:right; font-family:'Roboto', sans-serif; font-size:12px">${formatRupiah(daily)}/hr</td>
          <td style="text-align:right; font-weight:700; font-family:'Roboto', sans-serif; font-size:12px">${formatRupiah(item.harga * item.jumlah)}</td>
        </tr>
      `;
      })
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
          <title>Invoice & Struk Sewa - ${tx.kode_transaksi}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body {
              font-family: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              margin: 0;
              padding: 20px;
              color: #0f172a;
              background: #fff;
              font-size: 12px;
              line-height: 1.5;
            }
            .invoice-box {
              max-width: 680px;
              margin: 0 auto;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 24px 28px;
            }
            .brand-header {
              text-align: center;
              margin-bottom: 12px;
            }
            .brand-title {
              font-size: 20px;
              font-weight: 900;
              letter-spacing: 1px;
              color: #0f172a;
              margin: 0;
            }
            .brand-sub {
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 1.5px;
              color: #64748b;
              margin-top: 2px;
            }
            .single-divider {
              border-top: 1px solid #e2e8f0;
              margin: 12px 0 16px;
            }
            .grid-meta {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              font-size: 11.5px;
              padding-bottom: 12px;
              border-bottom: 1px solid #f1f5f9;
            }
            .meta-label {
              color: #64748b;
              font-size: 10px;
              font-weight: 500;
            }
            .meta-value {
              color: #0f172a;
              font-weight: 700;
              font-size: 12.5px;
              margin-bottom: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 14px 0;
            }
            th {
              color: #64748b;
              padding: 6px 8px;
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 0.5px;
              border-top: 1px solid #cbd5e1;
              border-bottom: 1px solid #e2e8f0;
              text-align: left;
            }
            td {
              padding: 8px 8px;
              border-bottom: 1px solid #f8fafc;
              vertical-align: top;
            }
            .financial-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 6px;
              font-size: 11.5px;
            }
            .financial-table td {
              padding: 3px 8px;
              border: none;
            }
            .total-banner {
              background: #0f172a;
              color: #fff;
              font-weight: bold;
              border-radius: 6px;
              padding: 8px 12px;
              margin: 10px 0;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 12px;
            }
            .total-banner span:last-child {
              font-size: 15px;
              color: #34d399;
              font-weight: 900;
            }
            .terms-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 10px 14px;
              margin-top: 18px;
              font-size: 10px;
              color: #475569;
              line-height: 1.5;
            }
            .terms-title {
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 4px;
              font-size: 10px;
            }
            .footer-info {
              text-align: center;
              margin-top: 16px;
              font-size: 9.5px;
              color: #64748b;
            }
            @media print {
              body {
                padding: 0;
              }
              .invoice-box {
                border: none;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="brand-header">
              <h1 class="brand-title">STITCH & MORAL</h1>
              <div class="brand-sub">SEWA JAS & TUXEDO PALANGKARAYA</div>
            </div>

            <div class="single-divider"></div>

            <div class="grid-meta">
              <div>
                <div class="meta-label">No. Transaksi</div>
                <div class="meta-value">${tx.kode_transaksi}</div>

                <div class="meta-label">Customer</div>
                <div class="meta-value">${tx.nama_customer}</div>
                <div style="color:#64748b; font-size:10.5px">WhatsApp: +${tx.whatsapp || "-"}</div>
              </div>
              <div style="text-align:right">
                <div class="meta-label">Tgl Mulai Sewa</div>
                <div class="meta-value" style="font-weight:500">${formatDateIndo(tx.tanggal_sewa)}</div>

                <div class="meta-label">Tgl Wajib Kembali</div>
                <div class="meta-value" style="color:#0f172a">${formatDateIndo(tx.tanggal_kembali)}</div>
                <div style="color:#64748b; font-size:10.5px">Durasi: <b>${duration} Hari</b> • Status: <b>${tx.status}</b></div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>ITEM / VARIAN</th>
                  <th style="text-align:center">QTY</th>
                  <th style="text-align:right">HARGA / HARI</th>
                  <th style="text-align:right">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>

            <table class="financial-table">
              <tr>
                <td style="color:#64748b">Subtotal Sewa</td>
                <td style="text-align:right" class="font-medium">${formatRupiah(tx.subtotal)}</td>
              </tr>
              ${tx.deposit > 0 ? `
              <tr>
                <td style="color:#64748b">Deposit Jaminan</td>
                <td style="text-align:right">${formatRupiah(tx.deposit)}</td>
              </tr>` : ""}
              ${tx.potongan > 0 ? `
              <tr style="color:#059669">
                <td>Potongan Diskon</td>
                <td style="text-align:right; font-weight:700">-${formatRupiah(tx.potongan)}</td>
              </tr>` : ""}
              ${tx.denda > 0 ? `
              <tr style="color:#e11d48">
                <td>Denda Keterlambatan</td>
                <td style="text-align:right; font-weight:700">+${formatRupiah(tx.denda)}</td>
              </tr>` : ""}
            </table>

            <div class="total-banner">
              <span>TOTAL PEMBAYARAN</span>
              <span>${formatRupiah(tx.total_bayar)}</span>
            </div>

            <table class="financial-table">
              <tr>
                <td style="color:#64748b">Sudah Dibayar</td>
                <td style="text-align:right; font-weight:700">${formatRupiah(tx.jumlah_dibayar || 0)}</td>
              </tr>
              ${tx.sisa_pembayaran > 0 ? `
              <tr style="color:#e11d48; font-weight:700">
                <td>Sisa Pembayaran</td>
                <td style="text-align:right">${formatRupiah(tx.sisa_pembayaran)}</td>
              </tr>` : `
              <tr>
                <td colspan="2" style="text-align:center; background:#ecfdf5; color:#047857; font-weight:700; padding:5px; border-radius:4px; font-size:10.5px">
                  ✓ STATUS: PEMBAYARAN SUDAH LUNAS
                </td>
              </tr>`}
              ${tx.catatan ? `
              <tr>
                <td colspan="2" style="color:#64748b; font-style:italic; padding-top:4px">
                  Catatan: ${tx.catatan}
                </td>
              </tr>` : ""}
            </table>

            <div class="terms-box">
              <div class="terms-title">SYARAT & KETENTUAN SEWA:</div>
              <div>1. Wajib menitipkan kartu identitas asli (KTP/SIM) selama masa sewa.</div>
              <div>2. Sistem sewa H-1 ambil & H+1 kembali. Keterlambatan dikenakan denda harian.</div>
              <div>3. Dilarang mencuci / menyetrika jas sendiri (laundry ditangani toko).</div>
              <div>4. Kerusakan / kehilangan jas & aksesoris dikenakan biaya penggantian.</div>
              <div>5. Harap cek kondisi jas saat serah terima & simpan struk ini.</div>
            </div>

            <div class="footer-info">
              <div>Stitch & Moral &nbsp;•&nbsp; WA: 081549193834 &nbsp;•&nbsp; Jl. Pangeran Samudera Induk No. 11, Palangka Raya</div>
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

  function downloadReceiptImage() {
    if (!selectedTx) return;
    try {
      const canvas = generateReceiptCanvas(selectedTx);
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `Struk_${selectedTx.kode_transaksi || "Sewa"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Gagal mendownload gambar struk:", err);
      alert("Gagal mendownload gambar struk.");
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

          <Link
            href="/kalender"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 font-semibold text-xs sm:text-sm transition shadow-2xs"
          >
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>Kalender</span>
          </Link>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold text-sm transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Transaksi Baru</span>
          </button>
        </div>
      </div>

      {/* Search, Sorting & Status Filters */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Cari transaksi, customer, nomor WA, jas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 focus:border-slate-400 dark:focus:border-zinc-500 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none shadow-xs"
            />
          </div>

          {/* Sorting Dropdown */}
          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold py-2.5 px-3.5 pr-8 rounded-xl shadow-xs focus:ring-2 focus:ring-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="date-desc">Tanggal Sewa: Terbaru</option>
              <option value="date-asc">Tanggal Sewa: Terlama</option>
              <option value="return-asc">Tanggal Kembali: Terdekat</option>
              <option value="name-asc">Nama Customer: A - Z</option>
              <option value="name-desc">Nama Customer: Z - A</option>
              <option value="total-desc">Total Bayar: Tertinggi</option>
              <option value="total-asc">Total Bayar: Terendah</option>
              <option value="unpaid-desc">Sisa Tagihan: Belum Lunas</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {["Semua", "Sedang Disewa", "Booking", "Selesai", "Terlambat", "Dibatalkan"].map(
            (st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
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
                className="bg-white dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-zinc-700 transition shadow-sm space-y-4"
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
                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenDetail(t)}
                      className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      title="Lihat Detail Transaksi"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detail</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      title="Edit Transaksi (Penyesuaian Data)"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

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
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => shareToWhatsApp(t)}
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      title="Kirim Struk WA"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
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

                    {t.sisa_pembayaran > 0 && !["Selesai", "Dibatalkan"].includes(t.status) && (
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
                    )}

                    <button
                      onClick={() => handleOpenDelete(t)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold cursor-pointer"
                      title="Hapus Transaksi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                            onClick={() => handleOpenDetail(t)}
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400 dark:hover:bg-indigo-900 cursor-pointer"
                            title="Detail Transaksi"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
                            title="Edit Transaksi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
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
                          <button
                            onClick={() => handleOpenDelete(t)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-400 dark:hover:bg-rose-900 cursor-pointer"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
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
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                    Periode & Durasi Sewa
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-100 dark:border-indigo-900/50">
                    <Clock className="w-3.5 h-3.5" />
                    Durasi: {createRentalDays} Hari
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                      Tanggal Mulai Sewa *
                    </label>
                    <input
                      type="date"
                      required
                      value={tanggalSewa}
                      onChange={(e) => handleTanggalSewaChange(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 text-xs outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                      Tanggal Wajib Kembali *
                    </label>
                    <input
                      type="date"
                      required
                      min={tanggalSewa}
                      value={tanggalKembali}
                      onChange={(e) => handleTanggalKembaliChange(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 text-xs outline-none font-mono"
                    />
                  </div>
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
                  {selectedItems.map((item, index) => {
                    const itemDailyPrice = item.harga_per_hari ?? (item.durasi_hari ? Math.round(item.harga / item.durasi_hari) : item.harga);
                    const itemTotal = item.harga * item.jumlah;

                    return (
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

                        {/* Fields: Picker, Qty, Harga / Hari, Total */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                          <div className="sm:col-span-5 min-w-0">
                            <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                              Pilih / Cari Jas atau Aksesoris *
                            </label>
                            <SearchableItemPicker
                              inventory={inventory}
                              selectedCode={item.kodeJas}
                              startDate={tanggalSewa}
                              returnDate={tanggalKembali}
                              transactions={transactions}
                              onSelect={(inv) => {
                                const dailyPrice = Number(inv.harga_default || 0);
                                setSelectedItems((prev) => {
                                  const next = [...prev];
                                  next[index] = {
                                    kodeJas: inv.kode_jas,
                                    namaJas: inv.nama_jas,
                                    jenisJas: inv.jenis_jas,
                                    warna: inv.warna,
                                    ukuran: inv.ukuran,
                                    jumlah: next[index]?.jumlah || 1,
                                    harga_per_hari: dailyPrice,
                                    durasi_hari: createRentalDays,
                                    harga: dailyPrice * createRentalDays,
                                  };
                                  return next;
                                });
                              }}
                            />
                          </div>

                          <div className="grid grid-cols-3 sm:col-span-7 gap-2 min-w-0">
                            <div className="min-w-0">
                              <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                                Qty
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={item.jumlah}
                                onChange={(e) => updateItemQtyOrPrice(index, "jumlah", Number(e.target.value) || 1)}
                                className="w-full min-w-0 box-border bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-2.5 py-2 text-slate-900 dark:text-zinc-100 outline-none text-center font-mono text-xs shadow-sm focus:border-slate-400"
                                placeholder="1"
                              />
                            </div>

                            <div className="min-w-0">
                              <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mb-1 truncate" title="Harga sewa per 1 hari">
                                Harga / Hari (Rp)
                              </label>
                              <CurrencyInput
                                value={itemDailyPrice}
                                onChange={(val) => updateItemDailyPrice(index, val)}
                                placeholder="0"
                                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 text-slate-900 dark:text-zinc-100 outline-none font-mono text-xs shadow-sm focus:border-slate-400"
                              />
                            </div>

                            <div className="min-w-0 bg-slate-100/80 dark:bg-zinc-800/60 rounded-xl px-2.5 py-1.5 flex flex-col justify-center text-right border border-slate-200/60 dark:border-zinc-700/50">
                              <span className="text-[9px] text-slate-400 dark:text-zinc-400 block font-semibold truncate">
                                Total ({createRentalDays} Hari)
                              </span>
                              <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-xs truncate">
                                {formatRupiah(itemTotal)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> LUNAS
                      </span>
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Update Pembayaran — {selectedTx.kode_transaksi}
              </h2>
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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
                type="button"
                onClick={() => setReceiptModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Receipt Body */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-50 dark:bg-zinc-950/60">
              <div
                id="printableReceipt"
                className="bg-white text-slate-900 p-5 sm:p-7 rounded-2xl border border-slate-200 font-sans shadow-sm text-xs space-y-4"
              >
                {/* Header: Minimalist Brand */}
                <div className="text-center space-y-0.5">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                    STITCH & MORAL
                  </h1>
                  <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                    SEWA JAS & TUXEDO PALANGKARAYA
                  </p>
                </div>

                {/* Single Subtle Divider */}
                <div className="border-t border-slate-200 my-2" />

                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-3 text-slate-700 leading-relaxed border-b border-slate-100 pb-3 text-[11px] sm:text-xs">
                  <div className="space-y-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">No. Transaksi</span>
                      <span className="font-bold text-slate-900">{selectedTx.kode_transaksi}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Customer</span>
                      <span className="font-bold text-slate-900">{selectedTx.nama_customer}</span>
                    </div>
                    <div className="text-[10.5px] text-slate-500">
                      WhatsApp: +{selectedTx.whatsapp || "-"}
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Tgl Mulai Sewa</span>
                      <span className="font-medium text-slate-900">{formatDateIndo(selectedTx.tanggal_sewa)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Tgl Wajib Kembali</span>
                      <span className="font-bold text-slate-900">{formatDateIndo(selectedTx.tanggal_kembali)}</span>
                    </div>
                    <div className="text-[10.5px] text-slate-500">
                      Durasi: <span className="font-bold text-indigo-600">{calculateRentalDays(selectedTx.tanggal_sewa, selectedTx.tanggal_kembali)} Hari</span> • <span className="font-bold text-slate-900">{selectedTx.status}</span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
                  <thead>
                    <tr className="text-slate-500 font-bold border-y border-slate-200 text-[10px] uppercase">
                      <th className="py-2 px-1">ITEM / VARIAN</th>
                      <th className="py-2 px-1 text-center">QTY</th>
                      <th className="py-2 px-1 text-right">HARGA / HARI</th>
                      <th className="py-2 px-1 text-right">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedTx.items?.map((item, i) => {
                      const days = item.durasi_hari || calculateRentalDays(selectedTx.tanggal_sewa, selectedTx.tanggal_kembali);
                      const daily = item.harga_per_hari || (days ? Math.round(item.harga / days) : item.harga);

                      return (
                        <tr key={i} className="align-top">
                          <td className="py-2 px-1">
                            <b className="text-slate-900">{item.namaJas}</b>
                            <p className="text-[10px] text-slate-500">
                              {item.warna || "-"} • Ukuran {item.ukuran || "-"} ({days} Hari)
                            </p>
                          </td>
                          <td className="py-2 px-1 text-center">{item.jumlah}</td>
                          <td className="py-2 px-1 text-right text-slate-600 font-mono">
                            {formatRupiah(daily)}/hr
                          </td>
                          <td className="py-2 px-1 text-right font-bold text-slate-900 font-mono">
                            {formatRupiah(item.harga * item.jumlah)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Financial Summary */}
                <div className="space-y-1.5 text-slate-700 leading-relaxed border-t border-slate-200 pt-2 text-[11px] sm:text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal Sewa:</span>
                    <span className="font-medium text-slate-900">{formatRupiah(selectedTx.subtotal)}</span>
                  </div>
                  {selectedTx.deposit > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Deposit Jaminan:</span>
                      <span>{formatRupiah(selectedTx.deposit)}</span>
                    </div>
                  )}
                  {selectedTx.potongan > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Potongan Diskon:</span>
                      <span>-{formatRupiah(selectedTx.potongan)}</span>
                    </div>
                  )}
                  {selectedTx.denda > 0 && (
                    <div className="flex justify-between text-rose-600 font-medium">
                      <span>Denda Keterlambatan:</span>
                      <span>+{formatRupiah(selectedTx.denda)}</span>
                    </div>
                  )}
                  
                  {/* Total Banner */}
                  <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-white bg-slate-900 px-3 py-2 rounded-lg my-1.5 shadow-xs">
                    <span>TOTAL PEMBAYARAN:</span>
                    <span className="text-emerald-400 text-sm sm:text-base">{formatRupiah(selectedTx.total_bayar)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Sudah Dibayar:</span>
                    <span className="font-bold text-slate-900">{formatRupiah(selectedTx.jumlah_dibayar || 0)}</span>
                  </div>

                  {selectedTx.sisa_pembayaran > 0 ? (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>Sisa Pembayaran:</span>
                      <span>{formatRupiah(selectedTx.sisa_pembayaran)}</span>
                    </div>
                  ) : (
                    <div className="text-center text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 py-1 rounded-md mt-1">
                      ✓ STATUS: PEMBAYARAN SUDAH LUNAS
                    </div>
                  )}

                  {selectedTx.catatan && (
                    <p className="text-[10px] text-slate-500 pt-1 italic">
                      <b>Catatan:</b> {selectedTx.catatan}
                    </p>
                  )}
                </div>

                {/* Syarat & Ketentuan Section */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] text-slate-600 space-y-1 leading-relaxed">
                  <div className="font-bold text-slate-900 text-[10px] uppercase tracking-wider mb-0.5">
                    SYARAT & KETENTUAN SEWA:
                  </div>
                  <div>1. Wajib menitipkan kartu identitas asli (KTP/SIM) selama masa sewa.</div>
                  <div>2. Sistem sewa H-1 ambil & H+1 kembali. Keterlambatan dikenakan denda harian.</div>
                  <div>3. Dilarang mencuci / menyetrika jas sendiri (laundry ditangani toko).</div>
                  <div>4. Kerusakan / kehilangan jas & aksesoris dikenakan biaya penggantian.</div>
                  <div>5. Harap cek kondisi jas saat serah terima & simpan struk ini.</div>
                </div>

                {/* Store Footer */}
                <div className="text-center pt-2 border-t border-slate-200 text-[9.5px] text-slate-500 leading-tight">
                  <p>Stitch & Moral • WA: 081549193834 • Jl. Pangeran Samudera Induk No. 11, Palangka Raya</p>
                </div>
              </div>
            </div>

            {/* Modal Action Buttons (Fixed at Bottom - Always Visible) */}
            <div className="px-3.5 sm:px-6 py-3 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2 shrink-0 pb-[max(0.75rem,calc(env(safe-area-inset-bottom)+0.35rem))]">
              {/* WhatsApp Share Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => sharePdfToWhatsApp(selectedTx)}
                  disabled={sharingPdf || sharingWa}
                  className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-60"
                  title="Kirim dokumen PDF struk resmi ke WhatsApp"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="truncate">{sharingPdf ? "Membuat PDF..." : "Kirim PDF ke WA"}</span>
                </button>

                <button
                  onClick={() => shareToWhatsApp(selectedTx)}
                  disabled={sharingWa || sharingPdf}
                  className="py-2.5 px-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-60"
                  title="Kirim foto struk gambar PNG ke WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span className="truncate">{sharingWa ? "Menyiapkan Foto..." : "Kirim Foto ke WA"}</span>
                </button>
              </div>

              {/* Download & Print Actions */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={downloadPdfReceipt}
                  className="py-2 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-[10px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                  title="Unduh file dokumen PDF"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </button>

                <button
                  onClick={downloadReceiptImage}
                  className="py-2 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-[10px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                  title="Unduh file gambar PNG"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PNG</span>
                </button>

                <button
                  onClick={() => printReceipt(selectedTx)}
                  className="py-2 px-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 transition shadow-xs cursor-pointer"
                  title="Cetak langsung struk"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL TRANSAKSI MODAL */}
      {detailModalOpen && selectedDetailTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-950/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <ReceiptText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 font-mono">
                      {selectedDetailTx.kode_transaksi}
                    </h2>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        selectedDetailTx.status === "Selesai"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : selectedDetailTx.status === "Sedang Disewa"
                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300"
                          : selectedDetailTx.status === "Booking"
                          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300"
                          : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300"
                      }`}
                    >
                      {selectedDetailTx.status}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        selectedDetailTx.status_pembayaran === "Lunas"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                      }`}
                    >
                      {selectedDetailTx.status_pembayaran}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">
                    Dibuat: {selectedDetailTx.created_at ? new Date(selectedDetailTx.created_at).toLocaleString("id-ID") : "-"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* Customer & Period Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-4 text-xs space-y-2">
                  <span className="text-slate-400 block text-[11px] font-semibold uppercase tracking-wider">
                    Informasi Pelanggan
                  </span>
                  <p className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                    {selectedDetailTx.nama_customer}
                  </p>
                  {selectedDetailTx.whatsapp && (
                    <a
                      href={`https://wa.me/${selectedDetailTx.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      +{selectedDetailTx.whatsapp}
                    </a>
                  )}
                  {(() => {
                    const cust = customers.find(
                      (c) => c.customer_id === selectedDetailTx.customer_id || c.nama === selectedDetailTx.nama_customer
                    );
                    return cust?.alamat ? (
                      <p className="text-slate-600 dark:text-zinc-400 text-[11.5px] flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{cust.alamat}</span>
                      </p>
                    ) : null;
                  })()}
                </div>

                <div className="bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-4 text-xs space-y-2">
                  <span className="text-slate-400 block text-[11px] font-semibold uppercase tracking-wider">
                    Periode & Durasi Sewa
                  </span>
                  <div className="space-y-1 text-slate-700 dark:text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mulai Sewa:</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100">
                        {formatDateIndo(selectedDetailTx.tanggal_sewa)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Wajib Kembali:</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100">
                        {formatDateIndo(selectedDetailTx.tanggal_kembali)}
                      </span>
                    </div>
                    <div className="flex justify-between text-indigo-600 dark:text-indigo-400 font-bold pt-0.5">
                      <span>Durasi Sewa:</span>
                      <span>
                        {calculateRentalDays(selectedDetailTx.tanggal_sewa, selectedDetailTx.tanggal_kembali)} Hari
                      </span>
                    </div>
                    {selectedDetailTx.tanggal_dikembalikan && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-200 dark:border-zinc-800">
                        <span>Tgl Dikembalikan:</span>
                        <span className="font-semibold">
                          {formatDateIndo(selectedDetailTx.tanggal_dikembalikan)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rented Items */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
                  Daftar Jas & Aksesoris ({selectedDetailTx.items?.length || 0} Item)
                </h3>
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-500 font-semibold border-b border-slate-200 dark:border-zinc-800">
                      <tr>
                        <th className="py-2.5 px-3.5">Nama Item</th>
                        <th className="py-2.5 px-3.5">Varian</th>
                        <th className="py-2.5 px-3.5 text-center">Qty</th>
                        <th className="py-2.5 px-3.5 text-right">Harga / Hari</th>
                        <th className="py-2.5 px-3.5 text-right">Total Sewa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {selectedDetailTx.items?.map((itm, i) => {
                        const duration = calculateRentalDays(selectedDetailTx.tanggal_sewa, selectedDetailTx.tanggal_kembali);
                        const days = itm.durasi_hari || duration;
                        const daily = itm.harga_per_hari || (days ? Math.round(itm.harga / days) : itm.harga);

                        return (
                          <tr key={i} className="text-slate-800 dark:text-zinc-200">
                            <td className="py-2.5 px-3.5 font-semibold">
                              {itm.namaJas}
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {itm.kodeJas} ({days} Hari)
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5 text-slate-600 dark:text-zinc-400">
                              {itm.warna || "-"} / {itm.ukuran || "-"}
                            </td>
                            <td className="py-2.5 px-3.5 text-center font-mono font-bold">
                              {itm.jumlah}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono text-slate-600 dark:text-zinc-400">
                              {formatRupiah(daily)}/hr
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-zinc-100">
                              {formatRupiah(itm.harga * itm.jumlah)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 text-xs space-y-2">
                <span className="text-slate-400 block text-[11px] font-semibold uppercase tracking-wider">
                  Rincian Pembayaran
                </span>
                <div className="space-y-1.5 text-slate-700 dark:text-zinc-300">
                  <div className="flex justify-between">
                    <span>Subtotal Biaya Sewa:</span>
                    <span className="font-mono font-semibold">
                      {formatRupiah(selectedDetailTx.subtotal || selectedDetailTx.total_bayar)}
                    </span>
                  </div>
                  {Number(selectedDetailTx.potongan || 0) > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Potongan / Diskon:</span>
                      <span className="font-mono">-{formatRupiah(selectedDetailTx.potongan)}</span>
                    </div>
                  )}
                  {Number(selectedDetailTx.deposit || 0) > 0 && (
                    <div className="flex justify-between text-blue-600 dark:text-blue-400">
                      <span>Deposit Jaminan:</span>
                      <span className="font-mono">+{formatRupiah(selectedDetailTx.deposit)}</span>
                    </div>
                  )}
                  {Number(selectedDetailTx.denda || 0) > 0 && (
                    <div className="flex justify-between text-rose-600 dark:text-rose-400 font-semibold">
                      <span>Denda Keterlambatan:</span>
                      <span className="font-mono">+{formatRupiah(selectedDetailTx.denda)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-zinc-100 pt-2 border-t border-slate-200 dark:border-zinc-800">
                    <span>TOTAL TAGIHAN:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(selectedDetailTx.total_bayar)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jumlah Sudah Dibayar:</span>
                    <span className="font-mono font-medium">
                      {formatRupiah(selectedDetailTx.jumlah_dibayar || 0)} ({selectedDetailTx.metode_pembayaran || "Transfer"})
                    </span>
                  </div>
                  {Number(selectedDetailTx.sisa_pembayaran || 0) > 0 ? (
                    <div className="flex justify-between font-bold text-rose-600 dark:text-rose-400">
                      <span>Sisa Belum Dibayar:</span>
                      <span className="font-mono">{formatRupiah(selectedDetailTx.sisa_pembayaran)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                      <span>Status Pembayaran:</span>
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> LUNAS
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedDetailTx.catatan && (
                <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 p-3 rounded-2xl text-xs">
                  <span className="text-amber-800 dark:text-amber-300 font-bold block text-[10.5px]">
                    Catatan Transaksi:
                  </span>
                  <p className="text-amber-900 dark:text-amber-200 mt-0.5">{selectedDetailTx.catatan}</p>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const tx = selectedDetailTx;
                    setDetailModalOpen(false);
                    handleOpenEdit(tx);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Transaksi</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedTx(selectedDetailTx);
                    setReceiptModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Struk</span>
                </button>

                <button
                  onClick={() => sharePdfToWhatsApp(selectedDetailTx)}
                  className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF WA</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const tx = selectedDetailTx;
                    handleOpenDelete(tx);
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>

                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TRANSAKSI MODAL (Supports all statuses, including Selesai) */}
      {editModalOpen && editingTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 shrink-0">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-zinc-100 text-base flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-indigo-500" />
                  Edit Transaksi — <span className="font-mono text-indigo-600 dark:text-indigo-400">{editingTx.kode_transaksi}</span>
                </h2>
                <p className="text-xs text-slate-400 dark:text-zinc-500">
                  Penyesuaian item, tanggal, nominal, denda, atau status transaksi
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
              {/* Customer & Status Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Nama Customer <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editCustName}
                    onChange={(e) => setEditCustName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Nomor WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editCustWa}
                    onChange={(e) => setEditCustWa(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 font-mono outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                      Tanggal Sewa <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      {editRentalDays} Hari
                    </span>
                  </div>
                  <input
                    type="date"
                    required
                    value={editTanggalSewa}
                    onChange={(e) => handleEditTanggalSewaChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 outline-none focus:border-slate-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Tanggal Wajib Kembali <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={editTanggalSewa}
                    value={editTanggalKembali}
                    onChange={(e) => handleEditTanggalKembaliChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 outline-none focus:border-slate-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Status Sewa
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 outline-none font-bold"
                  >
                    <option value="Sedang Disewa">Sedang Disewa (Aktif)</option>
                    <option value="Booking">Booking (Belum Diambil)</option>
                    <option value="Selesai">Selesai (Jas Sudah Kembali)</option>
                    <option value="Terlambat">Terlambat</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Status Pembayaran
                  </label>
                  <select
                    value={editStatusPembayaran}
                    onChange={(e) => setEditStatusPembayaran(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 outline-none font-bold"
                  >
                    <option value="Lunas">Lunas</option>
                    <option value="DP">DP (Uang Muka)</option>
                    <option value="Belum Bayar">Belum Bayar</option>
                  </select>
                </div>
              </div>

              {/* Edit Items Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
                    Item Jas & Aksesoris ({editRentalDays} Hari)
                  </span>
                  <button
                    type="button"
                    onClick={addEditItemRow}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    + Tambah Item
                  </button>
                </div>

                <div className="space-y-2">
                  {editSelectedItems.map((item, idx) => {
                    const itemDaily = item.harga_per_hari ?? (item.durasi_hari ? Math.round(item.harga / item.durasi_hari) : item.harga);
                    const itemTotal = item.harga * item.jumlah;

                    return (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <SearchableItemPicker
                              inventory={inventory}
                              selectedCode={item.kodeJas}
                              startDate={editTanggalSewa}
                              returnDate={editTanggalKembali}
                              transactions={transactions}
                              excludeTransactionId={editingTx.id}
                              onSelect={(inv) => {
                                const daily = Number(inv.harga_default || 0);
                                setEditSelectedItems((prev) => {
                                  const next = [...prev];
                                  next[idx] = {
                                    kodeJas: inv.kode_jas,
                                    namaJas: inv.nama_jas,
                                    jenisJas: inv.jenis_jas,
                                    warna: inv.warna,
                                    ukuran: inv.ukuran,
                                    jumlah: next[idx]?.jumlah || 1,
                                    harga_per_hari: daily,
                                    durasi_hari: editRentalDays,
                                    harga: daily * editRentalDays,
                                  };
                                  return next;
                                });
                              }}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => removeEditItemRow(idx)}
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl cursor-pointer shrink-0"
                            title="Hapus baris item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-0.5">Qty</label>
                            <input
                              type="number"
                              min="1"
                              value={item.jumlah}
                              onChange={(e) => updateEditItemQtyOrPrice(idx, "jumlah", Number(e.target.value) || 1)}
                              className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-zinc-100 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-0.5">Harga / Hari (Rp)</label>
                            <CurrencyInput
                              value={itemDaily}
                              onChange={(val) => updateEditItemDailyPrice(idx, val)}
                            />
                          </div>
                          <div className="bg-slate-100 dark:bg-zinc-800/80 rounded-xl px-2.5 py-1 flex flex-col justify-center text-right">
                            <span className="text-[9px] text-slate-400 block font-medium truncate">Total ({editRentalDays} Hari)</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-xs truncate">
                              {formatRupiah(itemTotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financial Inputs */}
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-3">
                <span className="text-[11px] font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider block">
                  Penyesuaian Finansial & Pembayaran
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10.5px] text-slate-500 mb-0.5">Potongan / Diskon (Rp)</label>
                    <CurrencyInput value={editPotongan} onChange={setEditPotongan} />
                  </div>
                  <div>
                    <label className="block text-[10.5px] text-slate-500 mb-0.5">Deposit Jaminan (Rp)</label>
                    <CurrencyInput value={editDeposit} onChange={setEditDeposit} />
                  </div>
                  <div>
                    <label className="block text-[10.5px] text-slate-500 mb-0.5">Denda (Rp)</label>
                    <CurrencyInput value={editDenda} onChange={setEditDenda} />
                  </div>
                  <div>
                    <label className="block text-[10.5px] text-slate-500 mb-0.5">Jumlah Dibayar (Rp)</label>
                    <CurrencyInput value={editJumlahDibayar} onChange={setEditJumlahDibayar} />
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] text-slate-500 mb-0.5">Catatan</label>
                  <input
                    type="text"
                    value={editCatatan}
                    onChange={(e) => setEditCatatan(e.target.value)}
                    placeholder="Catatan khusus, fitting, penyesuaian..."
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 outline-none"
                  />
                </div>

                {/* Summary calculation box */}
                <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal Item:</span>
                    <span className="font-mono font-semibold">{formatRupiah(editSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-zinc-100">
                    <span>TOTAL TAGIHAN:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatRupiah(editTotalBayar)}</span>
                  </div>
                  {editSisaPembayaran > 0 ? (
                    <div className="flex justify-between font-bold text-rose-600 dark:text-rose-400">
                      <span>Sisa Pembayaran:</span>
                      <span className="font-mono">{formatRupiah(editSisaPembayaran)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                      <span>Status:</span>
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> LUNAS
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Menyimpan Perubahan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE TRANSAKSI MODAL */}
      {deleteModalOpen && txToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100">
                  Hapus Transaksi?
                </h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono">
                  {txToDelete.kode_transaksi}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 text-xs space-y-1.5 text-slate-700 dark:text-zinc-300">
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-bold text-slate-900 dark:text-zinc-100">{txToDelete.nama_customer}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Biaya:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(txToDelete.total_bayar)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status Saat Ini:</span>
                <span className="font-bold">{txToDelete.status}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Pemberitahuan Stok:</strong> Jika transaksi ini dalam status <em>Sedang Disewa</em> atau <em>Terlambat</em>, stok jas yang dipinjam akan secara otomatis dikembalikan ke inventori toko.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setTxToDelete(null);
                }}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Menghapus..." : "Hapus Transaksi Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

