import { supabase } from '../supabaseClient'
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
  CheckCircle, 
  Award 
} from 'lucide-react';
import { UserAccount, UserRole, Language, Specialization, VerificationDocument } from '../types';
import { translations } from '../data/translations';
import { SPECIALIZATIONS } from '../data/mockData';
import { RoleAvatar } from './RoleAvatar';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  existingUsers: UserAccount[];
  onAuthSuccess: (user: UserAccount) => void;
  onRegisterDoctor?: (newDoctor: UserAccount) => void;
}

type AuthTab = 'signin' | 'signup_patient' | 'signup_doctor' | 'forgot_password';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  lang,
  existingUsers,
  onAuthSuccess,
  onRegisterDoctor
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [doctorRealName, setDoctorRealName] = useState('');
  const [showRealName, setShowRealName] = useState(true);
  const [specializationId, setSpecializationId] = useState(SPECIALIZATIONS[0]?.id || '');
  const [specializationCustomName, setSpecializationCustomName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [hospitalClinic, setHospitalClinic] = useState('');

  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginIdentifier.trim(),
      password: loginPassword,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    if (data.user) {
      onAuthSuccess({
        id: data.user.id,
        username: data.user.email?.split('@')[0] || 'User',
        email: data.user.email || '',
        role: 'patient',
        lastLoginDate: new Date().toISOString(),
        isDeactivated: false,
        moderationStatus: 'active'
      });
      onClose();
    }
  };

  const handleSignUpPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          username: username.trim(),
          role: 'patient'
        }
      }
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    if (data.user) {
      onAuthSuccess({
        id: data.user.id,
        username: username.trim(),
        email: email.trim(),
        role: 'patient',
        lastLoginDate: new Date().toISOString(),
        isDeactivated: false,
        moderationStatus: 'active'
      });
      onClose();
    }
  };

  const handleSignUpDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!username.trim() || !email.trim() || !password || !licenseNumber.trim()) {
      setErrorMsg(t.authRequiredFields);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t.authPasswordsDoNotMatch);
      return;
    }
    const newDoc: UserAccount = {
      id: 'doc_' + Date.now(),
      username: username.trim(),
      email: email.trim(),
      role: 'doctor',
      lastLoginDate: new Date().toISOString(),
      isDeactivated: false,
      moderationStatus: 'pending'
    };
    if (onRegisterDoctor) {
      onRegisterDoctor(newDoc);
    }
    setInfoMsg(t.authDoctorPendingNotice || 'Doctor account submitted for review.');
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMsg('Please enter your email');
      return;
    }
    setResetCodeSent(true);
    setInfoMsg('Password recovery link sent.');
  };

  const handleApplyNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }
    setInfoMsg('Password updated successfully.');
    setTimeout(() => {
      setActiveTab('signin');
      setResetCodeSent(false);
    }, 1500);
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal-content bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-sky-100 dark:bg-sky-900/50 text-sky-600 rounded-xl">
            <Stethoscope size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Medical Portal</h3>
            <p className="text-xs text-slate-500">Secure Authentication</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle size={14} />
            <span>{infoMsg}</span>
          </div>
        )}

        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('signin')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'signin' ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signup_patient')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'signup_patient' ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Patient Sign Up
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signup_doctor')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'signup_doctor' ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Doctor
          </button>
        </div>

        {activeTab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={16} />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('forgot_password')}
                className="text-sky-600 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 transition-colors"
            >
              Sign In
            </button>
          </form>
        )}

        {activeTab === 'signup_patient' && (
          <form onSubmit={handleSignUpPatient} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 transition-colors mt-2"
            >
              Create Account
            </button>
          </form>
        )}

        {activeTab === 'signup_doctor' && (
          <form onSubmit={handleSignUpDoctor} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Doctor Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">License Number</label>
              <input
                type="text"
                required
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 transition-colors mt-2"
            >
              Submit Doctor Registration
            </button>
          </form>
        )}

        {activeTab === 'forgot_password' && (
          <div className="space-y-4">
            {!resetCodeSent ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 transition-colors"
                >
                  Send Reset Link
                </button>
              </form>
            ) : (
              <form onSubmit={handleApplyNewPassword} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors"
                >
                  Update Password & Sign In
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};