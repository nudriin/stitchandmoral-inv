"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Download,
  Share2,
  Copy,
  Plus,
  Trash2,
  Save,
  FileText,
  MessageCircle,
  Edit3,
  CalendarCheck,
  ArrowRight,
} from "lucide-react";
import { PricelistConfig, PricelistPackage, PricelistPromo } from "@/types/pricelist";
import { savePricelistConfig } from "@/actions/pricelist";
import { formatPricelistWhatsApp } from "@/lib/pricelistFormatter";
import { generatePricelistPdf, shareOrDownloadPricelistPdf } from "@/lib/pricelistPdf";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { useDialog } from "@/components/ModalDialogProvider";

interface PricelistClientProps {
  initialConfig: PricelistConfig;
}

export function PricelistClient({ initialConfig }: PricelistClientProps) {
  const { showAlert } = useDialog();

  const [config, setConfig] = useState<PricelistConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<"preview" | "editor">("preview");
  const [isSaving, setIsSaving] = useState(false);
  const [targetWaNumber, setTargetWaNumber] = useState("");

  // Live WhatsApp formatted text
  const whatsappText = useMemo(() => {
    return formatPricelistWhatsApp(config);
  }, [config]);

  // Handle Save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await savePricelistConfig(config);
      if (res.success) {
        showAlert({
          title: "Pengaturan Tersimpan",
          message: "Daftar harga dan pengaturan promo berhasil diperbarui.",
          type: "success",
        });
      } else {
        showAlert({
          title: "Gagal Menyimpan",
          message: res.error || "Terjadi kesalahan saat menyimpan pengaturan.",
          type: "danger",
        });
      }
    } catch (err: any) {
      showAlert({
        title: "Kesalahan Sistem",
        message: err.message || "Gagal menyimpan konfigurasi pricelist.",
        type: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Copy WhatsApp Text
  const handleCopyText = () => {
    navigator.clipboard.writeText(whatsappText);
    showAlert({
      title: "Teks WhatsApp Tersalin",
      message: "Format pricelist minimalis telah disalin ke clipboard.",
      type: "success",
    });
  };

  // Handle Download PDF
  const handleDownloadPdf = () => {
    try {
      const doc = generatePricelistPdf(config);
      const fileName = `Pricelist_StitchAndMoral_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
      showAlert({
        title: "PDF Berhasil Diunduh",
        message: `Dokumen ${fileName} siap dibagikan ke pelanggan atau dicetak.`,
        type: "success",
      });
    } catch (err: any) {
      showAlert({
        title: "Gagal Mengunduh PDF",
        message: err.message || "Gagal meng-generate dokumen PDF.",
        type: "danger",
      });
    }
  };

  // Handle Share to WhatsApp
  const handleSharePdf = async () => {
    await shareOrDownloadPricelistPdf({
      config,
      onStatus: (msg) => {
        showAlert({
          title: "Bagikan Dokumen",
          message: msg,
          type: "info",
        });
      },
    });
  };

  // Send Direct WhatsApp to custom number
  const handleSendDirectWa = () => {
    if (!targetWaNumber.trim()) {
      showAlert({
        title: "Nomor WhatsApp Diperlukan",
        message: "Silakan masukkan nomor WhatsApp tujuan (contoh: 081234567890).",
        type: "warning",
      });
      return;
    }

    let phone = targetWaNumber.replace(/[^0-9]/g, "");
    if (phone.startsWith("0")) phone = "62" + phone.slice(1);
    const encoded = encodeURIComponent(whatsappText);
    window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
  };

  // Package Handlers
  const handleAddPackage = () => {
    const newPkg: PricelistPackage = {
      id: "pkg-" + Date.now(),
      nama: "NAMA PAKET BARU",
      harga: 150000,
      bonus: "Bonus Dasi",
      deskripsi: "Keterangan paket sewa",
      kategori: "PAKET UTAMA",
      is_popular: false,
    };
    setConfig((prev) => ({
      ...prev,
      packages: [...prev.packages, newPkg],
    }));
  };

  const handleUpdatePackage = (index: number, field: keyof PricelistPackage, value: any) => {
    setConfig((prev) => {
      const updated = [...prev.packages];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, packages: updated };
    });
  };

  const handleDeletePackage = (index: number) => {
    setConfig((prev) => {
      const updated = [...prev.packages];
      updated.splice(index, 1);
      return { ...prev, packages: updated };
    });
  };

  // Promo Handlers
  const handleAddPromo = () => {
    const newPromo: PricelistPromo = {
      id: "promo-" + Date.now(),
      judul: "PROMO BARU",
      diskon_nominal: 25000,
      syarat: "Deskripsi syarat dan ketentuan promo...",
      tanggal_mulai: new Date().toISOString().slice(0, 10),
      tanggal_berakhir: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      periode_label: "Bulan Ini",
      aktif: true,
    };
    setConfig((prev) => ({
      ...prev,
      promos: [...prev.promos, newPromo],
    }));
  };

  const handleUpdatePromo = (index: number, field: keyof PricelistPromo, value: any) => {
    setConfig((prev) => {
      const updated = [...prev.promos];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, promos: updated };
    });
  };

  const handleDeletePromo = (index: number) => {
    setConfig((prev) => {
      const updated = [...prev.promos];
      updated.splice(index, 1);
      return { ...prev, promos: updated };
    });
  };

  // Group packages for preview
  const col1Packages = config.packages.filter(
    (p) => !p.kategori || p.kategori === "PAKET UTAMA" || p.kategori === "SEWA UTAMA"
  );
  const col2Packages = config.packages.filter(
    (p) => p.kategori === "TAMBAHAN" || p.kategori === "AKSESORIS"
  );

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
            Pricelist & Promo Dinamis
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Daftar harga sewa dan promo aktif bertema minimalis tipografi hitam-putih
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/ketersediaan"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition shadow-xs"
          >
            <CalendarCheck className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
            <span>Cek Stok Jas</span>
          </Link>

          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-semibold transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
            <span>Unduh PDF A4</span>
          </button>

          <button
            onClick={handleSharePdf}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share PDF ke WA</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 border border-zinc-800"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === "preview"
              ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs"
              : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
            }`}
        >
          <FileText className="w-4 h-4" />
          <span>Pratinjau Minimalis (PDF & WA)</span>
        </button>

        <button
          onClick={() => setActiveTab("editor")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === "editor"
              ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs"
              : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
            }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Editor Paket & Periode Promo</span>
        </button>
      </div>

      {/* Tab 1: Minimalist Typography Preview */}
      {activeTab === "preview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Minimalist Editorial Sheet Preview (Left 7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 sm:p-8 rounded-2xl bg-white text-[#181818] border border-slate-200 dark:border-zinc-700 shadow-md font-sans select-none">
              {/* Top Subtitle Bar */}
              <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.2em] uppercase pb-6 border-b border-[#222222]/15">
                <span>{config.subtitle_left || "SEWA JAS & TUXEDO"}</span>
                <span>{config.subtitle_center || "STITCH & MORAL"}</span>
                <span>{config.subtitle_right || "PRICE LIST"}</span>
              </div>

              {/* Big Hero Title */}
              <div className="text-center my-6">
                <h2 className="text-5xl sm:text-6xl font-black tracking-tight flex items-center justify-center gap-2 font-serif leading-none">
                  <span className="font-sans font-black tracking-wider text-4xl sm:text-5xl">
                    PRICE
                  </span>
                  <span className="font-serif italic font-normal text-5xl sm:text-6xl">
                    List
                  </span>
                </h2>
              </div>

              {/* Outer Grid Table */}
              <div className="border border-[#222222] divide-y divide-[#222222] bg-[#FFF]">
                {/* Section 1: Packages */}
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#222222]">
                  {/* Left Column */}
                  <div className="p-4 space-y-3">
                    <h3 className="text-xs font-black tracking-widest uppercase pb-2 border-b border-[#222222]">
                      PAKET SEWA UTAMA
                    </h3>
                    <div className="space-y-3">
                      {(col1Packages.length > 0 ? col1Packages : config.packages).map((pkg) => (
                        <div key={pkg.id} className="flex items-start justify-between gap-2 text-xs">
                          <div>
                            <span className="font-bold tracking-wide uppercase block">
                              {pkg.nama}
                            </span>
                            {(pkg.bonus || pkg.deskripsi) && (
                              <span className="text-[10px] text-[#4A4A4A] block uppercase mt-0.5">
                                {[pkg.bonus, pkg.deskripsi].filter(Boolean).join(" - ")}
                              </span>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            {pkg.harga_diskon && pkg.harga_diskon < pkg.harga ? (
                              <>
                                <span className="font-mono text-[10px] text-[#777777] line-through block leading-none">
                                  {formatRupiah(pkg.harga)}
                                </span>
                                <span className="font-mono font-bold text-xs text-[#181818] block mt-0.5">
                                  {formatRupiah(pkg.harga_diskon)}
                                </span>
                              </>
                            ) : (
                              <span className="font-mono font-bold text-xs text-[#181818]">
                                {formatRupiah(pkg.harga)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="p-4 space-y-3">
                    <h3 className="text-xs font-black tracking-widest uppercase pb-2 border-b border-[#222222]">
                      TAMBAHAN & AKSESORIS
                    </h3>
                    <div className="space-y-3">
                      {(col2Packages.length > 0 ? col2Packages : config.packages.slice(2)).map(
                        (pkg) => (
                          <div key={pkg.id} className="flex items-start justify-between gap-2 text-xs">
                            <div>
                              <span className="font-bold tracking-wide uppercase block">
                                {pkg.nama}
                              </span>
                              {(pkg.bonus || pkg.deskripsi) && (
                                <span className="text-[10px] text-[#4A4A4A] block uppercase mt-0.5">
                                  {[pkg.bonus, pkg.deskripsi].filter(Boolean).join(" - ")}
                                </span>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              {pkg.harga_diskon && pkg.harga_diskon < pkg.harga ? (
                                <>
                                  <span className="font-mono text-[10px] text-[#777777] line-through block leading-none">
                                    {formatRupiah(pkg.harga)}
                                  </span>
                                  <span className="font-mono font-bold text-xs text-[#181818] block mt-0.5">
                                    {formatRupiah(pkg.harga_diskon)}
                                  </span>
                                </>
                              ) : (
                                <span className="font-mono font-bold text-xs text-[#181818]">
                                  {formatRupiah(pkg.harga)}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: Promos with Validity Dates */}
                <div className="p-4 space-y-3">
                  <h3 className="text-xs font-black tracking-widest uppercase pb-2 border-b border-[#222222]">
                    PROMO & POTONGAN KHUSUS
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {config.promos
                      .filter((p) => p.aktif)
                      .map((promo) => (
                        <div key={promo.id} className="p-3 border border-[#222222] bg-white space-y-1 text-xs">
                          <div className="flex items-center justify-between font-bold">
                            <span className="uppercase">{promo.judul}</span>
                            <span className="font-mono font-black">
                              -{formatRupiah(promo.diskon_nominal)}
                            </span>
                          </div>

                          {/* Validity Period Setting */}
                          <div className="font-mono text-[10px] font-bold text-[#181818] tracking-wider uppercase">
                            {promo.periode_label
                              ? `PERIODE: ${promo.periode_label.toUpperCase()}`
                              : promo.tanggal_mulai && promo.tanggal_berakhir
                                ? `PERIODE: ${formatDateIndo(promo.tanggal_mulai).toUpperCase()} - ${formatDateIndo(promo.tanggal_berakhir).toUpperCase()}`
                                : "PERIODE: BERLAKU SETIAP HARI"}
                          </div>

                          <p className="text-[10px] text-[#4A4A4A] leading-relaxed">
                            {promo.syarat}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Section 3: Terms & Facility */}
                <div className="p-4 space-y-2 text-xs">
                  <h3 className="text-xs font-black tracking-widest uppercase pb-2 border-b border-[#222222]">
                    KETENTUAN & FASILITAS SEWA
                  </h3>
                  <div className="space-y-1 text-[11px] text-[#333333]">
                    {config.ketentuan_sewa.map((k, i) => (
                      <p key={i}>
                        {i + 1}. {k.toUpperCase()}
                      </p>
                    ))}
                    {(() => {
                      const notes = [
                        config.deposit_info ? `[+] ${config.deposit_info}` : "",
                        config.late_fee_info ? `[+] ${config.late_fee_info}` : "",
                      ]
                        .filter(Boolean)
                        .join("  |  ");
                      return notes ? (
                        <p className="font-mono font-bold text-[10px] pt-1 uppercase">
                          {notes}
                        </p>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>

              {/* Minimalist Footer Bar */}
              <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.15em] uppercase pt-6 border-t border-[#222222]/10 mt-6">
                <span>{config.store_whatsapp || "+62 815-4919-3834"}</span>
                <span>{config.store_website || "WWW.STITCHANDMORAL.COM"}</span>
                <span>{config.store_address || "PALANGKA RAYA"}</span>
              </div>
            </div>
          </div>

          {/* WhatsApp Text Preview (Right 5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    Format Teks WhatsApp Minimalis
                  </h3>
                </div>

                <button
                  onClick={handleCopyText}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-bold transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Teks</span>
                </button>
              </div>

              {/* Text Container */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 font-mono text-[11px] text-slate-900 dark:text-zinc-100 whitespace-pre-wrap leading-relaxed max-h-[420px] overflow-y-auto">
                {whatsappText}
              </div>

              {/* Direct WhatsApp Sender */}
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400">
                  Kirim ke Nomor WhatsApp Pelanggan:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={targetWaNumber}
                    onChange={(e) => setTargetWaNumber(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                  <button
                    onClick={handleSendDirectWa}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shrink-0 cursor-pointer shadow-xs"
                  >
                    <span>Kirim</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Editor Mode */}
      {activeTab === "editor" && (
        <div className="space-y-6">
          {/* Section 1: Header Titles Editor */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
              Header Dokumen & Identitas Rental
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Sub-Judul Kiri
                </label>
                <input
                  type="text"
                  value={config.subtitle_left || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, subtitle_left: e.target.value }))
                  }
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Sub-Judul Tengah
                </label>
                <input
                  type="text"
                  value={config.subtitle_center || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, subtitle_center: e.target.value }))
                  }
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Sub-Judul Kanan
                </label>
                <input
                  type="text"
                  value={config.subtitle_right || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, subtitle_right: e.target.value }))
                  }
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-900 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Packages Editor */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                  Daftar Paket Sewa Jas
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Atur paket sewa, harga normal, diskon, dan kategori kolom
                </p>
              </div>

              <button
                onClick={handleAddPackage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Paket</span>
              </button>
            </div>

            <div className="space-y-3">
              {config.packages.map((pkg, idx) => (
                <div
                  key={pkg.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Nama Paket
                      </label>
                      <input
                        type="text"
                        value={pkg.nama}
                        onChange={(e) => handleUpdatePackage(idx, "nama", e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Kategori Kolom
                      </label>
                      <select
                        value={pkg.kategori || "PAKET UTAMA"}
                        onChange={(e) => handleUpdatePackage(idx, "kategori", e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-900 dark:text-zinc-100"
                      >
                        <option value="PAKET UTAMA">PAKET UTAMA (Kiri)</option>
                        <option value="TAMBAHAN">TAMBAHAN & AKSESORIS (Kanan)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Harga Normal (Rp)
                      </label>
                      <input
                        type="number"
                        value={pkg.harga}
                        onChange={(e) =>
                          handleUpdatePackage(idx, "harga", Number(e.target.value))
                        }
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Harga Diskon (Rp)
                      </label>
                      <input
                        type="number"
                        value={pkg.harga_diskon || ""}
                        placeholder="Opsional"
                        onChange={(e) =>
                          handleUpdatePackage(
                            idx,
                            "harga_diskon",
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 font-bold"
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-end pt-5">
                      <button
                        onClick={() => handleDeletePackage(idx)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                        title="Hapus Paket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Bonus / Aksesoris Termasuk
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Bonus Dasi & Cover Jas"
                        value={pkg.bonus || ""}
                        onChange={(e) => handleUpdatePackage(idx, "bonus", e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Keterangan Tambahan
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Aneka model (Kingsman, Slimfit, Tuxedo)"
                        value={pkg.deskripsi || ""}
                        onChange={(e) => handleUpdatePackage(idx, "deskripsi", e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Promos Editor with Validity Date / Month */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                  Daftar Promo & Masa Berlaku
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Atur potongan promo, syarat, serta tanggal atau bulan berlakunya
                </p>
              </div>

              <button
                onClick={handleAddPromo}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Promo</span>
              </button>
            </div>

            <div className="space-y-3">
              {config.promos.map((promo, idx) => (
                <div
                  key={promo.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Judul Promo
                      </label>
                      <input
                        type="text"
                        value={promo.judul}
                        onChange={(e) => handleUpdatePromo(idx, "judul", e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Nominal Diskon (Rp)
                      </label>
                      <input
                        type="number"
                        value={promo.diskon_nominal}
                        onChange={(e) =>
                          handleUpdatePromo(idx, "diskon_nominal", Number(e.target.value))
                        }
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-900 dark:text-zinc-100"
                      />
                    </div>

                    <div className="sm:col-span-3 flex items-center gap-2 pt-4">
                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={promo.aktif}
                          onChange={(e) => handleUpdatePromo(idx, "aktif", e.target.checked)}
                          className="rounded text-slate-900 focus:ring-slate-900"
                        />
                        <span>Promo Aktif</span>
                      </label>
                    </div>

                    <div className="sm:col-span-1 flex justify-end pt-3">
                      <button
                        onClick={() => handleDeletePromo(idx)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                        title="Hapus Promo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Promo Validity Dates Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Label Periode (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: September - Oktober 2026"
                        value={promo.periode_label || ""}
                        onChange={(e) =>
                          handleUpdatePromo(idx, "periode_label", e.target.value)
                        }
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Tanggal Mulai Berlaku
                      </label>
                      <input
                        type="date"
                        value={promo.tanggal_mulai || ""}
                        onChange={(e) =>
                          handleUpdatePromo(idx, "tanggal_mulai", e.target.value)
                        }
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Tanggal Berakhir
                      </label>
                      <input
                        type="date"
                        value={promo.tanggal_berakhir || ""}
                        onChange={(e) =>
                          handleUpdatePromo(idx, "tanggal_berakhir", e.target.value)
                        }
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Syarat & Ketentuan Promo (Misal: Syarat KTM Mahasiswa)
                    </label>
                    <textarea
                      rows={2}
                      value={promo.syarat}
                      onChange={(e) => handleUpdatePromo(idx, "syarat", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 leading-relaxed"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Ketentuan Sewa Editor */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                  Ketentuan & Fasilitas Sewa
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Poin-poin aturan sewa yang tercantum pada dokumen
                </p>
              </div>

              <button
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    ketentuan_sewa: [...prev.ketentuan_sewa, "Aturan sewa baru..."],
                  }))
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Ketentuan</span>
              </button>
            </div>

            <div className="space-y-2">
              {config.ketentuan_sewa.map((term, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400 w-6">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={term}
                    onChange={(e) => {
                      const updated = [...config.ketentuan_sewa];
                      updated[idx] = e.target.value;
                      setConfig((prev) => ({ ...prev, ketentuan_sewa: updated }));
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100"
                  />
                  <button
                    onClick={() => {
                      const updated = [...config.ketentuan_sewa];
                      updated.splice(idx, 1);
                      setConfig((prev) => ({ ...prev, ketentuan_sewa: updated }));
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                    title="Hapus Ketentuan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  Info Deposit Standar
                </label>
                <input
                  type="text"
                  value={config.deposit_info}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, deposit_info: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  Info Denda Keterlambatan
                </label>
                <input
                  type="text"
                  value={config.late_fee_info}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, late_fee_info: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Footer Bar Settings Editor */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                Pengaturan Footer Dokumen (Kontak, Website & Alamat)
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Teks yang tercantum pada baris paling bawah dokumen pricelist
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Kontak WhatsApp (Footer Kiri)
                </label>
                <input
                  type="text"
                  value={config.store_whatsapp || ""}
                  placeholder="Contoh: +62 815-4919-3834"
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, store_whatsapp: e.target.value }))
                  }
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Website / Media Sosial (Footer Tengah)
                </label>
                <input
                  type="text"
                  value={config.store_website || ""}
                  placeholder="Contoh: WWW.STITCHANDMORAL.COM"
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, store_website: e.target.value }))
                  }
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Alamat Lengkap / Kota (Footer Kanan)
                </label>
                <input
                  type="text"
                  value={config.store_address || ""}
                  placeholder="Contoh: JL. PANGERAN SAMUDERA INDUK NO. 11, PALANGKA RAYA"
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, store_address: e.target.value }))
                  }
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                Salam Pembuka (WhatsApp Greeting)
              </label>
              <input
                type="text"
                value={config.header_greeting}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, header_greeting: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Menyimpan..." : "Simpan Semua Pengaturan"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
