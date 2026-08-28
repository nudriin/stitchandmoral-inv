import { createClient } from "@/lib/supabase/server";
import { CustomerClient } from "./CustomerClient";
import type { Customer } from "@/types/database";

export const revalidate = 15;

export default async function CustomerPage() {
  const supabase = await createClient();
  const { data: customers = [] } = await supabase
    .from("customer")
    .select("*")
    .order("created_at", { ascending: false });

  return <CustomerClient initialCustomers={(customers as Customer[]) || []} />;
}
