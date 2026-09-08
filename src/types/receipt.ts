export interface ReceiptConfig {
  title: string;
  brand_name: string;
  brand_sub?: string;
  store_address: string;
  store_city: string;
  store_whatsapp: string;
  terms: string[];
  contact_note: string;
  manager_name: string;
  manager_title: string;
  show_signature: boolean;
  updated_at?: string;
}

export const DEFAULT_RECEIPT_CONFIG: ReceiptConfig = {
  title: "INVOICE",
  brand_name: "STITCH & MORAL",
  brand_sub: "SEWA JAS & TUXEDO",
  store_address: "JL. PANGERAN SAMUDERA INDUK NO. 11",
  store_city: "PALANGKA RAYA",
  store_whatsapp: "+62 815-4919-3834",
  terms: [
    "Wajib menitipkan kartu identitas asli (KTP/SIM) selama masa sewa.",
    "Sistem sewa standar: H-1 ambil & H+1 kembali.",
    "Penyewa tidak perlu mencuci jas, laundry ditangani oleh toko.",
    "Kerusakan atau kehilangan jas/aksesoris dikenakan biaya penggantian.",
    "Keterlambatan pengembalian dikenakan denda sesuai ketentuan toko.",
  ],
  contact_note: "UNTUK PERTANYAAN ATAU KONSULTASI HUBUNGI KONTAK DI ATAS",
  manager_name: "ADMIN STITCH & MORAL",
  manager_title: "PENANGGUNG JAWAB",
  show_signature: true,
};
