export interface PricelistPackage {
  id: string;
  nama: string; // e.g. "Sewa Jas Saja (Bonus Dasi)"
  harga: number; // e.g. 150000
  harga_diskon?: number; // e.g. 180000
  bonus?: string; // e.g. "Bonus Dasi & Sarung Jas"
  deskripsi?: string; // e.g. "Sudah termasuk laundry toko & hanger"
  kategori?: string; // e.g. "SEWA UTAMA" atau "TAMBAHAN"
  is_popular?: boolean;
}

export interface PricelistPromo {
  id: string;
  judul: string; // e.g. "Diskon Mahasiswa (KTM)"
  diskon_nominal: number; // e.g. 25000
  syarat: string; // e.g. "Potongan Rp 25.000 khusus sewa jas dengan menunjukkan KTM aktif."
  tanggal_mulai?: string; // e.g. "2026-09-01"
  tanggal_berakhir?: string; // e.g. "2026-10-31"
  periode_label?: string; // e.g. "September - Oktober 2026"
  aktif: boolean;
}

export interface PricelistConfig {
  header_greeting: string;
  intro_text: string;
  subtitle_left: string;
  subtitle_center: string;
  subtitle_right: string;
  packages: PricelistPackage[];
  promos: PricelistPromo[];
  deposit_info: string;
  late_fee_info: string;
  ketentuan_sewa: string[];
  footer_text: string;
  store_name: string;
  store_address: string;
  store_whatsapp: string;
  store_website?: string;
  updated_at?: string;
}

export const DEFAULT_PRICELIST_CONFIG: PricelistConfig = {
  store_name: "STITCH & MORAL",
  store_address: "Jl. Pangeran Samudera Induk No. 11, Palangka Raya",
  store_whatsapp: "+62 815-4919-3834",
  store_website: "stitchandmoral.com",
  subtitle_left: "SEWA JAS & TUXEDO",
  subtitle_center: "STITCH & MORAL",
  subtitle_right: "PRICE LIST",
  header_greeting: "Halo kak, berikut adalah daftar harga sewa dan promo aktif Stitch & Moral:",
  intro_text: "DAFTAR HARGA SEWA & PROMO",
  packages: [
    {
      id: "pkg-jas",
      nama: "SEWA JAS (BONUS DASI)",
      harga: 150000,
      bonus: "Bonus Dasi & Cover Jas",
      deskripsi: "Tersedia aneka model (Kingsman, Slimfit, Tuxedo)",
      kategori: "PAKET UTAMA",
      is_popular: false,
    },
    {
      id: "pkg-celana",
      nama: "SEWA CELANA FORMAL",
      harga: 50000,
      bonus: "Hanger & Siap Pakai",
      deskripsi: "Bahan wool & drill premium nyaman dipakai",
      kategori: "TAMBAHAN",
      is_popular: false,
    },
    {
      id: "pkg-lengkap",
      nama: "JAS + CELANA (BONUS DASI)",
      harga: 200000,
      harga_diskon: 180000,
      bonus: "Gratis Dasi + Cover Jas + Celana",
      deskripsi: "Setelan lengkap hemat Rp 20.000",
      kategori: "PAKET UTAMA",
      is_popular: true,
    },
    {
      id: "pkg-dasi",
      nama: "SEWA DASI / BOWTIE",
      harga: 15000,
      bonus: "Aneka Motif & Warna",
      deskripsi: "Dasi panjang, dasi kupu-kupu, suspender",
      kategori: "TAMBAHAN",
      is_popular: false,
    },
  ],
  promos: [
    {
      id: "promo-mahasiswa",
      judul: "POTONGAN MAHASISWA (KTM)",
      diskon_nominal: 25000,
      syarat: "Potongan Rp 25.000 khusus sewa jas saja dengan menunjukkan status mahasiswa melalui KTM aktif.",
      tanggal_mulai: "2026-09-01",
      tanggal_berakhir: "2026-10-31",
      periode_label: "September - Oktober 2026",
      aktif: true,
    },
    {
      id: "promo-paket-lengkap",
      judul: "DISKON PAKET LENGKAP SETELAN",
      diskon_nominal: 20000,
      syarat: "Khusus sewa Jas + Dasi + Celana otomatis mendapat potongan Rp 20.000 (dari Rp 200.000 menjadi Rp 180.000).",
      tanggal_mulai: "2026-09-01",
      tanggal_berakhir: "2026-12-31",
      periode_label: "Berlaku Setiap Hari",
      aktif: true,
    },
  ],
  deposit_info: "Deposit jaminan standar Rp 50.000 (dikembalikan saat jas selesai sewa).",
  late_fee_info: "Denda keterlambatan pengembalian Rp 25.000 / hari.",
  ketentuan_sewa: [
    "Sistem sewa standar: H-1 ambil & H+1 pengembalian.",
    "Wajib menitipkan identitas asli (KTP / SIM / KTM) selama masa sewa.",
    "Penyewa tidak perlu mencuci jas, laundry ditangani oleh toko.",
    "Kerusakan atau kehilangan dikenakan biaya penggantian.",
  ],
  footer_text: "Silakan kirim format booking atau tanyakan ketersediaan tanggal acara Anda kepada admin kami.",
};
