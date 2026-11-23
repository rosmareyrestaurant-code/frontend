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
  shape?: "rect" | "circle";
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
  shape = "rect",
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
      <label className="block text-xs font-bold text-[var(--color-text-muted)]">{label}</label>
      <div className={shape === "circle" ? "relative mx-auto w-24" : "relative w-full"}>
        <div className={`relative overflow-hidden border border-[var(--color-control-border)] bg-[var(--color-surface-secondary)] ${
          shape === "circle" ? "h-24 w-24 rounded-full" : `w-full rounded-[14px] ${previewClassName}`
        }`}>
          {value ? (
            <Image src={value} alt="معاينة" fill unoptimized={value.startsWith("data:")}
              className={shape === "circle" ? "object-cover" : "object-contain p-2"} sizes="400px" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--color-text-muted)]">
              {uploading ? <Loader2 className="h-7 w-7 animate-spin text-[var(--color-primary)]" /> : <ImagePlus className="h-8 w-8" strokeWidth={1.7} />}
              <span className="text-[11px] font-semibold">{uploading ? "جاري الرفع..." : "لم يتم اختيار صورة"}</span>
            </div>
          )}
        </div>
        {value && (
          <button type="button" onClick={() => { onChange(""); if (inputRef.current) inputRef.current.value = ""; }}
            aria-label="إزالة الصورة"
            className={`absolute z-10 flex items-center justify-center rounded-full bg-[#C25B4F]/95 text-[var(--color-on-primary)] transition-colors hover:bg-[#B0503F] ${
              shape === "circle"
                ? "-top-2 -left-2 h-7 w-7 ring-2 ring-[var(--color-surface-soft)]"
                : "left-2 top-2 h-8 w-8 ring-2 ring-[var(--color-surface-secondary)]"
            }`}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] px-4 py-2.5 text-xs font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-soft)] disabled:opacity-50">
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {uploading ? "جاري الرفع..." : value ? "تغيير الصورة" : "اختيار صورة"}
      </button>
      {hint && <p className="text-[10px] leading-relaxed text-[var(--color-text-muted)]">{hint}</p>}
      {error && <p className="text-[11px] font-medium text-[#C25B4F]">{error}</p>}
    </div>
  );
}
