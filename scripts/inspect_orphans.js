const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function inspectAndRelink() {
  console.log('--- Inspecting Inventory & Transactions ---');
  const { data: inventory, error: invErr } = await supabase.from('inventori').select('*');
  if (invErr) {
    console.error('Inv error:', invErr);
    return;
  }
  const { data: transactions, error: txErr } = await supabase.from('transaksi').select('*');
  if (txErr) {
    console.error('Tx error:', txErr);
    return;
  }

  console.log(`Total Inventory: ${inventory.length}`);
  console.log(`Total Transactions: ${transactions.length}`);

  const invByCode = new Map();
  inventory.forEach(inv => {
    invByCode.set(inv.kode_jas, inv);
  });

  const orphanedItems = [];
  const activeTx = transactions.filter(t => ['Booking', 'Sedang Disewa', 'Terlambat'].includes(t.status));
  console.log(`Active Transactions: ${activeTx.length}`);

  activeTx.forEach(tx => {
    if (Array.isArray(tx.items)) {
      tx.items.forEach(itm => {
        if (!invByCode.has(itm.kodeJas)) {
          orphanedItems.push({
            txId: tx.id,
            kode_transaksi: tx.kode_transaksi,
            customer: tx.nama_customer,
            status: tx.status,
            dates: `${tx.tanggal_sewa} - ${tx.tanggal_kembali}`,
            item: itm
          });
        }
      });
    }
  });

  console.log(`\nFound ${orphanedItems.length} orphaned item(s) in active transactions:`);
  orphanedItems.forEach(o => {
    console.log(JSON.stringify(o, null, 2));
    // Try to find matching inventory by name & attributes
    const match = inventory.find(inv => {
      const matchName = inv.nama_jas.toLowerCase() === (o.item.namaJas || '').toLowerCase();
      const matchUkuran = !o.item.ukuran || inv.ukuran === o.item.ukuran;
      const matchWarna = !o.item.warna || inv.warna === o.item.warna;
      return matchName && matchUkuran && matchWarna;
    }) || inventory.find(inv => inv.nama_jas.toLowerCase() === (o.item.namaJas || '').toLowerCase());

    if (match) {
      console.log(`  -> Matched with Inventory [${match.id}]: current kode_jas="${match.kode_jas}", name="${match.nama_jas}"`);
    } else {
      console.log(`  -> No direct name match found in inventory.`);
    }
  });
}

inspectAndRelink();
