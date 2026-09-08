"use client";

import React, { useState, useEffect } from "react";
import { X, Save, RotateCcw, Plus, Trash2, FileText, CheckCircle2 } from "lucide-react";
import { ReceiptConfig, DEFAULT_RECEIPT_CONFIG } from "@/types/receipt";
import { saveReceiptConfig, getReceiptConfig } from "@/actions/receiptSettings";
import { useDialog } from "./ModalDialogProvider";

interface ReceiptSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: ReceiptConfig;
  onConfigSaved: (config: ReceiptConfig) => void;
}

export function ReceiptSettingsModal({
  isOpen,
  onClose,
  currentConfig,
  onConfigSaved,
}: ReceiptSettingsModalProps) {
  const { showAlert } = useDialog();
  const [config, setConfig] = useState<ReceiptConfig>(currentConfig || DEFAULT_RECEIPT_CONFIG);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(currentConfig || DEFAULT_RECEIPT_CONFIG);
      // Fetch latest from server to guarantee sync
      getReceiptConfig().then((latest) => {
        if (latest) {
          setConfig(latest);
        }
      });
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await saveReceiptConfig(config);
      if (res.success) {
        onConfigSaved(config);
        showAlert({
          title: "Pengaturan Tersimpan",
          message: "Template struk invoice sewa berhasil diperbarui.",
          type: "success",
        });
        onClose();
      } else {
        showAlert({
          title: "Gagal Menyimpan",
          message: res.error || "Terjadi kesalahan saat menyimpan pengaturan struk.",
          type: "danger",
        });
      }
    } catch (err: any) {
      showAlert({
        title: "Kesalahan Sistem",
        message: err.message || "Gagal menyimpan konfigurasi struk.",
        type: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefault = () => {
    setConfig({ ...DEFAULT_RECEIPT_CONFIG });
  };

  const handleAddTerm = () => {
    setConfig((prev) => ({
      ...prev,
      terms: [...prev.terms, "Syarat sewa baru..."],
    }));
  };

  const handleUpdateTerm = (index: number, value: string) => {
    setConfig((prev) => {
      const nextTerms = [...prev.terms];
      nextTerms[index] = value;
      return { ...prev, terms: nextTerms };
    });
  };

  const handleDeleteTerm = (index: number) => {
    setConfig((prev) => {
      const nextTerms = [...prev.terms];
      nextTerms.splice(index, 1);
      return { ...prev, terms: nextTerms };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF4D00]/10 text-[#FF4D00] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Pengaturan Template Struk & Invoice
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Sesuaikan teks, identitas toko, dan syarat sewa pada dokumen struk
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Header Dokumen */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Header & Identitas Toko
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  Judul Dokumen (Kiri Atas)
                </label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Contoh: INVOICE / STRUK SEWA"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  Nama Brand Toko (Kanan Atas)
                </label>
                <input
                  type="text"
                  value={config.brand_name}
                  onChange={(e) => setConfig((prev) => ({ ...prev, brand_name: e.target.value }))}
                  placeholder="Contoh: STITCH & MORAL"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  Sub-Judul Brand
                </label>
                <input
                  type="text"
                  value={config.brand_sub || ""}
                  onChange={(e) => setConfig((prev) => ({ ...prev, brand_sub: e.target.value }))}
                  placeholder="Contoh: SEWA JAS & TUXEDO"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  Nomor WhatsApp Toko
                </label>
                <input
                  type="text"
                  value={config.store_whatsapp}
                  onChange={(e) => setConfig((prev) => ({ ...prev, store_whatsapp: e.target.value }))}
                  placeholder="Contoh: +62 815-4919-3834"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  Alamat Lengkap Toko
                </label>
                <input
                  type="text"
                  value={config.store_address}
                  onChange={(e) => setConfig((prev) => ({ ...prev, store_address: e.target.value }))}
                  placeholder="Contoh: Jl. Pangeran Samudera Induk No. 11"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 uppercase"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Syarat & Ketentuan Sewa */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Syarat & Ketentuan Sewa (Footer Kiri)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Poin aturan yang tercantum di bagian bawah dokumen struk
                </p>
              </div>
              <button
                onClick={handleAddTerm}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Poin</span>
              </button>
            </div>

            <div className="space-y-2">
              {config.terms.map((term, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 w-5 text-right shrink-0">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={term}
                    onChange={(e) => handleUpdateTerm(idx, e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100"
                  />
                  <button
                    onClick={() => handleDeleteTerm(idx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Penanggung Jawab & Tanda Tangan */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Penanggung Jawab (Footer Kanan)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  Nama Penanggung Jawab / Admin
                </label>
                <input
                  type="text"
                  value={config.manager_name}
                  onChange={(e) => setConfig((prev) => ({ ...prev, manager_name: e.target.value }))}
                  placeholder="Contoh: ADMIN STITCH & MORAL"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  Jabatan / Keterangan
                </label>
                <input
                  type="text"
                  value={config.manager_title}
                  onChange={(e) => setConfig((prev) => ({ ...prev, manager_title: e.target.value }))}
                  placeholder="Contoh: PENANGGUNG JAWAB"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 dark:bg-zinc-800/60 border-t border-slate-100 dark:border-zinc-800 shrink-0">
          <button
            onClick={handleResetDefault}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-semibold transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF4D00] hover:bg-[#E04400] text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Menyimpan..." : "Simpan Template"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
