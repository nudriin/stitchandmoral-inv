import { createClient } from "@/lib/supabase/server";
import { TransaksiClient } from "./TransaksiClient";
import type { Transaksi, Inventori, Customer } from "@/types/database";

export const revalidate = 0;

export default async function TransaksiPage() {
  const supabase = await createClient();

  const [
    { data: transaksi = [] },
    { data: inventori = [] },
    { data: customer = [] },
  ] = await Promise.all([
    supabase
      .from("transaksi")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("inventori").select("*").order("nama_jas"),
    supabase.from("customer").select("*").order("nama"),
  ]);

  return (
    <TransaksiClient
      initialTransactions={(transaksi as Transaksi[]) || []}
      inventory={(inventori as Inventori[]) || []}
      customers={(customer as Customer[]) || []}
    />
  );
}
