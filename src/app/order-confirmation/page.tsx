"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User,
  StickyNote,
  Pencil,
  X,
  ShoppingBag,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  LocateFixed,
  Truck,
} from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { Order, CustomerInfo } from "@/types";

/** ─── Helper: تنسيق التاريخ بالعربية ─── */
function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function OrderConfirmationInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentOrder, setCurrentOrder } = useShop();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // ─── تعديل بيانات العميل ───
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<CustomerInfo | null>(null);
  const [editErrors, setEditErrors] = useState<Partial<Record<keyof CustomerInfo, string>>>({});
  const [gpsLoading, setGpsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ─── تأكيد الطلب ───
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // ─── إلغاء الطلب ───
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // استرجاع بيانات الطلب من الكونتيكست أو localStorage
  useEffect(() => {
    queueMicrotask(() => {
      const orderId = searchParams.get("id");
      if (!orderId) { setLoading(false); return; }

      // من الكونتيكست أولاً
      if (currentOrder && currentOrder.id === orderId) {
        setOrder(currentOrder);
        setLoading(false);
        return;
      }

      // من localStorage
      try {
        const saved = localStorage.getItem("rosemary_current_order");
        if (saved) {
          const parsed: Order = JSON.parse(saved);
          if (parsed.id === orderId) {
            setOrder(parsed);
            setCurrentOrder(parsed);
            setLoading(false);
            return;
          }
        }
      } catch { /* ignore */ }

      setLoading(false);
    });
  }, [currentOrder, searchParams, setCurrentOrder]);

  /* ─── تحديد الموقع GPS في فورم التعديل ─── */
  const handleGPSEdit = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`
          );
          const data = await res.json();
          const display = data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setEditForm((prev) => prev ? { ...prev, address: display, lat, lng } : prev);
        } catch {
          setEditForm((prev) => prev ? {
            ...prev,
            address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            lat,
            lng,
          } : prev);
        } finally {
          setGpsLoading(false);
        }
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  /* ─── فتح نموذج التعديل ─── */
  const startEdit = () => {
    if (!order) return;
    setEditForm({ ...order.customer });
    setEditErrors({});
    setIsEditing(true);
  };

  /* ─── حفظ التعديل ─── */
  const saveEdit = async () => {
    if (!editForm || !order) return;
    const errors: Partial<Record<keyof CustomerInfo, string>> = {};

    if (!editForm.name.trim()) errors.name = "الاسم مطلوب";
    if (!editForm.phone.trim()) {
      errors.phone = "رقم الهاتف مطلوب";
    } else if (!/^01[0-5]\d{8}$/.test(editForm.phone.replace(/\s/g, ""))) {
      errors.phone = "رقم الهاتف غير صحيح";
    }
    if (!editForm.address.trim()) errors.address = "العنوان مطلوب";

    if (Object.keys(errors).length > 0) { setEditErrors(errors); return; }

    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));

    const updated: Order = { ...order, customer: editForm };
    setOrder(updated);
    setCurrentOrder(updated);
    setIsEditing(false);
    setSaving(false);
  };

  /* ─── تأكيد الطلب ─── */
  const handleConfirm = async () => {
    if (!order) return;
    setConfirming(true);
    await new Promise((r) => setTimeout(r, 800));
    const confirmed: Order = { ...order, status: "confirmed" };
    setOrder(confirmed);
    setCurrentOrder(confirmed);
    setConfirming(false);
    setConfirmed(true);
  };

  /* ─── إلغاء الطلب ─── */
  const handleCancel = () => {
    setCurrentOrder(null);
    router.push("/");
  };

  /* ─── Loading / Error States ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0a09] flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#ff7a00] animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0b0a09] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-[#1e1713] text-[#ff7a00] flex items-center justify-center">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">لم يتم العثور على الطلب</h2>
        <p className="text-sm text-[#8e8479] max-w-xs">
          يبدو أن الطلب غير موجود أو انتهت صلاحية الجلسة.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#ff7a00] px-6 py-3 text-sm font-bold text-white hover:bg-[#e66e00] transition-colors"
        >
          <span>العودة للرئيسية</span>
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  /* ─── الصفحة الرئيسية ─── */
  return (
    <div className="min-h-screen bg-[#0b0a09] py-8 sm:py-12 select-none" dir="rtl">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 space-y-5">

        {/* ─── شريط الحالة ─── */}
        <div className={`flex items-center gap-3 rounded-2xl border p-4 ${
          confirmed
            ? "border-emerald-500/30 bg-emerald-500/8"
            : order.status === "cancelled"
            ? "border-red-500/30 bg-red-500/8"
            : "border-[#ff7a00]/30 bg-[#ff7a00]/8"
        }`}>
          {confirmed ? (
            <CheckCircle2 className="h-7 w-7 text-emerald-400 shrink-0" />
          ) : order.status === "cancelled" ? (
            <X className="h-7 w-7 text-red-400 shrink-0" />
          ) : (
            <Clock className="h-7 w-7 text-[#ff7a00] shrink-0" />
          )}
          <div>
            <h1 className="text-base sm:text-lg font-black text-white">
              {confirmed
                ? "تم تأكيد طلبك بنجاح!"
                : order.status === "cancelled"
                ? "تم إلغاء الطلب"
                : "طلبك في انتظار التأكيد"}
            </h1>
            <p className="text-xs text-[#a89f94] mt-0.5">
              رقم الطلب:{" "}
              <span className="font-mono font-bold text-white tracking-wider">
                {order.id}
              </span>
              {" · "}{formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        {/* ─── ملخص الطلب ─── */}
        <div className="rounded-2xl border border-[#2a221b] bg-[#141210] overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-[#2a221b]">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-[#ff7a00]" />
              ملخص الطلب
            </h2>
            <span className="text-xs text-[#8e8479]">
              {order.items.reduce((acc, i) => acc + i.quantity, 0)} وجبات
            </span>
          </div>

          <div className="divide-y divide-[#201a15]">
            {order.items.map((item) => (
              <div
                key={`${item.product.id}-${item.notes ?? ""}`}
                className="flex items-center gap-3 px-4 sm:px-5 py-3.5"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#1a1512] border border-[#2a221b]">
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{item.product.name}</p>
                  {item.notes && (
                    <p className="text-[11px] text-[#ff9838] truncate mt-0.5">
                      ملاحظة: {item.notes}
                    </p>
                  )}
                  <p className="text-xs text-[#8e8479] mt-0.5">
                    {item.quantity} × {item.product.price} ج.م
                  </p>
                </div>
                <span className="text-sm font-black text-[#ff7a00] shrink-0">
                  {item.product.price * item.quantity} ج.م
                </span>
              </div>
            ))}
          </div>

          {/* الحساب الإجمالي */}
          <div className="px-4 sm:px-5 py-4 bg-[#15110e] border-t border-[#2a221b] space-y-2">
            <div className="flex justify-between text-xs text-[#a89f94]">
              <span>المجموع الفرعي</span>
              <span className="font-bold text-white">{order.subtotal} ج.م</span>
            </div>
            <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-[#26201a]">
              <span>الإجمالي النهائي</span>
              <span className="text-[#ff7a00] text-base">{order.total} ج.م</span>
            </div>
          </div>
        </div>

        {/* ─── بيانات العميل ─── */}
        <div className="rounded-2xl border border-[#2a221b] bg-[#141210] overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-[#2a221b]">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="h-4 w-4 text-[#ff7a00]" />
              بيانات التوصيل
            </h2>
            {/* زر التعديل — فقط لو الطلب لسه pending */}
            {!confirmed && order.status === "pending" && !isEditing && (
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#ff7a00] hover:text-[#ff9838] transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                تعديل
              </button>
            )}
          </div>

          {isEditing && editForm ? (
            /* فورم التعديل */
            <div className="p-4 sm:p-5 space-y-3">
              {/* اسم */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#c4b9b0] flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#ff7a00]" />الاسم الكامل
                </label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className={`w-full rounded-xl bg-[#1a1512] border ${editErrors.name ? "border-red-500/70" : "border-[#2d2620]"} px-3 py-2.5 text-sm text-white placeholder-[#5a534d] focus:border-[#ff7a00] focus:outline-none`}
                />
                {editErrors.name && <p className="text-[11px] text-red-400">{editErrors.name}</p>}
              </div>

              {/* هاتف */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#c4b9b0] flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-[#ff7a00]" />رقم الهاتف
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className={`w-full rounded-xl bg-[#1a1512] border ${editErrors.phone ? "border-red-500/70" : "border-[#2d2620]"} px-3 py-2.5 text-sm text-white placeholder-[#5a534d] focus:border-[#ff7a00] focus:outline-none`}
                />
                {editErrors.phone && <p className="text-[11px] text-red-400">{editErrors.phone}</p>}
              </div>

              {/* عنوان + GPS */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#c4b9b0] flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#ff7a00]" />عنوان التوصيل
                </label>
                <div className="relative">
                  <textarea
                    rows={2}
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className={`w-full resize-none rounded-xl bg-[#1a1512] border ${editErrors.address ? "border-red-500/70" : "border-[#2d2620]"} px-3 py-2.5 pl-10 text-sm text-white placeholder-[#5a534d] focus:border-[#ff7a00] focus:outline-none`}
                  />
                  <button
                    type="button"
                    onClick={handleGPSEdit}
                    disabled={gpsLoading}
                    className="absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff7a00]/15 text-[#ff7a00] hover:bg-[#ff7a00]/25 border border-[#ff7a00]/20 transition-all"
                  >
                    {gpsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
                  </button>
                </div>
                {editErrors.address && <p className="text-[11px] text-red-400">{editErrors.address}</p>}
              </div>

              {/* ملاحظات */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#c4b9b0] flex items-center gap-1.5">
                  <StickyNote className="h-3.5 w-3.5 text-[#ff7a00]" />ملاحظات (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full resize-none rounded-xl bg-[#1a1512] border border-[#2d2620] px-3 py-2.5 text-sm text-white placeholder-[#5a534d] focus:border-[#ff7a00] focus:outline-none"
                />
              </div>

              {/* أزرار الحفظ والإلغاء */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#e66e00] text-sm font-bold text-white hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  حفظ التعديلات
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#1e1713] text-sm font-bold text-[#a89f94] hover:text-white border border-[#2d2620] transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            /* عرض البيانات */
            <div className="p-4 sm:p-5 space-y-3">
              <InfoRow icon={User} label="الاسم" value={order.customer.name} />
              <InfoRow icon={Phone} label="الهاتف" value={order.customer.phone} />
              <InfoRow icon={MapPin} label="العنوان" value={order.customer.address} />
              {order.customer.notes && (
                <InfoRow icon={StickyNote} label="ملاحظات" value={order.customer.notes} />
              )}
            </div>
          )}
        </div>

        {/* ─── أزرار الإجراءات ─── */}
        {!confirmed && order.status === "pending" && !isEditing && (
          <div className="space-y-3">
            {/* تأكيد الطلب */}
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff7a00] to-[#e66e00] font-black text-base text-white shadow-xl shadow-black/50 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2"
            >
              {confirming ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>جاري تأكيد طلبك...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  <span>تأكيد الطلب الآن</span>
                </>
              )}
            </button>

            {/* إلغاء الطلب */}
            {!showCancelConfirm ? (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-[#736a61] hover:text-red-400 transition-colors"
              >
                إلغاء الطلب
              </button>
            ) : (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/8 p-4 space-y-3">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-bold">هل أنت متأكد من إلغاء الطلب؟</p>
                </div>
                <p className="text-xs text-[#a89f94]">
                  سيتم حذف الطلب بالكامل ولا يمكن التراجع عن هذا الإجراء.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-sm font-bold text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    نعم، ألغِ الطلب
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#1e1713] text-sm font-bold text-[#a89f94] border border-[#2d2620] hover:text-white transition-colors"
                  >
                    لا، تراجع
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── حالة بعد التأكيد ─── */}
        {confirmed && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/8 p-5 text-center space-y-3">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-black text-white mb-1">تم تأكيد طلبك بنجاح!</h3>
              <p className="inline-flex flex-wrap items-center justify-center gap-1.5 text-xs text-[#a89f94]">
                فريق روزماري بيجهّز وجبتك بكل حب. التوصيل خلال 30-45 دقيقة
                <Truck className="h-3.5 w-3.5 shrink-0 text-[#ff7a00]" />
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 transition-colors"
            >
              <span>العودة للرئيسية</span>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* رابط للمنيو */}
        {!confirmed && (
          <Link
            href="/menu"
            className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#857b72] hover:text-[#ff7a00] transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>تصفح باقي الوجبات</span>
          </Link>
        )}
      </div>
    </div>
  );
}

/* ─── Component مساعد لعرض بيانات العميل ─── */
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ff7a00]/10 border border-[#ff7a00]/20 text-[#ff7a00]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-[#6b6259] font-semibold uppercase tracking-widest">{label}</p>
        <p className="text-sm text-white mt-0.5 leading-relaxed break-words">{value}</p>
      </div>
    </div>
  );
}

/** Wrapper للصفحة يلف المحتوى بـ Suspense لأن useSearchParams يحتاجه */
export default function OrderConfirmationPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b0a09] flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-[#ff7a00] animate-spin" />
        </div>
      }
    >
      <OrderConfirmationInner />
    </Suspense>
  );
}
