/**
 * Seed script: ينشئ أو يحدّث أول حساب أدمن من متغيرات البيئة.
 * التشغيل:  npm run seed:admin
 * يقرأ القيم من .env.local تلقائياً.
 * لا يطبع كلمة المرور أبداً.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dns from "node:dns";

// استخدم Google DNS لتجاوز مشكلة SRV على Windows
// السكربتات تعمل محلياً فقط. dns.setServers يحل مشكلة SRV lookup على Windows.
// لا يؤثر على إنتاج Vercel لأن السكربتات لا تُشغَّل هناك.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const __dirname = dirname(fileURLToPath(import.meta.url));

// تحميل .env.local
const envPath = join(__dirname, "..", ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

const uri = process.env.MONGODB_URI;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || "مدير روزماري";

if (!uri || !email || !password) {
  console.error("خطأ: تأكد من ضبط MONGODB_URI و ADMIN_EMAIL و ADMIN_PASSWORD داخل .env.local");
  process.exit(1);
}

const adminSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true, trim: true },
    passwordHash: String,
    role: { type: String, default: "admin" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

try {
  console.log("🔄 جاري الاتصال بـ MongoDB...");
  await mongoose.connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 15000 });
  console.log("✅ اتصال MongoDB ناجح");

  const hash = await bcrypt.hash(password, 10);
  const existing = await Admin.findOne({ email: email.toLowerCase() });
  if (existing) {
    existing.name = name;
    existing.passwordHash = hash;
    existing.isActive = true;
    await existing.save();
    console.log("✅ تم تحديث حساب الأدمن:", email);
  } else {
    await Admin.create({ name, email: email.toLowerCase(), passwordHash: hash });
    console.log("✅ تم إنشاء حساب الأدمن:", email);
  }
  await mongoose.disconnect();
  process.exit(0);
} catch (err) {
  console.error("❌ فشل:", err?.message ?? err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
}
