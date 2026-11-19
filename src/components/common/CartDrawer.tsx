"use client";

import Image from "next/image";
import Link from "next/link";
import {
  X, Plus, Minus, Trash2, ShoppingBag, ArrowLeft, ChevronLeft, CheckCircle2, Truck,
} from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { useEffect, useRef, useState } from "react";
import { CustomerInfo } from "@/types";
import CheckoutForm from "./CheckoutForm";
import OrderReviewStep from "./OrderReviewStep";

/* ─── أنواع الخطوات ─── */
type Step = "cart" | "checkout" | "review" | "success";
type Dir  = "forward" | "back";

/* ─── بيانات شريط التقدم ─── */
const STEPS_META: { key: Step; label: string }[] = [
  { key: "cart",     label: "السلة"  },
  { key: "checkout", label: "بياناتك" },
  { key: "review",   label: "تأكيد"  },
];
const STEP_INDEX: Record<Step, number> = { cart: 0, checkout: 1, review: 2, success: 3 };

export default function CartDrawer() {
  const {
    cart, isCartOpen, setIsCartOpen,
    updateQuantity, removeFromCart, clearCart,
    subtotal, total, cartCount,
  } = useShop();

  /* ── حالة الخطوة والأنيميشن ── */
  const [step, setStep]           = useState<Step>("cart");
  const [dir, setDir]             = useState<Dir>("forward");
  const [animKey, setAnimKey]     = useState(0);   // يتغير عند كل انتقال لإعادة الأنيميشن
  const [customer, setCustomer]   = useState<CustomerInfo | null>(null);
  const [dragY, setDragY]         = useState(0);
  const touchStartY               = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.matchMedia("(min-width: 640px)").matches) return;
    touchStartY.current = e.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const distance = (e.touches[0]?.clientY ?? touchStartY.current) - touchStartY.current;
    if (distance > 0) setDragY(Math.min(distance, 180));
  };

  const handleTouchEnd = () => {
    if (dragY > 90) setIsCartOpen(false);
    setDragY(0);
    touchStartY.current = null;
  };

  /* ── حالة ظهور/إخفاء الـ Drawer ── */
  const [isVisible, setIsVisible] = useState(isCartOpen);
  const [wasOpen, setWasOpen]     = useState(isCartOpen);

  if (isCartOpen !== wasOpen) {
    setWasOpen(isCartOpen);
    if (isCartOpen) { setIsVisible(true); setStep("cart"); setAnimKey((k) => k + 1); }
  }

  const isClosing = !isCartOpen && isVisible;

  useEffect(() => {
    if (!isClosing) return;
    const t = setTimeout(() => { setIsVisible(false); setStep("cart"); setCustomer(null); }, 320);
    return () => clearTimeout(t);
  }, [isClosing]);

  if (!isVisible) return null;

  /* ── التنقل بين الخطوات ── */
  const goTo = (next: Step, direction: Dir = "forward") => {
    setDir(direction);
    setAnimKey((k) => k + 1);
    setStep(next);
  };

  /* ── الكلاس المتحرك حسب الاتجاه ── */
  const stepAnimClass = step === "success"
    ? "anim-step-success"
    : dir === "forward" ? "anim-step-forward" : "anim-step-back";

  /* ── هل نعرض شريط التقدم؟ ── */
  const showProgress = step !== "success";
  const currentStepIdx = STEP_INDEX[step] ?? 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* خلفية معتمة */}
      <div
        onClick={() => setIsCartOpen(false)}
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm ${
          isClosing ? "anim-backdrop-fade-out" : "anim-backdrop-fade"
        }`}
        aria-hidden="true"
      />

      {/* لوحة الـ Drawer */}
      <aside className="fixed max-sm:inset-x-0 max-sm:bottom-0 sm:inset-y-0 sm:left-0 z-50 flex pointer-events-none">
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ transform: dragY > 0 ? `translateY(${dragY}px)` : undefined, transition: dragY > 0 ? "none" : undefined }}
          className={`w-full sm:w-[440px] max-w-full bg-[#120f0d] shadow-2xl flex flex-col text-white max-sm:h-[91vh] max-sm:max-h-[94vh] max-sm:rounded-t-[28px] max-sm:border-t max-sm:border-[#2b241e] sm:h-full sm:border-r sm:border-[#26201a] overflow-hidden ${
            isClosing
              ? "anim-sheet-or-drawer-out pointer-events-none"
              : "anim-sheet-or-drawer pointer-events-auto"
          }`}>

          {/* مقبض سحب — موبايل فقط */}
          <div className="w-12 h-1.5 rounded-full bg-[#3a3129] mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

          {/* ─── شريط رأس ثابت ─── */}
          {step !== "success" && (
            <div className="flex items-center justify-between px-4 sm:px-5 pt-1 pb-3 shrink-0">
              {/* عنوان */}
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff7a00]/15 text-[#ff7a00] border border-[#ff7a00]/30">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    {step === "cart"     ? "سلة الطلبات" :
                     step === "checkout" ? "بيانات التوصيل" :
                                          "مراجعة الطلب"}
                  </h2>
                  <span className="text-[11px] text-[#a89f94]">
                    {step === "cart" ? `${cartCount} ${cartCount === 1 ? "وجبة" : "وجبات"}` :
                     step === "checkout" ? "الخطوة الثانية" : "الخطوة الأخيرة"}
                  </span>
                </div>
              </div>
              {/* زر إغلاق */}
              <button onClick={() => setIsCartOpen(false)} aria-label="إغلاق"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1c1613] text-[#a89f94] hover:text-white hover:bg-[#251e19] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* ─── شريط التقدم ─── */}
          {showProgress && (
            <div className="flex items-center px-4 sm:px-5 pb-3 gap-0 shrink-0">
              {STEPS_META.map((s, i) => {
                const isActive = i === currentStepIdx;
                const isDone   = i < currentStepIdx;
                return (
                  <div key={s.key} className="flex items-center flex-1 last:flex-none">
                    {/* نقطة الخطوة */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300 ${
                        isDone   ? "bg-emerald-500 text-white scale-90" :
                        isActive ? "bg-[#ff7a00] text-white scale-110 shadow-lg shadow-[#ff7a00]/30" :
                                   "bg-[#2a221b] text-[#6b6259]"
                      }`}>
                        {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                      </div>
                      <span className={`text-[9px] font-bold leading-none whitespace-nowrap ${
                        isActive ? "text-[#ff7a00]" : isDone ? "text-emerald-500" : "text-[#4a4440]"
                      }`}>{s.label}</span>
                    </div>
                    {/* خط الوصل */}
                    {i < STEPS_META.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1.5 rounded-full transition-all duration-500 ${
                        i < currentStepIdx ? "bg-emerald-500/50" : "bg-[#2a221b]"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── محتوى الخطوة (يتحرك) ─── */}
          <div key={animKey} className={`flex-1 flex flex-col overflow-hidden ${stepAnimClass}`}>

            {/* ══ خطوة 1: السلة ══ */}
            {step === "cart" && (
              <>
                {cart.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="h-20 w-20 rounded-2xl bg-[#1b1512] border border-[#2b241e] text-[#736a61] flex items-center justify-center mb-4">
                      <ShoppingBag className="h-10 w-10 stroke-[1.5]" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">سلتك فارغة حالياً</h3>
                    <p className="text-xs sm:text-sm text-[#a89f94] max-w-xs mb-6 leading-relaxed">
                      تصفح قائمة أكلات روزماري اللذيذة وأضف وجباتك المفضلة بضغطة واحدة!
                    </p>
                    <Link href="/menu" onClick={() => setIsCartOpen(false)}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#e66e00] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-black/40 hover:scale-105 active:scale-95 transition-all">
                      <span>تصفح كل الأكلات</span>
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* قائمة الوجبات */}
                    <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 space-y-3 divide-y divide-[#1e1914]">
                      {cart.map((item) => (
                        <div key={`${item.product.id}-${item.notes ?? ""}`}
                          className="pt-3 first:pt-0 flex gap-3.5 items-center">
                          <div className="relative h-16 w-16 sm:h-18 sm:w-18 rounded-xl overflow-hidden bg-[#1a1412] shrink-0 border border-[#26201a]">
                            <Image src={item.product.image} alt={item.product.name}
                              fill className="object-cover" sizes="72px" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white truncate mb-1">
                              {item.product.name}
                            </h4>
                            {item.notes && (
                              <p className="mb-1 text-[11px] text-[#ff9838] bg-[#ff7a00]/10 rounded-md px-2 py-0.5 border border-[#ff7a00]/20 truncate">
                                <span className="font-bold text-[#ff7a00]">ملاحظة: </span>{item.notes}
                              </p>
                            )}
                            <div className="flex items-baseline gap-1 text-[#ff7a00] font-black text-sm mb-2">
                              <span>{item.product.price * item.quantity}</span>
                              <span className="text-[10px] text-[#a89f94]">ج.م</span>
                              {item.quantity > 1 && (
                                <span className="text-[10px] text-[#736a61] font-normal mr-1">
                                  ({item.product.price} ج.م / للقطعة)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2.5">
                              <div className="inline-flex items-center rounded-lg bg-[#1a1512] border border-[#2a231d] p-0.5">
                                <button onClick={() => updateQuantity(item.product.id, -1)} aria-label="تقليل"
                                  className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-[#251e18] text-[#a89f94] hover:text-white transition-colors">
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="px-2.5 text-xs font-black text-white">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.product.id, 1)} aria-label="زيادة"
                                  className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-[#251e18] text-[#a89f94] hover:text-white transition-colors">
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                              <button onClick={() => removeFromCart(item.product.id)} aria-label="حذف"
                                className="text-[#736a61] hover:text-[#ff3b30] p-1 transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* تذييل السلة */}
                    <div className="px-4 sm:px-5 py-4 border-t border-[#231d17] bg-[#15110e] space-y-3 shrink-0">
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-[#a89f94]">
                          <span>المجموع الفرعي</span>
                          <span className="font-bold text-white">{subtotal} ج.م</span>
                        </div>
                        <div className="flex justify-between text-[#a89f94]">
                          <span>التوصيل</span>
                          <span className="font-bold text-white">يحدد لاحقاً</span>
                        </div>
                        <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-[#26201a]">
                          <span>الإجمالي النهائي</span>
                          <span className="text-[#ff7a00] text-lg">{total} ج.م</span>
                        </div>
                      </div>

                      <button onClick={() => goTo("checkout", "forward")}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#e66e00] font-bold text-sm text-white shadow-lg shadow-black/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                        <span>إتمام الطلب والدفع</span>
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <button onClick={clearCart}
                        className="w-full py-1.5 text-center text-xs text-[#736a61] hover:text-[#a89f94] transition-colors">
                        تفريغ السلة بالكامل
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ══ خطوة 2: فورم البيانات ══ */}
            {step === "checkout" && (
              <CheckoutForm
                initialValues={customer ?? undefined}
                onBack={() => goTo("cart", "back")}
                onNext={(info) => { setCustomer(info); goTo("review", "forward"); }}
              />
            )}

            {/* ══ خطوة 3: مراجعة وتأكيد ══ */}
            {step === "review" && customer && (
              <OrderReviewStep
                customer={customer}
                onEditInfo={() => goTo("checkout", "back")}
                onConfirmed={() => goTo("success", "forward")}
                onCancelAll={() => { goTo("cart", "back"); }}
              />
            )}

            {/* ══ خطوة 4: نجاح ══ */}
            {step === "success" && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
                <div className="h-20 w-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10" strokeWidth={1.8} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-black text-white">تم استلام طلبك!</h3>
                  <p className="inline-flex flex-wrap items-center justify-center gap-1.5 text-sm text-[#a89f94] leading-relaxed max-w-[260px] mx-auto">
                    فريق روزماري بيجهّز وجبتك بكل حب. التوصيل في خلال 30-45 دقيقة
                    <Truck className="h-4 w-4 shrink-0 text-[#ff7a00]" />
                  </p>
                </div>
                <button onClick={() => setIsCartOpen(false)}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-600 active:scale-95 transition-all">
                  <span>حسناً، شكراً!</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
