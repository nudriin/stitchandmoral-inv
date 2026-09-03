import { test } from "node:test";
import assert from "node:assert/strict";

// Helper function that mirrors the Gantt chart column calculation logic
function calculateGanttColumns({ txStart, txEnd, currentYear, currentMonth, daysInMonth }) {
  const monthStartStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
  const monthEndStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  const s = txStart?.slice(0, 10) || monthStartStr;
  const rawE = txEnd?.slice(0, 10) || s;
  const e = rawE >= s ? rawE : s;

  // Check if transaction overlaps this month at all
  if (s > monthEndStr || e < monthStartStr) {
    return null;
  }

  // 1-indexed column numbers for CSS Grid (columnStart to columnEnd + 1)
  const startCol = s < monthStartStr ? 1 : Math.max(1, parseInt(s.slice(8, 10), 10));
  const endCol = e > monthEndStr ? daysInMonth : Math.min(daysInMonth, parseInt(e.slice(8, 10), 10));

  return {
    startCol,
    endCol,
    cssGridColumn: `${startCol} / ${endCol + 1}`,
  };
}

// Helper to filter events on a specific selected date (Mobile Agenda)
function getTransactionsOnDate(transactions, dateStr) {
  return transactions.filter((tx) => {
    const start = tx.tanggal_sewa?.slice(0, 10);
    const rawEnd = tx.tanggal_kembali?.slice(0, 10);
    if (!start) return false;
    const end = rawEnd && rawEnd >= start ? rawEnd : start;
    return dateStr >= start && dateStr <= end;
  });
}

test("Gantt columns: kalkulasi kolom dalam bulan yang sama (3-4 September 2026)", () => {
  const result = calculateGanttColumns({
    txStart: "2026-09-03",
    txEnd: "2026-09-04",
    currentYear: 2026,
    currentMonth: 8, // September (0-indexed)
    daysInMonth: 30,
  });

  assert.notEqual(result, null);
  assert.equal(result.startCol, 3);
  assert.equal(result.endCol, 4);
  assert.equal(result.cssGridColumn, "3 / 5");
});

test("Gantt columns: kalkulasi transaksi lintas bulan (30 Sep - 1 Okt 2026)", () => {
  // Dalam bulan September (startCol = 30, endCol = 30)
  const sepResult = calculateGanttColumns({
    txStart: "2026-09-30",
    txEnd: "2026-10-01",
    currentYear: 2026,
    currentMonth: 8, // September
    daysInMonth: 30,
  });
  assert.notEqual(sepResult, null);
  assert.equal(sepResult.startCol, 30);
  assert.equal(sepResult.endCol, 30);
  assert.equal(sepResult.cssGridColumn, "30 / 31");

  // Dalam bulan Oktober (startCol = 1, endCol = 1)
  const octResult = calculateGanttColumns({
    txStart: "2026-09-30",
    txEnd: "2026-10-01",
    currentYear: 2026,
    currentMonth: 9, // Oktober
    daysInMonth: 31,
  });
  assert.notEqual(octResult, null);
  assert.equal(octResult.startCol, 1);
  assert.equal(octResult.endCol, 1);
  assert.equal(octResult.cssGridColumn, "1 / 2");
});

test("Mobile Agenda: filter transaksi harian menangani tanggal terbalik secara defensif", () => {
  const dummyTransactions = [
    {
      id: "tx-1",
      nama_customer: "Wahyu",
      tanggal_sewa: "2026-09-30",
      tanggal_kembali: "2026-10-01",
      status: "Booking",
    },
    {
      id: "tx-2",
      nama_customer: "Nanda",
      tanggal_sewa: "2026-09-03",
      tanggal_kembali: "2026-09-04",
      status: "Sedang Disewa",
    },
  ];

  // Cek pada 3 September
  const onSep3 = getTransactionsOnDate(dummyTransactions, "2026-09-03");
  assert.equal(onSep3.length, 1);
  assert.equal(onSep3[0].nama_customer, "Nanda");

  // Cek pada 30 September
  const onSep30 = getTransactionsOnDate(dummyTransactions, "2026-09-30");
  assert.equal(onSep30.length, 1);
  assert.equal(onSep30[0].nama_customer, "Wahyu");

  // Cek pada 10 September (tidak ada transaksi)
  const onSep10 = getTransactionsOnDate(dummyTransactions, "2026-09-10");
  assert.equal(onSep10.length, 0);
});
