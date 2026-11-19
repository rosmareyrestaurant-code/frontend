import { NextRequest } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { success } from "@/lib/api-response";


export const instant = false;
export async function POST(_req: NextRequest) {
  await clearSessionCookie();
  return success(null, "تم تسجيل الخروج");
}
