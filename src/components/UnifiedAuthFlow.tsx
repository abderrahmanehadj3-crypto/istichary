import React, { useState } from 'react';
import { AppTranslations } from '../i18n/translations';
import { Language, ThemeMode, UserProfile } from '../types';
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
  Lock,
  Globe,
  Sun,
  Moon,
  KeyRound,
  Send,
  User,
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
} from 'lucide-react';

interface UnifiedAuthFlowProps {
  t: AppTranslations;
  lang: Language;
  theme: ThemeMode;
  onLanguageChange: (lang: Language) => void;
  onThemeToggle: () => void;
  onAuthSuccess: (user: UserProfile) => void;
}

interface SavedDeviceAccount {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  birthDate: string;
  provider: 'Google' | 'Apple' | 'Device';
  isPrimary?: boolean;
}

const SAVED_DEVICE_ACCOUNTS: SavedDeviceAccount[] = [
  {
    id: 'acc-1',
    email: 'abderrahmanehadj3@gmail.com',
    name: 'عبد الرحمان حاج',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    birthDate: '1998-05-14',
    provider: 'Google',
    isPrimary: true,
  },
  {
    id: 'acc-2',
    email: 'amine.hadj.dz@gmail.com',
    name: 'أمين بلحاج',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
    birthDate: '1995-10-22',
    provider: 'Google',
  },
  {
    id: 'acc-3',
    email: 'hadj.transport@outlook.com',
    name: 'عبد الرحمان للنقل السريع',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    birthDate: '1992-03-08',
    provider: 'Device',
  },
];

type AuthMethod = 'phone' | 'email';
type AuthStep = 'input_credentials' | 'verify_phone_otp' | 'email_phone_prompt' | 'email_phone_otp';

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
  const [step, setStep] = useState<AuthStep>('input_credentials');

  // Input states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | undefined>(undefined);
  const [selectedBirthDate, setSelectedBirthDate] = useState<string | undefined>(undefined);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showManualEmailInput, setShowManualEmailInput] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [testOtpHint, setTestOtpHint] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(45);

  // Normalize Algerian phone number
  const formatAlgerianPhone = (phone: string): string => {
    let clean = phone.trim().replace(/\s+/g, '');
    if (clean.startsWith('+213')) return clean;
    if (clean.startsWith('00213')) return `+213${clean.slice(5)}`;
    if (clean.startsWith('0')) return `+213${clean.slice(1)}`;
    if (clean.length === 9) return `+213${clean}`;
    return clean.startsWith('+') ? clean : `+213${clean}`;
  };

  // 1. Phone-first Login Handler
  const handleSendPhoneOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى إدخال رقم هاتف جزائري صالح (مثال: 0661234567)'
          : 'Please enter a valid Algerian phone number'
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      setIsLoading(false);
      setTestOtpHint('889315');
      setStep('verify_phone_otp');
    }, 450);
  };

  // 2. One-Tap Device Account Selection Handler
  const handleSelectDeviceAccount = (acc: SavedDeviceAccount) => {
    setIsLoading(true);
    setSelectedAccountId(acc.id);
    setErrorMsg(null);
    setEmailAddress(acc.email);
    setDisplayName(acc.name);
    setSelectedAvatarUrl(acc.avatarUrl);
    setSelectedBirthDate(acc.birthDate);

    // Requirement: Immediately after selecting email, seamlessly transition to phone number prompt
    setTimeout(() => {
      setIsLoading(false);
      setSelectedAccountId(null);
      setStep('email_phone_prompt');
    }, 350);
  };

  // 3. Email Login Handler (Manual Form fallback) -> Prompts for Phone Number
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailAddress || !emailAddress.includes('@')) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى إدخال بريد إلكتروني صالح'
          : 'Please enter a valid email address'
      );
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg(
        lang === 'ar'
          ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
          : 'Password must be at least 6 characters'
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    // Requirement: If user selects Email, prompt them to enter phone number and verify it
    setTimeout(() => {
      setIsLoading(false);
      setStep('email_phone_prompt');
    }, 400);
  };

  // 4. Email Flow -> Send OTP to Prompted Phone Number
  const handleSendEmailPhoneOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى إدخال رقم هاتف جزائري لربطه بحسابك وتأكيده'
          : 'Please enter a valid Algerian phone number to link to your account'
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      setIsLoading(false);
      setTestOtpHint('889315');
      setStep('email_phone_otp');
    }, 450);
  };

  // 5. Verify OTP and Complete Authentication
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى إدخال رمز التحقق المكون من 4 إلى 6 أرقام'
          : 'Please enter the verification code'
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      setIsLoading(false);
      const cleanPhone = formatAlgerianPhone(phoneNumber || '0661889900');
      const calculatedName =
        displayName.trim() ||
        (emailAddress ? emailAddress.split('@')[0] : 'مستخدم سريع');

      const authenticatedUser: UserProfile = {
        id: `usr-${Date.now()}`,
        email: emailAddress || undefined,
        phone: cleanPhone,
        phoneVerified: true,
        displayName: calculatedName,
        avatarUrl:
          selectedAvatarUrl ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        birthDate: selectedBirthDate || '1998-05-14',
        wilaya: '16',
        customerProfileCompleted: false,
        cameraPermissionGranted: false,
        locationPermissionGranted: false,
        accountConfirmed: false,
        createdAt: new Date().toISOString(),
      };

      onAuthSuccess(authenticatedUser);
    }, 500);
  };

  // Instant Demo Authentication for rapid review/testing
  const handleQuickDemoLogin = () => {
    const demoUser: UserProfile = {
      id: `usr-demo-${Date.now()}`,
      email: 'abderrahmanehadj3@gmail.com',
      phone: '+213 661 22 33 44',
      phoneVerified: true,
      displayName: 'عبد الرحمان حاج',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      wilaya: '16',
      birthDate: '1998-05-14',
      customerProfileCompleted: false,
      cameraPermissionGranted: true,
      locationPermissionGranted: true,
      accountConfirmed: true,
      createdAt: new Date().toISOString(),
    };
    onAuthSuccess(demoUser);
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
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Brand Welcome Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <Sparkles size={14} />
              <span>
                {lang === 'ar'
                  ? 'بوابة تسجيل الدخول الموحدة'
                  : 'Unified Secure Login'}
              </span>
            </div>

            <h1 className="text-2xl font-black text-white font-['Cairo'] tracking-tight">
              {step === 'verify_phone_otp' || step === 'email_phone_otp'
                ? lang === 'ar'
                  ? 'تأكيد رمز التحقق (OTP)'
                  : 'Verify OTP Code'
                : step === 'email_phone_prompt'
                ? lang === 'ar'
                  ? 'ربط وتأكيد رقم الهاتف'
                  : 'Link & Verify Phone Number'
                : lang === 'ar'
                ? 'تسجيل الدخول إلى سريع'
                : 'Sign In to Sari3'}
            </h1>

            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              {step === 'verify_phone_otp' || step === 'email_phone_otp'
                ? lang === 'ar'
                  ? `أدخل رمز التأكيد المرسل عبر رسالة SMS إلى ${phoneNumber}`
                  : `Enter the SMS verification code sent to ${phoneNumber}`
                : step === 'email_phone_prompt'
                ? lang === 'ar'
                  ? 'لاستكمال حسابك وتأمين الطلبات، يرجى إدخال رقم هاتفك الجزائري للتحقق منه'
                  : 'To secure your account and dispatch orders, please verify your phone number'
                : lang === 'ar'
                ? 'اختر وسيلة الدخول المفضلة لديك عبر رقم الهاتف أو البريد الإلكتروني'
                : 'Select your preferred login method via Phone or Email'}
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Test OTP Hint Banner */}
          {testOtpHint && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>رمز الاختبار السريع: <strong className="font-mono text-white text-sm">{testOtpHint}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => setOtpCode(testOtpHint)}
                className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold"
              >
                تعبئة تلقائية
              </button>
            </div>
          )}

          {/* STEP 1: Main Credentials Input (Phone vs Email Tab) */}
          {step === 'input_credentials' && (
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
                  id="tab-auth-email"
                  onClick={() => {
                    setMethod('email');
                    setErrorMsg(null);
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    method === 'email'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Mail size={16} />
                  <span>{lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</span>
                </button>
              </div>

              {/* Form 1A: Phone Number Form */}
              {method === 'phone' && (
                <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Smartphone size={14} className="text-emerald-400" />
                      <span>{lang === 'ar' ? 'رقم الهاتف الجزائري' : 'Algerian Phone Number'}</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 dir-ltr text-xs font-mono font-bold text-slate-400 pointer-events-none">
                        +213
                      </span>
                      <input
                        type="tel"
                        id="input-auth-phone"
                        dir="ltr"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="05 / 06 / 07 xx xx xx"
                        className="w-full pl-14 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-700/80 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none transition shadow-inner"
                        required
                        autoFocus
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {lang === 'ar'
                        ? 'سنرسل لك رمز تحقق عبر رسالة SMS للتأكيد الفوري'
                        : 'We will send a fast SMS verification code'}
                    </p>
                  </div>

                  <button
                    type="submit"
                    id="btn-auth-send-phone-otp"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>{isLoading ? 'جاري الإرسال...' : (lang === 'ar' ? 'متابعة وإرسال رمز التحقق' : 'Continue & Send Code')}</span>
                    <ArrowIcon size={16} />
                  </button>
                </form>
              )}

              {/* Form 1B: Smart One-Tap Email Account Picker & Device List */}
              {method === 'email' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Smart Device Account Picker Prompt Header */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/30 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5 font-['Cairo']">
                        <Sparkles size={15} className="text-emerald-400" />
                        <span>{lang === 'ar' ? 'اختيار سريع للحساب المحفوظ على الجهاز' : 'One-Tap Device Account Picker'}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                        بنقرة واحدة
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {lang === 'ar'
                        ? 'انقر على بريدك الإلكتروني لاختياره فوراً والمتابعة لتأكيد رقم الهاتف'
                        : 'Tap your saved email account to proceed directly to phone verification'}
                    </p>
                  </div>

                  {/* List of Saved Device Accounts */}
                  <div className="space-y-2.5">
                    {SAVED_DEVICE_ACCOUNTS.map((acc) => {
                      const isSelected = selectedAccountId === acc.id;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          id={`btn-select-account-${acc.id}`}
                          onClick={() => handleSelectDeviceAccount(acc)}
                          disabled={isLoading}
                          className={`w-full p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 text-start cursor-pointer group active:scale-[0.99] ${
                            acc.isPrimary
                              ? 'bg-slate-950/90 border-emerald-500/40 hover:border-emerald-400 hover:bg-slate-900 shadow-lg shadow-emerald-950/15'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative flex-shrink-0">
                              <img
                                src={acc.avatarUrl}
                                alt={acc.name}
                                className="w-11 h-11 rounded-xl object-cover border border-slate-700 group-hover:border-emerald-500 transition"
                              />
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                              </div>
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition truncate">
                                  {acc.name}
                                </span>
                                {acc.isPrimary && (
                                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-400 text-[9px] font-bold border border-emerald-500/30">
                                    الأساسي
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                                {acc.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {isSelected ? (
                              <span className="text-xs text-emerald-400 font-bold animate-pulse">
                                جاري الاختيار...
                              </span>
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/40 flex items-center justify-center transition">
                                <SubArrowIcon size={16} />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Alternative: Manual Email Input Toggle */}
                  <div className="pt-2 text-center">
                    {!showManualEmailInput ? (
                      <button
                        type="button"
                        id="btn-toggle-manual-email"
                        onClick={() => setShowManualEmailInput(true)}
                        className="text-xs text-slate-400 hover:text-emerald-400 font-bold transition inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl hover:bg-slate-950 border border-transparent hover:border-slate-800 cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>
                          {lang === 'ar'
                            ? 'استخدام بريد إلكتروني آخر غير مسجل يدوياً'
                            : 'Use a different email address manually'}
                        </span>
                      </button>
                    ) : (
                      <form onSubmit={handleEmailSubmit} className="space-y-4 pt-2 text-start animate-in fade-in duration-200">
                        <div className="flex items-center justify-between pb-1">
                          <span className="text-xs font-bold text-slate-300">
                            {lang === 'ar' ? 'إدخال بريد مخصص:' : 'Enter custom email:'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowManualEmailInput(false)}
                            className="text-[11px] text-slate-500 hover:text-slate-300"
                          >
                            {lang === 'ar' ? 'إغلاق' : 'Close'}
                          </button>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <Mail size={14} className="text-emerald-400" />
                            <span>{lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</span>
                          </label>
                          <input
                            type="email"
                            id="input-auth-email"
                            dir="ltr"
                            value={emailAddress}
                            onChange={(e) => setEmailAddress(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700/80 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none transition shadow-inner"
                            required
                            autoFocus
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <Lock size={14} className="text-emerald-400" />
                            <span>{lang === 'ar' ? 'كلمة المرور' : 'Password'}</span>
                          </label>
                          <input
                            type="password"
                            id="input-auth-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700/80 text-white text-sm focus:border-emerald-500 focus:outline-none transition shadow-inner"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <User size={14} className="text-slate-400" />
                            <span>{lang === 'ar' ? 'الاسم الكامل (اختياري)' : 'Full Name (Optional)'}</span>
                          </label>
                          <input
                            type="text"
                            id="input-auth-displayname"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder={lang === 'ar' ? 'مثال: عبد الرحمان حاج' : 'e.g. Abderrahmane Hadj'}
                            className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-white text-xs focus:border-emerald-500 focus:outline-none transition"
                          />
                        </div>

                        <button
                          type="submit"
                          id="btn-auth-submit-email"
                          disabled={isLoading}
                          className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                        >
                          <span>{isLoading ? 'جاري التحقق...' : (lang === 'ar' ? 'متابعة لتأكيد رقم الهاتف' : 'Continue to Phone Verification')}</span>
                          <ArrowIcon size={16} />
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Email Flow -> Phone Number Prompt */}
          {step === 'email_phone_prompt' && (
            <form onSubmit={handleSendEmailPhoneOtp} className="space-y-4">
              {/* Selected Account Card Summary */}
              {emailAddress && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/40 flex items-center justify-between gap-3 shadow-lg shadow-emerald-950/20">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={
                        selectedAvatarUrl ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'
                      }
                      alt="Account Avatar"
                      className="w-10 h-10 rounded-xl object-cover border border-emerald-400 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {displayName || 'عبد الرحمان حاج'}
                      </p>
                      <p className="text-[11px] text-emerald-400 font-mono truncate">
                        {emailAddress}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setStep('input_credentials');
                      setMethod('email');
                    }}
                    className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 text-[11px] font-bold border border-slate-800 transition flex-shrink-0 cursor-pointer"
                  >
                    {lang === 'ar' ? 'تغيير الحساب' : 'Change'}
                  </button>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-amber-400" />
                  <span>{lang === 'ar' ? 'التحقق الإلزامي برقم الهاتف' : 'Mandatory Phone Verification'}</span>
                </p>
                <p className="text-[11px] text-amber-300/80">
                  {lang === 'ar'
                    ? 'لضمان أمان الصفقات والتواصل مع الكباتن، يُشترط ربط وتأكيد رقم هاتف حقيقي فعال.'
                    : 'To ensure transaction security and courier communication, phone verification is required.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Smartphone size={14} className="text-emerald-400" />
                  <span>{lang === 'ar' ? 'رقم هاتفك لتأكيد الحساب' : 'Your Phone Number for Verification'}</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 dir-ltr text-xs font-mono font-bold text-slate-400 pointer-events-none">
                    +213
                  </span>
                  <input
                    type="tel"
                    id="input-auth-email-phone"
                    dir="ltr"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="05 / 06 / 07 xx xx xx"
                    className="w-full pl-14 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-700/80 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none transition shadow-inner"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('input_credentials')}
                  className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  {lang === 'ar' ? 'رجوع' : 'Back'}
                </button>
                <button
                  type="submit"
                  id="btn-auth-send-email-phone-otp"
                  disabled={isLoading}
                  className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>{isLoading ? 'جاري الإرسال...' : (lang === 'ar' ? 'إرسال رمز التأكيد' : 'Send Verification Code')}</span>
                  <ArrowIcon size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: OTP Verification Screen (Used for both Phone and Email flows) */}
          {(step === 'verify_phone_otp' || step === 'email_phone_otp') && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <KeyRound size={14} className="text-emerald-400" />
                  <span>{lang === 'ar' ? 'رمز التأكيد (SMS)' : 'Verification Code (SMS)'}</span>
                </label>
                <input
                  type="text"
                  id="input-auth-otp-code"
                  dir="ltr"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="889315"
                  maxLength={6}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-950 border border-slate-700/80 text-emerald-400 font-mono text-xl tracking-[0.4em] text-center focus:border-emerald-500 focus:outline-none transition shadow-inner font-black"
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>
                  {lang === 'ar' ? 'لم يصلك الرمز؟' : "Didn't receive code?"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTestOtpHint('889315');
                    setErrorMsg(null);
                  }}
                  className="text-emerald-400 hover:underline font-bold"
                >
                  {lang === 'ar' ? 'إعادة الإرسال' : 'Resend SMS'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (step === 'email_phone_otp') {
                      setStep('email_phone_prompt');
                    } else {
                      setStep('input_credentials');
                    }
                  }}
                  className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  {lang === 'ar' ? 'تعديل' : 'Edit'}
                </button>

                <button
                  type="submit"
                  id="btn-auth-verify-otp"
                  disabled={isLoading}
                  className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 size={18} />
                  <span>{isLoading ? 'جاري التأكيد...' : (lang === 'ar' ? 'تأكيد الحساب ومتابعة' : 'Verify & Continue')}</span>
                </button>
              </div>
            </form>
          )}

          {/* Quick Demo Login Option */}
          <div className="pt-4 border-t border-slate-800/80 text-center">
            <button
              type="button"
              id="btn-quick-demo-auth"
              onClick={handleQuickDemoLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 border border-slate-800 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles size={14} className="text-emerald-400" />
              <span>
                {lang === 'ar'
                  ? 'دخول تجريبي سريع للمعاينة (Demo Login)'
                  : 'Fast Demo Login (Preview)'}
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-3 text-[11px] text-slate-500">
        <p>Sari3 Algeria • بوابة التوصيل السريع والآمن في 58 ولاية</p>
      </footer>
    </div>
  );
};
