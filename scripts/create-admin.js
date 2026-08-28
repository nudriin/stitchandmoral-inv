/**
 * Script membuat akun admin Supabase langsung dari terminal.
 * Jalankan: node scripts/create-admin.js <email> <password>
 * Contoh: node scripts/create-admin.js admin@stitchandmoral.com rahasia123
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        if (key && values.length > 0) {
          process.env[key.trim()] = values.join('=').replace(/(^["']|["']$)/g, '').trim();
        }
      }
    });
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus ada di .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: WebSocket }
});

async function createAdmin() {
  const email = process.argv[2] || 'admin@stitchandmoral.com';
  const password = process.argv[3] || 'admin123456';

  console.log(`\nMembuat akun admin: ${email}...`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error) {
    console.error('❌ Gagal membuat akun:', error.message);
  } else {
    console.log('✅ Akun Admin Berhasil Dibuat!');
    console.log('---------------------------------');
    console.log(`📧 Email    : ${data.user.email}`);
    console.log(`🔑 Password : ${password}`);
    console.log('---------------------------------');
    console.log('Sekarang Anda bisa login menggunakan akun di atas.');
  }
}

createAdmin().catch(console.error);
