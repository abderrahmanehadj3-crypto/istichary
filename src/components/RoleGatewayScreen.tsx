import React from 'react';
import { AppTranslations } from '../i18n/translations';
import { Language, ThemeMode } from '../types';
import { Sari3Logo } from './Sari3Logo';
import {
  Package,
  Bike,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Zap,
  Globe,
  Sun,
  Moon,
  CheckCircle2,
} from 'lucide-react';

interface RoleGatewayScreenProps {
  t: AppTranslations;
  lang: Language;
  theme: ThemeMode;
  onSetLang: (l: Language) => void;
  onToggleTheme: () => void;
  onSelectPortal: (portal: 'customer' | 'driver') => void;
  onQuickDemo: (role: 'customer' | 'driver') => void;
}

export const RoleGatewayScreen: React.FC<RoleGatewayScreenProps> = ({
  t,
  lang,
  theme,
  onSetLang,
  onToggleTheme,
  onSelectPortal,
  onQuickDemo,
}) => {
  const isRtl = lang === 'ar';
  const NextArrow = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto select-none">
      {/* Top Bar: Brand, Language, Theme */}
      <header className="flex items-center justify-between py-2 mb-6">
        <Sari3Logo size="md" showTagline taglineText={t.tagline} />

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative flex items-center">
            <select
              id="select-gateway-lang"
              value={lang}
              onChange={(e) => onSetLang(e.target.value as Language)}
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
            id="btn-gateway-theme-toggle"
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-emerald-400 transition cursor-pointer"
            title="تبديل المظهر"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* Main Hero & Welcome Choice */}
      <div className="flex-1 flex flex-col justify-center space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <Zap size={13} className="text-emerald-400" />
            <span>منظومة التوصيل المباشر والتفاوض الحر</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Cairo'] tracking-tight">
            {t.roleGatewayTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            {t.roleGatewaySubtitle}
          </p>
        </div>

        {/* 2 Isolated Entry Portals */}
        <div className="grid grid-cols-1 gap-4">
          {/* CUSTOMER PORTAL CARD */}
          <button
            id="btn-gateway-customer"
            type="button"
            onClick={() => onSelectPortal('customer')}
            className="group relative p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-emerald-500/80 shadow-xl transition-all duration-300 text-right cursor-pointer hover:shadow-2xl hover:shadow-emerald-500/10 flex items-start gap-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
              <Package size={28} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-black text-white group-hover:text-emerald-400 transition-colors font-['Cairo']">
                  {t.enterAsCustomer}
                </h3>
                <span className="w-7 h-7 rounded-full bg-slate-800 group-hover:bg-emerald-500 group-hover:text-slate-950 text-slate-400 flex items-center justify-center flex-shrink-0 transition-colors">
                  <NextArrow size={14} />
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {t.roleCustomerDesc}
              </p>
              <div className="flex items-center gap-2 mt-2.5 text-[11px] text-emerald-400 font-semibold">
                <CheckCircle2 size={12} />
                <span>تسجيل دخول الزبائن برقم الهاتف أو Google</span>
              </div>
            </div>
          </button>

          {/* DRIVER PORTAL CARD */}
          <button
            id="btn-gateway-driver"
            type="button"
            onClick={() => onSelectPortal('driver')}
            className="group relative p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-purple-500/80 shadow-xl transition-all duration-300 text-right cursor-pointer hover:shadow-2xl hover:shadow-purple-500/10 flex items-start gap-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
              <Bike size={28} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-black text-white group-hover:text-purple-400 transition-colors font-['Cairo']">
                  {t.enterAsDriver}
                </h3>
                <span className="w-7 h-7 rounded-full bg-slate-800 group-hover:bg-purple-500 group-hover:text-slate-950 text-slate-400 flex items-center justify-center flex-shrink-0 transition-colors">
                  <NextArrow size={14} />
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {t.roleDriverDesc}
              </p>
              <div className="flex items-center gap-2 mt-2.5 text-[11px] text-purple-400 font-semibold">
                <ShieldCheck size={12} />
                <span>توثيق رسمي للكباتن (رخصة قيادة + بطاقة رمادية)</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Bottom Testing Utilities: Quick One-Click Demo Access */}
      <footer className="mt-8 pt-4 border-t border-slate-800/80 text-center space-y-2">
        <p className="text-[11px] text-slate-400 font-medium">
          اختبار سريع وفوري للمنظومة (بدون كتابة بيانات):
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            id="btn-quick-demo-customer"
            type="button"
            onClick={() => onQuickDemo('customer')}
            className="py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Package size={14} />
            <span>{t.quickDemoCustomer}</span>
          </button>

          <button
            id="btn-quick-demo-driver"
            type="button"
            onClick={() => onQuickDemo('driver')}
            className="py-2.5 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Bike size={14} />
            <span>{t.quickDemoDriver}</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
