import React, { useState } from 'react';
import { AppTranslations } from '../i18n/translations';
import { DriverDetails, Language, UserProfile } from '../types';
import { Sari3Logo } from './Sari3Logo';
import { DriverVerificationWizard } from './DriverVerificationWizard';
import {
  Bike,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  KeyRound,
  FileCheck2,
} from 'lucide-react';

interface DriverAuthFlowProps {
  t: AppTranslations;
  lang: Language;
  onAuthComplete: (user: UserProfile) => void;
  onBackToGateway: () => void;
}

type DriverScreenMode = 'portal_menu' | 'phone_login' | 'phone_otp' | 'registration_wizard';

export const DriverAuthFlow: React.FC<DriverAuthFlowProps> = ({
  t,
  lang,
  onAuthComplete,
  onBackToGateway,
}) => {
  const isRtl = lang === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [mode, setMode] = useState<DriverScreenMode>('portal_menu');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [testOtpHint, setTestOtpHint] = useState<string | null>(null);

  // Send SMS OTP for Existing Driver Login
  const handleSendDriverLoginOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      setErrorMsg(lang === 'ar' ? 'يرجى إدخال رقم هاتف جزائري صحيح' : 'Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setTestOtpHint('889315');
    setMode('phone_otp');
    setIsLoading(false);
  };

  // Verify OTP for Existing Driver Login
  const handleVerifyDriverLoginOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      setErrorMsg(t.invalidOtp);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      setIsLoading(false);
      const cleanPhone = phoneNumber.startsWith('+213')
        ? phoneNumber
        : `+213${phoneNumber.replace(/^0/, '')}`;

      const verifiedDriver: UserProfile = {
        id: `usr-driver-${Date.now()}`,
        phone: cleanPhone || '+213 661 88 99 00',
        phoneVerified: true,
        displayName: 'كريم الدراجي',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        role: 'driver',
        wilaya: '16',
        cameraPermissionGranted: false,
        locationPermissionGranted: false,
        accountConfirmed: false,
        driverDetails: {
          facePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
          publicAvatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
          firstName: 'كريم',
          lastName: 'الدراجي',
          birthDate: '2001-05-14',
          age: 25,
          phone: cleanPhone || '+213 661 88 99 00',
          phoneVerified: true,
          licenseNumber: '16/2021/987654',
          licenseExpirationDate: '2030-12-31',
          licenseFrontUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
          licenseBackUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
          vehicleType: 'motorcycle',
          vehicleRegType: 'permanent',
          vehiclePlate: '01234-121-16',
          vehicleBrand: 'Sym',
          vehicleModel: 'Orbit II 150cc',
          verificationStatus: 'verified',
          isOnline: true,
          rating: 4.95,
          totalDeliveries: 48,
        },
        createdAt: new Date().toISOString(),
      };

      onAuthComplete(verifiedDriver);
    }, 400);
  };

  // Instant Demo Driver Login (Fast verification for testing)
  const handleInstantDemoDriver = () => {
    const demoDriver: UserProfile = {
      id: 'demo-driver-dz',
      phone: '+213 661 88 99 00',
      phoneVerified: true,
      displayName: 'كريم الدراجي (كابتن)',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      role: 'driver',
      wilaya: '16',
      cameraPermissionGranted: false,
      locationPermissionGranted: false,
      accountConfirmed: false,
      driverDetails: {
        facePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        publicAvatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        firstName: 'كريم',
        lastName: 'الدراجي',
        birthDate: '2001-05-14',
        age: 25,
        phone: '+213 661 88 99 00',
        phoneVerified: true,
        licenseNumber: '16/2021/987654',
        licenseExpirationDate: '2030-12-31',
        licenseFrontUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        licenseBackUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        vehicleType: 'motorcycle',
        vehicleRegType: 'permanent',
        vehiclePlate: '01234-121-16',
        vehicleBrand: 'Sym',
        vehicleModel: 'Orbit II 150cc',
        verificationStatus: 'verified',
        isOnline: true,
        rating: 4.95,
        totalDeliveries: 48,
      },
      createdAt: new Date().toISOString(),
    };
    onAuthComplete(demoDriver);
  };

  // When Driver completes the 5-Step Verification Wizard
  const handleWizardCompleted = (details: DriverDetails) => {
    const newDriverUser: UserProfile = {
      id: `usr-driver-${Date.now()}`,
      phone: details.phone,
      phoneVerified: true,
      displayName: `${details.firstName} ${details.lastName}`,
      avatarUrl: details.publicAvatarUrl || details.facePhotoUrl,
      role: 'driver',
      wilaya: '16',
      cameraPermissionGranted: false,
      locationPermissionGranted: false,
      accountConfirmed: false,
      driverDetails: details,
      createdAt: new Date().toISOString(),
    };

    onAuthComplete(newDriverUser);
  };

  // If in Wizard Mode, render the full multi-step wizard
  if (mode === 'registration_wizard') {
    return (
      <DriverVerificationWizard
        currentUser={{
          id: `tmp-${Date.now()}`,
          displayName: 'كابتن جديد',
          role: 'driver',
          wilaya: '16',
          phoneVerified: false,
          createdAt: new Date().toISOString(),
        }}
        t={t}
        lang={lang}
        onComplete={handleWizardCompleted}
        onCancel={() => setMode('portal_menu')}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto select-none">
      {/* Header with Back Button */}
      <header className="flex items-center justify-between py-2">
        <button
          type="button"
          onClick={mode === 'portal_menu' ? onBackToGateway : () => setMode('portal_menu')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-700 transition"
        >
          <ArrowIcon size={14} className={isRtl ? 'rotate-180' : ''} />
          <span>{lang === 'ar' ? 'الرجوع للبوابة' : 'Back to Gateway'}</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold">
          <Bike size={14} />
          <span>بوابة الكباتن</span>
        </div>
      </header>

      {/* Main Card */}
      <main className="my-auto py-4">
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          {/* Logo & Portal Title */}
          <div className="text-center mb-6">
            <Sari3Logo size="md" className="justify-center mb-3" />
            <h1 className="text-xl font-black text-white font-['Cairo']">
              {lang === 'ar' ? 'بوابة كابتن سريع' : 'Sari3 Driver Portal'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'ar'
                ? 'انضم لأسطول الكباتن، استقبل طلبات التوصيل وحقق أرباحك بحرية'
                : 'Join the courier fleet, view delivery requests, and earn on your schedule'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* MODE 1: PORTAL MENU (LOGIN OR REGISTER WIZARD) */}
          {mode === 'portal_menu' && (
            <div className="space-y-4">
              {/* Option A: Register New Driver (5-Step Wizard) */}
              <button
                type="button"
                id="btn-driver-start-register-wizard"
                onClick={() => setMode('registration_wizard')}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold text-xs shadow-lg shadow-purple-900/30 flex items-center justify-between cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <FileCheck2 size={20} />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black">تسجيل كابتن جديد لأول مرة</p>
                    <p className="text-[11px] text-purple-200 mt-0.5">خطوات التوثيق الخمسة وتفعيل الحساب</p>
                  </div>
                </div>
                <ArrowIcon size={18} />
              </button>

              {/* Option B: Existing Driver Login */}
              <button
                type="button"
                id="btn-driver-open-login"
                onClick={() => setMode('phone_login')}
                className="w-full p-4 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-white font-bold text-xs flex items-center justify-between cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Smartphone size={20} />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black">تسجيل دخول كابتن سابق</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">الدخول برقم الهاتف ورمز التأكيد SMS</p>
                  </div>
                </div>
                <ArrowIcon size={18} />
              </button>

              {/* Fast Instant Demo Driver Button */}
              <div className="pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  id="btn-driver-instant-demo"
                  onClick={handleInstantDemoDriver}
                  className="w-full py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles size={14} className="text-purple-400" />
                  <span>دخول فوري ككابتن معتمد (تجربة سريعة)</span>
                </button>
              </div>
            </div>
          )}

          {/* MODE 2: EXISTING DRIVER PHONE LOGIN */}
          {mode === 'phone_login' && (
            <form onSubmit={handleSendDriverLoginOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  رقم هاتف الكابتن المسجل
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-mono font-bold text-xs text-slate-400">
                    +213
                  </span>
                  <input
                    type="tel"
                    id="input-driver-login-phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="06 61 88 99 00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-14 pr-4 text-xs font-bold text-white focus:outline-none focus:border-purple-500 transition"
                    required
                  />
                  <Smartphone size={16} className="absolute right-3 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                id="btn-driver-login-send-otp"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition shadow-lg shadow-purple-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>إرسال رمز التأكيد SMS</span>
                <ArrowIcon size={14} />
              </button>

              <button
                type="button"
                onClick={() => setMode('portal_menu')}
                className="w-full text-center text-xs text-slate-400 hover:text-white"
              >
                العودة لخيارات الكابتن
              </button>
            </form>
          )}

          {/* MODE 3: DRIVER OTP VERIFICATION */}
          {mode === 'phone_otp' && (
            <form onSubmit={handleVerifyDriverLoginOtp} className="space-y-4">
              <div className="text-center">
                <p className="text-xs text-slate-400">
                  تم إرسال رمز التأكيد إلى <span className="font-mono text-purple-400 font-bold">{phoneNumber}</span>
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
                  id="input-driver-otp"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="------"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 text-center font-mono font-black text-xl tracking-[0.4em] text-white focus:outline-none focus:border-purple-500 transition"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                id="btn-driver-verify-login-otp"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition shadow-lg shadow-purple-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>تأكيد والدخول للرادار</span>
                <CheckCircle2 size={16} />
              </button>

              <button
                type="button"
                onClick={() => setMode('phone_login')}
                className="w-full text-center text-xs text-slate-400 hover:text-white"
              >
                تغيير رقم الهاتف
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="text-center py-2 text-[11px] text-slate-500">
        بوابة كباتن Sari3 • أمان وتوثيق عالي
      </footer>
    </div>
  );
};
