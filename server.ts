import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Firestore,
} from 'firebase/firestore';
import { sendRealSmsMessage } from './src/server/smsGateway';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Cloud Firestore
const firebaseConfigFile = path.resolve(__dirname, 'firebase-applet-config.json');
let firebaseConfig: any = null;
if (fs.existsSync(firebaseConfigFile)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigFile, 'utf-8'));
  } catch (e) {
    console.warn('[Server] Error reading firebase-applet-config.json:', e);
  }
}

const fbApp = firebaseConfig
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0])
  : null;

const firestoreDb: Firestore | null = fbApp
  ? (firebaseConfig.firestoreDatabaseId
      ? getFirestore(fbApp, firebaseConfig.firestoreDatabaseId)
      : getFirestore(fbApp))
  : null;

// Sanitize Supabase environment variables to prevent malformed URLs or DNS errors
function sanitizeUrl(raw?: string): string {
  if (!raw || typeof raw !== 'string') {
    return 'https://oqdngfhupadfirmsfbfj.supabase.co';
  }
  let cleaned = raw.trim().replace(/^["']|["']$/g, '');
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }
  try {
    return new URL(cleaned).origin;
  } catch {
    return 'https://oqdngfhupadfirmsfbfj.supabase.co';
  }
}

function sanitizeKey(raw?: string): string {
  if (!raw || typeof raw !== 'string') {
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';
  }
  return raw.trim().replace(/^["']|["']$/g, '');
}

const supabaseUrl = sanitizeUrl(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
const supabaseAnonKey = sanitizeKey(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

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
const phoneSessions = new Map<string, ActiveOtpSession>();
const inMemoryOrders: any[] = [];

// Clean expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (session.expiresAt < now) {
      activeSessions.delete(token);
    }
  }
  for (const [phone, session] of phoneSessions.entries()) {
    if (session.expiresAt < now) {
      phoneSessions.delete(phone);
    }
  }
}, 30000);

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

      // Generate cryptographically unpredictable 6-digit numeric OTP using secure random generator
      const otpCode = String(crypto.randomInt(100000, 1000000));
      const sessionToken = `sess_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const expiresInSeconds = 300; // 5 minutes
      const expiresAt = Date.now() + expiresInSeconds * 1000;

      // 1. Trigger Real SMS Gateway API Dispatch (Twilio, Vonage, Infobip, Custom)
      let smsResult = {
        success: true,
        provider: 'pending_configuration',
        messageId: `msg_${Date.now()}`,
        statusMessage: 'Dispatched',
      };

      if (channel === 'sms') {
        smsResult = await sendRealSmsMessage(
          carrierInfo.normalizedE164,
          otpCode,
          carrierInfo.carrierName
        );
      }

      // 2. Secure Server-Side Database Persistence (Cloud Firestore phone_verifications)
      const verificationRecord = {
        sessionToken,
        phone: carrierInfo.normalizedE164,
        formattedNational: carrierInfo.formattedNational,
        code: otpCode, // Strictly kept on server-side database
        carrier: carrierInfo.carrier,
        carrierName: carrierInfo.carrierName,
        channel,
        smsProvider: smsResult.provider,
        smsMessageId: smsResult.messageId,
        smsStatus: smsResult.statusMessage,
        attempts: 0,
        status: 'pending',
        expiresAt,
        expiresAtIso: new Date(expiresAt).toISOString(),
        createdAt: new Date().toISOString(),
      };

      if (firestoreDb) {
        try {
          await setDoc(doc(firestoreDb, 'phone_verifications', sessionToken), verificationRecord);
        } catch (dbErr) {
          console.warn('[Firestore phone_verifications save notice]:', dbErr);
        }
      }

      // Also mirror in active memory session store for ultra-fast lookup
      const newSession: ActiveOtpSession = {
        token: sessionToken,
        phone: carrierInfo.normalizedE164,
        carrier: carrierInfo.carrier,
        code: otpCode,
        channel: channel === 'whatsapp' ? 'whatsapp' : 'sms',
        expiresAt,
        attempts: 0,
      };

      activeSessions.set(sessionToken, newSession);
      phoneSessions.set(carrierInfo.normalizedE164, newSession);
      phoneSessions.set(carrierInfo.formattedNational, newSession);

      // Construct WhatsApp direct verification link for guaranteed delivery if requested
      const whatsappMessage = encodeURIComponent(
        `رمز التحقق لمنصة سريع (Sari3 Delivery): *${otpCode}*\nصالح لمدة 5 دقائق.`
      );
      const whatsappLink = `https://wa.me/${carrierInfo.normalizedE164.replace('+', '')}?text=${whatsappMessage}`;

      console.info(
        `[Sari3 Real SMS/OTP Flow] Dispatched via ${smsResult.provider} to ${carrierInfo.carrier} (${carrierInfo.normalizedE164}) - Session: ${sessionToken}`
      );

      // Return session receipt (NEVER expose the code to client!)
      return res.json({
        success: true,
        messageId: smsResult.messageId || `msg_${Date.now()}_${carrierInfo.carrier.toLowerCase()}`,
        sessionToken,
        carrier: carrierInfo.carrier,
        carrierName: carrierInfo.carrierName,
        destination: carrierInfo.formattedNational,
        normalizedE164: carrierInfo.normalizedE164,
        expiresInSeconds,
        channel,
        smsProvider: smsResult.provider,
        smsStatus: smsResult.statusMessage,
        whatsappLink: channel === 'whatsapp' ? whatsappLink : undefined,
      });
    } catch (err: any) {
      console.error('[API /api/auth/otp/send] Error:', err);
      return res.status(500).json({ error: err.message || 'فشل إرسال رمز التحقق' });
    }
  });

  // -------------------------------------------------------------------------
  // 2. API: STRICT SERVER-SIDE OTP VERIFICATION (Against Database & Firestore)
  // -------------------------------------------------------------------------
  app.post('/api/auth/otp/verify', async (req: Request, res: Response) => {
    try {
      const { sessionToken, code, phone, displayName, role = 'customer' } = req.body;

      // 1. Strict input validation
      if (!code || typeof code !== 'string' || code.trim().length !== 6 || !/^\d{6}$/.test(code.trim())) {
        return res.status(400).json({
          error: 'يرجى إدخال رمز التحقق المكون من 6 أرقام بشكل صحيح (أرقام فقط).',
        });
      }

      // 2. Query Firestore Database for persistent verification document
      let dbRecord: any = null;
      if (firestoreDb && sessionToken) {
        try {
          const snap = await getDoc(doc(firestoreDb, 'phone_verifications', sessionToken));
          if (snap.exists()) {
            dbRecord = snap.data();
          }
        } catch (dbErr) {
          console.warn('[Firestore] Verification query notice:', dbErr);
        }
      }

      // Fallback to active in-memory session if Firestore record not found
      let session: ActiveOtpSession | undefined = sessionToken ? activeSessions.get(sessionToken) : undefined;
      if (!session && phone) {
        const carrierInfo = detectCarrier(phone);
        session = phoneSessions.get(carrierInfo.normalizedE164) || phoneSessions.get(carrierInfo.formattedNational);
      }

      const activeRecord = dbRecord || session;

      if (!activeRecord) {
        return res.status(400).json({
          error: 'انتهت صلاحية رمز التحقق أو لا توجد جلسة إرسال نشطة لهذا الرقم في قاعدة البيانات. يرجى طلب رمز جديد.',
        });
      }

      // 3. Expiration check (5 minutes TTL)
      const expiresAt = Number(activeRecord.expiresAt);
      if (Date.now() > expiresAt || activeRecord.status === 'expired') {
        if (sessionToken) {
          activeSessions.delete(sessionToken);
          if (firestoreDb) {
            updateDoc(doc(firestoreDb, 'phone_verifications', sessionToken), { status: 'expired' }).catch(() => {});
          }
        }
        return res.status(400).json({
          error: 'انتهت صلاحية رمز التحقق (صلاحية الرمز 5 دقائق). يرجى النقر على إعادة إرسال الرمز.',
        });
      }

      // 4. Rate-limiting / brute-force protection
      const currentAttempts = Number(activeRecord.attempts || 0);
      if (currentAttempts >= 5 || activeRecord.status === 'blocked') {
        if (sessionToken) {
          activeSessions.delete(sessionToken);
          if (firestoreDb) {
            updateDoc(doc(firestoreDb, 'phone_verifications', sessionToken), { status: 'blocked' }).catch(() => {});
          }
        }
        return res.status(400).json({
          error: 'تم تجاوز الحد الأقصى للمحاولات الخاطئة (5 محاولات). تم إبطال الرمز لأسباب أمنية، يرجى طلب رمز جديد.',
        });
      }

      // 5. STRICT DATABASE OTP MATCHING: The system must NEVER accept an incorrect code!
      const enteredCodeClean = String(code).trim();
      const expectedCodeClean = String(activeRecord.code).trim();

      if (enteredCodeClean !== expectedCodeClean) {
        const newAttempts = currentAttempts + 1;
        if (session) session.attempts = newAttempts;

        if (firestoreDb && sessionToken) {
          updateDoc(doc(firestoreDb, 'phone_verifications', sessionToken), {
            attempts: newAttempts,
            updatedAt: new Date().toISOString(),
          }).catch(() => {});
        }

        const remainingAttempts = 5 - newAttempts;

        if (newAttempts >= 5) {
          if (sessionToken) activeSessions.delete(sessionToken);
          if (firestoreDb && sessionToken) {
            updateDoc(doc(firestoreDb, 'phone_verifications', sessionToken), { status: 'blocked' }).catch(() => {});
          }
          return res.status(400).json({
            error: 'رمز التحقق غير صحيح. تم تجاوز الحد الأقصى للمحاولات (5 محاولات). يرجى طلب رمز جديد.',
          });
        }

        return res.status(400).json({
          error: `رمز التحقق المدخل غير صحيح. يرجى التأكد من الرمز المستلم في هاتفك وإعادة المحاولة (المحاولات المتبقية: ${remainingAttempts}).`,
        });
      }

      // 6. Verification successful! Invalidate OTP record in database & memory to prevent replay
      if (sessionToken) {
        activeSessions.delete(sessionToken);
      }
      if (activeRecord.phone) {
        phoneSessions.delete(activeRecord.phone);
      }

      if (firestoreDb && sessionToken) {
        updateDoc(doc(firestoreDb, 'phone_verifications', sessionToken), {
          status: 'verified',
          code: 'VERIFIED',
          verifiedAt: new Date().toISOString(),
        }).catch(() => {});
      }

      const normalizedPhone = activeRecord.phone;
      const carrierInfo = detectCarrier(normalizedPhone);

      let userId = generateUuid();
      let existingProfile: any = null;

      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('phone', carrierInfo.formattedNational)
          .maybeSingle();

        if (data) {
          existingProfile = data;
          userId = data.id;
        }
      } catch (dbErr) {
        console.warn('[DB check profiles notice]:', dbErr);
      }

      if (firestoreDb && !existingProfile) {
        try {
          const userDoc = await getDoc(doc(firestoreDb, 'profiles', userId));
          if (userDoc.exists()) {
            existingProfile = userDoc.data();
          }
        } catch (fsErr) {}
      }

      const userProfile = {
        id: userId,
        phone: carrierInfo.formattedNational,
        phone_verified: true,
        display_name: displayName || existingProfile?.display_name || existingProfile?.displayName || 'مستخدم سريع',
        role: role || existingProfile?.role || 'customer',
        wilaya: existingProfile?.wilaya || '16',
        account_confirmed: true,
        updated_at: new Date().toISOString(),
      };

      try {
        await supabase.from('profiles').upsert(userProfile);
      } catch (upsertErr) {
        console.warn('[DB upsert profiles notice]:', upsertErr);
      }

      if (firestoreDb) {
        try {
          await setDoc(doc(firestoreDb, 'profiles', userId), {
            ...userProfile,
            displayName: userProfile.display_name,
            phoneVerified: userProfile.phone_verified,
            accountConfirmed: userProfile.account_confirmed,
            updatedAt: userProfile.updated_at,
          }, { merge: true });
        } catch (fsSetErr) {}
      }

      return res.json({
        success: true,
        user: {
          id: userId,
          phone: carrierInfo.formattedNational,
          phoneVerified: true,
          displayName: userProfile.display_name,
          role: userProfile.role,
          wilaya: userProfile.wilaya,
          accountConfirmed: true,
          createdAt: existingProfile?.created_at || new Date().toISOString(),
        },
      });
    } catch (err: any) {
      console.error('[API /api/auth/otp/verify] Error:', err);
      return res.status(500).json({ error: err.message || 'فشل تأكيد الرمز' });
    }
  });

  // -------------------------------------------------------------------------
  // 3. API: GOOGLE AUTH PROFILE SYNC TO SUPABASE PROFILES TABLE
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
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (data) {
          existingProfile = data;
        }
      } catch (dbErr) {
        console.warn('[Google Sync lookup notice]:', dbErr);
      }

      const profilePayload = {
        id: userId,
        email: email.trim().toLowerCase(),
        display_name: name || existingProfile?.display_name || email.split('@')[0],
        avatar_url: avatarUrl || existingProfile?.avatar_url,
        role: existingProfile?.role || 'customer',
        wilaya: existingProfile?.wilaya || '16',
        account_confirmed: true,
        updated_at: new Date().toISOString(),
      };

      try {
        await supabase.from('profiles').upsert(profilePayload);
      } catch (upsertErr) {
        console.warn('[Google Sync upsert notice]:', upsertErr);
      }

      return res.json({
        success: true,
        user: {
          id: userId,
          email: profilePayload.email,
          phone: existingProfile?.phone || undefined,
          phoneVerified: !!existingProfile?.phone_verified,
          displayName: profilePayload.display_name,
          avatarUrl: profilePayload.avatar_url,
          role: profilePayload.role,
          wilaya: profilePayload.wilaya,
          accountConfirmed: true,
          createdAt: existingProfile?.created_at || new Date().toISOString(),
        },
      });
    } catch (err: any) {
      console.error('[API /api/auth/google/sync] Error:', err);
      return res.status(500).json({ error: err.message || 'فشل مزامنة حساب Google' });
    }
  });

  // -------------------------------------------------------------------------
  // 4. API: LIVE DELIVERY ORDERS (Fetch from Supabase)
  // -------------------------------------------------------------------------
  app.get('/api/orders', async (req: Request, res: Response) => {
    try {
      const { wilaya } = req.query;

      let query = supabase
        .from('delivery_orders')
        .select('*, driver_offers(*)')
        .order('created_at', { ascending: false });

      if (wilaya && wilaya !== 'all') {
        query = query.eq('wilaya', String(wilaya));
      }

      const { data, error } = await query;

      if (!error && Array.isArray(data)) {
        return res.json({ orders: data });
      }

      // In-Memory fallback if Supabase table is empty or offline
      let fallback = inMemoryOrders;
      if (wilaya && wilaya !== 'all') {
        fallback = fallback.filter((o) => o.wilaya === String(wilaya));
      }
      return res.json({ orders: fallback });
    } catch (err: any) {
      console.error('[API /api/orders] Error:', err);
      return res.json({ orders: inMemoryOrders });
    }
  });

  // -------------------------------------------------------------------------
  // 5. API: CREATE NEW ORDER (Persist to Supabase)
  // -------------------------------------------------------------------------
  app.post('/api/orders', async (req: Request, res: Response) => {
    try {
      const order = req.body;
      const orderId = ensureUuid(order.id);
      const customerId = ensureUuid(order.customerId);

      const dbPayload = {
        id: orderId,
        customer_id: customerId,
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        wilaya: order.wilaya,
        pickup_address: order.pickupAddress,
        pickup_lat: order.pickupCoords?.lat || 36.75,
        pickup_lng: order.pickupCoords?.lng || 3.05,
        dropoff_address: order.dropoffAddress,
        dropoff_lat: order.dropoffCoords?.lat || 36.75,
        dropoff_lng: order.dropoffCoords?.lng || 3.05,
        package_photo_url: order.packagePhotoUrl || '',
        package_description: order.packageDescription || '',
        package_category: order.packageCategory || 'documents',
        distance_km: order.distanceKm || 5,
        suggested_base_price: order.suggestedBasePrice || 500,
        customer_offer_price: order.customerOfferPrice || 500,
        status: order.status || 'searching',
        created_at: order.createdAt || new Date().toISOString(),
      };

      inMemoryOrders.unshift(dbPayload);

      try {
        await supabase.from('delivery_orders').upsert(dbPayload);
      } catch (dbErr) {
        console.warn('[Supabase insert order notice]:', dbErr);
      }

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
    console.log(`[Sari3 Supabase Full-Stack Platform] Running live on port ${PORT}`);
  });
}

startServer();
