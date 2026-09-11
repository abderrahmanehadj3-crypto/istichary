import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  X,
  Lock,
  Mail,
  User,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  Building2,
  FileCheck,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { UserAccount, Language, SpecializationId, VerificationDocument } from '../types';
import { translations } from '../i18n/translations';
import { SPECIALIZATIONS } from '../data/mockData';

interface AuthModalProps {
  isOpen: boolean;
  isMandatory?: boolean;
  onClose: () => void;
  lang: Language;
  existingUsers: UserAccount[];
  onAuthSuccess: (user: UserAccount) => void;
  onRegisterDoctor?: (
    newDocUser: UserAccount,
    docDetails: { experienceYears: number; about: string; education: string }
  ) => void;
}

type AuthTab = 'signin' | 'signup_patient' | 'signup_doctor' | 'forgot_password';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  isMandatory = false,
  onClose,
  lang,
  existingUsers,
  onAuthSuccess,
  onRegisterDoctor,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Sign in state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Patient sign up
  const [patientUsername, setPatientUsername] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPassword, setPatientPassword] = useState('');
  const [patientConfirmPassword, setPatientConfirmPassword] = useState('');

  // Doctor sign up
  const [doctorUsername, setDoctorUsername] = useState('');
  const [doctorEmail, setDoctorEmail] = useState('');
  const [doctorPassword, setDoctorPassword] = useState('');
  const [doctorConfirmPassword, setDoctorConfirmPassword] = useState('');
  const [doctorRealName, setDoctorRealName] = useState('');
  const [showRealName, setShowRealName] = useState(true);
  const [specialtyId, setSpecialtyId] = useState<SpecializationId>('cardiology');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [hospitalClinic, setHospitalClinic] = useState('');

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCodeSent, setResetCodeSent] = useState(false);

  if (!isOpen) return null;

  const normalizeUsername = (val: string) => {
    let clean = val.trim().toLowerCase().replace(/\s+/g, '_');
    if (!clean.startsWith('@')) {
      clean = '@' + clean;
    }
    return clean;
  };

  // Sign In Handler - Strictly relies on Supabase server-side session
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    const emailOrUser = loginEmail.trim().toLowerCase();
    const pass = loginPassword;

    // Resolve target email if user provided username
    let targetEmail = emailOrUser;
    if (!targetEmail.includes('@') || targetEmail.startsWith('@')) {
      const match = existingUsers.find(
        (u) =>
          u.username.toLowerCase() === emailOrUser ||
          u.username.toLowerCase() === '@' + emailOrUser.replace(/^@/, '')
      );
      if (match?.email) {
        targetEmail = match.email.toLowerCase();
      } else {
        setErrorMsg('Please provide a valid registered email address or your registered username.');
        setLoading(false);
        return;
      }
    }

    try {
      // Strictly authenticate with Supabase Auth server
      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: pass,
      });

      // If Supabase rejects credentials or password fails, COMPLETELY BLOCK
      if (error) {
        setErrorMsg(error.message || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      if (!data?.user) {
        setErrorMsg('Authentication failed: No valid server session received.');
        setLoading(false);
        return;
      }

      // Valid server-side session confirmed by Supabase
      const u = data.user;
      const userMeta = u.user_metadata || {};
      const signedInUser: UserAccount = {
        id: u.id,
        username: userMeta.username || normalizeUsername(u.email?.split('@')[0] || 'user'),
        email: u.email || targetEmail,
        role: userMeta.role || 'patient',
        lastLoginDate: new Date().toISOString(),
        isDeactivatedInactive: false,
        moderationStatus: 'active',
        followingDoctorIds: [],
        realName: userMeta.realName,
        showRealName: userMeta.showRealName,
        specialty: userMeta.specialty,
        specializationId: userMeta.specializationId,
        medicalLicenseNumber: userMeta.medicalLicenseNumber,
        hospitalOrClinic: userMeta.hospitalOrClinic,
        verificationStatus: userMeta.verificationStatus || (userMeta.role === 'doctor' ? 'pending' : undefined),
      };

      onAuthSuccess(signedInUser);
      setLoading(false);
      onClose();
    } catch (err: any) {
      // Strictly block on any authentication error
      setErrorMsg(err?.message || 'Authentication error. Please check your credentials.');
      setLoading(false);
    }
  };

  // Sign Up Patient Handler - Strictly relies on Supabase Auth
  const handleSignUpPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (patientPassword !== patientConfirmPassword) {
      setErrorMsg(t.authPasswordsDoNotMatch || 'Passwords do not match.');
      return;
    }
    if (patientPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const cleanUser = normalizeUsername(patientUsername);
    const cleanEmail = patientEmail.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: patientPassword,
        options: {
          data: {
            username: cleanUser,
            role: 'patient',
          },
        },
      });

      if (error) {
        setErrorMsg(error.message || 'Failed to create patient account.');
        setLoading(false);
        return;
      }

      if (!data?.user) {
        setErrorMsg('Sign up failed: No user account returned from server.');
        setLoading(false);
        return;
      }

      const u = data.user;
      const userMeta = u.user_metadata || {};
      const newPatient: UserAccount = {
        id: u.id,
        username: userMeta.username || cleanUser,
        email: u.email || cleanEmail,
        role: 'patient',
        lastLoginDate: new Date().toISOString(),
        isDeactivatedInactive: false,
        moderationStatus: 'active',
        followingDoctorIds: [],
      };

      if (data.session) {
        onAuthSuccess(newPatient);
        setInfoMsg('Account created and signed in successfully!');
        setTimeout(() => {
          setLoading(false);
          onClose();
        }, 800);
      } else {
        setInfoMsg('Account created! If confirmation is required, please check your email inbox.');
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create account.');
      setLoading(false);
    }
  };

  // Sign Up Doctor Handler - Strictly relies on Supabase Auth
  const handleSignUpDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (doctorPassword !== doctorConfirmPassword) {
      setErrorMsg(t.authPasswordsDoNotMatch || 'Passwords do not match.');
      return;
    }
    if (doctorPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (!licenseNumber.trim()) {
      setErrorMsg(t.authLicenseRequired || 'Medical License Number is required.');
      return;
    }

    setLoading(true);
    const cleanUser = normalizeUsername(doctorUsername);
    const cleanEmail = doctorEmail.trim().toLowerCase();
    const spec = SPECIALIZATIONS.find((s) => s.id === specialtyId);
    const specName = spec ? spec.name : 'General Physician';

    const docVerif: VerificationDocument = {
      id: `verif-${Date.now()}`,
      title: 'Medical Board License Certificate',
      type: 'medical_license',
      fileName: `License_${licenseNumber.trim().replace(/\s+/g, '_')}.pdf`,
      fileSize: '2.4 MB',
      uploadedAt: new Date().toISOString().split('T')[0],
      previewNote: 'Submitted for verification board review.',
    };

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: doctorPassword,
        options: {
          data: {
            username: cleanUser,
            role: 'doctor',
            realName: doctorRealName.trim() || undefined,
            showRealName,
            specialty: specName,
            specializationId: specialtyId,
            medicalLicenseNumber: licenseNumber.trim(),
            hospitalOrClinic: hospitalClinic.trim() || 'General Clinic',
            verificationStatus: 'pending',
          },
        },
      });

      if (error) {
        setErrorMsg(error.message || 'Failed to register doctor.');
        setLoading(false);
        return;
      }

      if (!data?.user) {
        setErrorMsg('Doctor registration failed: No user account returned from server.');
        setLoading(false);
        return;
      }

      const u = data.user;
      const userMeta = u.user_metadata || {};
      const newDoctor: UserAccount = {
        id: u.id,
        username: userMeta.username || cleanUser,
        email: u.email || cleanEmail,
        role: 'doctor',
        realName: doctorRealName.trim() || undefined,
        showRealName,
        specialty: specName,
        specializationId: specialtyId,
        verificationStatus: 'pending',
        medicalLicenseNumber: licenseNumber.trim(),
        hospitalOrClinic: hospitalClinic.trim() || 'General Health Clinic',
        verificationDocuments: [docVerif],
        lastLoginDate: new Date().toISOString(),
        isDeactivatedInactive: false,
        moderationStatus: 'active',
        followingDoctorIds: [],
      };

      if (onRegisterDoctor) {
        onRegisterDoctor(newDoctor, {
          experienceYears: 5,
          about: `${doctorRealName || cleanUser}, specialized in ${specName}.`,
          education: 'Faculty of Medicine',
        });
      }

      if (data.session) {
        onAuthSuccess(newDoctor);
        setInfoMsg(t.authDoctorPendingNotice || 'Doctor account submitted for review.');
        setTimeout(() => {
          setLoading(false);
          onClose();
        }, 1200);
      } else {
        setInfoMsg('Doctor account registered! Please check your email to confirm registration before signing in.');
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Doctor registration failed.');
      setLoading(false);
    }
  };

  // Forgot Password Handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const email = forgotEmail.trim().toLowerCase();
    if (!email) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (error) {
        setErrorMsg(error.message || 'Failed to send password reset email.');
      } else {
        setResetCodeSent(true);
        setInfoMsg(`Verification and password reset link sent to ${email}. Sender: Istichary.`);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to send password reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
    >
      <div
        id="auth-modal-container"
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Stethoscope size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t.appName || 'Istichary'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isMandatory ? 'Sign in required to access consultations' : 'Secure Medical Portal'}
              </p>
            </div>
          </div>

          {!isMandatory && (
            <button
              id="auth-modal-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-semibold gap-1">
          <button
            id="tab-btn-signin"
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setErrorMsg('');
              setInfoMsg('');
            }}
            className={`flex-1 py-2 rounded-xl transition ${
              activeTab === 'signin'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {t.signIn || 'Sign In'}
          </button>
          <button
            id="tab-btn-signup-patient"
            type="button"
            onClick={() => {
              setActiveTab('signup_patient');
              setErrorMsg('');
              setInfoMsg('');
            }}
            className={`flex-1 py-2 rounded-xl transition ${
              activeTab === 'signup_patient'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {t.signUpAsPatient || 'Patient Sign Up'}
          </button>
          <button
            id="tab-btn-signup-doctor"
            type="button"
            onClick={() => {
              setActiveTab('signup_doctor');
              setErrorMsg('');
              setInfoMsg('');
            }}
            className={`flex-1 py-2 rounded-xl transition ${
              activeTab === 'signup_doctor'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {t.signUpAsDoctor || 'Doctor Sign Up'}
          </button>
        </div>

        {/* Notifications / Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* TAB 1: SIGN IN */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address or Username
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="signin-identifier"
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@example.com or @username"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t.password || 'Password'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('forgot_password');
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  {t.forgotPassword || 'Forgot Password?'}
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="signin-password"
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <button
              id="btn-submit-signin"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : t.signIn || 'Sign In'}
            </button>
          </form>
        )}

        {/* TAB 2: PATIENT SIGN UP */}
        {activeTab === 'signup_patient' && (
          <form onSubmit={handleSignUpPatient} className="space-y-3">
            <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900 text-xs text-sky-800 dark:text-sky-300">
              <p className="font-semibold">{t.noGenderPrivacyNotice || 'Privacy Notice'}</p>
              <p className="text-[11px] text-sky-600 dark:text-sky-400">
                {t.emailPrivateNotice || 'Your email remains strictly confidential and is never displayed publicly.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.username || 'Username'}
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="patient-signup-username"
                  type="text"
                  required
                  value={patientUsername}
                  onChange={(e) => setPatientUsername(e.target.value)}
                  placeholder="@your_username"
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.emailPrivate || 'Email Address'}
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="patient-signup-email"
                  type="email"
                  required
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.password || 'Password'}
                </label>
                <input
                  id="patient-signup-password"
                  type="password"
                  required
                  value={patientPassword}
                  onChange={(e) => setPatientPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.confirmPassword || 'Confirm'}
                </label>
                <input
                  id="patient-signup-confirm"
                  type="password"
                  required
                  value={patientConfirmPassword}
                  onChange={(e) => setPatientConfirmPassword(e.target.value)}
                  placeholder="Repeat"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <button
              id="btn-submit-signup-patient"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50 mt-1"
            >
              {loading ? 'Creating Account...' : 'Create Patient Account'}
            </button>
          </form>
        )}

        {/* TAB 3: DOCTOR SIGN UP */}
        {activeTab === 'signup_doctor' && (
          <form onSubmit={handleSignUpDoctor} className="space-y-3">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
              <p className="font-semibold">{t.licenseVerificationNotice || 'Professional Verification'}</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                Doctor credentials are reviewed by administrators before being granted verified physician status.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Doctor Username
                </label>
                <input
                  id="doctor-signup-username"
                  type="text"
                  required
                  value={doctorUsername}
                  onChange={(e) => setDoctorUsername(e.target.value)}
                  placeholder="@dr_lastname"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Professional Email
                </label>
                <input
                  id="doctor-signup-email"
                  type="email"
                  required
                  value={doctorEmail}
                  onChange={(e) => setDoctorEmail(e.target.value)}
                  placeholder="doctor@clinic.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.doctorSpecialtyMandatory || 'Medical Specialty (Mandatory)'}
              </label>
              <select
                id="doctor-signup-specialty"
                value={specialtyId}
                onChange={(e) => setSpecialtyId(e.target.value as SpecializationId)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {SPECIALIZATIONS.filter((s) => s.id !== 'all').map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.medicalLicenseNumber || 'License Number'}
                </label>
                <input
                  id="doctor-signup-license"
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="MD-XXXX-XXXX"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hospital or Clinic
                </label>
                <input
                  id="doctor-signup-hospital"
                  type="text"
                  value={hospitalClinic}
                  onChange={(e) => setHospitalClinic(e.target.value)}
                  placeholder="Medical Center"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <input
                  id="doctor-signup-password"
                  type="password"
                  required
                  value={doctorPassword}
                  onChange={(e) => setDoctorPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password
                </label>
                <input
                  id="doctor-signup-confirm"
                  type="password"
                  required
                  value={doctorConfirmPassword}
                  onChange={(e) => setDoctorConfirmPassword(e.target.value)}
                  placeholder="Repeat"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <button
              id="btn-submit-signup-doctor"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50 mt-1"
            >
              {loading ? 'Submitting Registration...' : 'Submit Doctor Registration'}
            </button>
          </form>
        )}

        {/* TAB 4: FORGOT PASSWORD */}
        {activeTab === 'forgot_password' && (
          <div className="space-y-4">
            <form onSubmit={handleForgotPassword} className="space-y-3.5">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Enter your registered email address to receive an official verification link and password reset instructions directly from Istichary.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="forgot-password-email-input"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <button
                id="btn-send-reset-link"
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Sending Verification Link...' : 'Send Verification & Reset Link'}
              </button>
            </form>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('signin')}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold cursor-pointer"
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
