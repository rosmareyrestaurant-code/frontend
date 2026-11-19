/**
 * بيانات صفحة «من نحن» — غيّر الصور والمعلومات هنا بسهولة
 * دون الحاجة لتعديل أي مكوّن JSX
 */

export interface GalleryImage {
  src: string;
  alt: string;
}

/** صور معرض الصور — استبدلها بصور المطعم الحقيقية لاحقاً */
export const GALLERY_IMAGES: GalleryImage[] = [
  {
    src: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    alt: "داخل مطعم روزماري",
  },
  {
    src: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
    alt: "بيتزا روزماري الطازجة",
  },
  {
    src: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    alt: "برجر روزماري",
  },
  {
    src: "https://images.unsplash.com/photo-1621996346565-e3d5d6281745?auto=format&fit=crop&w=800&q=80",
    alt: "باستا روزماري",
  },
];

/**
 * إعدادات الموقع الجغرافي للمطعم
 * ضع الإحداثيات الحقيقية هنا عند توفرها
 */
export const RESTAURANT_LOCATION = {
  /** true = الموقع محدد وجاهز للعرض | false = لم يُحدَّد بعد */
  isSet: false,
  lat: 0,
  lng: 0,
  /** رابط Google Maps المباشر — ضع الرابط الحقيقي هنا */
  googleMapsUrl: "https://maps.google.com",
  address: "حدائق الزيتون الشرقية — أمام محطة المترو",
};
