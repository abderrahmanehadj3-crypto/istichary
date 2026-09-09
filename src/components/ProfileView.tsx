import React, { useState } from 'react';
import {
  Shield,
  Heart,
  Phone,
  AlertTriangle,
  Building2,
  MapPin,
  Globe,
  Sun,
  Moon,
  Trash2,
  Lock,
  LogOut,
  UserCheck,
  Clock,
  Sparkles,
  AlertOctagon,
  KeyRound,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';
import { UserAccount, Language, ThemeMode } from '../types';
import { translations } from '../i18n/translations';
import { RoleAvatar } from './RoleAvatar';

interface ProfileViewProps {
  currentUser: UserAccount | null;
  lang: Language;
  theme: ThemeMode;
  onLanguageChange: (newLang: Language) => void;
  onThemeToggle: () => void;
  onEmergencyClick: () => void;
  onSignOut: () => void;
  onRequestAuth: () => void;
  onDeleteAccount: (password: string) => boolean;
  onUpdateDoctorClinic: (clinicName: string, clinicAddress: string, clinicCity: string) => void;
  onToggleRealName: (show: boolean) => void;
  onSimulateInactivity: () => void;
  onClearModerationPenalty: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  lang,
  theme,
  onLanguageChange,
  onThemeToggle,
  onEmergencyClick,
  onSignOut,
  onRequestAuth,
  onDeleteAccount,
  onUpdateDoctorClinic,
  onToggleRealName,
  onSimulateInactivity,
  onClearModerationPenalty,
}) => {
  const t = translations[lang];

  // Clinic edit state for doctors
  const [isEditingClinic, setIsEditingClinic] = useState(false);
  const [clinicName, setClinicName] = useState(currentUser?.clinicName || '');
  const [clinicAddress, setClinicAddress] = useState(currentUser?.clinicAddress || '');
  const [clinicCity, setClinicCity] = useState(currentUser?.clinicCity || 'Algiers');

  // Account deletion modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const isDoctor = currentUser?.role === 'doctor';

  const handleSaveClinic = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateDoctorClinic(clinicName, clinicAddress, clinicCity);
    setIsEditingClinic(false);
  };

  const handleConfirmDelete = (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');
    if (!deletePassword.trim()) {
      setDeleteError(t.enterPasswordToDelete);
      return;
    }
    const success = onDeleteAccount(deletePassword);
    if (!success) {
      setDeleteError('Incorrect password. Please re-enter your account password.');
    } else {
      setIsDeleteModalOpen(false);
    }
  };

  if (!currentUser) {
    return (
      <div id="profile-view-unauth" className="p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center">
          <Lock size={28} />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Sign In to View Your Medical Profile
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Access your private consultation posts, verified specialist interactions, and account settings.
        </p>
        <button
          id="btn-login-profile"
          onClick={onRequestAuth}
          className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm transition"
        >
          {t.signIn} / {t.signUp}
        </button>
      </div>
    );
  }

  return (
    <div id="profile-view" className="space-y-4 pb-12 text-slate-900 dark:text-slate-100">
      {/* User Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4.5 shadow-xs">
        <div className="flex items-start gap-4">
          <RoleAvatar
            role={currentUser.role}
            size="xl"
            verificationStatus={currentUser.verificationStatus}
            className="shrink-0"
          />

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {isDoctor && currentUser.realName && currentUser.showRealName ? (
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {currentUser.realName}
                </h3>
              ) : (
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {currentUser.username}
                </h3>
              )}

              {isDoctor && currentUser.realName && currentUser.showRealName && (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {currentUser.username}
                </span>
              )}

              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-0.5 ${
                  isDoctor
                    ? currentUser.verificationStatus === 'verified'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                    : 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300'
                }`}
              >
                {isDoctor
                  ? currentUser.verificationStatus === 'verified'
                    ? t.verifiedDoctorBadge
                    : t.pendingVerification
                  : 'Patient Account'}
              </span>
            </div>

            {isDoctor && (
              <p className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                {currentUser.specialty || 'Medical Specialist'} • License: {currentUser.medicalLicenseNumber}
              </p>
            )}

            {/* Email Privacy Pill */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <Lock size={12} className="text-sky-500 shrink-0" />
              <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md">
                {currentUser.email.replace(/(.{3})(.*)(@.*)/, '$1***$3')}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                (Strictly Private)
              </span>
            </div>
          </div>
        </div>

        {/* Doctor Real Name Privacy / Trust Setting */}
        {isDoctor && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">
              Display real name ({currentUser.realName || 'Doctor'}) on consultations
            </span>
            <input
              type="checkbox"
              id="toggle-real-name"
              checked={currentUser.showRealName || false}
              onChange={(e) => onToggleRealName(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded"
            />
          </div>
        )}
      </div>

      {/* AI Moderation Status Card */}
      <div
        id="moderation-status-card"
        className={`p-3.5 rounded-2xl border text-xs ${
          currentUser.moderationStatus === 'banned'
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
            : currentUser.moderationStatus === 'restricted_48h'
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300'
            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} />
            <span className="font-semibold">AI Content Moderation Status:</span>
            <span>
              {currentUser.moderationStatus === 'banned' && t.moderationBannedBadge}
              {currentUser.moderationStatus === 'restricted_48h' && t.moderationRestrictedBadge}
              {currentUser.moderationStatus === 'active' && t.moderationActiveBadge}
            </span>
          </div>

          {currentUser.moderationStatus !== 'active' && (
            <button
              onClick={onClearModerationPenalty}
              className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-semibold border shadow-xs hover:bg-white"
            >
              Reset Penalty (Test)
            </button>
          )}
        </div>
        {currentUser.penaltyReason && (
          <p className="mt-1 text-[11px] opacity-90 pl-6">
            Details: {currentUser.penaltyReason}
          </p>
        )}
      </div>

      {/* Inactive Account Cleanup Policy Card (12 Months Auto-Deactivation) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
            <Clock size={16} className="text-sky-500" />
            <span>Medical Data Retention & Inactivity Policy</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300">
            12-Month Rule
          </span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
          {t.inactivePolicyDesc}
        </p>
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300">
          <span>{t.lastActiveDate}:</span>
          <span className="font-medium font-mono text-[11px]">
            {new Date(currentUser.lastLoginDate).toLocaleDateString()}
          </span>
        </div>
        <div className="pt-1 flex justify-end">
          <button
            onClick={onSimulateInactivity}
            className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline"
          >
            Simulate 12+ Months Inactivity (Test Auto-Deactivation)
          </button>
        </div>
      </div>

      {/* Doctor Practice Location Section */}
      {isDoctor && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-indigo-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                {t.practiceLocation}
              </h4>
            </div>
            <button
              onClick={() => setIsEditingClinic(!isEditingClinic)}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
            >
              {isEditingClinic ? t.cancel : t.editPracticeLocation}
            </button>
          </div>

          {isEditingClinic ? (
            <form onSubmit={handleSaveClinic} className="space-y-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t.clinicName}
                </label>
                <input
                  type="text"
                  required
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    City / Region
                  </label>
                  <select
                    value={clinicCity}
                    onChange={(e) => setClinicCity(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  >
                    <option value="Algiers">Algiers</option>
                    <option value="Paris">Paris</option>
                    <option value="Casablanca">Casablanca</option>
                    <option value="London">London</option>
                    <option value="Cairo">Cairo</option>
                    <option value="Dubai">Dubai</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    required
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition shadow-xs"
              >
                {t.updateClinicInfo}
              </button>
            </form>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60 text-xs space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Building2 size={13} className="text-sky-500" />
                {currentUser.clinicName || 'Not Set'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-5">
                {currentUser.clinicAddress || 'Address not configured'} ({currentUser.clinicCity || 'Algiers'})
              </p>
            </div>
          )}
        </div>
      )}

      {/* Language and Theme Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Preferences & Accessibility
        </h4>

        {/* Language Switcher */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
            <Globe size={16} className="text-sky-600" />
            <span>{t.language}</span>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs font-semibold">
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 rounded-lg transition ${
                lang === 'en'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              English
            </button>
            <button
              onClick={() => onLanguageChange('ar')}
              className={`px-2.5 py-1 rounded-lg transition ${
                lang === 'ar'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              العربية
            </button>
            <button
              onClick={() => onLanguageChange('fr')}
              className={`px-2.5 py-1 rounded-lg transition ${
                lang === 'fr'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Français
            </button>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
            {theme === 'dark' ? (
              <Moon size={16} className="text-indigo-400" />
            ) : (
              <Sun size={16} className="text-amber-500" />
            )}
            <span>{t.theme}</span>
          </div>
          <button
            id="btn-toggle-theme"
            onClick={onThemeToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            {theme === 'dark' ? t.darkMode : t.lightMode}
          </button>
        </div>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="bg-rose-50/70 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/60 p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-semibold text-xs">
            <Trash2 size={16} />
            <span>{t.deleteAccount}</span>
          </div>
          <button
            id="btn-open-delete-account"
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition shadow-xs"
          >
            {t.delete}
          </button>
        </div>
        <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80 leading-relaxed">
          {t.deleteAccountWarning}
        </p>
      </div>

      {/* Sign Out Button */}
      <button
        id="btn-signout"
        onClick={onSignOut}
        className="w-full py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold transition flex items-center justify-center gap-2"
      >
        <LogOut size={14} />
        <span>{t.signOut}</span>
      </button>

      {/* Account Deletion Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          id="delete-account-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs"
        >
          <div
            id="delete-account-modal-content"
            className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl border border-rose-200 dark:border-rose-900 p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <AlertOctagon size={22} />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Confirm Account Deletion
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.deleteAccountWarning}
            </p>

            {deleteError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 p-2 rounded-lg">
                {deleteError}
              </p>
            )}

            <form onSubmit={handleConfirmDelete} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.enterPasswordToDelete}
                </label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="input-delete-password"
                    type="password"
                    required
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  {t.cancel}
                </button>
                <button
                  id="btn-confirm-permanent-delete"
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs"
                >
                  {t.delete}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
