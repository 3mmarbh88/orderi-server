# Orderi Server + Supabase

هذا هو backend مستقل لتطبيق Orderi.

## المعمارية

Android/Web Orderi
        |
        v
orderi-server (Node/Express)
        |
        +---- SSE / Webhooks / Android notifications
        |
        +---- Supabase Postgres (persistent data)
        |
        +---- Gemini (optional)

### لماذا ليس Supabase وحده؟
تطبيق Orderi يحتاج SSE واتصالاً طويل العمر ومسارات webhook وطبقة معالجة فورية.
Supabase هنا هو قاعدة البيانات/البنية الدائمة، بينما `orderi-server` هو طبقة الـAPI.

## 1) إنشاء قاعدة البيانات

افتح Supabase SQL Editor والصق `schema.sql` بالكامل ثم Run.

Project URL:
https://mczxrgjuelqjmxbtzbxj.supabase.co

## 2) مفاتيح Supabase

من Supabase Dashboard:
Settings -> API Keys

أنشئ/انسخ Secret key (`sb_secret_...`) وضعه في `.env` باسم:

SUPABASE_SECRET_KEY=

لا تضع Secret key داخل APK أو GitHub.

## 3) تشغيل محلي

```powershell
cd C:\Projects\orderi-server
npm install
Copy-Item .env.example .env
notepad .env
npm run dev
```

اختبار:

http://localhost:3000/api/health

## 4) نشر Render

Build Command:
```text
npm install && npm run build
```

Start Command:
```text
npm start
```

Environment:
```text
NODE_ENV=production
SUPABASE_URL=https://mczxrgjuelqjmxbtzbxj.supabase.co
SUPABASE_SECRET_KEY=YOUR_SECRET_KEY
CORS_ORIGIN=*
PORT=10000
```

Render يوفر PORT تلقائياً؛ الكود يقرأه.

## 5) مسارات Orderi المدعومة

GET  /api/health
GET  /api/whatsapp/status
GET  /api/whatsapp/recent
GET  /api/whatsapp/discovered-groups
GET  /api/whatsapp/stream

POST /api/whatsapp/webhook
POST /api/orders/webhook
POST /api/android/notifications

GET  /api/android/listener-config

GET  /api/whatsapp/session
POST /api/whatsapp/session/refresh-qr
POST /api/whatsapp/session/pair
POST /api/whatsapp/session/disconnect

POST /api/whatsapp/broadcast-reply
POST /api/ai/evaluate-match

## ملاحظة WhatsApp

مسار QR الموجود هنا هو طبقة جلسة/حالة للرادار، وليس ادعاءً بأنه يربط WhatsApp الحقيقي تلقائياً.
للسحب الحقيقي من WhatsApp يجب أن يكون هناك مصدر رسائل حقيقي، مثل Android Notification Listener/Tasker/MacroDroid أو WhatsApp gateway منفصل.
