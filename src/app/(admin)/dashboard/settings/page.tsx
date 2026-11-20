"use client";

import { useState, useEffect, useMemo } from "react";
import { Store, Clock, Share2, Settings, Save, ShieldCheck, KeyRound } from "lucide-react";
import ImageUpload from "@/components/admin/shared/ImageUpload";
import { useToast } from "@/components/admin/shared/Toast";
import type { StoreSettings } from "@/types/admin";

// Mock data — مفعّلة مؤقتاً للتيست (رجّع تعليقها وشغّل الـ API بعد الانتهاء)
import { DEFAULT_STORE_SETTINGS } from "@/data/admin/settings";

const USE_MOCK = false; // الموك معطّل — الواجهة متصلة بالـ API

type Tab = "basic" | "hours" | "social" | "general" | "account";
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "basic",   label: "المعلومات الأساسية", icon: Store    },
  { id: "hours",   label: "أوقات العمل",        icon: Clock    },
  { id: "social",  label: "روابط التواصل",      icon: Share2   },
  { id: "general", label: "إعدادات عامة",       icon: Settings },
  { id: "account", label: "حساب الأدمن",        icon: ShieldCheck },
];

const DEFAULTS: StoreSettings = {
  storeName: "Rosemary", storeDescription: "", phone: "", email: "", address: "",
  logoUrl: "/images/logo-rosemary-green.png", currency: "EGP", deliveryFee: 0, minimumOrder: 0,
  estimatedDeliveryTime: "30-45", isStoreOpen: true, closedMessage: "",
  vodafoneCashNumber: "", instapayAccount: "",
  latitude: 0, longitude: 0, googleMapsUrl: "",
  workingHours: ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"].map(day => ({ day, isOpen: true, openTime: "10:00", closeTime: "00:00" })),
  socialLinks: { facebook: "", instagram: "", tiktok: "", whatsapp: "" },
  galleryImages: [],
};

function InputField({ label, value, onChange, type = "text", placeholder = "" }: { label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-[#8F9186]">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-[12px] border border-[#E9E5DA] bg-[#F7F4EE] px-4 py-2.5 text-[13px] text-[#333B2E] placeholder-[#B0B1A6] transition-colors focus:border-[#B9C4AF] focus:outline-none focus:ring-2 focus:ring-[#96A78F]/20" />
    </div>
  );
}

export default function SettingsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("basic");
  const [settings, setSettings] = useState<StoreSettings>(USE_MOCK ? DEFAULT_STORE_SETTINGS : DEFAULTS);
  const [savedSettings, setSavedSettings] = useState<StoreSettings>(USE_MOCK ? DEFAULT_STORE_SETTINGS : DEFAULTS);
  const [loading, setLoading] = useState(!USE_MOCK);
  const [saving, setSaving] = useState(false);

  const [adminEmail, setAdminEmail] = useState("");
  const [emailForm, setEmailForm] = useState({ newEmail: "", currentPassword: "" });
  const [savingEmail, setSavingEmail] = useState(false);
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [savingPass, setSavingPass] = useState(false);

  useEffect(() => {
    fetch("/api/admin/auth/me").then(r => r.json()).then(d => {
      if (d.success) setAdminEmail(d.data.email);
    }).catch(() => {});
  }, []);

  const changeEmail = async () => {
    if (!emailForm.newEmail.trim() || !emailForm.currentPassword) {
      showToast("اكتب البريد الجديد وكلمة المرور الحالية", "error");
      return;
    }
    setSavingEmail(true);
    try {
      const res = await fetch("/api/admin/auth/email", { method: "PATCH",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(emailForm) });
      const d = await res.json();
      if (d.success) {
        setAdminEmail(d.data.email);
        setEmailForm({ newEmail: "", currentPassword: "" });
        showToast("تم تحديث البريد الإلكتروني — استخدمه في تسجيل الدخول القادم", "success");
      } else showToast(d.error?.message ?? "فشل تحديث البريد", "error");
    } catch { showToast("خطأ في الاتصال", "error"); }
    finally { setSavingEmail(false); }
  };

  const changePassword = async () => {
    if (!passForm.currentPassword || !passForm.newPassword) {
      showToast("اكتب كلمة المرور الحالية والجديدة", "error");
      return;
    }
    if (passForm.newPassword.length < 8) { showToast("كلمة المرور الجديدة 8 أحرف على الأقل", "error"); return; }
    if (passForm.newPassword !== passForm.confirm) { showToast("تأكيد كلمة المرور غير مطابق", "error"); return; }
    setSavingPass(true);
    try {
      const res = await fetch("/api/admin/auth/password", { method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword }) });
      const d = await res.json();
      if (d.success) {
        setPassForm({ currentPassword: "", newPassword: "", confirm: "" });
        showToast("تم تغيير كلمة المرور بنجاح", "success");
      } else showToast(d.error?.message ?? "فشل تغيير كلمة المرور", "error");
    } catch { showToast("خطأ في الاتصال", "error"); }
    finally { setSavingPass(false); }
  };

  useEffect(() => {
    if (USE_MOCK) return;
    fetch("/api/admin/settings").then(r => r.json()).then(d => {
      if (d.success) { setSettings(d.data); setSavedSettings(d.data); }
      else showToast("فشل تحميل الإعدادات", "error");
    }).catch(() => showToast("خطأ في الاتصال", "error"))
    .finally(() => setLoading(false));
  }, [showToast]);

  const dirty = useMemo(() => JSON.stringify(settings) !== JSON.stringify(savedSettings), [settings, savedSettings]);

  const update = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }));
  const updateSocial = (key: keyof StoreSettings["socialLinks"], value: string) =>
    setSettings(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, [key]: value } }));
  const updateHour = (idx: number, field: string, value: string | boolean) =>
    setSettings(prev => ({ ...prev, workingHours: prev.workingHours.map((h, i) => i === idx ? { ...h, [field]: value } : h) }));

  const handleSave = async () => {
    if (!dirty) return;
    if (USE_MOCK) {
      setSavedSettings(settings);
      showToast("تم حفظ الإعدادات بنجاح", "success");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", { method: "PATCH",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      const d = await res.json();
      if (d.success) { setSavedSettings(settings); showToast("تم حفظ الإعدادات بنجاح", "success"); }
      else showToast(d.error?.message ?? "فشل الحفظ", "error");
    } catch { showToast("خطأ في الاتصال", "error"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="animate-pulse py-12 text-center text-[13px] font-semibold text-[#9A9C90]">جاري التحميل...</div>;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving || !dirty}
          className={`flex items-center gap-2 rounded-full px-6 py-3 text-[13px] font-bold text-[#fff] transition-all active:scale-[0.98] ${
            dirty && !saving
              ? "bg-[#50604D] hover:bg-[#435241]"
              : "cursor-not-allowed bg-[#50604D]/45"
          } disabled:active:scale-100`}>
          <Save className="h-4 w-4" />{saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </button>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-[12px] font-bold transition-all ${
              activeTab === id ? "bg-[#50604D] text-[#fff]" : "border border-[#E7E3D8] bg-[#FBF9F6] text-[#6B7264] hover:border-[#C9D3C3] hover:text-[#333B2E]"
            }`}>
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>
      <div className="rounded-[18px] border border-[#EDE9E0] bg-[#FBF9F6] p-5 sm:p-6">
        {activeTab === "basic" && (
          <div className="max-w-2xl space-y-4">
            <h2 className="mb-4 text-[14px] font-black text-[#333B2E]">المعلومات الأساسية</h2>
            <InputField label="اسم المتجر" value={settings.storeName} onChange={v => update("storeName", v)} />
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#8F9186]">وصف المتجر</label>
              <textarea rows={3} value={settings.storeDescription} onChange={e => update("storeDescription", e.target.value)}
                className="w-full resize-none rounded-[12px] border border-[#E9E5DA] bg-[#F7F4EE] px-4 py-2.5 text-[13px] text-[#333B2E] focus:border-[#B9C4AF] focus:outline-none focus:ring-2 focus:ring-[#96A78F]/20" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="رقم الهاتف" value={settings.phone} onChange={v => update("phone", v)} type="tel" />
              <InputField label="البريد الإلكتروني" value={settings.email} onChange={v => update("email", v)} type="email" />
            </div>
            <InputField label="العنوان" value={settings.address} onChange={v => update("address", v)} />
            <div className="max-w-[280px]">
              <ImageUpload value={settings.logoUrl}
                onChange={url => update("logoUrl", url)}
                onPublicIdChange={pid => setSettings(prev => ({ ...prev, logoPublicId: pid } as typeof prev))}
                label="شعار المتجر" folder="rozmaly/branding" />
            </div>
          </div>
        )}
        {activeTab === "hours" && (
          <div className="max-w-xl space-y-4">
            <h2 className="mb-4 text-[14px] font-black text-[#333B2E]">أوقات العمل</h2>
            <div className="space-y-2">
              {settings.workingHours.map((day, idx) => (
                <div key={day.day} className="flex items-center gap-3 rounded-[14px] border border-[#EDE9E0] bg-[#F4F2EE] px-4 py-3">
                  <label className="flex w-28 shrink-0 cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={day.isOpen} onChange={e => updateHour(idx, "isOpen", e.target.checked)} className="h-4 w-4 rounded accent-[#50604D]" />
                    <span className="text-[12.5px] font-bold text-[#333B2E]">{day.day}</span>
                  </label>
                  {day.isOpen ? (
                    <div className="flex flex-1 items-center gap-2">
                      <input type="time" value={day.openTime} onChange={e => updateHour(idx, "openTime", e.target.value)}
                        className="rounded-[8px] border border-[#E9E5DA] bg-[#FBF9F6] px-3 py-1.5 text-xs text-[#333B2E] focus:border-[#B9C4AF] focus:outline-none" />
                      <span className="text-xs text-[#9A9C90]">—</span>
                      <input type="time" value={day.closeTime} onChange={e => updateHour(idx, "closeTime", e.target.value)}
                        className="rounded-[8px] border border-[#E9E5DA] bg-[#FBF9F6] px-3 py-1.5 text-xs text-[#333B2E] focus:border-[#B9C4AF] focus:outline-none" />
                    </div>
                  ) : <span className="flex-1 text-xs font-medium text-[#9A9C90]">مغلق</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === "social" && (
          <div className="max-w-xl space-y-4">
            <h2 className="mb-4 text-[14px] font-black text-[#333B2E]">روابط التواصل الاجتماعي</h2>
            {(["facebook","instagram","tiktok","whatsapp"] as (keyof StoreSettings["socialLinks"])[]).map(key => (
              <InputField key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} value={settings.socialLinks[key]}
                onChange={v => updateSocial(key, v)} type="url" placeholder={`https://...`} />
            ))}
          </div>
        )}
        {activeTab === "general" && (
          <div className="max-w-xl space-y-5">
            <h2 className="mb-4 text-[14px] font-black text-[#333B2E]">الإعدادات العامة</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8F9186]">رسوم التوصيل (ج.م)</label>
                <input type="number" min={0} value={settings.deliveryFee} onChange={e => update("deliveryFee", Number(e.target.value))}
                  className="w-full rounded-[12px] border border-[#E9E5DA] bg-[#F7F4EE] px-4 py-2.5 text-[13px] text-[#333B2E] focus:border-[#B9C4AF] focus:outline-none focus:ring-2 focus:ring-[#96A78F]/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8F9186]">الحد الأدنى للطلب (ج.م)</label>
                <input type="number" min={0} value={settings.minimumOrder} onChange={e => update("minimumOrder", Number(e.target.value))}
                  className="w-full rounded-[12px] border border-[#E9E5DA] bg-[#F7F4EE] px-4 py-2.5 text-[13px] text-[#333B2E] focus:border-[#B9C4AF] focus:outline-none focus:ring-2 focus:ring-[#96A78F]/20" />
              </div>
            </div>
            <InputField label="وقت التوصيل التقديري (دقائق)" value={settings.estimatedDeliveryTime ?? ""} onChange={v => update("estimatedDeliveryTime", v)} placeholder="30-45" />
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="رقم استلام فودافون كاش" value={settings.vodafoneCashNumber ?? ""} onChange={v => update("vodafoneCashNumber", v)} type="tel" placeholder="0100xxxxxxx" />
              <InputField label="حساب استلام إنستاباي" value={settings.instapayAccount ?? ""} onChange={v => update("instapayAccount", v)} placeholder="رقم محفظة أو IPA" />
            </div>
            <div className="flex items-center justify-between rounded-[14px] border border-[#EDE9E0] bg-[#F4F2EE] px-4 py-3">
              <span className="text-[12.5px] font-semibold text-[#6B7264]">حالة المتجر</span>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={settings.isStoreOpen} onChange={e => update("isStoreOpen", e.target.checked)} className="h-4 w-4 rounded accent-[#50604D]" />
                <span className="text-[12.5px] font-bold text-[#333B2E]">{settings.isStoreOpen ? "مفتوح" : "مغلق"}</span>
              </label>
            </div>
          </div>
        )}
        {activeTab === "account" && (
          <div className="max-w-xl space-y-5">
            <div>
              <h2 className="text-[14px] font-black text-[#333B2E]">حساب الأدمن</h2>
              <p className="mt-1 text-[11.5px] font-medium text-[#9A9C90]">
                بيانات تسجيل الدخول محفوظة في قاعدة البيانات وليست في ملف الإعدادات — أي تغيير هنا يسري فوراً على الدخول القادم.
              </p>
            </div>

            <div className="rounded-[14px] border border-[#EDE9E0] bg-[#F4F2EE] p-4 space-y-3">
              <p className="text-[12.5px] font-black text-[#333B2E]">البريد الإلكتروني الحالي</p>
              <p className="rounded-[10px] border border-[#E9E5DA] bg-[#FBF9F6] px-3 py-2 text-[12.5px] font-semibold text-[#50604D]" dir="ltr">
                {adminEmail || "..."}
              </p>
              <InputField label="البريد الإلكتروني الجديد" value={emailForm.newEmail} onChange={v => setEmailForm(p => ({ ...p, newEmail: v }))} type="email" placeholder="new-admin@example.com" />
              <InputField label="كلمة المرور الحالية (للتأكيد)" value={emailForm.currentPassword} onChange={v => setEmailForm(p => ({ ...p, currentPassword: v }))} type="password" />
              <button onClick={changeEmail} disabled={savingEmail}
                className="flex items-center gap-2 rounded-full bg-[#50604D] px-5 py-2.5 text-[12px] font-bold text-[#fff] transition-colors hover:bg-[#435241] disabled:opacity-50 active:scale-[0.98]">
                <ShieldCheck className="h-3.5 w-3.5" />{savingEmail ? "جاري التحديث..." : "تحديث البريد الإلكتروني"}
              </button>
            </div>

            <div className="rounded-[14px] border border-[#EDE9E0] bg-[#F4F2EE] p-4 space-y-3">
              <p className="text-[12.5px] font-black text-[#333B2E]">تغيير كلمة المرور</p>
              <InputField label="كلمة المرور الحالية" value={passForm.currentPassword} onChange={v => setPassForm(p => ({ ...p, currentPassword: v }))} type="password" />
              <InputField label="كلمة المرور الجديدة (8 أحرف على الأقل)" value={passForm.newPassword} onChange={v => setPassForm(p => ({ ...p, newPassword: v }))} type="password" />
              <InputField label="تأكيد كلمة المرور الجديدة" value={passForm.confirm} onChange={v => setPassForm(p => ({ ...p, confirm: v }))} type="password" />
              <button onClick={changePassword} disabled={savingPass}
                className="flex items-center gap-2 rounded-full bg-[#50604D] px-5 py-2.5 text-[12px] font-bold text-[#fff] transition-colors hover:bg-[#435241] disabled:opacity-50 active:scale-[0.98]">
                <KeyRound className="h-3.5 w-3.5" />{savingPass ? "جاري الحفظ..." : "تغيير كلمة المرور"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
