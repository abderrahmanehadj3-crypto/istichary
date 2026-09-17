import React from 'react';
import {
  ShieldCheck,
  Globe,
  Sun,
  Moon,
  AlertTriangle,
  User,
  Sparkles,
  Lock,
  Stethoscope,
  Crown,
  CheckCheck,
  Bell,
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
  onRequestAuth: () => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  onOpenAppealModal?: () => void;
  onOpenAdminDashboard?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  lang,
  theme,
  onLanguageChange,
  onThemeToggle,
  onRequestAuth,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onOpenAppealModal,
  onOpenAdminDashboard,
}) => {
  const t = translations[lang];

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isModerator = currentUser?.role === 'moderator';

  return (
    <header
      id="app-header"
      className="relative px-5 pt-4 pb-3.5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 transition-colors"
    >
      {/* Top row: Brand & Profile + Utility Controls */}
      <div className="flex items-center justify-between gap-3">
        {/* Brand & User Greeting */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              <RoleAvatar
                role={currentUser.role}
                size="md"
                verificationStatus={currentUser.verificationStatus}
              />
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                  {isSuperAdmin ? (
                    <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400">
                      <Crown size={12} /> Super Admin
                    </span>
                  ) : isModerator ? (
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <CheckCheck size={12} /> Review Moderator
                    </span>
                  ) : currentUser.role === 'doctor' ? (
                    <span>{currentUser.specialty || 'Physician'}</span>
                  ) : (
                    <span>Patient Inquiry</span>
                  )}
                </div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                  {currentUser.role === 'doctor' && currentUser.showRealName && currentUser.realName
                    ? currentUser.realName
                    : currentUser.username}
                </h1>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Stethoscope size={18} />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {t.appName}
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {t.tagline}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right utility buttons: Language, Theme, Notifications */}
        <div className="flex items-center gap-2">

          {/* Language Selector */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
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

          {/* Admin / Moderator Dashboard Shield Button */}
          {(isSuperAdmin || isModerator) && onOpenAdminDashboard && (
            <button
              id="header-admin-dashboard-btn"
              type="button"
              onClick={onOpenAdminDashboard}
              className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-2xs hover:bg-indigo-100 transition cursor-pointer flex items-center gap-1"
              title={t.adminDashboard}
            >
              <ShieldCheck size={15} className="text-indigo-600 dark:text-indigo-400" />
              <span className="text-[11px] font-bold hidden sm:inline">{t.adminDashboard}</span>
            </button>
          )}

          {/* Notifications Center Bell */}
          <button
            id="header-notifications-btn"
            type="button"
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            title={t.notificationsTitle}
          >
            <Bell size={15} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-500 text-white rounded-full text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Theme toggle */}
          <button
            id="header-theme-toggle"
            onClick={onThemeToggle}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            title={theme === 'dark' ? t.lightMode : t.darkMode}
          >
            {theme === 'dark' ? (
              <Sun size={15} className="text-amber-400" />
            ) : (
              <Moon size={15} className="text-indigo-600" />
            )}
          </button>

          {!currentUser && (
            <button
              id="header-signin-btn"
              onClick={onRequestAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <User size={13} />
              <span>{t.signIn}</span>
            </button>
          )}
        </div>
      </div>

      {/* Moderation Alert Banner if user is restricted or banned */}
      {currentUser && currentUser.moderationStatus === 'banned' && (
        <div id="header-banned-alert" className="mt-2.5 p-2.5 rounded-xl bg-rose-600 text-white text-xs shadow-xs flex items-center justify-between gap-2">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-200" />
            <div className="space-y-0.5">
              <p className="font-bold">{t.bannedAlertTitle}</p>
              <p className="text-[11px] text-rose-100">{t.bannedAlertDesc}</p>
            </div>
          </div>
          {onOpenAppealModal && (
            <button
              id="header-appeal-btn-banned"
              type="button"
              onClick={onOpenAppealModal}
              className="px-3 py-1.5 rounded-lg bg-white text-rose-700 font-bold text-xs hover:bg-rose-50 shadow-xs shrink-0 cursor-pointer"
            >
              {t.submitAppeal}
            </button>
          )}
        </div>
      )}

      {currentUser && currentUser.moderationStatus === 'restricted_48h' && (
        <div id="header-restricted-alert" className="mt-2.5 p-2.5 rounded-xl bg-amber-500 text-white text-xs shadow-xs flex items-center justify-between gap-2">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-200" />
            <div className="space-y-0.5">
              <p className="font-bold">{t.restrictedAlertTitle}</p>
              <p className="text-[11px] text-amber-100">{t.restrictedAlertDesc}</p>
            </div>
          </div>
          {onOpenAppealModal && (
            <button
              id="header-appeal-btn-restricted"
              type="button"
              onClick={onOpenAppealModal}
              className="px-3 py-1.5 rounded-lg bg-white text-amber-800 font-bold text-xs hover:bg-amber-50 shadow-xs shrink-0 cursor-pointer"
            >
              {t.submitAppeal}
            </button>
          )}
        </div>
      )}
    </header>
  );
};
