import { createClient } from "@/lib/supabase/server";
import { CustomerClient } from "./CustomerClient";
import type { Customer, Transaksi } from "@/types/database";

export const revalidate = 15;

export default async function CustomerPage() {
  const supabase = await createClient();
  const [
    { data: customers = [] },
    { data: transactions = [] },
  ] = await Promise.all([
    supabase.from("customer").select("*").order("created_at", { ascending: false }),
    supabase.from("transaksi").select("*").order("tanggal_sewa", { ascending: false }),
  ]);

  return (
    <CustomerClient
      initialCustomers={(customers as Customer[]) || []}
      transactions={(transactions as Transaksi[]) || []}
    />
  );
}
