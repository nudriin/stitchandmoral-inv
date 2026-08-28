"use client";

import { useState } from "react";
import { formatRupiah, getDriveThumbnail } from "@/lib/utils";
import { Plus, Search, Layers, Edit2, Trash2, Image as ImageIcon, Loader2, LayoutGrid, List } from "lucide-react";
import type { Inventori } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

interface Props {
  initialItems: Inventori[];
}

export function InventoriClient({ initialItems }: Props) {
  const [items, setItems] = useState<Inventori[]>(initialItems);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Inventori> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const supabase = createClient();

  const categories = ["Semua", "Jas", "Celana", "Dasi", "Sepatu", "Kaos Putih", "Vest", "Aksesoris", "Lainnya"];

  const filteredItems = items.filter((item) => {
    const matchSearch =
      item.nama_jas.toLowerCase().includes(search.toLowerCase()) ||
      item.kode_jas.toLowerCase().includes(search.toLowerCase()) ||
      item.warna?.toLowerCase().includes(search.toLowerCase()) ||
      item.ukuran?.toLowerCase().includes(search.toLowerCase());

    const matchCategory = categoryFilter === "Semua" || item.jenis_jas === categoryFilter;

    return matchSearch && matchCategory;
  });

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
      alert("Gagal upload foto: " + uploadError.message);
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
    const kode_jas = (formData.get("kode_jas") as string) || `JAS-${Date.now()}`;
    const nama_jas = formData.get("nama_jas") as string;
    const jenis_jas = formData.get("jenis_jas") as string;
    const warna = formData.get("warna") as string;
    const ukuran = formData.get("ukuran") as string;
    const harga_default = Number(formData.get("harga_default") || 0);
    const jumlah_stok = Number(formData.get("jumlah_stok") || 0);
    const stok_tersedia = Number(formData.get("stok_tersedia") ?? jumlah_stok);
    const stok_disewa = Number(formData.get("stok_disewa") || 0);
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
        alert("Gagal update barang: " + error.message);
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
        alert("Gagal menambah barang: " + error.message);
      } else if (data) {
        setItems((prev) => [data, ...prev]);
        setModalOpen(false);
      }
    }

    setSaving(false);
  }

  async function handleDelete(item: Inventori) {
    if (!confirm(`Hapus barang ${item.nama_jas} (${item.kode_jas})?`)) return;

    const { error } = await supabase.from("inventori").delete().eq("id", item.id);
    if (error) {
      alert("Gagal menghapus: " + error.message);
    } else {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    }
  }

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
              setEditingItem(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold text-sm transition shadow-sm cursor-pointer"
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
                  className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={item.nama_jas}
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
                      <tr key={item.id || item.kode_jas} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/30 transition">
                        <td className="py-3 px-4">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={item.nama_jas}
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
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100">
                {editingItem?.id ? "Edit Barang Inventori" : "Tambah Barang Baru"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 text-sm cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
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
    </div>
  );
}
