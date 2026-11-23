import MenuClient from "./MenuClient";
import { getActiveCategories, getMenuProducts } from "@/lib/storefront";

export default async function MenuPage() {
  const [products, categories] = await Promise.all([getMenuProducts(), getActiveCategories()]);
  return <MenuClient products={products} categories={categories} />;
}
