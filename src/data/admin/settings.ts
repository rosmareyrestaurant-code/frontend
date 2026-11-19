import { StoreSettings } from "@/types/admin";

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: "روزماري",
  storeDescription: "مطعم روزماري — وجهتك لأشهى الوجبات الطازجة",
  phone: "01005526838",
  email: "info@rosemary.com",
  address: "حدائق الزيتون الشرقية، أمام محطة المترو، القاهرة",
  logoUrl: "/images/logo.png",
  currency: "EGP",
  workingHours: [
    { day: "الأحد",    isOpen: true,  openTime: "10:00", closeTime: "00:00" },
    { day: "الاثنين",  isOpen: true,  openTime: "10:00", closeTime: "00:00" },
    { day: "الثلاثاء", isOpen: true,  openTime: "10:00", closeTime: "00:00" },
    { day: "الأربعاء", isOpen: true,  openTime: "10:00", closeTime: "00:00" },
    { day: "الخميس",   isOpen: true,  openTime: "10:00", closeTime: "01:00" },
    { day: "الجمعة",   isOpen: true,  openTime: "12:00", closeTime: "01:00" },
    { day: "السبت",    isOpen: true,  openTime: "10:00", closeTime: "01:00" },
  ],
  socialLinks: {
    facebook:  "https://facebook.com/rosemary",
    instagram: "https://instagram.com/rosemary",
    tiktok:    "https://tiktok.com/@rosemary",
    whatsapp:  "https://wa.me/201005526838",
  },
};
