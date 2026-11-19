"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Trash2, Upload, Loader2 } from "lucide-react";
import { IMAGE_UPLOAD } from "@/lib/constants";

type CloudinaryFolder = typeof IMAGE_UPLOAD.folders[keyof typeof IMAGE_UPLOAD.folders];

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  onPublicIdChange?: (id: string) => void;
  label?: string;
  hint?: string;
  previewClassName?: string;
  folder?: CloudinaryFolder;
}

/**
 * ImageUpload — يرفع الصور إلى Cloudinary عبر Signed Upload.
 * لا يوجد fallback لـ data URL — الفشل يُظهر رسالة خطأ واضحة للمستخدم.
 */
export default function ImageUpload({
  value, onChange, onPublicIdChange,
  label = "الصورة",
  hint = "اختار ملف صورة (JPG / PNG / WebP — أقل من 8 ميجا)",
  previewClassName = "aspect-[4/3]",
  folder = "rozmaly/products",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError("");

    if (!file.type.startsWith("image/")) { setError("اختار ملف صورة فقط (JPG/PNG/WebP)"); return; }
    if (file.size > IMAGE_UPLOAD.maxBytes) { setError("حجم الصورة أكبر من 8 ميجا"); return; }

    setUploading(true);
    try {
      // جلب توقيع الرفع من السيرفر
      const sigRes = await fetch("/api/admin/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder }),
      });
      const sigData = await sigRes.json();

      if (!sigData.success) {
        // خطأ واضح — لا fallback
        setError(sigData.error?.message ?? "فشل الحصول على توقيع الرفع من السيرفر");
        return;
      }

      const { signature, timestamp, apiKey, uploadUrl } = sigData.data;

      // رفع مباشر إلى Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadRes = await fetch(uploadUrl, { method: "POST", body: formData });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || uploadData.error) {
        setError(uploadData.error?.message ?? `فشل رفع الصورة (${uploadRes.status})`);
        return;
      }

      if (!uploadData.secure_url) {
        setError("لم يرد رابط الصورة من Cloudinary");
        return;
      }

      onChange(uploadData.secure_url);
      onPublicIdChange?.(uploadData.public_id ?? "");
      setError("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطأ غير متوقع أثناء رفع الصورة";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };


  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-[#8F9186]">{label}</label>
      <div className={`relative w-full overflow-hidden rounded-[14px] border border-[#E9E5DA] bg-[#F1EEE7] ${previewClassName}`}>
        {value ? (
          <>
            <Image src={value} alt="معاينة" fill unoptimized={value.startsWith("data:")} className="object-contain p-2" sizes="400px" />
            <button type="button" onClick={() => { onChange(""); if (inputRef.current) inputRef.current.value = ""; }}
              aria-label="إزالة الصورة"
              className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#C25B4F]/90 text-[#fff] transition-colors hover:bg-[#B0503F]">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#9A9C90]">
            {uploading ? <Loader2 className="h-7 w-7 animate-spin text-[#50604D]" /> : <ImagePlus className="h-8 w-8" strokeWidth={1.7} />}
            <span className="text-[11px] font-semibold">{uploading ? "جاري الرفع..." : "لم يتم اختيار صورة"}</span>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-[#D6DCCF] bg-[#EDF1E8] px-4 py-2.5 text-xs font-bold text-[#50604D] transition-colors hover:bg-[#E3E9DC] disabled:opacity-50">
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {uploading ? "جاري الرفع..." : value ? "تغيير الصورة" : "اختيار صورة"}
      </button>
      {hint && <p className="text-[10px] leading-relaxed text-[#9A9C90]">{hint}</p>}
      {error && <p className="text-[11px] font-medium text-[#C25B4F]">{error}</p>}
    </div>
  );
}
