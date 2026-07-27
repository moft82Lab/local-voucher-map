import { getMerchantDataset } from "@/lib/merchant-data";
import MerchantMapShell from "./components/merchant-map-shell";

export default async function Home() {
  const merchantDataset = await getMerchantDataset();

  return (
    <main className="map-page">
      <h1 className="visually-hidden">지역상품권 지도</h1>
      <MerchantMapShell
        categories={merchantDataset.categories}
        merchants={merchantDataset.merchants}
        updatedAt={merchantDataset.updatedAt}
      />
    </main>
  );
}
