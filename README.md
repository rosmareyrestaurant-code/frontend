# روزماري

مشروع Next.js لموقع مطعم روزماري. الدومين الرسمي: `https://rozemary.net`

## التشغيل محلياً

```bash
npm install
cp .env.example .env.local   # ثم عدّل القيم حسب بيئتك
npm run dev
```

افتح `http://localhost:3000`.

## الأوامر المتاحة

- `npm run dev` — تشغيل خادم التطوير.
- `npm run build` — بناء نسخة الإنتاج.
- `npm run start` — تشغيل نسخة الإنتاج محلياً.
- `npm run typecheck` — فحص TypeScript.
- `npm run lint` — فحص ESLint.
- `npm run seed:admin` — إنشاء/تحديث مستخدم الأدمن (محلياً فقط).
- `npm run seed:data` — زرع بيانات تجريبية (محلياً فقط).

## الاستضافة على Hostinger VPS

الموقع مستضاف على Hostinger VPS في المجلد `/var/www/rosemary`. النشر يتم كالتالي:

```bash
cd /var/www/rosemary
git pull --ff-only origin main
npm run build
pm2 restart rosemary --update-env
```

التحقق بعد النشر:

```bash
pm2 status
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/api/health
```

nginx يوجّه `rozemary.net` و`www.rozemary.net` إلى التطبيق على المنفذ `3000`.

## متغيرات البيئة

راجع `.env.example` للقيم المطلوبة. من أهمها:

- `MONGODB_URI` — اتصال MongoDB Atlas.
- `APP_URL` و`NEXT_PUBLIC_SITE_URL` — الدومين الرسمي `https://rozemary.net`.

لا تضيف متغيرات خاصة بمنصات أخرى؛ التطبيق يعمل على خادم Hostinger فقط.
