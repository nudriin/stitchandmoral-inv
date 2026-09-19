"use client";

import { useState, useMemo } from "react";
import { formatRupiah, getDriveThumbnail } from "@/lib/utils";
import { Plus, Search, Layers, Edit2, Trash2, Image as ImageIcon, Loader2, LayoutGrid, List, X, PackagePlus, ArrowRight, Boxes, Check } from "lucide-react";
import type { Inventori } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { useDialog } from "@/components/ModalDialogProvider";

interface Props {
  initialItems: Inventori[];
}

export function InventoriClient({ initialItems }: Props) {
  const { showAlert, showConfirm } = useDialog();
  const [items, setItems] = useState<Inventori[]>(initialItems);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Inventori> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Quick Add Stock State
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<Inventori | null>(null);
  const [addStockQty, setAddStockQty] = useState<number>(1);
  const [savingStock, setSavingStock] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState("");

  const supabase = createClient();

  const categories = useMemo(
    () => ["Semua", "Jas", "Celana", "Dasi", "Sepatu", "Kaos Putih", "Vest", "Aksesoris", "Lainnya"],
    []
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchSearch =
        !q ||
        item.nama_jas.toLowerCase().includes(q) ||
        item.kode_jas.toLowerCase().includes(q) ||
        item.warna?.toLowerCase().includes(q) ||
        item.ukuran?.toLowerCase().includes(q);

      const matchCategory = categoryFilter === "Semua" || item.jenis_jas === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [items, search, categoryFilter]);


  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `inventori/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("assets")
      .upload(filePath, file);

    if (uploadError) {
      showAlert({
        title: "Gagal Upload Foto",
        message: uploadError.message,
        type: "danger",
      });
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("assets").getPublicUrl(filePath);

    setEditingItem((prev) => ({ ...prev, foto_url: publicUrl }));
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const kode_jas =
      editingItem?.kode_jas ||
      (formData.get("kode_jas") as string)?.trim() ||
      `JAS-${Date.now()}`;
    const nama_jas = formData.get("nama_jas") as string;
    const jenis_jas = formData.get("jenis_jas") as string;
    const warna = formData.get("warna") as string;
    const ukuran = formData.get("ukuran") as string;
    const harga_default = Number(formData.get("harga_default") || 0);
    const jumlah_stok = Number(formData.get("jumlah_stok") || 0);
    const stok_disewa = Number(editingItem?.stok_disewa ?? 0);
    const stok_tersedia = Math.max(0, jumlah_stok - stok_disewa);
    const kondisi = formData.get("kondisi") as string;
    const status_laundry = formData.get("status_laundry") as string;
    const lokasi = formData.get("lokasi") as string;
    const foto_url = editingItem?.foto_url || "";
    const catatan = formData.get("catatan") as string;

    const payload = {
      kode_jas,
      nama_jas,
      jenis_jas,
      warna,
      ukuran,
      harga_default,
      jumlah_stok,
      stok_tersedia,
      stok_disewa,
      kondisi,
      status_laundry,
      lokasi,
      foto_url,
      catatan,
    };

    if (editingItem?.id) {
      const { data, error } = await supabase
        .from("inventori")
        .update(payload)
        .eq("id", editingItem.id)
        .select()
        .single();

      if (error) {
        showAlert({
          title: "Gagal Update Barang",
          message: error.message,
          type: "danger",
        });
      } else if (data) {
        setItems((prev) => prev.map((item) => (item.id === data.id ? data : item)));
        setModalOpen(false);
      }
    } else {
      const { data, error } = await supabase
        .from("inventori")
        .insert([payload])
        .select()
        .single();

      if (error) {
        showAlert({
          title: "Gagal Menambah Barang",
          message: error.message,
          type: "danger",
        });
      } else if (data) {
        setItems((prev) => [data, ...prev]);
        setModalOpen(false);
      }
    }

    setSaving(false);
  }

  async function handleDelete(item: Inventori) {
    const confirmed = await showConfirm({
      title: "Hapus Barang Inventori",
      message: `Apakah Anda yakin ingin menghapus barang "${item.nama_jas}" (${item.kode_jas})? Data barang yang dihapus tidak dapat dipulihkan.`,
      type: "danger",
      confirmText: "Ya, Hapus",
    });
    if (!confirmed) return;

    const { error } = await supabase.from("inventori").delete().eq("id", item.id);
    if (error) {
      showAlert({
        title: "Gagal Menghapus Barang",
        message: error.message,
        type: "danger",
      });
    } else {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    }
  }

  async function handleAddStock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedStockItem || !selectedStockItem.id) {
      showAlert({
        title: "Barang Belum Dipilih",
        message: "Silakan pilih barang yang ingin ditambahkan stoknya.",
        type: "warning",
      });
      return;
    }

    if (addStockQty <= 0) {
      showAlert({
        title: "Jumlah Tidak Valid",
        message: "Jumlah tambahan stok minimal 1 unit.",
        type: "warning",
      });
      return;
    }

    setSavingStock(true);
    const prevTotal = Number(selectedStockItem.jumlah_stok || 0);
    const prevDisewa = Number(selectedStockItem.stok_disewa || 0);
    const newTotal = prevTotal + Number(addStockQty);
    const newAvailable = Math.max(0, newTotal - prevDisewa);

    const { data, error } = await supabase
      .from("inventori")
      .update({
        jumlah_stok: newTotal,
        stok_tersedia: newAvailable,
      })
      .eq("id", selectedStockItem.id)
      .select()
      .single();

    if (error) {
      showAlert({
        title: "Gagal Menambah Stok",
        message: error.message,
        type: "danger",
      });
    } else if (data) {
      setItems((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      setStockModalOpen(false);
      showAlert({
        title: "Stok Berhasil Ditambahkan",
        message: `Berhasil menambahkan +${addStockQty} unit untuk "${data.nama_jas}" (${data.kode_jas}). Total stok sekarang: ${data.jumlah_stok} unit (Tersedia: ${data.stok_tersedia} unit).`,
        type: "success",
      });
    }

    setSavingStock(false);
  }

  const stockSelectableItems = useMemo(() => {
    if (!stockSearchQuery.trim()) return items.slice(0, 15);
    const q = stockSearchQuery.trim().toLowerCase();
    return items
      .filter(
        (item) =>
          item.nama_jas.toLowerCase().includes(q) ||
          item.kode_jas.toLowerCase().includes(q) ||
          item.warna?.toLowerCase().includes(q) ||
          item.ukuran?.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [items, stockSearchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-slate-500 dark:text-zinc-400" />
            Inventori Barang
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Kelola data jas, celana, dasi, stok, dan kondisi laundry
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
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
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "table"
                  ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm"
                  : "text-slate-400 dark:text-zinc-400"
              }`}
              title="Tampilan Tabel"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedStockItem(null);
              setAddStockQty(1);
              setStockSearchQuery("");
              setStockModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition shadow-sm cursor-pointer"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Tambah Stok</span>
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold text-xs sm:text-sm transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Barang</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Cari barang, warna, ukuran, atau kode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 focus:border-slate-400 dark:focus:border-zinc-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none shadow-sm"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                categoryFilter === cat
                  ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow"
                  : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* View: Card vs Table */}
      {/* View: Card vs Table */}
      {viewMode === "card" ? (
        /* Mobile-Friendly Grid Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const thumb = getDriveThumbnail(item.foto_url);
              const isOutOfStock = Number(item.stok_tersedia) <= 0;

              return (
                <div
                  key={item.id || item.kode_jas}
                  className="cv-auto bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={item.nama_jas}
                        loading="lazy"
                        decoding="async"
                        className="w-16 h-16 object-cover rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950/80 flex items-center justify-center text-slate-400 dark:text-zinc-600 shrink-0">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 font-medium">
                        {item.jenis_jas || "Jas"}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 truncate mt-1">
                        {item.nama_jas}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        {item.warna || "-"} • Ukuran: <b>{item.ukuran || "-"}</b>
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatRupiah(item.harga_default)}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        Stok: <b className={isOutOfStock ? "text-rose-600" : "text-slate-800 dark:text-zinc-200"}>{item.stok_tersedia}</b> / {item.jumlah_stok}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedStockItem(item);
                          setAddStockQty(1);
                          setStockSearchQuery("");
                          setStockModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 transition cursor-pointer"
                        title="Tambah Stok Barang"
                      >
                        <PackagePlus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition cursor-pointer"
                        title="Edit Barang"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/60 transition cursor-pointer"
                        title="Hapus Barang"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center text-sm text-slate-400 dark:text-zinc-500">
              Tidak ada barang inventori yang sesuai.
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-zinc-200">
              <thead className="bg-slate-50 dark:bg-zinc-950/80 text-slate-500 dark:text-zinc-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Foto</th>
                  <th className="py-3.5 px-4 font-semibold">Kode & Nama</th>
                  <th className="py-3.5 px-4 font-semibold">Kategori</th>
                  <th className="py-3.5 px-4 font-semibold">Warna / Ukuran</th>
                  <th className="py-3.5 px-4 font-semibold">Harga Sewa</th>
                  <th className="py-3.5 px-4 font-semibold">Stok</th>
                  <th className="py-3.5 px-4 font-semibold">Kondisi & Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const thumb = getDriveThumbnail(item.foto_url);
                    return (
                      <tr key={item.id || item.kode_jas} className="cv-auto hover:bg-slate-50/80 dark:hover:bg-zinc-800/30 transition">
                        <td className="py-3 px-4">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={item.nama_jas}
                              loading="lazy"
                              decoding="async"
                              className="w-11 h-11 object-cover rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950/80 flex items-center justify-center text-slate-400 dark:text-zinc-600">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900 dark:text-zinc-100">{item.nama_jas}</p>
                          <p className="text-xs text-slate-500 dark:text-zinc-500 font-mono">{item.kode_jas}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-zinc-800/80 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700/50">
                            {item.jenis_jas || "Jas"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700 dark:text-zinc-300">
                          {item.warna || "-"} / <b>{item.ukuran || "-"}</b>
                        </td>
                        <td className="py-3 px-4 font-medium text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(item.harga_default)}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                            {item.stok_tersedia} / {item.jumlah_stok}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-zinc-500">Disewa: {item.stok_disewa}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                              item.kondisi === "Baik"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50"
                                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50"
                            }`}
                          >
                            {item.kondisi}
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                            Laundry: {item.status_laundry || "Ready"}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedStockItem(item);
                                setAddStockQty(1);
                                setStockSearchQuery("");
                                setStockModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 dark:hover:text-emerald-200 transition cursor-pointer"
                              title="Tambah Stok Barang"
                            >
                              <PackagePlus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white transition cursor-pointer"
                              title="Edit Barang"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/60 dark:hover:text-red-200 transition cursor-pointer"
                              title="Hapus Barang"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-slate-400 dark:text-zinc-500">
                      Tidak ada barang inventori yang sesuai.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100">
                  {editingItem?.id ? "Edit Barang Inventori" : "Tambah Barang Baru"}
                </h2>
                {editingItem?.kode_jas && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-semibold border border-slate-200 dark:border-zinc-700">
                    {editingItem.kode_jas}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <input type="hidden" name="kode_jas" value={editingItem?.kode_jas || ""} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Nama Barang *
                  </label>
                  <input
                    name="nama_jas"
                    required
                    defaultValue={editingItem?.nama_jas || ""}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-zinc-100 outline-none focus:border-slate-400 dark:focus:border-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Kategori *
                  </label>
                  <select
                    name="jenis_jas"
                    defaultValue={editingItem?.jenis_jas || "Jas"}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-zinc-100 outline-none focus:border-slate-400 dark:focus:border-zinc-600"
                  >
                    {categories.filter((c) => c !== "Semua").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Warna *</label>
                  <input
                    name="warna"
                    required
                    defaultValue={editingItem?.warna || ""}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-zinc-100 outline-none focus:border-slate-400 dark:focus:border-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Ukuran *
                  </label>
                  <input
                    name="ukuran"
                    required
                    defaultValue={editingItem?.ukuran || ""}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-zinc-100 outline-none focus:border-slate-400 dark:focus:border-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Harga Sewa Default (Rp) *
                  </label>
                  <input
                    type="number"
                    name="harga_default"
                    required
                    defaultValue={editingItem?.harga_default || 150000}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-zinc-100 outline-none focus:border-slate-400 dark:focus:border-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Jumlah Total Stok *
                  </label>
                  <input
                    type="number"
                    name="jumlah_stok"
                    required
                    defaultValue={editingItem?.jumlah_stok || 1}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-zinc-100 outline-none focus:border-slate-400 dark:focus:border-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Kondisi
                  </label>
                  <select
                    name="kondisi"
                    defaultValue={editingItem?.kondisi || "Baik"}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-zinc-100 outline-none focus:border-slate-400 dark:focus:border-zinc-600"
                  >
                    <option value="Baik">Baik</option>
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Perlu Laundry">Perlu Laundry</option>
                    <option value="Tidak Layak">Tidak Layak</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Status Laundry
                  </label>
                  <select
                    name="status_laundry"
                    defaultValue={editingItem?.status_laundry || "Ready"}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-zinc-100 outline-none focus:border-slate-400 dark:focus:border-zinc-600"
                  >
                    <option value="Ready">Ready</option>
                    <option value="Perlu Laundry">Perlu Laundry</option>
                    <option value="Sedang Laundry">Sedang Laundry</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Lokasi Penyimpanan
                  </label>
                  <input
                    name="lokasi"
                    defaultValue={editingItem?.lokasi || ""}
                    placeholder="Contoh: Rak A1, Gudang, Toko"
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-zinc-100 outline-none focus:border-slate-400 dark:focus:border-zinc-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Foto Barang
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    {editingItem?.foto_url && (
                      <img
                        src={getDriveThumbnail(editingItem.foto_url)}
                        alt="Preview"
                        className="w-14 h-14 object-cover rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-950"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="text-xs text-slate-600 dark:text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-zinc-800 file:text-slate-900 dark:file:text-zinc-100 hover:file:bg-slate-200 dark:hover:file:bg-zinc-700 cursor-pointer"
                    />
                    {uploading && <Loader2 className="w-4 h-4 animate-spin text-slate-400 dark:text-zinc-400" />}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Catatan
                  </label>
                  <textarea
                    name="catatan"
                    rows={2}
                    defaultValue={editingItem?.catatan || ""}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-zinc-100 outline-none focus:border-slate-400 dark:focus:border-zinc-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold shadow transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Barang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Stock Modal */}
      {stockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100">
                    Tambah Stok Barang
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Tambahkan jumlah unit stok baru ke inventori
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStockModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStock} className="space-y-4">
              {/* Item Selector / Preview */}
              {!selectedStockItem ? (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Pilih Barang yang Ingin Ditambahkan Stoknya *
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Ketik nama, kode jas, warna, atau ukuran..."
                      value={stockSearchQuery}
                      onChange={(e) => setStockSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-emerald-500 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-zinc-100 outline-none"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-zinc-800 rounded-2xl p-2 bg-slate-50/50 dark:bg-zinc-950/50">
                    {stockSelectableItems.length > 0 ? (
                      stockSelectableItems.map((item) => {
                        const thumb = getDriveThumbnail(item.foto_url);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedStockItem(item)}
                            className="w-full flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 text-left transition cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt={item.nama_jas}
                                  className="w-9 h-9 object-cover rounded-lg border border-slate-200 dark:border-zinc-800 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 shrink-0">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                                  {item.nama_jas}
                                </p>
                                <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 font-mono truncate">
                                  {item.kode_jas} • {item.warna} (Ukuran: {item.ukuran})
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 pl-2">
                              <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-zinc-300">
                                Stok: {item.jumlah_stok}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400 dark:text-zinc-500">
                        Tidak ada barang yang cocok dengan pencarian.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Selected Item Card */
                <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {getDriveThumbnail(selectedStockItem.foto_url) ? (
                        <img
                          src={getDriveThumbnail(selectedStockItem.foto_url)}
                          alt={selectedStockItem.nama_jas}
                          className="w-12 h-12 object-cover rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 shrink-0">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-medium">
                          {selectedStockItem.jenis_jas || "Jas"}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-100 truncate mt-0.5">
                          {selectedStockItem.nama_jas}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                          {selectedStockItem.kode_jas} • {selectedStockItem.warna} (Ukuran: {selectedStockItem.ukuran})
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedStockItem(null)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold underline shrink-0 cursor-pointer pt-1"
                    >
                      Ganti
                    </button>
                  </div>

                  {/* Current Status Pills */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-zinc-800 text-center">
                    <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl border border-slate-200/60 dark:border-zinc-800">
                      <span className="text-[10px] text-slate-400 block">Total Stok</span>
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-zinc-100">
                        {selectedStockItem.jumlah_stok}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl border border-slate-200/60 dark:border-zinc-800">
                      <span className="text-[10px] text-slate-400 block">Tersedia</span>
                      <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        {selectedStockItem.stok_tersedia}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl border border-slate-200/60 dark:border-zinc-800">
                      <span className="text-[10px] text-slate-400 block">Disewa</span>
                      <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                        {selectedStockItem.stok_disewa || 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity to Add Input */}
              {selectedStockItem && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                      Jumlah Tambahan Stok (Unit) *
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAddStockQty((prev) => Math.max(1, prev - 1))}
                        className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-base flex items-center justify-center transition cursor-pointer shrink-0"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        required
                        value={addStockQty}
                        onChange={(e) => setAddStockQty(Math.max(1, Number(e.target.value) || 1))}
                        className="flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-center text-base font-bold font-mono text-slate-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setAddStockQty((prev) => prev + 1)}
                        className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-base flex items-center justify-center transition cursor-pointer shrink-0"
                      >
                        +
                      </button>
                    </div>

                    {/* Quick Add Buttons */}
                    <div className="flex gap-2 mt-2">
                      {[1, 2, 5, 10].map((qty) => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => setAddStockQty((prev) => (addStockQty === 1 && qty !== 1 ? qty : prev + qty))}
                          className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 dark:text-zinc-300 text-xs font-semibold transition cursor-pointer"
                        >
                          +{qty} Unit
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary / Calculation preview */}
                  <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-600 dark:text-zinc-300">
                      <span>Total Stok Baru:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">
                        {selectedStockItem.jumlah_stok} →{" "}
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {selectedStockItem.jumlah_stok + addStockQty} Unit
                        </span>{" "}
                        (+{addStockQty})
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600 dark:text-zinc-300">
                      <span>Stok Tersedia Baru:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {selectedStockItem.stok_tersedia + addStockQty} Unit
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setStockModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium text-xs sm:text-sm cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingStock || !selectedStockItem}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingStock ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <PackagePlus className="w-4 h-4" />
                      <span>Tambah Stok (+{addStockQty} Unit)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
