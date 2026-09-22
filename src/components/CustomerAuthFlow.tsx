import React, { useState } from 'react';
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
  Package,
} from 'lucide-react';

interface CustomerAuthFlowProps {
  t: AppTranslations;
  lang: Language;
  onAuthComplete: (user: UserProfile) => void;
  onBackToGateway: () => void;
}

type CustomerStep = 'method_select' | 'phone_otp' | 'google_phone_prompt' | 'google_otp_verify' | 'profile_setup';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
];

export const CustomerAuthFlow: React.FC<CustomerAuthFlowProps> = ({
  t,
  lang,
  onAuthComplete,
  onBackToGateway,
}) => {
  const isRtl = lang === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [step, setStep] = useState<CustomerStep>('method_select');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [displayName, setDisplayName] = useState('أمين بلحاج');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [testOtpHint, setTestOtpHint] = useState<string | null>(null);

  const [pendingGoogleUser, setPendingGoogleUser] = useState<{
    email: string;
    displayName: string;
    avatarUrl: string;
  } | null>(null);

  // 1. Google OAuth Click
  const handleGoogleLogin = () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const googleData = {
        email: 'customer.sari3@gmail.com',
        displayName: 'أمين بلحاج',
        avatarUrl: PRESET_AVATARS[0],
      };
      setPendingGoogleUser(googleData);
      setDisplayName(googleData.displayName);
      setSelectedAvatar(googleData.avatarUrl);
      // Prompt user to verify Algerian phone number
      setStep('google_phone_prompt');
    } catch (err: any) {
      setErrorMsg(err.message || 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Send SMS OTP for Standard Phone Login
  const handleSendPhoneOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      setErrorMsg(lang === 'ar' ? 'يرجى إدخال رقم هاتف جزائري صحيح' : 'Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setTestOtpHint('889315');
    setStep('phone_otp');
    setIsLoading(false);
  };

  // 3. Send SMS OTP for Google-linked phone
  const handleSendGooglePhoneOtp = (e: React.FormEvent) => {
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

  // 4. Verify OTP for Phone
  const handleVerifyPhoneOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      setErrorMsg(t.invalidOtp);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      setIsLoading(false);
      setStep('profile_setup');
    }, 400);
  };

  // 5. Verify OTP for Google
  const handleVerifyGoogleOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      setErrorMsg(t.invalidOtp);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      setIsLoading(false);
      setStep('profile_setup');
    }, 400);
  };

  // 6. Complete Customer Profile Setup & finalize authentication
  const handleFinalizeCustomerProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.startsWith('+213')
      ? phoneNumber
      : `+213${phoneNumber.replace(/^0/, '')}`;

    const newCustomer: UserProfile = {
      id: `usr-cust-${Date.now()}`,
      phone: cleanPhone || '+213 555 12 34 56',
      phoneVerified: true,
      email: pendingGoogleUser?.email,
      displayName: displayName.trim() || 'زبون سريع',
      avatarUrl: selectedAvatar,
      role: 'customer',
      wilaya: '16',
      cameraPermissionGranted: false,
      locationPermissionGranted: false,
      accountConfirmed: false,
      createdAt: new Date().toISOString(),
    };

    onAuthComplete(newCustomer);
  };

  // 7. Instant Demo Customer Login (for fast testing)
  const handleInstantDemoCustomer = () => {
    const demoCustomer: UserProfile = {
      id: 'demo-customer-dz',
      phone: '+213 550 11 22 33',
      phoneVerified: true,
      email: 'customer.demo@sari3.dz',
      displayName: 'أمين بلحاج (زبون)',
      avatarUrl: PRESET_AVATARS[0],
      role: 'customer',
      wilaya: '16',
      cameraPermissionGranted: false,
      locationPermissionGranted: false,
      accountConfirmed: false,
      createdAt: new Date().toISOString(),
    };
    onAuthComplete(demoCustomer);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto select-none">
      {/* Header with Back Button */}
      <header className="flex items-center justify-between py-2">
        <button
          type="button"
          onClick={onBackToGateway}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-700 transition"
        >
          <ArrowIcon size={14} className={isRtl ? 'rotate-180' : ''} />
          <span>{lang === 'ar' ? 'الرجوع للبوابة' : 'Back to Gateway'}</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          <Package size={14} />
          <span>بوابة الزبائن</span>
        </div>
      </header>

      {/* Main Card */}
      <main className="my-auto py-4">
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          {/* Logo & Portal Title */}
          <div className="text-center mb-6">
            <Sari3Logo size="md" className="justify-center mb-3" />
            <h1 className="text-xl font-black text-white font-['Cairo']">
              {lang === 'ar' ? 'تسجيل دخول الزبون' : 'Customer Sign In'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'ar'
                ? 'أرسل طرودك واستقبل أفضل عروض الكباتن بكل سهولة'
                : 'Send packages and receive the best courier bids easily'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: METHOD SELECT */}
          {step === 'method_select' && (
            <div className="space-y-4">
              {/* Google Auth Button */}
              <button
                type="button"
                id="btn-customer-google-auth"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-3 transition shadow-md cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{t.continueWithGoogle}</span>
              </button>

              <div className="flex items-center gap-3 my-3">
                <div className="h-[1px] flex-1 bg-slate-800" />
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  {t.orWithPhone}
                </span>
                <div className="h-[1px] flex-1 bg-slate-800" />
              </div>

              {/* Phone Form */}
              <form onSubmit={handleSendPhoneOtp} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.enterPhone}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 font-mono font-bold text-xs text-slate-400">
                      +213
                    </span>
                    <input
                      type="tel"
                      id="input-customer-phone"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="05 55 12 34 56"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-14 pr-4 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition"
                      required
                    />
                    <Smartphone size={16} className="absolute right-3 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-customer-send-phone-otp"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{t.sendOtp}</span>
                  <ArrowIcon size={14} />
                </button>
              </form>

              {/* Fast Instant Demo Customer Button */}
              <div className="pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  id="btn-customer-instant-demo"
                  onClick={handleInstantDemoCustomer}
                  className="w-full py-2.5 rounded-xl bg-slate-800/60 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>دخول فوري كزبون تجريبي (تجربة سريعة)</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PHONE OTP VERIFICATION */}
          {step === 'phone_otp' && (
            <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
              <div className="text-center">
                <p className="text-xs text-slate-400">
                  {t.otpSentTo} <span className="font-mono text-emerald-400 font-bold">{phoneNumber}</span>
                </p>
                {testOtpHint && (
                  <p className="text-[11px] text-amber-400 font-mono mt-1">
                    رمز التأكيد التجريبي: {testOtpHint}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  id="input-customer-otp"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="------"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 text-center font-mono font-black text-xl tracking-[0.4em] text-white focus:outline-none focus:border-emerald-500 transition"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                id="btn-customer-verify-otp"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{t.verifyOtp}</span>
                <CheckCircle2 size={16} />
              </button>

              <button
                type="button"
                onClick={() => setStep('method_select')}
                className="w-full text-center text-xs text-slate-400 hover:text-white"
              >
                {lang === 'ar' ? 'تغيير رقم الهاتف' : 'Change Phone Number'}
              </button>
            </form>
          )}

          {/* STEP 3: GOOGLE PHONE PROMPT (MANDATORY ALGERIAN NUMBER VERIFICATION) */}
          {step === 'google_phone_prompt' && (
            <form onSubmit={handleSendGooglePhoneOtp} className="space-y-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">{t.googlePhoneVerifyTitle}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{t.googlePhoneVerifyDesc}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t.enterPhone}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-mono font-bold text-xs text-slate-400">
                    +213
                  </span>
                  <input
                    type="tel"
                    id="input-google-linked-phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="05 55 12 34 56"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-14 pr-4 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition"
                    required
                  />
                  <Smartphone size={16} className="absolute right-3 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                id="btn-google-send-otp"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{t.sendOtp}</span>
                <ArrowIcon size={14} />
              </button>
            </form>
          )}

          {/* STEP 4: GOOGLE OTP VERIFY */}
          {step === 'google_otp_verify' && (
            <form onSubmit={handleVerifyGoogleOtp} className="space-y-4">
              <div className="text-center">
                <p className="text-xs text-slate-400">
                  {t.otpSentTo} <span className="font-mono text-emerald-400 font-bold">{phoneNumber}</span>
                </p>
                {testOtpHint && (
                  <p className="text-[11px] text-amber-400 font-mono mt-1">
                    رمز التأكيد التجريبي: {testOtpHint}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  id="input-google-otp"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="------"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 text-center font-mono font-black text-xl tracking-[0.4em] text-white focus:outline-none focus:border-emerald-500 transition"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                id="btn-google-verify-otp"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{t.verifyOtp}</span>
                <CheckCircle2 size={16} />
              </button>
            </form>
          )}

          {/* STEP 5: CUSTOMER PROFILE SETUP (DISPLAY NAME & AVATAR) */}
          {step === 'profile_setup' && (
            <form onSubmit={handleFinalizeCustomerProfile} className="space-y-4">
              <div className="text-center mb-2">
                <h3 className="font-bold text-sm text-white">إعداد الملف الشخصي للزبون</h3>
                <p className="text-xs text-slate-400">حدد الاسم والصورة التي تظهر للكباتن عند طلب التوصيل</p>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 text-center">
                  اختر الصورة الرمزية
                </label>
                <div className="flex items-center justify-center gap-2 mb-3">
                  {PRESET_AVATARS.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Avatar"
                      onClick={() => setSelectedAvatar(url)}
                      className={`w-11 h-11 rounded-full object-cover cursor-pointer border-2 transition ${
                        selectedAvatar === url
                          ? 'border-emerald-500 scale-110 shadow-lg shadow-emerald-500/30'
                          : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  اسم العرض (الاسم واللقب)
                </label>
                <input
                  type="text"
                  id="input-customer-displayname"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="أمين بلحاج"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>

              <button
                type="submit"
                id="btn-customer-complete-auth"
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <span>متابعة لطلب الصلاحيات</span>
                <ArrowIcon size={14} />
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="text-center py-2 text-[11px] text-slate-500">
        بوابة زبائن Sari3 • خصوصية وأمان عالي
      </footer>
    </div>
  );
};
