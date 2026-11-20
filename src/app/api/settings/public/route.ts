import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { StoreSettingsModel } from "@/models/StoreSettings";
import { success, serverError, withPublicCache } from "@/lib/api-response";
import { toPublicSettings } from "@/lib/serialize";


export const instant = false;
export async function GET(_req: NextRequest) {
  try {
    await connectToDatabase();
    const settings = await StoreSettingsModel.findOne().lean();
    if (!settings) {
      // إعدادات افتراضية لو ما اتعملش seed بعد
      return withPublicCache(success({
        storeName: "Rosemary",
        storeDescription: "",
        phone: "",
        email: "",
        address: "",
        logoUrl: "/images/logo-rosemary-green.png",
        currency: "EGP",
        deliveryFee: 0,
        minimumOrder: 0,
        estimatedDeliveryTime: "30-45",
        isStoreOpen: true,
        closedMessage: "",
        vodafoneCashNumber: "",
        instapayAccount: "",
        latitude: 0,
        longitude: 0,
        googleMapsUrl: "",
        workingHours: [],
        socialLinks: { facebook: "", instagram: "", tiktok: "", whatsapp: "" },
        galleryImages: [],
      }));
    }
    return withPublicCache(success(toPublicSettings(settings as Parameters<typeof toPublicSettings>[0])));
  } catch (e) {
    console.error("[GET /api/settings/public]", e);
    return serverError();
  }
}
