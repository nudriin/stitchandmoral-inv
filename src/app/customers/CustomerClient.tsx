"use client";

import { useState } from "react";
import { getDriveThumbnail } from "@/lib/utils";
import { Plus, Search, Users, Phone, MapPin, Edit2, Trash2, Loader2, MessageCircle } from "lucide-react";
import type { Customer } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

interface Props {
  initialCustomers: Customer[];
}

export function CustomerClient({ initialCustomers }: Props) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const supabase = createClient();

  const filtered = customers.filter(
    (c) =>
      c.nama.toLowerCase().includes(search.toLowerCase()) ||
      c.whatsapp?.includes(search) ||
      c.alamat?.toLowerCase().includes(search.toLowerCase()) ||
      c.instagram?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, field: "foto_customer_url" | "foto_pakai_jas_url") {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `customer/${fileName}`;

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

    setEditingCustomer((prev) => ({ ...prev, [field]: publicUrl }));
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const customer_id = (formData.get("customer_id") as string) || `CUS-${Date.now()}`;
    const nama = formData.get("nama") as string;
    let whatsapp = (formData.get("whatsapp") as string).replace(/\D/g, "");
    if (whatsapp.startsWith("0")) whatsapp = "62" + whatsapp.slice(1);
    else if (!whatsapp.startsWith("62") && whatsapp.length > 5) whatsapp = "62" + whatsapp;

    const alamat = formData.get("alamat") as string;
    const instagram = formData.get("instagram") as string;
    const catatan = formData.get("catatan") as string;
    const status = formData.get("status") as string;

    const payload = {
      customer_id,
      nama,
      whatsapp,
      alamat,
      instagram,
      catatan,
      status,
      foto_customer_url: editingCustomer?.foto_customer_url || "",
      foto_pakai_jas_url: editingCustomer?.foto_pakai_jas_url || "",
    };

    if (editingCustomer?.id) {
      const { data, error } = await supabase
        .from("customer")
        .update(payload)
        .eq("id", editingCustomer.id)
        .select()
        .single();

      if (error) {
        alert("Gagal update customer: " + error.message);
      } else if (data) {
        setCustomers((prev) => prev.map((c) => (c.id === data.id ? data : c)));
        setModalOpen(false);
      }
    } else {
      const { data, error } = await supabase
        .from("customer")
        .insert([payload])
        .select()
        .single();

      if (error) {
        alert("Gagal tambah customer: " + error.message);
      } else if (data) {
        setCustomers((prev) => [data, ...prev]);
        setModalOpen(false);
      }
    }

    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-slate-500 dark:text-zinc-400" />
            Data Customer
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Daftar pelanggan, nomor WhatsApp, riwayat sewa, dan status loyalitas
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCustomer(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold text-sm transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Customer</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
        <input
          type="text"
          placeholder="Cari customer berdasarkan nama, nomor WA, alamat, instagram..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 focus:border-slate-400 dark:focus:border-zinc-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none shadow-sm"
        />
      </div>

      {/* Customer List Table */}
      <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-zinc-200">
            <thead className="bg-slate-50 dark:bg-zinc-950/80 text-slate-500 dark:text-zinc-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-zinc-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Foto</th>
                <th className="py-3.5 px-4 font-semibold">Customer</th>
                <th className="py-3.5 px-4 font-semibold">WhatsApp</th>
                <th className="py-3.5 px-4 font-semibold">Instagram</th>
                <th className="py-3.5 px-4 font-semibold">Alamat</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {filtered.length > 0 ? (
                filtered.map((c) => {
                  const thumb = getDriveThumbnail(c.foto_customer_url);
                  return (
                    <tr key={c.id || c.customer_id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/30 transition">
                      <td className="py-3 px-4">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={c.nama}
                            className="w-10 h-10 object-cover rounded-full border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950 flex items-center justify-center font-bold text-slate-500 dark:text-zinc-400 text-xs">
                            {c.nama?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 dark:text-zinc-100">{c.nama}</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-500 font-mono">{c.customer_id}</p>
                      </td>
                      <td className="py-3 px-4">
                        {c.whatsapp ? (
                          <a
                            href={`https://wa.me/${c.whatsapp}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-mono font-medium"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>+{c.whatsapp}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-500 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-zinc-400">
                        {c.instagram ? `@${c.instagram.replace("@", "")}` : "-"}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-zinc-400 max-w-xs truncate">
                        {c.alamat || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                            c.status === "Loyal"
                              ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50"
                              : c.status === "Blacklist"
                              ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/50"
                              : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                          }`}
                        >
                          {c.status || "Aktif"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingCustomer(c);
                            setModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white transition cursor-pointer"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-400 dark:text-zinc-500">
                    Tidak ada customer yang sesuai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-100">
                {editingCustomer?.id ? "Edit Customer" : "Tambah Customer Baru"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Nama Lengkap *
                </label>
                <input
                  name="nama"
                  required
                  defaultValue={editingCustomer?.nama || ""}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Nomor WhatsApp *
                </label>
                <input
                  name="whatsapp"
                  required
                  placeholder="08123456789 atau 628123456789"
                  defaultValue={editingCustomer?.whatsapp || ""}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Instagram
                </label>
                <input
                  name="instagram"
                  placeholder="username_tanpa_at"
                  defaultValue={editingCustomer?.instagram || ""}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Alamat</label>
                <input
                  name="alamat"
                  placeholder="JL. ..."
                  defaultValue={editingCustomer?.alamat || ""}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Status</label>
                <select
                  name="status"
                  defaultValue={editingCustomer?.status || "Aktif"}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Loyal">Loyal</option>
                  <option value="Blacklist">Blacklist</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Foto Customer / KTP
                </label>
                <div className="flex items-center gap-3">
                  {editingCustomer?.foto_customer_url && (
                    <img
                      src={getDriveThumbnail(editingCustomer.foto_customer_url)}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded-xl border border-zinc-700 bg-zinc-950"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "foto_customer_url")}
                    className="text-xs text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-100 hover:file:bg-zinc-700 cursor-pointer"
                  />
                  {uploading && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Catatan</label>
                <textarea
                  name="catatan"
                  rows={2}
                  defaultValue={editingCustomer?.catatan || ""}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-100 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold shadow transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
