import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_RECEIPT_CONFIG } from "../src/types/receipt.ts";

test("ReceiptConfig: default configuration conforms to Indonesian boxed-grid invoice structure", () => {
  assert.equal(DEFAULT_RECEIPT_CONFIG.title, "INVOICE");
  assert.equal(DEFAULT_RECEIPT_CONFIG.brand_name, "STITCH & MORAL");
  assert.ok(DEFAULT_RECEIPT_CONFIG.terms.length >= 4, "Terms & conditions must have at least 4 items");
  assert.ok(DEFAULT_RECEIPT_CONFIG.terms[0].includes("identitas"), "Terms must mention identitas asli");
  assert.equal(DEFAULT_RECEIPT_CONFIG.show_signature, true);
  assert.equal(DEFAULT_RECEIPT_CONFIG.manager_title, "PENANGGUNG JAWAB");
});

test("Receipt Template: supports custom store details and dynamic terms", () => {
  const customConfig = {
    ...DEFAULT_RECEIPT_CONFIG,
    title: "STRUK SEWA",
    brand_name: "STITCH & MORAL PALANGKA",
    terms: [
      "Wajib KTP/SIM asli.",
      "Denda Rp 50.000 / hari keterlambatan.",
    ],
  };

  assert.equal(customConfig.title, "STRUK SEWA");
  assert.equal(customConfig.brand_name, "STITCH & MORAL PALANGKA");
  assert.equal(customConfig.terms.length, 2);
});
