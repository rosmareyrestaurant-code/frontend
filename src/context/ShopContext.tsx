"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product, Order, CustomerInfo } from "@/types";

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

interface ShopContextType {
  cart: CartItem[];
  favorites: Product[];
  isCartOpen: boolean;
  isFavoritesOpen: boolean;
  isMenuImageOpen: boolean;
  selectedProduct: Product | null;
  currentOrder: Order | null;
  setSelectedProduct: (product: Product | null) => void;
  setIsCartOpen: (open: boolean) => void;
  setIsFavoritesOpen: (open: boolean) => void;
  setIsMenuImageOpen: (open: boolean) => void;
  setCurrentOrder: (order: Order | null) => void;
  addToCart: (product: Product, quantity?: number, notes?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  toggleFavorite: (product: Product) => void;
  isFavorite: (productId: string) => boolean;
  placeOrder: (customer: CustomerInfo) => Order;
  cartCount: number;
  favoritesCount: number;
  subtotal: number;
  total: number;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

function generateOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RZ-${ts}-${rand}`;
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isMenuImageOpen, setIsMenuImageOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("rosemary_cart");
      const savedFavs = localStorage.getItem("rosemary_favs");
      const savedOrder = localStorage.getItem("rosemary_current_order");
      if (savedCart) queueMicrotask(() => setCart(JSON.parse(savedCart)));
      if (savedFavs) queueMicrotask(() => setFavorites(JSON.parse(savedFavs)));
      if (savedOrder) queueMicrotask(() => setCurrentOrder(JSON.parse(savedOrder)));
    } catch { /* ignore */ }
    queueMicrotask(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try { localStorage.setItem("rosemary_cart", JSON.stringify(cart)); } catch { /* ignore */ }
  }, [cart, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try { localStorage.setItem("rosemary_favs", JSON.stringify(favorites)); } catch { /* ignore */ }
  }, [favorites, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      if (currentOrder) {
        localStorage.setItem("rosemary_current_order", JSON.stringify(currentOrder));
      } else {
        localStorage.removeItem("rosemary_current_order");
      }
    } catch { /* ignore */ }
  }, [currentOrder, isLoaded]);

  const addToCart = (product: Product, quantity: number = 1, notes?: string) => {
    const cleanNotes = notes?.trim() || undefined;
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.notes === cleanNotes
      );
      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity, notes: cleanNotes }];
    });
  };

  const removeFromCart = (productId: string) =>
    setCart((prev) => prev.filter((item) => item.product.id !== productId));

  const updateQuantity = (productId: string, delta: number) =>
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        })
        .filter((item): item is CartItem => item !== null)
    );

  const clearCart = () => setCart([]);

  const toggleFavorite = (product: Product) =>
    setFavorites((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      return exists ? prev.filter((p) => p.id !== product.id) : [...prev, product];
    });

  const isFavorite = (productId: string) => favorites.some((p) => p.id === productId);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const favoritesCount = favorites.length;
  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  // رسوم التوصيل تُحدد لاحقاً مع شركة الدليفري — لا تُحتسب هنا إطلاقاً.
  const total = subtotal;

  /** إنشاء الطلب وحفظه وإرساله للوحة التحكم ثم تفريغ السلة */
  const placeOrder = (customer: CustomerInfo): Order => {
    const order: Order = {
      id: generateOrderId(),
      items: [...cart],
      customer,
      subtotal,
      total,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setCurrentOrder(order);

    // قائمة الطلبات الواردة من الموقع، يقرأها الأدمن في لوحة التحكم.
    try {
      const raw = localStorage.getItem("rosemary_customer_orders");
      const saved: Order[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem(
        "rosemary_customer_orders",
        JSON.stringify([order, ...saved].slice(0, 50)),
      );
      window.dispatchEvent(new Event("rosemary_customer_orders"));
    } catch { /* ignore */ }

    clearCart();
    return order;
  };

  return (
    <ShopContext.Provider
      value={{
        cart,
        favorites,
        isCartOpen,
        isFavoritesOpen,
        isMenuImageOpen,
        selectedProduct,
        currentOrder,
        setSelectedProduct,
        setIsCartOpen,
        setIsFavoritesOpen,
        setIsMenuImageOpen,
        setCurrentOrder,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleFavorite,
        isFavorite,
        placeOrder,
        cartCount,
        favoritesCount,
        subtotal,
        total,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) throw new Error("useShop must be used within a ShopProvider");
  return context;
}
