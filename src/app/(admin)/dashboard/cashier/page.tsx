"use client";

import { useEffect, useState } from "react";
import { UserCog, ShieldCheck, Save, Loader2, Info, LogIn, Copy, KeyRound } from "lucide-react";
import { useToast } from "@/components/admin/shared/Toast";

interface CashierAccount {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

const fieldClass =
  "w-full rounded-[12px] border border-[#E9E5DA] bg-[#F7F4EE] px-4 py-2.5 text-[13px] text-[#333B2E] placeholder-[#B0B1A6] transition-colors focus:border-[#B9C4AF] focus:outline-none focus:ring-2 focus:ring-[#96A78F]/20";

export default function CashierAccountPage() {
  const { showToast } = useToast();
  const [account, setAccount] = useState<CashierAccount | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", isActive: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/cashier")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setAccount(d.data);
          setForm({ name: d.data.name, email: d.data.email, password: "", isActive: d.data.isActive });
        }
      })
      .catch(() => showToast("فشل تحميل بيانات الكاشير", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      showToast("اكتب اسم الكاشير والبريد الإلكتروني", "error");
      return;
    }
    if (!account && form.password.length < 8) {
      showToast("حدد كلمة مرور 8 أحرف على الأقل", "error");
      return;
    }
    if (form.password && form.password.length < 8) {
      showToast("كلمة المرور 8 أحرف على الأقل", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/cashier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (d.success) {
        setAccount(d.data);
        setForm({ name: d.data.name, email: d.data.email, password: "", isActive: d.data.isActive });
        showToast(d.message ?? "تم حفظ حساب الكاشير", "success");
      } else {
        showToast(d.error?.message ?? "فشل حفظ الحساب", "error");
      }
    } catch {
      showToast("خطأ في الاتصال", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse py-12 text-center text-[13px] font-semibold text-[#9A9C90]">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[16px] font-black text-[#333B2E]">حساب الكاشير</h2>
        <p className="mt-1 text-[11px] font-medium text-[#9A9C90]">
          حساب واحد للكاشير بيدخل منه على صفحة الطلبات فقط — ويقدر يتصفح الموقع العادي براحته.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-[16px] border border-[#DCE3D6] bg-[#F1F5EC] px-4 py-3.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#50604D]" />
        <p className="text-[11.5px] leading-relaxed text-[#5E6A58]">
          الكاشير مش هيشوف غير «الطلبات»: يقدر يفتح تفاصيل الطلب ويغيّر حالته ويطبع الإيصال.
          صفحات المنتجات والإعدادات والإحصائيات مقفولة عليه، لكن الموقع نفسه متاح له عادي.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="rounded-[18px] border border-[#EDE9E0] bg-[#FBF9F6] p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-[#F0EDE5] pb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#EDF1E8] text-[#50604D]">
              <UserCog className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-[14px] font-black text-[#333B2E]">{account ? "بيانات الكاشير" : "إنشاء حساب كاشير"}</h3>
              <p className="mt-0.5 text-[11px] font-medium text-[#9A9C90]">
                {account ? "عدّل البيانات أو غيّر كلمة المرور في أي وقت" : "حساب واحد فقط للكاشير على المتجر"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="cashier-name" className="text-xs font-bold text-[#8F9186]">اسم الكاشير</label>
                <input id="cashier-name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="مثال: كاشير الفرع" className={fieldClass} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="cashier-email" className="text-xs font-bold text-[#8F9186]">البريد الإلكتروني (للدخول)</label>
                <input id="cashier-email" type="email" dir="ltr" value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="cashier@example.com" className={`${fieldClass} text-left`} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cashier-password" className="text-xs font-bold text-[#8F9186]">
                {account ? "كلمة مرور جديدة (اتركها فاضية لو مش عايز تغيّرها)" : "كلمة المرور"}
              </label>
              <div className="relative">
                <input id="cashier-password" type="password" dir="ltr" autoComplete="new-password"
                  value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="8 أحرف على الأقل" className={`${fieldClass} ps-10 text-left`} />
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A9C90]" />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-[14px] border border-[#EDE9E0] bg-[#F4F2EE] px-4 py-3">
              <span className="flex items-center gap-2 text-[12.5px] font-bold text-[#333B2E]">
                <ShieldCheck className={`h-4 w-4 ${form.isActive ? "text-[#4F8A57]" : "text-[#C25B4F]"}`} />
                حالة الحساب
              </span>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded accent-[#50604D]" />
                <span className="text-[12.5px] font-bold text-[#333B2E]">{form.isActive ? "مفعّل" : "موقوف"}</span>
              </label>
            </div>

            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 rounded-full bg-[#50604D] px-5 py-2.5 text-[12.5px] font-bold text-[#fff] transition-all hover:bg-[#435241] active:scale-[0.98] disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "جاري الحفظ..." : account ? "حفظ التعديلات" : "إنشاء الحساب"}
            </button>
          </div>
        </section>

        <aside className="space-y-3 rounded-[18px] border border-[#EDE9E0] bg-[#FBF9F6] p-4">
          <p className="flex items-center gap-2 text-[12px] font-black text-[#333B2E]">
            <LogIn className="h-4 w-4 text-[#50604D]" /> طريقة دخول الكاشير
          </p>
          <p className="text-[11px] leading-relaxed text-[#7A7F72]">
            الكاشير يفتح نفس رابط الدخول ويستخدم الإيميل وكلمة المرور اللي حددتهم هنا.
          </p>
          <div className="rounded-[10px] border border-[#E9E5DA] bg-[#F7F4EE] px-3 py-2">
            <p className="text-[10px] font-bold text-[#9A9C90]">رابط الدخول</p>
            <p className="mt-0.5 break-all text-[11px] font-bold text-[#50604D]" dir="ltr">/login</p>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/login`).then(() => showToast("تم نسخ رابط الدخول", "success")); }}
            className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[#E7E3D8] bg-[#F4F2EE] px-3 py-2 text-[11px] font-bold text-[#50604D] transition-colors hover:bg-[#EDEAE1]">
            <Copy className="h-3.5 w-3.5" /> نسخ الرابط
          </button>
          {account && (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10.5px] font-bold ${
              account.isActive
                ? "border border-[#CFE0C7] bg-[#EEF5E9] text-[#4F7A4A]"
                : "border border-[#EBD0CB] bg-[#FBEFEC] text-[#B5544A]"
            }`}>
              <ShieldCheck className="h-3.5 w-3.5" /> {account.isActive ? "الحساب مفعّل" : "الحساب موقوف"}
            </span>
          )}
        </aside>
      </div>
    </div>
  );
}
