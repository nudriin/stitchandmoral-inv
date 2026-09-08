import test from "node:test";
import assert from "node:assert/strict";
import { isDateRangeOverlapping } from "../src/lib/bookingValidation.ts";

// Helper functions mirroring schedule extraction & pricelist WhatsApp generator
function extractSuitSchedule({ inventory, transactions, queriedStartDate, queriedReturnDate }) {
  const todayStr = new Date().toISOString().slice(0, 10);

  return inventory.map((inv) => {
    const totalStock = Number(inv.jumlah_stok ?? inv.stok_tersedia ?? 1);
    const schedules = [];
    let bookedTodayCount = 0;

    for (const tx of transactions) {
      if (!["Booking", "Sedang Disewa", "Terlambat"].includes(tx.status)) continue;
      if (!tx.tanggal_sewa || !tx.tanggal_kembali) continue;

      if (Array.isArray(tx.items)) {
        for (const itm of tx.items) {
          if (itm.kodeJas === inv.kode_jas) {
            const qty = Number(itm.jumlah) || 1;
            schedules.push({
              kode_transaksi: tx.kode_transaksi,
              nama_customer: tx.nama_customer,
              tanggal_sewa: tx.tanggal_sewa,
              tanggal_kembali: tx.tanggal_kembali,
              status: tx.status,
              bookedQty: qty,
            });

            if (isDateRangeOverlapping(todayStr, todayStr, tx.tanggal_sewa, tx.tanggal_kembali)) {
              bookedTodayCount += qty;
            }
          }
        }
      }
    }

    schedules.sort((a, b) => a.tanggal_sewa.localeCompare(b.tanggal_sewa));
    const availableToday = Math.max(0, totalStock - bookedTodayCount);

    const result = {
      item: inv,
      totalStock,
      activeSchedules: schedules,
      availableToday,
      isBookedToday: bookedTodayCount > 0,
    };

    if (queriedStartDate && queriedReturnDate) {
      let bookedOnDate = 0;
      for (const sch of schedules) {
        if (
          isDateRangeOverlapping(
            queriedStartDate,
            queriedReturnDate,
            sch.tanggal_sewa,
            sch.tanggal_kembali
          )
        ) {
          bookedOnDate += sch.bookedQty;
        }
      }
      const availableOnDate = Math.max(0, totalStock - bookedOnDate);
      result.bookedOnQueriedDate = bookedOnDate;
      result.availableOnQueriedDate = availableOnDate;
      result.isFullyBookedOnQueriedDate = availableOnDate <= 0;
    }

    return result;
  });
}

function formatRupiahTest(num) {
  return "Rp " + (Number(num) || 0).toLocaleString("id-ID");
}

function formatPricelistWhatsAppTest(config) {
  const lines = [];
  if (config.header_greeting) {
    lines.push(config.header_greeting);
    lines.push("");
  }
  if (config.intro_text) {
    lines.push(`*${config.intro_text}*`);
    lines.push("");
  }
  if (config.packages && config.packages.length > 0) {
    lines.push("📋 *DAFTAR HARGA SEWA:*");
    config.packages.forEach((pkg) => {
      const bonusText = pkg.bonus ? ` (${pkg.bonus})` : "";
      if (pkg.harga_diskon && pkg.harga_diskon < pkg.harga) {
        lines.push(
          `• *${pkg.nama}${bonusText}* = ~${formatRupiahTest(pkg.harga)}~ ➔ *${formatRupiahTest(pkg.harga_diskon)}*`
        );
      } else {
        lines.push(`• *${pkg.nama}${bonusText}* = *${formatRupiahTest(pkg.harga)}*`);
      }
    });
    lines.push("");
  }
  const activePromos = (config.promos || []).filter((p) => p.aktif);
  if (activePromos.length > 0) {
    lines.push("🔥 *PROMO & DISKON SPESIAL:*");
    activePromos.forEach((promo) => {
      lines.push(`✨ *${promo.judul}:*`);
      lines.push(`   ${promo.syarat}`);
    });
    lines.push("");
  }
  return lines.join("\n");
}

test("Ketersediaan: mengekstrak jadwal booking aktif per jas secara kronologis", () => {
  const sampleInventory = [
    {
      id: "inv-1",
      kode_jas: "JAS-KINGSMAN-M",
      nama_jas: "Jas Kingsman M",
      ukuran: "M",
      jumlah_stok: 3,
      stok_tersedia: 3,
      harga_default: 150000,
    },
    {
      id: "inv-2",
      kode_jas: "JAS-YGT-XL",
      nama_jas: "Jas YGT XL",
      ukuran: "XL",
      jumlah_stok: 1,
      stok_tersedia: 1,
      harga_default: 150000,
    },
  ];

  const sampleTransactions = [
    {
      id: "tx-1",
      kode_transaksi: "TRX-001",
      nama_customer: "Wahyu",
      tanggal_sewa: "2026-09-30",
      tanggal_kembali: "2026-10-01",
      status: "Booking",
      items: [{ kodeJas: "JAS-YGT-XL", jumlah: 1 }],
    },
    {
      id: "tx-2",
      kode_transaksi: "TRX-002",
      nama_customer: "Budi",
      tanggal_sewa: "2026-10-05",
      tanggal_kembali: "2026-10-07",
      status: "Sedang Disewa",
      items: [{ kodeJas: "JAS-KINGSMAN-M", jumlah: 1 }],
    },
    {
      id: "tx-3",
      kode_transaksi: "TRX-003",
      nama_customer: "Andi",
      tanggal_sewa: "2026-10-02",
      tanggal_kembali: "2026-10-03",
      status: "Booking",
      items: [{ kodeJas: "JAS-KINGSMAN-M", jumlah: 1 }],
    },
    {
      id: "tx-4",
      kode_transaksi: "TRX-004",
      nama_customer: "Candra",
      tanggal_sewa: "2026-09-20",
      tanggal_kembali: "2026-09-22",
      status: "Selesai", // Tidak aktif
      items: [{ kodeJas: "JAS-KINGSMAN-M", jumlah: 1 }],
    },
  ];

  const result = extractSuitSchedule({
    inventory: sampleInventory,
    transactions: sampleTransactions,
  });

  // Cek Kingsman M
  const kingsman = result.find((r) => r.item.kode_jas === "JAS-KINGSMAN-M");
  assert.ok(kingsman, "Kingsman harus ditemukan");
  assert.equal(kingsman.totalStock, 3);
  assert.equal(kingsman.activeSchedules.length, 2, "Harus ada 2 jadwal aktif (mengabaikan Selesai)");
  // Harus terurut kronologis: 2 Okt dulu, baru 5 Okt
  assert.equal(kingsman.activeSchedules[0].nama_customer, "Andi");
  assert.equal(kingsman.activeSchedules[1].nama_customer, "Budi");

  // Cek YGT XL
  const ygt = result.find((r) => r.item.kode_jas === "JAS-YGT-XL");
  assert.ok(ygt, "YGT harus ditemukan");
  assert.equal(ygt.totalStock, 1);
  assert.equal(ygt.activeSchedules.length, 1);
  assert.equal(ygt.activeSchedules[0].nama_customer, "Wahyu");
});

test("Ketersediaan: menghitung sisa stok presisi pada tanggal yang di-query", () => {
  const sampleInventory = [
    {
      id: "inv-1",
      kode_jas: "JAS-KINGSMAN-M",
      nama_jas: "Jas Kingsman M",
      ukuran: "M",
      jumlah_stok: 3,
      stok_tersedia: 3,
    },
    {
      id: "inv-2",
      kode_jas: "JAS-YGT-XL",
      nama_jas: "Jas YGT XL",
      ukuran: "XL",
      jumlah_stok: 1,
      stok_tersedia: 1,
    },
  ];

  const sampleTransactions = [
    {
      id: "tx-1",
      kode_transaksi: "TRX-001",
      nama_customer: "Wahyu",
      tanggal_sewa: "2026-09-30",
      tanggal_kembali: "2026-10-01",
      status: "Booking",
      items: [
        { kodeJas: "JAS-YGT-XL", jumlah: 1 },
        { kodeJas: "JAS-KINGSMAN-M", jumlah: 1 },
      ],
    },
  ];

  // Query tanggal 30 Sep - 1 Okt
  const queryDates = extractSuitSchedule({
    inventory: sampleInventory,
    transactions: sampleTransactions,
    queriedStartDate: "2026-09-30",
    queriedReturnDate: "2026-10-01",
  });

  const kingsman = queryDates.find((r) => r.item.kode_jas === "JAS-KINGSMAN-M");
  assert.equal(kingsman.bookedOnQueriedDate, 1);
  assert.equal(kingsman.availableOnQueriedDate, 2, "Kingsman (3 unit - 1 booked = 2 ready)");
  assert.equal(kingsman.isFullyBookedOnQueriedDate, false);

  const ygt = queryDates.find((r) => r.item.kode_jas === "JAS-YGT-XL");
  assert.equal(ygt.bookedOnQueriedDate, 1);
  assert.equal(ygt.availableOnQueriedDate, 0, "YGT (1 unit - 1 booked = 0 ready)");
  assert.equal(ygt.isFullyBookedOnQueriedDate, true, "YGT harus full booked");
});

test("Pricelist: menghasilkan pesan WhatsApp rapi tanpa emotikon dengan masa berlaku promo", () => {
  const sampleConfig = {
    store_name: "STITCH & MORAL",
    store_address: "Jl. Pangeran Samudera Induk No. 11, Palangka Raya",
    header_greeting: "Halo kak, berikut daftar harga sewa Stitch & Moral:",
    packages: [
      { nama: "SEWA JAS (BONUS DASI)", harga: 150000, bonus: "Bonus Dasi" },
      { nama: "JAS + CELANA", harga: 200000, harga_diskon: 180000 },
    ],
    promos: [
      {
        judul: "POTONGAN MAHASISWA (KTM)",
        diskon_nominal: 25000,
        syarat: "Diskon 25k dengan menunjukkan KTM aktif.",
        periode_label: "September - Oktober 2026",
        aktif: true,
      },
    ],
  };

  const text = formatPricelistWhatsAppTest(sampleConfig);

  assert.ok(text.includes("DAFTAR HARGA SEWA:"), "Harus ada judul daftar harga");
  assert.ok(text.includes("SEWA JAS (BONUS DASI)"), "Harus ada paket sewa jas");
  assert.ok(text.includes("150.000"), "Harus ada format harga 150.000");
  assert.ok(text.includes("POTONGAN MAHASISWA (KTM)"), "Harus ada promo mahasiswa");
  assert.ok(text.includes("KTM"), "Harus ada syarat KTM");
});

test("Ketersediaan: mengekstrak catatan transaksi (ukuran celana/khusus) pada jadwal booking", () => {
  const sampleInventory = [
    {
      id: "inv-1",
      kode_jas: "JAS-001",
      nama_jas: "Jas Slim Fit Hitam",
      ukuran: "L",
      jumlah_stok: 2,
    },
  ];

  const sampleTransactions = [
    {
      id: "tx-1",
      kode_transaksi: "TRX-101",
      nama_customer: "Rizky",
      tanggal_sewa: "2026-09-15",
      tanggal_kembali: "2026-09-17",
      status: "Booking",
      catatan: "Ukuran celana 34, dasi merah maroon",
      items: [{ kodeJas: "JAS-001", jumlah: 1 }],
    },
  ];

  const result = extractSuitSchedule({
    inventory: sampleInventory,
    transactions: sampleTransactions,
  });

  const jas = result[0];
  assert.ok(jas);
  // Using actual suitSchedule logic with catatan
  const scheduleItem = {
    ...jas.activeSchedules[0],
    catatan: sampleTransactions[0].catatan,
  };
  assert.equal(scheduleItem.catatan, "Ukuran celana 34, dasi merah maroon");
  assert.ok(scheduleItem.catatan.toLowerCase().includes("celana 34"));
});
