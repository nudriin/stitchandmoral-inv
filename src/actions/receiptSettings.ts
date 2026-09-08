"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { ReceiptConfig, DEFAULT_RECEIPT_CONFIG } from "@/types/receipt";
import { revalidatePath } from "next/cache";

/**
 * Retrieves the dynamic receipt invoice configuration from the `pengaturan` table
 */
export async function getReceiptConfig(): Promise<ReceiptConfig> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("pengaturan")
      .select("value")
      .eq("key", "receipt_config")
      .single();

    if (error || !data?.value) {
      return DEFAULT_RECEIPT_CONFIG;
    }

    const parsed = JSON.parse(data.value);
    return {
      ...DEFAULT_RECEIPT_CONFIG,
      ...parsed,
      terms: parsed.terms || DEFAULT_RECEIPT_CONFIG.terms,
    };
  } catch (err) {
    console.error("Error loading receipt_config:", err);
    return DEFAULT_RECEIPT_CONFIG;
  }
}

/**
 * Saves or updates the dynamic receipt configuration in `pengaturan`
 */
export async function saveReceiptConfig(
  config: ReceiptConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    const payload = {
      ...config,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("pengaturan").upsert(
      {
        key: "receipt_config",
        value: JSON.stringify(payload),
        deskripsi: "Konfigurasi Desain & Template Struk Invoice Sewa",
      },
      { onConflict: "key" }
    );

    if (error) {
      console.error("Error saving receipt_config:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/transaksi");
    return { success: true };
  } catch (err: any) {
    console.error("Fatal error saving receipt_config:", err);
    return { success: false, error: err.message || "Gagal menyimpan konfigurasi struk." };
  }
}
