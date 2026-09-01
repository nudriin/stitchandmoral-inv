"use client";

import { useState, useMemo } from "react";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { Plus, Wallet, Trash2, Tag, Calendar, Layers, LayoutGrid, List, X } from "lucide-react";
import type { Pengeluaran, ModalItem } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

interface Props {
  initialExpenses: Pengeluaran[];
  initialModal: ModalItem[];
}

export function BiayaClient({ initialExpenses, initialModal }: Props) {
  const [activeTab, setActiveTab] = useState<"operasional" | "modal">("operasional");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [expenses, setExpenses] = useState<Pengeluaran[]>(initialExpenses);
  const [modalItems, setModalItems] = useState<ModalItem[]>(initialModal);

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [modalItemModalOpen, setModalItemModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const totalOperasional = useMemo(
    () => expenses.reduce((sum, e) => sum + Number(e.jumlah || 0), 0),
    [expenses]
  );
  const totalModal = useMemo(
    () => modalItems.reduce((sum, m) => sum + Number(m.total_harga || 0), 0),
    [modalItems]
  );

  async function handleAddExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const expense_id = `EXP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-4)}`;
    const tanggal = formData.get("tanggal") as string;
    const kategori = formData.get("kategori") as string;
    const deskripsi = formData.get("deskripsi") as string;
    const jumlah = Number(formData.get("jumlah") || 0);
    const catatan = formData.get("catatan") as string;

    const payload = { expense_id, tanggal, kategori, deskripsi, jumlah, catatan };

    const { data, error } = await supabase.from("pengeluaran").insert([payload]).select().single();
    if (error) {
      alert("Gagal menambah pengeluaran: " + error.message);
    } else if (data) {
      setExpenses((prev) => [data as Pengeluaran, ...prev]);
      setExpenseModalOpen(false);
    }
    setSaving(false);
  }

  async function handleAddModalItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const id = `MOD-${Date.now()}`;
    const barang = formData.get("barang") as string;
    const satuan = formData.get("satuan") as string;
    const merk = formData.get("merk") as string;
    const jumlah = Number(formData.get("jumlah") || 1);
    const harga_satuan = Number(formData.get("harga_satuan") || 0);
    const total_harga = jumlah * harga_satuan;
    const catatan = formData.get("catatan") as string;

    const payload = { id, barang, satuan, merk, jumlah, harga_satuan, total_harga, catatan };

    const { data, error } = await supabase.from("modal").insert([payload]).select().single();
    if (error) {
      alert("Gagal menambah aset modal: " + error.message);
    } else if (data) {
      setModalItems((prev) => [data as ModalItem, ...prev]);
      setModalItemModalOpen(false);
    }
    setSaving(false);
  }

  async function handleDeleteExpense(id: string) {
    if (!confirm("Hapus pengeluaran ini?")) return;
    const { error } = await supabase.from("pengeluaran").delete().eq("id", id);
    if (!error) setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  async function handleDeleteModal(id: string) {
    if (!confirm("Hapus modal inventori ini?")) return;
    const { error } = await supabase.from("modal").delete().eq("id", id);
    if (!error) setModalItems((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-slate-500 dark:text-zinc-400" />
            Pengeluaran & Modal Usaha
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Pencatatan biaya laundry, operasional harian, dan modal awal aset jas
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
              if (activeTab === "operasional") setExpenseModalOpen(true);
              else setModalItemModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold text-sm transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === "operasional" ? "Tambah Pengeluaran" : "Tambah Aset Modal"}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-zinc-800 no-scrollbar">
        <button
          onClick={() => setActiveTab("operasional")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
            activeTab === "operasional"
              ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow"
              : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Pengeluaran ({formatRupiah(totalOperasional)})</span>
        </button>

        <button
          onClick={() => setActiveTab("modal")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
            activeTab === "modal"
              ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow"
              : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Modal CAPEX ({formatRupiah(totalModal)})</span>
        </button>
      </div>

      {/* Tab 1: Pengeluaran Operasional */}
      {activeTab === "operasional" ? (
        viewMode === "card" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {expenses.length > 0 ? (
              expenses.map((e) => (
                <div
                  key={e.id || e.expense_id}
                  className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                        {e.kategori}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 mt-1.5">
                        {e.deskripsi}
                      </h3>
                      {e.catatan && (
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                          {e.catatan}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteExpense(e.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 cursor-pointer shrink-0"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-xs">
                    <span className="text-slate-400 dark:text-zinc-500 font-mono">
                      {formatDateIndo(e.tanggal)}
                    </span>
                    <span className="font-bold text-sm text-rose-600 dark:text-rose-400 font-mono">
                      {formatRupiah(e.jumlah)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-sm text-slate-400 dark:text-zinc-500">
                Belum ada catatan pengeluaran.
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 dark:text-zinc-200">
                <thead className="bg-slate-50 dark:bg-zinc-950/80 text-slate-500 dark:text-zinc-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Tanggal</th>
                    <th className="py-3.5 px-4 font-semibold">Kategori</th>
                    <th className="py-3.5 px-4 font-semibold">Deskripsi</th>
                    <th className="py-3.5 px-4 font-semibold">Jumlah</th>
                    <th className="py-3.5 px-4 font-semibold">Catatan</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                  {expenses.length > 0 ? (
                    expenses.map((e) => (
                      <tr key={e.id || e.expense_id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/30 transition">
                        <td className="py-3 px-4 font-mono text-xs">{formatDateIndo(e.tanggal)}</td>
                        <td className="py-3 px-4">
                          <span className="text-xs px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                            {e.kategori}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-zinc-100">{e.deskripsi}</td>
                        <td className="py-3 px-4 font-medium text-rose-600 dark:text-rose-400 font-mono">
                          {formatRupiah(e.jumlah)}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500 dark:text-zinc-400">{e.catatan || "-"}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteExpense(e.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-slate-400 dark:text-zinc-500">
                        Belum ada catatan pengeluaran.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Tab 2: Modal Aset CAPEX */
        viewMode === "card" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {modalItems.length > 0 ? (
              modalItems.map((m) => (
                <div
                  key={m.id}
                  className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                        {m.barang}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        Merek: {m.merk || "-"} • {m.jumlah} {m.satuan}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteModal(m.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 cursor-pointer shrink-0"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-xs">
                    <span className="text-slate-400 dark:text-zinc-500 font-mono">
                      @ {formatRupiah(m.harga_satuan)}
                    </span>
                    <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatRupiah(m.total_harga)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-sm text-slate-400 dark:text-zinc-500">
                Belum ada aset modal terdata.
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 dark:text-zinc-200">
                <thead className="bg-slate-50 dark:bg-zinc-950/80 text-slate-500 dark:text-zinc-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Barang / Aset</th>
                    <th className="py-3.5 px-4 font-semibold">Merek / Toko</th>
                    <th className="py-3.5 px-4 font-semibold">Qty & Satuan</th>
                    <th className="py-3.5 px-4 font-semibold">Harga Satuan</th>
                    <th className="py-3.5 px-4 font-semibold">Total Harga</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                  {modalItems.length > 0 ? (
                    modalItems.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/30 transition">
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-zinc-100">{m.barang}</td>
                        <td className="py-3 px-4 text-xs text-slate-500 dark:text-zinc-400">{m.merk || "-"}</td>
                        <td className="py-3 px-4 text-xs text-slate-700 dark:text-zinc-300">
                          {m.jumlah} {m.satuan}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono">{formatRupiah(m.harga_satuan)}</td>
                        <td className="py-3 px-4 font-medium text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatRupiah(m.total_harga)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteModal(m.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-slate-400 dark:text-zinc-500">
                        Belum ada aset modal terdata.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Modal: Tambah Pengeluaran */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-zinc-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">Catat Pengeluaran Operasional</h2>
              <button
                type="button"
                onClick={() => setExpenseModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Tanggal</label>
                <input
                  type="date"
                  name="tanggal"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 outline-none focus:border-slate-400 dark:focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Kategori</label>
                <select
                  name="kategori"
                  defaultValue="Laundry"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 outline-none focus:border-slate-400 dark:focus:border-zinc-600"
                >
                  <option value="Laundry">Laundry</option>
                  <option value="Perbaikan">Perbaikan & Permak</option>
                  <option value="Operasional">Operasional Harian</option>
                  <option value="Promosi">Promosi & Iklan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Deskripsi / Kebutuhan *
                </label>
                <input
                  name="deskripsi"
                  required
                  placeholder="Misal: Laundry Jas Nakano 2 pcs"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 outline-none focus:border-slate-400 dark:focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Jumlah Biaya (Rp) *
                </label>
                <input
                  type="number"
                  name="jumlah"
                  required
                  placeholder="60000"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 outline-none font-mono focus:border-slate-400 dark:focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Catatan</label>
                <textarea
                  name="catatan"
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 outline-none focus:border-slate-400 dark:focus:border-zinc-600"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold cursor-pointer transition disabled:opacity-50"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Modal Aset */}
      {modalItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-zinc-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">Catat Aset Modal (CAPEX)</h2>
              <button
                type="button"
                onClick={() => setModalItemModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddModalItem} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Nama Barang / Aset *
                </label>
                <input
                  name="barang"
                  required
                  placeholder="Misal: Jas Andre Laurent 901"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 outline-none focus:border-slate-400 dark:focus:border-zinc-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Merek</label>
                  <input
                    name="merk"
                    placeholder="Misal: Andre Laurent"
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 outline-none focus:border-slate-400 dark:focus:border-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Satuan</label>
                  <input
                    name="satuan"
                    defaultValue="Lembar"
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 outline-none focus:border-slate-400 dark:focus:border-zinc-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Qty</label>
                  <input
                    type="number"
                    name="jumlah"
                    defaultValue={1}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 outline-none font-mono focus:border-slate-400 dark:focus:border-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Harga Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    name="harga_satuan"
                    required
                    placeholder="650000"
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 outline-none font-mono focus:border-slate-400 dark:focus:border-zinc-600"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold cursor-pointer transition disabled:opacity-50"
                >
                  Simpan Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
