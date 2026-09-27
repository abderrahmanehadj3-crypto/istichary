import React, { useState } from 'react';
import { AppTranslations } from '../i18n/translations';
import { Language, ThemeMode, UserProfile } from '../types';
import { ALGERIA_WILAYAS } from '../data/wilayas';
import { Sari3Logo } from './Sari3Logo';
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Globe,
  Sun,
  Moon,
  ShieldCheck,
  Smartphone,
  Edit3,
  Zap,
  Image as ImageIcon,
} from 'lucide-react';

interface CustomerProfileSetupScreenProps {
  currentUser: UserProfile;
  t: AppTranslations;
  lang: Language;
  theme: ThemeMode;
  onCompleteProfile: (updatedData: {
    displayName: string;
    avatarUrl: string;
    birthDate: string;
    wilaya: string;
  }) => void;
  onBackToRoleSelection: () => void;
  onLanguageChange: (lang: Language) => void;
  onThemeToggle: () => void;
}

const PRESET_AVATARS = [
  {
    id: 'av-1',
    label: 'رسمي',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-2',
    label: 'عصري',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-3',
    label: 'ودود',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-4',
    label: 'كلاسيكي',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-5',
    label: 'مهني',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
];

export const CustomerProfileSetupScreen: React.FC<CustomerProfileSetupScreenProps> = ({
  currentUser,
  t,
  lang,
  theme,
  onCompleteProfile,
  onBackToRoleSelection,
  onLanguageChange,
  onThemeToggle,
}) => {
  const isRtl = lang === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const BackArrowIcon = isRtl ? ArrowRight : ArrowLeft;

  // Active view: 'quick_choice' or 'manual_edit'
  const [setupMode, setSetupMode] = useState<'quick' | 'manual'>('quick');

  // Derive dynamic values from the authenticated user
  const detectedEmail = currentUser.email || '';
  const derivedEmailName =
    currentUser.displayName && currentUser.displayName !== 'مستخدم سريع'
      ? currentUser.displayName
      : currentUser.email
      ? currentUser.email.split('@')[0]
      : 'زبون سريع';

  const defaultEmailAvatar =
    currentUser.avatarUrl ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';
  const defaultEmailBirthDate = currentUser.birthDate || '2000-01-01';

  // Manual Form States
  const [manualName, setManualName] = useState(derivedEmailName);
  const [manualBirthDate, setManualBirthDate] = useState(defaultEmailBirthDate);
  const [manualWilaya, setManualWilaya] = useState(currentUser.wilaya || '16');
  const [manualAvatar, setManualAvatar] = useState(defaultEmailAvatar);
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick Action Handler: Instantly use the email account's name, avatar, and birthdate
  const handleQuickEmailProfile = () => {
    onCompleteProfile({
      displayName: derivedEmailName,
      avatarUrl: defaultEmailAvatar,
      birthDate: defaultEmailBirthDate,
      wilaya: currentUser.wilaya || '16',
    });
  };

  // Manual Form Submit Handler
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || manualName.trim().length < 2) {
      setErrorMessage(
        lang === 'ar'
          ? 'يرجى إدخال اسم شخصي صالح'
          : 'Please enter a valid personal name'
      );
      return;
    }
    if (!manualBirthDate) {
      setErrorMessage(
        lang === 'ar'
          ? 'يرجى تحديد تاريخ الميلاد'
          : 'Please select your birthdate'
      );
      return;
    }

    onCompleteProfile({
      displayName: manualName.trim(),
      avatarUrl: manualAvatar,
      birthDate: manualBirthDate,
      wilaya: manualWilaya,
    });
  };

  // Calculate age from birthdate
  const calculateAge = (dateString: string): number => {
    try {
      const birth = new Date(dateString);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const monthDiff = now.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return isNaN(age) ? 26 : age;
    } catch {
      return 26;
    }
  };

  const currentAge = calculateAge(manualBirthDate);

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto relative select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToRoleSelection}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-emerald-400 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="الرجوع لاختيار الدور"
          >
            <BackArrowIcon size={16} />
            <span className="hidden sm:inline">
              {lang === 'ar' ? 'تغيير الدور' : 'Change Role'}
            </span>
          </button>
          <Sari3Logo size="md" />
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative flex items-center">
            <select
              id="select-customer-setup-lang"
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
            id="btn-customer-setup-theme"
            type="button"
            onClick={onThemeToggle}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-emerald-400 transition cursor-pointer"
            title="تبديل المظهر"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* Main Setup Container */}
      <main className="my-auto py-6 space-y-6">
        {/* Step Badge & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <Sparkles size={14} />
            <span>
              {lang === 'ar'
                ? 'الخطوة الأخيرة: إعداد الملف الشخصي للزبون'
                : 'Final Step: Customer Profile Setup'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Cairo'] tracking-tight">
            {lang === 'ar' ? 'تخصيص ملف الزبون' : 'Customize Customer Profile'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            {lang === 'ar'
              ? 'اختر طريقة إعداد بياناتك: استخدام بيانات حساب البريد تلقائياً أو إدخال بيانات مخصصة يدوياً'
              : 'Choose how to set up your profile: instant email sync or manual input'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
          <button
            type="button"
            id="tab-profile-quick"
            onClick={() => {
              setSetupMode('quick');
              setErrorMessage(null);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              setupMode === 'quick'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap size={16} />
            <span>
              {lang === 'ar' ? 'بيانات البريد (سريع)' : 'Email Account (Quick)'}
            </span>
          </button>

          <button
            type="button"
            id="tab-profile-manual"
            onClick={() => {
              setSetupMode('manual');
              setErrorMessage(null);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              setupMode === 'manual'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 size={16} />
            <span>
              {lang === 'ar' ? 'إدخال يدوي مخصص' : 'Manual Customization'}
            </span>
          </button>
        </div>

        {/* Error message alert */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. QUICK OPTION: Instantly use Email account details */}
        {setupMode === 'quick' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Account Card Preview */}
            <div className="relative p-5 rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-emerald-950/20 shadow-2xl backdrop-blur-xl overflow-hidden space-y-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Source Badge */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                  <Mail size={13} />
                  <span>{lang === 'ar' ? 'حساب البريد المرتبط' : 'Linked Email Account'}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>موثق وآمن</span>
                </span>
              </div>

              {/* Identity Snapshot */}
              <div className="flex items-center gap-4 pt-1">
                <div className="relative">
                  <img
                    src={defaultEmailAvatar}
                    alt="Email Profile Avatar"
                    className="w-18 h-18 rounded-2xl object-cover border-2 border-emerald-400 shadow-xl shadow-emerald-950/40"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center text-xs font-black shadow">
                    ✓
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white font-['Cairo']">
                    {derivedEmailName}
                  </h3>
                  <p className="text-xs text-slate-300 font-mono flex items-center gap-1">
                    <Mail size={12} className="text-emerald-400" />
                    <span>{detectedEmail}</span>
                  </p>
                  <p className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Smartphone size={12} className="text-emerald-400" />
                    <span>{currentUser.phone || ''}</span>
                  </p>
                </div>
              </div>

              {/* Extracted Details Pill Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="block text-[10px] text-slate-400">تاريخ الميلاد المستخرج:</span>
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <Calendar size={13} className="text-emerald-400" />
                    <span>{defaultEmailBirthDate} (~{calculateAge(defaultEmailBirthDate)} سنة)</span>
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="block text-[10px] text-slate-400">الولاية:</span>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <MapPin size={13} className="text-emerald-400" />
                    <span>ولاية {currentUser.wilaya || '16'}</span>
                  </span>
                </div>
              </div>

              {/* Quick Primary Button */}
              <button
                type="button"
                id="btn-quick-import-email"
                onClick={handleQuickEmailProfile}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Zap size={18} />
                <span>
                  {lang === 'ar'
                    ? 'استخدام بيانات البريد فوراً ومتابعة (موصى به)'
                    : 'Instantly Use Email Profile & Proceed (Recommended)'}
                </span>
                <ArrowIcon size={18} />
              </button>
            </div>

            {/* Hint to switch to manual */}
            <div className="text-center pt-2">
              <button
                type="button"
                id="btn-switch-to-manual-link"
                onClick={() => setSetupMode('manual')}
                className="text-xs text-slate-400 hover:text-emerald-400 font-bold transition underline underline-offset-4 cursor-pointer"
              >
                {lang === 'ar'
                  ? 'أو أنقر هنا لإدخال اسم، صورة، أو تاريخ ميلاد آخر يدوياً ✎'
                  : 'Or click here to input alternative custom information manually ✎'}
              </button>
            </div>
          </div>
        )}

        {/* 2. MANUAL OPTION: Input custom personal information */}
        {setupMode === 'manual' && (
          <form
            onSubmit={handleManualSubmit}
            className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-5 animate-in fade-in duration-300"
          >
            {/* Avatar Selection Area */}
            <div className="flex flex-col items-center gap-3 pb-3 border-b border-slate-800">
              <div className="relative group">
                <img
                  src={manualAvatar}
                  alt="Selected Avatar"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-xl shadow-emerald-950/40"
                />
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg transition cursor-pointer"
                  title="تغيير الصورة الرمزية"
                >
                  <ImageIcon size={14} />
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="text-xs text-emerald-400 hover:underline font-bold"
                >
                  {showAvatarPicker
                    ? lang === 'ar'
                      ? 'إخفاء خيارات الصور'
                      : 'Hide Avatar Options'
                    : lang === 'ar'
                    ? 'اختر صورة رمزية أو أدخل رابط صورة'
                    : 'Choose Avatar or Enter URL'}
                </button>
              </div>

              {/* Avatar Preset Grid Picker */}
              {showAvatarPicker && (
                <div className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in duration-200">
                  <p className="text-[11px] text-slate-400 font-bold">
                    {lang === 'ar' ? 'اختر صورة من النماذج المتاحة:' : 'Choose from presets:'}
                  </p>
                  <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
                    {PRESET_AVATARS.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => {
                          setManualAvatar(av.url);
                          setShowAvatarPicker(false);
                        }}
                        className={`p-1 rounded-xl transition border-2 ${
                          manualAvatar === av.url
                            ? 'border-emerald-500 scale-105'
                            : 'border-transparent hover:border-slate-600'
                        }`}
                      >
                        <img
                          src={av.url}
                          alt={av.label}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      </button>
                    ))}
                  </div>

                  {/* Custom Photo URL */}
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/avatar.jpg"
                      value={customAvatarInput}
                      onChange={(e) => setCustomAvatarInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customAvatarInput.trim()) {
                          setManualAvatar(customAvatarInput.trim());
                          setCustomAvatarInput('');
                          setShowAvatarPicker(false);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold"
                    >
                      تطبيق
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Full Name Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User size={14} className="text-emerald-400" />
                <span>{lang === 'ar' ? 'الاسم الكامل للزبون' : 'Full Customer Name'}</span>
              </label>
              <input
                type="text"
                id="input-manual-customer-name"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: عبد الرحمان حاج' : 'e.g. Abderrahmane Hadj'}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700/80 text-white text-sm focus:border-emerald-500 focus:outline-none transition shadow-inner font-bold"
                required
              />
            </div>

            {/* Birthdate & Age */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-emerald-400" />
                  <span>{lang === 'ar' ? 'تاريخ الميلاد' : 'Birthdate'}</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                  {currentAge} سنة
                </span>
              </label>
              <input
                type="date"
                id="input-manual-customer-birthdate"
                value={manualBirthDate}
                onChange={(e) => setManualBirthDate(e.target.value)}
                max="2010-01-01"
                min="1940-01-01"
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700/80 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none transition shadow-inner"
                required
              />
            </div>

            {/* Wilaya Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin size={14} className="text-emerald-400" />
                <span>{lang === 'ar' ? 'ولاية الإقامة الرئيسية' : 'Primary Wilaya'}</span>
              </label>
              <div className="relative">
                <select
                  id="select-manual-customer-wilaya"
                  value={manualWilaya}
                  onChange={(e) => setManualWilaya(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700/80 text-white text-sm focus:border-emerald-500 focus:outline-none transition shadow-inner appearance-none cursor-pointer pr-10"
                >
                  {ALGERIA_WILAYAS.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.code} - {lang === 'ar' ? w.nameAr : w.nameFr}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Verified Phone Reminder */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Smartphone size={14} className="text-emerald-400" />
                <span>رقم الهاتف الموثق:</span>
              </span>
              <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={14} />
                <span>{currentUser.phone || '+213 555 12 34 56'}</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSetupMode('quick')}
                className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="submit"
                id="btn-manual-profile-submit"
                className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <CheckCircle2 size={18} />
                <span>{lang === 'ar' ? 'حفظ ومتابعة إلى الخريطة' : 'Save & Proceed to Map'}</span>
                <ArrowIcon size={16} />
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-2 text-[11px] text-slate-500">
        <p>Sari3 Algeria • منصة التوصيل الذكي والموثوق في 58 ولاية</p>
      </footer>
    </div>
  );
};
