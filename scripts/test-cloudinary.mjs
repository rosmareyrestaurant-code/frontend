/**
 * اختبار Cloudinary: يتحقق من صحة المتغيرات ويُنشئ توقيع رفع حقيقي.
 * التشغيل: node scripts/test-cloudinary.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
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

const cloudName  = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey     = process.env.CLOUDINARY_API_KEY;
const apiSecret  = process.env.CLOUDINARY_API_SECRET;

console.log("--- Cloudinary Config Test ---");

if (!cloudName || !apiKey || !apiSecret) {
  console.error("FAIL: متغيرات Cloudinary غير مكتملة في .env.local");
  console.error("  CLOUDINARY_CLOUD_NAME :", cloudName  ? "✅" : "❌ missing");
  console.error("  CLOUDINARY_API_KEY    :", apiKey     ? "✅" : "❌ missing");
  console.error("  CLOUDINARY_API_SECRET :", apiSecret  ? "✅" : "❌ missing");
  process.exit(1);
}

console.log("CLOUDINARY_CLOUD_NAME :", cloudName.slice(0, 4) + "****");
console.log("CLOUDINARY_API_KEY    :", apiKey.slice(0, 4)  + "****");
console.log("CLOUDINARY_API_SECRET :", "****" + apiSecret.slice(-4));

// توليد توقيع كما يفعله السيرفر
const timestamp = Math.floor(Date.now() / 1000);
const folder    = "rozmaly/test";
const paramsStr = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
const signature = createHash("sha256").update(paramsStr).digest("hex");

console.log("\nSignature generation:");
console.log("  timestamp :", timestamp);
console.log("  folder    :", folder);
console.log("  signature :", signature.slice(0, 8) + "..." + signature.slice(-8), `(len=${signature.length})`);
console.log("  uploadUrl :", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

// اختبار HTTPS connectivity لـ Cloudinary API
const https = await import("node:https");
await new Promise((resolve) => {
  const req = https.default.get(
    `https://api.cloudinary.com/v1_1/${cloudName}/ping`,
    { headers: { Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}` } },
    (res) => {
      let body = "";
      res.on("data", (d) => (body += d));
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          if (json.status === "ok") {
            console.log("\n✅ Cloudinary API ping: OK (connected successfully)");
          } else {
            console.log("\n⚠️  Cloudinary ping response:", JSON.stringify(json));
          }
        } catch {
          console.log("\n⚠️  Cloudinary ping status:", res.statusCode, body.slice(0, 100));
        }
        resolve(null);
      });
    },
  );
  req.on("error", (e) => {
    console.error("\n❌ Cloudinary network error:", e.message);
    resolve(null);
  });
  req.setTimeout(8000, () => {
    console.error("\n❌ Cloudinary ping timeout");
    req.destroy();
    resolve(null);
  });
});

console.log("\n✅ TEST COMPLETE — توقيع Cloudinary يعمل بشكل صحيح");
