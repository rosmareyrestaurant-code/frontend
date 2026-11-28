import mongoose from "mongoose";
import dns from "node:dns";

/**
 * على بعض البيئات يفشل DNS lookup لـ MongoDB Atlas SRV records
 * بسبب إعدادات الـ system resolver. نضبط Google DNS مرة واحدة كحل احتياطي
 * (شغّال في dev وكمان في build المحلي عشان الصفحات الثابتة).
 */
let dnsPatched = false;
function ensureDnsForDev() {
  if (dnsPatched) return;
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
    dnsPatched = true;
  } catch {
    /* ignore — ليس ضرورياً على كل بيئة */
  }
}

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
if (!global.mongooseCache) global.mongooseCache = cached;

/**
 * سيرفرلس: كل نسخة دالة تعيش فترة وبتفتح اتصالاتها. الافتراضي في mongoose
 * (100 اتصال للنسخة) بيخلّي 5 نسخ بس تقفل حد Atlas المشترك (500 اتصال)،
 * فأي دفعة زوار بتوقع الاتصال. سقف 5 اتصالات للنسخة بيمنع الازدحام ده.
 */
const CONNECT_OPTIONS = {
  bufferCommands: false,
  family: 4 as const,
  maxPoolSize: 5,
  maxConnecting: 2,
  maxIdleTimeMS: 60_000,
  connectTimeoutMS: 8_000,
  socketTimeoutMS: 45_000,
  // 8 ثواني لكل محاولة × 3 محاولات على مستوى الطلب (في orders API) تفضل
  // داخل حد 30 ثانية، فطلب فاشل بيرجع رسالة واضحة بدل ما يتقطع بـ timeout.
  serverSelectionTimeoutMS: 8_000,
  waitQueueTimeoutMS: 8_000,
};

/**
 * في التطوير على Windows قد يفشل مشغّل MongoDB في حل SRV رغم ضبط DNS،
 * فنحوّل الـ URI إلى قائمة سيرفرات مباشرة (مع خيارات TXT) باستخدام Node DNS،
 * مع إعادة محاولة قصيرة ثم DNS-over-HTTPS كخطة أخيرة.
 */
type SrvRecord = { name: string; port: number };

async function resolveSrvDev(host: string): Promise<SrvRecord[]> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await dns.promises.resolve(`_mongodb._tcp.${host}`, "SRV");
    } catch (err) {
      lastErr = err;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  try {
    return await resolveSrvViaDoH(`_mongodb._tcp.${host}`);
  } catch {
    throw lastErr;
  }
}

async function resolveTxtDev(host: string): Promise<string[][]> {
  try {
    return await dns.promises.resolve(host, "TXT");
  } catch {
    try {
      return [[await resolveTxtViaDoH(host)]];
    } catch {
      return [];
    }
  }
}

type DoHAnswer = { type: number; data: string };

async function dohQuery(name: string, type: "SRV" | "TXT"): Promise<DoHAnswer[]> {
  const providers = [
    `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`,
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
  ];

  let lastErr: unknown;
  for (const url of providers) {
    try {
      const res = await fetch(url, { headers: { accept: "application/dns-json" } });
      if (!res.ok) throw new Error(`DoH ${res.status}`);
      const json = (await res.json()) as { Answer?: DoHAnswer[] };
      return json.Answer ?? [];
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

async function resolveSrvViaDoH(name: string): Promise<SrvRecord[]> {
  const answers = await dohQuery(name, "SRV");
  const records = answers
    .filter((answer) => answer.type === 33)
    .map((answer) => {
      const parts = answer.data.trim().split(/\s+/);
      return { name: (parts[3] ?? "").replace(/\.$/, ""), port: Number(parts[2]) };
    })
    .filter((record) => record.name && Number.isFinite(record.port));

  if (records.length === 0) throw new Error("DoH SRV بدون نتائج");
  return records;
}

async function resolveTxtViaDoH(name: string): Promise<string> {
  const answers = await dohQuery(name, "TXT");
  return answers
    .filter((answer) => answer.type === 16)
    .map((answer) => answer.data.replace(/^"|"$/g, "").replace(/\\"/g, '"').replace(/"/g, "").replace(/\\\\/g, "\\"))
    .join("");
}

async function toDirectUri(srvUri: string): Promise<string> {
  const match = /^mongodb\+srv:\/\/([^@]+)@([^/?]+)(\/[^?]*)?(\?.*)?$/.exec(srvUri);
  if (!match) throw new Error("صيغة MONGODB_URI غير مدعومة للتحويل المباشر");

  const [, userinfo, host, path = "/", search = ""] = match;
  const records = await resolveSrvDev(host);
  const txt = await resolveTxtDev(host);
  const txtOptions = txt.map((chunks) => chunks.join("")).join("&");
  const hosts = records.map((record) => `${record.name}:${record.port}`).join(",");
  const base = [search.replace(/^\?/, ""), txtOptions].filter(Boolean).join("&");
  const params = [
    base,
    /authSource=/.test(base) ? "" : "authSource=admin",
    /(?:tls|ssl)=/.test(base) ? "" : "tls=true",
  ].filter(Boolean).join("&");

  return `mongodb://${userinfo}@${hosts}${path}?${params}`;
}

async function connectMongo(): Promise<typeof mongoose> {
  try {
    return await mongoose.connect(MONGODB_URI as string, CONNECT_OPTIONS);
  } catch (err) {
    if (!/querySrv/i.test((err as Error).message)) throw err;
    const directUri = await toDirectUri(MONGODB_URI as string);
    return await mongoose.connect(directUri, CONNECT_OPTIONS);
  }
}


export async function connectToDatabase(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI غير مضبوط — أضفه في .env.local");
  }

  ensureDnsForDev();

  // الاتصال المحفوظ قد يكون اتقطع (serverless بيجمّد الدالة) — لازم نتأكد إنه فعلاً متصل
  const state = mongoose.connection.readyState;
  if (state === 1 && cached.conn) return cached.conn;
  if (state === 2) {
    // فيه محاولة اتصال جارية بالفعل — نستناها بدل ما نفتح واحدة جديدة
    await mongoose.connection.asPromise();
    cached.conn = mongoose;
    return cached.conn;
  }
  if (state !== 1) {
    cached.conn = null;
    cached.promise = null;
  }

  // محاولة واحدة هنا — إعادة المحاولة بتكون على مستوى الطلب (orders API)
  // عشان ما يحصلش تداخل يضاعف وقت الانتظار.
  if (!cached.promise) {
    cached.promise = connectMongo();
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export default connectToDatabase;
