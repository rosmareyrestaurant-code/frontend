/**
 * تكامل Cloudinary لتخزين الصور.
 * - الـ API secret لا يُرسل أبداً للمتصفح.
 * - السيرفر يوقّع طلبات الرفع، والمتصفح يرفع مباشرة إلى Cloudinary.
 * - حذف الصور القديمة يتم من السيرفر فقط (للأدمن).
 */
import { v2 as cloudinary } from "cloudinary";
import { AppError } from "./api-response";

let configured = false;

function configureCloudinary() {
  if (configured) return;
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud_name || !api_key || !api_secret) {
    throw new AppError(
      "SERVER_ERROR",
      "إعدادات Cloudinary غير مكتملة على السيرفر",
      500,
    );
  }
  cloudinary.config({ cloud_name, api_key, api_secret });
  configured = true;
}

export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadUrl: string;
}

/** يولّد توقيع رفع للعميل (المتصفح يرفع مباشرة إلى Cloudinary) */
export function signUpload(folder: string): UploadSignature {
  configureCloudinary();
  const timestamp = Math.floor(Date.now() / 1000);
  // التوقيع يشمل كل البارامترات ما عدا file/signature/api_key/cloud_name
  const paramsToSign: Record<string, string | number> = { timestamp, folder };
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET as string,
  );
  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
    folder,
    uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
  };
}

/** يحذف صورة من Cloudinary (best-effort) */
export async function deleteImage(publicId: string): Promise<void> {
  if (!publicId) return;
  configureCloudinary();
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("[cloudinary] delete failed:", e);
    }
  }
}

/** يولّد رابط محسّن (صيغة تلقائية + جودة تلقائية) من public_id */
export function optimizedUrl(publicId: string): string {
  configureCloudinary();
  return cloudinary.url(publicId, { fetch_format: "auto", quality: "auto" });
}
