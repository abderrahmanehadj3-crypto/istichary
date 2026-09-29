import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { auth, db } from '../firebaseClient';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Reference to active ConfirmationResult for verifying SMS code
let currentConfirmationResult: ConfirmationResult | null = null;
let currentRecaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Initializes an invisible reCAPTCHA verifier for Firebase Phone Authentication
 */
export function getOrCreateRecaptchaVerifier(containerId = 'recaptcha-container'): RecaptchaVerifier {
  if (typeof window === 'undefined') {
    throw new Error('Window is not available');
  }

  // Ensure container element exists in DOM
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.style.display = 'none';
    document.body.appendChild(container);
  }

  // Clear existing verifier if any
  if (currentRecaptchaVerifier) {
    try {
      currentRecaptchaVerifier.clear();
    } catch (e) {}
    currentRecaptchaVerifier = null;
  }

  currentRecaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.info('[Firebase Phone Auth] Invisible reCAPTCHA verification passed');
    },
    'expired-callback': () => {
      console.warn('[Firebase Phone Auth] reCAPTCHA expired, resetting');
      if (currentRecaptchaVerifier) {
        try {
          currentRecaptchaVerifier.clear();
        } catch (e) {}
        currentRecaptchaVerifier = null;
      }
    },
  });

  return currentRecaptchaVerifier;
}

/**
 * Dispatches a genuine Firebase SMS verification code to an Algerian mobile number (Mobilis, Djezzy, Ooredoo)
 */
export async function sendFirebasePhoneOtp(
  phoneNumberE164: string,
  containerId = 'recaptcha-container'
): Promise<{ success: boolean; error?: string }> {
  try {
    const verifier = getOrCreateRecaptchaVerifier(containerId);
    console.info(`[Firebase Phone Auth] Requesting Firebase SMS OTP for: ${phoneNumberE164}`);

    currentConfirmationResult = await signInWithPhoneNumber(auth, phoneNumberE164, verifier);
    console.info(`[Firebase Phone Auth] Real SMS text message sent to: ${phoneNumberE164}`);

    return { success: true };
  } catch (err: any) {
    console.error('[Firebase Phone Auth] Failed to dispatch SMS:', err);

    let userFriendlyError = 'فشل إرسال رمز التحقق عبر رسائل SMS.';
    if (err.code === 'auth/invalid-phone-number') {
      userFriendlyError = 'رقم الهاتف غير صالح. يرجى التأكد من كتابة الرقم بشكل صحيح.';
    } else if (err.code === 'auth/too-many-requests') {
      userFriendlyError = 'تم حظر طلبات التحقق مؤقتاً بسبب كثرة المحاولات. يرجى الانتظار بضع دقائق.';
    } else if (err.code === 'auth/quota-exceeded') {
      userFriendlyError = 'تم تجاوز الحصة اليومية للرسائل القصيرة.';
    } else if (err.code === 'auth/captcha-check-failed') {
      userFriendlyError = 'فشل التحقق الأمني ضد الروبوتات (reCAPTCHA). يرجى المحاولة ثانية.';
    } else if (err.code === 'auth/missing-phone-number') {
      userFriendlyError = 'رقم الهاتف مفقود.';
    }

    return {
      success: false,
      error: `${userFriendlyError} (${err.code || err.message || 'Unknown'})`,
    };
  }
}

/**
 * Confirms the user-entered 6-digit SMS code against the active Firebase Phone Auth session
 */
export async function verifyFirebasePhoneOtp(
  code: string,
  displayName?: string,
  role: string = 'customer'
): Promise<{ success: boolean; user?: any; error?: string }> {
  if (!currentConfirmationResult) {
    return {
      success: false,
      error: 'لا توجد جلسة تحقق نشطة. يرجى طلب رمز جديد عبر SMS.',
    };
  }

  try {
    const cleanCode = code.trim();
    const credential = await currentConfirmationResult.confirm(cleanCode);
    const user = credential.user;

    // Persist or merge profile into Cloud Firestore
    try {
      const userRef = doc(db, 'profiles', user.uid);
      const existing = await getDoc(userRef);
      const profileData = {
        id: user.uid,
        phone: user.phoneNumber || '',
        phoneVerified: true,
        displayName: displayName || existing.data()?.displayName || 'مستخدم سريع',
        role: existing.data()?.role || role,
        wilaya: existing.data()?.wilaya || '16',
        accountConfirmed: true,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userRef, profileData, { merge: true });
    } catch (dbErr) {
      console.warn('[Firebase Phone Auth] Firestore profile sync notice:', dbErr);
    }

    // Reset confirmation state
    currentConfirmationResult = null;

    return {
      success: true,
      user: {
        id: user.uid,
        phone: user.phoneNumber,
        phoneVerified: true,
        displayName: displayName || user.phoneNumber,
        role,
      },
    };
  } catch (err: any) {
    console.error('[Firebase Phone Auth] Code verification error:', err);

    let userFriendlyError = 'رمز التحقق غير صحيح.';
    if (err.code === 'auth/invalid-verification-code') {
      userFriendlyError = 'رمز التحقق المدخل غير صحيح. يرجى التأكد من كتابة الأرقام الستة المستلمة في رسالتك النصية.';
    } else if (err.code === 'auth/code-expired') {
      userFriendlyError = 'انتهت صلاحية رمز التحقق. يرجى النقر على إعادة إرسال الرمز.';
    }

    return {
      success: false,
      error: userFriendlyError,
    };
  }
}

export function hasActiveFirebasePhoneSession(): boolean {
  return currentConfirmationResult !== null;
}
