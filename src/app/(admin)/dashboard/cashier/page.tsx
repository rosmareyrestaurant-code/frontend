"use client";

import { useEffect, useState } from "react";
import {
  UserCog, UserRound, ShieldCheck, Save, Loader2, LogIn, Copy, Eye, EyeOff, Pencil, Trash2,
} from "lucide-react";
import { useToast } from "@/components/admin/shared/Toast";

interface CashierAccount {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

const fieldClass =
  "w-full rounded-[12px] border border-[var(--color-control-border)] bg-[var(--color-surface-soft)] px-4 py-2.5 text-[13px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] transition-colors focus:border-[var(--color-primary-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)]/20";

const EMPTY_FORM = { name: "", email: "", password: "", isActive: true };

export default function CashierAccountPage() {
  const { showToast } = useToast();
  const [account, setAccount] = useState<CashierAccount | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showPass, setShowPass] = useState(false);

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
    return <div className="animate-pulse py-12 text-center text-[13px] font-semibold text-[var(--color-text-muted)]">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-5">
      <h2 className="text-[16px] font-black text-[var(--color-text-primary)]">حساب الكاشير</h2>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          {account && (
            <section className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-3.5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                  <UserRound className="h-6 w-6" strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-black text-[var(--color-text-primary)]">{account.name}</p>
                  <p className="mt-1 truncate text-[11px] font-semibold text-[var(--color-text-muted)]" dir="ltr">
                    {account.email}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    account.isActive
                      ? "border border-[var(--color-primary-soft)] bg-[var(--color-primary-soft)] text-[#4F7A4A]"
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
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-primary)] transition-colors hover:bg-[var(--color-surface-hover)]"
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
            <section className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-3 border-b border-[var(--color-border-subtle)] pb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                  <UserCog className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-[14px] font-black text-[var(--color-text-primary)]">
                    {account ? "تعديل بيانات الكاشير" : "إنشاء حساب كاشير"}
                  </h3>
                  <p className="mt-0.5 text-[11px] font-medium text-[var(--color-text-muted)]">
                    {account ? "عدّل البيانات أو غيّر كلمة المرور في أي وقت" : "حساب واحد فقط للكاشير على المتجر"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="cashier-name" className="text-xs font-bold text-[var(--color-text-muted)]">اسم الكاشير</label>
                    <input id="cashier-name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="مثال: كاشير الفرع" className={fieldClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="cashier-email" className="text-xs font-bold text-[var(--color-text-muted)]">البريد الإلكتروني (للدخول)</label>
                    <input id="cashier-email" type="email" dir="ltr" value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="cashier@example.com" className={`${fieldClass} text-left`} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="cashier-password" className="text-xs font-bold text-[var(--color-text-muted)]">
                    {account ? "كلمة مرور جديدة (اتركها فاضية لو مش عايز تغيّرها)" : "كلمة المرور"}
                  </label>
                  <div className="relative">
                    <input id="cashier-password" type={showPass ? "text" : "password"} dir="ltr" autoComplete="new-password"
                      value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="8 أحرف على الأقل" className={`${fieldClass} ps-11 text-left`} />
                    <button type="button" onClick={() => setShowPass((v) => !v)}
                      aria-label={showPass ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                      className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)]">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-4 py-3">
                  <span className="flex items-center gap-2 text-[12.5px] font-bold text-[var(--color-text-primary)]">
                    <ShieldCheck className={`h-4 w-4 ${form.isActive ? "text-[#4F8A57]" : "text-[#C25B4F]"}`} />
                    حالة الحساب
                  </span>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={form.isActive}
                      onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                      className="h-4 w-4 rounded accent-[var(--color-primary)]" />
                    <span className="text-[12.5px] font-bold text-[var(--color-text-primary)]">{form.isActive ? "مفعّل" : "موقوف"}</span>
                  </label>
                </div>

                <div className="flex items-center gap-2.5">
                  <button onClick={save} disabled={saving}
                    className="flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-[12.5px] font-bold text-[var(--color-on-primary)] transition-all hover:bg-[var(--color-primary-hover)] active:scale-[0.98] disabled:opacity-60">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "جاري الحفظ..." : account ? "حفظ التعديلات" : "إنشاء الحساب"}
                  </button>
                  {account && (
                    <button onClick={cancelEdit} disabled={saving}
                      className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-5 py-2.5 text-[12.5px] font-bold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-secondary)] disabled:opacity-50">
                      إلغاء
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-3 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="flex items-center gap-2 text-[12px] font-black text-[var(--color-text-primary)]">
            <LogIn className="h-4 w-4 text-[var(--color-primary)]" /> طريقة دخول الكاشير
          </p>
          <p className="text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
            الكاشير يفتح نفس رابط الدخول ويستخدم الإيميل وكلمة المرور اللي حددتهم هنا.
          </p>
          <div className="rounded-[10px] border border-[var(--color-control-border)] bg-[var(--color-surface-soft)] px-3 py-2">
            <p className="text-[10px] font-bold text-[var(--color-text-muted)]">رابط الدخول</p>
            <p className="mt-0.5 break-all text-[11px] font-bold text-[var(--color-primary)]" dir="ltr">/login</p>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/login`).then(() => showToast("تم نسخ رابط الدخول", "success")); }}
            className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 py-2 text-[11px] font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-surface-hover)]">
            <Copy className="h-3.5 w-3.5" /> نسخ الرابط
          </button>
        </aside>
      </div>
    </div>
  );
}
