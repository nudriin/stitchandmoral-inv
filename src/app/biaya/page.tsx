import { createClient } from "@/lib/supabase/server";
import { BiayaClient } from "./BiayaClient";
import type { Pengeluaran, ModalItem } from "@/types/database";

export const revalidate = 0;

export default async function BiayaPage() {
  const supabase = await createClient();

  const [
    { data: pengeluaran = [] },
    { data: modal = [] },
  ] = await Promise.all([
    supabase.from("pengeluaran").select("*").order("tanggal", { ascending: false }),
    supabase.from("modal").select("*").order("created_at", { ascending: false }),
  ]);

  return (
    <BiayaClient
      initialExpenses={(pengeluaran as Pengeluaran[]) || []}
      initialModal={(modal as ModalItem[]) || []}
    />
  );
}
