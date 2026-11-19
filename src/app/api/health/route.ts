import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";


export const instant = false;
export async function GET(_req: NextRequest) {
  let dbStatus = "disconnected";
  try {
    await connectToDatabase();
    const dbState = mongoose.connection.readyState;
    // 0=disconnected 1=connected 2=connecting 3=disconnecting
    dbStatus = ["disconnected", "connected", "connecting", "disconnecting"][dbState] ?? "unknown";
  } catch {
    dbStatus = "error";
  }

  return Response.json({
    success: dbStatus === "connected",
    data: {
      status: dbStatus === "connected" ? "ok" : "degraded",
      db: dbStatus,
      env: process.env.NODE_ENV,
    },
  });
}
