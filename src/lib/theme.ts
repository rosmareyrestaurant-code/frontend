/**
 * نظام الهوية المركزي: تخزين 3 ألوان أساسية + اشتقاق كل الـ Design Tokens منها.
 * كل المكونات بتقرأ متغيرات CSS دلالية، فالتغيير من الداشبورد بيسري على الموقع
 * والداشبورد من غير تعديل أي مكون.
 */

export interface ThemeColors {
  primary: string;
  icon: string;
  background: string;
  primaryHover?: string;
  primaryActive?: string;
  iconHover?: string;
  textPrimary?: string;
  surface?: string;
  surfaceSecondary?: string;
  surfaceElevated?: string;
  border?: string;
}

export const DEFAULT_THEME: Required<ThemeColors> = {
  primary: "#50604D",
  icon: "#526B58",
  background: "#F2F2ED",
  primaryHover: "",
  primaryActive: "",
  iconHover: "",
  textPrimary: "",
  surface: "",
  surfaceSecondary: "",
  surfaceElevated: "",
  border: "",
};

export const THEME_HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

const NEUTRAL_DARK = "#1B241D";
const WHITE = "#FFFFFF";

type RGB = { r: number; g: number; b: number };

export function isHexColor(value: string): boolean {
  return THEME_HEX_REGEX.test(value);
}

function parseHex(hex: string): RGB {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function toHex({ r, g, b }: RGB): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/** mix(a, b, weight) — weight نسبة b في الخليط (0..1) */
export function mix(a: string, b: string, weight: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  const w = Math.max(0, Math.min(1, weight));
  return toHex({
    r: ca.r + (cb.r - ca.r) * w,
    g: ca.g + (cb.g - ca.g) * w,
    b: ca.b + (cb.b - ca.b) * w,
  });
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

export function isLightColor(hex: string): boolean {
  return relativeLuminance(hex) > 0.45;
}

/** أفضل لون نص فوق لون معيّن (أبيض أو غامق) حسب التباين */
export function readableOn(background: string): string {
  const onWhite = contrastRatio(background, WHITE);
  const onDark = contrastRatio(background, NEUTRAL_DARK);
  return onWhite >= onDark ? WHITE : NEUTRAL_DARK;
}

function toHsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = parseHex(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h, s, l };
}

function fromHsl({ h, s, l }: { h: number; s: number; l: number }): string {
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const hue = ((h % 1) + 1) % 1;
  const sat = clamp(s);
  const light = clamp(l);
  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
  const p = 2 * light - q;
  const channel = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return toHex({
    r: channel(hue + 1 / 3) * 255,
    g: channel(hue) * 255,
    b: channel(hue - 1 / 3) * 255,
  });
}

/**
 * درجة أغمق/أفتح متناسقة: للألوان الغامقة نغمّق قليلاً (زي البراند الحالي)،
 * وللألوان الفاتحة جداً نفتّح بدل ما نغمّق عشان الهوفر يفضل واضح.
 */
function shade(hex: string, amount: number): string {
  const hsl = toHsl(hex);
  const direction = hsl.l <= 0.2 ? 1 : -1;
  return fromHsl({
    h: hsl.h,
    s: Math.min(1, hsl.s + 0.02),
    l: hsl.l + direction * amount,
  });
}

export interface ThemeTokens {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primarySoft: string;
  primaryBorder: string;
  onPrimary: string;
  icon: string;
  iconHover: string;
  iconActive: string;
  background: string;
  surface: string;
  surfaceSecondary: string;
  surfaceSoft: string;
  surfaceElevated: string;
  surfaceHover: string;
  overlay: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderSubtle: string;
  borderStrong: string;
  controlBackground: string;
  controlBorder: string;
  controlHover: string;
  closeIcon: string;
  closeIconHover: string;
}

export function resolveTheme(input?: Partial<ThemeColors> | null): ThemeTokens {
  const theme = { ...DEFAULT_THEME, ...(input ?? {}) };
  const primary = isHexColor(theme.primary) ? theme.primary : DEFAULT_THEME.primary;
  const icon = isHexColor(theme.icon) ? theme.icon : DEFAULT_THEME.icon;
  const background = isHexColor(theme.background) ? theme.background : DEFAULT_THEME.background;
  const light = isLightColor(background);

  const primaryHover =
    theme.primaryHover && isHexColor(theme.primaryHover)
      ? theme.primaryHover
      : shade(primary, 0.07);
  const primaryActive =
    theme.primaryActive && isHexColor(theme.primaryActive)
      ? theme.primaryActive
      : shade(primary, 0.13);
  const iconHover =
    theme.iconHover && isHexColor(theme.iconHover) ? theme.iconHover : shade(icon, 0.07);

  const textPrimary =
    theme.textPrimary && isHexColor(theme.textPrimary)
      ? theme.textPrimary
      : light
        ? mix(background, NEUTRAL_DARK, 0.88)
        : mix(WHITE, background, 0.12);
  const textSecondary = mix(textPrimary, background, light ? 0.3 : 0.35);
  const textMuted = mix(textPrimary, background, light ? 0.52 : 0.55);

  const surface =
    theme.surface && isHexColor(theme.surface)
      ? theme.surface
      : mix(background, WHITE, light ? 0.62 : 0.08);
  const surfaceSecondary =
    theme.surfaceSecondary && isHexColor(theme.surfaceSecondary)
      ? theme.surfaceSecondary
      : mix(background, WHITE, light ? 0.38 : 0.05);
  const surfaceElevated =
    theme.surfaceElevated && isHexColor(theme.surfaceElevated)
      ? theme.surfaceElevated
      : mix(background, WHITE, light ? 0.92 : 0.12);

  const border =
    theme.border && isHexColor(theme.border)
      ? theme.border
      : mix(background, textPrimary, light ? 0.12 : 0.2);

  return {
    primary,
    primaryHover,
    primaryActive,
    primarySoft: mix(primary, background, 0.88),
    primaryBorder: mix(primary, background, 0.45),
    onPrimary: readableOn(primary),
    icon,
    iconHover,
    iconActive: shade(icon, 0.13),
    background,
    surface,
    surfaceSecondary,
    surfaceSoft: mix(background, WHITE, light ? 0.5 : 0.06),
    surfaceElevated,
    surfaceHover: mix(background, primary, 0.06),
    overlay: "rgba(15, 20, 16, 0.62)",
    textPrimary,
    textSecondary,
    textMuted,
    border,
    borderSubtle: mix(background, textPrimary, light ? 0.07 : 0.13),
    borderStrong: mix(background, primary, 0.5),
    controlBackground: mix(background, WHITE, light ? 0.55 : 0.06),
    controlBorder: border,
    controlHover: mix(primary, background, 0.85),
    closeIcon: "#6B7264",
    closeIconHover: "#333B2E",
  };
}

/** متغيرات CSS كاملة — تُطبق من السيرفر في root layout */
export function themeCssVariables(tokens: ThemeTokens): Record<string, string> {
  return {
    "--color-primary": tokens.primary,
    "--color-primary-hover": tokens.primaryHover,
    "--color-primary-active": tokens.primaryActive,
    "--color-primary-soft": tokens.primarySoft,
    "--color-primary-border": tokens.primaryBorder,
    "--color-on-primary": tokens.onPrimary,
    "--color-button-background": tokens.primary,
    "--color-button-hover": tokens.primaryHover,
    "--color-button-active": tokens.primaryActive,
    "--color-button-text": tokens.onPrimary,
    "--color-icon": tokens.icon,
    "--color-icon-hover": tokens.iconHover,
    "--color-icon-active": tokens.iconActive,
    "--color-page-background": tokens.background,
    "--color-header-background": tokens.background,
    "--color-surface": tokens.surface,
    "--color-surface-secondary": tokens.surfaceSecondary,
    "--color-surface-soft": tokens.surfaceSoft,
    "--color-surface-elevated": tokens.surfaceElevated,
    "--color-surface-hover": tokens.surfaceHover,
    "--color-overlay": tokens.overlay,
    "--color-text-primary": tokens.textPrimary,
    "--color-text-secondary": tokens.textSecondary,
    "--color-text-muted": tokens.textMuted,
    "--color-text-on-primary": tokens.onPrimary,
    "--color-border": tokens.border,
    "--color-border-subtle": tokens.borderSubtle,
    "--color-border-strong": tokens.borderStrong,
    "--color-control-background": tokens.controlBackground,
    "--color-control-border": tokens.controlBorder,
    "--color-control-selected": tokens.primary,
    "--color-control-selected-text": tokens.onPrimary,
    "--color-control-hover": tokens.controlHover,
    "--color-close-icon": tokens.closeIcon,
    "--color-close-icon-hover": tokens.closeIconHover,
    /* توافق مع المتغيرات القديمة المستخدمة في globals.css */
    "--background": tokens.background,
    "--foreground": tokens.textPrimary,
    "--rosemary-dark": tokens.primary,
    "--rosemary-medium": tokens.textSecondary,
    "--rosemary-light": tokens.borderStrong,
    "--rosemary-gray": tokens.background,
    "--color-brand-primary": tokens.primary,
    "--color-brand-primary-hover": tokens.primaryHover,
    "--color-brand-secondary": tokens.textSecondary,
    "--color-brand-light": tokens.borderStrong,
    "--color-page-bg": tokens.background,
    "--color-surface-card": tokens.surfaceElevated,
    "--color-text-muted-legacy": tokens.textMuted,
    "--color-border-legacy": tokens.border,
  };
}

export function themeCss(tokens: ThemeTokens): string {
  const vars = themeCssVariables(tokens);
  const body = Object.entries(vars)
    .map(([key, value]) => `${key}:${value}`)
    .join(";");
  return `:root{${body}}`;
}

/** تحذيرات تباين بسيطة تظهر للمدير قبل الحفظ */
export function themeContrastWarnings(tokens: ThemeTokens): string[] {
  const warnings: string[] = [];
  if (contrastRatio(tokens.primary, tokens.onPrimary) < 4.5) {
    warnings.push("تباين نص الأزرار مع لون الأزرار أقل من 4.5:1 — جرّب لون أغمق.");
  }
  if (contrastRatio(tokens.textPrimary, tokens.background) < 4.5) {
    warnings.push("تباين النص الأساسي مع خلفية الموقع أقل من 4.5:1 — جرّب خلفية أفتح أو نص أغمق.");
  }
  if (contrastRatio(tokens.icon, tokens.background) < 3) {
    warnings.push("لون الأيقونات قريب جداً من خلفية الموقع — الأيقونات ممكن متبانش بوضوح.");
  }
  return warnings;
}
