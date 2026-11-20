"use client";

/**
 * ShopContext — واجهة العملاء للسلة والمفضلة وتدفق الطلب.
 *
 * التغييرات من النسخة القديمة:
 * - التخزين: localStorage → sessionStorage (عبر clientStorage.ts) مع versioning
 * - placeOrder: يُرسل للـ API /api/orders ويحفظ accessToken في sessionStorage
 * - placeOrderAsync: نسخة async للاستخدام في OrderReviewStep
 * - الواجهة الخارجية محفوظة 100% للمكوّنات الموجودة
 * - إضافة deliveryFee للـ subtotal/total
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import type { Product, Order, CustomerInfo, CartItem, CartItemInput, PaymentMethod } from "@/types";
import {
  readCart,
  writeCart,
  clearCartStorage,
  readFavoriteIds,
  writeFavoriteIds,
  writeLastOrder,
  readCurrentOrder,
  writeCurrentOrder,
  clearCurrentOrder,
} from "@/lib/clientStorage";

/* ─── Re-export CartItem so existing imports still work ─────────────── */
export type { CartItem };

/* ─── Context interface (backward-compatible) ───────────────────────── */
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
  addToCart: (product: Product, quantity?: number, notes?: string, sizeId?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  toggleFavorite: (product: Product) => void;
  isFavorite: (productId: string) => boolean;
  /** Legacy sync wrapper — dispatches async underneath; kept for compatibility */
  placeOrder: (customer: CustomerInfo) => Order;
  /** Async version — use this in new code */
  placeOrderAsync: (
    customer: CustomerInfo,
    payment?: { method: PaymentMethod; proofUrl?: string; proofPublicId?: string },
  ) => Promise<{ order: Order; accessToken: string; orderNumber: string }>;
  cartCount: number;
  favoritesCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

/* ─── Helpers ────────────────────────────────────────────────────────── */
function generateLocalId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RZ-${ts}-${rand}`;
}

/** جلب بيانات منتج من الـ API بـ id */
async function fetchProducts(ids: string[]): Promise<Map<string, Product>> {
  if (!ids.length) return new Map();
  try {
    const res = await fetch(`/api/products?ids=${ids.join(",")}`);
    if (!res.ok) return new Map();
    const data = await res.json();
    const products: Product[] = data?.data?.products ?? data?.data ?? [];
    return new Map(products.map((p) => [p.id, p]));
  } catch {
    return new Map();
  }
}

/* ─── Provider ───────────────────────────────────────────────────────── */
export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isMenuImageOpen, setIsMenuImageOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  /** حفظ الطلب الحالي في localStorage عشان صفحة التأكيد تفتح حتى بعد تحديث الصفحة */
  const setCurrentOrderPersisted = useCallback((order: Order | null) => {
    setCurrentOrder(order);
    if (order) writeCurrentOrder(order);
    else clearCurrentOrder();
  }, []);
  /* guard: نمنع كتابة sessionStorage قبل اكتمال القراءة الأولى */
  const writeGuard = useRef(false);

  /* ── Hydration: قراءة sessionStorage ثم جلب بيانات المنتجات من الـ API ── */
  useEffect(() => {
    async function hydrate() {
      try {
        // ── السلة
        const cartRefs: CartItemInput[] = readCart();
        if (cartRefs.length) {
          const ids = [...new Set(cartRefs.map((r) => r.productId))];
          const productsMap = await fetchProducts(ids);

          const hydrated: CartItem[] = cartRefs
            .map((ref) => {
              const product = productsMap.get(ref.productId);
              if (!product) return undefined;
              // سلة محفوظة من قبل الإصلاح ممكن تكون بدون sizeId — نستخدم الحجم الافتراضي
              const sizes = product.sizes ?? [];
              const size = sizes.length
                ? sizes.find((s) => s.id === ref.sizeId) ??
                  sizes.find((s) => s.isDefault) ??
                  sizes[0]
                : undefined;
              const effectiveProduct: Product = size
                ? { ...product, price: size.price, name: `${product.name} (${size.name})` }
                : product;
              const item: CartItem = {
                product: effectiveProduct,
                quantity: ref.quantity,
                sizeId: size?.id,
                addonIds: ref.addonIds,
                notes: ref.notes,
              };
              return item;
            })
            .filter((x): x is CartItem => x !== undefined);

          setCart(hydrated);
        }

        // ── المفضلة
        const favIds: string[] = readFavoriteIds();
        if (favIds.length) {
          const productsMap = await fetchProducts(favIds);
          const hydrated = favIds.map((id) => productsMap.get(id)).filter((p): p is Product => !!p);
          setFavorites(hydrated);
        }

        // ── آخر طلب (لصفحة التأكيد حتى لو مفيش accessToken من السيرفر)
        const savedOrder = readCurrentOrder();
        if (savedOrder) setCurrentOrder(savedOrder);
      } catch {
        /* استمر بدون بيانات محفوظة */
      } finally {
        writeGuard.current = true;
        setIsLoaded(true);
      }
    }
    hydrate();
  }, []);

  /* ── استمرار السلة في sessionStorage ── */
  useEffect(() => {
    if (!writeGuard.current) return;
    const refs: CartItemInput[] = cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      sizeId: item.sizeId,
      addonIds: item.addonIds,
      notes: item.notes,
    }));
    writeCart(refs);
  }, [cart]);

  /* ── استمرار المفضلة في sessionStorage ── */
  useEffect(() => {
    if (!writeGuard.current) return;
    writeFavoriteIds(favorites.map((p) => p.id));
  }, [favorites]);

  /* ─── Cart ops ───────────────────────────────────────────────────── */
  const addToCart = useCallback(
    (product: Product, quantity: number = 1, notes?: string, sizeId?: string) => {
      const cleanNotes = notes?.trim() || undefined;
      // المنتجات اللي لها أحجام لازم يكون معاها حجم صحيح — وإلا السيرفر بيرفض الطلب.
      // لو مفيش حجم متبعت (زي الإضافة من المفضلة) بنستخدم الحجم الافتراضي.
      const sizes = product.sizes ?? [];
      const size = sizes.length
        ? sizes.find((s) => s.id === sizeId) ?? sizes.find((s) => s.isDefault) ?? sizes[0]
        : undefined;
      const pricedProduct =
        size && size.price !== product.price
          ? { ...product, price: size.price, originalPrice: size.originalPrice }
          : product;

      setCart((prev) => {
        const idx = prev.findIndex(
          (item) =>
            item.product.id === product.id &&
            item.sizeId === size?.id &&
            item.notes === cleanNotes,
        );
        if (idx > -1) {
          return prev.map((item, i) =>
            i === idx ? { ...item, quantity: item.quantity + quantity } : item,
          );
        }
        return [...prev, { product: pricedProduct, quantity, notes: cleanNotes, sizeId: size?.id }];
      });
    },
    [],
  );

  const removeFromCart = useCallback(
    (productId: string) =>
      setCart((prev) => prev.filter((item) => item.product.id !== productId)),
    [],
  );

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        })
        .filter((item): item is CartItem => item !== null),
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    clearCartStorage();
  }, []);

  /* ─── Favorites ops ──────────────────────────────────────────────── */
  const toggleFavorite = useCallback((product: Product) => {
    setFavorites((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      return exists ? prev.filter((p) => p.id !== product.id) : [...prev, product];
    });
  }, []);

  const isFavorite = useCallback(
    (productId: string) => favorites.some((p) => p.id === productId),
    [favorites],
  );

  /* ─── Derived values ─────────────────────────────────────────────── */
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const favoritesCount = favorites.length;
  const subtotal = cart.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0,
  );
  const total = subtotal + deliveryFee;

  /* ─── placeOrderAsync: يُرسل للـ API ─────────────────────────────── */
  const placeOrderAsync = useCallback(
    async (
      customer: CustomerInfo,
      payment?: { method: PaymentMethod; proofUrl?: string; proofPublicId?: string },
    ): Promise<{ order: Order; accessToken: string; orderNumber: string }> => {
      // بناء cartItems للإرسال (refs فقط)
      const items: CartItemInput[] = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        sizeId: item.sizeId,
        addonIds: item.addonIds,
        notes: item.notes,
      }));

      let orderNumber = generateLocalId();
      let accessToken = "";
      let serverTotal = total;
      let serverDeliveryFee = deliveryFee;
      let serverSubtotal = subtotal;

      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items,
            customer,
            paymentMethod: payment?.method ?? "cash",
            paymentProofUrl: payment?.proofUrl,
            paymentProofPublicId: payment?.proofPublicId,
          }),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          // رسالة خطأ من السيرفر
          throw new Error(data.error?.message ?? "فشل إرسال الطلب");
        }

        orderNumber = data.data.orderNumber ?? orderNumber;
        accessToken = data.data.accessToken ?? "";
        serverTotal = data.data.total ?? serverTotal;
        serverDeliveryFee = data.data.deliveryFee ?? 0;
        serverSubtotal = data.data.subtotal ?? serverSubtotal;
        setDeliveryFee(serverDeliveryFee);
      } catch (e) {
        /* إذا السيرفر غير متاح، نستمر بقيم محلية */
        if (process.env.NODE_ENV !== "development") throw e;
        console.warn("[placeOrderAsync] API unavailable, using local fallback:", e);
      }

      // بناء كائن Order المتوافق مع الواجهة القديمة
      const order: Order = {
        id: orderNumber,
        items: [...cart],
        customer,
        subtotal: serverSubtotal,
        total: serverTotal,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      setCurrentOrderPersisted(order);
      writeLastOrder({ orderNumber, accessToken });
      clearCart();
      return { order, accessToken, orderNumber };
    },
    [cart, total, deliveryFee, subtotal, clearCart, setCurrentOrderPersisted],
  );

  /* ─── placeOrder: نسخة sync للتوافق مع الكود القديم ─────────────── */
  const placeOrder = useCallback(
    (customer: CustomerInfo): Order => {
      // يُطلق placeOrderAsync بدون await — الواجهة القديمة لا تنتظر
      placeOrderAsync(customer).catch((e) =>
        console.error("[placeOrder]", e),
      );

      // يرجع كائن مؤقت فوراً (يُستبدل بعد resolve الـ promise في currentOrder)
      const tempOrder: Order = {
        id: generateLocalId(),
        items: [...cart],
        customer,
        subtotal,
        total,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      return tempOrder;
    },
    [cart, subtotal, total, placeOrderAsync],
  );

  /* ─── Context value ──────────────────────────────────────────────── */
  const value: ShopContextType = {
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
    setCurrentOrder: setCurrentOrderPersisted,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleFavorite,
    isFavorite,
    placeOrder,
    placeOrderAsync,
    cartCount,
    favoritesCount,
    subtotal,
    deliveryFee,
    total,
  };

  /* إخفاء اختلاف الـ hydration: نُظهر حالة فارغة قبل اكتمال القراءة */
  if (!isLoaded) {
    return (
      <ShopContext.Provider value={{ ...value, cart: [], favorites: [], cartCount: 0, favoritesCount: 0, subtotal: 0, total: 0, deliveryFee: 0 }}>
        {children}
      </ShopContext.Provider>
    );
  }

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) throw new Error("useShop must be used within a ShopProvider");
  return context;
}
