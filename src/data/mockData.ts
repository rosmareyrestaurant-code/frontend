import { Category, Product, OfferBannerData, HeroSlideData } from "@/types";

/**
 * بيانات 5 شرائح للـ Hero Slider بالترتيب المطلوب:
 * 1. بيتزا
 * 2. كريب
 * 3. سندوتشات
 * 4. مكرونات
 * 5. برجر
 */
export const HERO_SLIDES: HeroSlideData[] = [
  {
    id: "hero-pizza",
    title: "بيتزا روزماري بطعم مختلف",
    image: "/images/hero/hero-pizza-green.jpg",
    link: "#pizza",
  },
  {
    id: "hero-crepe",
    title: "كريب دجاج بطعم لا يُقاوم",
    image: "/images/hero/hero-crepe-green.jpg",
    link: "#crepe",
  },
  {
    id: "hero-sandwiches",
    title: "سندوتشات بمذاق لا يُقاوم",
    image: "/images/hero/hero-sandwiches-green.jpg",
    link: "#sandwiches",
  },
  {
    id: "hero-pasta",
    title: "مكرونات متنوعة بأشهى النكهات",
    image: "/images/hero/hero-pasta-green.jpg",
    link: "#pasta",
  },
  {
    id: "hero-burger",
    title: "برجر ميد نايت كلاسيك",
    image: "/images/hero/hero-burger-green.jpg",
    link: "#sandwiches",
  },
];

/**
 * التصنيفات الرئيسية: كريب، بيتزا إيطالي، سندوتشات، مكرونات
 */
export const CATEGORIES: Category[] = [
  {
    id: "cat-crepe",
    name: "كريب",
    slug: "crepe",
    image: "/images/categories/crepe.jpg",
  },
  {
    id: "cat-pizza",
    name: "بيتزا إيطالي",
    slug: "pizza",
    image: "/images/categories/pizza.jpg",
  },
  {
    id: "cat-sandwiches",
    name: "سندوتشات",
    slug: "sandwiches",
    image: "/images/categories/sandwiches.jpg",
  },
  {
    id: "cat-pasta",
    name: "مكرونات",
    slug: "pasta",
    image: "/images/categories/pasta.jpg",
  },
];

/**
 * بانرات العروض والخصومات الكبيرة
 */
export const PROMO_BANNERS: OfferBannerData[] = [
  {
    id: "offer-chicken",
    title: "عرض الدجاج المميز",
    highlightText: "خصم 30%",
    discount: "على جميع وجبات الدجاج المقرمش والمشوي",
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=900&q=80",
    buttonText: "اطلب الآن",
    buttonLink: "#chicken",
    badge: "عرض خاص",
    theme: "dark-red",
  },
  {
    id: "offer-pizza",
    title: "عرض البيتزا الكبير",
    highlightText: "خصم يصل إلى 31%",
    discount: "اشتري 2 بيتزا كبيرة واحصل على الثالثة مجاناً",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
    buttonText: "اطلب الآن",
    buttonLink: "#pizza",
    badge: "وفر أكتر",
    theme: "red",
  },
];

/**
 * منتجات قسم الدجاج
 */
export const CHICKEN_PRODUCTS: Product[] = [
  {
    id: "chk-1",
    name: "أجنحة دجاج حارة",
    description: "أجنحة مقرمشة متبلة بالصوص الحار الخاص مع صوص الرانش",
    price: 79,
    originalPrice: 99,
    image: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=600&q=80",
    category: "chicken",
    isPopular: true,
  },
  {
    id: "chk-2",
    name: "قطع دجاج مقرمش",
    description: "ستربس دجاج ذهبي فائق القرمشة يقدم مع صوص الباربيكيو",
    price: 89,
    originalPrice: 110,
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80",
    category: "chicken",
    isPopular: true,
  },
  {
    id: "chk-3",
    name: "وجبة دجاج بانيه",
    description: "صدور دجاج متبلة ومقلية مقرمشة مع بطاطس وصوص خاص",
    price: 99,
    image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=600&q=80",
    category: "chicken",
  },
  {
    id: "chk-4",
    name: "دجاج مشوي على الفحم",
    description: "نصف دجاجة مشوية بتتبيلة الأعشاب وروزماري الخاصة",
    price: 105,
    image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80",
    category: "chicken",
  },
  {
    id: "chk-5",
    name: "كريب كرانشي سوبريم",
    description: "كريب محشو بقطع الدجاج المقرمش مع الموزاريلا وصوص الجبنة الشيدر",
    price: 85,
    originalPrice: 105,
    image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=600&q=80",
    category: "chicken",
    isPopular: true,
  },
  {
    id: "chk-6",
    name: "كريب فاهيتا دجاج",
    description: "شرائح دجاج متبلة مع الفلفل الرومي والبصل وصوص المايونيز الحار",
    price: 80,
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80",
    category: "chicken",
  },
  {
    id: "chk-7",
    name: "كريب سوبر تشيكن",
    description: "دجاج مقرمش وجبنة موتزاريلا وصوص باربيكيو خاص",
    price: 92,
    originalPrice: 115,
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80",
    category: "chicken",
    isPopular: true,
  },
  {
    id: "chk-8",
    name: "بانيه شيز كريب",
    description: "صدور دجاج بانيه وخليط جبن وصلصة رنش",
    price: 88,
    image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=600&q=80",
    category: "chicken",
  },
  {
    id: "chk-9",
    name: "دجاج مشروم كريب",
    description: "دجاج مشوي ومشروم وفلفل رومي وصوص كريمي",
    price: 95,
    image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=600&q=80",
    category: "chicken",
  },
  {
    id: "chk-10",
    name: "وجبة دجاج بوكس",
    description: "قطع دجاج مقرمشة مع بطاطس وصوصين جانبيين",
    price: 120,
    originalPrice: 145,
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80",
    category: "chicken",
  },
];

/**
 * منتجات قسم المكرونة / الباستا
 */
export const PASTA_PRODUCTS: Product[] = [
  {
    id: "pas-1",
    name: "مكرونة ألفريدو",
    description: "فيتوتشيني بالكريمة الغنية والمشروم الطازج وجبنة البارميزان",
    price: 74,
    originalPrice: 95,
    image: "https://images.unsplash.com/photo-1621996346565-e3d5d6281745?auto=format&fit=crop&w=600&q=80",
    category: "pasta",
    isPopular: true,
  },
  {
    id: "pas-2",
    name: "مكرونة بالصلصة الإيطالية",
    description: "بيني باستا بصلصة الطماطم الطازجة والريحان وزيت الزيتون البكر",
    price: 69,
    originalPrice: 85,
    image: "https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=600&q=80",
    category: "pasta",
  },
  {
    id: "pas-3",
    name: "مكرونة بولونيز",
    description: "سباجيتي مع صلصة اللحم المفروم المطهو ببطء على الطريقة البولونية",
    price: 69,
    image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80",
    category: "pasta",
  },
  {
    id: "pas-4",
    name: "مكرونة تشيزي غنية",
    description: "مزيج غني من 4 أنواع جبن ذائبة مع صوص الكريمة اللذيذ",
    price: 79,
    image: "https://images.unsplash.com/photo-1556760544-74068565f05c?auto=format&fit=crop&w=600&q=80",
    category: "pasta",
    isPopular: true,
  },
  {
    id: "pas-5",
    name: "مكرونة نجرسكو دجاج",
    description: "مكرونة فرن بالدجاج والمشروم بصلصة البشاميل الكريمية والجبن",
    price: 88,
    originalPrice: 110,
    image: "https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=600&q=80",
    category: "pasta",
    isPopular: true,
  },
  {
    id: "pas-6",
    name: "طاجن مكرونة روزماري",
    description: "طاجن مكرونة محمر في الفرن بميكس لحوم وجبن شيدر وموتزاريلا سايحة",
    price: 95,
    image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80",
    category: "pasta",
  },
  {
    id: "pas-7",
    name: "مكرونة دجاج بالكريمة",
    description: "مكرونة بصلصة كريمية ودجاج مشوي ومشروم وبصل",
    price: 92,
    originalPrice: 112,
    image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=600&q=80",
    category: "pasta",
  },
  {
    id: "pas-8",
    name: "بيني بالكريمة والريحان",
    description: "بيني وصلصة كريمة خفيفة وطماطم صغيرة وريحان",
    price: 82,
    image: "https://images.unsplash.com/photo-1556760544-74068565f05c?auto=format&fit=crop&w=600&q=80",
    category: "pasta",
  },
  {
    id: "pas-9",
    name: "مكرونة روستو لحوم",
    description: "لحم مشوي ومكرونة وصوص طماطم جبنة بارميزان",
    price: 105,
    image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80",
    category: "pasta",
  },
  {
    id: "pas-10",
    name: "مكرونة بالجبن المحمر",
    description: "خليط جبن ذائب ومكرونة فرن محمرة بصلصة طماطم",
    price: 89,
    originalPrice: 108,
    image: "https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=600&q=80",
    category: "pasta",
  },
];

/**
 * منتجات قسم المشروبات
 */
export const DRINK_PRODUCTS: Product[] = [
  {
    id: "drk-1",
    name: "عصير مانجو طبيعي",
    description: "عصير مانجو طازج 100% بدون أي إضافات صناعية",
    price: 29,
    originalPrice: 38,
    image: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80",
    category: "drinks",
    isPopular: true,
  },
  {
    id: "drk-2",
    name: "كوكاكولا مثلجة",
    description: "مشروب غازي بارد ومنعش مع قطع الثلج",
    price: 20,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
    category: "drinks",
  },
  {
    id: "drk-3",
    name: "عصير برتقال فريش",
    description: "عصير برتقال طازج معصور يومياً غني بفيتامين سي",
    price: 25,
    originalPrice: 32,
    image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80",
    category: "drinks",
  },
  {
    id: "drk-4",
    name: "موهيتو ليمون ونعناع",
    description: "موهيتو كلاسيكي منعش بالنعناع الطازج وشرائح الليمون الأخضر والثلج",
    price: 30,
    image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&q=80",
    category: "drinks",
    isPopular: true,
  },
  {
    id: "drk-5",
    name: "سموذي فراولة مثلج",
    description: "سموذي فراولة طازجة مخفوقة مع الثلج وقطع الفراولة وصوص التوت",
    price: 35,
    originalPrice: 45,
    image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80",
    category: "drinks",
    isPopular: true,
  },
  {
    id: "drk-6",
    name: "آيس كوفي كراميل",
    description: "قهوة إسبريسو مثلجة مع الحليب وصوص الكراميل ورغوة باردة",
    price: 38,
    originalPrice: 48,
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80",
    category: "drinks",
  },
  {
    id: "drk-7",
    name: "عصير ليمون نعناع",
    description: "ليمون طازج ونعناع مثلج وصوص سكر خفيف",
    price: 28,
    image: "https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?auto=format&fit=crop&w=600&q=80",
    category: "drinks",
  },
  {
    id: "drk-8",
    name: "عصير خوخ طازج",
    description: "خوخ طبيعي مخفوق مثلج ومزج عصير فواكه",
    price: 32,
    originalPrice: 40,
    image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=600&q=80",
    category: "drinks",
  },
  {
    id: "drk-9",
    name: "فرابيه شوكولاتة",
    description: "شوكولاتة مثلجة بالحليب ومكعبات الثلج ورشة كاكاو",
    price: 42,
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80",
    category: "drinks",
    isPopular: true,
  },
  {
    id: "drk-10",
    name: "ريد بول مثلج",
    description: "مشروب الطاقة بارد ومثلج جاهز للتنشيط",
    price: 45,
    image: "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=600&q=80",
    category: "drinks",
  },
];

/**
 * منتجات قسم البيتزا
 */
export const PIZZA_PRODUCTS: Product[] = [
  {
    id: "piz-1",
    name: "بيتزا بيبروني سوبريم",
    description: "شرائح بيبروني بقري مدخن مع جبنة موتزاريلا وصلصة الطماطم الإيطالية",
    price: 110,
    originalPrice: 135,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
    category: "pizza",
    isPopular: true,
    sizes: [
      { id: "sm", name: "صغيرة", detail: "22 سم — لشخص", price: 75, isDefault: false },
      { id: "md", name: "وسط",   detail: "30 سم — شخصين", price: 110, originalPrice: 135, isDefault: true },
      { id: "lg", name: "كبيرة",  detail: "36 سم — 3 أشخاص", price: 145, originalPrice: 170 },
    ],
  },
  {
    id: "piz-2",
    name: "بيتزا فور تشيز (أربعة أجبان)",
    description: "موتزاريلا، شيدر، بارميزان، وجبنة زرقاء مع رشة أوريجانو",
    price: 95,
    originalPrice: 120,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    category: "pizza",
    sizes: [
      { id: "sm", name: "صغيرة", detail: "22 سم — لشخص", price: 65 },
      { id: "md", name: "وسط",   detail: "30 سم — شخصين", price: 95, originalPrice: 120, isDefault: true },
      { id: "lg", name: "كبيرة",  detail: "36 سم — 3 أشخاص", price: 130, originalPrice: 155 },
    ],
  },
  {
    id: "piz-3",
    name: "بيتزا باربيكيو تشيكن",
    description: "قطع دجاج مشوي مع صوص الباربيكيو المدخن والبصل المكرمل",
    price: 115,
    image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=600&q=80",
    category: "pizza",
    isPopular: true,
    sizes: [
      { id: "sm", name: "صغيرة", detail: "22 سم — لشخص", price: 80 },
      { id: "md", name: "وسط",   detail: "30 سم — شخصين", price: 115, isDefault: true },
      { id: "lg", name: "كبيرة",  detail: "36 سم — 3 أشخاص", price: 155 },
    ],
  },
  {
    id: "piz-4",
    name: "بيتزا مارجريتا إيطالي",
    description: "البيتزا الكلاسيكية الأصلية بجبنة الموتزاريلا وأوراق الريحان الطازجة",
    price: 85,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80",
    category: "pizza",
    sizes: [
      { id: "sm", name: "صغيرة", detail: "22 سم — لشخص", price: 55 },
      { id: "md", name: "وسط",   detail: "30 سم — شخصين", price: 85, isDefault: true },
      { id: "lg", name: "كبيرة",  detail: "36 سم — 3 أشخاص", price: 115 },
    ],
  },
  {
    id: "piz-5",
    name: "بيتزا ميكس جبن إكسترا",
    description: "مزيج غني من خمسة أنواع جبن إيطالية ذائبة مع أطراف محشوة",
    price: 105,
    originalPrice: 130,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    category: "pizza",
    isPopular: true,
    sizes: [
      { id: "sm", name: "صغيرة", detail: "22 سم — لشخص", price: 70 },
      { id: "md", name: "وسط",   detail: "30 سم — شخصين", price: 105, originalPrice: 130, isDefault: true },
      { id: "lg", name: "كبيرة",  detail: "36 سم — 3 أشخاص", price: 145, originalPrice: 170 },
    ],
  },
  {
    id: "piz-6",
    name: "بيتزا سي فود سبيشال",
    description: "جمبري وكاليماري طازج مع صوص الثوم والريحان وموتزاريلا",
    price: 145,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
    category: "pizza",
    sizes: [
      { id: "sm", name: "صغيرة", detail: "22 سم — لشخص", price: 95 },
      { id: "md", name: "وسط",   detail: "30 سم — شخصين", price: 145, isDefault: true },
      { id: "lg", name: "كبيرة",  detail: "36 سم — 3 أشخاص", price: 195 },
    ],
  },
  {
    id: "piz-7",
    name: "بيتزا مشروم ودجاج",
    description: "دجاج مشوي ومشروم وجبنة موتزاريلا وصوص أبيض",
    price: 120,
    originalPrice: 145,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80",
    category: "pizza",
  },
  {
    id: "piz-8",
    name: "بيتزا خضروات إيطالي",
    description: "فلفل رومي وبصل وزيتون وطماطم وجبنة الموتزاريلا",
    price: 90,
    image: "https://images.unsplash.com/photo-1593560708920-61dd98c465c8?auto=format&fit=crop&w=600&q=80",
    category: "pizza",
  },
  {
    id: "piz-9",
    name: "بيتزا سلامي حار",
    description: "سلامي حار وفلفل هالبينو وصلصة طماطم وجبنة",
    price: 125,
    originalPrice: 150,
    image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=600&q=80",
    category: "pizza",
  },
  {
    id: "piz-10",
    name: "بيتزا رانش تشيكن",
    description: "دجاج ورانش ومايونيز وفلفل رومي وصوص جبنة",
    price: 118,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
    category: "pizza",
  },
];

/**
 * منتجات قسم البرجر
 */
export const BURGER_PRODUCTS: Product[] = [
  {
    id: "brg-1",
    name: "برجر روزماري كلاسيك",
    description: "شريحة لحم بقري أنجوس مشوية مع صوص روزماري السري وخضار طازج",
    price: 95,
    originalPrice: 120,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    category: "burger",
    isPopular: true,
  },
  {
    id: "brg-2",
    name: "دبل تشيز برجر",
    description: "شريحتين من اللحم المشوي مع طبقتين جبنة شيدر أمريكية ذائبة",
    price: 125,
    originalPrice: 150,
    image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80",
    category: "burger",
    isPopular: true,
  },
  {
    id: "brg-3",
    name: "سموكي باربيكيو برجر",
    description: "لحم مشوي بصوص الباربيكيو المدخن مع حلقات البصل المقرمشة",
    price: 135,
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
    category: "burger",
  },
  {
    id: "brg-4",
    name: "كرسبي تشيكن برجر",
    description: "قطعة دجاج مقلية مقرمشة مع الخس الأمريكي والمايونيز الكريمي",
    price: 89,
    image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80",
    category: "burger",
  },
  {
    id: "brg-5",
    name: "ساندوتش فاهيتا لحم",
    description: "شرائح لحم بقري تندرلوين مشوية مع خضار سوتيه وصوص خاص في خبز فينو طازج",
    price: 110,
    originalPrice: 135,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    category: "burger",
    isPopular: true,
  },
  {
    id: "brg-6",
    name: "ساندوتش شيش طاووق",
    description: "قطع أوراك دجاج متبلة مشوية مع الثومية والخيار المخلل والبطاطس",
    price: 90,
    image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80",
    category: "burger",
  },
  {
    id: "brg-7",
    name: "برجر مشروم ستيك",
    description: "لحم بقري ومشروم ذائب وصوص مريمية مع جبنة شيدر",
    price: 145,
    originalPrice: 170,
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
    category: "burger",
  },
  {
    id: "brg-8",
    name: "برجر زنجر حار",
    description: "دجاج زنجر مقرمش وصوص حار وخس وشرائح جبنة",
    price: 105,
    image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80",
    category: "burger",
  },
  {
    id: "brg-9",
    name: "ساندوتش تشيكن رانش",
    description: "دجاج مشوي وصوص رانش وخس وطحينة توست طازج",
    price: 98,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    category: "burger",
  },
  {
    id: "brg-10",
    name: "دبل تشيكن برجر",
    description: "قطعتا دجاج مقرمشة جبنة شيدر وخضار وصوص خاص",
    price: 132,
    originalPrice: 155,
    image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80",
    category: "burger",
  },
];

/**
 * منتجات قسم الحلويات
 */
export const DESSERT_PRODUCTS: Product[] = [
  {
    id: "des-1",
    name: "مولتن شوكولاتة",
    description: "كيكة شوكولاتة ساخنة بقلب ذائب ورشة شوكولاتة غامقة",
    price: 65,
    originalPrice: 80,
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
    category: "desserts",
    isPopular: true,
  },
  {
    id: "des-2",
    name: "تشيز كيك فراولة",
    description: "تشيز كيك كريمي على طبقة بسكويت وصوص فراولة طبيعي",
    price: 55,
    image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80",
    category: "desserts",
  },
  {
    id: "des-3",
    name: "وافل نوتيلا والموز",
    description: "وافل مقرمش نوتيلا وموز طازج ورذاذ شوكولاتة",
    price: 70,
    originalPrice: 85,
    image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80",
    category: "desserts",
    isPopular: true,
  },
  {
    id: "des-4",
    name: "كوكيز آيس كريم",
    description: "كوكيز شوكولاتة دافئ مع كرة آيس كريم فانيليا",
    price: 60,
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80",
    category: "desserts",
  },
  {
    id: "des-5",
    name: "براونيز كراميل",
    description: "براونيز غني بالشوكولاتة بصوص كراميل ومكسرات محمصة",
    price: 58,
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
    category: "desserts",
  },
  {
    id: "des-6",
    name: "كنافة روزماري",
    description: "كنافة طازجة بقشطة كريمية وفستق وقطر خفيف",
    price: 75,
    originalPrice: 90,
    image: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80",
    category: "desserts",
    isPopular: true,
  },
];

/**
 * تجميعة كل منتجات المطعم للبحث والمنيو
 */
export const ALL_PRODUCTS: Product[] = [
  ...PIZZA_PRODUCTS,
  ...CHICKEN_PRODUCTS,
  ...BURGER_PRODUCTS,
  ...PASTA_PRODUCTS,
  ...DRINK_PRODUCTS,
  ...DESSERT_PRODUCTS,
];

