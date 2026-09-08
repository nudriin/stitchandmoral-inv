import { createClient } from "@/lib/supabase/server";
import { TransaksiClient } from "./TransaksiClient";
import type { Transaksi, Inventori, Customer } from "@/types/database";
import { getReceiptConfig } from "@/actions/receiptSettings";

export const dynamic = "force-dynamic";

export default async function TransaksiPage() {
  const supabase = await createClient();

  const [
    { data: transaksi = [] },
    { data: inventori = [] },
    { data: customer = [] },
    receiptConfig,
  ] = await Promise.all([
    supabase
      .from("transaksi")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("inventori").select("*").order("nama_jas"),
    supabase.from("customer").select("*").order("nama"),
    getReceiptConfig(),
  ]);

  return (
    <TransaksiClient
      initialTransactions={(transaksi as Transaksi[]) || []}
      inventory={(inventori as Inventori[]) || []}
      customers={(customer as Customer[]) || []}
      initialReceiptConfig={receiptConfig}
    />
  );
}
