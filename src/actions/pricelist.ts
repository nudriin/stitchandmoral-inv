"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { PricelistConfig, DEFAULT_PRICELIST_CONFIG } from "@/types/pricelist";
import { revalidatePath } from "next/cache";

/**
 * Retrieves the dynamic pricelist configuration from the `pengaturan` table
 */
export async function getPricelistConfig(): Promise<PricelistConfig> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("pengaturan")
      .select("value")
      .eq("key", "pricelist_config")
      .single();

    if (error || !data?.value) {
      return DEFAULT_PRICELIST_CONFIG;
    }

    const parsed = JSON.parse(data.value);
    return {
      ...DEFAULT_PRICELIST_CONFIG,
      ...parsed,
      packages: parsed.packages || DEFAULT_PRICELIST_CONFIG.packages,
      promos: parsed.promos || DEFAULT_PRICELIST_CONFIG.promos,
      ketentuan_sewa: parsed.ketentuan_sewa || DEFAULT_PRICELIST_CONFIG.ketentuan_sewa,
    };
  } catch (err) {
    console.error("Error loading pricelist_config:", err);
    return DEFAULT_PRICELIST_CONFIG;
  }
}

/**
 * Saves or updates the dynamic pricelist configuration in `pengaturan`
 */
export async function savePricelistConfig(
  config: PricelistConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    const payload = {
      ...config,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("pengaturan").upsert(
      {
        key: "pricelist_config",
        value: JSON.stringify(payload),
        deskripsi: "Konfigurasi Paket Harga & Promo Sewa Dinamis",
      },
      { onConflict: "key" }
    );

    if (error) {
      console.error("Error saving pricelist_config:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/pricelist");
    revalidatePath("/ketersediaan");
    return { success: true };
  } catch (err: any) {
    console.error("Fatal error saving pricelist_config:", err);
    return { success: false, error: err.message || "Gagal menyimpan konfigurasi pricelist." };
  }
}
