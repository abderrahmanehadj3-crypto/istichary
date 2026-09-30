import React, { useState } from 'react';
import { AppTranslations } from '../i18n/translations';
import { Language, ThemeMode, UserProfile } from '../types';
import { ALGERIA_WILAYAS } from '../data/wilayas';
import { Sari3Logo } from './Sari3Logo';
import {
  User,
  ArrowRight,
  ArrowLeft,
  Globe,
  Sun,
  Moon,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface CustomerProfileSetupScreenProps {
  currentUser: UserProfile;
  t: AppTranslations;
  lang: Language;
  theme: ThemeMode;
  onCompleteProfile: (updatedData: {
    displayName: string;
    avatarUrl?: string;
    birthDate?: string;
    wilaya: string;
  }) => void;
  onBackToRoleSelection: () => void;
  onLanguageChange: (lang: Language) => void;
  onThemeToggle: () => void;
}

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

  const [fullName, setFullName] = useState(
    currentUser.displayName && currentUser.displayName !== 'مستخدم سريع'
      ? currentUser.displayName
      : ''
  );
  const [selectedWilaya, setSelectedWilaya] = useState(currentUser.wilaya || '16');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fullName.trim();
    if (!cleanName || cleanName.length < 2) {
      setErrorMessage(
        lang === 'ar'
          ? 'يرجى إدخال الاسم واللقب بشكل صحيح (مثال: أمين بن علي)'
          : 'Please enter your first and last name'
      );
      return;
    }

    onCompleteProfile({
      displayName: cleanName,
      wilaya: selectedWilaya,
      // No profile pictures or forced file uploads for customers
      avatarUrl: undefined,
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between py-2">
        <Sari3Logo size="md" showTagline taglineText={t.tagline} />

        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <select
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

          <button
            type="button"
            onClick={onThemeToggle}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-emerald-400 transition cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="my-auto py-6">
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md">
          <div className="mb-5 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
              <User size={24} />
            </div>
            <h2 className="text-xl font-black text-white font-['Cairo']">
              إكمال بيانات الزبون
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              أدخل اسمك ولقبك فقط لبدء نشر واستقبال عروض التوصيل فوراً
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                الاسم واللقب <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="input-customer-setup-name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="مثال: أمين بن علي"
                  autoFocus
                  required
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
                <User size={16} className="absolute left-4 top-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                الولاية
              </label>
              <select
                id="select-customer-setup-wilaya"
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

            {/* Zero file/avatar requirement banner */}
            <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-emerald-400 flex items-center gap-2">
              <ShieldCheck size={16} className="shrink-0" />
              <span>تسجيل فوري بدون الحاجة لرفع صور شخصية أو مستندات.</span>
            </div>

            <button
              type="submit"
              id="btn-customer-setup-submit"
              disabled={fullName.trim().length < 2}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>تأكيد والبدء الآن</span>
              <ArrowIcon size={16} />
            </button>
          </form>
        </div>
      </main>

      <footer className="py-3 text-center text-[11px] text-slate-500">
        <span>Sari3 Delivery • تجربة سلسة وسريعة للزبائن في الجزائر</span>
      </footer>
    </div>
  );
};
