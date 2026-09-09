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
  CheckCircle2,
  Award,
} from 'lucide-react';
import { UserAccount, UserRole, Language, SpecializationId, VerificationDocument } from '../types';
import { translations } from '../i18n/translations';
import { SPECIALIZATIONS } from '../data/mockData';
import { RoleAvatar } from './RoleAvatar';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  existingUsers: UserAccount[];
  onAuthSuccess: (user: UserAccount) => void;
  onRegisterDoctor?: (newDoc: UserAccount, docDetails: any) => void;
}

type AuthTab = 'signin' | 'signup_patient' | 'signup_doctor' | 'forgot_password';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  lang,
  existingUsers,
  onAuthSuccess,
  onRegisterDoctor,
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
  const [specialtyId, setSpecialtyId] = useState<SpecializationId>('cardiology');
  const [specialtyCustomName, setSpecialtyCustomName] = useState('Cardiologist');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseFileName, setLicenseFileName] = useState('');
  const [hospitalClinic, setHospitalClinic] = useState('');

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
      setErrorMsg('Please enter your username or registered email and password.');
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
      if (user.isDeactivatedInactive) {
        setErrorMsg(`${t.accountDeactivatedNotice}: ${t.inactivePolicyDesc}`);
        return;
      }

      const updatedUser: UserAccount = {
        ...user,
        lastLoginDate: new Date().toISOString(),
      };
      onAuthSuccess(updatedUser);
      onClose();
    } else {
      // Demo credentials fallback for quick testing
      const isDoc = cleanId.includes('doc');
      const newUser: UserAccount = {
        id: `user-${Date.now()}`,
        username: cleanId.startsWith('@') ? cleanId : `@${cleanId}`,
        email: `${cleanId.replace('@', '')}@medshield.private`,
        role: isDoc ? 'doctor' : 'patient',
        lastLoginDate: new Date().toISOString(),
        isDeactivatedInactive: false,
        moderationStatus: 'active',
        followingDoctorIds: [],
        ...(isDoc
          ? {
              realName: 'Dr. Physician Practitioner',
              showRealName: true,
              specialty: 'Cardiologist',
              specializationId: 'cardiology',
              verificationStatus: 'verified',
              medicalLicenseNumber: 'MD-DEMO-9912',
            }
          : {}),
      };
      onAuthSuccess(newUser);
      onClose();
    }
  };

  const handleSignUpPatient = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !email.trim() || !password) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    const cleanUsername = normalizeUsername(username);

    // Check unique username
    if (existingUsers.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
      setErrorMsg('Username already taken. Please choose a unique handle.');
      return;
    }

    const newPatient: UserAccount = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      email: email.trim().toLowerCase(),
      role: 'patient',
      lastLoginDate: new Date().toISOString(),
      isDeactivatedInactive: false,
      moderationStatus: 'active',
      followingDoctorIds: ['doc-1'],
    };

    onAuthSuccess(newPatient);
    onClose();
  };

  const handleSignUpDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !email.trim() || !password) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!licenseNumber.trim()) {
      setErrorMsg('Medical Board License Number is required.');
      return;
    }

    const cleanUsername = normalizeUsername(username);

    if (existingUsers.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
      setErrorMsg('Doctor username handle is already in use.');
      return;
    }

    // Default sample attached verification document if user didn't select local file
    const docVerif: VerificationDocument = {
      id: `doc-verif-${Date.now()}`,
      title: 'Medical Board License Certificate',
      type: 'medical_license',
      fileName: licenseFileName || 'Medical_License_Board_Registration.pdf',
      fileSize: '2.1 MB',
      uploadedAt: new Date().toISOString().split('T')[0],
      previewNote: 'Pending verification queue inspection by medical review board',
    };

    const newDoctor: UserAccount = {
      id: `user-doc-${Date.now()}`,
      username: cleanUsername,
      email: email.trim().toLowerCase(),
      role: 'doctor',
      realName: doctorRealName.trim() || undefined,
      showRealName: showRealName,
      specialty: specialtyCustomName || 'General Physician',
      specializationId: specialtyId,
      verificationStatus: 'pending',
      medicalLicenseNumber: licenseNumber.trim(),
      hospitalOrClinic: hospitalClinic.trim() || 'Central Health Clinic',
      verificationDocuments: [docVerif],
      lastLoginDate: new Date().toISOString(),
      isDeactivatedInactive: false,
      moderationStatus: 'active',
      followingDoctorIds: [],
    };

    if (onRegisterDoctor) {
      onRegisterDoctor(newDoctor, {
        experienceYears: 6,
        about: `${doctorRealName || cleanUsername} specializing in ${specialtyCustomName}.`,
        education: 'Faculty of Medicine',
      });
    }

    onAuthSuccess(newDoctor);
    onClose();
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!forgotEmail.trim()) {
      setErrorMsg('Please enter your private registered email.');
      return;
    }
    setResetCodeSent(true);
    setInfoMsg(t.resetCodeSent);
  };

  const handleApplyNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    const user = existingUsers.find((u) => u.email.toLowerCase() === forgotEmail.trim().toLowerCase());
    if (user) {
      onAuthSuccess(user);
    }
    setInfoMsg('Password updated successfully. You are now signed in.');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div id="auth-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-6 space-y-4">
        {/* Header with Close */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm">
              <Stethoscope size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.appName}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t.loginTitle}
              </p>
            </div>
          </div>
          <button
            id="auth-modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Auth Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-semibold gap-1">
          <button
            id="tab-btn-signin"
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setErrorMsg('');
              setInfoMsg('');
            }}
            className={`flex-1 py-1.5 rounded-xl transition ${
              activeTab === 'signin'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.signIn}
          </button>

          <button
            id="tab-btn-signup-patient"
            type="button"
            onClick={() => {
              setActiveTab('signup_patient');
              setErrorMsg('');
              setInfoMsg('');
            }}
            className={`flex-1 py-1.5 rounded-xl transition ${
              activeTab === 'signup_patient'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.signUpAsPatient}
          </button>

          <button
            id="tab-btn-signup-doctor"
            type="button"
            onClick={() => {
              setActiveTab('signup_doctor');
              setErrorMsg('');
              setInfoMsg('');
            }}
            className={`flex-1 py-1.5 rounded-xl transition ${
              activeTab === 'signup_doctor'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.signUpAsDoctor}
          </button>
        </div>

        {/* Global Error or Info Notification */}
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 size={14} className="shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* TAB 1: SIGN IN */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Username or Private Email
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="signin-identifier"
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. @sarah_k or private email"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {t.password}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('forgot_password');
                    setErrorMsg('');
                  }}
                  className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  {t.forgotPassword}
                </button>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="signin-password"
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <button
              id="btn-submit-signin"
              type="submit"
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition"
            >
              {t.signIn}
            </button>
          </form>
        )}

        {/* TAB 2: PATIENT SIGN UP */}
        {activeTab === 'signup_patient' && (
          <form onSubmit={handleSignUpPatient} className="space-y-3">
            {/* Privacy notice banner */}
            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900 text-[11px] text-sky-800 dark:text-sky-300 space-y-1">
              <p className="font-semibold">{t.noGenderPrivacyNotice}</p>
              <p className="text-[10px] text-sky-600 dark:text-sky-400">{t.emailPrivateNotice}</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.username}
              </label>
              <input
                id="patient-signup-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t.usernamePlaceholder}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.emailPrivate}
              </label>
              <input
                id="patient-signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="private.patient@records.net"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.password}
                </label>
                <input
                  id="patient-signup-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.confirmPassword}
                </label>
                <input
                  id="patient-signup-confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              id="btn-submit-signup-patient"
              type="submit"
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition"
            >
              Create Patient Account
            </button>
          </form>
        )}

        {/* TAB 3: DOCTOR SIGN UP */}
        {activeTab === 'signup_doctor' && (
          <form onSubmit={handleSignUpDoctor} className="space-y-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
              <p className="font-semibold">{t.licenseVerificationNotice}</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                Uploaded credentials are strictly confidential and visible only to the verification board.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Doctor Username
                </label>
                <input
                  id="doctor-signup-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@dr_lastname"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Private Email
                </label>
                <input
                  id="doctor-signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor.license@clinic.net"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {/* MANDATORY DOCTOR SPECIALTY */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.doctorSpecialtyMandatory}
              </label>
              <select
                id="doctor-signup-specialty"
                value={specialtyId}
                onChange={(e) => {
                  const specId = e.target.value as SpecializationId;
                  setSpecialtyId(specId);
                  const found = SPECIALIZATIONS.find((s) => s.id === specId);
                  setSpecialtyCustomName(found ? found.name : 'Specialist');
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
              >
                {SPECIALIZATIONS.filter((s) => s.id !== 'all').map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Real Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.doctorRealNameOptional}
              </label>
              <input
                id="doctor-signup-realname"
                type="text"
                value={doctorRealName}
                onChange={(e) => setDoctorRealName(e.target.value)}
                placeholder={t.doctorRealNamePlaceholder}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="checkbox-show-realname"
                  checked={showRealName}
                  onChange={(e) => setShowRealName(e.target.checked)}
                  className="rounded text-sky-600"
                />
                <label htmlFor="checkbox-show-realname" className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t.showRealNameOnProfile}
                </label>
              </div>
            </div>

            {/* Medical Board License */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.medicalLicenseNumber}
              </label>
              <input
                id="doctor-signup-license"
                type="text"
                required
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder={t.medicalLicensePlaceholder}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Document Upload Simulation */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.uploadMedicalLicense}
              </label>
              <div className="p-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center space-y-1">
                <Upload size={18} className="mx-auto text-slate-400" />
                <input
                  type="file"
                  id="doctor-license-file-input"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  className="text-[11px] text-slate-500 w-full"
                />
                {licenseFileName && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Attached: {licenseFileName}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              id="btn-submit-signup-doctor"
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
            >
              Submit Doctor Registration
            </button>
          </form>
        )}

        {/* TAB 4: FORGOT PASSWORD */}
        {activeTab === 'forgot_password' && (
          <div className="space-y-3">
            {!resetCodeSent ? (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Enter your registered private email address to receive an instant recovery link.
                </p>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.emailPrivate}
                  </label>
                  <input
                    id="forgot-password-email-input"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. private.records@medshield.net"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <button
                  id="btn-send-reset-link"
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition"
                >
                  {t.sendResetLink}
                </button>
              </form>
            ) : (
              <form onSubmit={handleApplyNewPassword} className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Recovery token validated for {forgotEmail}. Please establish your new secure password:
                </p>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.newPassword}
                  </label>
                  <input
                    id="input-new-reset-password"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <button
                  id="btn-save-reset-password"
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                >
                  Update Password & Sign In
                </button>
              </form>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('signin')}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
