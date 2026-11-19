/**
 * اختبار اتصال MongoDB بنفس الطريقة التي يستخدمها Next.js (family:4, بدون dns.setServers).
 * التشغيل: node scripts/test-mongodb.mjs
 */
import mongoose from "mongoose";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

const uri = process.env.MONGODB_URI;
if (!uri) { console.error("FAIL: MONGODB_URI missing"); process.exit(1); }

console.log("--- MongoDB Connection Test (dev DNS patch + family:4) ---");

// محاكاة ensureDnsForDev()
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

try {
  console.log("Connecting...");
  await mongoose.connect(uri, {
    bufferCommands: false,
    family: 4,
    serverSelectionTimeoutMS: 10_000,
  });
  console.log("✅ Connected successfully");

  // اختبار قراءة حقيقية
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log(`✅ Collections found: ${collections.map(c => c.name).join(", ") || "(empty)"}`);

  await mongoose.disconnect();
  console.log("✅ Disconnected cleanly");
  console.log("\n✅ MONGODB_TEST_PASSED");
  process.exit(0);
} catch (err) {
  console.error("❌ Connection failed:", err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
}
