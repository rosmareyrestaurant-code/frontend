/**
 * لوحة الألوان والإعدادات المظهرية الأساسية لمشروع Rosemary
 * مستوحاة من الهوية البصرية الرسمية (خلفيات داكنة فحمية + برتقالي دافئ)
 */

export const THEME_COLORS = {
  rosemary: {
    light: "#899B83",
    medium: "#697F6B",
    gray: "#F2F2ED",
    dark: "#526B58",
  },
  surface: {
    page: "#F2F2ED",
    soft: "#EAEAE4",
    card: "#FFFFFF",
    cardHover: "#E5EBDF",
    border: "#DCDCD3",
  },
  text: {
    primary: "#26352B",
    secondary: "#526B58",
    muted: "#697F6B",
    inverse: "#FFFFFF",
  },
  state: {
    success: "#526B58",
    warning: "#697F6B",
    danger: "#A65D58",
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
