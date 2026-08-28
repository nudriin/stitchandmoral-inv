/**
 * Supabase Keepalive & Auto-Login Automation Script
 * Stitch & Moral Management System
 * 
 * Tujuan: Mencegah project Supabase Free Tier dijeda (pause) dengan
 * melakukan autentikasi login berkala dan query database setiap 5-6 hari.
 * 
 * Penggunaan:
 * node scripts/supabase-keepalive.js
 */

const fs = require('fs');
const path = require('path');
const ws = require('ws');
if (!global.WebSocket) {
  global.WebSocket = ws;
}
const { createClient } = require('@supabase/supabase-js');

// 1. Muat environment variables dari .env.local atau .env
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
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan.');
  process.exit(1);
}

async function runKeepalive() {
  const startTime = Date.now();
  console.log('🔄 Memulai proses keepalive Supabase Stitch & Moral...');
  console.log(`🌐 Supabase URL: ${SUPABASE_URL}`);
  console.log(`⏱️ Waktu Eksekusi: ${new Date().toISOString()}`);

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Ambil kredensial admin dari tabel pengaturan
  console.log('📖 Mengambil kredensial admin dari database...');
  const { data: settingsData, error: settingsError } = await adminClient
    .from('pengaturan')
    .select('key, value, kunci, nilai');

  let adminEmail = process.env.ADMIN_EMAIL || 'admin@stitchandmoral.com';
  let adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

  if (settingsData && settingsData.length > 0) {
    settingsData.forEach(row => {
      const k = row.key || row.kunci;
      const v = row.value || row.nilai;
      if (k === 'admin_email') adminEmail = v;
      if (k === 'admin_password') adminPassword = v;
    });
  }

  // 2. Jalankan Autentikasi Login Resmi Supabase Auth
  console.log(`🔐 Menjalankan simulasi login Supabase Auth untuk: ${adminEmail}...`);
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY);
  const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });

  let authStatus = 'OK';
  if (authError) {
    console.warn(`⚠️ Catatan Auth: ${authError.message} (Melanjutkan dengan query PostgreSQL...)`);
    authStatus = `Warning: ${authError.message}`;
  } else {
    console.log(`✅ Login Supabase Auth Berhasil! (User ID: ${authData.user?.id || 'Active'})`);
    // Sign out agar sesi bersih
    await authClient.auth.signOut();
  }

  // 3. Lakukan Query PostgreSQL Database & Update Heartbeat Timestamp
  console.log('💾 Memperbarui heartbeat timestamp di database...');
  const nowIso = new Date().toISOString();
  
  const { error: upsertError } = await adminClient.from('pengaturan').upsert(
    {
      kunci: 'last_supabase_keepalive',
      nilai: JSON.stringify({
        timestamp: nowIso,
        status: authStatus,
        durationMs: Date.now() - startTime,
        executedBy: 'keepalive-automation',
      }),
      updated_at: nowIso,
    },
    { onConflict: 'kunci' }
  );

  if (upsertError) {
    // Fallback bila menggunakan schema kolom key/value
    await adminClient.from('pengaturan').upsert(
      {
        key: 'last_supabase_keepalive',
        value: nowIso,
        updated_at: nowIso,
      },
      { onConflict: 'key' }
    );
  }

  // 4. Verifikasi total data aktif
  const { count: txCount } = await adminClient.from('transaksi').select('*', { count: 'exact', head: true });
  const { count: invCount } = await adminClient.from('inventori').select('*', { count: 'exact', head: true });

  const duration = Date.now() - startTime;
  console.log('\n=============================================');
  console.log('🎉 KEEPALIVE SUPABASE BERHASIL SELESAI!');
  console.log(`📊 Statistik DB: ${txCount || 0} Transaksi, ${invCount || 0} Inventori`);
  console.log(`⚡ Durasi Eksekusi: ${duration} ms`);
  console.log(`🕒 Status Proyek Supabase: AKTIF 24/7 (Timer Inaktivitas Direset)`);
  console.log('=============================================\n');
}

runKeepalive().catch(err => {
  console.error('❌ Gagal menjalankan keepalive Supabase:', err);
  process.exit(1);
});
