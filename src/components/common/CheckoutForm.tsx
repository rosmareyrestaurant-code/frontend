"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  ArrowRight, User, Phone, MapPin, StickyNote,
  Loader2, LocateFixed, ChevronLeft, CheckCircle2,
} from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { useDelivery } from "@/context/DeliveryContext";
import { CustomerInfo } from "@/types";
import { formatDays } from "@/types/delivery";

interface CheckoutFormProps {
  onBack: () => void;
  onNext: (customer: CustomerInfo) => void;
  initialValues?: CustomerInfo;
}

type Field = "name" | "phone" | "address" | "notes";

/** توحيد كتابة النص عشان مقارنة العنوان بأسماء مناطق التوصيل المجاني */
function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .trim();
}

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
  const { subtotal, total } = useShop();
  const { activeZones, selectArea } = useDelivery();

  const [form, setForm] = useState<CustomerInfo>(
    initialValues ?? { name: "", phone: "", address: "", notes: "", lat: undefined, lng: undefined }
  );
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  // المكان مش بيختاره العميل من قائمة — بيستنتج من العنوان اللي كتبه
  const matchedZone = useMemo(() => {
    const address = normalizeText(form.address);
    if (!address) return null;
    return activeZones.find((zone) => address.includes(normalizeText(zone.name))) ?? null;
  }, [activeZones, form.address]);

  useEffect(() => {
    selectArea(matchedZone?.id ?? null);
  }, [matchedZone, selectArea]);

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* ── GPS ── */
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) { alert("متصفحك مش بيدعم تحديد الموقع."); return; }
    setGpsLoading(true); setGpsSuccess(false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`);
          const data = await res.json();
          const display = data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setForm((p) => ({ ...p, address: display, lat, lng }));
        } catch {
          setForm((p) => ({ ...p, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng }));
        } finally { setGpsLoading(false); setGpsSuccess(true); }
      },
      () => { setGpsLoading(false); alert("تعذّر تحديد موقعك. تأكد من منح صلاحية الموقع."); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

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
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
  };

  /* ── UI ── */
  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden" noValidate>
      {/* رأس */}
      <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-[#231d17] shrink-0">
        <button type="button" onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1c1613] text-[#a89f94] hover:text-white hover:bg-[#251e19] transition-colors"
          aria-label="رجوع للسلة">
          <ArrowRight className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white">بياناتك للتوصيل</h2>
          <p className="text-xs text-[#857b72]">الخطوة الثانية — ادخل بياناتك</p>
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

            <label className="flex items-center gap-1.5 text-xs font-bold text-[#c4b9b0]">
              <Icon className="h-3.5 w-3.5 text-[#ff7a00]" />{label}
            </label>

            {key === "address" ? (
              <div className="relative">
                <textarea
                  value={form.address} rows={2}
                  onChange={(e) => change("address", e.target.value)}
                  placeholder={placeholder}
                  className={`w-full resize-none rounded-xl bg-[#1a1512] border ${errors.address ? "border-red-500/70" : "border-[#2d2620]"} px-3 pt-2.5 pb-2.5 pl-11 text-sm text-white placeholder-[#5a534d] focus:border-[#ff7a00] focus:outline-none focus:ring-1 focus:ring-[#ff7a00]/30 transition-all`}
                />
                {/* GPS button */}
                <button type="button" onClick={handleLocate} disabled={gpsLoading}
                  aria-label="تحديد موقعي تلقائياً"
                  className={`absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                    gpsSuccess
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-[#ff7a00]/12 text-[#ff7a00] hover:bg-[#ff7a00]/22 border-[#ff7a00]/20"
                  }`}>
                  {gpsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                   gpsSuccess  ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                                 <LocateFixed className="h-3.5 w-3.5" />}
                </button>
              </div>
            ) : multiline ? (
              <textarea value={form[key] as string} rows={2}
                onChange={(e) => change(key, e.target.value)}
                placeholder={placeholder}
                className={`w-full resize-none rounded-xl bg-[#1a1512] border ${errors[key] ? "border-red-500/70" : "border-[#2d2620]"} px-3 py-2.5 text-sm text-white placeholder-[#5a534d] focus:border-[#ff7a00] focus:outline-none focus:ring-1 focus:ring-[#ff7a00]/30 transition-all`}
              />
            ) : (
              <input type={type || "text"}
                inputMode={key === "phone" ? "numeric" : undefined}
                value={form[key] as string}
                onChange={(e) => change(key, e.target.value)}
                placeholder={placeholder}
                className={`w-full rounded-xl bg-[#1a1512] border ${errors[key] ? "border-red-500/70" : "border-[#2d2620]"} px-3 py-2.5 text-sm text-white placeholder-[#5a534d] focus:border-[#ff7a00] focus:outline-none focus:ring-1 focus:ring-[#ff7a00]/30 transition-all`}
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

        {gpsSuccess && (
          <p className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 flex items-center gap-1.5">
            <LocateFixed className="h-3.5 w-3.5 shrink-0" />
            تم تحديد موقعك وملء العنوان تلقائياً — يمكنك تعديله.
          </p>
        )}
      </div>

      {/* تذييل */}
      <div className="px-4 sm:px-5 py-4 border-t border-[#231d17] bg-[#15110e] space-y-3 shrink-0">
        {/* ملخص مبسط */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-[#a89f94]">
            <span>المجموع الفرعي</span>
            <span className="font-bold text-white">{subtotal} ج.م</span>
          </div>
          <div className="flex items-center justify-between text-[#a89f94]">
            <span>التوصيل</span>
            <span className="font-bold text-white">يحدد لاحقاً</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#26201a]">
            <span className="text-[#a89f94]">الإجمالي النهائي</span>
            <span className="text-base font-black text-[#ff7a00]">{total} ج.م</span>
          </div>
        </div>

        <button type="submit" disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#e66e00] font-bold text-sm text-white shadow-lg shadow-black/50 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2">
          {submitting
            ? <><Loader2 className="h-4 w-4 animate-spin" /><span>جاري المعالجة...</span></>
            : <><span>مراجعة الطلب</span><ChevronLeft className="h-4 w-4" /></>
          }
        </button>
      </div>
    </form>
  );
}
