"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (dataUrl: string) => void;
  label?: string;
  hint?: string;
  /** نسبة المعاينة — مثلاً aspect-square أو aspect-[16/9] */
  previewClassName?: string;
}

/**
 * حقل صورة واحد: العميل يختار ملف من جهازه، بنقرأه ونخزنه كـ data URL
 * عشان يظهر في اللوحة وفي الموقع من غير رابط خارجي أو باكند.
 */
export default function ImageUpload({
  value,
  onChange,
  label = "الصورة",
  hint = "اختار ملف صورة من جهازك (JPG / PNG / WebP)",
  previewClassName = "aspect-[4/3]",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const handleFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("اختار ملف صورة فقط");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("حجم الصورة لازم يكون أقل من 8 ميجا");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result ?? "");
      // تصغير الصورة قبل التخزين عشان localStorage مايمتلئش بسرعة
      const img = new window.Image();
      img.onload = () => {
        const maxSide = 1400;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) { onChange(raw); setError(""); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const type = file.type === "image/png" || file.type === "image/webp" ? file.type : "image/jpeg";
        onChange(canvas.toDataURL(type, 0.82));
        setError("");
      };
      img.onerror = () => { onChange(raw); setError(""); };
      img.src = raw;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-[#a89f94]">{label}</label>

      <div className={`relative w-full overflow-hidden rounded-xl border border-[#2a231d] bg-[#141210] ${previewClassName}`}>
        {value ? (
          <>
            <Image
              src={value}
              alt="معاينة الصورة"
              fill
              unoptimized={value.startsWith("data:")}
              className="object-contain p-2"
              sizes="400px"
            />
            <button
              type="button"
              onClick={() => { onChange(""); if (inputRef.current) inputRef.current.value = ""; }}
              aria-label="إزالة الصورة"
              className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/85 text-white hover:bg-red-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#5a4f45]">
            <ImagePlus className="h-8 w-8" />
            <span className="text-[11px]">لم يتم اختيار صورة</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#ff7a00]/30 bg-[#ff7a00]/10 px-4 py-2.5 text-xs font-bold text-[#ffb066] transition-colors hover:bg-[#ff7a00]/20"
      >
        <Upload className="h-3.5 w-3.5" />
        {value ? "تغيير الصورة" : "اختيار صورة"}
      </button>
      {hint && <p className="text-[10px] leading-relaxed text-[#6b6259]">{hint}</p>}
      {error && <p className="text-[11px] font-medium text-red-400">{error}</p>}
    </div>
  );
}
