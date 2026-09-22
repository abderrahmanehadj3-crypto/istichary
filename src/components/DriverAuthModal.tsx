import React, { useState } from 'react';
import { AppTranslations } from '../i18n/translations';
import { DriverDetails, Language, UserProfile } from '../types';
import { Sari3Logo } from './Sari3Logo';
import { DriverVerificationWizard } from './DriverVerificationWizard';
import {
  Bike,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  UserPlus,
  LogIn,
} from 'lucide-react';

interface DriverAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
  t: AppTranslations;
  lang: Language;
}

type DriverMode = 'choice' | 'login_phone' | 'login_otp' | 'wizard_flow';

export const DriverAuthModal: React.FC<DriverAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  t,
  lang,
}) => {
  const [mode, setMode] = useState<DriverMode>('choice');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [testOtpHint, setTestOtpHint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isRtl = lang === 'ar';
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  // Send OTP for returning driver login
  const handleSendDriverLoginOtp = (e: React.FormEvent) => {
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
    setMode('login_otp');
    setIsLoading(false);
  };

  // Verify OTP for returning driver
  const handleVerifyDriverLoginOtp = (e: React.FormEvent) => {
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

      const returningDriver: UserProfile = {
        id: `drv-${Date.now()}`,
        displayName: 'كريم الدراجي',
        phone: cleanPhone,
        phoneVerified: true,
        role: 'driver',
        wilaya: '16',
        accountConfirmed: false, // Permissions requested next
        createdAt: new Date().toISOString(),
        avatarUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        driverDetails: {
          firstName: 'كريم',
          lastName: 'الدراجي',
          birthDate: '2000-04-12',
          age: 26,
          phone: cleanPhone,
          phoneVerified: true,
          licenseNumber: 'ALG-16-992014',
          licenseExpirationDate: '2030-12-31',
          vehicleType: 'motorcycle',
          vehicleRegType: 'permanent',
          vehiclePlate: '01234-121-16',
          vehicleBrand: 'Sym',
          vehicleModel: 'Orbit II 150cc',
          verificationStatus: 'verified',
          isOnline: true,
          rating: 4.95,
          totalDeliveries: 56,
        },
      };

      setIsLoading(false);
      onAuthSuccess(returningDriver);
    }, 400);
  };

  // New Driver Completing the 5-Step Verification Wizard
  const handleWizardCompleted = (driverDetails: DriverDetails) => {
    const newDriver: UserProfile = {
      id: `drv-new-${Date.now()}`,
      displayName: `${driverDetails.firstName} ${driverDetails.lastName}`,
      phone: driverDetails.phone,
      phoneVerified: driverDetails.phoneVerified,
      role: 'driver',
      wilaya: '16',
      avatarUrl: driverDetails.publicAvatarUrl || driverDetails.facePhotoUrl,
      driverDetails: driverDetails,
      accountConfirmed: false, // Permissions needed next
      createdAt: new Date().toISOString(),
    };

    onAuthSuccess(newDriver);
  };

  // IF WIZARD FLOW IS ACTIVE:
  if (mode === 'wizard_flow') {
    return (
      <DriverVerificationWizard
        currentUser={{
          id: `drv-temp-${Date.now()}`,
          displayName: 'كابتن جديد',
          role: 'driver',
          wilaya: '16',
          phone: phoneNumber || '+213 661 88 99 00',
          phoneVerified: false,
          createdAt: new Date().toISOString(),
        }}
        t={t}
        lang={lang}
        onComplete={handleWizardCompleted}
        onCancel={() => setMode('choice')}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 relative">
        {/* Header with back button */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <button
            type="button"
            onClick={() => {
              if (mode !== 'choice') {
                setMode('choice');
                setErrorMsg(null);
              } else {
                onClose();
              }
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <BackIcon size={16} />
            <span>{mode !== 'choice' ? 'رجوع' : t.backToGateway}</span>
          </button>

          <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold flex items-center gap-1">
            <Bike size={14} />
            <span>بوابة الكباتن</span>
          </span>
        </div>

        {/* Brand Banner */}
        <div className="text-center my-4">
          <Sari3Logo size="md" className="justify-center mb-2" />
          <h2 className="text-lg font-black text-white font-['Cairo']">
            {t.driverLoginTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.driverLoginSubtitle}
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* MODE 1: CHOICE (Returning Login OR 5-Step New Application) */}
        {mode === 'choice' && (
          <div className="space-y-3.5">
            {/* 5-STEP NEW DRIVER APPLICATION */}
            <button
              id="btn-driver-start-wizard"
              type="button"
              onClick={() => setMode('wizard_flow')}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-black text-sm shadow-xl shadow-purple-600/20 transition cursor-pointer text-right flex items-center gap-3.5"
            >
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <UserPlus size={22} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-white font-['Cairo']">
                  {t.newDriverRegister}
                </p>
                <p className="text-[11px] text-purple-200 font-normal mt-0.5">
                  توثيق بيومتري حي + فحص رخصة القيادة والبطاقة الرمادية
                </p>
              </div>
            </button>

            {/* RETURNING DRIVER QUICK LOGIN */}
            <button
              id="btn-driver-returning-login"
              type="button"
              onClick={() => setMode('login_phone')}
              className="w-full p-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white font-black text-sm shadow-md transition cursor-pointer text-right flex items-center gap-3.5"
            >
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
                <LogIn size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white font-['Cairo']">
                  {t.returningDriverLogin}
                </p>
                <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                  الدخول المباشر برقم الهاتف ورمز التحقق SMS
                </p>
              </div>
            </button>
          </div>
        )}

        {/* MODE 2: RETURNING PHONE INPUT */}
        {mode === 'login_phone' && (
          <form onSubmit={handleSendDriverLoginOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {t.enterPhone} للكابتن
              </label>
              <div className="relative flex items-center">
                <span className="absolute right-3.5 text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5 pointer-events-none">
                  <span>🇩🇿</span>
                  <span>+213</span>
                </span>
                <input
                  id="input-driver-phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="661 88 99 00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-20 pl-4 text-xs font-mono font-bold text-white focus:outline-none focus:border-purple-500"
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              id="btn-driver-send-login-otp"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm shadow-lg shadow-purple-600/25 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Smartphone size={16} />
              <span>{t.sendOtp}</span>
            </button>
          </form>
        )}

        {/* MODE 3: RETURNING OTP INPUT */}
        {mode === 'login_otp' && (
          <form onSubmit={handleVerifyDriverLoginOtp} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <p className="text-xs text-slate-400">{t.otpSentTo}</p>
              <p className="text-sm font-mono font-bold text-purple-400 mt-1" dir="ltr">
                {phoneNumber.startsWith('+213') ? phoneNumber : `+213 ${phoneNumber}`}
              </p>
              {testOtpHint && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-[11px] font-mono">
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
                id="input-driver-otp"
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="• • • • • •"
                className="w-full text-center tracking-[0.5em] text-xl font-mono font-bold bg-slate-950 border border-slate-800 rounded-2xl py-3 text-white focus:outline-none focus:border-purple-500"
                required
                autoFocus
              />
            </div>

            <button
              id="btn-driver-verify-login-otp"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm shadow-lg shadow-purple-600/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              <span>{t.verifyOtp}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
