"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type ThemeStyle = "default" | "glassmorphism" | "neomorphism";

export async function getThemeStyleAction(): Promise<ThemeStyle> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("pengaturan")
      .select("value")
      .eq("key", "app_theme")
      .maybeSingle();

    if (error || !data || !data.value) {
      return "default";
    }

    const val = data.value.toLowerCase().trim();
    if (val === "glassmorphism" || val === "neomorphism" || val === "default") {
      return val as ThemeStyle;
    }
    return "default";
  } catch (err) {
    console.error("Error fetching theme style from DB:", err);
    return "default";
  }
}

export async function saveThemeStyleAction(theme: ThemeStyle): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    // Upsert app_theme key in pengaturan
    const { error } = await supabase
      .from("pengaturan")
      .upsert(
        {
          key: "app_theme",
          value: theme,
        },
        { onConflict: "key" }
      );

    if (error) {
      console.error("Failed to save theme in DB:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan tema";
    return { success: false, error: errorMsg };
  }
}
