/**
 * لوحة الألوان والإعدادات المظهرية الأساسية لمشروع Rosemary
 * مستوحاة من الهوية البصرية الرسمية (خلفيات داكنة فحمية + برتقالي دافئ)
 */

export const THEME_COLORS = {
  primary: {
    DEFAULT: "#FF7A00", // البرتقالي الدافئ الأساسي
    hover: "#E66E00",
    light: "#FF9838",
    dark: "#CC6200",
  },
  dark: {
    bg: "#0B0A09", // خلفية الموقع الأساسية الفاحمة
    surface: "#141210", // خلفية الأقسام
    card: "#1A1714", // خلفية الكروت
    cardHover: "#221E1A",
    border: "#2A241F", // الحدود الخفيفة للكروت
    borderLight: "rgba(255, 255, 255, 0.08)",
  },
  text: {
    primary: "#FFFFFF",
    secondary: "#D1D5DB",
    muted: "#9CA3AF",
    accent: "#FF7A00",
  },
} as const;

export const APP_CONFIG = {
  name: "Rosemary",
  nameAr: "روزماري",
  slogan: "أكل أطيب .. بكل سهولة",
  subSlogan: "دائماً على مزاجك ..",
  currency: "EGP",
  currencyAr: "ج.م",
  locale: "ar",
  direction: "rtl",
} as const;
