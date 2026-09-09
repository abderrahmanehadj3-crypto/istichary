import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Stethoscope,
  FileCheck,
  Upload,
  AlertCircle,
  KeyRound,
  Building2,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { UserAccount, UserRole, Language, SpecializationId } from '../types';
import { translations } from '../i18n/translations';
import { SPECIALIZATIONS } from '../data/mockData';
import { RoleAvatar } from './RoleAvatar';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserAccount) => void;
  lang: Language;
  existingUsers: UserAccount[];
}

type AuthTab = 'signin' | 'signup_patient' | 'signup_doctor' | 'forgot_password';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  lang,
  existingUsers,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [infoMsg, setInfoMsg] = useState<string>('');

  // Sign In state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Shared Sign Up state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Doctor-specific fields
  const [doctorRealName, setDoctorRealName] = useState('');
  const [showRealName, setShowRealName] = useState(true);
  const [specialtyId, setSpecialtyId] = useState<SpecializationId>('general');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseFileName, setLicenseFileName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicCity, setClinicCity] = useState('Algiers');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  if (!isOpen) return null;

  const normalizeUsername = (val: string) => {
    let clean = val.trim().toLowerCase().replace(/\s+/g, '_');
    if (!clean.startsWith('@')) {
      clean = '@' + clean;
    }
    return clean;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLicenseFileName(e.target.files[0].name);
      setErrorMsg('');
    }
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setErrorMsg('Please provide your username/email and password.');
      return;
    }

    const cleanId = loginIdentifier.trim().toLowerCase();
    const user = existingUsers.find(
      (u) =>
        u.username.toLowerCase() === cleanId ||
        u.email.toLowerCase() === cleanId ||
        u.username.toLowerCase() === '@' + cleanId
    );

    if (user) {
      // Check 12-month inactivity
      if (user.isDeactivatedInactive) {
        setErrorMsg(t.accountDeactivatedNotice + ': ' + t.inactivePolicyDesc);
        return;
      }

      // Update login timestamp
      const updatedUser: UserAccount = {
        ...user,
        lastLoginDate: new Date().toISOString(),
      };
      onAuthSuccess(updatedUser);
      onClose();
    } else {
      // If demo credentials, create an active session
      const isDoc = cleanId.includes('doc');
      const newUser: UserAccount = {
        id: 'user-' + Date.now(),
        username: cleanId.startsWith('@') ? cleanId : '@' + cleanId,
        email: 'confidential.' + Date.now() + '@medshield.private',
        role: isDoc ? 'doctor' : 'patient',
        lastLoginDate: new Date().toISOString(),
        isDeactivatedInactive: false,
        moderationStatus: 'active',
        verificationStatus: isDoc ? 'verified' : undefined,
        specialty: isDoc ? 'General Specialist' : undefined,
      };
      onAuthSuccess(newUser);
      onClose();
    }
  };

  const handlePatientSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const finalUsername = normalizeUsername(username);

    if (finalUsername.length < 4) {
      setErrorMsg('Username must be at least 3 characters long.');
      return;
    }

    // Validate uniqueness
    const exists = existingUsers.some(
      (u) => u.username.toLowerCase() === finalUsername.toLowerCase()
    );
    if (exists) {
      setErrorMsg(`Username ${finalUsername} is already taken. Please choose another.`);
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid private email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    const newPatient: UserAccount = {
      id: 'patient-' + Date.now(),
      username: finalUsername,
      email: email.trim(),
      role: 'patient',
      lastLoginDate: new Date().toISOString(),
      isDeactivatedInactive: false,
      moderationStatus: 'active',
    };

    onAuthSuccess(newPatient);
    onClose();
  };

  const handleDoctorSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const finalUsername = normalizeUsername(username);

    if (finalUsername.length < 4) {
      setErrorMsg('Username must be at least 3 characters long.');
      return;
    }

    // Validate uniqueness
    const exists = existingUsers.some(
      (u) => u.username.toLowerCase() === finalUsername.toLowerCase()
    );
    if (exists) {
      setErrorMsg(`Username ${finalUsername} is already taken. Please choose another.`);
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid private email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!licenseNumber.trim()) {
      setErrorMsg('Please provide your medical license number for verification.');
      return;
    }

    if (!licenseFileName) {
      setErrorMsg('Please attach your medical diploma/license document for verification.');
      return;
    }

    const specObj = SPECIALIZATIONS.find((s) => s.id === specialtyId);

    const newDoctor: UserAccount = {
      id: 'doctor-' + Date.now(),
      username: finalUsername,
      email: email.trim(),
      role: 'doctor',
      realName: doctorRealName.trim() || undefined,
      showRealName: showRealName,
      specialty: specObj?.name || 'General Medicine',
      specializationId: specialtyId,
      verificationStatus: 'pending', // Starts pending until credential review
      medicalLicenseNumber: licenseNumber.trim(),
      medicalCertificateFile: licenseFileName,
      clinicName: clinicName.trim() || 'Specialist Medical Clinic',
      clinicAddress: clinicAddress.trim() || 'Medical District Tower',
      clinicCity: clinicCity,
      clinicLat: 36.7538,
      clinicLng: 3.0588,
      lastLoginDate: new Date().toISOString(),
      isDeactivatedInactive: false,
      moderationStatus: 'active',
      consultationFee: 70,
    };

    onAuthSuccess(newDoctor);
    onClose();
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setErrorMsg('Please enter the private email associated with your account.');
      return;
    }

    if (!resetCodeSent) {
      setResetCodeSent(true);
      setInfoMsg(t.resetCodeSent);
    } else {
      if (newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters.');
        return;
      }
      setInfoMsg('Password successfully reset! Please sign in with your new credentials.');
      setTimeout(() => {
        setActiveTab('signin');
        setResetCodeSent(false);
        setInfoMsg('');
      }, 1500);
    }
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="auth-modal-content"
        className="relative w-full max-w-lg my-8 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                {activeTab === 'signin' && t.signIn}
                {activeTab === 'signup_patient' && t.signUpAsPatient}
                {activeTab === 'signup_doctor' && t.signUpAsDoctor}
                {activeTab === 'forgot_password' && t.resetPassword}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.tagline}
              </p>
            </div>
          </div>
          <button
            id="close-auth-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab selection */}
        <div className="grid grid-cols-3 p-1.5 mx-6 mt-4 bg-slate-100 dark:bg-slate-900/60 rounded-xl text-xs font-medium">
          <button
            id="tab-signin"
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setErrorMsg('');
              setInfoMsg('');
            }}
            className={`py-2 rounded-lg transition text-center ${
              activeTab === 'signin'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.signIn}
          </button>
          <button
            id="tab-signup-patient"
            type="button"
            onClick={() => {
              setActiveTab('signup_patient');
              setErrorMsg('');
              setInfoMsg('');
            }}
            className={`py-2 rounded-lg transition text-center ${
              activeTab === 'signup_patient'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.signUpAsPatient}
          </button>
          <button
            id="tab-signup-doctor"
            type="button"
            onClick={() => {
              setActiveTab('signup_doctor');
              setErrorMsg('');
              setInfoMsg('');
            }}
            className={`py-2 rounded-lg transition text-center ${
              activeTab === 'signup_doctor'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.signUpAsDoctor}
          </button>
        </div>

        {/* Privacy Highlight Banner */}
        <div className="mx-6 mt-3 p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 text-xs text-sky-800 dark:text-sky-300 flex items-start gap-2">
          <ShieldCheck size={16} className="shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
          <div className="space-y-0.5">
            <p className="font-semibold">{t.noGenderPrivacyNotice}</p>
            <p className="text-sky-700/80 dark:text-sky-400/80">{t.emailPrivateNotice}</p>
          </div>
        </div>

        {/* Error / Info messages */}
        {errorMsg && (
          <div className="mx-6 mt-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="mx-6 mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Forms Body */}
        <div className="p-6 max-h-[68vh] overflow-y-auto">
          {/* TAB 1: SIGN IN */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.username} or {t.emailPrivate}
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="signin-identifier"
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="@username or private email"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t.password}
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('forgot_password')}
                    className="text-xs text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    {t.forgotPassword}
                  </button>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="signin-password"
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <button
                id="submit-signin"
                type="submit"
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm transition shadow-sm"
              >
                {t.signIn}
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                <span>Demo shortcuts: try signing in with </span>
                <span
                  className="text-sky-600 underline cursor-pointer font-medium"
                  onClick={() => {
                    setLoginIdentifier('@health_seeker_9');
                    setLoginPassword('password123');
                  }}
                >
                  @health_seeker_9 (Patient)
                </span>
                <span> or </span>
                <span
                  className="text-sky-600 underline cursor-pointer font-medium"
                  onClick={() => {
                    setLoginIdentifier('@dr_sarah_chen');
                    setLoginPassword('password123');
                  }}
                >
                  @dr_sarah_chen (Doctor)
                </span>
              </div>
            </form>
          )}

          {/* TAB 2: SIGN UP AS PATIENT */}
          {activeTab === 'signup_patient' && (
            <form onSubmit={handlePatientSignUp} className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80">
                <RoleAvatar role="patient" size="md" />
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    Patient Profile Assignment
                  </p>
                  <p>{t.avatarRoleNotice}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.username} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="patient-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@health_user (unique)"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.emailPrivate} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="patient-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="confidential@example.com"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {t.emailPrivateNotice}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.password} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="patient-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.confirmPassword} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="patient-confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                id="submit-patient-signup"
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition shadow-sm"
              >
                {t.signUpAsPatient}
              </button>
            </form>
          )}

          {/* TAB 3: SIGN UP AS DOCTOR */}
          {activeTab === 'signup_doctor' && (
            <form onSubmit={handleDoctorSignUp} className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
                <RoleAvatar role="doctor" size="md" verificationStatus="pending" />
                <div className="text-xs text-indigo-900 dark:text-indigo-200">
                  <p className="font-semibold">{t.verifiedDoctorBadge} Registration</p>
                  <p>{t.licenseVerificationNotice}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.username} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Stethoscope size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="doctor-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@dr_specialist"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.emailPrivate} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="doctor-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor.private@hospital.net"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {t.emailPrivateNotice}
                </p>
              </div>

              {/* Doctor Real Name Optional & Trust Setting */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.doctorRealNameOptional}
                </label>
                <input
                  id="doctor-real-name"
                  type="text"
                  value={doctorRealName}
                  onChange={(e) => setDoctorRealName(e.target.value)}
                  placeholder={t.doctorRealNamePlaceholder}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    id="doctor-show-real-name"
                    type="checkbox"
                    checked={showRealName}
                    onChange={(e) => setShowRealName(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {t.showRealNameOnProfile}
                  </span>
                </label>
              </div>

              {/* Specialization selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.selectSpecialty} <span className="text-rose-500">*</span>
                </label>
                <select
                  id="doctor-specialty-select"
                  value={specialtyId}
                  onChange={(e) => setSpecialtyId(e.target.value as SpecializationId)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {SPECIALIZATIONS.filter((s) => s.id !== 'all').map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* License Document Upload */}
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.medicalLicenseNumber} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="doctor-license-number"
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder={t.medicalLicensePlaceholder}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.uploadMedicalLicense} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl p-3.5 text-center bg-slate-50/50 dark:bg-slate-900/40 transition">
                    <input
                      id="doctor-license-file"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                      {licenseFileName ? (
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                          <FileCheck size={18} />
                          <span>{licenseFileName} ({t.licenseFileUploaded})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                          <Upload size={16} className="text-indigo-500" />
                          <span>Drag & drop or click to attach license/diploma (PDF/JPG)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinic Practice Location */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Building2 size={14} className="text-indigo-500" />
                  {t.practiceLocation}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    id="doctor-clinic-name"
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="Clinic/Hospital Name"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <select
                    id="doctor-clinic-city"
                    value={clinicCity}
                    onChange={(e) => setClinicCity(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="Algiers">Algiers</option>
                    <option value="Paris">Paris</option>
                    <option value="Casablanca">Casablanca</option>
                    <option value="London">London</option>
                    <option value="Cairo">Cairo</option>
                    <option value="Dubai">Dubai</option>
                  </select>
                </div>
                <div className="relative">
                  <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="doctor-clinic-address"
                    type="text"
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    placeholder="Clinic street address (e.g. 142 Pasteur Avenue)"
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.password} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="doctor-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.confirmPassword} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="doctor-confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                id="submit-doctor-signup"
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition shadow-sm"
              >
                {t.signUpAsDoctor}
              </button>
            </form>
          )}

          {/* TAB 4: FORGOT PASSWORD */}
          {activeTab === 'forgot_password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 text-xs text-sky-800 dark:text-sky-300 flex items-start gap-2">
                <KeyRound size={18} className="shrink-0 text-sky-600 mt-0.5" />
                <div>
                  <p className="font-semibold">{t.resetPassword}</p>
                  <p>
                    Enter your private email. A secure recovery link will be sent to your inbox to restore access.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.emailPrivate}
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="forgot-password-email"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="registered.private@email.com"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {resetCodeSent && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.newPassword}
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="reset-new-password"
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new strong password"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('signin')}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  {t.cancel}
                </button>
                <button
                  id="submit-forgot-password"
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm transition shadow-sm"
                >
                  {resetCodeSent ? t.save : t.sendResetLink}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
