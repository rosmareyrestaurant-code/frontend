import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AdminModel } from "@/models/Admin";
import { success, badRequest, serverError, AppError } from "@/lib/api-response";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { cashierAccountSchema } from "@/lib/validation";

export const instant = false;

const CASHIER_SELECT = { name: 1, email: 1, isActive: 1 };

export async function GET() {
  try {
    await requireAdmin();
    await connectToDatabase();
    const cashier = await AdminModel.findOne({ role: "cashier" }).select(CASHIER_SELECT).lean();
    return success(
      cashier
        ? {
            id: String(cashier._id),
            name: cashier.name,
            email: cashier.email,
            isActive: cashier.isActive,
          }
        : null,
    );
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    console.error("[GET /api/admin/cashier]", e);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = cashierAccountSchema.safeParse(body);
    if (!parsed.success)
      return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");

    const { name, email, password, isActive } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    await connectToDatabase();
    const existing = await AdminModel.findOne({ role: "cashier" });

    const emailTaken = await AdminModel.findOne({
      email: normalizedEmail,
      ...(existing ? { _id: { $ne: existing._id } } : {}),
    }).lean();
    if (emailTaken) return badRequest("البريد الإلكتروني مستخدم بالفعل");

    if (!existing) {
      if (!password) return badRequest("لازم تحدد كلمة مرور للكاشير");
      const created = await AdminModel.create({
        name,
        email: normalizedEmail,
        passwordHash: await hashPassword(password),
        role: "cashier",
        isActive,
      });
      return success(
        {
          id: String(created._id),
          name: created.name,
          email: created.email,
          isActive: created.isActive,
        },
        "تم إنشاء حساب الكاشير",
      );
    }

    existing.name = name;
    existing.email = normalizedEmail;
    existing.isActive = isActive;
    if (password) existing.passwordHash = await hashPassword(password);
    await existing.save();

    return success(
      {
        id: String(existing._id),
        name: existing.name,
        email: existing.email,
        isActive: existing.isActive,
      },
      "تم تحديث حساب الكاشير",
    );
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    console.error("[POST /api/admin/cashier]", e);
    return serverError();
  }
}
