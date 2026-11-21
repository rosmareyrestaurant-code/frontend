"use client";

import { useEffect, useState } from "react";
import {
  UserCog, UserRound, ShieldCheck, Save, Loader2, LogIn, Copy, KeyRound, Pencil, Trash2,
} from "lucide-react";
import { useToast } from "@/components/admin/shared/Toast";

interface CashierAccount {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

const fieldClass =
  "w-full rounded-[12px] border border-[#E9E5DA] bg-[#F7F4EE] px-4 py-2.5 text-[13px] text-[#333B2E] placeholder-[#B0B1A6] transition-colors focus:border-[#B9C4AF] focus:outline-none focus:ring-2 focus:ring-[#96A78F]/20";

const EMPTY_FORM = { name: "", email: "", password: "", isActive: true };

export default function CashierAccountPage() {
  const { showToast } = useToast();
  const [account, setAccount] = useState<CashierAccount | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);

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

  const showForm = !account || editing;

  const startEdit = () => {
    if (!account) return;
    setForm({ name: account.name, email: account.email, password: "", isActive: account.isActive });
    setEditing(true);
  };

  const cancelEdit = () => {
    if (account) {
      setForm({ name: account.name, email: account.email, password: "", isActive: account.isActive });
    }
    setEditing(false);
  };

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
        setEditing(false);
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

  const remove = async () => {
    if (!account || deleting) return;
    if (!window.confirm(`حذف حساب «${account.name}»؟ الكاشير مش هيقدر يدخل بعد كده.`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/cashier", { method: "DELETE" });
      const d = await res.json();
      if (d.success) {
        setAccount(null);
        setForm(EMPTY_FORM);
        setEditing(false);
        showToast(d.message ?? "تم حذف حساب الكاشير", "success");
      } else {
        showToast(d.error?.message ?? "فشل حذف الحساب", "error");
      }
    } catch {
      showToast("خطأ في الاتصال", "error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse py-12 text-center text-[13px] font-semibold text-[#9A9C90]">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-5">
      <h2 className="text-[16px] font-black text-[#333B2E]">حساب الكاشير</h2>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          {account && (
            <section className="rounded-[18px] border border-[#EDE9E0] bg-[#FBF9F6] p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-3.5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EDF1E8] text-[#50604D]">
                  <UserRound className="h-6 w-6" strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-black text-[#333B2E]">{account.name}</p>
                  <p className="mt-1 truncate text-[11px] font-semibold text-[#9A9C90]" dir="ltr">
                    {account.email}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    account.isActive
                      ? "border border-[#CFE0C7] bg-[#EEF5E9] text-[#4F7A4A]"
                      : "border border-[#EBD0CB] bg-[#FBEFEC] text-[#B5544A]"
                  }`}
                >
                  {account.isActive ? "مفعّل" : "موقوف"}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={startEdit}
                    title="تعديل بيانات الكاشير"
                    aria-label="تعديل بيانات الكاشير"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E7E3D8] bg-[#F4F2EE] text-[#50604D] transition-colors hover:bg-[#EDEAE1]"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={remove}
                    disabled={deleting}
                    title="حذف حساب الكاشير"
                    aria-label="حذف حساب الكاشير"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#EBD0CB] bg-[#FBEFEC] text-[#B5544A] transition-colors hover:bg-[#F7E3DF] disabled:opacity-60"
                  >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </section>
          )}

          {showForm && (
            <section className="rounded-[18px] border border-[#EDE9E0] bg-[#FBF9F6] p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-3 border-b border-[#F0EDE5] pb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#EDF1E8] text-[#50604D]">
                  <UserCog className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-[14px] font-black text-[#333B2E]">
                    {account ? "تعديل بيانات الكاشير" : "إنشاء حساب كاشير"}
                  </h3>
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

                <div className="flex items-center gap-2.5">
                  <button onClick={save} disabled={saving}
                    className="flex items-center gap-2 rounded-full bg-[#50604D] px-5 py-2.5 text-[12.5px] font-bold text-[#fff] transition-all hover:bg-[#435241] active:scale-[0.98] disabled:opacity-60">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "جاري الحفظ..." : account ? "حفظ التعديلات" : "إنشاء الحساب"}
                  </button>
                  {account && (
                    <button onClick={cancelEdit} disabled={saving}
                      className="rounded-full border border-[#DDD8CA] bg-white px-5 py-2.5 text-[12.5px] font-bold text-[#6B7264] transition-colors hover:bg-[#F1EEE7] disabled:opacity-50">
                      إلغاء
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

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
        </aside>
      </div>
    </div>
  );
}
