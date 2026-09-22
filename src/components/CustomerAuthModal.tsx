import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { AppTranslations } from '../i18n/translations';
import { Language, UserProfile } from '../types';
import { Sari3Logo } from './Sari3Logo';
import {
  Smartphone,
  Mail,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  User,
  KeyRound,
  X,
} from 'lucide-react';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
  t: AppTranslations;
  lang: Language;
}

type CustomerStep = 'method_select' | 'phone_otp' | 'google_phone_prompt' | 'google_otp_verify';

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  t,
  lang,
}) => {
  const [step, setStep] = useState<CustomerStep>('method_select');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pendingGoogleUser, setPendingGoogleUser] = useState<{
    email: string;
    displayName: string;
    avatarUrl: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [testOtpHint, setTestOtpHint] = useState<string | null>(null);

  if (!isOpen) return null;

  const isRtl = lang === 'ar';
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  // 1. Google OAuth Initiation for Customer
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // Simulate Google OAuth payload
      const googleData = {
        email: 'abderrahmanehadj3@gmail.com',
        displayName: 'Abderrahmane Hadj',
        avatarUrl:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      };
      setPendingGoogleUser(googleData);
      setDisplayName(googleData.displayName);
      // Immediately prompt for Algerian Phone Verification as mandated
      setStep('google_phone_prompt');
    } catch (err: any) {
      setErrorMsg(err.message || 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Send SMS OTP for Standard Phone Login
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      setErrorMsg(
        lang === 'ar' ? 'يرجى إدخال رقم هاتف جزائري صحيح' : 'Please enter a valid Algerian phone number'
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const cleanPhone = phoneNumber.startsWith('+213')
      ? phoneNumber
      : `+213${phoneNumber.replace(/^0/, '')}`;

    try {
      await supabase.auth.signInWithOtp({ phone: cleanPhone });
    } catch (err) {
      // Graceful fallback for mock sandbox environment
    }

    setTestOtpHint('889315');
    setStep('phone_otp');
    setIsLoading(false);
  };

  // 3. Send SMS OTP for Google-linked Phone
  const handleSendGooglePhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      setErrorMsg(
        lang === 'ar' ? 'يرجى إدخال رقم هاتف جزائري صحيح' : 'Please enter a valid Algerian phone number'
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setTestOtpHint('889315');
    setStep('google_otp_verify');
    setIsLoading(false);
  };

  // 4. Verify OTP for Phone Login
  const handleVerifyPhoneOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      setErrorMsg(t.invalidOtp);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      const cleanPhone = phoneNumber.startsWith('+213')
        ? phoneNumber
        : `+213${phoneNumber.replace(/^0/, '')}`;

      const user: UserProfile = {
        id: `cust-${Date.now()}`,
        phone: cleanPhone,
        phoneVerified: true,
        displayName: displayName.trim() || (lang === 'ar' ? 'زبون سريع' : 'Sari3 Customer'),
        role: 'customer',
        wilaya: '16',
        accountConfirmed: false, // Permissions needed next
        createdAt: new Date().toISOString(),
      };

      setIsLoading(false);
      onAuthSuccess(user);
    }, 400);
  };

  // 5. Verify OTP for Google-linked Phone
  const handleVerifyGooglePhoneOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      setErrorMsg(t.invalidOtp);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      const cleanPhone = phoneNumber.startsWith('+213')
        ? phoneNumber
        : `+213${phoneNumber.replace(/^0/, '')}`;

      const user: UserProfile = {
        id: `cust-google-${Date.now()}`,
        email: pendingGoogleUser?.email || 'user@example.com',
        displayName: displayName.trim() || pendingGoogleUser?.displayName || 'Sari3 Customer',
        avatarUrl: pendingGoogleUser?.avatarUrl,
        phone: cleanPhone,
        phoneVerified: true,
        role: 'customer',
        wilaya: '16',
        accountConfirmed: false, // Permissions needed next
        createdAt: new Date().toISOString(),
      };

      setIsLoading(false);
      onAuthSuccess(user);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 relative">
        {/* Header with back button */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <button
            type="button"
            onClick={() => {
              if (step !== 'method_select') {
                setStep('method_select');
                setErrorMsg(null);
              } else {
                onClose();
              }
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <BackIcon size={16} />
            <span>{step !== 'method_select' ? 'رجوع' : t.backToGateway}</span>
          </button>

          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
            بوابة الزبائن
          </span>
        </div>

        {/* Brand Banner */}
        <div className="text-center my-4">
          <Sari3Logo size="md" className="justify-center mb-2" />
          <h2 className="text-lg font-black text-white font-['Cairo']">
            {t.customerLoginTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.customerLoginSubtitle}
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: METHOD SELECT (Phone or Google) */}
        {step === 'method_select' && (
          <div className="space-y-4">
            {/* Google OAuth Button */}
            <button
              id="btn-customer-google-auth"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-black text-sm flex items-center justify-center gap-3 shadow-md transition cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t.continueWithGoogle}</span>
            </button>

            {/* Divider */}
            <div className="flex items-center my-3 text-slate-500 text-xs">
              <div className="flex-1 border-t border-slate-800" />
              <span className="px-3">{t.orWithPhone}</span>
              <div className="flex-1 border-t border-slate-800" />
            </div>

            {/* Phone Form */}
            <form onSubmit={handleSendPhoneOtp} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  اسمك الكامل (الاسم واللقب)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="مثال: ياسمين بلقاسم"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                  />
                  <User size={16} className="absolute left-3 top-3.5 text-slate-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {t.enterPhone}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute right-3.5 text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5 pointer-events-none">
                    <span>🇩🇿</span>
                    <span>+213</span>
                  </span>
                  <input
                    id="input-customer-phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="555 12 34 56"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-20 pl-4 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <button
                id="btn-customer-send-otp"
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                <Smartphone size={16} />
                <span>{t.sendOtp}</span>
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: PHONE OTP VERIFICATION */}
        {step === 'phone_otp' && (
          <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <p className="text-xs text-slate-400">{t.otpSentTo}</p>
              <p className="text-sm font-mono font-bold text-emerald-400 mt-1" dir="ltr">
                {phoneNumber.startsWith('+213') ? phoneNumber : `+213 ${phoneNumber}`}
              </p>
              {testOtpHint && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-mono">
                  <KeyRound size={12} />
                  <span>رمز الاختبار التجريبي: {testOtpHint}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 text-center">
                {t.enterOtp}
              </label>
              <input
                id="input-customer-otp"
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="• • • • • •"
                className="w-full text-center tracking-[0.5em] text-xl font-mono font-bold bg-slate-950 border border-slate-800 rounded-2xl py-3 text-white focus:outline-none focus:border-emerald-500"
                required
                autoFocus
              />
            </div>

            <button
              id="btn-customer-verify-otp"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              <span>{t.verifyOtp}</span>
            </button>
          </form>
        )}

        {/* STEP 3: GOOGLE PHONE PROMPT (MANDATORY REQUIREMENT) */}
        {step === 'google_phone_prompt' && (
          <form onSubmit={handleSendGooglePhoneOtp} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <div className="w-12 h-12 rounded-full overflow-hidden mx-auto mb-2 border-2 border-emerald-500">
                <img
                  src={pendingGoogleUser?.avatarUrl}
                  alt="Google Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs font-bold text-white">{pendingGoogleUser?.displayName}</p>
              <p className="text-[11px] text-slate-400">{pendingGoogleUser?.email}</p>
              <div className="mt-2 text-[11px] text-emerald-400 font-semibold">
                يرجى ربط وتأكيد رقم هاتفك الجزائري لاستلام إشعارات التوصيل والتواصل مع السائق
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                تعديل الاسم المعروض للزبون
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {t.enterPhone}
              </label>
              <div className="relative flex items-center">
                <span className="absolute right-3.5 text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5 pointer-events-none">
                  <span>🇩🇿</span>
                  <span>+213</span>
                </span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="555 12 34 56"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-20 pl-4 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Smartphone size={16} />
              <span>{t.sendOtp}</span>
            </button>
          </form>
        )}

        {/* STEP 4: GOOGLE OTP VERIFY */}
        {step === 'google_otp_verify' && (
          <form onSubmit={handleVerifyGooglePhoneOtp} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <p className="text-xs text-slate-400">{t.otpSentTo}</p>
              <p className="text-sm font-mono font-bold text-emerald-400 mt-1" dir="ltr">
                {phoneNumber.startsWith('+213') ? phoneNumber : `+213 ${phoneNumber}`}
              </p>
              {testOtpHint && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-mono">
                  <KeyRound size={12} />
                  <span>رمز الاختبار التجريبي: {testOtpHint}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 text-center">
                {t.enterOtp}
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="• • • • • •"
                className="w-full text-center tracking-[0.5em] text-xl font-mono font-bold bg-slate-950 border border-slate-800 rounded-2xl py-3 text-white focus:outline-none focus:border-emerald-500"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              <span>تأكيد الحساب والدخول</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
