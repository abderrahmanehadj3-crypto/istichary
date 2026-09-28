import React, { useState, useEffect, useRef } from 'react';
import { AppTranslations } from '../i18n/translations';
import { Language, ThemeMode, UserProfile } from '../types';
import { Sari3Logo } from './Sari3Logo';
import {
  triggerGoogleSignIn,
  signInWithFirebaseGoogle,
  GoogleUserProfile,
} from '../utils/googleAuth';
import {
  detectAlgerianCarrier,
  sendAlgerianSmsOtp,
  verifyAlgerianSmsOtp,
  SmsDispatchReceipt,
  CarrierInfo,
} from '../utils/algeriaSmsGateway';
import {
  Smartphone,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Globe,
  Sun,
  Moon,
  KeyRound,
  Check,
  Radio,
  Timer,
  ChevronRight,
  ChevronLeft,
  Send,
} from 'lucide-react';
import { generateUuid, saveUserProfileToFirestore } from '../utils/firebaseSync';

interface UnifiedAuthFlowProps {
  t: AppTranslations;
  lang: Language;
  theme: ThemeMode;
  onLanguageChange: (lang: Language) => void;
  onThemeToggle: () => void;
  onAuthSuccess: (user: UserProfile) => void;
}

type AuthMethod = 'phone' | 'google';
type AuthStep = 'select_method' | 'verify_phone_otp' | 'google_phone_prompt';

export const UnifiedAuthFlow: React.FC<UnifiedAuthFlowProps> = ({
  t,
  lang,
  theme,
  onLanguageChange,
  onThemeToggle,
  onAuthSuccess,
}) => {
  const isRtl = lang === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const SubArrowIcon = isRtl ? ChevronLeft : ChevronRight;

  const [method, setMethod] = useState<AuthMethod>('phone');
  const [step, setStep] = useState<AuthStep>('select_method');

  // Input states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [carrierInfo, setCarrierInfo] = useState<CarrierInfo>(() => detectAlgerianCarrier(''));
  const [deliveryChannel, setDeliveryChannel] = useState<'sms' | 'whatsapp'>('sms');
  const [emailAddress, setEmailAddress] = useState('');
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | undefined>(undefined);
  const [selectedBirthDate, setSelectedBirthDate] = useState<string | undefined>(undefined);
  const [otpCode, setOtpCode] = useState('');

  // Active Live SMS Gateway State
  const [smsReceipt, setSmsReceipt] = useState<SmsDispatchReceipt | null>(null);
  const [resendCountdown, setResendCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);

  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Update carrier detection in real-time as user types phone
  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val);
    const detected = detectAlgerianCarrier(val);
    setCarrierInfo(detected);
    if (errorMsg) setErrorMsg(null);
  };

  // Live OTP Resend Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if ((step === 'verify_phone_otp') && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCountdown]);

  // Permanently disable Google One-Tap automatic popups on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.cancel();
        window.google.accounts.id.disableAutoSelect();
      } catch (e) {}
    }
  }, []);

  // 1. Official Google Sign-In Trigger (Manual Click Only)
  const handleGoogleSignInClick = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setStatusNotice(lang === 'ar' ? 'جاري فتح نافذة حساب Google عبر Firebase...' : 'Connecting to Google via Firebase...');

    try {
      // 1. Attempt Official Firebase Auth Google Popup
      const googleUser = await triggerGoogleSignIn();
      if (googleUser && googleUser.email) {
        setEmailAddress(googleUser.email);
        setDisplayName(googleUser.name);
        setSelectedAvatarUrl(googleUser.avatarUrl);
        setIsLoading(false);
        setStatusNotice(null);
        setStep('google_phone_prompt');
        return;
      }
    } catch (e: any) {
      console.warn('Firebase Google Auth notice:', e);
    }

    // 2. Direct Fallback to Firebase Google Provider
    try {
      setStatusNotice(
        lang === 'ar'
          ? 'جاري التحويل إلى مزود Google عبر Firebase...'
          : 'Connecting via Firebase Google provider...'
      );
      const res = await signInWithFirebaseGoogle();
      if (!res.success && res.error) {
        setIsLoading(false);
        setStatusNotice(null);
        setErrorMsg(
          lang === 'ar'
            ? `تعذر بدء تسجيل الدخول بحساب Google (${res.error}). يمكنك إدخال بريدك مباشرة أدناه.`
            : `Google Sign-In notice (${res.error}). You can enter your email directly below.`
        );
        return;
      }
    } catch (e: any) {
      console.warn('Firebase OAuth notice:', e);
      setIsLoading(false);
      setStatusNotice(null);
      setErrorMsg(
        lang === 'ar'
          ? 'تعذر بدء تسجيل الدخول بحساب Google. يمكنك إدخال بريدك الإلكتروني مباشرة أدناه.'
          : 'Unable to initiate Google Sign-In. You can enter your email directly below.'
      );
      return;
    }

    setIsLoading(false);
    setStatusNotice(null);
  };

  // 2. Direct Google Email Entry Handler
  const handleDirectGoogleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = googleEmailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى إدخال عنوان بريد Google إلكتروني صالح'
          : 'Please enter a valid Google email address'
      );
      return;
    }
    setEmailAddress(cleanEmail);
    const inferredName = cleanEmail.split('@')[0].replace(/[._]/g, ' ');
    setDisplayName(inferredName);
    setErrorMsg(null);
    setStep('google_phone_prompt');
  };

  // 3. Dispatch Live Algerian SMS/OTP to Phone
  const handleDispatchSmsOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!carrierInfo.valid) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى إدخال رقم هاتف جزائري صالح (موبيليس 06، جيزي 07، أو أوريدو 05)'
          : 'Please enter a valid Algerian phone number (Mobilis 06, Djezzy 07, or Ooredoo 05)'
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setStatusNotice(
      lang === 'ar'
        ? `جاري إرسال رمز التحقق عبر ${deliveryChannel === 'whatsapp' ? 'واتساب' : 'SMS'} (${carrierInfo.carrierNameAr})...`
        : `Sending verification code via ${deliveryChannel.toUpperCase()} (${carrierInfo.carrier})...`
    );

    try {
      const receipt = await sendAlgerianSmsOtp(carrierInfo.normalizedE164, deliveryChannel);
      setSmsReceipt(receipt);
      setIsLoading(false);
      setStatusNotice(null);
      setResendCountdown(60);
      setCanResend(false);
      setOtpCode('');
      setStep('verify_phone_otp');
    } catch (err: any) {
      setIsLoading(false);
      setStatusNotice(null);
      setErrorMsg(err.message || 'فشل إرسال رمز التحقق. يرجى التأكد من اتصال الشبكة.');
    }
  };

  // 4. Resend Live SMS/WhatsApp OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const receipt = await sendAlgerianSmsOtp(carrierInfo.normalizedE164, deliveryChannel);
      setSmsReceipt(receipt);
      setIsLoading(false);
      setResendCountdown(60);
      setCanResend(false);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'تعذر إعادة الإرسال حالياً.');
    }
  };

  // 5. Verify Live OTP and Finalize Authentication
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى إدخال رمز التحقق المكون من 6 أرقام'
          : 'Please enter the 6-digit verification code'
      );
      return;
    }

    if (!smsReceipt) {
      setErrorMsg('جلسة التحقق غير متوفرة. يرجى طلب رمز جديد.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setStatusNotice(lang === 'ar' ? 'جاري التحقق من الرمز مع الخادم وقاعدة البيانات...' : 'Verifying code with server...');

    try {
      const calculatedName =
        displayName.trim() ||
        (emailAddress ? emailAddress.split('@')[0].replace(/[._]/g, ' ') : 'مستخدم سريع');

      const result = await verifyAlgerianSmsOtp(
        smsReceipt.sessionToken,
        otpCode,
        carrierInfo.normalizedE164,
        calculatedName
      );

      if (!result.success) {
        setIsLoading(false);
        setStatusNotice(null);
        setErrorMsg(result.error || 'رمز التحقق غير صحيح');
        return;
      }

      // Verification Succeeded! Create Production UserProfile with guaranteed valid UUID
      const userId = result.user?.id || generateUuid();

      const authenticatedUser: UserProfile = {
        id: userId,
        email: emailAddress || undefined,
        phone: carrierInfo.formattedNational,
        phoneVerified: true,
        displayName: calculatedName,
        avatarUrl: selectedAvatarUrl || undefined,
        birthDate: selectedBirthDate || '',
        wilaya: '16',
        customerProfileCompleted: false,
        cameraPermissionGranted: false,
        locationPermissionGranted: false,
        accountConfirmed: true,
        createdAt: new Date().toISOString(),
      };

      // Persist to Cloud Firestore live database
      await saveUserProfileToFirestore(authenticatedUser);

      setIsLoading(false);
      setStatusNotice(null);
      onAuthSuccess(authenticatedUser);
    } catch (err: any) {
      setIsLoading(false);
      setStatusNotice(null);
      setErrorMsg(err.message || 'حدث خطأ أثناء تأكيد الرمز.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto select-none">
      {/* Top Header: Brand & Controls */}
      <header className="flex items-center justify-between py-2">
        <Sari3Logo size="md" showTagline taglineText={t.tagline} />

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative flex items-center">
            <select
              id="select-unified-auth-lang"
              value={lang}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="bg-slate-900 border border-slate-700/80 text-slate-200 text-xs font-bold rounded-xl px-2 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none pr-6 pl-2"
            >
              <option value="ar">العربية</option>
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="ru">Русский</option>
            </select>
            <Globe size={12} className="absolute right-2 text-slate-400 pointer-events-none" />
          </div>

          {/* Theme Toggle */}
          <button
            id="btn-unified-auth-theme"
            type="button"
            onClick={onThemeToggle}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-emerald-400 transition cursor-pointer"
            title="تبديل المظهر"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="my-auto py-6">
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Header Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <Sparkles size={14} />
              <span>
                {lang === 'ar'
                  ? 'بوابة تسجيل الدخول الرسمية'
                  : 'Official Authentication Gateway'}
              </span>
            </div>

            <h1 className="text-2xl font-black text-white font-['Cairo'] tracking-tight">
              {step === 'verify_phone_otp'
                ? lang === 'ar'
                  ? 'تأكيد رمز التحقق (SMS)'
                  : 'Verify SMS Code'
                : step === 'google_phone_prompt'
                ? lang === 'ar'
                  ? 'ربط رقم الهاتف الجزائري'
                  : 'Link Algerian Phone'
                : lang === 'ar'
                ? 'تسجيل الدخول إلى سريع'
                : 'Sign In to Sari3'}
            </h1>

            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              {step === 'verify_phone_otp'
                ? lang === 'ar'
                  ? `أدخل رمز التحقق المكون من 6 أرقام المرسل عبر SMS إلى ${carrierInfo.formattedNational}`
                  : `Enter the 6-digit SMS verification code sent to ${carrierInfo.formattedNational}`
                : step === 'google_phone_prompt'
                ? lang === 'ar'
                  ? 'لإتمام التحقق وأمان الصفقات، يرجى تأكيد رقم هاتفك الجزائري (موبيليس، جيزي، أو أوريدو)'
                  : 'To secure your account, please verify your Algerian mobile number'
                : lang === 'ar'
                ? 'سجل دخولك برقم الهاتف الجزائري أو عبر حساب Google الموثق'
                : 'Sign in using your Algerian mobile phone or verified Google account'}
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Status Live Notification */}
          {statusNotice && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <Radio size={15} className="animate-pulse text-emerald-400 shrink-0" />
              <span>{statusNotice}</span>
            </div>
          )}

          {/* STEP 1: Main Credentials Input (Phone vs Google Tab) */}
          {step === 'select_method' && (
            <div className="space-y-5">
              {/* Method Switcher Tabs */}
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-950 border border-slate-800">
                <button
                  type="button"
                  id="tab-auth-phone"
                  onClick={() => {
                    setMethod('phone');
                    setErrorMsg(null);
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    method === 'phone'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone size={16} />
                  <span>{lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</span>
                </button>

                <button
                  type="button"
                  id="tab-auth-google"
                  onClick={() => {
                    setMethod('google');
                    setErrorMsg(null);
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    method === 'google'
                      ? 'bg-white text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {/* Google SVG Icon */}
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.35 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.99 0 12s.46 3.83 1.26 5.42l4.02-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Google</span>
                </button>
              </div>

              {/* Form 1A: Live Algerian Phone Login */}
              {method === 'phone' && (
                <form onSubmit={handleDispatchSmsOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Smartphone size={14} className="text-emerald-400" />
                        <span>{lang === 'ar' ? 'رقم الهاتف الجزائري' : 'Algerian Mobile Number'}</span>
                      </label>

                      {/* Live Carrier Indicator Badge */}
                      {carrierInfo.carrier !== 'Unknown' && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all animate-in fade-in ${carrierInfo.themeColor}`}
                        >
                          {carrierInfo.networkBadge}
                        </span>
                      )}
                    </div>

                    <div className="relative flex items-center">
                      <span className="absolute left-3 dir-ltr text-xs font-mono font-bold text-slate-400 pointer-events-none">
                        +213
                      </span>
                      <input
                        type="tel"
                        id="input-auth-phone"
                        dir="ltr"
                        value={phoneNumber}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="05 / 06 / 07 xx xx xx"
                        className="w-full pl-14 pr-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-white font-mono text-base focus:border-emerald-500 focus:outline-none transition shadow-inner font-bold"
                        required
                        autoFocus
                      />
                    </div>

                    {/* Operator Hints & Carrier Status */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
                      <span>{carrierInfo.carrierNameAr}</span>
                      <span className="font-mono text-[10px] text-slate-500">موبيليس • جيزي • أوريدو</span>
                    </div>
                  </div>

                  {/* Delivery Channel Selector (SMS / WhatsApp) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">
                      {lang === 'ar' ? 'طريقة استلام رمز التحقق:' : 'OTP Delivery Channel:'}
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                      <button
                        type="button"
                        id="btn-channel-sms"
                        onClick={() => setDeliveryChannel('sms')}
                        className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          deliveryChannel === 'sms'
                            ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Radio size={14} />
                        <span>{lang === 'ar' ? 'رسالة SMS' : 'SMS'}</span>
                      </button>
                      <button
                        type="button"
                        id="btn-channel-whatsapp"
                        onClick={() => setDeliveryChannel('whatsapp')}
                        className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          deliveryChannel === 'whatsapp'
                            ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Send size={14} />
                        <span>{lang === 'ar' ? 'واتساب WhatsApp' : 'WhatsApp'}</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="btn-auth-send-phone-otp"
                    disabled={isLoading}
                    className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60"
                  >
                    <span>
                      {isLoading
                        ? lang === 'ar'
                          ? 'جاري إرسال الرمز...'
                          : 'Sending Code...'
                        : lang === 'ar'
                        ? deliveryChannel === 'whatsapp'
                          ? 'إرسال الرمز عبر WhatsApp'
                          : 'إرسال رمز التحقق SMS'
                        : `Send Code via ${deliveryChannel.toUpperCase()}`}
                    </span>
                    <ArrowIcon size={16} />
                  </button>
                </form>
              )}

              {/* Form 1B: Official Google Sign-In */}
              {method === 'google' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Official Google Sign-In Button */}
                  <button
                    type="button"
                    id="btn-official-google-signin"
                    onClick={handleGoogleSignInClick}
                    disabled={isLoading}
                    className="w-full py-4 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-black text-sm shadow-xl shadow-white/10 transition flex items-center justify-center gap-3 cursor-pointer active:scale-95 border border-slate-300"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.35 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.99 0 12s.46 3.83 1.26 5.42l4.02-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>
                      {isLoading
                        ? lang === 'ar'
                          ? 'جاري الاتصال بـ Google...'
                          : 'Connecting to Google...'
                        : lang === 'ar'
                        ? 'المتابعة باستخدام حساب Google'
                        : 'Sign in with Google'}
                    </span>
                  </button>

                  <div className="relative flex items-center justify-center my-3">
                    <div className="border-t border-slate-800 w-full" />
                    <span className="bg-slate-900 px-3 text-[11px] text-slate-500 font-bold shrink-0">
                      {lang === 'ar' ? 'أو أدخل عنوان بريدك' : 'Or enter your email'}
                    </span>
                    <div className="border-t border-slate-800 w-full" />
                  </div>

                  <form onSubmit={handleDirectGoogleEmailSubmit} className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">
                        {lang === 'ar' ? 'عنوان بريد Google (@gmail.com)' : 'Google Email Address (@gmail.com)'}
                      </label>
                      <input
                        type="email"
                        id="input-direct-google-email"
                        value={googleEmailInput}
                        onChange={(e) => setGoogleEmailInput(e.target.value)}
                        placeholder="yourname@gmail.com"
                        dir="ltr"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700/80 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none transition shadow-inner font-bold"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !googleEmailInput.trim()}
                      className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <span>{lang === 'ar' ? 'متابعة إلى ربط الهاتف' : 'Continue to Phone Link'}</span>
                      <ArrowIcon size={15} />
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Google Flow -> Prompt for Algerian Phone Number */}
          {step === 'google_phone_prompt' && (
            <form onSubmit={handleDispatchSmsOtp} className="space-y-4 animate-in fade-in duration-300">
              {/* Selected Google Account Summary Pill */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/40 flex items-center justify-between gap-3 shadow-lg shadow-emerald-950/20">
                <div className="flex items-center gap-3 min-w-0">
                  {selectedAvatarUrl ? (
                    <img
                      src={selectedAvatarUrl}
                      alt="Google Avatar"
                      className="w-10 h-10 rounded-full object-cover border border-emerald-400 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-sm shrink-0">
                      {displayName ? displayName.charAt(0).toUpperCase() : 'G'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{displayName || emailAddress}</p>
                    <p className="text-[11px] text-emerald-400 font-mono truncate">{emailAddress}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('select_method')}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 text-[11px] font-bold border border-slate-800 transition flex-shrink-0 cursor-pointer"
                >
                  {lang === 'ar' ? 'تغيير' : 'Change'}
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-amber-400" />
                  <span>{lang === 'ar' ? 'التحقق الإلزامي برقم الهاتف' : 'Mandatory Phone Verification'}</span>
                </p>
                <p className="text-[11px] text-amber-300/80">
                  {lang === 'ar'
                    ? 'لاستكمال حسابك والتواصل المباشر مع الكباتن والزبائن، يجب ربط وتأكيد رقم هاتف جزائري فعال.'
                    : 'To dispatch orders and connect with couriers, verify your Algerian phone number.'}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Smartphone size={14} className="text-emerald-400" />
                    <span>{lang === 'ar' ? 'رقم الهاتف لتأكيد الحساب' : 'Your Phone Number for Verification'}</span>
                  </label>

                  {carrierInfo.carrier !== 'Unknown' && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all animate-in fade-in ${carrierInfo.themeColor}`}
                    >
                      {carrierInfo.networkBadge}
                    </span>
                  )}
                </div>

                <div className="relative flex items-center">
                  <span className="absolute left-3 dir-ltr text-xs font-mono font-bold text-slate-400 pointer-events-none">
                    +213
                  </span>
                  <input
                    type="tel"
                    id="input-auth-google-phone"
                    dir="ltr"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="05 / 06 / 07 xx xx xx"
                    className="w-full pl-14 pr-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-white font-mono text-base focus:border-emerald-500 focus:outline-none transition shadow-inner font-bold"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('select_method')}
                  className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  {lang === 'ar' ? 'رجوع' : 'Back'}
                </button>

                <button
                  type="submit"
                  id="btn-send-google-phone-otp"
                  disabled={isLoading}
                  className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  <span>{isLoading ? 'جاري الإرسال...' : (lang === 'ar' ? 'إرسال رمز التأكيد SMS' : 'Send SMS Verification Code')}</span>
                  <ArrowIcon size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Live SMS OTP Verification Screen */}
          {step === 'verify_phone_otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in duration-300">
              {/* Carrier Dispatch Receipt Pill */}
              {smsReceipt && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Radio size={14} className="text-emerald-400" />
                      <span>قناة الإرسال:</span>
                    </span>
                    <span className="font-bold text-white">
                      {smsReceipt.channel === 'whatsapp' ? 'واتساب WhatsApp' : 'رسالة قصيرة SMS'} ({smsReceipt.carrierName})
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>الوجهة:</span>
                    <span className="font-mono text-emerald-400 font-bold">{smsReceipt.destination}</span>
                  </div>

                  {/* WhatsApp Quick Verification Link */}
                  {smsReceipt.whatsappLink && (
                    <a
                      href={smsReceipt.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer mt-1"
                    >
                      <Send size={13} />
                      <span>{lang === 'ar' ? 'استلام الرمز عبر تطبيق WhatsApp الآن' : 'Get Code via WhatsApp App'}</span>
                    </a>
                  )}

                  {/* Live Verification Indicator in Preview/Dev */}
                  {smsReceipt.devCode && (
                    <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>رمز التحقق المستلم:</span>
                      <button
                        type="button"
                        onClick={() => setOtpCode(smsReceipt.devCode!)}
                        className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold hover:bg-emerald-500/30 transition cursor-pointer"
                        title="انقر لتعبئة الرمز تلقائياً"
                      >
                        {smsReceipt.devCode} (تعبئة تلقائية)
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound size={14} className="text-emerald-400" />
                    <span>{lang === 'ar' ? 'رمز التأكيد (SMS)' : 'Verification Code (SMS)'}</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Timer size={12} className="text-emerald-400" />
                    <span>
                      {Math.floor(resendCountdown / 60)}:{(resendCountdown % 60).toString().padStart(2, '0')}
                    </span>
                  </span>
                </label>

                <input
                  type="text"
                  id="input-auth-otp-code"
                  dir="ltr"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="------"
                  maxLength={6}
                  className="w-full py-3.5 px-4 rounded-2xl bg-slate-950 border border-slate-700/80 text-emerald-400 font-mono text-2xl tracking-[0.4em] text-center focus:border-emerald-500 focus:outline-none transition shadow-inner font-black"
                  required
                  autoFocus
                />
              </div>

              {/* Resend Option */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>{lang === 'ar' ? 'لم يصلك الرمز؟' : "Didn't receive SMS?"}</span>
                <button
                  type="button"
                  disabled={!canResend || isLoading}
                  onClick={handleResendOtp}
                  className={`font-bold transition ${
                    canResend
                      ? 'text-emerald-400 hover:underline cursor-pointer'
                      : 'text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {canResend
                    ? lang === 'ar'
                      ? 'إعادة إرسال SMS'
                      : 'Resend SMS'
                    : `${lang === 'ar' ? 'إعادة الإرسال بعد' : 'Resend in'} ${resendCountdown}s`}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (emailAddress) {
                      setStep('google_phone_prompt');
                    } else {
                      setStep('select_method');
                    }
                  }}
                  className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  {lang === 'ar' ? 'تعديل الرقم' : 'Edit Number'}
                </button>

                <button
                  type="submit"
                  id="btn-auth-verify-otp"
                  disabled={isLoading || otpCode.length !== 6}
                  className="flex-1 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  <CheckCircle2 size={18} />
                  <span>
                    {isLoading
                      ? lang === 'ar'
                        ? 'جاري التأكيد...'
                        : 'Verifying...'
                      : lang === 'ar'
                      ? 'تأكيد الحساب ومتابعة'
                      : 'Verify & Continue'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-3 text-[11px] text-slate-500">
        <p>Sari3 Algeria • بوابة التوصيل السريع والآمن في 58 ولاية</p>
      </footer>
    </div>
  );
};
