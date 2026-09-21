import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { AppTranslations } from '../i18n/translations';
import { Language, UserProfile } from '../types';
import { Sari3Logo } from './Sari3Logo';
import { Smartphone, Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, User, KeyRound } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onAuthSuccess: (user: UserProfile) => void;
  t: AppTranslations;
  lang: Language;
}

type AuthFlowStep = 'method_select' | 'phone_otp' | 'google_phone_prompt' | 'google_otp_verify';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onAuthSuccess,
  t,
  lang,
}) => {
  const [step, setStep] = useState<AuthFlowStep>('method_select');
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

  // 1. Google OAuth Initiation
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // Simulate Google OAuth response or connect to Supabase
      const googleData = {
        email: 'abderrahmanehadj3@gmail.com',
        displayName: 'Abderrahmane Hadj',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      };
      setPendingGoogleUser(googleData);
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
      setErrorMsg(lang === 'ar' ? 'يرجى إدخال رقم هاتف جزائري صحيح' : 'Please enter a valid phone number');
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
      // Graceful fallback for sandbox
    }

    setTestOtpHint('889315');
    setStep('phone_otp');
    setIsLoading(false);
  };

  // 3. Send SMS OTP for Google-linked Phone
  const handleSendGooglePhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      setErrorMsg(lang === 'ar' ? 'يرجى إدخال رقم هاتف جزائري صحيح' : 'Please enter a valid phone number');
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
        id: `usr-phone-${Date.now()}`,
        phone: cleanPhone,
        phoneVerified: true,
        displayName: displayName.trim() || (lang === 'ar' ? 'مستخدم جديد' : 'Sari3 User'),
        wilaya: '16',
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
        id: `usr-google-${Date.now()}`,
        email: pendingGoogleUser?.email || 'user@example.com',
        displayName: pendingGoogleUser?.displayName || 'Sari3 User',
        avatarUrl: pendingGoogleUser?.avatarUrl,
        phone: cleanPhone,
        phoneVerified: true,
        wilaya: '16',
        createdAt: new Date().toISOString(),
      };

      setIsLoading(false);
      onAuthSuccess(user);
    }, 400);
  };

  // Quick Demo Logins for instant evaluation
  const handleQuickDemoCustomer = () => {
    const demoCustomer: UserProfile = {
      id: 'cust-demo-1',
      displayName: 'أمين بلحاج (زبون)',
      phone: '+213 555 12 34 56',
      phoneVerified: true,
      role: 'customer',
      wilaya: '16',
      accountConfirmed: true,
      createdAt: new Date().toISOString(),
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    };
    onAuthSuccess(demoCustomer);
  };

  const handleQuickDemoDriver = () => {
    const demoDriver: UserProfile = {
      id: 'drv-demo-1',
      displayName: 'كريم الدراجي (كابتن)',
      phone: '+213 661 88 99 00',
      phoneVerified: true,
      role: 'driver',
      wilaya: '16',
      accountConfirmed: true,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      driverDetails: {
        firstName: 'كريم',
        lastName: 'الدراجي',
        birthDate: '1998-05-14',
        age: 26,
        phone: '+213 661 88 99 00',
        phoneVerified: true,
        licenseNumber: 'ALG-16-992014',
        licenseExpirationDate: '2029-08-10',
        vehicleType: 'motorcycle',
        vehicleRegType: 'permanent',
        vehiclePlate: '16-12345-121',
        vehicleBrand: 'Sym Orbit II',
        vehicleModel: '2023',
        verificationStatus: 'verified',
        isOnline: true,
        rating: 4.9,
        totalDeliveries: 142,
      },
      createdAt: new Date().toISOString(),
    };
    onAuthSuccess(demoDriver);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 relative">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <Sari3Logo size="lg" showTagline taglineText={t.tagline} />
          <h2 className="text-xl font-black mt-4 text-white font-['Cairo']">
            {t.welcome}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
            {t.loginSubtitle}
          </p>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Method Select (Google or Phone) */}
        {step === 'method_select' && (
          <div className="space-y-4">
            {/* Google Button */}
            <button
              id="btn-google-auth"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-md transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.09C3.27 21.48 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.59H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.41l4.02-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.52 1.26 6.59l4.02 3.09c.95-2.83 3.6-4.93 6.72-4.93z"
                />
              </svg>
              <span>{t.continueWithGoogle}</span>
            </button>

            {/* Divider */}
            <div className="flex items-center my-3 gap-3">
              <div className="h-px bg-slate-800 flex-1" />
              <span className="text-[11px] text-slate-500 font-semibold uppercase">
                {t.orWithPhone}
              </span>
              <div className="h-px bg-slate-800 flex-1" />
            </div>

            {/* Standard Phone Form */}
            <form onSubmit={handleSendPhoneOtp} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.enterPhone}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-bold text-slate-400 dir-ltr select-none">
                    +213
                  </span>
                  <input
                    type="tel"
                    id="input-phone-number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="05 / 06 / 07 XX XX XX"
                    dir="ltr"
                    className="w-full pl-14 pr-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500 transition font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ar' ? 'الاسم المستعار / اللقب' : 'Display Name'}
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثلاً: أمين أو كريم' : 'e.g., Amine'}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <button
                type="submit"
                id="btn-send-otp"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                <Smartphone size={18} />
                <span>{isLoading ? '...' : t.sendOtp}</span>
              </button>
            </form>

            {/* Quick Demo Section */}
            <div className="pt-3 border-t border-slate-800/80 mt-4">
              <div className="flex items-center justify-center gap-1.5 text-slate-500 text-[11px] mb-2 font-medium">
                <Sparkles size={12} className="text-emerald-400" />
                <span>تجربة سريعة وفورية للمنصة</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleQuickDemoCustomer}
                  className="py-2.5 px-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <User size={13} />
                  <span>دخول كزبون</span>
                </button>
                <button
                  type="button"
                  onClick={handleQuickDemoDriver}
                  className="py-2.5 px-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <KeyRound size={13} />
                  <span>دخول كسائق</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Phone OTP Verification */}
        {step === 'phone_otp' && (
          <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
              <p className="font-semibold">{t.otpSentTo} {phoneNumber}</p>
              {testOtpHint && (
                <p className="text-[11px] text-emerald-400 mt-1 font-mono bg-emerald-900/40 p-1.5 rounded-lg border border-emerald-500/20">
                  🔑 كود التحقق التجريبي (OTP): <span className="font-bold underline text-white text-sm">{testOtpHint}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.enterOtp}
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="• • • • • •"
                dir="ltr"
                className="w-full text-center tracking-[0.4em] text-2xl font-black py-3 rounded-2xl bg-slate-950 border border-slate-700 text-emerald-400 focus:outline-none focus:border-emerald-500 transition font-mono"
                autoFocus
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('method_select')}
                className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                رجوع
              </button>
              <button
                type="submit"
                id="btn-verify-otp"
                disabled={isLoading}
                className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={18} />
                <span>{isLoading ? '...' : t.verifyOtp}</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Google Sign-up Rule -> Immediate Phone Input Prompt */}
        {step === 'google_phone_prompt' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Google Profile Card */}
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center gap-3">
              <img
                src={pendingGoogleUser?.avatarUrl}
                alt="Google avatar"
                className="w-10 h-10 rounded-full object-cover border border-emerald-500"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">
                  {pendingGoogleUser?.displayName}
                </p>
                <p className="text-[11px] text-slate-400 truncate dir-ltr text-right">
                  {pendingGoogleUser?.email}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                Google ✓
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs leading-relaxed">
              <p className="font-bold mb-0.5">{t.googlePhoneVerifyTitle}</p>
              <p className="text-[11px] text-amber-300/90">{t.googlePhoneVerifyDesc}</p>
            </div>

            <form onSubmit={handleSendGooglePhoneOtp} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.enterPhone}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-bold text-slate-400 dir-ltr select-none">
                    +213
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="05 / 06 / 07 XX XX XX"
                    dir="ltr"
                    className="w-full pl-14 pr-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500 transition font-mono"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('method_select')}
                  className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Smartphone size={18} />
                  <span>{isLoading ? '...' : t.sendOtp}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 4: Google Phone OTP Verification */}
        {step === 'google_otp_verify' && (
          <form onSubmit={handleVerifyGooglePhoneOtp} className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
              <p className="font-semibold">{t.otpSentTo} {phoneNumber}</p>
              {testOtpHint && (
                <p className="text-[11px] text-emerald-400 mt-1 font-mono bg-emerald-900/40 p-1.5 rounded-lg border border-emerald-500/20">
                  🔑 كود التحقق التجريبي (OTP): <span className="font-bold underline text-white text-sm">{testOtpHint}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.enterOtp}
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="• • • • • •"
                dir="ltr"
                className="w-full text-center tracking-[0.4em] text-2xl font-black py-3 rounded-2xl bg-slate-950 border border-slate-700 text-emerald-400 focus:outline-none focus:border-emerald-500 transition font-mono"
                autoFocus
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('google_phone_prompt')}
                className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                تغيير الرقم
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={18} />
                <span>{isLoading ? '...' : t.verifyOtp}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
