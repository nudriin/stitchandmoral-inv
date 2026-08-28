-- ==============================================================================
-- SCHEMA DATABASE SUPABASE: STITCH AND MORAL (SEWA JAS)
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. TABEL INVENTORI
CREATE TABLE IF NOT EXISTS public.inventori (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_jas text UNIQUE NOT NULL,
  nama_jas text NOT NULL,
  jenis_jas text DEFAULT 'Jas',
  warna text,
  ukuran text,
  harga_default numeric(12,2) DEFAULT 0,
  jumlah_stok integer DEFAULT 0,
  stok_tersedia integer DEFAULT 0,
  stok_disewa integer DEFAULT 0,
  kondisi text DEFAULT 'Baik',
  status_laundry text DEFAULT 'Ready',
  lokasi text,
  foto_url text,
  catatan text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. TABEL CUSTOMER
CREATE TABLE IF NOT EXISTS public.customer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id text UNIQUE NOT NULL,
  nama text NOT NULL,
  whatsapp text,
  alamat text,
  instagram text,
  foto_customer_url text,
  foto_pakai_jas_url text,
  catatan text,
  status text DEFAULT 'Aktif',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. TABEL TRANSAKSI
CREATE TABLE IF NOT EXISTS public.transaksi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_transaksi text UNIQUE NOT NULL,
  customer_id text REFERENCES public.customer(customer_id) ON UPDATE CASCADE ON DELETE SET NULL,
  nama_customer text NOT NULL,
  whatsapp text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  jumlah_total integer DEFAULT 0,
  subtotal numeric(12,2) DEFAULT 0,
  potongan numeric(12,2) DEFAULT 0,
  deposit numeric(12,2) DEFAULT 0,
  total_bayar numeric(12,2) DEFAULT 0,
  tanggal_sewa date NOT NULL,
  tanggal_kembali date NOT NULL,
  tanggal_dikembalikan date,
  status text DEFAULT 'Booking', -- Booking, Sedang Disewa, Selesai, Terlambat, Dibatalkan
  denda numeric(12,2) DEFAULT 0,
  deposit_kembali numeric(12,2) DEFAULT 0,
  foto_customer_url text,
  catatan text,
  status_pembayaran text DEFAULT 'Belum Bayar', -- Belum Bayar, DP, Lunas
  jumlah_dibayar numeric(12,2) DEFAULT 0,
  sisa_pembayaran numeric(12,2) DEFAULT 0,
  metode_pembayaran text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. TABEL PENGELUARAN (Operasional)
CREATE TABLE IF NOT EXISTS public.pengeluaran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id text UNIQUE NOT NULL,
  tanggal date DEFAULT CURRENT_DATE,
  kategori text DEFAULT 'Operasional',
  deskripsi text NOT NULL,
  jumlah numeric(12,2) DEFAULT 0,
  catatan text,
  created_at timestamptz DEFAULT now()
);

-- 6. TABEL MODAL (Aset CAPEX untuk perhitungan BEP)
CREATE TABLE IF NOT EXISTS public.modal (
  id text PRIMARY KEY,
  barang text NOT NULL,
  satuan text DEFAULT 'Pcs',
  merk text,
  jumlah numeric(10,2) DEFAULT 1,
  harga_satuan numeric(12,2) DEFAULT 0,
  total_harga numeric(12,2) DEFAULT 0,
  catatan text,
  created_at timestamptz DEFAULT now()
);

-- 7. TABEL PENGATURAN
CREATE TABLE IF NOT EXISTS public.pengaturan (
  key text PRIMARY KEY,
  value text NOT NULL,
  deskripsi text
);

-- Default Settings
INSERT INTO public.pengaturan (key, value, deskripsi) VALUES
  ('store_name', 'Stitch and Moral - Sewa Jas PKY', 'Nama Toko / Rental'),
  ('late_fee_per_day', '25000', 'Nominal denda keterlambatan per hari'),
  ('default_deposit', '50000', 'Deposit standar per transaksi')
ON CONFLICT (key) DO NOTHING;

-- 8. INDEXES UNTUK PERFORMA
CREATE INDEX IF NOT EXISTS idx_inventori_kode ON public.inventori(kode_jas);
CREATE INDEX IF NOT EXISTS idx_customer_id ON public.customer(customer_id);
CREATE INDEX IF NOT EXISTS idx_transaksi_kode ON public.transaksi(kode_transaksi);
CREATE INDEX IF NOT EXISTS idx_transaksi_customer_id ON public.transaksi(customer_id);
CREATE INDEX IF NOT EXISTS idx_transaksi_tanggal_sewa ON public.transaksi(tanggal_sewa);
CREATE INDEX IF NOT EXISTS idx_transaksi_tanggal_kembali ON public.transaksi(tanggal_kembali);
CREATE INDEX IF NOT EXISTS idx_transaksi_status ON public.transaksi(status);

-- 9. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.inventori ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengeluaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengaturan ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS: User authenticated memiliki akses penuh (Single Admin / Kasir)
CREATE POLICY "Authenticated users have full access to inventori"
  ON public.inventori FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users have full access to customer"
  ON public.customer FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users have full access to transaksi"
  ON public.transaksi FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users have full access to pengeluaran"
  ON public.pengeluaran FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users have full access to modal"
  ON public.modal FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users have full access to pengaturan"
  ON public.pengaturan FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 10. STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Access for Assets"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'assets');

CREATE POLICY "Authenticated Upload Access for Assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'assets');

CREATE POLICY "Authenticated Delete Access for Assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'assets');

-- 11. TRIGGER FUNCTION: Auto Update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_inventori_updated_at
  BEFORE UPDATE ON public.inventori
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trg_customer_updated_at
  BEFORE UPDATE ON public.customer
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trg_transaksi_updated_at
  BEFORE UPDATE ON public.transaksi
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
