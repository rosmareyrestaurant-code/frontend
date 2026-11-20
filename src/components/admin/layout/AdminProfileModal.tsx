"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, UserRound, Mail, ShieldCheck } from "lucide-react";
import ImageUpload from "@/components/admin/shared/ImageUpload";
import { useToast } from "@/components/admin/shared/Toast";

export interface AdminProfileData {
  name: string;
  avatar: string;
  email?: string;
  role?: string;
}

interface AdminProfileModalProps {
  open: boolean;
  initial: AdminProfileData;
  onClose: () => void;
  onSaved: (profile: { name: string; avatar: string }) => void;
}

export default function AdminProfileModal({ open, initial, onClose, onSaved }: AdminProfileModalProps) {
  const { showToast } = useToast();
  const [name, setName] = useState(initial.name);
  const [avatar, setAvatar] = useState(initial.avatar);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initial.name);
    setAvatar(initial.avatar);
    setError("");
    setSaving(false);
  }, [open, initial.name, initial.avatar]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  const save = async () => {
    if (saving) return;
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("الاسم لازم يكون حرفين على الأقل");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, avatar }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? "تعذّر حفظ البيانات");
        return;
      }
      showToast("تم تحديث بيانات الحساب");
      onSaved({ name: data.data.name, avatar: data.data.avatar ?? "" });
      onClose();
    } catch {
      setError("تعذّر الاتصال بالسيرفر — جرّب تاني");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" dir="rtl">
      <div
        className="absolute inset-0 bg-[#26352B]/45 backdrop-blur-[2px]"
        onClick={() => { if (!saving) onClose(); }}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="بيانات حساب المدير"
        className="relative w-full max-w-[420px] overflow-hidden rounded-[22px] border border-[#E6E1D5] bg-[#F8F6F1] shadow-[0_24px_60px_-20px_rgba(38,53,43,0.45)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#ECE7DC] px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-[14px] font-black text-[#333B2E]">
              <UserRound className="h-4 w-4 text-[#50604D]" />
              بيانات حساب المدير
            </h2>
            <p className="mt-1 text-[10.5px] font-semibold text-[#9A9C90]">
              الاسم والصورة بيظهروا في هيدر لوحة التحكم
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="إغلاق"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E7E2D6] bg-white text-[#6B7264] transition-colors hover:bg-[#EFECE3] disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          {initial.email && (
            <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[#E9E5DA] bg-[#FBF9F6] px-3.5 py-2.5">
              <span className="flex min-w-0 items-center gap-1.5 text-[11.5px] font-bold text-[#8F9186]">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate" dir="ltr">{initial.email}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#EAF1E4] px-2 py-0.5 text-[10px] font-black text-[#3F5A46]">
                <ShieldCheck className="h-3 w-3" />
                {initial.role === "admin" ? "مدير النظام" : initial.role}
              </span>
            </div>
          )}

          <ImageUpload
            value={avatar}
            onChange={setAvatar}
            shape="circle"
            folder="rozmaly/admins"
            label="الصورة الشخصية"
            hint="صورة مربعة أو دائرية، أقل من 8 ميجا"
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#8F9186]" htmlFor="admin-profile-name">
              الاسم المعروض
            </label>
            <input
              id="admin-profile-name"
              value={name}
              onChange={(e) => { setName(e.target.value); if (error) setError(""); }}
              maxLength={60}
              placeholder="مثال: محمد هشام"
              className="w-full rounded-[12px] border border-[#E3DED1] bg-white px-3.5 py-2.5 text-[13px] font-bold text-[#333B2E] placeholder:text-[#B4B6AB] focus:border-[#8FA184] focus:outline-none focus:ring-2 focus:ring-[#50604D]/15"
            />
          </div>

          {error && (
            <p className="rounded-[10px] border border-[#F3D9D9] bg-[#FDF1F1] px-3 py-2 text-[11.5px] font-bold text-[#B0503F]">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 border-t border-[#ECE7DC] bg-[#FBF9F6] px-5 py-4">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#50604D] px-5 py-2.5 text-[12.5px] font-bold text-white transition-colors hover:bg-[#435241] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري الحفظ...</> : "حفظ التعديلات"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full border border-[#DDD8CA] bg-white px-5 py-2.5 text-[12.5px] font-bold text-[#6B7264] transition-colors hover:bg-[#F1EEE7] disabled:opacity-50"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
