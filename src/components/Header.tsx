import React, { useState } from 'react';
import {
  ShieldCheck,
  PhoneCall,
  Globe,
  Sun,
  Moon,
  AlertTriangle,
  User,
  Sparkles,
  Lock,
} from 'lucide-react';
import { UserAccount, Language, ThemeMode } from '../types';
import { translations } from '../i18n/translations';
import { RoleAvatar } from './RoleAvatar';

interface HeaderProps {
  currentUser: UserAccount | null;
  lang: Language;
  theme: ThemeMode;
  onLanguageChange: (newLang: Language) => void;
  onThemeToggle: () => void;
  onEmergencyClick: () => void;
  onRequestAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  lang,
  theme,
  onLanguageChange,
  onThemeToggle,
  onEmergencyClick,
  onRequestAuth,
}) => {
  const t = translations[lang];

  return (
    <header
      id="app-header"
      className="relative px-5 pt-5 pb-4 bg-gradient-to-b from-sky-100/70 via-sky-50/40 to-white dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900 text-slate-900 dark:text-slate-100 transition-colors"
    >
      {/* Top row: Avatar & User greeting + Utility buttons */}
      <div className="flex items-center justify-between gap-3">
        {currentUser ? (
          <div className="flex items-center gap-3">
            <RoleAvatar
              role={currentUser.role}
              size="md"
              verificationStatus={currentUser.verificationStatus}
            />
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                <span>
                  {currentUser.role === 'doctor' ? 'HEALTHCARE SPECIALIST' : 'PATIENT CARE'}
                </span>
              </div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {currentUser.role === 'doctor' && currentUser.showRealName && currentUser.realName
                  ? currentUser.realName
                  : currentUser.username}
              </h1>
            </div>
          </div>
        ) : (
          <button
            id="header-signin-btn"
            onClick={onRequestAuth}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <User size={14} />
            <span>{t.signIn} / {t.signUp}</span>
          </button>
        )}

        {/* Right utility buttons: Language, Theme, SOS */}
        <div className="flex items-center gap-1.5">
          {/* Language Selector */}
          <div className="flex items-center p-0.5 rounded-xl bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold shadow-2xs">
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-1.5 py-0.5 rounded-lg transition ${
                lang === 'en'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="English"
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('ar')}
              className={`px-1.5 py-0.5 rounded-lg transition ${
                lang === 'ar'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="العربية"
            >
              عربي
            </button>
            <button
              onClick={() => onLanguageChange('fr')}
              className={`px-1.5 py-0.5 rounded-lg transition ${
                lang === 'fr'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Français"
            >
              FR
            </button>
          </div>

          {/* Theme toggle */}
          <button
            id="header-theme-toggle"
            onClick={onThemeToggle}
            className="p-2 rounded-xl bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title={theme === 'dark' ? t.lightMode : t.darkMode}
          >
            {theme === 'dark' ? (
              <Sun size={15} className="text-amber-400" />
            ) : (
              <Moon size={15} className="text-indigo-600" />
            )}
          </button>

          {/* Emergency SOS button */}
          <button
            id="emergency-helpline-btn"
            onClick={onEmergencyClick}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition"
            title="Emergency Medical Dispatch"
          >
            <PhoneCall size={13} />
            <span className="hidden sm:inline">SOS</span>
          </button>
        </div>
      </div>

      {/* Moderation Alert Banner if user is restricted or banned */}
      {currentUser && currentUser.moderationStatus === 'banned' && (
        <div className="mt-3 p-3 rounded-xl bg-rose-600 text-white text-xs shadow-md flex items-start gap-2.5">
          <AlertTriangle size={18} className="shrink-0 mt-0.5 text-rose-200" />
          <div className="space-y-0.5">
            <p className="font-bold">{t.bannedAlertTitle}</p>
            <p className="text-[11px] text-rose-100">{t.bannedAlertDesc}</p>
          </div>
        </div>
      )}

      {currentUser && currentUser.moderationStatus === 'restricted_48h' && (
        <div className="mt-3 p-3 rounded-xl bg-amber-500 text-white text-xs shadow-md flex items-start gap-2.5">
          <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-200" />
          <div className="space-y-0.5">
            <p className="font-bold">{t.restrictedAlertTitle}</p>
            <p className="text-[11px] text-amber-100">{t.restrictedAlertDesc}</p>
          </div>
        </div>
      )}

      {/* Welcoming health card / banner */}
      <div className="mt-3.5 p-3.5 bg-gradient-to-r from-sky-600 to-indigo-700 text-white rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-sky-100">
            <ShieldCheck size={15} className="text-sky-200" />
            <span>{t.tagline}</span>
          </div>
          <h2 className="text-sm sm:text-base font-bold text-white">
            Need medical guidance today?
          </h2>
          <p className="text-xs text-sky-100/90 leading-relaxed max-w-md">
            Publish an open consultation post or book verified specialists near your region.
          </p>
        </div>
      </div>
    </header>
  );
};
