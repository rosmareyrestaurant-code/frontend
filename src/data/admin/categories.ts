import { AdminCategory } from "@/types/admin";

export const MOCK_ADMIN_CATEGORIES: AdminCategory[] = [
  { id: "cat-pizza",      nameAr: "بيتزا",       nameEn: "Pizza",      slug: "pizza",      image: "/images/categories/pizza.jpg",      sortOrder: 1, isActive: true,  showOnHomeCard: true, showOnHome: true, productCount: 6 },
  { id: "cat-chicken",    nameAr: "كريب ودجاج",  nameEn: "Crepe",      slug: "chicken",    image: "/images/categories/crepe.jpg",      sortOrder: 2, isActive: true,  showOnHomeCard: true, showOnHome: true, productCount: 6 },
  { id: "cat-burger",     nameAr: "سندوتشات",    nameEn: "Sandwiches", slug: "burger",     image: "/images/categories/sandwiches.jpg", sortOrder: 3, isActive: true,  showOnHomeCard: true, showOnHome: true, productCount: 6 },
  { id: "cat-pasta",      nameAr: "مكرونات",     nameEn: "Pasta",      slug: "pasta",      image: "/images/categories/pasta.jpg",      sortOrder: 4, isActive: true,  showOnHomeCard: true, showOnHome: true, productCount: 6 },
  { id: "cat-drinks",     nameAr: "مشروبات",     nameEn: "Drinks",     slug: "drinks",     image: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=400&q=80", sortOrder: 5, isActive: true,  showOnHomeCard: true, showOnHome: true, productCount: 6 },
  { id: "cat-desserts",   nameAr: "حلويات",      nameEn: "Desserts",   slug: "desserts",   image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80", sortOrder: 6, isActive: false,  showOnHomeCard: true, showOnHome: true, productCount: 0 },
];
