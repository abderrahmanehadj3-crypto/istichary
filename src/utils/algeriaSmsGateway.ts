/**
 * Real Algerian SMS & OTP Verification Gateway with Reliable Carrier Fallback
 * Supports official Algerian mobile operators:
 * - Mobilis (ATM Mobilis) -> 06xx xx xx xx
 * - Djezzy (Optimum Telecom Algérie) -> 07xx xx xx xx
 * - Ooredoo (Ooredoo Algérie) -> 05xx xx xx xx
 *
 * Integrated with Supabase Auth Phone Provider & High-Reliability Algerian Fallback Gateway
 */

import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { generateUuid, saveUserProfile } from './supabaseSync';

export type AlgerianCarrier = 'Mobilis' | 'Djezzy' | 'Ooredoo' | 'Unknown';

export interface CarrierInfo {
  carrier: AlgerianCarrier;
  carrierNameAr: string;
  carrierNameFr: string;
  networkBadge: string;
  themeColor: string;
  valid: boolean;
  normalizedE164: string; // e.g. +213661234567
  formattedNational: string; // e.g. 0661 23 45 67
}

export interface SmsDispatchReceipt {
  success: boolean;
  messageId: string;
  carrier: AlgerianCarrier;
  carrierName: string;
  destination: string;
  dispatchedAt: string;
  sessionToken: string;
  expiresInSeconds: number;
  channel: 'sms' | 'whatsapp';
}

/**
 * Detects and validates an Algerian mobile carrier based on ARPT numbering plans
 */
export function detectAlgerianCarrier(phoneInput: string): CarrierInfo {
  const clean = phoneInput.replace(/[\s\-\(\)\.]/g, '');

  let nationalNumber = clean;
  if (clean.startsWith('+213')) {
    nationalNumber = clean.slice(4);
  } else if (clean.startsWith('00213')) {
    nationalNumber = clean.slice(5);
  } else if (clean.startsWith('0')) {
    nationalNumber = clean.slice(1);
  }

  const prefix = nationalNumber.charAt(0);
  let carrier: AlgerianCarrier = 'Unknown';
  let carrierNameAr = 'شبكة جزائرية';
  let carrierNameFr = 'Opérateur DZ';
  let networkBadge = '4G/LTE';
  let themeColor = 'text-slate-400 bg-slate-800 border-slate-700';

  if (prefix === '6') {
    carrier = 'Mobilis';
    carrierNameAr = 'موبيليس (Mobilis)';
    carrierNameFr = 'ATM Mobilis';
    networkBadge = 'Mobilis 4G+';
    themeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40';
  } else if (prefix === '7') {
    carrier = 'Djezzy';
    carrierNameAr = 'جيزي (Djezzy)';
    carrierNameFr = 'Djezzy OTA';
    networkBadge = 'Djezzy 4G';
    themeColor = 'text-red-400 bg-red-500/10 border-red-500/40';
  } else if (prefix === '5') {
    carrier = 'Ooredoo';
    carrierNameAr = 'أوريدو (Ooredoo)';
    carrierNameFr = 'Ooredoo Algérie';
    networkBadge = 'Ooredoo Supernet';
    themeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/40';
  }

  const isValidLength = nationalNumber.length === 9;
  const valid = carrier !== 'Unknown' && isValidLength;

  const normalizedE164 = valid ? `+213${nationalNumber}` : phoneInput;
  const formattedNational = valid
    ? `0${nationalNumber.slice(0, 3)} ${nationalNumber.slice(3, 5)} ${nationalNumber.slice(5, 7)} ${nationalNumber.slice(7, 9)}`
    : phoneInput;

  return {
    carrier,
    carrierNameAr,
    carrierNameFr,
    networkBadge,
    themeColor,
    valid,
    normalizedE164,
    formattedNational,
  };
}

/**
 * Dispatches a real verification code to an Algerian mobile number (+213)
 * Handles delivery via real SMS Gateway or Meta WhatsApp Cloud API via backend.
 */
export async function sendAlgerianSmsOtp(
  phoneInput: string,
  channel: 'sms' | 'whatsapp' = 'sms'
): Promise<SmsDispatchReceipt> {
  const carrierInfo = detectAlgerianCarrier(phoneInput);
  if (!carrierInfo.valid) {
    throw new Error('رقم الهاتف الجزائري غير صالح. يجب أن يبدأ بـ 05 أو 06 أو 07 ويتكون من 10 أرقام.');
  }

  // 1. Dispatch via Server-Side API (Real SMS Gateway or Meta WhatsApp Business Cloud API)
  const res = await fetch('/api/auth/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: carrierInfo.normalizedE164, channel }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.success) {
    throw new Error(data?.error || 'فشل إرسال رمز التحقق عبر الخادم. يرجى المحاولة مجدداً.');
  }

  return {
    success: true,
    messageId: data.messageId || `msg-${Date.now()}-${carrierInfo.carrier.toLowerCase()}`,
    carrier: carrierInfo.carrier,
    carrierName: carrierInfo.carrierNameAr,
    destination: carrierInfo.formattedNational,
    dispatchedAt: new Date().toLocaleTimeString('fr-DZ'),
    sessionToken: data.sessionToken,
    expiresInSeconds: data.expiresInSeconds || 300,
    channel,
  };
}

/**
 * Validates the user-entered SMS verification code:
 * - Strictly validates against Supabase Auth verifyOtp or Backend OTP store
 * - The system must NEVER accept an incorrect OTP code!
 */
export async function verifyAlgerianSmsOtp(
  sessionToken: string,
  enteredCode: string,
  phone?: string,
  displayName?: string,
  role: string = 'customer'
): Promise<{ success: boolean; error?: string; user?: any }> {
  const cleanCode = enteredCode.trim();

  // 1. Strict format check: exactly 6 digits
  if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
    return {
      success: false,
      error: 'يرجى إدخال رمز التحقق المكون من 6 أرقام بشكل صحيح (أرقام فقط).',
    };
  }

  // 2. Try Supabase Phone OTP verify if configured
  if (phone && isSupabaseConfigured()) {
    try {
      const carrier = detectAlgerianCarrier(phone);
      const { data, error } = await supabase.auth.verifyOtp({
        phone: carrier.normalizedE164,
        token: cleanCode,
        type: 'sms',
      });

      if (!error && data?.user) {
        const userId = data.user.id;
        const profileData = {
          id: userId,
          phone: carrier.formattedNational,
          phoneVerified: true,
          displayName: displayName || 'مستخدم سريع',
          role: role as any,
          wilaya: '16',
          accountConfirmed: true,
          updatedAt: new Date().toISOString(),
        };
        await saveUserProfile(profileData as any);

        return {
          success: true,
          user: {
            id: userId,
            phone: carrier.formattedNational,
            phoneVerified: true,
            displayName: profileData.displayName,
            role,
          },
        };
      } else if (error) {
        console.warn('[Supabase VerifyOtp] Error notice:', error.message);
      }
    } catch (sbErr) {
      console.warn('[Supabase VerifyOtp] Exception:', sbErr);
    }
  }

  // 3. Strict verification via Backend API
  try {
    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken,
        code: cleanCode,
        phone,
        displayName,
        role,
      }),
    });

    const data = await res.json().catch(() => null);

    if (res.ok && data?.success) {
      return { success: true, user: data.user };
    }

    if (data?.error) {
      return { success: false, error: data.error };
    }
  } catch (backendErr) {
    console.error('[SmsGateway] Backend verify network error:', backendErr);
    return {
      success: false,
      error: 'تعذر الاتصال بخادم التحقق. يرجى التأكد من اتصالك بالإنترنت والمحاولة مجدداً.',
    };
  }

  return {
    success: false,
    error: 'رمز التحقق غير صحيح. يرجى التأكد من كتابة الأرقام الستة المستلمة.',
  };
}
