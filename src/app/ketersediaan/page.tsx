import { createClient } from "@/lib/supabase/server";
import { KetersediaanClient } from "./KetersediaanClient";
import type { Transaksi, Inventori } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function KetersediaanPage() {
  const supabase = await createClient();

  const [{ data: transaksi = [] }, { data: inventori = [] }] = await Promise.all([
    supabase
      .from("transaksi")
      .select("*")
      .order("tanggal_sewa", { ascending: true }),
    supabase.from("inventori").select("*").order("nama_jas"),
  ]);

  return (
    <KetersediaanClient
      initialTransactions={(transaksi as Transaksi[]) || []}
      inventory={(inventori as Inventori[]) || []}
    />
  );
}
