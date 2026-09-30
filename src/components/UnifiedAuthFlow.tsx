import React, { useState, useEffect } from 'react';
import { AppTranslations } from '../i18n/translations';
import { Language, ThemeMode, UserProfile, UserRole } from '../types';
import { Sari3Logo } from './Sari3Logo';
import {
  triggerGoogleSignIn,
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
  User,
  Truck,
  Package,
  RotateCw,
} from 'lucide-react';
import { generateUuid, saveUserProfile } from '../utils/supabaseSync';
import { ALGERIA_WILAYAS } from '../data/wilayas';

interface UnifiedAuthFlowProps {
  t: AppTranslations;
  lang: Language;
  theme: ThemeMode;
  onLanguageChange: (lang: Language) => void;
  onThemeToggle: () => void;
  onAuthSuccess: (user: UserProfile) => void;
}

type AuthStep =
  | 'phone_input'
  | 'verify_otp'
  | 'customer_name_prompt'
  | 'driver_direct_login';

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

  // Selected Intent: 'customer' or 'driver'
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [step, setStep] = useState<AuthStep>('phone_input');

  // Input states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [carrierInfo, setCarrierInfo] = useState<CarrierInfo>(() => detectAlgerianCarrier(''));
  const [deliveryChannel, setDeliveryChannel] = useState<'sms' | 'whatsapp'>('sms');
  const [otpCode, setOtpCode] = useState('');

  // Customer Name only (No profile pictures, No file uploads, No forced email)
  const [fullName, setFullName] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState('16'); // Default Algiers

  // Driver login optional states
  const [driverEmail, setDriverEmail] = useState('');

  // Active Live SMS Gateway State
  const [smsReceipt, setSmsReceipt] = useState<SmsDispatchReceipt | null>(null);
  const [resendCountdown, setResendCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [verifiedPhone, setVerifiedPhone] = useState<string>('');
  const [createdUserId, setCreatedUserId] = useState<string>('');

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
    if (step === 'verify_otp' && resendCountdown > 0) {
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

  // 1. Dispatch SMS/WhatsApp OTP to Algerian Mobile Number
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
      setStep('verify_otp');
    } catch (err: any) {
      setIsLoading(false);
      setStatusNotice(null);
      setErrorMsg(err.message || 'فشل إرسال رمز التحقق. يمكنك تجربة قناة واتساب أو المتابعة المباشرة.');
    }
  };

  // 2. Resend Live SMS/WhatsApp OTP
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

  // 3. Automated Server-Side WhatsApp Delivery
  const handleRequestOtpViaWhatsApp = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setStatusNotice(
      lang === 'ar'
        ? `جاري إرسال رمز التحقق تلقائياً عبر خدمة واتساب الرسمية (${carrierInfo.carrierNameAr})...`
        : `Sending verification code automatically via WhatsApp Business API...`
    );

    try {
      const receipt = await sendAlgerianSmsOtp(carrierInfo.normalizedE164, 'whatsapp');
      setSmsReceipt(receipt);
      setDeliveryChannel('whatsapp');
      setIsLoading(false);
      setStatusNotice(
        lang === 'ar'
          ? 'تم إرسال رمز التحقق إلى حسابك على واتساب. يرجى مراجعة رسائلك وإدخال الرمز المكون من 6 أرقام.'
          : 'Verification code dispatched to your WhatsApp account.'
      );
      setResendCountdown(60);
      setCanResend(false);
      setOtpCode('');
    } catch (err: any) {
      setIsLoading(false);
      setStatusNotice(null);
      setErrorMsg(err.message || 'فشل إرسال الرمز عبر واتساب.');
    }
  };

  // 4. Strictly Verify Entered OTP with Server
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otpCode.trim();

    if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى إدخال رمز التحقق المكون من 6 أرقام بشكل صحيح (أرقام فقط)'
          : 'Please enter a valid 6-digit verification code'
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setStatusNotice(
      lang === 'ar' ? 'جاري التحقق من صحة الرمز مع الخادم وقاعدة البيانات...' : 'Verifying code...'
    );

    try {
      const result = await verifyAlgerianSmsOtp(
        smsReceipt?.sessionToken || '',
        cleanCode,
        carrierInfo.normalizedE164,
        fullName.trim() || undefined,
        selectedRole
      );

      // STRICT CHECK: The system MUST NEVER accept an incorrect OTP code!
      if (!result.success) {
        setIsLoading(false);
        setStatusNotice(null);
        setErrorMsg(result.error || (lang === 'ar' ? 'رمز التحقق غير صحيح. يرجى التأكد من الرمز المدخل.' : 'Invalid verification code.'));
        return;
      }

      setIsLoading(false);
      setStatusNotice(null);
      setVerifiedPhone(carrierInfo.formattedNational);
      const uid = result.user?.id || generateUuid();
      setCreatedUserId(uid);

      if (selectedRole === 'customer') {
        // Redesigned simplified customer flow:
        // Immediately prompt for "الاسم واللقب" (First and Last Name) only!
        setStep('customer_name_prompt');
      } else {
        // Driver flow
        const driverUser: UserProfile = {
          id: uid,
          phone: carrierInfo.formattedNational,
          phoneVerified: true,
          displayName: result.user?.displayName || 'كابتن سريع',
          role: 'driver',
          wilaya: '16',
          accountConfirmed: true,
          createdAt: new Date().toISOString(),
        };
        await saveUserProfile(driverUser);
        onAuthSuccess(driverUser);
      }
    } catch (err: any) {
      setIsLoading(false);
      setStatusNotice(null);
      setErrorMsg(err.message || 'حدث خطأ أثناء تأكيد الرمز.');
    }
  };

  // 5. Finalize Simplified Customer Registration: Name and Wilaya ONLY
  const handleCustomerNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fullName.trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى إدخال الاسم واللقب بشكل صحيح (مثال: أمين بن علي)'
          : 'Please enter your first and last name (e.g., Amine Benali)'
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setStatusNotice(lang === 'ar' ? 'جاري حفظ ملف الزبون في Supabase...' : 'Saving customer profile in Supabase...');

    try {
      const uid = createdUserId || generateUuid();
      const customerProfile: UserProfile = {
        id: uid,
        phone: verifiedPhone || carrierInfo.formattedNational,
        phoneVerified: true,
        displayName: cleanName,
        // STRICT REQUIREMENT: No profile picture, No forced email
        avatarUrl: undefined,
        email: undefined,
        role: 'customer',
        wilaya: selectedWilaya,
        customerProfileCompleted: true,
        cameraPermissionGranted: false,
        locationPermissionGranted: false,
        accountConfirmed: true,
        createdAt: new Date().toISOString(),
      };

      await saveUserProfile(customerProfile);

      setIsLoading(false);
      setStatusNotice(null);
      // Immediately transition to Customer Home / Map
      onAuthSuccess(customerProfile);
    } catch (err: any) {
      setIsLoading(false);
      setStatusNotice(null);
      setErrorMsg(err.message || 'فشل حفظ الملف الشخصي.');
    }
  };

  // 6. Google Sign-In (Optional alternative)
  const handleGoogleSignInClick = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setStatusNotice(
      lang === 'ar'
        ? 'جاري التحويل إلى مزود Google عبر Supabase...'
        : 'Connecting to Google via Supabase...'
    );

    try {
      const res = await triggerGoogleSignIn();
      if (!res.success && res.error) {
        setIsLoading(false);
        setStatusNotice(null);
        setErrorMsg(
          lang === 'ar'
            ? `تعذر تسجيل الدخول بـ Google (${res.error}). يمكنك الدخول برقم الهاتف مباشرة.`
            : `Google notice: ${res.error}`
        );
      }
    } catch (e: any) {
      setIsLoading(false);
      setStatusNotice(null);
      setErrorMsg('تعذر فتح تسجيل الدخول بحساب Google. يرجى المتابعة برقم الهاتف.');
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

      {/* Main Content Area */}
      <main className="my-auto py-6">
        {/* Role Selector Pill: Customer vs Driver */}
        {step === 'phone_input' && (
          <div className="mb-6 p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center shadow-lg">
            <button
              type="button"
              id="btn-select-role-customer"
              onClick={() => {
                setSelectedRole('customer');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                selectedRole === 'customer'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package size={16} />
              <span>أنا زبون (إرسال طرد)</span>
            </button>

            <button
              type="button"
              id="btn-select-role-driver"
              onClick={() => {
                setSelectedRole('driver');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                selectedRole === 'driver'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Truck size={16} />
              <span>أنا كابتن (سائق توصيل)</span>
            </button>
          </div>
        )}

        {/* Global Loading Banner */}
        {isLoading && statusNotice && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-pulse">
            <Sparkles size={16} className="animate-spin shrink-0" />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2 animate-fade-in">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 1: PHONE NUMBER INPUT */}
        {/* =================================================================== */}
        {step === 'phone_input' && (
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md">
            <div className="mb-5 text-center">
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl ${
                  selectedRole === 'customer'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                } mb-3`}
              >
                {selectedRole === 'customer' ? <Package size={24} /> : <Truck size={24} />}
              </div>
              <h2 className="text-xl font-black text-white font-['Cairo']">
                {selectedRole === 'customer' ? 'تسجيل زبون سريع' : 'تسجيل كابتن التوصيل'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {selectedRole === 'customer'
                  ? 'أدخل رقم هاتفك لتسجيل الدخول وطلب التوصيل فوراً'
                  : 'أدخل رقم هاتفك لبدء توثيق الحساب واستقبال الطلبات'}
              </p>
            </div>

            <form onSubmit={handleDispatchSmsOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>{t.phoneAuthLabel}</span>
                  {carrierInfo.valid && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${carrierInfo.themeColor}`}
                    >
                      {carrierInfo.networkBadge}
                    </span>
                  )}
                </label>

                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center gap-1 text-slate-400 text-xs font-mono font-bold pointer-events-none select-none">
                    <span>+213</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block ml-1"></span>
                  </div>

                  <input
                    type="tel"
                    id="input-auth-phone"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="0661 23 45 67"
                    dir="ltr"
                    autoFocus
                    required
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-16 pr-4 py-3.5 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>

                <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                  <span>يدعم: موبيليس (06)، جيزي (07)، أوريدو (05)</span>
                  {carrierInfo.valid && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      {carrierInfo.carrierNameAr}
                    </span>
                  )}
                </div>
              </div>

              {/* Delivery Channel Selector: SMS vs WhatsApp */}
              <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">قناة الإرسال:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDeliveryChannel('sms')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      deliveryChannel === 'sms'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone size={13} />
                    <span>رسالة SMS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryChannel('whatsapp')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      deliveryChannel === 'whatsapp'
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Send size={13} />
                    <span>واتساب WhatsApp</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-auth-send-phone-otp"
                disabled={isLoading || !carrierInfo.valid}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>{isLoading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}</span>
                <ArrowIcon size={16} />
              </button>
            </form>

            {/* Alternative: Google Sign-In */}
            <div className="mt-5 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                id="btn-auth-google-oauth"
                onClick={handleGoogleSignInClick}
                disabled={isLoading}
                className="w-full py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>المتابعة بحساب Google</span>
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 2: VERIFY OTP CODE (WITH RELIABLE FALLBACK) */}
        {/* =================================================================== */}
        {step === 'verify_otp' && (
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md">
            <div className="mb-4 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
                <KeyRound size={24} />
              </div>
              <h2 className="text-xl font-black text-white font-['Cairo']">
                أدخل رمز التحقق
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                تم إرسال رمز مكون من 6 أرقام إلى{' '}
                <span className="font-mono text-emerald-400 font-bold" dir="ltr">
                  {carrierInfo.formattedNational}
                </span>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <input
                  type="text"
                  id="input-auth-otp-code"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/[^0-9]/g, ''));
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="• • • • • •"
                  dir="ltr"
                  autoFocus
                  required
                  className={`w-full bg-slate-950 border ${
                    errorMsg
                      ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/30'
                      : 'border-slate-700/80 focus:border-emerald-500 focus:ring-emerald-500/30'
                  } rounded-2xl px-4 py-3.5 text-center text-2xl tracking-[0.5em] text-white font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 transition`}
                />

                {errorMsg && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center gap-1.5 animate-pulse">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                id="btn-auth-confirm-otp"
                disabled={isLoading || otpCode.trim().length !== 6}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isLoading ? 'جاري التحقق...' : 'تأكيد الرمز'}</span>
                <Check size={16} />
              </button>
            </form>

            {/* Resend & Fallback Controls */}
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={!canResend || isLoading}
                  className={`font-bold transition cursor-pointer ${
                    canResend ? 'text-emerald-400 hover:underline' : 'text-slate-500 cursor-not-allowed'
                  }`}
                >
                  إعادة إرسال الرمز
                </button>

                <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                  <Timer size={13} />
                  <span>{canResend ? 'متاح الآن' : `${resendCountdown} ثانية`}</span>
                </div>
              </div>

              {/* SECURE DELIVERY FALLBACK: Resend via SMS or WhatsApp for Algerian Users */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300">
                    لم تستلم رسالة SMS في هاتفك؟
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    قناة بديلة
                  </span>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  {/* Automated Server-Side WhatsApp Dispatch Trigger */}
                  <button
                    type="button"
                    id="btn-auth-resend-whatsapp"
                    onClick={handleRequestOtpViaWhatsApp}
                    disabled={isLoading}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send size={13} className="text-emerald-400" />
                    <span>إرسال رمز التحقق عبر واتساب (WhatsApp Cloud API)</span>
                  </button>

                  <p className="text-[10px] text-slate-400 leading-relaxed text-center">
                    حماية أمنية مشددة: يجب إدخال الرمز المكون من 6 أرقام لتأكيد الملكية. لا يمكن الدخول بدون مطابقة الرمز.
                  </p>
                </div>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone_input');
                    setErrorMsg(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 transition"
                >
                  تغيير رقم الهاتف
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 3: SIMPLIFIED CUSTOMER NAME PROMPT ONLY */}
        {/* "الاسم واللقب" ONLY - NO PROFILE PICTURE, NO FILE UPLOADS, NO EMAIL */}
        {/* =================================================================== */}
        {step === 'customer_name_prompt' && (
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md">
            <div className="mb-5 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
                <User size={24} />
              </div>
              <h2 className="text-xl font-black text-white font-['Cairo']">
                مرحباً بك في سريع! 👋
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                خطوة واحدة أخيرة: أدخل اسمك ولقبك للبدء في نشر واستقبال الطلبات
              </p>
            </div>

            <form onSubmit={handleCustomerNameSubmit} className="space-y-4">
              {/* Confirmed Phone Badge */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Smartphone size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">رقم الهاتف المؤكد</span>
                    <span className="text-xs font-mono font-bold text-white" dir="ltr">
                      {verifiedPhone || carrierInfo.formattedNational}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  مؤكد ✓
                </span>
              </div>

              {/* FIRST & LAST NAME FIELD ONLY */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  الاسم واللقب <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="input-customer-fullname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: أمين بن علي"
                    autoFocus
                    required
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                  <User size={16} className="absolute left-4 top-4 text-slate-500 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  سيظهر اسمك للكباتن لتسهيل التعرف عليك عند تسليم الطرد
                </p>
              </div>

              {/* Wilaya Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  الولاية الرئيسية
                </label>
                <select
                  id="select-customer-wilaya"
                  value={selectedWilaya}
                  onChange={(e) => setSelectedWilaya(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {ALGERIA_WILAYAS.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.code} - {w.nameAr} ({w.nameFr})
                    </option>
                  ))}
                </select>
              </div>

              {/* PRIVACY NOTICE: NO IMAGES / NO FILES */}
              <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-emerald-400 flex items-center gap-2">
                <ShieldCheck size={16} className="shrink-0" />
                <span>حسابك مفعل وجاهز. لا نطلب منك أي صور شخصية أو ملفات للطلب.</span>
              </div>

              <button
                type="submit"
                id="btn-customer-complete-auth"
                disabled={isLoading || fullName.trim().length < 2}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>{isLoading ? 'جاري الحفظ...' : 'تأكيد والدخول الآن'}</span>
                <ArrowIcon size={16} />
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer Disclaimer */}
      <footer className="py-3 text-center text-[11px] text-slate-500">
        <span>Sari3 Delivery • منصة التوصيل السريع والأسعار الحرة في الجزائر</span>
      </footer>
    </div>
  );
};
