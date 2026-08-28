import { createClient } from "@/lib/supabase/server";
import { InventoriClient } from "./InventoriClient";
import type { Inventori } from "@/types/database";

export const revalidate = 0;

export default async function InventoriPage() {
  const supabase = await createClient();
  const { data: items = [] } = await supabase
    .from("inventori")
    .select("*")
    .order("created_at", { ascending: false });

  return <InventoriClient initialItems={(items as Inventori[]) || []} />;
}
