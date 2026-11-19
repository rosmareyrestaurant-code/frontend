import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { StoreSettingsModel } from "@/models/StoreSettings";
import { success, badRequest, serverError, AppError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { toStoreSettings } from "@/lib/serialize";
import { storeSettingsSchema } from "@/lib/validation";


export const instant = false;
export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();
    let settings = await StoreSettingsModel.findOne().lean();
    if (!settings) {
      settings = await StoreSettingsModel.create({});
    }
    return success(toStoreSettings(settings as Parameters<typeof toStoreSettings>[0]));
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    return serverError();
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = storeSettingsSchema.safeParse(body);
    if (!parsed.success)
      return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");

    await connectToDatabase();
    const updated = await StoreSettingsModel.findOneAndUpdate(
      {},
      { $set: parsed.data },
      { new: true, upsert: true },
    ).lean();

    return success(
      toStoreSettings(updated as Parameters<typeof toStoreSettings>[0]),
      "تم حفظ الإعدادات",
    );
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    console.error("[PATCH /api/admin/settings]", e);
    return serverError();
  }
}
