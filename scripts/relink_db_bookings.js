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

async function relinkBookings() {
  console.log('=== Starting Database Re-linking Process ===');
  const { data: inventory, error: invErr } = await supabase.from('inventori').select('*');
  if (invErr) {
    console.error('Failed to fetch inventory:', invErr);
    return;
  }
  const { data: transactions, error: txErr } = await supabase.from('transaksi').select('*');
  if (txErr) {
    console.error('Failed to fetch transactions:', txErr);
    return;
  }

  const invByCode = new Map();
  inventory.forEach(inv => invByCode.set(inv.kode_jas, inv));

  let updatedTxCount = 0;
  let reconnectedItemsCount = 0;

  for (const tx of transactions) {
    if (!Array.isArray(tx.items) || tx.items.length === 0) continue;

    let modified = false;
    const newItems = tx.items.map(itm => {
      // If already matching an inventory code, keep as is
      if (invByCode.has(itm.kodeJas)) {
        return itm;
      }

      // Find matching inventory by name + size + color
      const match = inventory.find(inv => {
        const sameName = inv.nama_jas.trim().toLowerCase() === (itm.namaJas || '').trim().toLowerCase();
        const sameSize = !itm.ukuran || !inv.ukuran || inv.ukuran.trim().toLowerCase() === itm.ukuran.trim().toLowerCase();
        const sameColor = !itm.warna || !inv.warna || inv.warna.trim().toLowerCase() === itm.warna.trim().toLowerCase();
        return sameName && sameSize && sameColor;
      }) || inventory.find(inv => inv.nama_jas.trim().toLowerCase() === (itm.namaJas || '').trim().toLowerCase());

      if (match) {
        console.log(`[Tx: ${tx.kode_transaksi} - ${tx.nama_customer}] Reconnecting item "${itm.namaJas} (${itm.ukuran || '-'})": "${itm.kodeJas}" -> "${match.kode_jas}"`);
        modified = true;
        reconnectedItemsCount++;
        return {
          ...itm,
          kodeJas: match.kode_jas,
          namaJas: match.nama_jas,
          warna: itm.warna || match.warna,
          ukuran: itm.ukuran || match.ukuran,
          jenisJas: itm.jenisJas || match.jenis_jas,
        };
      } else {
        console.warn(`[Tx: ${tx.kode_transaksi}] No inventory match found for item: "${itm.namaJas}" (code: ${itm.kodeJas})`);
        return itm;
      }
    });

    if (modified) {
      const { error: updateErr } = await supabase
        .from('transaksi')
        .update({ items: newItems })
        .eq('id', tx.id);

      if (updateErr) {
        console.error(`Error updating transaction ${tx.kode_transaksi}:`, updateErr);
      } else {
        updatedTxCount++;
      }
    }
  }

  console.log(`\n=== Re-linking Summary ===`);
  console.log(`Total transactions updated: ${updatedTxCount}`);
  console.log(`Total items reconnected: ${reconnectedItemsCount}`);
}

relinkBookings();
