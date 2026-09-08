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

const TABLES = [
  'inventori',
  'customer',
  'transaksi',
  'pengeluaran',
  'modal',
  'pengaturan',
];

// Helper to escape SQL values
function toSqlLiteral(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

// Convert an array of objects to CSV string
function toCSV(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') val = JSON.stringify(val);
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvRows = [headers.join(',')];
  for (const row of rows) {
    csvRows.push(headers.map((h) => escapeCell(row[h])).join(','));
  }
  return csvRows.join('\r\n');
}

// Fetch all rows with pagination
async function fetchAllRows(tableName) {
  const PAGE_SIZE = 1000;
  let allRows = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(from, to);

    if (error) {
      throw new Error(`Gagal membaca tabel ${tableName}: ${error.message}`);
    }

    if (data && data.length > 0) {
      allRows = allRows.concat(data);
      if (data.length < PAGE_SIZE) {
        hasMore = false;
      } else {
        from += PAGE_SIZE;
      }
    } else {
      hasMore = false;
    }
  }

  return allRows;
}

async function runBackup() {
  console.log('========================================');
  console.log('   STITCH & MORAL - DATABASE BACKUP     ');
  console.log('========================================');
  console.log(`Supabase URL: ${supabaseUrl}`);

  const timestamp = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${timestamp.getFullYear()}${pad(timestamp.getMonth() + 1)}${pad(timestamp.getDate())}_${pad(timestamp.getHours())}${pad(timestamp.getMinutes())}${pad(timestamp.getSeconds())}`;

  const backupsDir = path.resolve(process.cwd(), 'backups');
  const tablesDir = path.join(backupsDir, 'tables');
  const snapshotsDir = path.join(backupsDir, 'snapshots');

  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
  if (!fs.existsSync(tablesDir)) fs.mkdirSync(tablesDir, { recursive: true });
  if (!fs.existsSync(snapshotsDir)) fs.mkdirSync(snapshotsDir, { recursive: true });

  const backupData = {
    exported_at: timestamp.toISOString(),
    source_url: supabaseUrl,
    tables: {},
    summary: {},
  };

  let sqlStatements = [
    `-- =====================================================================`,
    `-- STITCH & MORAL DATABASE BACKUP`,
    `-- Exported At: ${timestamp.toISOString()}`,
    `-- Source: ${supabaseUrl}`,
    `-- =====================================================================\n`,
    `BEGIN;\n`,
  ];

  for (const table of TABLES) {
    process.stdout.write(`Exporting tabel '${table}'... `);
    try {
      const rows = await fetchAllRows(table);
      backupData.tables[table] = rows;
      backupData.summary[table] = rows.length;

      // Write individual JSON
      fs.writeFileSync(
        path.join(tablesDir, `${table}.json`),
        JSON.stringify(rows, null, 2),
        'utf8'
      );

      // Write individual CSV
      fs.writeFileSync(
        path.join(tablesDir, `${table}.csv`),
        toCSV(rows),
        'utf8'
      );

      // Generate SQL INSERT statements
      if (rows.length > 0) {
        sqlStatements.push(`-- Table: public.${table} (${rows.length} rows)`);
        const columns = Object.keys(rows[0]);
        const colsFormatted = columns.map((c) => `"${c}"`).join(', ');

        for (const row of rows) {
          const values = columns.map((col) => toSqlLiteral(row[col])).join(', ');
          sqlStatements.push(
            `INSERT INTO public."${table}" (${colsFormatted}) VALUES (${values}) ON CONFLICT DO NOTHING;`
          );
        }
        sqlStatements.push('');
      }

      console.log(`OK (${rows.length} records)`);
    } catch (err) {
      console.log(`FAILED (${err.message})`);
    }
  }

  sqlStatements.push('COMMIT;\n');

  // Try to export auth users if service role allows
  try {
    const { data: usersData } = await supabase.auth.admin.listUsers();
    if (usersData?.users) {
      const sanitizedUsers = usersData.users.map((u) => ({
        id: u.id,
        email: u.email,
        phone: u.phone,
        role: u.role,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        app_metadata: u.app_metadata,
        user_metadata: u.user_metadata,
      }));
      fs.writeFileSync(
        path.join(backupsDir, 'auth_users.json'),
        JSON.stringify(sanitizedUsers, null, 2),
        'utf8'
      );
      backupData.auth_users = sanitizedUsers;
      console.log(`Auth users exported: ${sanitizedUsers.length} user(s)`);
    }
  } catch (err) {
    console.log(`Auth users export skipped: ${err.message}`);
  }

  // Write consolidated JSON
  const consolidatedFilename = `backup_stitchandmoral_${dateStr}.json`;
  fs.writeFileSync(
    path.join(snapshotsDir, consolidatedFilename),
    JSON.stringify(backupData, null, 2),
    'utf8'
  );
  fs.writeFileSync(
    path.join(backupsDir, 'backup_latest.json'),
    JSON.stringify(backupData, null, 2),
    'utf8'
  );

  // Write SQL dump
  const sqlFilename = `backup_stitchandmoral_${dateStr}.sql`;
  fs.writeFileSync(
    path.join(snapshotsDir, sqlFilename),
    sqlStatements.join('\n'),
    'utf8'
  );
  fs.writeFileSync(
    path.join(backupsDir, 'backup_latest.sql'),
    sqlStatements.join('\n'),
    'utf8'
  );

  // Write README inside backups
  const readmeContent = `# STITCH & MORAL - DATABASE BACKUPS

Folder ini berisi seluruh cadangan data (backup) dari database Supabase Stitch & Moral.
**PENTING:** Folder ini telah dimasukkan ke dalam \`.gitignore\` dan **TIDAK AKAN** dipublikasikan ke GitHub.

## Ringkasan Cadangan Terakhir
- **Waktu Export**: ${timestamp.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB (${timestamp.toISOString()})
- **Inventori**: ${backupData.summary.inventori ?? 0} item
- **Customer**: ${backupData.summary.customer ?? 0} data
- **Transaksi**: ${backupData.summary.transaksi ?? 0} transaksi
- **Pengeluaran**: ${backupData.summary.pengeluaran ?? 0} catatan
- **Modal**: ${backupData.summary.modal ?? 0} catatan
- **Pengaturan**: ${backupData.summary.pengaturan ?? 0} konfigurasi

## Struktur File
- \`backup_latest.json\`: Seluruh database lengkap dalam format JSON siap pakai.
- \`backup_latest.sql\`: Script SQL INSERT lengkap siap eksekusi di Supabase SQL Editor untuk restore.
- \`tables/\`: File data per tabel masing-masing dalam format \`.json\` dan \`.csv\`.
  - \`tables/inventori.json\` & \`.csv\`
  - \`tables/customer.json\` & \`.csv\`
  - \`tables/transaksi.json\` & \`.csv\`
  - \`tables/pengeluaran.json\` & \`.csv\`
  - \`tables/modal.json\` & \`.csv\`
  - \`tables/pengaturan.json\` & \`.csv\`
- \`snapshots/\`: Arsip cadangan berkala dengan penamaan tanggal & waktu.
- \`auth_users.json\`: Metadata akun admin/pengguna terdaftar.

## Cara Melakukan Backup Ulang
Jalankan perintah berikut di terminal:
\`\`\`bash
npm run backup
\`\`\`
`;

  fs.writeFileSync(path.join(backupsDir, 'README.md'), readmeContent, 'utf8');

  console.log('\n========================================');
  console.log('   BACKUP BERHASIL DISIMPAN!           ');
  console.log('========================================');
  console.log(`Lokasi folder: ${backupsDir}`);
  console.log(`- Consolidated JSON : backups/backup_latest.json & backups/snapshots/${consolidatedFilename}`);
  console.log(`- SQL INSERT Dump   : backups/backup_latest.sql & backups/snapshots/${sqlFilename}`);
  console.log(`- Format CSV & JSON : backups/tables/*.csv & *.json`);
  console.log('----------------------------------------');
  console.log('Summary Row Counts:');
  Object.entries(backupData.summary).forEach(([tbl, count]) => {
    console.log(`  - ${tbl.padEnd(15)}: ${count} baris`);
  });
  console.log('========================================\n');
}

runBackup().catch((err) => {
  console.error('Fatal backup error:', err);
  process.exit(1);
});
