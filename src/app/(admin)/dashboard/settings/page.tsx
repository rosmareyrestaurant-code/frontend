"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Store, Clock, Share2, Settings, Save, ShieldCheck, KeyRound, Mail,
  Eye, EyeOff, HelpCircle, AlertCircle, Truck, CreditCard, Power, ChevronDown,
  Megaphone,
} from "lucide-react";
import ImageUpload from "@/components/admin/shared/ImageUpload";
import { useToast } from "@/components/admin/shared/Toast";
import RecoveryPinModal from "@/components/admin/settings/RecoveryPinModal";
import { TICKER_ICON_OPTIONS, findTickerIcon, resolveTickerIcon } from "@/lib/ticker";
import type { StoreSettings } from "@/types/admin";

// Mock data — مفعّلة مؤقتاً للتيست (رجّع تعليقها وشغّل الـ API بعد الانتهاء)
import { DEFAULT_STORE_SETTINGS } from "@/data/admin/settings";

const USE_MOCK = false; // الموك معطّل — الواجهة متصلة بالـ API

type Tab = "basic" | "ticker" | "hours" | "social" | "general" | "account";
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "basic",   label: "المعلومات الأساسية", icon: Store    },
  { id: "ticker",  label: "الشريط العلوي",      icon: Megaphone },
  { id: "hours",   label: "أوقات العمل",        icon: Clock    },
  { id: "social",  label: "روابط التواصل",      icon: Share2   },
  { id: "general", label: "إعدادات عامة",       icon: Settings },
  { id: "account", label: "حساب الأدمن",        icon: ShieldCheck },
];

const DEFAULTS: StoreSettings = {
  storeName: "Rosemary", storeDescription: "", phone: "", email: "", address: "",
  logoUrl: "/images/logo-rosemary-green.png", tickerMessage: "", tickerIcon: "truck",
  currency: "EGP", deliveryFee: 0, minimumOrder: 0,
  estimatedDeliveryTime: "30-45", isStoreOpen: true, closedMessage: "",
  vodafoneCashNumber: "", instapayAccount: "",
  latitude: 0, longitude: 0, googleMapsUrl: "",
  workingHours: ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"].map(day => ({ day, isOpen: true, openTime: "10:00", closeTime: "00:00" })),
  socialLinks: { facebook: "", instagram: "", tiktok: "", whatsapp: "" },
  galleryImages: [],
};

const fieldClass =
  "w-full rounded-[12px] border border-[var(--color-control-border)] bg-[var(--color-surface-soft)] px-4 py-2.5 text-[13px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] transition-colors focus:border-[var(--color-primary-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)]/20";

function InputField({ label, value, onChange, type = "text", placeholder = "", id }: { label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string; id?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-bold text-[var(--color-text-muted)]">{label}</label>
      <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={fieldClass} />
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder = "••••••••", autoComplete = "new-password", id }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; autoComplete?: string; id?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-bold text-[var(--color-text-muted)]">{label}</label>
      <div className="relative">
        <input id={id} type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} dir="ltr" autoComplete={autoComplete}
          className={`${fieldClass} ps-11 pe-11 text-left`} />
        <button type="button" onClick={() => setShow(s => !s)}
          aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          className="absolute inset-y-0 end-2 my-auto flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)]">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="mb-5 flex items-start gap-3 border-b border-[var(--color-border-subtle)] pb-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <h3 className="text-[14px] font-black text-[var(--color-text-primary)]">{title}</h3>
      </div>
    </div>
  );
}

function TickerPreview({ message, icon }: { message: string; icon: string }) {
  const { Icon, text } = resolveTickerIcon(icon);
  const shown = message.trim();
  return (
    <div dir="ltr" className="relative overflow-hidden rounded-[12px] border border-[var(--color-text-secondary)] bg-[var(--color-icon)] shadow-[0_8px_20px_-14px_rgba(82,107,88,0.9)]">
      <div dir="rtl" className="flex items-center gap-3 px-4 py-2.5">
        {Icon ? (
          <Icon className="h-4 w-4 shrink-0 text-[var(--color-on-primary)]" />
        ) : text ? (
          <span className="shrink-0 text-sm leading-none" aria-hidden="true">{text}</span>
        ) : null}
        <span className={`truncate text-[11px] font-bold sm:text-xs ${shown ? "text-[var(--color-on-primary)]" : "text-[var(--color-on-primary)]/75"}`}>
          {shown}
        </span>
      </div>
    </div>
  );
}

function CardTitle({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <p className="flex items-center gap-2 text-[12.5px] font-black text-[var(--color-text-primary)]">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
        <Icon className="h-3.5 w-3.5" />
      </span>
      {text}
    </p>
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
  const [recForm, setRecForm] = useState({ newPassword: "", confirm: "" });
  const [pinOpen, setPinOpen] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);

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

  const openRecovery = () => {
    if (!recForm.newPassword || !recForm.confirm) {
      showToast("اكتب كلمة المرور الجديدة وأكدها", "error");
      return;
    }
    if (recForm.newPassword.length < 8) { showToast("كلمة المرور الجديدة 8 أحرف على الأقل", "error"); return; }
    if (recForm.newPassword !== recForm.confirm) { showToast("تأكيد كلمة المرور غير مطابق", "error"); return; }
    setPinOpen(true);
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
      if (d.success) {
        setSavedSettings(settings);
        try { localStorage.setItem("rozmaly:settings-saved", String(Date.now())); } catch {}
        showToast("تم حفظ الإعدادات بنجاح", "success");
      }
      else showToast(d.error?.message ?? "فشل الحفظ", "error");
    } catch { showToast("خطأ في الاتصال", "error"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="animate-pulse py-12 text-center text-[13px] font-semibold text-[var(--color-text-muted)]">جاري التحميل...</div>;

  const tickerIcon = settings.tickerIcon ?? "truck";
  const customTickerIcon = !findTickerIcon(tickerIcon);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[16px] font-black text-[var(--color-text-primary)]">إعدادات المتجر</h2>
        </div>
        <div className="flex items-center gap-2.5">
          {dirty && (
            <span className="flex items-center gap-1.5 rounded-full border border-[#EBD9A9] bg-[#FBF3DF] px-3 py-1.5 text-[10.5px] font-bold text-[#8A6D1F]">
              <AlertCircle className="h-3.5 w-3.5" />
              تغييرات غير محفوظة
            </span>
          )}
          <button onClick={handleSave} disabled={saving || !dirty}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-[12.5px] font-bold text-[var(--color-on-primary)] transition-all active:scale-[0.98] ${
              dirty && !saving ? "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]" : "cursor-not-allowed bg-[var(--color-primary)]/45"
            } disabled:active:scale-100`}>
            <Save className="h-4 w-4" />{saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[224px_minmax(0,1fr)]">
        <nav className="min-w-0 lg:sticky lg:top-[88px]">
          <div className="flex w-full gap-1.5 overflow-x-auto pb-1 scrollbar-none lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-[16px] lg:border lg:border-[var(--color-border)] lg:bg-[var(--color-surface)] lg:p-2">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`group flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[12px] font-bold transition-all lg:w-full lg:justify-start lg:rounded-[12px] lg:px-2.5 lg:py-2.5 ${
                    active
                      ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                      : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary-border)] hover:text-[var(--color-text-primary)] lg:border-transparent lg:bg-transparent"
                  }`}>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                    active ? "bg-white/15 text-[var(--color-on-primary)]" : "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
                  }`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <section className="min-w-0 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
          {activeTab === "basic" && (
            <div>
              <SectionHeader icon={Store} title="المعلومات الأساسية" />
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_240px]">
                <div className="space-y-4">
                  <InputField label="اسم المتجر" value={settings.storeName} onChange={v => update("storeName", v)} />
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-text-muted)]">وصف المتجر</label>
                    <textarea rows={3} value={settings.storeDescription} onChange={e => update("storeDescription", e.target.value)}
                      className={`${fieldClass} resize-none`} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InputField label="رقم الهاتف" value={settings.phone} onChange={v => update("phone", v)} type="tel" />
                    <InputField label="البريد الإلكتروني" value={settings.email} onChange={v => update("email", v)} type="email" />
                  </div>
                  <InputField label="العنوان" value={settings.address} onChange={v => update("address", v)} />
                </div>
                <div className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-4">
                  <ImageUpload value={settings.logoUrl}
                    onChange={url => update("logoUrl", url)}
                    onPublicIdChange={pid => setSettings(prev => ({ ...prev, logoPublicId: pid } as typeof prev))}
                    label="شعار المتجر" hint="المقاس المفضل: 512×512 بيكسل (مربع) — JPG / PNG / WebP، أقل من 8 ميجا" folder="rozmaly/branding" previewClassName="aspect-square" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "ticker" && (
            <div>
              <SectionHeader icon={Megaphone} title="الشريط العلوي" />
              <div className="max-w-2xl space-y-5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="ticker-message" className="text-xs font-bold text-[var(--color-text-muted)]">جملة الشريط</label>
                    <span className="text-[10px] font-bold text-[var(--color-text-muted)]">{(settings.tickerMessage ?? "").length}/160</span>
                  </div>
                  <input id="ticker-message" type="text" maxLength={160} value={settings.tickerMessage ?? ""}
                    onChange={e => update("tickerMessage", e.target.value)}
                    placeholder="مثال: خصم 20% على كل العروض النهاردة 🎉"
                    className={fieldClass} />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-[var(--color-text-muted)]">الأيقونة</p>
                  <div className="flex flex-wrap gap-2">
                    {TICKER_ICON_OPTIONS.map(({ key, label, Icon }) => {
                      const active = !customTickerIcon && tickerIcon === key;
                      return (
                        <button key={key} type="button" title={label} aria-pressed={active}
                          onClick={() => update("tickerIcon", key)}
                          className={`flex h-10 w-10 items-center justify-center rounded-[12px] border transition-all ${
                            active
                              ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[0_6px_14px_-8px_rgba(80,96,77,0.9)]"
                              : "border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary-border)] hover:text-[var(--color-text-primary)]"
                          }`}>
                          <Icon className="h-4 w-4" />
                          <span className="sr-only">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <label htmlFor="ticker-icon-custom" className="text-[11px] font-bold text-[var(--color-text-muted)]">أو اكتب إيموجي / حرف:</label>
                    <input id="ticker-icon-custom" type="text" maxLength={12} dir="ltr" value={customTickerIcon ? tickerIcon : ""}
                      onChange={e => update("tickerIcon", e.target.value.trim() ? e.target.value : "truck")}
                      placeholder="🚚"
                      className="w-24 rounded-[10px] border border-[var(--color-control-border)] bg-[var(--color-surface-soft)] px-3 py-2 text-center text-base text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)]/20" />
                    {customTickerIcon && (
                      <span className="rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--color-primary)]">
                        أيقونة مخصصة
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 border-t border-[var(--color-border-subtle)] pt-4">
                  <p className="text-[11.5px] font-black text-[var(--color-text-secondary)]">معاينة حية للشريط</p>
                  <TickerPreview message={settings.tickerMessage ?? ""} icon={tickerIcon} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "hours" && (
            <div>
              <SectionHeader icon={Clock} title="أوقات العمل" />
              <div className="space-y-2">
                {settings.workingHours.map((day, idx) => (
                  <div key={day.day} className="flex flex-wrap items-center gap-3 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-4 py-3">
                    <label className="flex w-28 shrink-0 cursor-pointer items-center gap-2">
                      <input type="checkbox" checked={day.isOpen} onChange={e => updateHour(idx, "isOpen", e.target.checked)} className="h-4 w-4 rounded accent-[var(--color-primary)]" />
                      <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--color-text-primary)]">
                        <span className={`h-1.5 w-1.5 rounded-full ${day.isOpen ? "bg-[#7FA47A]" : "bg-[var(--color-text-muted)]"}`} />
                        {day.day}
                      </span>
                    </label>
                    {day.isOpen ? (
                      <div className="flex flex-1 items-center gap-2">
                        <input type="time" value={day.openTime} onChange={e => updateHour(idx, "openTime", e.target.value)}
                          className="rounded-[8px] border border-[var(--color-control-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-primary-border)] focus:outline-none" />
                        <span className="text-xs text-[var(--color-text-muted)]">—</span>
                        <input type="time" value={day.closeTime} onChange={e => updateHour(idx, "closeTime", e.target.value)}
                          className="rounded-[8px] border border-[var(--color-control-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-primary-border)] focus:outline-none" />
                      </div>
                    ) : (
                      <span className="flex-1 text-xs font-medium text-[var(--color-text-muted)]">مغلق</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "social" && (
            <div>
              <SectionHeader icon={Share2} title="روابط التواصل الاجتماعي" />
              <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
                {(["facebook","instagram","tiktok","whatsapp"] as (keyof StoreSettings["socialLinks"])[]).map(key => (
                  <InputField key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} value={settings.socialLinks[key]}
                    onChange={v => updateSocial(key, v)} type="url" placeholder="https://..." />
                ))}
              </div>
            </div>
          )}

          {activeTab === "general" && (
            <div>
              <SectionHeader icon={Settings} title="الإعدادات العامة" />
              <div className="space-y-5">
                <div>
                  <p className="mb-3 flex items-center gap-1.5 text-[11.5px] font-black text-[var(--color-text-secondary)]">
                    <Truck className="h-3.5 w-3.5 text-[var(--color-primary)]" />التوصيل والطلبات
                  </p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <InputField label="رسوم التوصيل (ج.م)" value={settings.deliveryFee ?? 0} onChange={v => update("deliveryFee", Number(v))} type="number" />
                    <InputField label="الحد الأدنى للطلب (ج.م)" value={settings.minimumOrder ?? 0} onChange={v => update("minimumOrder", Number(v))} type="number" />
                    <InputField label="وقت التوصيل التقديري (دقائق)" value={settings.estimatedDeliveryTime ?? ""} onChange={v => update("estimatedDeliveryTime", v)} placeholder="30-45" />
                  </div>
                </div>

                <div className="border-t border-[var(--color-border-subtle)] pt-4">
                  <p className="mb-3 flex items-center gap-1.5 text-[11.5px] font-black text-[var(--color-text-secondary)]">
                    <CreditCard className="h-3.5 w-3.5 text-[var(--color-primary)]" />بيانات استلام الدفع
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InputField label="رقم استلام فودافون كاش" value={settings.vodafoneCashNumber ?? ""} onChange={v => update("vodafoneCashNumber", v)} type="tel" placeholder="0100xxxxxxx" />
                    <InputField label="حساب استلام إنستاباي" value={settings.instapayAccount ?? ""} onChange={v => update("instapayAccount", v)} placeholder="رقم محفظة أو IPA" />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-4 py-3">
                  <span className="flex items-center gap-2 text-[12.5px] font-bold text-[var(--color-text-primary)]">
                    <Power className={`h-4 w-4 ${settings.isStoreOpen ? "text-[#4F8A57]" : "text-[#C25B4F]"}`} />
                    حالة المتجر
                  </span>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={settings.isStoreOpen} onChange={e => update("isStoreOpen", e.target.checked)} className="h-4 w-4 rounded accent-[var(--color-primary)]" />
                    <span className="text-[12.5px] font-bold text-[var(--color-text-primary)]">{settings.isStoreOpen ? "مفتوح" : "مغلق"}</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "account" && (
            <div>
              <SectionHeader icon={ShieldCheck} title="حساب الأدمن" />
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-3 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4">
                  <CardTitle icon={Mail} text="البريد الإلكتروني" />
                  <div className="rounded-[10px] border border-[var(--color-control-border)] bg-[var(--color-surface)] px-3 py-2">
                    <p className="text-[10px] font-bold text-[var(--color-text-muted)]">البريد الحالي</p>
                    <p className="mt-0.5 text-[12px] font-bold text-[var(--color-primary)]" dir="ltr">{adminEmail || "..."}</p>
                  </div>
                  <InputField id="admin-new-email" label="البريد الإلكتروني الجديد" value={emailForm.newEmail} onChange={v => setEmailForm(p => ({ ...p, newEmail: v }))} type="email" placeholder="new-admin@example.com" />
                  <PasswordField id="admin-email-password" label="كلمة المرور الحالية (للتأكيد)" value={emailForm.currentPassword}
                    onChange={v => setEmailForm(p => ({ ...p, currentPassword: v }))} autoComplete="current-password" />
                  <button onClick={changeEmail} disabled={savingEmail}
                    className="flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-[12px] font-bold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50 active:scale-[0.98]">
                    <ShieldCheck className="h-3.5 w-3.5" />{savingEmail ? "جاري التحديث..." : "تحديث البريد الإلكتروني"}
                  </button>
                </div>

                <div className="space-y-3 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4">
                  <CardTitle icon={KeyRound} text="تغيير كلمة المرور" />
                  <PasswordField id="admin-current-password" label="كلمة المرور الحالية" value={passForm.currentPassword}
                    onChange={v => setPassForm(p => ({ ...p, currentPassword: v }))} autoComplete="current-password" />
                  <PasswordField id="admin-new-password" label="كلمة المرور الجديدة (8 أحرف على الأقل)" value={passForm.newPassword}
                    onChange={v => setPassForm(p => ({ ...p, newPassword: v }))} />
                  <PasswordField id="admin-confirm-password" label="تأكيد كلمة المرور الجديدة" value={passForm.confirm}
                    onChange={v => setPassForm(p => ({ ...p, confirm: v }))} />
                  <button onClick={changePassword} disabled={savingPass}
                    className="flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-[12px] font-bold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50 active:scale-[0.98]">
                    <KeyRound className="h-3.5 w-3.5" />{savingPass ? "جاري الحفظ..." : "تغيير كلمة المرور"}
                  </button>
                </div>

                <div className="space-y-3 rounded-[16px] border border-[#EBD9A9] bg-[#FBF4E3] p-4 xl:col-span-2">
                  <button type="button" onClick={() => setRecoveryOpen(o => !o)} aria-expanded={recoveryOpen}
                    className="flex w-full items-center justify-between gap-2 text-right">
                    <span className="flex items-center gap-2 text-[12.5px] font-black text-[#6E5716]">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F3E5BE] text-[#8A6D1F]">
                        <HelpCircle className="h-3.5 w-3.5" />
                      </span>
                      نسيت كلمة المرور الحالية؟
                    </span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-[#8A6D1F] transition-transform ${recoveryOpen ? "rotate-180" : ""}`} />
                  </button>
                  {recoveryOpen && (
                    <div className="space-y-3 pt-1">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <PasswordField id="admin-recover-new" label="كلمة المرور الجديدة" value={recForm.newPassword}
                          onChange={v => setRecForm(p => ({ ...p, newPassword: v }))} />
                        <PasswordField id="admin-recover-confirm" label="تأكيد كلمة المرور الجديدة" value={recForm.confirm}
                          onChange={v => setRecForm(p => ({ ...p, confirm: v }))} />
                      </div>
                      <button onClick={openRecovery}
                        className="flex items-center gap-2 rounded-full border border-[#D9C58C] bg-[#FFFDF6] px-5 py-2.5 text-[12px] font-bold text-[#6E5716] transition-colors hover:bg-[#FBF3DF] active:scale-[0.98]">
                        <KeyRound className="h-3.5 w-3.5" />متابعة — كتابة رمز الاستعادة
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <RecoveryPinModal
                open={pinOpen}
                newPassword={recForm.newPassword}
                confirmPassword={recForm.confirm}
                onClose={() => setPinOpen(false)}
                onSuccess={() => {
                  setRecForm({ newPassword: "", confirm: "" });
                  showToast("تم تحديث كلمة المرور — استخدم الجديدة في تسجيل الدخول القادم", "success");
                }}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
