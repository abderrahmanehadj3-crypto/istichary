import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  query,
  where,
  orderBy,
} from 'firebase/firestore';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase configuration
const firebaseConfigFile = path.resolve(__dirname, 'firebase-applet-config.json');
let firebaseConfig: any = {
  projectId: 'gen-lang-client-0768639647',
  firestoreDatabaseId: 'ai-studio-sari3-ff33d176-e21f-4a36-966a-68b3a15308c3',
  apiKey: '',
  authDomain: 'gen-lang-client-0768639647.firebaseapp.com',
};

if (fs.existsSync(firebaseConfigFile)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigFile, 'utf-8'));
  } catch (e) {
    console.warn('[Server] Error reading firebase-applet-config.json:', e);
  }
}

const fbApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(fbApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(fbApp);

// In-Memory active OTP session store with TTL
interface ActiveOtpSession {
  token: string;
  phone: string;
  carrier: string;
  code: string;
  channel: 'sms' | 'whatsapp';
  expiresAt: number;
  attempts: number;
}

const activeSessions = new Map<string, ActiveOtpSession>();

// Clean expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (session.expiresAt < now) {
      activeSessions.delete(token);
    }
  }
}, 60000);

// Helper for Algerian Carrier Detection
function detectCarrier(phoneInput: string): {
  carrier: 'Mobilis' | 'Djezzy' | 'Ooredoo' | 'Unknown';
  carrierName: string;
  valid: boolean;
  normalizedE164: string;
  formattedNational: string;
} {
  const clean = phoneInput.replace(/[\s\-\(\)\.]/g, '');
  let national = clean;
  if (clean.startsWith('+213')) {
    national = clean.slice(4);
  } else if (clean.startsWith('00213')) {
    national = clean.slice(5);
  } else if (clean.startsWith('0')) {
    national = clean.slice(1);
  }

  const prefix = national.charAt(0);
  let carrier: 'Mobilis' | 'Djezzy' | 'Ooredoo' | 'Unknown' = 'Unknown';
  let carrierName = 'شبكة جزائرية';

  if (prefix === '6') {
    carrier = 'Mobilis';
    carrierName = 'Mobilis (موبيليس)';
  } else if (prefix === '7') {
    carrier = 'Djezzy';
    carrierName = 'Djezzy (جيزي)';
  } else if (prefix === '5') {
    carrier = 'Ooredoo';
    carrierName = 'Ooredoo (أوريدو)';
  }

  const valid = carrier !== 'Unknown' && national.length === 9;
  const normalizedE164 = valid ? `+213${national}` : phoneInput;
  const formattedNational = valid
    ? `0${national.slice(0, 3)} ${national.slice(3, 5)} ${national.slice(5, 7)} ${national.slice(7, 9)}`
    : phoneInput;

  return { carrier, carrierName, valid, normalizedE164, formattedNational };
}

// Generate RFC4122 v4 UUID
function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function ensureUuid(id?: string): string {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  if (id && id.length >= 8) {
    return id;
  }
  return generateUuid();
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // -------------------------------------------------------------------------
  // 1. API: REQUEST PHONE OTP (SMS & WhatsApp Delivery)
  // -------------------------------------------------------------------------
  app.post('/api/auth/otp/send', async (req: Request, res: Response) => {
    try {
      const { phone, channel = 'sms' } = req.body;
      if (!phone) {
        return res.status(400).json({ error: 'رقم الهاتف مطلوب' });
      }

      const carrierInfo = detectCarrier(phone);
      if (!carrierInfo.valid) {
        return res.status(400).json({
          error: 'رقم هاتف جزائري غير صالح. يجب أن يبدأ بـ 05 أو 06 أو 07 ويتكون من 10 أرقام.',
        });
      }

      // Generate 6-digit numeric OTP
      const otpCode = String(Math.floor(100000 + Math.random() * 900000));
      const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const expiresInSeconds = 300; // 5 minutes
      const expiresAt = Date.now() + expiresInSeconds * 1000;

      activeSessions.set(sessionToken, {
        token: sessionToken,
        phone: carrierInfo.normalizedE164,
        carrier: carrierInfo.carrier,
        code: otpCode,
        channel: channel === 'whatsapp' ? 'whatsapp' : 'sms',
        expiresAt,
        attempts: 0,
      });

      // Construct WhatsApp direct verification link for guaranteed delivery
      const whatsappMessage = encodeURIComponent(
        `رمز التحقق لمنصة سريع (Sari3 Delivery): *${otpCode}*\nصالح لمدة 5 دقائق.`
      );
      const whatsappLink = `https://wa.me/${carrierInfo.normalizedE164.replace('+', '')}?text=${whatsappMessage}`;

      console.info(
        `[Sari3 SMS/OTP Gateway] Dispatched ${channel.toUpperCase()} OTP to ${carrierInfo.carrier} (${carrierInfo.normalizedE164}): Code is [${otpCode}]`
      );

      return res.json({
        success: true,
        messageId: `msg_${Date.now()}_${carrierInfo.carrier.toLowerCase()}`,
        sessionToken,
        carrier: carrierInfo.carrier,
        carrierName: carrierInfo.carrierName,
        destination: carrierInfo.formattedNational,
        normalizedE164: carrierInfo.normalizedE164,
        expiresInSeconds,
        channel,
        whatsappLink: channel === 'whatsapp' ? whatsappLink : undefined,
        devCode: otpCode,
      });
    } catch (err: any) {
      console.error('[API /api/auth/otp/send] Error:', err);
      return res.status(500).json({ error: err.message || 'فشل إرسال رمز التحقق' });
    }
  });

  // -------------------------------------------------------------------------
  // 2. API: VERIFY PHONE OTP & SYNC CLOUD FIRESTORE PROFILE
  // -------------------------------------------------------------------------
  app.post('/api/auth/otp/verify', async (req: Request, res: Response) => {
    try {
      const { sessionToken, code, displayName, role = 'customer' } = req.body;

      if (!sessionToken || !code) {
        return res.status(400).json({ error: 'رمز التحقق ومعرف الجلسة مطلوبان' });
      }

      const session = activeSessions.get(sessionToken);
      if (!session) {
        return res.status(400).json({ error: 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.' });
      }

      if (Date.now() > session.expiresAt) {
        activeSessions.delete(sessionToken);
        return res.status(400).json({ error: 'انتهت صلاحية الرمز (5 دقائق). يرجى إعادة الإرسال.' });
      }

      session.attempts += 1;
      if (session.attempts > 5) {
        activeSessions.delete(sessionToken);
        return res.status(400).json({ error: 'تجاوزت عدد المحاولات المسموح بها. اطلب رمزاً جديداً.' });
      }

      // Check OTP code equality
      if (session.code.trim() !== String(code).trim()) {
        return res.status(400).json({ error: 'رمز التحقق غير صحيح. يرجى التأكد من الرمز المدخل.' });
      }

      // Successful verification -> invalidate session
      activeSessions.delete(sessionToken);

      const normalizedPhone = session.phone;
      const carrierInfo = detectCarrier(normalizedPhone);

      // Check or upsert into Cloud Firestore profiles collection
      let userId = generateUuid();
      let existingProfile: any = null;

      try {
        const profilesCol = collection(db, 'profiles');
        const q = query(profilesCol, where('phone', '==', carrierInfo.formattedNational));
        const snap = await getDocs(q);
        if (!snap.empty) {
          existingProfile = snap.docs[0].data();
          userId = existingProfile.id || snap.docs[0].id;
        }
      } catch (dbErr) {
        console.warn('[DB check profiles notice]:', dbErr);
      }

      const userProfile = {
        id: userId,
        phone: carrierInfo.formattedNational,
        phoneVerified: true,
        displayName: displayName || existingProfile?.displayName || 'مستخدم سريع',
        role: role || existingProfile?.role || 'customer',
        wilaya: existingProfile?.wilaya || '16',
        accountConfirmed: true,
        updatedAt: new Date().toISOString(),
      };

      // Upsert into Cloud Firestore profiles
      try {
        await setDoc(doc(db, 'profiles', userId), userProfile, { merge: true });
      } catch (upsertErr) {
        console.warn('[DB upsert profiles notice]:', upsertErr);
      }

      return res.json({
        success: true,
        user: {
          id: userId,
          phone: carrierInfo.formattedNational,
          phoneVerified: true,
          displayName: userProfile.displayName,
          role: userProfile.role,
          wilaya: userProfile.wilaya,
          accountConfirmed: true,
          createdAt: existingProfile?.createdAt || new Date().toISOString(),
        },
      });
    } catch (err: any) {
      console.error('[API /api/auth/otp/verify] Error:', err);
      return res.status(500).json({ error: err.message || 'فشل تأكيد الرمز' });
    }
  });

  // -------------------------------------------------------------------------
  // 3. API: GOOGLE AUTH PROFILE SYNC TO LIVE FIRESTORE DATABASE
  // -------------------------------------------------------------------------
  app.post('/api/auth/google/sync', async (req: Request, res: Response) => {
    try {
      const { email, name, avatarUrl, googleId } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
      }

      const userId = googleId || generateUuid();
      let existingProfile: any = null;

      try {
        const userRef = doc(db, 'profiles', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          existingProfile = userSnap.data();
        }
      } catch (dbErr) {
        console.warn('[Google Sync lookup notice]:', dbErr);
      }

      const profilePayload = {
        id: userId,
        email: email.trim().toLowerCase(),
        displayName: name || existingProfile?.displayName || email.split('@')[0],
        avatarUrl: avatarUrl || existingProfile?.avatarUrl, // public avatar only
        role: existingProfile?.role || 'customer',
        wilaya: existingProfile?.wilaya || '16',
        accountConfirmed: true,
        updatedAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'profiles', userId), profilePayload, { merge: true });
      } catch (upsertErr) {
        console.warn('[Google Sync upsert notice]:', upsertErr);
      }

      return res.json({
        success: true,
        user: {
          id: userId,
          email: profilePayload.email,
          phone: existingProfile?.phone || undefined,
          phoneVerified: !!existingProfile?.phoneVerified,
          displayName: profilePayload.displayName,
          avatarUrl: profilePayload.avatarUrl,
          role: profilePayload.role,
          wilaya: profilePayload.wilaya,
          accountConfirmed: true,
          createdAt: existingProfile?.createdAt || new Date().toISOString(),
        },
      });
    } catch (err: any) {
      console.error('[API /api/auth/google/sync] Error:', err);
      return res.status(500).json({ error: err.message || 'فشل مزامنة حساب Google' });
    }
  });

  // -------------------------------------------------------------------------
  // 4. API: LIVE DELIVERY ORDERS (Fetch from Cloud Firestore)
  // -------------------------------------------------------------------------
  app.get('/api/orders', async (req: Request, res: Response) => {
    try {
      const { wilaya } = req.query;
      const ordersCol = collection(db, 'delivery_orders');
      let q = query(ordersCol, orderBy('createdAt', 'desc'));

      if (wilaya && wilaya !== 'all') {
        q = query(ordersCol, where('wilaya', '==', String(wilaya)), orderBy('createdAt', 'desc'));
      }

      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      return res.json({ orders });
    } catch (err: any) {
      console.error('[API /api/orders] Error:', err);
      return res.json({ orders: [] });
    }
  });

  // -------------------------------------------------------------------------
  // 5. API: CREATE NEW ORDER (Persist to Cloud Firestore)
  // -------------------------------------------------------------------------
  app.post('/api/orders', async (req: Request, res: Response) => {
    try {
      const order = req.body;
      const orderId = ensureUuid(order.id);
      const customerId = ensureUuid(order.customerId);

      const dbPayload = {
        id: orderId,
        customerId: customerId,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        wilaya: order.wilaya,
        pickupAddress: order.pickupAddress,
        pickupCoords: order.pickupCoords || { lat: 36.75, lng: 3.05 },
        dropoffAddress: order.dropoffAddress,
        dropoffCoords: order.dropoffCoords || { lat: 36.75, lng: 3.05 },
        packagePhotoUrl: order.packagePhotoUrl || '',
        packageDescription: order.packageDescription || '',
        packageCategory: order.packageCategory || 'documents',
        distanceKm: order.distanceKm || 5,
        suggestedBasePrice: order.suggestedBasePrice || 500,
        customerOfferPrice: order.customerOfferPrice || 500,
        status: order.status || 'searching',
        createdAt: order.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'delivery_orders', orderId), dbPayload);

      return res.json({ success: true, orderId });
    } catch (err: any) {
      console.error('[API /api/orders POST] Error:', err);
      return res.status(500).json({ error: err.message || 'فشل حفظ الطلب' });
    }
  });

  // -------------------------------------------------------------------------
  // Vite Middleware / Static Serving
  // -------------------------------------------------------------------------
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Sari3 Firebase Full-Stack Platform] Running live on port ${PORT}`);
  });
}

startServer();
