import React from 'react';
import { AppTranslations } from '../i18n/translations';
import { Language, ThemeMode, UserRole } from '../types';
import { Sari3Logo } from './Sari3Logo';
import {
  Package,
  Bike,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  Globe,
  Sun,
  Moon,
} from 'lucide-react';

interface RoleGatewayProps {
  t: AppTranslations;
  lang: Language;
  theme: ThemeMode;
  onSelectRole: (role: UserRole) => void;
  onLanguageChange: (lang: Language) => void;
  onThemeToggle: () => void;
}

export const RoleGateway: React.FC<RoleGatewayProps> = ({
  t,
  lang,
  theme,
  onSelectRole,
  onLanguageChange,
  onThemeToggle,
}) => {
  const isRtl = lang === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto relative select-none">
      {/* Top Bar: Controls */}
      <header className="flex items-center justify-between py-2">
        <Sari3Logo size="md" showTagline taglineText={t.tagline} />

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative flex items-center">
            <select
              id="select-gateway-language"
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
            id="btn-gateway-theme"
            type="button"
            onClick={onThemeToggle}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-emerald-400 transition cursor-pointer"
            title="تبديل المظهر"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* Main Content: Role Gateway Cards */}
      <main className="my-auto py-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <Sparkles size={14} />
            <span>منصة التوصيل الفوري الذكية في الجزائر</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Cairo'] tracking-tight">
            {t.welcome}
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            {lang === 'ar'
              ? 'يرجى اختيار بوابتك للمتابعة - يتم توفير تجربة مخصصة ومستقلة بالكامل لكل مستخدم'
              : 'Please choose your gateway to continue - an isolated, tailored experience for each role'}
          </p>
        </div>

        {/* Portal Gateway Choices */}
        <div className="space-y-4">
          {/* 1. CUSTOMER PORTAL CARD */}
          <div
            id="portal-btn-customer"
            onClick={() => onSelectRole('customer')}
            className="group relative p-5 rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-br from-slate-900/90 to-slate-900/40 hover:border-emerald-400 hover:bg-slate-900 transition-all duration-300 cursor-pointer shadow-xl shadow-emerald-950/20 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />

            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-300 shadow-md">
                  <Package size={28} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white font-['Cairo']">
                      {t.roleCustomer}
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                      زبون
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {lang === 'ar'
                      ? 'أرسل طرودك، حدد سعرك المقترح، استقبل عروض الكباتن، وتتبع شحنتك لحظة بلحظة'
                      : 'Send packages, suggest your price, receive courier bids, and track live'}
                  </p>
                </div>
              </div>

              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 group-hover:border-emerald-500 group-hover:bg-emerald-500 group-hover:text-slate-950 text-slate-300 flex items-center justify-center flex-shrink-0 transition-all duration-300">
                <ArrowIcon size={18} />
              </div>
            </div>

            {/* Micro Badges */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <DollarSign size={13} className="text-emerald-400" />
                <span>تفاوض حر على السعر</span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-emerald-400" />
                <span>تتبع حي على الخريطة</span>
              </span>
            </div>
          </div>

          {/* 2. DRIVER PORTAL CARD */}
          <div
            id="portal-btn-driver"
            onClick={() => onSelectRole('driver')}
            className="group relative p-5 rounded-3xl border-2 border-purple-500/40 bg-gradient-to-br from-slate-900/90 to-slate-900/40 hover:border-purple-400 hover:bg-slate-900 transition-all duration-300 cursor-pointer shadow-xl shadow-purple-950/20 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />

            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 shadow-md">
                  <Bike size={28} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white font-['Cairo']">
                      {t.roleDriver}
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 text-[10px] font-bold">
                      كابتن توصيل
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {lang === 'ar'
                      ? 'انضم لأسطول الكباتن، استقبل طلبات ولايتك، قدم عروض أسعار منافسة وحقق أرباحك'
                      : 'Join the courier fleet, view regional orders, submit price offers, and earn'}
                  </p>
                </div>
              </div>

              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 group-hover:border-purple-500 group-hover:bg-purple-500 group-hover:text-white text-slate-300 flex items-center justify-center flex-shrink-0 transition-all duration-300">
                <ArrowIcon size={18} />
              </div>
            </div>

            {/* Micro Badges */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck size={13} className="text-purple-400" />
                <span>توثيق رسمي آمن</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock size={13} className="text-purple-400" />
                <span>حرية وساعات مرنة</span>
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="text-center py-3 text-[11px] text-slate-500">
        <p>Sari3 Algeria • نظام التفاوض المباشر والتوصيل الفوري الآمن</p>
      </footer>
    </div>
  );
};
