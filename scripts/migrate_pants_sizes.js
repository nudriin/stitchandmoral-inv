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

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or Key not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function runMigration() {
  console.log('====================================================');
  console.log('   MIGRASI OTOMATIS VARIAN UKURAN CELANA');
  console.log('====================================================\n');

  // 1. Fetch current inventory & transactions
  const { data: invData, error: invErr } = await supabase.from('inventori').select('*');
  if (invErr) throw new Error('Gagal fetch inventori: ' + invErr.message);

  const { data: txData, error: txErr } = await supabase.from('transaksi').select('*');
  if (txErr) throw new Error('Gagal fetch transaksi: ' + txErr.message);

  console.log(`Total Inventori saat ini: ${invData.length}`);
  console.log(`Total Transaksi saat ini: ${txData.length}\n`);

  const oldKingsman = invData.find(i => i.kode_jas === 'JAS-1789297543399' || (i.nama_jas.toLowerCase().includes('celana kingsman black') && i.ukuran.includes('-')));
  const oldYgt = invData.find(i => i.kode_jas === 'JAS-1788264301348' || (i.nama_jas.toLowerCase().includes('celana ygt black stretch') && i.ukuran.includes('-')));

  const defaultFotoKm = oldKingsman?.foto_url || '';
  const defaultFotoYgt = oldYgt?.foto_url || '';

  // 2. Definisi Varian Baru
  const newVariants = [
    // Kingsman Black (Total: 6)
    {
      kode_jas: 'JAS-CELANA-KM-32',
      nama_jas: 'Celana Kingsman Black (32)',
      jenis_jas: 'Celana',
      warna: 'Hitam',
      ukuran: '32',
      harga_default: 50000,
      jumlah_stok: 2,
      stok_tersedia: 2,
      stok_disewa: 0,
      kondisi: 'Baik',
      status_laundry: 'Ready',
      lokasi: 'Toko',
      foto_url: defaultFotoKm,
      catatan: 'Varian Celana Kingsman Black Ukuran 32',
    },
    {
      kode_jas: 'JAS-CELANA-KM-34',
      nama_jas: 'Celana Kingsman Black (34)',
      jenis_jas: 'Celana',
      warna: 'Hitam',
      ukuran: '34',
      harga_default: 50000,
      jumlah_stok: 3,
      stok_tersedia: 3,
      stok_disewa: 0,
      kondisi: 'Baik',
      status_laundry: 'Ready',
      lokasi: 'Toko',
      foto_url: defaultFotoKm,
      catatan: 'Varian Celana Kingsman Black Ukuran 34',
    },
    {
      kode_jas: 'JAS-CELANA-KM-36',
      nama_jas: 'Celana Kingsman Black (36)',
      jenis_jas: 'Celana',
      warna: 'Hitam',
      ukuran: '36',
      harga_default: 50000,
      jumlah_stok: 1,
      stok_tersedia: 1,
      stok_disewa: 0,
      kondisi: 'Baik',
      status_laundry: 'Ready',
      lokasi: 'Toko',
      foto_url: defaultFotoKm,
      catatan: 'Varian Celana Kingsman Black Ukuran 36',
    },

    // YGT Black Stretch (Total: 5)
    {
      kode_jas: 'JAS-CELANA-YGT-32',
      nama_jas: 'Celana YGT Black Stretch (32)',
      jenis_jas: 'Celana',
      warna: 'Hitam',
      ukuran: '32',
      harga_default: 50000,
      jumlah_stok: 2,
      stok_tersedia: 2,
      stok_disewa: 0,
      kondisi: 'Baik',
      status_laundry: 'Ready',
      lokasi: 'Toko',
      foto_url: defaultFotoYgt,
      catatan: 'Varian Celana YGT Black Stretch Ukuran 32',
    },
    {
      kode_jas: 'JAS-CELANA-YGT-36',
      nama_jas: 'Celana YGT Black Stretch (36)',
      jenis_jas: 'Celana',
      warna: 'Hitam',
      ukuran: '36',
      harga_default: 50000,
      jumlah_stok: 2,
      stok_tersedia: 2,
      stok_disewa: 0,
      kondisi: 'Baik',
      status_laundry: 'Ready',
      lokasi: 'Toko',
      foto_url: defaultFotoYgt,
      catatan: 'Varian Celana YGT Black Stretch Ukuran 36',
    },
    {
      kode_jas: 'JAS-CELANA-YGT-38',
      nama_jas: 'Celana YGT Black Stretch (38)',
      jenis_jas: 'Celana',
      warna: 'Hitam',
      ukuran: '38',
      harga_default: 50000,
      jumlah_stok: 1,
      stok_tersedia: 1,
      stok_disewa: 0,
      kondisi: 'Baik',
      status_laundry: 'Ready',
      lokasi: 'Toko',
      foto_url: defaultFotoYgt,
      catatan: 'Varian Celana YGT Black Stretch Ukuran 38',
    },
  ];

  console.log('Menyimpan 6 varian inventori baru ke Supabase...');
  for (const variant of newVariants) {
    const existing = invData.find(i => i.kode_jas === variant.kode_jas);
    if (existing) {
      const { error: upErr } = await supabase
        .from('inventori')
        .update(variant)
        .eq('id', existing.id);
      if (upErr) throw new Error(`Gagal update ${variant.kode_jas}: ` + upErr.message);
      console.log(` -> Updated: ${variant.kode_jas} (${variant.nama_jas}, Stok: ${variant.jumlah_stok})`);
    } else {
      const { error: insErr } = await supabase
        .from('inventori')
        .insert([variant]);
      if (insErr) throw new Error(`Gagal insert ${variant.kode_jas}: ` + insErr.message);
      console.log(` -> Inserted: ${variant.kode_jas} (${variant.nama_jas}, Stok: ${variant.jumlah_stok})`);
    }
  }

  // 3. Helper pemetaan ukuran dari catatan/item
  function detectPantsSize(tx, item, isKingsman) {
    const note = (tx.catatan || '').toLowerCase();

    // Check specific sizes from notes FIRST
    if (isKingsman) {
      if (note.includes('34')) return '34';
      if (note.includes('32')) return '32';
      if (note.includes('36')) return '36';

      const itemText = `${item.ukuran || ''} ${item.namaJas || ''}`;
      if (itemText.includes('34') && !itemText.includes('32-34') && !itemText.includes('32-36')) return '34';
      if (itemText.includes('36')) return '36';
      if (itemText.includes('32')) return '32';
      return '32';
    } else {
      // YGT Black Stretch (32, 36, 38)
      if (note.includes('38')) return '38';
      if (note.includes('36')) return '36';
      if (note.includes('32')) return '32';
      if (note.includes('34')) return '32'; // Closest size for YGT

      const itemText = `${item.ukuran || ''} ${item.namaJas || ''}`;
      if (itemText.includes('38')) return '38';
      if (itemText.includes('36')) return '36';
      if (itemText.includes('32')) return '32';
      return '32';
    }
  }

  // 4. Update dan Relink Semua Transaksi
  console.log('\nMemproses relink seluruh transaksi...');
  let updatedTxCount = 0;

  for (const tx of txData) {
    let modified = false;
    const newItems = (tx.items || []).map((item) => {
      const isKm =
        item.kodeJas === 'JAS-1789297543399' ||
        item.kodeJas?.startsWith('JAS-CELANA-KM') ||
        (item.namaJas?.toLowerCase().includes('kingsman') && (item.jenisJas?.toLowerCase() === 'celana' || item.namaJas?.toLowerCase().includes('celana')));

      const isYgt =
        item.kodeJas === 'JAS-1788264301348' ||
        item.kodeJas?.startsWith('JAS-CELANA-YGT') ||
        (item.namaJas?.toLowerCase().includes('ygt black stretch') && (item.jenisJas?.toLowerCase() === 'celana' || item.namaJas?.toLowerCase().includes('celana')));

      if (isKm) {
        const size = detectPantsSize(tx, item, true);
        const targetCode = `JAS-CELANA-KM-${size}`;
        const targetName = `Celana Kingsman Black (${size})`;
        console.log(` [Relink KM] ${tx.kode_transaksi} (${tx.nama_customer}, ${tx.status}) -> Size: ${size} (${targetCode})`);
        modified = true;
        return {
          ...item,
          kodeJas: targetCode,
          namaJas: targetName,
          jenisJas: 'Celana',
          warna: 'Hitam',
          ukuran: size,
          harga_per_hari: item.harga_per_hari || (item.durasi_hari ? Math.round(item.harga / item.durasi_hari) : item.harga),
        };
      }

      if (isYgt) {
        const size = detectPantsSize(tx, item, false);
        const targetCode = `JAS-CELANA-YGT-${size}`;
        const targetName = `Celana YGT Black Stretch (${size})`;
        console.log(` [Relink YGT] ${tx.kode_transaksi} (${tx.nama_customer}, ${tx.status}) -> Size: ${size} (${targetCode})`);
        modified = true;
        return {
          ...item,
          kodeJas: targetCode,
          namaJas: targetName,
          jenisJas: 'Celana',
          warna: 'Hitam',
          ukuran: size,
          harga_per_hari: item.harga_per_hari || (item.durasi_hari ? Math.round(item.harga / item.durasi_hari) : item.harga),
        };
      }

      return item;
    });

    if (modified) {
      const { error: txUpErr } = await supabase
        .from('transaksi')
        .update({ items: newItems })
        .eq('id', tx.id);

      if (txUpErr) throw new Error(`Gagal update transaksi ${tx.kode_transaksi}: ` + txUpErr.message);
      updatedTxCount++;
    }
  }

  console.log(`\nBerhasil memperbarui dan me-relink ${updatedTxCount} transaksi!`);

  // 5. Fetch fresh active transactions to compute exact booked stock per item
  const { data: freshTxData, error: freshErr } = await supabase.from('transaksi').select('*');
  if (freshErr) throw new Error('Gagal fetch fresh transaksi: ' + freshErr.message);

  const activeTxList = freshTxData.filter(
    (t) => t.status === 'Booking' || t.status === 'Sedang Disewa' || t.status === 'Disewa'
  );

  console.log(`\nMenghitung status stok disewa dari ${activeTxList.length} transaksi aktif...`);

  // Recalculate stok_disewa for each new variant
  for (const variant of newVariants) {
    let bookedQty = 0;
    activeTxList.forEach((tx) => {
      (tx.items || []).forEach((it) => {
        if (it.kodeJas === variant.kode_jas) {
          bookedQty += Number(it.jumlah || 1);
        }
      });
    });

    const totalStock = variant.jumlah_stok;
    const availableStock = Math.max(0, totalStock - bookedQty);

    const { error: stockUpErr } = await supabase
      .from('inventori')
      .update({
        stok_disewa: bookedQty,
        stok_tersedia: availableStock,
      })
      .eq('kode_jas', variant.kode_jas);

    if (stockUpErr) throw new Error(`Gagal update stok ${variant.kode_jas}: ` + stockUpErr.message);

    console.log(
      ` -> ${variant.kode_jas.padEnd(20)}: Total = ${totalStock}, Disewa = ${bookedQty}, Tersedia = ${availableStock}`
    );
  }

  // 6. Hapus old master pants if they still exist
  console.log('\nMenghapus item master lama yang sudah tergantikan...');
  if (oldKingsman) {
    const { error: delKmErr } = await supabase.from('inventori').delete().eq('id', oldKingsman.id);
    if (!delKmErr) console.log(` -> Deleted old Celana Kingsman Master (${oldKingsman.kode_jas})`);
  }
  if (oldYgt) {
    const { error: delYgtErr } = await supabase.from('inventori').delete().eq('id', oldYgt.id);
    if (!delYgtErr) console.log(` -> Deleted old Celana YGT Master (${oldYgt.kode_jas})`);
  }

  console.log('\n====================================================');
  console.log('   MIGRASI DAN AUTO-RELINK BERHASIL 100%!           ');
  console.log('====================================================\n');
}

runMigration().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
