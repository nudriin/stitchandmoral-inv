const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

const WebSocket = require('ws');

loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
    realtime: { transport: WebSocket }
  }
);

async function main() {
  const settings = [
    { key: 'app_pin', value: '123456', deskripsi: 'PIN 6 Digit Akses Cepat' },
    { key: 'admin_email', value: 'admin@stitchandmoral.com', deskripsi: 'Email Akun Admin' },
    { key: 'admin_password', value: 'admin123456', deskripsi: 'Password Akun Admin' }
  ];

  for (const s of settings) {
    const { data, error } = await supabase
      .from('pengaturan')
      .upsert(s, { onConflict: 'key' })
      .select();
    
    if (error) console.error('Error upserting', s.key, error);
    else console.log('Upserted:', s.key, '->', data);
  }

  const { data: allSettings, error: fetchErr } = await supabase.from('pengaturan').select('*');
  console.log('\nCurrent settings in DB:', allSettings);
}

main().catch(console.error);
