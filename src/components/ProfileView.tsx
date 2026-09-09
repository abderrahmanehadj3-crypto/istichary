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
  Mail,
  Award,
  UserX,
  UserMinus,
  Edit2,
  RefreshCw,
} from 'lucide-react';
import { UserAccount, Language, ThemeMode, DoctorProfile } from '../types';
import { translations } from '../i18n/translations';
import { RoleAvatar } from './RoleAvatar';
import { MOCK_DOCTORS } from '../data/mockData';

interface ProfileViewProps {
  currentUser: UserAccount | null;
  doctors: DoctorProfile[];
  lang: Language;
  theme: ThemeMode;
  onLanguageChange: (newLang: Language) => void;
  onThemeToggle: () => void;
  onSignOut: () => void;
  onRequestAuth: () => void;
  onUpdateEmail: (newEmail: string, passwordConfirm: string) => { success: boolean; error?: string };
  onChangePassword: (oldPass: string, newPass: string) => { success: boolean; error?: string };
  onDeleteAccount: (password: string) => boolean;
  onToggleRealName: (show: boolean) => void;
  onUnfollowDoctor: (doctorId: string) => void;
  onSimulateInactivity: () => void;
  onClearModerationPenalty: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  doctors,
  lang,
  theme,
  onLanguageChange,
  onThemeToggle,
  onSignOut,
  onRequestAuth,
  onUpdateEmail,
  onChangePassword,
  onDeleteAccount,
  onToggleRealName,
  onUnfollowDoctor,
  onSimulateInactivity,
  onClearModerationPenalty,
}) => {
  const t = translations[lang];

  // Email Update State
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPasswordConfirm, setEmailPasswordConfirm] = useState('');
  const [emailMessage, setEmailMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Password Reset / Change State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [resetEmailSimulated, setResetEmailSimulated] = useState(false);

  // Account Deletion State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const isDoctor = currentUser?.role === 'doctor';
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isModerator = currentUser?.role === 'moderator';

  // Find followed doctors
  const followedDocs = (currentUser?.followingDoctorIds || [])
    .map((docId) => doctors.find((d) => d.id === docId))
    .filter(Boolean) as DoctorProfile[];

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMessage(null);

    if (!newEmail.trim() || !newEmail.includes('@')) {
      setEmailMessage({ text: 'Please enter a valid email address.', isError: true });
      return;
    }

    const res = onUpdateEmail(newEmail.trim(), emailPasswordConfirm);
    if (res.success) {
      setEmailMessage({ text: t.emailUpdatedSuccess, isError: false });
      setNewEmail('');
      setEmailPasswordConfirm('');
      setIsUpdatingEmail(false);
    } else {
      setEmailMessage({ text: res.error || 'Failed to update email address.', isError: true });
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordMessage({ text: 'Password must be at least 6 characters long.', isError: true });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ text: 'New password and confirmation do not match.', isError: true });
      return;
    }

    const res = onChangePassword(currentPassword, newPassword);
    if (res.success) {
      setPasswordMessage({ text: t.passwordChangedSuccess, isError: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setIsChangingPassword(false);
    } else {
      setPasswordMessage({ text: res.error || 'Failed to change password. Check current password.', isError: true });
    }
  };

  const handleSimulateResetLink = () => {
    setResetEmailSimulated(true);
    setTimeout(() => {
      setResetEmailSimulated(false);
    }, 6000);
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
      setDeleteError('Incorrect password. Please verify credentials.');
    } else {
      setIsDeleteModalOpen(false);
    }
  };

  if (!currentUser) {
    return (
      <div id="profile-unauth-card" className="p-8 text-center space-y-4 max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center">
          <Lock size={28} />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Sign In to Access Your Profile
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage your private email, password security, followed specialists, and account settings.
        </p>
        <button
          id="btn-profile-login"
          onClick={onRequestAuth}
          className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
        >
          {t.signIn} / {t.signUp}
        </button>
      </div>
    );
  }

  return (
    <div id="profile-view-container" className="space-y-4 pb-12 text-slate-900 dark:text-slate-100">
      {/* 1. USER IDENTITY CARD */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4.5 shadow-xs space-y-3">
        <div className="flex items-start gap-3.5">
          <RoleAvatar
            role={currentUser.role}
            size="lg"
            verificationStatus={currentUser.verificationStatus}
            className="shrink-0"
          />

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {isDoctor && currentUser.realName && currentUser.showRealName
                  ? currentUser.realName
                  : currentUser.username}
              </h3>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {currentUser.role.replace('_', ' ')}
              </span>

              {isDoctor && currentUser.verificationStatus === 'verified' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <Shield size={10} />
                  <span>Verified</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {currentUser.username}
            </p>

            {/* MANDATORY PROMINENT SPECIALTY FOR DOCTOR */}
            {isDoctor && currentUser.specialty && (
              <div className="pt-1">
                <span
                  id="profile-doctor-specialty-badge"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs"
                >
                  <Award size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span>{currentUser.specialty}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Doctor-Specific Options */}
        {isDoctor && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {t.showRealNameOnProfile}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Current: {currentUser.realName || 'Not configured'}
                </p>
              </div>
              <button
                id="btn-toggle-doctor-realname"
                onClick={() => onToggleRealName(!currentUser.showRealName)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  currentUser.showRealName
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {currentUser.showRealName ? 'Displaying Real Name' : 'Display Username Only'}
              </button>
            </div>

            <div className="text-[11px] text-slate-500 font-mono bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl">
              License ID: {currentUser.medicalLicenseNumber || 'MD-REGISTERED-SPECIALIST'}
            </div>
          </div>
        )}
      </div>

      {/* 2. EMAIL UPDATE SECTION (STRICT PRIVACY) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-sky-600 dark:text-sky-400" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {t.emailPrivate}
            </h4>
          </div>
          <button
            id="btn-toggle-update-email"
            type="button"
            onClick={() => {
              setIsUpdatingEmail(!isUpdatingEmail);
              setEmailMessage(null);
            }}
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Edit2 size={12} />
            <span>{isUpdatingEmail ? t.cancel : t.updateEmail}</span>
          </button>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Current Private Address</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              {currentUser.email}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Encrypted & Private
          </span>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          {t.emailPrivateNotice}
        </p>

        {emailMessage && (
          <div
            className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
              emailMessage.isError
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
            }`}
          >
            {emailMessage.isError ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
            <span>{emailMessage.text}</span>
          </div>
        )}

        {isUpdatingEmail && (
          <form onSubmit={handleEmailSubmit} className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                New Email Address
              </label>
              <input
                id="input-new-email"
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={t.newEmailPlaceholder}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Confirm Current Password
              </label>
              <input
                id="input-email-confirm-pass"
                type="password"
                required
                value={emailPasswordConfirm}
                onChange={(e) => setEmailPasswordConfirm(e.target.value)}
                placeholder="Enter password to authorize email change"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsUpdatingEmail(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                {t.cancel}
              </button>
              <button
                id="btn-save-new-email"
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition"
              >
                {t.save}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 3. FUNCTIONAL PASSWORD RESET & CHANGE PASSWORD SECTION */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-sky-600 dark:text-sky-400" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {t.resetPassword} / {t.changePassword}
            </h4>
          </div>
          <button
            id="btn-toggle-change-password"
            type="button"
            onClick={() => {
              setIsChangingPassword(!isChangingPassword);
              setPasswordMessage(null);
            }}
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Edit2 size={12} />
            <span>{isChangingPassword ? t.cancel : t.changePassword}</span>
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Update your secret access credentials directly or simulate a secure password reset dispatch to your private email.
        </p>

        {passwordMessage && (
          <div
            className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
              passwordMessage.isError
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
            }`}
          >
            {passwordMessage.isError ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
            <span>{passwordMessage.text}</span>
          </div>
        )}

        {/* Option A: Direct Password Update Form */}
        {isChangingPassword && (
          <form onSubmit={handlePasswordSubmit} className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.currentPassword}
              </label>
              <input
                id="input-current-password"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.newPassword}
              </label>
              <input
                id="input-new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.confirmPassword}
              </label>
              <input
                id="input-confirm-new-password"
                type="password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsChangingPassword(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                {t.cancel}
              </button>
              <button
                id="btn-save-new-password"
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition"
              >
                {t.save}
              </button>
            </div>
          </form>
        )}

        {/* Option B: Simulate Password Reset Link */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Need an email recovery token instead?
          </span>
          <button
            id="btn-simulate-reset-email"
            type="button"
            onClick={handleSimulateResetLink}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold text-xs transition cursor-pointer"
          >
            {t.sendResetLink}
          </button>
        </div>

        {resetEmailSimulated && (
          <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-300 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-sky-600 shrink-0" />
            <span>{t.resetCodeSent} Sent to: {currentUser.email}</span>
          </div>
        )}
      </div>

      {/* 4. FOLLOWED SPECIALISTS MANAGEMENT */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck size={16} className="text-amber-500" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {t.followedDoctors} ({followedDocs.length})
            </h4>
          </div>
        </div>

        {followedDocs.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 text-center text-xs text-slate-500 dark:text-slate-400">
            {t.noFollowedDoctors}
          </div>
        ) : (
          <div className="space-y-2">
            {followedDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <RoleAvatar role="doctor" size="sm" verificationStatus={doc.verificationStatus} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {doc.realName || doc.username}
                      </span>
                      {/* MANDATORY PROMINENT SPECIALTY */}
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                        {doc.specialty}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {doc.hospitalOrClinic}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onUnfollowDoctor(doc.id)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 text-slate-600 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition cursor-pointer"
                  title="Unfollow doctor"
                >
                  <UserMinus size={12} />
                  <span>{t.unfollowDoctor}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. THEME & PREFERENCES */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Appearance & Language
        </h4>

        <div className="flex items-center justify-between text-xs py-1">
          <span className="text-slate-600 dark:text-slate-400 font-medium">
            {t.theme}
          </span>
          <button
            id="profile-theme-toggle-btn"
            onClick={onThemeToggle}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 font-bold transition cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun size={14} className="text-amber-400" />
                <span>{t.lightMode}</span>
              </>
            ) : (
              <>
                <Moon size={14} className="text-indigo-600" />
                <span>{t.darkMode}</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between text-xs py-1 border-t border-slate-100 dark:border-slate-700/60">
          <span className="text-slate-600 dark:text-slate-400 font-medium">
            {t.language}
          </span>
          <div className="flex items-center gap-1">
            {(['en', 'ar', 'fr'] as const).map((l) => (
              <button
                key={l}
                onClick={() => onLanguageChange(l)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  lang === l
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 6. ACCOUNT INACTIVITY STATUS & SIMULATION */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900 dark:text-white">
            12-Month Inactivity Protection Policy
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            Active
          </span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
          {t.inactivePolicyDesc}
        </p>
        <div className="pt-2 flex justify-end">
          <button
            onClick={onSimulateInactivity}
            className="text-[11px] text-slate-500 hover:text-amber-600 underline font-medium"
          >
            Simulate 12-Month Inactivity Deactivation
          </button>
        </div>
      </div>

      {/* 7. ACCOUNT DELETION & LOGOUT */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <button
          id="btn-profile-signout"
          onClick={onSignOut}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-2xs hover:bg-slate-100 transition cursor-pointer"
        >
          <LogOut size={13} />
          <span>{t.signOut}</span>
        </button>

        <button
          id="btn-open-delete-account-modal"
          onClick={() => setIsDeleteModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:text-rose-700 text-xs font-semibold hover:underline cursor-pointer"
        >
          <Trash2 size={13} />
          <span>{t.deleteAccount}</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 size={24} />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {t.deleteAccount}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.deleteAccountWarning}
              </p>
            </div>

            {deleteError && (
              <div className="p-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleConfirmDelete} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.enterPasswordToDelete}
                </label>
                <input
                  id="input-delete-account-password"
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your account password"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  {t.cancel}
                </button>
                <button
                  id="btn-confirm-delete-account"
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
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
