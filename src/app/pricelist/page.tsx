import { getPricelistConfig } from "@/actions/pricelist";
import { PricelistClient } from "./PricelistClient";

export const dynamic = "force-dynamic";

export default async function PricelistPage() {
  const config = await getPricelistConfig();

  return <PricelistClient initialConfig={config} />;
}
