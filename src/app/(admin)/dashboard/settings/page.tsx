"use client";

import { useState, useEffect, useMemo } from "react";
import { Store, Clock, Share2, Settings, Save } from "lucide-react";
import ImageUpload from "@/components/admin/shared/ImageUpload";
import { useToast } from "@/components/admin/shared/Toast";
import type { StoreSettings } from "@/types/admin";

// Mock data — مفعّلة مؤقتاً للتيست (رجّع تعليقها وشغّل الـ API بعد الانتهاء)
import { DEFAULT_STORE_SETTINGS } from "@/data/admin/settings";

const USE_MOCK = true;

type Tab = "basic" | "hours" | "social" | "general";
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "basic",   label: "المعلومات الأساسية", icon: Store    },
  { id: "hours",   label: "أوقات العمل",        icon: Clock    },
  { id: "social",  label: "روابط التواصل",      icon: Share2   },
  { id: "general", label: "إعدادات عامة",       icon: Settings },
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
      </div>
    </div>
  );
}
