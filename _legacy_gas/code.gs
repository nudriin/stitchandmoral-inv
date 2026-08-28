const APP = {
  name: 'Manajemen Sewa & Inventori',
  storeName: 'Stitch and Moral - Sewa Jas PKY',
  folderName: 'Sewa Jas - Upload Foto',
  lateFeePerDay: 25000,
  sheets: {
    inventory: 'Inventori',
    customers: 'Customer',
    transactions: 'Transaksi',
    expenses: 'Pengeluaran',
    modal: 'Modal',
    settings: 'Pengaturan'
  }
};

const HEADERS = {
  Inventori: [
    'kodeJas', 'namaJas', 'jenisJas', 'warna', 'ukuran', 'hargaDefault',
    'jumlahStok', 'stokTersedia', 'stokDisewa', 'kondisi', 'statusLaundry',
    'lokasi', 'fotoUrl', 'catatan', 'createdAt', 'updatedAt'
  ],
  Customer: [
    'customerId', 'nama', 'whatsapp', 'alamat', 'instagram', 'fotoCustomerUrl',
    'fotoPakaiJasUrl', 'catatan', 'status', 'createdAt', 'updatedAt'
  ],
  Transaksi: [
    'kodeTransaksi', 'customerId', 'namaCustomer', 'whatsapp', 'itemsJson',
    'jumlahTotal', 'subtotal', 'deposit', 'totalBayar', 'tanggalSewa',
    'tanggalKembali', 'tanggalDikembalikan', 'status', 'denda', 'depositKembali',
    'fotoCustomerUrl', 'catatan', 'createdAt', 'updatedAt', 'potongan',
    'statusPembayaran', 'jumlahDibayar', 'sisaPembayaran'
  ],
  Pengeluaran: [
    'expenseId', 'tanggal', 'kategori', 'deskripsi', 'jumlah', 'catatan', 'createdAt'
  ],
  Modal: [
    'id', 'barang', 'satuan', 'merk', 'jumlah', 'hargaSatuan', 'totalHarga', 'catatan', 'createdAt'
  ],
  Pengaturan: ['key', 'value']
};

function doGet() {
  ensureSetup_();
  const template = HtmlService.createTemplateFromFile('Index');
  template.webAppUrl = ScriptApp.getService().getUrl();
  return template.evaluate()
    .setTitle(APP.name)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover')
    .addMetaTag('mobile-web-app-capable', 'yes')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function setupApp() {
  ensureSetup_();
  seedSampleData_();
  Logger.log('Setup selesai. Database URL: ' + getSpreadsheet_().getUrl());
  return getAppData();
}

function getDatabaseUrl() {
  return getSpreadsheet_().getUrl();
}

function diagnoseApp() {
  const ss = getSpreadsheet_();
  ensureSetup_();
  const result = {
    ok: true,
    databaseName: ss.getName(),
    databaseUrl: ss.getUrl(),
    sheets: ss.getSheets().map(sheet => sheet.getName()),
    inventoryRows: getRows_(APP.sheets.inventory).length,
    customerRows: getRows_(APP.sheets.customers).length,
    transactionRows: getRows_(APP.sheets.transactions).length
  };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function getAppData() {
  ensureSetup_();
  updateOverdueTransactions_();
  return {
    app: Object.assign({}, APP, { databaseUrl: getSpreadsheet_().getUrl() }),
    dashboard: getDashboardData_(),
    inventory: getRows_(APP.sheets.inventory),
    customers: getRows_(APP.sheets.customers),
    transactions: getRows_(APP.sheets.transactions).map(formatTransaction_),
    expenses: getRows_(APP.sheets.expenses),
    modal: getRows_(APP.sheets.modal),
    reports: getReportsData_()
  };
}

function saveInventory(item) {
  ensureSetup_();
  const sheet = getSheet_(APP.sheets.inventory);
  const rows = getRows_(APP.sheets.inventory);
  const now = isoNow_();
  const payload = {
    kodeJas: item.kodeJas || nextCode_('JAS', rows.length + 1),
    namaJas: clean_(item.namaJas),
    jenisJas: clean_(item.jenisJas),
    warna: clean_(item.warna),
    ukuran: clean_(item.ukuran),
    hargaDefault: number_(item.hargaDefault),
    jumlahStok: number_(item.jumlahStok),
    stokTersedia: item.kodeJas ? number_(item.stokTersedia) : number_(item.jumlahStok),
    stokDisewa: item.kodeJas ? number_(item.stokDisewa) : 0,
    kondisi: clean_(item.kondisi || 'Baik'),
    statusLaundry: clean_(item.statusLaundry || 'Ready'),
    lokasi: clean_(item.lokasi),
    fotoUrl: clean_(item.fotoUrl),
    catatan: clean_(item.catatan),
    createdAt: item.createdAt || now,
    updatedAt: now
  };

  const rowIndex = findRowIndex_(APP.sheets.inventory, 'kodeJas', payload.kodeJas);
  upsertRow_(sheet, HEADERS.Inventori, payload, rowIndex);
  return getAppData();
}

function deleteInventory(kodeJas) {
  ensureSetup_();
  const active = getRows_(APP.sheets.transactions)
    .map(formatTransaction_)
    .some(t => ['Sedang Disewa', 'Terlambat'].includes(t.status) && t.items.some(i => i.kodeJas === kodeJas));
  if (active) throw new Error('Jas masih dipakai transaksi aktif, tidak bisa dihapus.');
  deleteRowByKey_(APP.sheets.inventory, 'kodeJas', kodeJas);
  return getAppData();
}

function saveCustomer(customer) {
  ensureSetup_();
  const sheet = getSheet_(APP.sheets.customers);
  const rows = getRows_(APP.sheets.customers);
  const now = isoNow_();
  const payload = {
    customerId: customer.customerId || nextCode_('CUS', rows.length + 1),
    nama: clean_(customer.nama),
    whatsapp: clean_(customer.whatsapp),
    alamat: clean_(customer.alamat),
    instagram: clean_(customer.instagram),
    fotoCustomerUrl: clean_(customer.fotoCustomerUrl),
    fotoPakaiJasUrl: clean_(customer.fotoPakaiJasUrl),
    catatan: clean_(customer.catatan),
    status: clean_(customer.status || 'Aktif'),
    createdAt: customer.createdAt || now,
    updatedAt: now
  };
  const rowIndex = findRowIndex_(APP.sheets.customers, 'customerId', payload.customerId);
  upsertRow_(sheet, HEADERS.Customer, payload, rowIndex);
  return getAppData();
}

function createTransaction(payload) {
  ensureSetup_();
  const rows = getRows_(APP.sheets.transactions);
  const inventory = getRows_(APP.sheets.inventory);
  const now = isoNow_();
  const items = (payload.items || []).map(item => ({
    kodeJas: item.kodeJas,
    namaJas: item.namaJas,
    jenisJas: item.jenisJas,
    warna: item.warna,
    ukuran: item.ukuran,
    jumlah: number_(item.jumlah || 1),
    harga: number_(item.harga)
  })).filter(item => item.kodeJas && item.jumlah > 0);

  if (!payload.namaCustomer && !payload.customerId) throw new Error('Customer wajib diisi.');
  if (!items.length) throw new Error('Minimal pilih satu item jas.');

  const tanggalSewa = payload.tanggalSewa;
  const tanggalKembali = payload.tanggalKembali;
  validateDateAvailability_(rows, items, tanggalSewa, tanggalKembali, null);

  let customer = null;
  if (payload.customerId) {
    customer = getRows_(APP.sheets.customers).find(c => c.customerId === payload.customerId);
  }
  if (!customer) {
    const before = getRows_(APP.sheets.customers);
    saveCustomer({
      nama: payload.namaCustomer,
      whatsapp: payload.whatsapp,
      alamat: payload.alamat,
      instagram: payload.instagram,
      fotoCustomerUrl: payload.fotoCustomerUrl,
      fotoPakaiJasUrl: payload.fotoPakaiJasUrl,
      catatan: payload.catatanCustomer
    });
    customer = getRows_(APP.sheets.customers).find(c => !before.some(b => b.customerId === c.customerId));
  }

  const subtotal = items.reduce((sum, item) => sum + item.harga * item.jumlah, 0);
  const deposit = number_(payload.deposit);
  const potongan = number_(payload.potongan);
  const jumlahDibayar = number_(payload.jumlahDibayar || deposit);
  const totalBayar = subtotal - potongan;
  const sisaPembayaran = Math.max(0, totalBayar - jumlahDibayar);
  const statusPembayaran = payload.statusPembayaran || derivePaymentStatus_(jumlahDibayar, totalBayar);

  // Tentukan status transaksi: Booking jika tanggal sewa di masa depan, Sedang Disewa jika hari ini atau lewat
  const today = formatDate_(new Date());
  const isBookingFuture = tanggalSewa > today;
  const status = isBookingFuture ? 'Booking' : 'Sedang Disewa';

  const transaction = {
    kodeTransaksi: nextCode_('TRX', rows.length + 1),
    customerId: customer.customerId,
    namaCustomer: customer.nama,
    whatsapp: customer.whatsapp,
    itemsJson: JSON.stringify(items),
    jumlahTotal: items.reduce((sum, item) => sum + item.jumlah, 0),
    subtotal,
    potongan,
    deposit,
    totalBayar,
    tanggalSewa,
    tanggalKembali,
    tanggalDikembalikan: '',
    status,
    denda: 0,
    depositKembali: '',
    fotoCustomerUrl: clean_(payload.fotoCustomerUrl || customer.fotoCustomerUrl),
    catatan: clean_(payload.catatan),
    createdAt: now,
    updatedAt: now,
    statusPembayaran,
    jumlahDibayar,
    sisaPembayaran
  };

  appendObject_(getSheet_(APP.sheets.transactions), HEADERS.Transaksi, transaction);
  // Stok hanya berkurang jika langsung Sedang Disewa (bukan Booking)
  if (status === 'Sedang Disewa') adjustStock_(items, -1);
  return getAppData();
}

function updateTransaction(payload) {
  ensureSetup_();
  const kodeTransaksi = payload.kodeTransaksi;
  const rowIndex = findRowIndex_(APP.sheets.transactions, 'kodeTransaksi', kodeTransaksi);
  if (rowIndex < 2) throw new Error('Transaksi tidak ditemukan.');

  const allTx = getRows_(APP.sheets.transactions);
  const oldTx = formatTransaction_(allTx.find(t => t.kodeTransaksi === kodeTransaksi));
  const oldStatus = oldTx.status;
  const wasActive = ['Sedang Disewa', 'Terlambat'].includes(oldStatus);

  const items = (payload.items || []).map(item => ({
    kodeJas: item.kodeJas,
    namaJas: item.namaJas,
    jenisJas: item.jenisJas,
    warna: item.warna,
    ukuran: item.ukuran,
    jumlah: number_(item.jumlah || 1),
    harga: number_(item.harga)
  })).filter(item => item.kodeJas && item.jumlah > 0);

  if (!items.length) throw new Error('Minimal pilih satu item jas.');

  const tanggalSewa = payload.tanggalSewa;
  const tanggalKembali = payload.tanggalKembali;
  validateDateAvailability_(allTx, items, tanggalSewa, tanggalKembali, kodeTransaksi);

  const subtotal = items.reduce((sum, item) => sum + item.harga * item.jumlah, 0);
  const deposit = number_(payload.deposit);
  const potongan = number_(payload.potongan);
  const jumlahDibayar = number_(payload.jumlahDibayar);
  const totalBayar = subtotal - potongan;
  const sisaPembayaran = Math.max(0, totalBayar - jumlahDibayar);
  const statusPembayaran = payload.statusPembayaran || derivePaymentStatus_(jumlahDibayar, totalBayar);

  const today = formatDate_(new Date());
  const isBookingFuture = tanggalSewa > today;
  const newStatus = isBookingFuture ? 'Booking' : (wasActive ? oldStatus : oldStatus);

  const changes = {
    itemsJson: JSON.stringify(items),
    jumlahTotal: items.reduce((sum, item) => sum + item.jumlah, 0),
    subtotal,
    potongan,
    deposit,
    totalBayar,
    tanggalSewa,
    tanggalKembali,
    status: newStatus,
    fotoCustomerUrl: clean_(payload.fotoCustomerUrl || oldTx.fotoCustomerUrl),
    catatan: clean_(payload.catatan),
    updatedAt: isoNow_(),
    statusPembayaran,
    jumlahDibayar,
    sisaPembayaran
  };

  // Sesuaikan stok jika status aktif berubah item
  if (wasActive) {
    adjustStock_(oldTx.items, 1); // kembalikan stok lama
    adjustStock_(items, -1);      // kurangi stok baru
  }

  patchRow_(APP.sheets.transactions, rowIndex, changes);
  return getAppData();
}

function updatePaymentStatus(kodeTransaksi, jumlahDibayar, statusPembayaran) {
  ensureSetup_();
  const rowIndex = findRowIndex_(APP.sheets.transactions, 'kodeTransaksi', kodeTransaksi);
  if (rowIndex < 2) throw new Error('Transaksi tidak ditemukan.');
  const tx = formatTransaction_(getRows_(APP.sheets.transactions).find(t => t.kodeTransaksi === kodeTransaksi));
  const totalBayar = number_(tx.totalBayar);
  const dibayar = number_(jumlahDibayar);
  const sisa = Math.max(0, totalBayar - dibayar);
  const spStatus = statusPembayaran || derivePaymentStatus_(dibayar, totalBayar);
  patchRow_(APP.sheets.transactions, rowIndex, {
    jumlahDibayar: dibayar,
    sisaPembayaran: sisa,
    statusPembayaran: spStatus,
    updatedAt: isoNow_()
  });
  return getAppData();
}

// Ubah status Booking → Sedang Disewa (saat jas diambil)
function confirmPickup(kodeTransaksi) {
  ensureSetup_();
  const rowIndex = findRowIndex_(APP.sheets.transactions, 'kodeTransaksi', kodeTransaksi);
  if (rowIndex < 2) throw new Error('Transaksi tidak ditemukan.');
  const tx = formatTransaction_(getRows_(APP.sheets.transactions).find(t => t.kodeTransaksi === kodeTransaksi));
  if (tx.status !== 'Booking') throw new Error('Hanya transaksi Booking yang bisa dikonfirmasi pengambilan.');
  adjustStock_(tx.items, -1);
  patchRow_(APP.sheets.transactions, rowIndex, { status: 'Sedang Disewa', updatedAt: isoNow_() });
  return getAppData();
}

function derivePaymentStatus_(jumlahDibayar, totalBayar) {
  if (totalBayar <= 0) return 'Lunas';
  if (jumlahDibayar <= 0) return 'Belum Bayar';
  if (jumlahDibayar >= totalBayar) return 'Lunas';
  return 'DP';
}

// Validasi ketersediaan berdasarkan overlap tanggal (bukan stok fisik saat ini)
function validateDateAvailability_(allTransactions, items, tanggalSewa, tanggalKembali, excludeKode) {
  const activeStatuses = ['Booking', 'Sedang Disewa', 'Terlambat'];
  const conflicting = allTransactions
    .filter(t => activeStatuses.includes(t.status) && t.kodeTransaksi !== excludeKode)
    .map(formatTransaction_);

  items.forEach(item => {
    let totalBooked = 0;
    conflicting.forEach(tx => {
      // Cek overlap tanggal: sewa baru overlap dengan transaksi existing
      const overlapStart = tx.tanggalSewa <= tanggalKembali;
      const overlapEnd = tx.tanggalKembali >= tanggalSewa;
      if (overlapStart && overlapEnd) {
        const bookedQty = tx.items.filter(i => i.kodeJas === item.kodeJas).reduce((s, i) => s + number_(i.jumlah), 0);
        totalBooked += bookedQty;
      }
    });
    const inv = getRows_(APP.sheets.inventory).find(i => i.kodeJas === item.kodeJas);
    if (!inv) throw new Error('Barang tidak ditemukan: ' + item.kodeJas);
    const available = number_(inv.jumlahStok) - totalBooked;
    if (available < number_(item.jumlah)) {
      throw new Error(`Stok ${inv.namaJas} tidak tersedia untuk tanggal ${tanggalSewa} - ${tanggalKembali}. Tersedia: ${Math.max(0, available)}, diminta: ${item.jumlah}`);
    }
  });
}

function updateTransactionStatus(kodeTransaksi, nextStatus) {
  ensureSetup_();
  const rowIndex = findRowIndex_(APP.sheets.transactions, 'kodeTransaksi', kodeTransaksi);
  if (rowIndex < 2) throw new Error('Transaksi tidak ditemukan.');
  const tx = formatTransaction_(getRows_(APP.sheets.transactions).find(t => t.kodeTransaksi === kodeTransaksi));
  const oldStatus = tx.status;
  const now = isoNow_();
  const denda = nextStatus === 'Selesai' ? calculateLateFee_(tx.tanggalKembali, new Date()) : tx.denda;
  const changes = {
    status: nextStatus,
    tanggalDikembalikan: nextStatus === 'Selesai' ? formatDate_(new Date()) : tx.tanggalDikembalikan,
    denda,
    totalBayar: number_(tx.subtotal) - number_(tx.potongan) + number_(denda),
    updatedAt: now
  };
  patchRow_(APP.sheets.transactions, rowIndex, changes);

  // Stok hanya berubah jika status aktif (Sedang Disewa/Terlambat), bukan Booking
  const wasPhysicallyOut = ['Sedang Disewa', 'Terlambat'].includes(oldStatus);
  const isPhysicallyOut = ['Sedang Disewa', 'Terlambat'].includes(nextStatus);
  if (wasPhysicallyOut && !isPhysicallyOut) adjustStock_(tx.items, 1);
  if (!wasPhysicallyOut && isPhysicallyOut) adjustStock_(tx.items, -1);
  return getAppData();
}

function cancelTransaction(kodeTransaksi) {
  return updateTransactionStatus(kodeTransaksi, 'Dibatalkan');
}

function saveExpense(expense) {
  ensureSetup_();
  const rows = getRows_(APP.sheets.expenses);
  appendObject_(getSheet_(APP.sheets.expenses), HEADERS.Pengeluaran, {
    expenseId: expense.expenseId || nextCode_('EXP', rows.length + 1),
    tanggal: expense.tanggal || formatDate_(new Date()),
    kategori: clean_(expense.kategori),
    deskripsi: clean_(expense.deskripsi),
    jumlah: number_(expense.jumlah),
    catatan: clean_(expense.catatan),
    createdAt: isoNow_()
  });
  return getAppData();
}

function saveModal(item) {
  ensureSetup_();
  const sheet = getSheet_(APP.sheets.modal);
  const payload = {
    id: item.id || 'MOD-' + Date.now(),
    barang: clean_(item.barang),
    satuan: clean_(item.satuan),
    merk: clean_(item.merk),
    jumlah: number_(item.jumlah),
    hargaSatuan: number_(item.hargaSatuan),
    totalHarga: number_(item.jumlah) * number_(item.hargaSatuan),
    catatan: clean_(item.catatan),
    createdAt: item.createdAt || isoNow_()
  };
  const rowIndex = item.id ? findRowIndex_(APP.sheets.modal, 'id', item.id) : -1;
  upsertRow_(sheet, HEADERS.Modal, payload, rowIndex);
  return getAppData();
}

function deleteModal(id) {
  ensureSetup_();
  deleteRowByKey_(APP.sheets.modal, 'id', id);
  return getAppData();
}

function uploadImage(file) {
  ensureSetup_();
  if (!file || !file.data || !file.name) throw new Error('File tidak valid.');
  const folder = getUploadFolder_();
  const contentType = file.mimeType || 'image/png';
  const bytes = Utilities.base64Decode(file.data.split(',').pop());
  const blob = Utilities.newBlob(bytes, contentType, file.name);
  const saved = folder.createFile(blob);
  saved.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return {
    id: saved.getId(),
    name: saved.getName(),
    url: saved.getUrl(),
    thumbnail: 'https://drive.google.com/thumbnail?id=' + saved.getId()
  };
}

function getReceiptPdfUrl(kodeTransaksi) {
  ensureSetup_();
  const tx = formatTransaction_(
    getRows_(APP.sheets.transactions).find(t => t.kodeTransaksi === kodeTransaksi)
  );
  if (!tx) throw new Error('Transaksi tidak ditemukan.');

  // Buat Google Doc sebagai struk
  const docTitle = 'Struk-' + tx.kodeTransaksi;
  const doc = DocumentApp.create(docTitle);
  const body = doc.getBody();
  body.clear();

  // --- Header ---
  const titlePara = body.appendParagraph(APP.storeName);
  titlePara.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  titlePara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  const subPara = body.appendParagraph('Struk Sewa Jas');
  subPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  subPara.setItalic(true);

  body.appendParagraph('\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015');

  // --- Info Transaksi ---
  body.appendParagraph('No Transaksi  : ' + tx.kodeTransaksi);
  body.appendParagraph('Customer      : ' + tx.namaCustomer);
  body.appendParagraph('WhatsApp      : ' + (tx.whatsapp || '-'));
  body.appendParagraph('Tgl Sewa      : ' + tx.tanggalSewa);
  body.appendParagraph('Tgl Kembali   : ' + tx.tanggalKembali);

  body.appendParagraph('\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015');

  // --- Item ---
  const itemsHeader = body.appendParagraph('Item yang Disewa:');
  itemsHeader.setBold(true);
  tx.items.forEach(item => {
    body.appendParagraph(
      '  \u2022 ' + item.namaJas +
      ' (' + item.warna + '/' + item.ukuran + ')' +
      ' x' + item.jumlah +
      '   =   ' + rupiah_(item.harga * item.jumlah)
    );
  });

  body.appendParagraph('\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015');

  // --- Ringkasan ---
  body.appendParagraph('Subtotal      : ' + rupiah_(tx.subtotal));
  body.appendParagraph('Deposit       : ' + rupiah_(tx.deposit));
  if (number_(tx.potongan) > 0) {
    body.appendParagraph('Potongan      : -' + rupiah_(tx.potongan));
  }
  if (number_(tx.denda) > 0) {
    body.appendParagraph('Denda         : ' + rupiah_(tx.denda));
  }
  const totalPara = body.appendParagraph('Total Bayar   : ' + rupiah_(tx.totalBayar));
  totalPara.setBold(true);

  body.appendParagraph('\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015');
  body.appendParagraph('Status   : ' + tx.status);
  if (tx.catatan) body.appendParagraph('Catatan  : ' + tx.catatan);

  body.appendParagraph('');
  const footerPara = body.appendParagraph('Terima kasih sudah menyewa! Simpan struk ini sebagai bukti transaksi.');
  footerPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  footerPara.setItalic(true);

  doc.saveAndClose();

  // Pindahkan ke folder upload agar terorganisir
  const file = DriveApp.getFileById(doc.getId());
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  try {
    const folder = getUploadFolder_();
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
  } catch (e) { /* abaikan jika gagal pindah folder */ }

  return {
    pdfUrl: 'https://docs.google.com/document/d/' + doc.getId() + '/export?format=pdf',
    docUrl: 'https://docs.google.com/document/d/' + doc.getId() + '/preview'
  };
}

function getReceiptHtml(kodeTransaksi) {
  ensureSetup_();

  const tx = formatTransaction_(
    getRows_(APP.sheets.transactions).find(
      (t) => t.kodeTransaksi === kodeTransaksi
    )
  );

  if (!tx) throw new Error('Transaksi tidak ditemukan.');

  const rows = tx.items.map(item => `
    <tr>
      <td>
        ${escapeHtml_(item.namaJas)}
        <br>
        <small>
          ${escapeHtml_(item.warna)} / ${escapeHtml_(item.ukuran)}
        </small>
      </td>
      <td>${item.jumlah}</td>
      <td>${rupiah_(item.harga)}</td>
      <td>${rupiah_(item.harga * item.jumlah)}</td>
    </tr>
  `).join('');

  return `
  <html>
    <head>
      <style>
        body{
          font-family:Arial,sans-serif;
          margin:0;
          padding:18px;
          color:#111;
        }

        .receipt{
          max-width:360px;
          margin:auto;
        }

        h1{
          font-size:20px;
          margin:0 0 4px;
          text-align:center;
        }

        .muted{
          color:#555;
          font-size:12px;
          text-align:center;
        }

        table{
          width:100%;
          border-collapse:collapse;
          margin:14px 0;
        }

        td,th{
          border-bottom:1px solid #ddd;
          padding:7px 2px;
          font-size:12px;
          text-align:left;
        }

        th:nth-child(n+2),
        td:nth-child(n+2){
          text-align:right;
        }

        .total{
          font-weight:700;
          font-size:15px;
        }

        .meta{
          font-size:12px;
          line-height:1.5;
          margin-top:12px;
        }

        @media print{
          button{display:none}
          body{padding:0}
          .receipt{max-width:none}
        }
      </style>
    </head>

    <body>
      <div class="receipt">

        <h1>${escapeHtml_(APP.storeName)}</h1>
        <div class="muted">Struk Sewa Jas</div>

        <div class="meta">
          No: <b>${escapeHtml_(tx.kodeTransaksi)}</b><br>
          Customer: <b>${escapeHtml_(tx.namaCustomer)}</b><br>
          WhatsApp: ${escapeHtml_(tx.whatsapp || "-")}<br>
          Sewa: ${escapeHtml_(tx.tanggalSewa)} - ${escapeHtml_(tx.tanggalKembali)}
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Harga</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="meta">
          Subtotal: ${rupiah_(tx.subtotal)}<br>
          Deposit: ${rupiah_(tx.deposit)}<br>
          Potongan: -${rupiah_(tx.potongan)}<br>
          Denda: ${rupiah_(tx.denda)}<br>

          <span class="total">
            Total Bayar: ${rupiah_(tx.totalBayar)}
          </span>

          <br><br>

          Status Sewa: ${escapeHtml_(tx.status)}<br>
          Status Pembayaran: <b>${escapeHtml_(tx.statusPembayaran || 'Belum Bayar')}</b><br>
          Sudah Dibayar: ${rupiah_(tx.jumlahDibayar || 0)}<br>
          Sisa Pembayaran: ${rupiah_(tx.sisaPembayaran || 0)}<br>
          Catatan: ${escapeHtml_(tx.catatan || "-")}

          <center>Terima kasih. Simpan struk ini sebagai bukti transaksi.</center>
        </div>
      </div>
    </body>
  </html>
  `;
}

function ensureSetup_() {
  const ss = getSpreadsheet_();
  Object.keys(HEADERS).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      const headers = HEADERS[name];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#111827').setFontColor('#ffffff');
      return;
    }

    const headers = HEADERS[name];
    const lastCol = Math.max(sheet.getLastColumn(), 1);
    const existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

    // Tambah kolom baru yang belum ada di ujung kanan (TIDAK menghapus data)
    const newCols = headers.filter(h => !existing.includes(h));
    if (newCols.length > 0) {
      const startCol = lastCol + 1;
      sheet.getRange(1, startCol, 1, newCols.length).setValues([newCols]);
      sheet.getRange(1, startCol, 1, newCols.length).setFontWeight('bold').setBackground('#111827').setFontColor('#ffffff');
    }

    // Pastikan baris 1 ter-freeze
    if (sheet.getFrozenRows() < 1) sheet.setFrozenRows(1);
  });
}

function getSpreadsheet_() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;

  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty('DATABASE_SPREADSHEET_ID');
  if (spreadsheetId) {
    try {
      return SpreadsheetApp.openById(spreadsheetId);
    } catch (error) {
      properties.deleteProperty('DATABASE_SPREADSHEET_ID');
    }
  }

  const created = SpreadsheetApp.create('Database - ' + APP.name);
  properties.setProperty('DATABASE_SPREADSHEET_ID', created.getId());
  return created;
}

function seedSampleData_() {
  if (getRows_(APP.sheets.inventory).length) return;
  const sheet = getSheet_(APP.sheets.inventory);
  const now = isoNow_();
  const samples = [
    ['Jas Formal Hitam Slim Fit', 'Formal', 'Hitam', 'M', 150000, 4, 'Rak A1'],
    ['Jas Wedding Ivory Premium', 'Wedding', 'Ivory', 'L', 350000, 2, 'Rak W1'],
    ['Jas Wisuda Navy', 'Wisuda', 'Navy', 'XL', 175000, 3, 'Rak B2']
  ].map((row, index) => ({
    kodeJas: nextCode_('JAS', index + 1),
    namaJas: row[0],
    jenisJas: row[1],
    warna: row[2],
    ukuran: row[3],
    hargaDefault: row[4],
    jumlahStok: row[5],
    stokTersedia: row[5],
    stokDisewa: 0,
    kondisi: 'Baik',
    statusLaundry: 'Ready',
    lokasi: row[6],
    fotoUrl: '',
    catatan: '',
    createdAt: now,
    updatedAt: now
  }));
  sheet.getRange(sheet.getLastRow() + 1, 1, samples.length, HEADERS.Inventori.length)
    .setValues(samples.map(item => HEADERS.Inventori.map(header => item[header])));
}

function getDashboardData_() {
  const inventory = getRows_(APP.sheets.inventory);
  const transactions = getRows_(APP.sheets.transactions).map(formatTransaction_);
  const month = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');
  const active = transactions.filter(t => ['Booking', 'Sedang Disewa', 'Terlambat'].includes(t.status));
  const monthTx = transactions.filter(t => String(t.tanggalSewa || '').indexOf(month) === 0 && t.status !== 'Dibatalkan');
  const today = formatDate_(new Date());
  const overdue = active.filter(t => t.tanggalKembali < today);
  const dueToday = active.filter(t => t.tanggalKembali === today);
  const itemStats = countItems_(transactions, 'namaJas');
  const colorStats = countItems_(transactions, 'warna');
  const sizeStats = countItems_(transactions, 'ukuran');
  return {
    totalTersedia: sum_(inventory, 'stokTersedia'),
    totalDisewa: sum_(inventory, 'stokDisewa'),
    transaksiBulanIni: monthTx.length,
    pendapatanBulanIni: monthTx.reduce((sum, t) => sum + (number_(t.subtotal) - number_(t.potongan)) + number_(t.denda), 0),
    customerAktif: new Set(active.map(t => t.customerId)).size,
    dueToday,
    overdue,
    topJas: top_(itemStats),
    topWarna: top_(colorStats),
    topUkuran: top_(sizeStats),
    repeatCustomers: getRepeatCustomers_(transactions),
    revenueChart: getRevenueByMonth_(transactions)
  };
}

function getReportsData_() {
  const tx = getRows_(APP.sheets.transactions).map(formatTransaction_).filter(t => t.status !== 'Dibatalkan');
  const inventory = getRows_(APP.sheets.inventory);
  const modal = getRows_(APP.sheets.modal);
  
  const totalModal = modal.reduce((s, m) => s + number_(m.totalHarga), 0);
  const totalPendapatan = tx.reduce((s, t) => s + (number_(t.subtotal) - number_(t.potongan)) + number_(t.denda), 0);
  
  return {
    dailyRevenue: groupRevenue_(tx, 10),
    bestItems: toPairs_(countItems_(tx, 'namaJas')).slice(0, 10),
    bestColors: toPairs_(countItems_(tx, 'warna')).slice(0, 10),
    bestSizes: toPairs_(countItems_(tx, 'ukuran')).slice(0, 10),
    lowStock: inventory.filter(i => number_(i.stokTersedia) <= 0),
    damaged: inventory.filter(i => ['Rusak Ringan', 'Perlu Laundry', 'Tidak Layak'].includes(i.kondisi)),
    bep: {
      totalModal,
      totalPendapatan,
      sisaBep: totalModal - totalPendapatan
    }
  };
}

function updateOverdueTransactions_() {
  const today = formatDate_(new Date());
  getRows_(APP.sheets.transactions).forEach((row, index) => {
    // Booking yang tanggal sewanya sudah tiba → otomatis jadi Sedang Disewa dan kurangi stok
    if (row.status === 'Booking' && row.tanggalSewa <= today) {
      const tx = formatTransaction_(row);
      adjustStock_(tx.items, -1);
      patchRow_(APP.sheets.transactions, index + 2, {
        status: 'Sedang Disewa',
        updatedAt: isoNow_()
      });
    }
    // Sedang Disewa yang melewati tanggal kembali → Terlambat
    if (row.status === 'Sedang Disewa' && row.tanggalKembali < today) {
      const denda = calculateLateFee_(row.tanggalKembali, new Date());
      patchRow_(APP.sheets.transactions, index + 2, {
        status: 'Terlambat',
        denda,
        totalBayar: (number_(row.subtotal) - number_(row.potongan)) + number_(denda),
        updatedAt: isoNow_()
      });
    }
  });
}

function adjustStock_(items, direction) {
  items.forEach(item => {
    const rowIndex = findRowIndex_(APP.sheets.inventory, 'kodeJas', item.kodeJas);
    if (rowIndex < 2) throw new Error('Inventori tidak ditemukan: ' + item.kodeJas);
    const inv = getRows_(APP.sheets.inventory).find(i => i.kodeJas === item.kodeJas);
    const qty = number_(item.jumlah) * direction;
    const available = number_(inv.stokTersedia) + qty;
    const rented = number_(inv.stokDisewa) - qty;
    if (available < 0) throw new Error('Stok fisik tidak cukup untuk ' + inv.namaJas);
    patchRow_(APP.sheets.inventory, rowIndex, {
      stokTersedia: available,
      stokDisewa: Math.max(0, rented),
      updatedAt: isoNow_()
    });
  });
}

function validateStock_(inventory, items) {
  items.forEach(item => {
    const inv = inventory.find(i => i.kodeJas === item.kodeJas);
    if (!inv) throw new Error('Barang tidak ditemukan: ' + item.kodeJas);
    if (number_(inv.stokTersedia) < number_(item.jumlah)) {
      throw new Error('Stok tersedia tidak cukup untuk ' + inv.namaJas);
    }
  });
}

function getRows_(sheetName) {
  const sheet = getSheet_(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).filter(row => row.some(cell => cell !== '')).map(row => {
    const obj = {};
    headers.forEach((header, i) => obj[header] = normalizeCell_(header, row[i]));
    return obj;
  });
}

function getSheet_(name) {
  return getSpreadsheet_().getSheetByName(name);
}

function appendObject_(sheet, headers, obj) {
  sheet.appendRow(headers.map(h => obj[h] === undefined ? '' : obj[h]));
}

function upsertRow_(sheet, headers, obj, rowIndex) {
  const values = headers.map(h => obj[h] === undefined ? '' : obj[h]);
  if (rowIndex >= 2) sheet.getRange(rowIndex, 1, 1, headers.length).setValues([values]);
  else sheet.appendRow(values);
}

function patchRow_(sheetName, rowIndex, changes) {
  const sheet = getSheet_(sheetName);
  const headers = HEADERS[sheetName];
  Object.keys(changes).forEach(key => {
    const col = headers.indexOf(key) + 1;
    if (col > 0) sheet.getRange(rowIndex, col).setValue(changes[key]);
  });
}

function findRowIndex_(sheetName, key, value) {
  const rows = getRows_(sheetName);
  const index = rows.findIndex(row => String(row[key]) === String(value));
  return index >= 0 ? index + 2 : -1;
}

function deleteRowByKey_(sheetName, key, value) {
  const rowIndex = findRowIndex_(sheetName, key, value);
  if (rowIndex >= 2) getSheet_(sheetName).deleteRow(rowIndex);
}

function formatTransaction_(tx) {
  if (!tx) return null;
  const items = typeof tx.itemsJson === 'string' && tx.itemsJson ? JSON.parse(tx.itemsJson) : [];
  return Object.assign({}, tx, { items });
}

function nextCode_(prefix, number) {
  return prefix + '-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd') + '-' + String(number).padStart(4, '0');
}

function isoNow_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

function formatDate_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function clean_(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function number_(value) {
  const parsed = Number(value || 0);
  return isNaN(parsed) ? 0 : parsed;
}

function normalizeCell_(header, value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    if (String(header).toLowerCase().indexOf('tanggal') >= 0) return formatDate_(value);
    return isoNow_();
  }
  return value;
}

function sum_(rows, key) {
  return rows.reduce((sum, row) => sum + number_(row[key]), 0);
}

function countItems_(transactions, key) {
  return transactions.reduce((acc, tx) => {
    (tx.items || []).forEach(item => {
      const label = item[key] || '-';
      acc[label] = (acc[label] || 0) + number_(item.jumlah || 1);
    });
    return acc;
  }, {});
}

function top_(map) {
  return toPairs_(map)[0] || { label: '-', value: 0 };
}

function toPairs_(map) {
  return Object.keys(map).map(label => ({ label, value: map[label] })).sort((a, b) => b.value - a.value);
}

function getRepeatCustomers_(transactions) {
  const map = transactions.reduce((acc, tx) => {
    if (tx.status !== 'Dibatalkan') acc[tx.namaCustomer] = (acc[tx.namaCustomer] || 0) + 1;
    return acc;
  }, {});
  return toPairs_(map).filter(item => item.value > 1).slice(0, 10);
}

function getRevenueByMonth_(transactions) {
  return transactions.filter(t => t.status !== 'Dibatalkan').reduce((acc, tx) => {
    const month = String(tx.tanggalSewa || '').slice(0, 7) || 'Tanpa Tanggal';
    acc[month] = (acc[month] || 0) + (number_(tx.subtotal) - number_(tx.potongan)) + number_(tx.denda);
    return acc;
  }, {});
}

function groupRevenue_(transactions, limit) {
  const map = transactions.reduce((acc, tx) => {
    const day = tx.tanggalSewa || 'Tanpa Tanggal';
    acc[day] = (acc[day] || 0) + (number_(tx.subtotal) - number_(tx.potongan)) + number_(tx.denda);
    return acc;
  }, {});
  return Object.keys(map).sort().slice(-limit).map(label => ({ label, value: map[label] }));
}

function calculateLateFee_(dueDate, returnedDate) {
  if (!dueDate) return 0;
  const due = new Date(dueDate + 'T00:00:00');
  const returned = new Date(formatDate_(returnedDate) + 'T00:00:00');
  const days = Math.max(0, Math.ceil((returned - due) / 86400000));
  return days * APP.lateFeePerDay;
}

function getUploadFolder_() {
  const folders = DriveApp.getFoldersByName(APP.folderName);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(APP.folderName);
}

function escapeHtml_(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function rupiah_(value) {
  return 'Rp ' + number_(value).toLocaleString('id-ID');
}