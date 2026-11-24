"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X, Plus, Minus, Trash2, ShoppingBag, ArrowLeft, ChevronLeft, Check, CheckCircle2, Truck, Banknote,
} from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { useDeliveryQuote } from "@/hooks/useDeliveryQuote";
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
  const router = useRouter();
  const {
    cart, isCartOpen, setIsCartOpen,
    updateQuantity, removeFromCart, clearCart,
    subtotal, coupon, couponDiscount, clearCoupon,
  } = useShop();
  const { isFree: isFreeDelivery, amount: deliveryAmount, label: deliveryLabel } = useDeliveryQuote();

  /* ── حالة الخطوة والأنيميشن ── */
  const [step, setStep]           = useState<Step>("cart");
  const [dir, setDir]             = useState<Dir>("forward");
  const [animKey, setAnimKey]     = useState(0);   // يتغير عند كل انتقال لإعادة الأنيميشن
  const [customer, setCustomer]   = useState<CustomerInfo | null>(null);
  const [dragY, setDragY]         = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY               = useRef<number | null>(null);
  const dragYRef                  = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.matchMedia("(min-width: 640px)").matches) return;
    touchStartY.current = e.touches[0]?.clientY ?? null;
    dragYRef.current = 0;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const distance = (e.touches[0]?.clientY ?? touchStartY.current) - touchStartY.current;
    const nextY = distance > 0 ? Math.min(distance, 520) : 0;
    dragYRef.current = nextY;
    setDragY(nextY);
  };

  const handleTouchEnd = () => {
    if (dragYRef.current >= 120) setIsCartOpen(false);
    else {
      setDragY(0);
      dragYRef.current = 0;
    }
    setIsDragging(false);
    touchStartY.current = null;
  };

  const handleTouchCancel = () => {
    setDragY(0);
    dragYRef.current = 0;
    setIsDragging(false);
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
          style={{
            transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
            transition: isDragging ? "none" : "transform 280ms cubic-bezier(.16,1,.3,1)",
          }}
          className={`w-full sm:w-[440px] max-w-full bg-[var(--color-page-background)] shadow-2xl flex flex-col text-white max-sm:h-[91vh] max-sm:max-h-[94vh] max-sm:rounded-t-[28px] max-sm:border-t max-sm:border-[var(--color-border)] sm:h-full sm:border-r sm:border-[var(--color-border)] overflow-hidden ${
            isClosing
              ? "anim-sheet-or-drawer-out pointer-events-none"
              : "anim-sheet-or-drawer pointer-events-auto"
          }`}>

          {/* مقبض السحب — الموبايل فقط */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            className="mx-auto mt-1 flex h-9 w-20 touch-none items-center justify-center sm:hidden shrink-0"
            aria-label="اسحب لأسفل لإغلاق السلة"
          >
            <span className="h-1.5 w-12 rounded-full bg-[var(--color-on-primary)]" />
          </div>

          {/* ─── رأس الـ Drawer: العنوان + خطوات الطلب ─── */}
          {step !== "success" && (
            <div className="relative shrink-0 px-4 pb-4 pt-2 sm:px-5">
              <div className="flex items-center gap-3">
                {/* أيقونة السلة */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] shadow-[0_10px_20px_-10px_rgba(86,98,74,0.75)] sm:h-16 sm:w-16 sm:rounded-[20px]">
                  <ShoppingBag className="h-6 w-6 text-[var(--color-on-primary)] sm:h-7 sm:w-7" strokeWidth={2} />
                </div>

                {/* العنوان */}
                <div className="min-w-0 flex-1 text-center">
                  <h2 className="truncate text-lg font-black leading-tight text-[var(--color-primary)] sm:text-xl">
                    {step === "cart"     ? "سلة الطلبات" :
                     step === "checkout" ? "بيانات التوصيل" :
                                          "مراجعة الطلب"}
                  </h2>
                  <p className="mt-0.5 truncate text-[11px] font-bold text-[var(--color-primary)] sm:text-xs">
                    {step === "cart" ? "الخطوة الأولى" :
                     step === "checkout" ? "الخطوة الثانية" : "الخطوة الأخيرة"}
                  </p>
                </div>

                {/* زر إغلاق */}
                <button onClick={() => setIsCartOpen(false)} aria-label="إغلاق"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[0_6px_14px_-6px_rgba(86,98,74,0.8)] transition-colors hover:bg-[var(--color-primary-hover)] active:scale-95">
                  <X className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.6} />
                </button>
              </div>

              {/* خطوات الطلب */}
              {showProgress && (
                <div className="mt-5 flex items-start">
                  {STEPS_META.map((s, i) => {
                    const isActive = i === currentStepIdx;
                    const isDone   = i < currentStepIdx;
                    return (
                      <div key={s.key} className={`flex items-start ${i === STEPS_META.length - 1 ? "flex-none" : "flex-1"}`}>
                        <div className="flex shrink-0 flex-col items-center gap-1.5">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black transition-all duration-300 ${
                            isDone || isActive
                              ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[0_8px_16px_-8px_rgba(86,98,74,0.8)]"
                              : "bg-transparent text-[var(--color-text-muted)]"
                          }`}>
                            {isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                          </div>
                          <span className={`whitespace-nowrap text-[11px] font-black leading-none transition-colors duration-300 ${
                            isDone || isActive ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"
                          }`}>{s.label}</span>
                        </div>
                        {i < STEPS_META.length - 1 && (
                          <span className={`mx-2 mt-[17px] h-[2px] flex-1 rounded-full transition-colors duration-500 ${
                            isDone ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* خط فاصل تحت الهيدر */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-px bg-[var(--color-border)]"
              />
            </div>
          )}

          {/* ─── محتوى الخطوة (يتحرك) ─── */}
          <div key={animKey} className={`flex-1 flex flex-col overflow-hidden ${stepAnimClass}`}>

            {/* ══ خطوة 1: السلة ══ */}
            {step === "cart" && (
              <>
                {cart.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="h-20 w-20 rounded-2xl border border-[var(--color-primary-hover)] bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[0_14px_28px_-14px_rgba(86,98,74,0.9)] flex items-center justify-center mb-4">
                      <ShoppingBag className="h-10 w-10 stroke-[1.5]" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">سلتك فارغة حالياً</h3>
                    <p className="text-xs sm:text-sm text-[var(--color-text-muted)] max-w-xs mb-6 leading-relaxed">
                      تصفح قائمة أكلات روزماري اللذيذة وأضف وجباتك المفضلة بضغطة واحدة!
                    </p>
                    <Link href="/menu" onClick={() => setIsCartOpen(false)}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-black/40 hover:scale-105 active:scale-95 transition-all">
                      <span>تصفح كل الأكلات</span>
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* قائمة الوجبات */}
                    <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 space-y-3 divide-y divide-[var(--color-text-primary)]">
                      {cart.map((item) => (
                        <div key={`${item.product.id}-${item.notes ?? ""}`}
                          className="pt-3 first:pt-0 flex gap-3.5 items-center">
                          <div className="relative h-16 w-16 sm:h-18 sm:w-18 rounded-xl overflow-hidden bg-[var(--color-page-background)] shrink-0 border border-[var(--color-border)]">
                            <Image src={item.product.image} alt={item.product.name}
                              fill className="object-cover" sizes="72px" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white truncate mb-1">
                              {item.product.name}
                            </h4>
                            {item.notes && (
                              <p className="mb-1 text-[11px] text-[var(--color-primary)] bg-[var(--color-primary)]/10 rounded-md px-2 py-0.5 border border-[var(--color-primary)]/20 truncate">
                                <span className="font-bold text-[var(--color-primary)]">ملاحظة: </span>{item.notes}
                              </p>
                            )}
                            <div className="flex items-baseline gap-1 text-[var(--color-primary)] font-black text-sm mb-2">
                              <span>{item.product.price * item.quantity}</span>
                              <span className="text-[10px] text-[var(--color-text-muted)]">ج.م</span>
                              {item.quantity > 1 && (
                                <span className="text-[10px] text-[var(--color-text-muted)] font-normal mr-1">
                                  ({item.product.price} ج.م / للقطعة)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2.5">
                              <div className="inline-flex items-center rounded-lg bg-[var(--color-page-background)] border border-[var(--color-border)] p-0.5">
                                <button onClick={() => updateQuantity(item.product.id, -1)} aria-label="تقليل"
                                  className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-[var(--color-page-background)] text-[var(--color-text-muted)] hover:text-white transition-colors">
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="px-2.5 text-xs font-black text-white">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.product.id, 1)} aria-label="زيادة"
                                  className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-[var(--color-page-background)] text-[var(--color-text-muted)] hover:text-white transition-colors">
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                              <button onClick={() => removeFromCart(item.product.id)} aria-label="حذف"
                                className="text-[var(--color-text-muted)] hover:text-[#ff3b30] p-1 transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* تذييل السلة */}
                    <div className="px-4 sm:px-5 py-4 border-t border-[var(--color-border)] bg-[var(--color-page-background)] space-y-3 shrink-0">
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-[var(--color-text-muted)]">
                          <span>المجموع الفرعي</span>
                          <span className="font-bold text-white">{subtotal} ج.م</span>
                        </div>
                        {coupon && (
                          <div className="flex justify-between text-[var(--color-text-muted)]">
                            <span className="flex items-center gap-1.5">
                              الخصم ({coupon.code})
                              <button
                                type="button"
                                onClick={clearCoupon}
                                className="text-[10px] font-bold text-[var(--color-danger)] underline underline-offset-2 hover:opacity-80"
                              >
                                إزالة
                              </button>
                            </span>
                            <span className="font-bold text-[var(--color-success)]">-{couponDiscount} ج.م</span>
                          </div>
                        )}
                        <div className="flex justify-between text-[var(--color-text-muted)]">
                          <span>التوصيل</span>
                          <span className={`font-bold ${isFreeDelivery ? "text-[var(--color-success)]" : "text-white"}`}>{deliveryLabel}</span>
                        </div>
                        <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-[var(--color-border)]">
                          <span>الإجمالي النهائي</span>
                          <span className="text-[var(--color-primary)] text-lg">{Math.max(0, subtotal - couponDiscount) + deliveryAmount} ج.م</span>
                        </div>
                      </div>

                      <button onClick={() => goTo("checkout", "forward")}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] font-bold text-sm text-white shadow-lg shadow-black/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                        <span>إتمام الطلب</span>
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <p className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--color-text-secondary)]">
                        <Banknote className="h-3.5 w-3.5 text-[var(--color-primary)] shrink-0" />
                        الدفع عند الاستلام
                      </p>

                      <button
                        onClick={() => {
                          if (window.confirm("هل تريد تفريغ السلة بالكامل؟")) clearCart();
                        }}
                        className="w-full py-1.5 text-center text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-muted)] transition-colors">
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
                onConfirmed={(result) => {
                  setIsCartOpen(false);
                  router.push(`/order-confirmation?id=${encodeURIComponent(result.accessToken)}`);
                }}
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
                  <p className="inline-flex flex-wrap items-center justify-center gap-1.5 text-sm text-[var(--color-text-muted)] leading-relaxed max-w-[260px] mx-auto">
                    فريق روزماري بيجهّز وجبتك بكل حب. التوصيل في خلال 30-45 دقيقة
                    <Truck className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
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
