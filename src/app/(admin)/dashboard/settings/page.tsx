"use client";

import { useState } from "react";
import { Store, Clock, Share2, Settings, Save } from "lucide-react";
import ImageUpload from "@/components/admin/shared/ImageUpload";
import { useToast } from "@/components/admin/shared/Toast";
import { DEFAULT_STORE_SETTINGS } from "@/data/admin/settings";
import { StoreSettings } from "@/types/admin";

type Tab = "basic" | "hours" | "social" | "general";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "basic",   label: "المعلومات الأساسية", icon: Store    },
  { id: "hours",   label: "أوقات العمل",        icon: Clock    },
  { id: "social",  label: "روابط التواصل",      icon: Share2   },
  { id: "general", label: "إعدادات عامة",       icon: Settings },
];

function InputField({ label, value, onChange, type = "text", placeholder = "" }: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-[#a89f94]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-[#1a1512] border border-[#2a231d] px-4 py-2.5 text-sm text-white placeholder-[#5a4f45] focus:border-[#ff7a00] focus:outline-none transition-colors"
      />
    </div>
  );
}

export default function SettingsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("basic");
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  const update = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const updateSocial = (key: keyof StoreSettings["socialLinks"], value: string) =>
    setSettings((prev) => ({ ...prev, socialLinks: { ...prev.socialLinks, [key]: value } }));

  const updateHour = (idx: number, field: string, value: string | boolean) =>
    setSettings((prev) => ({
      ...prev,
      workingHours: prev.workingHours.map((h, i) => i === idx ? { ...h, [field]: value } : h),
    }));

  const handleSave = () => showToast("تم حفظ الإعدادات بنجاح", "success");

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              activeTab === id
                ? "bg-[#ff7a00] text-white"
                : "bg-[#141210] border border-[#2a241f] text-[#8a8076] hover:text-white hover:border-[#ff7a00]/30"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-[#141210] border border-[#26201a] p-5 sm:p-6">
        {/* ─── المعلومات الأساسية ─── */}
        {activeTab === "basic" && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-sm font-black text-white mb-4">المعلومات الأساسية للمتجر</h2>
            <InputField label="اسم المتجر" value={settings.storeName} onChange={(v) => update("storeName", v)} />
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#a89f94]">وصف المتجر</label>
              <textarea
                rows={3}
                value={settings.storeDescription}
                onChange={(e) => update("storeDescription", e.target.value)}
                className="w-full rounded-xl bg-[#1a1512] border border-[#2a231d] px-4 py-2.5 text-sm text-white focus:border-[#ff7a00] focus:outline-none resize-none transition-colors"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="رقم الهاتف" value={settings.phone} onChange={(v) => update("phone", v)} type="tel" />
              <InputField label="البريد الإلكتروني" value={settings.email} onChange={(v) => update("email", v)} type="email" />
            </div>
            <InputField label="العنوان الكامل" value={settings.address} onChange={(v) => update("address", v)} />
            <div className="max-w-[280px]">
              <ImageUpload
                value={settings.logoUrl}
                onChange={(logoUrl) => update("logoUrl", logoUrl)}
                label="شعار المتجر"
                hint="ارفع ملف الشعار من جهازك — يظهر كملف مرفوع مش رابط"
              />
            </div>
          </div>
        )}

        {/* ─── أوقات العمل ─── */}
        {activeTab === "hours" && (
          <div className="space-y-4 max-w-xl">
            <h2 className="text-sm font-black text-white mb-4">أوقات العمل الأسبوعية</h2>
            <div className="space-y-2">
              {settings.workingHours.map((day, idx) => (
                <div key={day.day} className="flex items-center gap-3 rounded-xl bg-[#1a1512] border border-[#2a231d] px-4 py-3">
                  <label className="flex items-center gap-2 cursor-pointer w-28 shrink-0">
                    <input
                      type="checkbox"
                      checked={day.isOpen}
                      onChange={(e) => updateHour(idx, "isOpen", e.target.checked)}
                      className="h-4 w-4 rounded accent-[#ff7a00]"
                    />
                    <span className="text-sm font-semibold text-white">{day.day}</span>
                  </label>
                  {day.isOpen ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={day.openTime}
                        onChange={(e) => updateHour(idx, "openTime", e.target.value)}
                        className="rounded-lg bg-[#141210] border border-[#2a231d] px-3 py-1.5 text-xs text-white focus:border-[#ff7a00] focus:outline-none"
                      />
                      <span className="text-xs text-[#5a4f45]">—</span>
                      <input
                        type="time"
                        value={day.closeTime}
                        onChange={(e) => updateHour(idx, "closeTime", e.target.value)}
                        className="rounded-lg bg-[#141210] border border-[#2a231d] px-3 py-1.5 text-xs text-white focus:border-[#ff7a00] focus:outline-none"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-[#5a4f45] flex-1">مغلق</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── روابط التواصل ─── */}
        {activeTab === "social" && (
          <div className="space-y-4 max-w-xl">
            <h2 className="text-sm font-black text-white mb-4">روابط التواصل الاجتماعي</h2>
            {(
              [
                { key: "facebook",  label: "Facebook",  placeholder: "https://facebook.com/..." },
                { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
                { key: "tiktok",    label: "TikTok",    placeholder: "https://tiktok.com/@..." },
                { key: "whatsapp",  label: "WhatsApp",  placeholder: "https://wa.me/201..." },
              ] as { key: keyof StoreSettings["socialLinks"]; label: string; placeholder: string }[]
            ).map(({ key, label, placeholder }) => (
              <InputField
                key={key}
                label={label}
                value={settings.socialLinks[key]}
                onChange={(v) => updateSocial(key, v)}
                type="url"
                placeholder={placeholder}
              />
            ))}
          </div>
        )}

        {/* ─── إعدادات عامة ─── */}
        {activeTab === "general" && (
          <div className="space-y-5 max-w-xl">
            <h2 className="text-sm font-black text-white mb-4">الإعدادات العامة</h2>
            <div className="rounded-xl bg-[#1a1512] border border-[#2a231d] px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-[#a89f94]">العملة</span>
              <span className="text-sm font-black text-white">{settings.currency} — جنيه مصري</span>
            </div>
          </div>
        )}
      </div>

      {/* زر الحفظ */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-xl bg-[#ff7a00] hover:bg-[#e66e00] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#ff7a00]/20 transition-all hover:scale-105 active:scale-95"
        >
          <Save className="h-4 w-4" />
          حفظ الإعدادات
        </button>
      </div>
    </div>
  );
}
