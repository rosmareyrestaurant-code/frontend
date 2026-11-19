/**
 * تأثير حركة طيران الوجبة إلى سلة المشتريات (Fly-to-Cart)
 * مخصص حصرياً لإضافة الوجبة إلى السلة، مع إظهار صورة الأكل كاملة دون أي مربع فارغ،
 * وهبوط هادئ في أيقونة السلة دون أي تأثير نبض أو اهتزاز.
 */

export interface FlyAnimationOptions {
  imageUrl: string;
  type?: "cart";
  sourceElement?: HTMLElement | null;
  startPoint?: { x: number; y: number };
}

export function triggerFlyAnimation({
  imageUrl,
  sourceElement,
  startPoint,
}: FlyAnimationOptions) {
  if (typeof window === "undefined") return;

  // استخراج الصورة المحملة حالياً في الـ DOM لضمان ظهورها الفوري 100% دون أي تأخير شبكي
  let resolvedSrc = imageUrl;
  if (sourceElement) {
    const container =
      sourceElement.closest(".group") ||
      sourceElement.closest("[role='dialog']") ||
      sourceElement.closest("[role='button']") ||
      sourceElement.parentElement;
    const renderedImg = container?.querySelector("img") as HTMLImageElement | null;
    if (renderedImg && (renderedImg.currentSrc || renderedImg.src)) {
      resolvedSrc = renderedImg.currentSrc || renderedImg.src;
    }
  }

  // حساب نقطة الانطلاق
  let startX = window.innerWidth / 2;
  let startY = window.innerHeight / 2;

  if (sourceElement) {
    const rect = sourceElement.getBoundingClientRect();
    startX = rect.left + rect.width / 2;
    startY = rect.top + rect.height / 2;
  } else if (startPoint) {
    startX = startPoint.x;
    startY = startPoint.y;
  }

  // تحديد أيقونة السلة في الهيدر
  const targetElement = document.getElementById("header-cart-btn");

  // موقع افتراضي في أعلى الشاشة في حال لم يتم العثور على الأيقونة
  let targetX = 70;
  let targetY = 40;

  if (targetElement) {
    const rect = targetElement.getBoundingClientRect();
    targetX = rect.left + rect.width / 2;
    targetY = rect.top + rect.height / 2;
  }

  // إنشاء العنصر الطائر بصورة الوجبة الحقيقية
  const flyer = document.createElement("div");
  const size = 62; // الحجم بالبكسل

  flyer.style.position = "fixed";
  flyer.style.zIndex = "99999";
  flyer.style.width = `${size}px`;
  flyer.style.height = `${size}px`;
  flyer.style.left = `${startX - size / 2}px`;
  flyer.style.top = `${startY - size / 2}px`;
  flyer.style.pointerEvents = "none";
  flyer.style.borderRadius = "9999px";
  flyer.style.overflow = "hidden";
  flyer.style.willChange = "transform, opacity";
  // منع مشاكل القص في متصفحات Webkit ليظهر دائرياً بنعومة
  (flyer.style as unknown as Record<string, string>)["WebkitMaskImage"] =
    "-webkit-radial-gradient(white, black)";
  flyer.style.boxShadow = "0 12px 28px -2px rgba(0,0,0,0.85), 0 0 25px rgba(255,122,0,0.85)";
  flyer.style.border = "2.5px solid #ff7a00";
  // وضع الصورة كخلفية لضمان عدم ظهور أي مربع فارغ نهائياً
  flyer.style.backgroundImage = `url("${resolvedSrc}")`;
  flyer.style.backgroundSize = "cover";
  flyer.style.backgroundPosition = "center";
  flyer.style.backgroundRepeat = "no-repeat";

  // إضافة عنصر الصورة داخلياً أيضاً لضمان الدقة العالية
  const img = document.createElement("img");
  img.src = resolvedSrc;
  img.alt = "";
  img.decoding = "sync";
  img.loading = "eager";
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "cover";
  img.style.display = "block";
  img.style.borderRadius = "9999px";
  flyer.appendChild(img);

  // شارة صغيرة دائرية في الزاوية توضح سلة الشراء
  const badge = document.createElement("div");
  badge.style.position = "absolute";
  badge.style.bottom = "-1px";
  badge.style.right = "-1px";
  badge.style.width = "22px";
  badge.style.height = "22px";
  badge.style.borderRadius = "9999px";
  badge.style.display = "flex";
  badge.style.alignItems = "center";
  badge.style.justifyContent = "center";
  badge.style.fontSize = "12px";
  badge.style.lineHeight = "1";
  badge.style.backgroundColor = "#ff7a00";
  badge.style.boxShadow = "0 2px 6px rgba(0,0,0,0.6)";
  badge.style.border = "1.5px solid #ffffff";
  badge.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`;
  flyer.appendChild(badge);

  document.body.appendChild(flyer);

  // حساب المسافات ومسار القوس الفيزيائي
  const deltaX = targetX - startX;
  const deltaY = targetY - startY;

  const arcHeight = Math.max(90, Math.min(180, Math.abs(deltaY) * 0.35));
  const midX = deltaX * 0.45;
  const midY = deltaY * 0.3 - arcHeight;

  const keyframes = [
    {
      transform: "translate(0px, 0px) scale(0.85) rotate(0deg)",
      opacity: 0.95,
    },
    {
      transform: `translate(${midX * 0.45}px, ${midY * 0.85}px) scale(1.2) rotate(-10deg)`,
      opacity: 1,
      offset: 0.25,
    },
    {
      transform: `translate(${midX}px, ${midY}px) scale(1.08) rotate(4deg)`,
      opacity: 1,
      offset: 0.55,
    },
    {
      transform: `translate(${deltaX * 0.8}px, ${deltaY * 0.75}px) scale(0.68) rotate(-4deg)`,
      opacity: 0.95,
      offset: 0.82,
    },
    {
      transform: `translate(${deltaX}px, ${deltaY}px) scale(0.18) rotate(14deg)`,
      opacity: 0.15,
    },
  ];

  try {
    const animation = flyer.animate(keyframes, {
      duration: 1150,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "forwards",
    });

    const cleanup = () => {
      if (flyer.parentNode) {
        flyer.parentNode.removeChild(flyer);
      }
      // هبوط هادئ في السلة دون أي تأثير نبض أو اهتزاز لأيقونة الهيدر كما طلب المستخدم
    };

    animation.onfinish = cleanup;
    animation.oncancel = cleanup;
  } catch {
    flyer.remove();
  }
}
