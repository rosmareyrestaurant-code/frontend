import { NextRequest } from "next/server";
import mongoose from "mongoose";


export const instant = false;
export async function GET(_req: NextRequest) {
  const dbState = mongoose.connection.readyState;
  // 0=disconnected 1=connected 2=connecting 3=disconnecting
  const dbStatus = ["disconnected", "connected", "connecting", "disconnecting"][dbState] ?? "unknown";

  return Response.json({
    success: true,
    data: {
      status: "ok",
      db: dbStatus,
      env: process.env.NODE_ENV,
    },
  });
}
