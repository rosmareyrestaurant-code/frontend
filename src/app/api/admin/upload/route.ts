/**
 * DELETE /api/admin/upload
 * يحذف صورة من Cloudinary عبر public_id.
 * يُستدعى من الأدمن عند حذف منتج أو تغيير صورته.
 */
import { NextRequest } from "next/server";
import { success, badRequest, serverError, AppError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { deleteImage } from "@/lib/cloudinary";
import { z } from "zod";


export const instant = false;
const bodySchema = z.object({
  publicId: z.string().min(1, "public_id مطلوب"),
});

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success)
      return badRequest(parsed.error.issues[0]?.message ?? "public_id مطلوب");

    await deleteImage(parsed.data.publicId);
    return success(null, "تم حذف الصورة");
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    console.error("[DELETE /api/admin/upload]", e);
    return serverError();
  }
}
