export interface TransactionItem {
  kodeJas: string;
  namaJas: string;
  jenisJas?: string;
  warna?: string;
  ukuran?: string;
  jumlah: number;
  harga: number; // total harga sewa per unit untuk seluruh durasi
  harga_per_hari?: number; // harga sewa per 1 hari
  durasi_hari?: number; // durasi hari sewa
}

export interface Inventori {
  id: string;
  kode_jas: string;
  nama_jas: string;
  jenis_jas: string;
  warna: string;
  ukuran: string;
  harga_default: number;
  jumlah_stok: number;
  stok_tersedia: number;
  stok_disewa: number;
  kondisi: "Baik" | "Rusak Ringan" | "Perlu Laundry" | "Tidak Layak" | string;
  status_laundry: "Ready" | "Perlu Laundry" | "Sedang Laundry" | string;
  lokasi: string;
  foto_url: string;
  catatan: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  customer_id: string;
  nama: string;
  whatsapp: string;
  alamat: string;
  instagram: string;
  foto_customer_url: string;
  foto_pakai_jas_url: string;
  catatan: string;
  status: "Aktif" | "Loyal" | "Blacklist" | string;
  created_at: string;
  updated_at: string;
}

export interface Transaksi {
  id: string;
  kode_transaksi: string;
  customer_id: string | null;
  nama_customer: string;
  whatsapp: string;
  items: TransactionItem[];
  jumlah_total: number;
  subtotal: number;
  potongan: number;
  deposit: number;
  total_bayar: number;
  tanggal_sewa: string;
  tanggal_kembali: string;
  tanggal_dikembalikan: string | null;
  status: "Booking" | "Sedang Disewa" | "Selesai" | "Terlambat" | "Dibatalkan" | string;
  denda: number;
  deposit_kembali: number;
  foto_customer_url: string;
  catatan: string;
  status_pembayaran: "Belum Bayar" | "DP" | "Lunas" | string;
  jumlah_dibayar: number;
  sisa_pembayaran: number;
  metode_pembayaran: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pengeluaran {
  id: string;
  expense_id: string;
  tanggal: string;
  kategori: string;
  deskripsi: string;
  jumlah: number;
  catatan: string;
  created_at: string;
}

export interface ModalItem {
  id: string;
  barang: string;
  satuan: string;
  merk: string;
  jumlah: number;
  harga_satuan: number;
  total_harga: number;
  catatan: string;
  created_at: string;
}

export interface Pengaturan {
  key: string;
  value: string;
  deskripsi?: string;
}
