/**
 * Script Migrasi Data dari Excel (Google Sheets Database) ke Supabase PostgreSQL.
 * 
 * Penggunaan:
 * 1. Pastikan .env.local berisi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY
 * 2. Jalankan: node scripts/migrate-from-excel.js
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables dari .env.local atau .env
function loadEnv() {
  const envPaths = ['.env.local', '.env'];
  for (const envPath of envPaths) {
    const fullPath = path.resolve(process.cwd(), envPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...values] = trimmed.split('=');
          if (key && values.length > 0) {
            const val = values.join('=').replace(/(^["']|["']$)/g, '').trim();
            process.env[key.trim()] = val;
          }
        }
      });
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus diisi di .env.local');
  process.exit(1);
}

const WebSocket = require('ws');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  realtime: {
    transport: WebSocket
  }
});

// Helper konversi Excel Date Serial -> YYYY-MM-DD
function excelDateToISO(serial) {
  if (!serial) return null;
  if (typeof serial === 'string') {
    const match = serial.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
  }
  const num = Number(serial);
  if (isNaN(num)) return null;
  const utc_days = Math.floor(num - 25569);
  const utc_value = utc_days * 86400;
  const date = new Date(utc_value * 1000);
  return isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

// Helper konversi Excel Date Serial -> Timestamptz string
function excelDateToTimestamp(serial) {
  if (!serial) return new Date().toISOString();
  if (typeof serial === 'string' && serial.includes(':')) {
    return new Date(serial).toISOString();
  }
  const num = Number(serial);
  if (isNaN(num)) return new Date().toISOString();
  const utc_days = Math.floor(num - 25569);
  const utc_value = (num - 25569) * 86400;
  const date = new Date(utc_value * 1000);
  return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

// Helper normalisasi nomor WA
function cleanWhatsApp(wa) {
  if (!wa) return '';
  let str = String(wa).replace(/\D/g, '');
  if (str.startsWith('0')) str = '62' + str.slice(1);
  if (!str.startsWith('62') && str.length > 5) str = '62' + str;
  return str;
}

// Helper parsing JSON item transaksi
function parseItemsJson(jsonStr) {
  if (!jsonStr) return [];
  if (Array.isArray(jsonStr)) return jsonStr;
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.warn('⚠️ Gagal parse itemsJson:', jsonStr);
    return [];
  }
}

async function runMigration() {
  const filePath = path.resolve(process.cwd(), '_legacy_gas/Database - Manajemen Sewa & Inventori.xlsx');
  const altPath = path.resolve(process.cwd(), 'Database - Manajemen Sewa & Inventori.xlsx');
  const excelFile = fs.existsSync(filePath) ? filePath : altPath;

  if (!fs.existsSync(excelFile)) {
    console.error('❌ File Excel database tidak ditemukan di:', excelFile);
    process.exit(1);
  }

  console.log('📂 Membaca file database:', excelFile);
  const wb = XLSX.readFile(excelFile);

  // 1. MIGRASI INVENTORI
  console.log('\n--- 1. Migrasi Inventori ---');
  const wsInv = wb.Sheets['Inventori'];
  if (wsInv) {
    const rows = XLSX.utils.sheet_to_json(wsInv);
    const data = rows.map(r => ({
      kode_jas: String(r.kodeJas || '').trim(),
      nama_jas: String(r.namaJas || '').trim(),
      jenis_jas: String(r.jenisJas || 'Jas').trim(),
      warna: String(r.warna || '').trim(),
      ukuran: String(r.ukuran || '').trim(),
      harga_default: Number(r.hargaDefault || 0),
      jumlah_stok: Number(r.jumlahStok || 0),
      stok_tersedia: Number(r.stokTersedia || 0),
      stok_disewa: Number(r.stokDisewa || 0),
      kondisi: String(r.kondisi || 'Baik').trim(),
      status_laundry: String(r.statusLaundry || 'Ready').trim(),
      lokasi: String(r.lokasi || '').trim(),
      foto_url: String(r.fotoUrl || '').trim(),
      catatan: String(r.catatan || '').trim(),
      created_at: excelDateToTimestamp(r.createdAt),
      updated_at: excelDateToTimestamp(r.updatedAt)
    })).filter(i => i.kode_jas);

    console.log(`Menyimpan ${data.length} barang inventori...`);
    const { error } = await supabase.from('inventori').upsert(data, { onConflict: 'kode_jas' });
    if (error) console.error('❌ Error migrasi inventori:', error.message);
    else console.log('✅ Inventori berhasil dimigrasikan:', data.length, 'baris');
  }

  // 2. MIGRASI CUSTOMER
  console.log('\n--- 2. Migrasi Customer ---');
  const wsCus = wb.Sheets['Customer'];
  if (wsCus) {
    const rows = XLSX.utils.sheet_to_json(wsCus);
    const data = rows.map(r => ({
      customer_id: String(r.customerId || '').trim(),
      nama: String(r.nama || '').trim(),
      whatsapp: cleanWhatsApp(r.whatsapp),
      alamat: String(r.alamat || '').trim(),
      instagram: String(r.instagram || '').trim(),
      foto_customer_url: String(r.fotoCustomerUrl || '').trim(),
      foto_pakai_jas_url: String(r.fotoPakaiJasUrl || '').trim(),
      catatan: String(r.catatan || '').trim(),
      status: String(r.status || 'Aktif').trim(),
      created_at: excelDateToTimestamp(r.createdAt),
      updated_at: excelDateToTimestamp(r.updatedAt)
    })).filter(c => c.customer_id);

    console.log(`Menyimpan ${data.length} customer...`);
    const { error } = await supabase.from('customer').upsert(data, { onConflict: 'customer_id' });
    if (error) console.error('❌ Error migrasi customer:', error.message);
    else console.log('✅ Customer berhasil dimigrasikan:', data.length, 'baris');
  }

  // 3. MIGRASI TRANSAKSI
  console.log('\n--- 3. Migrasi Transaksi ---');
  const wsTrx = wb.Sheets['Transaksi'];
  if (wsTrx) {
    const rows = XLSX.utils.sheet_to_json(wsTrx);
    const data = rows.map(r => {
      const subtotal = Number(r.subtotal || 0);
      const potongan = Number(r.potongan || 0);
      const denda = Number(r.denda || 0);
      const rawTotalBayar = Number(r.totalBayar || 0);
      const total_bayar = rawTotalBayar > 0 ? rawTotalBayar : Math.max(0, subtotal - potongan + denda);
      const jumlah_dibayar = Number(r.jumlahDibayar || 0);
      const sisa_pembayaran = Math.max(0, total_bayar - jumlah_dibayar);

      return {
        kode_transaksi: String(r.kodeTransaksi || '').trim(),
        customer_id: String(r.customerId || '').trim() || null,
        nama_customer: String(r.namaCustomer || '').trim(),
        whatsapp: cleanWhatsApp(r.whatsapp),
        items: parseItemsJson(r.itemsJson),
        jumlah_total: Number(r.jumlahTotal || 0),
        subtotal,
        potongan,
        deposit: Number(r.deposit || 0),
        total_bayar,
        tanggal_sewa: excelDateToISO(r.tanggalSewa),
        tanggal_kembali: excelDateToISO(r.tanggalKembali),
        tanggal_dikembalikan: excelDateToISO(r.tanggalDikembalikan),
        status: String(r.status || 'Booking').trim(),
        denda,
        deposit_kembali: Number(r.depositKembali || 0),
        foto_customer_url: String(r.fotoCustomerUrl || '').trim(),
        catatan: String(r.catatan || '').trim(),
        status_pembayaran: String(r.statusPembayaran || 'Belum Bayar').trim(),
        jumlah_dibayar,
        sisa_pembayaran,
        metode_pembayaran: String(r.metodePembayaran || '').trim() || null,
        created_at: excelDateToTimestamp(r.createdAt),
        updated_at: excelDateToTimestamp(r.updatedAt)
      };
    }).filter(t => t.kode_transaksi && t.tanggal_sewa && t.tanggal_kembali);

    console.log(`Menyimpan ${data.length} transaksi...`);
    const { error } = await supabase.from('transaksi').upsert(data, { onConflict: 'kode_transaksi' });
    if (error) console.error('❌ Error migrasi transaksi:', error.message);
    else console.log('✅ Transaksi berhasil dimigrasikan:', data.length, 'baris');
  }

  // 4. MIGRASI PENGELUARAN
  console.log('\n--- 4. Migrasi Pengeluaran ---');
  const wsExp = wb.Sheets['Pengeluaran'];
  if (wsExp) {
    const rows = XLSX.utils.sheet_to_json(wsExp);
    const data = rows.map(r => ({
      expense_id: String(r.expenseId || '').trim(),
      tanggal: excelDateToISO(r.tanggal) || new Date().toISOString().slice(0, 10),
      kategori: String(r.kategori || 'Operasional').trim(),
      deskripsi: String(r.deskripsi || '').trim(),
      jumlah: Number(r.jumlah || 0),
      catatan: String(r.catatan || '').trim(),
      created_at: excelDateToTimestamp(r.createdAt)
    })).filter(e => e.expense_id && e.deskripsi);

    console.log(`Menyimpan ${data.length} pengeluaran...`);
    const { error } = await supabase.from('pengeluaran').upsert(data, { onConflict: 'expense_id' });
    if (error) console.error('❌ Error migrasi pengeluaran:', error.message);
    else console.log('✅ Pengeluaran berhasil dimigrasikan:', data.length, 'baris');
  }

  // 5. MIGRASI MODAL
  console.log('\n--- 5. Migrasi Modal (CAPEX) ---');
  const wsMod = wb.Sheets['Modal'];
  if (wsMod) {
    const rows = XLSX.utils.sheet_to_json(wsMod);
    const data = rows.map(r => ({
      id: String(r.id || '').trim(),
      barang: String(r.barang || '').trim(),
      satuan: String(r.satuan || 'Pcs').trim(),
      merk: String(r.merk || '').trim(),
      jumlah: Number(r.jumlah || 1),
      harga_satuan: Number(r.hargaSatuan || 0),
      total_harga: Number(r.totalHarga || (Number(r.jumlah || 1) * Number(r.hargaSatuan || 0))),
      catatan: String(r.catatan || '').trim(),
      created_at: excelDateToTimestamp(r.createdAt)
    })).filter(m => m.id && m.barang);

    console.log(`Menyimpan ${data.length} aset modal...`);
    const { error } = await supabase.from('modal').upsert(data, { onConflict: 'id' });
    if (error) console.error('❌ Error migrasi modal:', error.message);
    else console.log('✅ Modal berhasil dimigrasikan:', data.length, 'baris');
  }

  console.log('\n🎉 Selesai! Semua data dari Excel berhasil dimigrasikan ke Supabase.');
}

runMigration().catch(console.error);
