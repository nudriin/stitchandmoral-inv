import { createClient } from "@/lib/supabase/server";
import { KalenderClient } from "./KalenderClient";
import type { Transaksi, Inventori, Customer } from "@/types/database";

export const revalidate = 15;

export default async function KalenderPage() {
  const supabase = await createClient();

  const [
    { data: transaksi = [] },
    { data: inventori = [] },
    { data: customer = [] },
  ] = await Promise.all([
    supabase
      .from("transaksi")
      .select("*")
      .order("tanggal_sewa", { ascending: true }),
    supabase.from("inventori").select("*").order("nama_jas"),
    supabase.from("customer").select("*").order("nama"),
  ]);

  return (
    <KalenderClient
      initialTransactions={(transaksi as Transaksi[]) || []}
      inventory={(inventori as Inventori[]) || []}
      customers={(customer as Customer[]) || []}
    />
  );
}
