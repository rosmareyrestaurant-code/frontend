"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowRight, CheckCircle2, AlertTriangle,
  User, Phone, MapPin, StickyNote, Loader2, Pencil, Truck,
} from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { useDelivery } from "@/context/DeliveryContext";
import { useDeliveryQuote } from "@/hooks/useDeliveryQuote";
import { useStoreToast } from "@/components/common/StoreToast";
import { CustomerInfo, Order, PaymentMethod } from "@/types";
import { SITE_CONTACT } from "@/data/siteConfig";
import PaymentMethodPicker, { PaymentConfig } from "./PaymentMethodPicker";

export interface PlacedOrderResult {
  order: Order;
  accessToken: string;
  orderNumber: string;
}

interface OrderReviewStepProps {
  customer: CustomerInfo;
  onEditInfo: () => void;                    // رجوع لتعديل بيانات العميل
  onConfirmed: (result: PlacedOrderResult) => void; // بعد التأكيد الناجح
  onCancelAll: () => void;                   // إلغاء وإغلاق
}

export default function OrderReviewStep({
  customer, onEditInfo, onConfirmed, onCancelAll,
}: OrderReviewStepProps) {
  const { cart, subtotal, placeOrderAsync } = useShop();
  const { activeZones } = useDelivery();
  const { fee: storeDeliveryFee } = useDeliveryQuote();
  const { showMessage } = useStoreToast();

  // التوضيح بيتبني على المكان اللي العميل أدخله نفسه، مش على الاختيار الحالي في السياق.
  const isFreeArea = customer.areaId
    ? activeZones.some((z) => z.id === customer.areaId)
    : !!customer.areaName && activeZones.some((z) => z.name === customer.areaName);
  const deliveryAmount = isFreeArea ? 0 : storeDeliveryFee;
  const deliveryLabel = isFreeArea
    ? "توصيل مجاني"
    : storeDeliveryFee > 0 ? `${storeDeliveryFee} ج.م` : "يحدد لاحقاً";

  const [confirming, setConfirming]           = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [paymentMethod, setPaymentMethod]     = useState<PaymentMethod>("cash");
  const [proofUrl, setProofUrl]               = useState("");
  const [proofPublicId, setProofPublicId]     = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [paymentConfig, setPaymentConfig]     = useState<PaymentConfig>({
    vodafoneCashNumber: SITE_CONTACT.phone,
    instapayAccount: SITE_CONTACT.phone,
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings/public")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.success) return;
        setPaymentConfig({
          vodafoneCashNumber: d.data.vodafoneCashNumber || SITE_CONTACT.phone,
          instapayAccount: d.data.instapayAccount || SITE_CONTACT.phone,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const proofMissing = paymentMethod !== "cash" && !proofUrl;

  const handleConfirm = async () => {
    if (proofMissing) {
      showMessage("ارفع صورة التحويل الأول عشان نأكد الطلب", "warning");
      return;
    }
    setConfirming(true);
    let result: PlacedOrderResult;
    try {
      result = await placeOrderAsync(customer, {
        method: paymentMethod,
        proofUrl: proofUrl || undefined,
        proofPublicId: proofPublicId || undefined,
        transactionReference: transactionReference.trim() || undefined,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "فشل إرسال الطلب";
      showMessage(msg, "error");
      setConfirming(false);
      return;
    }
    setConfirming(false);
    onConfirmed(result);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* رأس */}
      <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-[var(--color-border)] shrink-0">
        <button onClick={onEditInfo}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-page-background)] text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-page-background)] transition-colors"
          aria-label="رجوع لتعديل البيانات">
          <ArrowRight className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white">مراجعة الطلب</h2>
          <p className="text-xs text-[var(--color-text-muted)]">الخطوة الأخيرة — تأكد وأكمل</p>
        </div>
      </div>

      {/* محتوى قابل للتمرير */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">

        {/* ─── الوجبات المطلوبة ─── */}
        <div>
          <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-3">
            الوجبات المطلوبة
          </p>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-page-background)] overflow-hidden divide-y divide-[var(--color-border)]">
            {cart.map((item) => (
              <div key={`${item.product.id}-${item.notes ?? ""}`}
                className="flex items-center gap-3 px-3 py-3">
                <div className="relative h-13 w-13 shrink-0 overflow-hidden rounded-xl bg-[var(--color-page-background)] border border-[var(--color-border)]">
                  <Image src={item.product.image} alt={item.product.name}
                    fill sizes="52px" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-white truncate">
                    {item.product.name}
                  </p>
                  {item.notes && (
                    <p className="text-[10px] text-[var(--color-primary)] truncate mt-0.5">
                      ملاحظة: {item.notes}
                    </p>
                  )}
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    {item.quantity} × {item.product.price} ج.م
                  </p>
                </div>
                <span className="text-xs sm:text-sm font-black text-[var(--color-primary)] shrink-0">
                  {item.product.price * item.quantity} ج.م
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── ملخص المبالغ ─── */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-page-background)] px-4 py-3.5 space-y-2">
          <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
            <span>المجموع</span>
            <span className="font-bold text-white">{subtotal} ج.م</span>
          </div>
          <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
            <span>التوصيل</span>
            <span className={`font-bold ${isFreeArea ? "text-[#4F8A57]" : "text-white"}`}>{deliveryLabel}</span>
          </div>
          <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-[var(--color-border)]">
            <span>الإجمالي النهائي</span>
            <span className="text-[var(--color-primary)] text-base">{subtotal + deliveryAmount} ج.م</span>
          </div>
        </div>

        {/* ─── بيانات التوصيل ─── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">بيانات التوصيل</p>
            <button onClick={onEditInfo}
              className="flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">
              <Pencil className="h-3 w-3" /> تعديل
            </button>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-page-background)] px-4 py-3.5 space-y-3">
            <InfoRow icon={User}       label="الاسم"    value={customer.name} />
            <InfoRow icon={Phone}      label="الهاتف"   value={customer.phone} />
            <InfoRow icon={MapPin}     label="العنوان"  value={customer.address} />
            {customer.areaName && (
              <InfoRow icon={Truck} label="مكان التوصيل" value={customer.areaName} />
            )}
            {isFreeArea && (
              <p className="flex items-start gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-[11px] font-bold leading-relaxed text-emerald-400">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                مكانك ضمن مناطق التوصيل المجاني.
              </p>
            )}
            {customer.notes && (
              <InfoRow icon={StickyNote} label="ملاحظات" value={customer.notes} />
            )}
          </div>
        </div>

        {/* ─── طريقة الدفع ─── */}
        <PaymentMethodPicker
          method={paymentMethod}
          onMethodChange={(m) => { setPaymentMethod(m); if (m === "cash") { setProofUrl(""); setProofPublicId(""); setTransactionReference(""); } }}
          proofUrl={proofUrl}
          onProofChange={(url, pid) => { setProofUrl(url); setProofPublicId(pid); }}
          transactionReference={transactionReference}
          onTransactionReferenceChange={setTransactionReference}
          config={paymentConfig}
          showMessage={showMessage}
        />
      </div>

      {/* تذييل الأكشن */}
      <div className="px-4 sm:px-5 py-4 border-t border-[var(--color-border)] bg-[var(--color-page-background)] space-y-2.5 shrink-0">
        {proofMissing && (
          <p className="text-center text-[11px] font-bold text-amber-400">
            ارفع صورة التحويل عشان تقدر تأكد الطلب
          </p>
        )}
        {/* تأكيد الطلب */}
        <button onClick={handleConfirm} disabled={confirming || proofMissing}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] font-bold text-sm text-white shadow-lg shadow-black/50 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2">
          {confirming
            ? <><Loader2 className="h-4 w-4 animate-spin" /><span>جاري تأكيد طلبك...</span></>
            : <><CheckCircle2 className="h-4 w-4" /><span>تأكيد الطلب الآن</span></>
          }
        </button>

        {/* إلغاء */}
        {!showCancelConfirm ? (
          <button onClick={() => setShowCancelConfirm(true)}
            className="w-full py-2 text-xs text-[var(--color-text-muted)] hover:text-red-400 transition-colors">
            إلغاء الطلب والعودة
          </button>
        ) : (
          <div className="rounded-xl border border-red-500/30 bg-red-500/8 p-3 space-y-2.5">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="text-xs font-bold">هل تريد إلغاء الطلب بالكامل؟</p>
            </div>
            <div className="flex gap-2">
              <button onClick={onCancelAll}
                className="flex-1 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-xs font-bold text-red-400 hover:bg-red-500/30 transition-colors">
                نعم، ألغِ
              </button>
              <button onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2 rounded-lg bg-[var(--color-page-background)] text-xs font-bold text-[var(--color-text-muted)] border border-[var(--color-border)] hover:text-white transition-colors">
                لا، تراجع
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] border border-[var(--color-primary-hover)] text-[var(--color-on-primary)]">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-[var(--color-text-muted)] font-semibold uppercase tracking-widest">{label}</p>
        <p className="text-xs text-white mt-0.5 leading-relaxed break-words">{value}</p>
      </div>
    </div>
  );
}
