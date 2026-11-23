"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Palette,
  Save,
  Undo2,
  RotateCcw,
  ChevronDown,
  Megaphone,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { ColorField } from "@/components/admin/theme/ColorField";
import { ThemePreview, type PreviewTicker } from "@/components/admin/theme/ThemePreview";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { useToast } from "@/components/admin/shared/Toast";
import { TICKER_ICON_OPTIONS, findTickerIcon } from "@/lib/ticker";
import {
  DEFAULT_THEME,
  contrastRatio,
  resolveTheme,
  themeContrastWarnings,
  type ThemeColors,
} from "@/lib/theme";

type DraftTheme = Required<ThemeColors>;

const EMPTY_TICKER: PreviewTicker = { enabled: true, message: "", icon: "truck", iconPosition: "start" };

function parseTheme(raw: Partial<ThemeColors> | undefined | null): DraftTheme {
  return {
    primary: raw?.primary || DEFAULT_THEME.primary,
    icon: raw?.icon || DEFAULT_THEME.icon,
    background: raw?.background || DEFAULT_THEME.background,
    primaryHover: raw?.primaryHover ?? "",
    primaryActive: raw?.primaryActive ?? "",
    iconHover: raw?.iconHover ?? "",
    textPrimary: raw?.textPrimary ?? "",
    surface: raw?.surface ?? "",
    surfaceSecondary: raw?.surfaceSecondary ?? "",
    surfaceElevated: raw?.surfaceElevated ?? "",
    border: raw?.border ?? "",
  };
}

export default function ThemePage() {
  const { showToast } = useToast();
  const router = useRouter();

  const [theme, setTheme] = useState<DraftTheme>({ ...DEFAULT_THEME });
  const [savedTheme, setSavedTheme] = useState<DraftTheme>({ ...DEFAULT_THEME });
  const [ticker, setTicker] = useState<PreviewTicker>(EMPTY_TICKER);
  const [savedTicker, setSavedTicker] = useState<PreviewTicker>(EMPTY_TICKER);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState<{ theme: DraftTheme; ticker: PreviewTicker } | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/settings");
        const payload = await res.json();
        if (!payload?.success) throw new Error(payload?.error?.message);
        const nextTheme = parseTheme(payload.data.theme);
        const nextTicker: PreviewTicker = {
          enabled: payload.data.tickerEnabled !== false,
          message: payload.data.tickerMessage ?? "",
          icon: payload.data.tickerIcon || "truck",
          iconPosition: payload.data.tickerIconPosition === "end" ? "end" : "start",
        };
        if (cancelled) return;
        setTheme(nextTheme);
        setSavedTheme(nextTheme);
        setTicker(nextTicker);
        setSavedTicker(nextTicker);
      } catch {
        if (!cancelled) showToast("تعذّر تحميل إعدادات الهوية", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const tokens = useMemo(() => resolveTheme(theme), [theme]);
  const warnings = useMemo(() => themeContrastWarnings(tokens), [tokens]);
  const dirty = JSON.stringify({ theme, ticker }) !== JSON.stringify({ theme: savedTheme, ticker: savedTicker });
  const customTickerIcon = !findTickerIcon(ticker.icon);

  const save = async (themeToSave: DraftTheme, tickerToSave: PreviewTicker) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: themeToSave,
          tickerEnabled: tickerToSave.enabled,
          tickerMessage: tickerToSave.message.trim(),
          tickerIcon: tickerToSave.icon || "truck",
          tickerIconPosition: tickerToSave.iconPosition,
        }),
      });
      const payload = await res.json();
      if (!payload?.success) {
        showToast(payload?.error?.message ?? "فشل حفظ الهوية", "error");
        return;
      }
      setSavedTheme(themeToSave);
      setSavedTicker(tickerToSave);
      showToast("تم حفظ الهوية — التغييرات ظهرت على الموقع فوراً", "success");
      router.refresh();
    } catch {
      showToast("خطأ في الاتصال", "error");
    } finally {
      setSaving(false);
    }
  };

  const requestSave = () => {
    if (!dirty || saving) return;
    if (warnings.length) {
      setPendingSave({ theme, ticker });
      return;
    }
    void save(theme, ticker);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm font-semibold text-[var(--color-text-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        جاري تحميل الهوية...
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Palette className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[13px] font-black text-[var(--color-text-primary)]">هوية الموقع والألوان</p>
            <p className="text-[10.5px] font-medium text-[var(--color-text-muted)]">
              التغييرات بتظهر على الموقع والداشبورد من نفس المكان
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-[11.5px] font-bold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-60"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            إعادة للألوان الافتراضية
          </button>
          <button
            type="button"
            onClick={() => {
              setTheme(savedTheme);
              setTicker(savedTicker);
            }}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-[11.5px] font-bold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-40"
          >
            <Undo2 className="h-3.5 w-3.5" />
            إلغاء التعديلات
          </button>
          <button
            type="button"
            onClick={requestSave}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-4 py-2 text-[11.5px] font-bold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "جاري الحفظ..." : "حفظ الهوية"}
          </button>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-[14px] border border-[#EBD9A9] bg-[#FBF3DF] px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#8A6414]" />
          <div className="space-y-1">
            {warnings.map((warning) => (
              <p key={warning} className="text-[11px] font-semibold leading-relaxed text-[#8A6414]">
                {warning}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-4">
          <section className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <Palette className="h-3.5 w-3.5" />
              </span>
              <div>
                <h2 className="text-[12.5px] font-black text-[var(--color-text-primary)]">الألوان الأساسية</h2>
                <p className="text-[10px] text-[var(--color-text-muted)]">3 ألوان بس — والباقي بيتشتق تلقائياً</p>
              </div>
            </div>
            <div className="space-y-3.5">
              <ColorField
                label="لون الأزرار الأساسي"
                value={theme.primary}
                onChange={(value) => setTheme((prev) => ({ ...prev, primary: value }))}
                hint="كل أزرار الموقع والداشبورد + شريط الإعلان + الأزرار عند المرور والضغط"
              />
              <ColorField
                label="لون الأيقونات"
                value={theme.icon}
                onChange={(value) => setTheme((prev) => ({ ...prev, icon: value }))}
                hint="الأيقونات المستقلة (بحث، سلة، قلوب…) — الأيقونات اللي جوه الأزرار بتتبع لون الزر"
              />
              <ColorField
                label="لون خلفية الموقع"
                value={theme.background}
                onChange={(value) => setTheme((prev) => ({ ...prev, background: value }))}
                hint="خلفية الموقع والداشبورد مع بعض — الهيدر والكروت والجداول بتتشتق منها"
              />
            </div>
          </section>

          <section className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <button
              type="button"
              onClick={() => setAdvancedOpen((open) => !open)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-right"
              aria-expanded={advancedOpen}
            >
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]">
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
                </span>
                <span>
                  <span className="block text-[12.5px] font-black text-[var(--color-text-primary)]">إعدادات متقدمة</span>
                  <span className="block text-[10px] text-[var(--color-text-muted)]">اختياري — سيبها فاضية للاشتقاق التلقائي</span>
                </span>
              </span>
              <span className="rounded-full bg-[var(--color-surface-secondary)] px-2 py-0.5 text-[9.5px] font-bold text-[var(--color-text-muted)]">
                {advancedOpen ? "إخفاء" : "عرض"}
              </span>
            </button>
            {advancedOpen && (
              <div className="grid gap-3.5 border-t border-[var(--color-border-subtle)] p-4 sm:grid-cols-2">
                <ColorField
                  label="أزرار — Hover"
                  value={theme.primaryHover}
                  derived={tokens.primaryHover}
                  allowAuto
                  onChange={(value) => setTheme((prev) => ({ ...prev, primaryHover: value }))}
                />
                <ColorField
                  label="أزرار — Active"
                  value={theme.primaryActive}
                  derived={tokens.primaryActive}
                  allowAuto
                  onChange={(value) => setTheme((prev) => ({ ...prev, primaryActive: value }))}
                />
                <ColorField
                  label="أيقونات — Hover"
                  value={theme.iconHover}
                  derived={tokens.iconHover}
                  allowAuto
                  onChange={(value) => setTheme((prev) => ({ ...prev, iconHover: value }))}
                />
                <ColorField
                  label="لون النص الأساسي"
                  value={theme.textPrimary}
                  derived={tokens.textPrimary}
                  allowAuto
                  onChange={(value) => setTheme((prev) => ({ ...prev, textPrimary: value }))}
                />
                <ColorField
                  label="خلفية الكروت والمودالات"
                  value={theme.surface}
                  derived={tokens.surface}
                  allowAuto
                  onChange={(value) => setTheme((prev) => ({ ...prev, surface: value }))}
                />
                <ColorField
                  label="خلفية ثانوية (جداول/رؤوس)"
                  value={theme.surfaceSecondary}
                  derived={tokens.surfaceSecondary}
                  allowAuto
                  onChange={(value) => setTheme((prev) => ({ ...prev, surfaceSecondary: value }))}
                />
                <ColorField
                  label="خلفية بارزة (مودالات/بطاقات عالية)"
                  value={theme.surfaceElevated}
                  derived={tokens.surfaceElevated}
                  allowAuto
                  onChange={(value) => setTheme((prev) => ({ ...prev, surfaceElevated: value }))}
                />
                <ColorField
                  label="لون الحدود"
                  value={theme.border}
                  derived={tokens.border}
                  allowAuto
                  onChange={(value) => setTheme((prev) => ({ ...prev, border: value }))}
                />
              </div>
            )}
          </section>

          <section className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                  <Megaphone className="h-3.5 w-3.5" />
                </span>
                <div>
                  <h2 className="text-[12.5px] font-black text-[var(--color-text-primary)]">شريط الإعلانات</h2>
                  <p className="text-[10px] text-[var(--color-text-muted)]">لونه بيتبع لون الأزرار الأساسي</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTicker((prev) => ({ ...prev, enabled: !prev.enabled }))}
                aria-pressed={ticker.enabled}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  ticker.enabled ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-[var(--color-surface-elevated)] shadow transition-all ${
                    ticker.enabled ? "right-0.5" : "right-[22px]"
                  }`}
                />
              </button>
            </div>

            <div className={`space-y-3.5 ${ticker.enabled ? "" : "pointer-events-none opacity-45"}`}>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="theme-ticker-message" className="text-xs font-bold text-[var(--color-text-muted)]">
                    نص الشريط
                  </label>
                  <span className="text-[10px] font-bold text-[var(--color-text-muted)]">{ticker.message.length}/160</span>
                </div>
                <input
                  id="theme-ticker-message"
                  type="text"
                  maxLength={160}
                  value={ticker.message}
                  onChange={(event) => setTicker((prev) => ({ ...prev, message: event.target.value }))}
                  placeholder="اكتب جملة الإعلان — أو سيبها فاضية لعرض مناطق التوصيل المجاني"
                  className="w-full rounded-[12px] border border-[var(--color-control-border)] bg-[var(--color-surface-soft)] px-4 py-2.5 text-[13px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)]/20"
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-bold text-[var(--color-text-muted)]">الأيقونة</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {TICKER_ICON_OPTIONS.map(({ key, label, Icon }) => {
                    const active = !customTickerIcon && ticker.icon === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        title={label}
                        onClick={() => setTicker((prev) => ({ ...prev, icon: key }))}
                        className={`flex h-9 items-center justify-center rounded-[10px] border transition-colors ${
                          active
                            ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                            : "border-[var(--color-control-border)] bg-[var(--color-surface-soft)] text-[var(--color-text-muted)] hover:border-[var(--color-primary-border)] hover:text-[var(--color-primary)]"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <label htmlFor="theme-ticker-custom" className="shrink-0 text-[10.5px] font-bold text-[var(--color-text-muted)]">
                    أو إيموجي:
                  </label>
                  <input
                    id="theme-ticker-custom"
                    type="text"
                    maxLength={12}
                    dir="ltr"
                    value={customTickerIcon ? ticker.icon : ""}
                    onChange={(event) =>
                      setTicker((prev) => ({ ...prev, icon: event.target.value.trim() ? event.target.value : "truck" }))
                    }
                    placeholder="🚚"
                    className="w-full rounded-[10px] border border-[var(--color-control-border)] bg-[var(--color-surface-soft)] px-3 py-1.5 text-[13px] text-[var(--color-text-primary)] focus:border-[var(--color-primary-border)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-bold text-[var(--color-text-muted)]">مكان الأيقونة</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { value: "start" as const, label: "الأيقونة الأول" },
                    { value: "end" as const, label: "الأيقونة الآخر" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTicker((prev) => ({ ...prev, iconPosition: option.value }))}
                      className={`rounded-[10px] border px-2 py-2 text-[11px] font-bold transition-colors ${
                        ticker.iconPosition === option.value
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                          : "border-[var(--color-control-border)] bg-[var(--color-surface-soft)] text-[var(--color-text-muted)] hover:border-[var(--color-primary-border)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24">
          <section className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-[12.5px] font-black text-[var(--color-text-primary)]">معاينة حية</h2>
                <p className="text-[10px] text-[var(--color-text-muted)]">بتتحدّث لحظياً قبل الحفظ — الزوار مش هيتأثروا غير بعد الحفظ</p>
              </div>
              <span className="rounded-full bg-[var(--color-surface-secondary)] px-2.5 py-1 text-[9.5px] font-bold text-[var(--color-text-muted)]">
                {dirty ? "تعديلات غير محفوظة" : "متطابقة مع المحفوظ"}
              </span>
            </div>
            <ThemePreview tokens={tokens} ticker={ticker} />
          </section>

          <section className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h2 className="text-[12.5px] font-black text-[var(--color-text-primary)]">فحص التباين</h2>
            <div className="mt-2.5 space-y-2">
              {[
                {
                  label: "نص الأزرار فوق لون الأزرار",
                  ratio: contrastRatio(tokens.primary, tokens.onPrimary),
                  min: 4.5,
                },
                {
                  label: "النص الأساسي فوق خلفية الموقع",
                  ratio: contrastRatio(tokens.textPrimary, tokens.background),
                  min: 4.5,
                },
                {
                  label: "الأيقونات فوق خلفية الموقع",
                  ratio: contrastRatio(tokens.icon, tokens.background),
                  min: 3,
                },
              ].map((row) => {
                const pass = row.ratio >= row.min;
                return (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-2 rounded-[10px] bg-[var(--color-surface-soft)] px-3 py-2"
                  >
                    <span className="text-[10.5px] font-semibold text-[var(--color-text-secondary)]">{row.label}</span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span dir="ltr" className="text-[10.5px] font-black text-[var(--color-text-primary)]">
                        {row.ratio.toFixed(2)}:1
                      </span>
                      {pass ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#4F8A57]" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-[#B98A2C]" />
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[9.5px] leading-relaxed text-[var(--color-text-muted)]">
              الحد الأدنى الموصى به: 4.5:1 للنصوص العادية، و3:1 للأيقونات والحدود.
            </p>
          </section>
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(pendingSave)}
        onClose={() => setPendingSave(null)}
        onConfirm={() => {
          if (pendingSave) void save(pendingSave.theme, pendingSave.ticker);
        }}
        title="تحذير تباين الألوان"
        variant="warning"
        confirmText="حفظ على أي حال"
        message={`${warnings.join(" ")} هل تريد حفظ الهوية رغم التحذيرات؟`}
      />

      <ConfirmDialog
        isOpen={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          setTheme({ ...DEFAULT_THEME });
          void save({ ...DEFAULT_THEME }, ticker);
        }}
        title="إعادة الألوان الافتراضية"
        variant="warning"
        confirmText="إعادة الألوان وحفظها"
        message="سيتم إرجاع ألوان الأزرار والأيقونات والخلفية وإعداداتها المتقدمة إلى هوية روزماري الافتراضية وحفظها فوراً. الشريط العلوي هيضل زي ما هو. هل تريد المتابعة؟"
      />
    </div>
  );
}
