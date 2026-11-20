import { getOffersPageData } from "@/lib/storefront";
import OffersClient from "./OffersClient";

export default async function OffersPage() {
  const { offers, discounted } = await getOffersPageData();
  return <OffersClient deals={offers} discountedProducts={discounted} />;
}
