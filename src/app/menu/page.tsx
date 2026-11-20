import MenuClient from "./MenuClient";
import { getMenuProducts } from "@/lib/storefront";

export default async function MenuPage() {
  const products = await getMenuProducts();
  return <MenuClient products={products} />;
}
