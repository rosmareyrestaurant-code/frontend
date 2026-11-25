"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ArrowRight, User, Phone, MapPin, StickyNote,
  Loader2, MapPinned, ChevronLeft, CheckCircle2,
} from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { useDelivery } from "@/context/DeliveryContext";
import { useDeliveryQuote } from "@/hooks/useDeliveryQuote";
import MapLocationPicker, { type MapPickedLocation } from "@/components/common/MapLocationPicker";
import { CustomerInfo } from "@/types";
import { formatDays } from "@/types/delivery";
import { normalizeArabic } from "@/lib/arabic";

interface CheckoutFormProps {
  onBack: () => void;
  onNext: (customer: CustomerInfo) => void;
  initialValues?: CustomerInfo;
}

type Field = "name" | "phone" | "address" | "notes";

const FIELDS: {
  key: Field;
  label: string;
  placeholder: string;
  icon: React.ElementType;
  type?: string;
  multiline?: boolean;
}[] = [
  { key: "name",    label: "الاسم الكامل",           placeholder: "مثال: محمد أحمد",          icon: User },
  { key: "phone",   label: "رقم الهاتف",             placeholder: "مثال: 01012345678",         icon: Phone, type: "tel" },
  { key: "address", label: "عنوان التوصيل",           placeholder: "الشارع، المبنى، الدور...",  icon: MapPin,     multiline: true },
  { key: "notes",   label: "ملاحظات إضافية (اختياري)", placeholder: "مثال: لا بصل، الطابق الثالث...", icon: StickyNote, multiline: true },
];

export default function CheckoutForm({ onBack, onNext, initialValues }: CheckoutFormProps) {
  const { subtotal, couponDiscount } = useShop();
  const { isFree: isFreeDelivery, amount: deliveryAmount, label: deliveryLabel } = useDeliveryQuote();
  const { activeZones, selectArea } = useDelivery();

  const [form, setForm] = useState<CustomerInfo>(
    initialValues ?? { name: "", phone: "", address: "", notes: "", lat: undefined, lng: undefined }
  );
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  // المكان مش بيختاره العميل من قائمة — بيستنتج من العنوان اللي كتبه
  const matchedZone = useMemo(() => {
    const address = normalizeArabic(form.address);
    if (!address) return null;
    return activeZones.find((zone) => address.includes(normalizeArabic(zone.name))) ?? null;
  }, [activeZones, form.address]);

  useEffect(() => {
    selectArea(matchedZone?.id ?? null);
  }, [matchedZone, selectArea]);

  const [mapOpen, setMapOpen] = useState(false);
  const [mapFilled, setMapFilled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* ── اختيار المكان من الخريطة ── */
  const handleMapConfirm = (location: MapPickedLocation) => {
    setForm((p) => ({ ...p, address: location.address, lat: location.lat, lng: location.lng }));
    setMapFilled(true);
    setMapOpen(false);
    setErrors((p) => ({ ...p, address: undefined }));
  };

  /* ── Validation ── */
  const validate = (): boolean => {
    const e: Partial<Record<Field, string>> = {};
    if (!form.name.trim())             e.name    = "الاسم مطلوب";
    else if (form.name.trim().length < 3) e.name = "الاسم يجب أن يكون 3 أحرف على الأقل";
    if (!form.phone.trim())            e.phone   = "رقم الهاتف مطلوب";
    else if (!/^01[0-5]\d{8}$/.test(form.phone.replace(/\s/g, "")))
                                       e.phone   = "رقم غير صحيح — يبدأ بـ 01 ومكوّن من 11 رقم";
    if (!form.address.trim())          e.address = "العنوان مطلوب للتوصيل";
    else if (form.address.trim().length < 8) e.address = "يرجى إدخال عنوان تفصيلي أكثر";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit → go to review step ── */
  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 350));
    setSubmitting(false);
    onNext({
      ...form,
      areaId: matchedZone?.id,
      areaName: matchedZone?.name,
    });
  };

  /* ── Field change helper ── */
  const change = (key: Field, val: string) => {
    setForm((p) => ({ ...p, [key]: val, ...(key === "address" ? { lat: undefined, lng: undefined } : {}) }));
    if (key === "address" && val !== form.address) setMapFilled(false);
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
  };

  /* ── UI ── */
  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden" noValidate>
      {/* رأس */}
      <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-[var(--color-border)] shrink-0">
        <button type="button" onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-page-background)] text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-page-background)] transition-colors"
          aria-label="رجوع للسلة">
          <ArrowRight className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white">بياناتك للتوصيل</h2>
          <p className="text-xs text-[var(--color-text-muted)]">الخطوة الثانية — ادخل بياناتك</p>
        </div>
      </div>

      {/* حقول */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
        {FIELDS.map(({ key, label, placeholder, icon: Icon, type, multiline }) => (
          <div key={key} className="space-y-1.5">
            {/* المكان بيستنتج من العنوان: لو طابق منطقة مجانية نظهر التوضيح، غير كده مفيش حاجة */}
            {key === "notes" && matchedZone && (
              <p className="flex items-start gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-[11px] font-bold leading-relaxed text-emerald-400">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  مكانك ضمن مناطق التوصيل المجاني{matchedZone.days.length ? ` (${formatDays(matchedZone.days)})` : ""}.
                </span>
              </p>
            )}

            <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-muted)]">
              <Icon className="h-3.5 w-3.5 text-[var(--color-primary)]" />{label}
            </label>

            {key === "address" ? (
              <>
              <textarea
                value={form.address} rows={2}
                onChange={(e) => change("address", e.target.value)}
                placeholder={placeholder}
                className={`w-full resize-none rounded-xl bg-[var(--color-page-background)] border ${errors.address ? "border-red-500/70" : "border-[var(--color-border)]"} px-3 py-2.5 text-sm text-white placeholder-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/30 transition-all`}
              />
              <button type="button" onClick={() => setMapOpen(true)}
                className={`flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-[12px] font-bold transition-all ${
                  mapFilled
                    ? "border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "border-[var(--color-primary-border)] bg-[var(--color-surface-elevated)] text-[var(--color-icon)] hover:bg-[var(--color-primary-soft)]"
                }`}>
                {mapFilled
                  ? <><CheckCircle2 className="h-3.5 w-3.5" /> تم تحديد مكانك من الخريطة — اضغط لتعديله</>
                  : <><MapPinned className="h-3.5 w-3.5" /> تحديد مكاني من الخريطة</>}
              </button>
              </>
            ) : multiline ? (
              <textarea value={form[key] as string} rows={2}
                onChange={(e) => change(key, e.target.value)}
                placeholder={placeholder}
                className={`w-full resize-none rounded-xl bg-[var(--color-page-background)] border ${errors[key] ? "border-red-500/70" : "border-[var(--color-border)]"} px-3 py-2.5 text-sm text-white placeholder-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/30 transition-all`}
              />
            ) : (
              <input type={type || "text"}
                inputMode={key === "phone" ? "numeric" : undefined}
                value={form[key] as string}
                onChange={(e) => change(key, e.target.value)}
                placeholder={placeholder}
                className={`w-full rounded-xl bg-[var(--color-page-background)] border ${errors[key] ? "border-red-500/70" : "border-[var(--color-border)]"} px-3 py-2.5 text-sm text-white placeholder-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/30 transition-all`}
              />
            )}

            {errors[key] && (
              <p className="text-[11px] font-medium text-red-400 flex items-center gap-1 mt-0.5">
                <span className="inline-block h-1 w-1 rounded-full bg-red-400 shrink-0" />
                {errors[key]}
              </p>
            )}
          </div>
        ))}

        {mapFilled && (
          <p className="text-[11px] text-[var(--color-primary)] bg-[var(--color-primary-soft)] border border-[var(--color-primary-border)] rounded-lg px-3 py-2 flex items-center gap-1.5">
            <MapPinned className="h-3.5 w-3.5 shrink-0" />
            تم ملء العنوان من مكانك على الخريطة — أكمل تفاصيل المبنى والدور لو محتاج.
          </p>
        )}
      </div>

      {/* تذييل */}
      <div className="px-4 sm:px-5 py-4 border-t border-[var(--color-border)] bg-[var(--color-page-background)] space-y-3 shrink-0">
        {/* ملخص مبسط */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-[var(--color-text-muted)]">
            <span>المجموع الفرعي</span>
            <span className="font-bold text-white">{subtotal} ج.م</span>
          </div>
          {couponDiscount > 0 && (
            <div className="flex items-center justify-between text-[var(--color-text-muted)]">
              <span>الخصم</span>
              <span className="font-bold text-[var(--color-success)]">-{couponDiscount} ج.م</span>
            </div>
          )}
          <div className="flex items-center justify-between text-[var(--color-text-muted)]">
            <span>التوصيل</span>
            <span className={`font-bold ${isFreeDelivery ? "text-[var(--color-success)]" : "text-white"}`}>{deliveryLabel}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
            <span className="text-[var(--color-text-muted)]">الإجمالي النهائي</span>
            <span className="text-base font-black text-[var(--color-primary)]">{Math.max(0, subtotal - couponDiscount) + deliveryAmount} ج.م</span>
          </div>
        </div>

        <button type="submit" disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] font-bold text-sm text-white shadow-lg shadow-black/50 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2">
          {submitting
            ? <><Loader2 className="h-4 w-4 animate-spin" /><span>جاري المعالجة...</span></>
            : <><span>مراجعة الطلب</span><ChevronLeft className="h-4 w-4" /></>
          }
        </button>
      </div>

      <MapLocationPicker
        key={mapOpen ? "map-open" : "map-closed"}
        open={mapOpen}
        initial={{ lat: form.lat, lng: form.lng }}
        onClose={() => setMapOpen(false)}
        onConfirm={handleMapConfirm}
      />
    </form>
  );
}
