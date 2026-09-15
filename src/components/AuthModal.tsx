import React, { useState, useEffect } from 'react';
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
  RefreshCw,
} from 'lucide-react';
import { UserAccount, Language, SpecializationId, VerificationDocument } from '../types';
import { translations } from '../i18n/translations';
import { SPECIALIZATIONS } from '../data/mockData';
import { saveUserToSupabase } from '../utils/supabaseSync';
import { getVercelRedirectUrl } from '../utils/adminLink';

interface AuthModalProps {
  isOpen: boolean;
  isMandatory?: boolean;
  initialTab?: AuthTab;
  onClose: () => void;
  lang: Language;
  existingUsers: UserAccount[];
  onAuthSuccess: (user: UserAccount) => void;
  onRegisterDoctor?: (
    newDocUser: UserAccount,
    docDetails: { experienceYears: number; about: string; education: string }
  ) => void;
}

export type AuthTab = 'signin' | 'signup_patient' | 'signup_doctor' | 'forgot_password' | 'update_password' | 'verify_otp';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  isMandatory = false,
  initialTab = 'signin',
  onClose,
  lang,
  existingUsers,
  onAuthSuccess,
  onRegisterDoctor,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync activeTab if initialTab changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Keep errorMsg and infoMsg clean when modal opens or active tab switches
  useEffect(() => {
    setErrorMsg('');
    setInfoMsg('');
  }, [isOpen, activeTab]);

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

  // Forgot password & Set new password
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // 6-digit OTP verification state
  const [otpCode, setOtpCode] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpPurpose, setOtpPurpose] = useState<'signup' | 'recovery'>('recovery');
  const [pendingSignupUser, setPendingSignupUser] = useState<UserAccount | null>(null);

  if (!isOpen) return null;

  const normalizeUsername = (val: string) => {
    let clean = val.trim().toLowerCase().replace(/\s+/g, '_');
    if (!clean.startsWith('@')) {
      clean = '@' + clean;
    }
    return clean;
  };

  /**
   * Helper to format authentication errors with clear, user-friendly diagnostics.
   * Completely avoids intrusive network connection warnings to keep the form clean.
   */
  const formatAuthError = (error: any, fallbackMessage: string = 'Authentication error.'): string => {
    if (!error) return '';
    const msg = typeof error === 'string' ? error : error.message || '';
    const lower = msg.toLowerCase();
    
    // Ignore low-level network/fetch errors to keep the interface clean and quiet
    if (
      lower.includes('failed to fetch') ||
      lower.includes('network') ||
      lower.includes('connection') ||
      lower.includes('load failed') ||
      error.status === 0 ||
      error.name === 'AuthRetryableFetchError'
    ) {
      return '';
    }

    if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
      return 'Invalid email or password. Please check your credentials or create a new account.';
    }
    if (lower.includes('email not confirmed')) {
      return 'Email not confirmed yet. Please verify your email inbox to activate your account.';
    }
    if (lower.includes('already registered') || lower.includes('already exists')) {
      return 'An account with this email already exists. Please switch to the Sign In tab.';
    }
    if (lower.includes('at least 6 characters')) {
      return 'Password must be at least 6 characters long.';
    }
    return msg || fallbackMessage;
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
      // Authenticate directly with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: pass,
      });

      // Handle authentication failure - immediately log and display exact failure reason
      if (error) {
        console.error('Supabase sign-in error:', error);
        setErrorMsg(error.message || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      if (!data?.user) {
        setErrorMsg('Authentication failed: No user returned.');
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

      // Ensure user entry is saved in Supabase public.users
      saveUserToSupabase(signedInUser).catch(() => {});

      onAuthSuccess(signedInUser);
      setLoading(false);
      onClose();
    } catch (err: any) {
      console.error('Sign-in unexpected exception:', err);
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
        const formatted = formatAuthError(error, 'Failed to create patient account.');
        if (formatted) setErrorMsg(formatted);
        setLoading(false);
        return;
      }

      if (!data?.user) {
        setErrorMsg('Sign up failed: No user account returned.');
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

      // Persist directly into Supabase public.users
      await saveUserToSupabase(newPatient);

      if (data.session) {
        onAuthSuccess(newPatient);
        setInfoMsg('Account created and signed in successfully!');
        setTimeout(() => {
          setLoading(false);
          onClose();
        }, 800);
      } else {
        const redirectUrl = getVercelRedirectUrl();
        await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            emailRedirectTo: redirectUrl,
            shouldCreateUser: false,
          },
        }).catch(() => {});

        setPendingSignupUser(newPatient);
        setOtpEmail(cleanEmail);
        setOtpPurpose('signup');
        setOtpCode('');
        setActiveTab('verify_otp');
        setInfoMsg(
          lang === 'ar'
            ? `تم إرسال رمز التحقق المكون من 6 أرقام إلى ${cleanEmail}. يرجى إدخال الرمز لتفعيل الحساب.`
            : `A 6-digit verification code has been sent to ${cleanEmail}. Please enter the code below to activate your account.`
        );
        setLoading(false);
      }
    } catch (err: any) {
      const formatted = formatAuthError(err, '');
      if (formatted) setErrorMsg(formatted);
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
      setErrorMsg(t.authPasswordTooShort || 'Password must be at least 6 characters.');
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
        const formatted = formatAuthError(error, 'Failed to register doctor.');
        if (formatted) setErrorMsg(formatted);
        setLoading(false);
        return;
      }

      if (!data?.user) {
        setErrorMsg('Doctor registration failed: No user account returned.');
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

      // Persist doctor directly into Supabase public.users
      await saveUserToSupabase(newDoctor);

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
        const redirectUrl = getVercelRedirectUrl();
        await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            emailRedirectTo: redirectUrl,
            shouldCreateUser: false,
          },
        }).catch(() => {});

        setPendingSignupUser(newDoctor);
        setOtpEmail(cleanEmail);
        setOtpPurpose('signup');
        setOtpCode('');
        setActiveTab('verify_otp');
        setInfoMsg(
          lang === 'ar'
            ? `تم إرسال رمز التحقق المكون من 6 أرقام إلى ${cleanEmail}. يرجى إدخال الرمز لتأكيد بريدك الإلكتروني.`
            : `A 6-digit verification code has been sent to ${cleanEmail}. Please enter the code below to activate your doctor account.`
        );
        setLoading(false);
      }
    } catch (err: any) {
      const formatted = formatAuthError(err, '');
      if (formatted) setErrorMsg(formatted);
      setLoading(false);
    }
  };

  // Resend 6-digit OTP verification code
  const handleResendOtp = async (targetEmail: string, purpose: 'recovery' | 'signup') => {
    if (!targetEmail) return;
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    try {
      const redirectUrl = getVercelRedirectUrl();
      const { error } = await supabase.auth.signInWithOtp({
        email: targetEmail,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: purpose === 'signup',
        },
      });

      if (error) {
        setErrorMsg(formatAuthError(error, 'Failed to resend verification code.'));
      } else {
        setInfoMsg(
          lang === 'ar'
            ? `تم إرسال رمز تحقق جديد (6 أرقام) إلى ${targetEmail}.`
            : `A new 6-digit verification code has been sent to ${targetEmail}.`
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Handler - Dispatches 6-digit OTP verification code via Supabase
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const email = forgotEmail.trim().toLowerCase();
    if (!email) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى إدخال عنوان بريدك الإلكتروني المسجل.'
          : 'Please enter your registered email address.'
      );
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = getVercelRedirectUrl();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: false,
        },
      });

      if (error) {
        setErrorMsg(formatAuthError(error, 'Failed to send verification code.'));
      } else {
        setResetCodeSent(true);
        setOtpEmail(email);
        setOtpPurpose('recovery');
        setOtpCode('');
        setInfoMsg(
          lang === 'ar'
            ? `تم إرسال رمز التحقق (6 أرقام) إلى ${email}. يرجى إدخال الرمز أدناه لتأكيد الهوية.`
            : lang === 'fr'
            ? `Un code de vérification à 6 chiffres a été envoyé à ${email}. Veuillez entrer le code ci-dessous.`
            : `A 6-digit verification code has been sent to ${email}. Please enter the code below.`
        );
      }
    } catch (err: any) {
      setErrorMsg(formatAuthError(err, 'Failed to send verification code.'));
    } finally {
      setLoading(false);
    }
  };

  // Verify Recovery OTP & Reset Password
  const handleVerifyRecoveryOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const cleanCode = otpCode.trim();
    const email = (otpEmail || forgotEmail).trim().toLowerCase();

    if (!cleanCode || cleanCode.length < 6) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى إدخال رمز التحقق المكون من 6 أرقام كاملاً.'
          : 'Please enter the complete 6-digit verification code.'
      );
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setErrorMsg(
        lang === 'ar'
          ? 'يجب ألا تقل كلمة المرور الجديدة عن 6 أحرف.'
          : 'New password must be at least 6 characters.'
      );
      return;
    }

    if (newPassword && newPassword !== confirmNewPassword) {
      setErrorMsg(t.authPasswordsDoNotMatch || 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify 6-digit OTP with Supabase verifyOtp explicitly using type: 'email'
      let verifyRes = await supabase.auth.verifyOtp({
        email,
        token: cleanCode,
        type: 'email',
      });

      if (verifyRes.error) {
        const fallbackRes = await supabase.auth.verifyOtp({
          email,
          token: cleanCode,
          type: 'recovery',
        });
        if (!fallbackRes.error) {
          verifyRes = fallbackRes;
        }
      }

      if (verifyRes.error) {
        setErrorMsg(
          formatAuthError(
            verifyRes.error,
            lang === 'ar'
              ? 'رمز التحقق غير صحيح أو انتهت صلاحيته. يرجى التحقق من الرمز أو طلب رمز جديد.'
              : 'Invalid or expired verification code. Please check your email or request a new code.'
          )
        );
        setLoading(false);
        return;
      }

      // 2. Active session is now verified, update user password if provided
      if (newPassword.trim()) {
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) {
          setErrorMsg(formatAuthError(updateError, 'Failed to update password.'));
          setLoading(false);
          return;
        }
      }

      setInfoMsg(
        newPassword.trim()
          ? (lang === 'ar'
              ? 'تم التحقق بنجاح وتحديث كلمة المرور! تم تسجيل دخولك.'
              : 'Password reset successfully! You are now logged in.')
          : (lang === 'ar'
              ? 'تم التحقق من الرمز بنجاح! تم تسجيل دخولك.'
              : 'Verification code confirmed! You are now logged in.')
      );

      const u = verifyRes.data?.user;
      if (u) {
        const userMeta = u.user_metadata || {};
        const signedInUser: UserAccount = {
          id: u.id,
          username: userMeta.username || normalizeUsername(u.email?.split('@')[0] || 'user'),
          email: u.email || email,
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
          verificationStatus: userMeta.verificationStatus,
        };
        saveUserToSupabase(signedInUser).catch(() => {});
        onAuthSuccess(signedInUser);
      }

      setNewPassword('');
      setConfirmNewPassword('');
      setOtpCode('');
      setResetCodeSent(false);

      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to verify code.');
      setLoading(false);
    }
  };

  // Verify 6-digit OTP code for Email Sign-Up
  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const cleanCode = otpCode.trim();
    const email = (otpEmail || patientEmail || doctorEmail).trim().toLowerCase();

    if (!cleanCode || cleanCode.length < 6) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى إدخال رمز التحقق المكون من 6 أرقام كاملاً.'
          : 'Please enter the complete 6-digit verification code.'
      );
      return;
    }

    setLoading(true);
    try {
      let verifyRes = await supabase.auth.verifyOtp({
        email,
        token: cleanCode,
        type: 'email',
      });

      if (verifyRes.error) {
        const fallbackRes = await supabase.auth.verifyOtp({
          email,
          token: cleanCode,
          type: 'signup',
        });
        if (!fallbackRes.error) {
          verifyRes = fallbackRes;
        }
      }

      if (verifyRes.error) {
        setErrorMsg(
          formatAuthError(
            verifyRes.error,
            lang === 'ar'
              ? 'رمز التحقق غير صحيح أو انتهت صلاحيته. يرجى التأكد من الرمز أو طلب رمز جديد.'
              : 'Invalid or expired verification code. Please check your email or request a new code.'
          )
        );
        setLoading(false);
        return;
      }

      const u = verifyRes.data?.user;
      const userMeta = u?.user_metadata || {};
      const verifiedUser: UserAccount = pendingSignupUser || {
        id: u?.id || `user-${Date.now()}`,
        username: userMeta.username || normalizeUsername(email.split('@')[0]),
        email: u?.email || email,
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

      await saveUserToSupabase(verifiedUser);
      onAuthSuccess(verifiedUser);

      setInfoMsg(
        lang === 'ar'
          ? 'تم التحقق من حسابك وتفعيله بنجاح! تم تسجيل الدخول.'
          : 'Your account has been verified and activated successfully! You are now signed in.'
      );

      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Verification failed.');
      setLoading(false);
    }
  };

  // Set New Password Handler (triggered after user verifies recovery or enters recovery state)
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (newPassword !== confirmNewPassword) {
      setErrorMsg(t.authPasswordsDoNotMatch || 'Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      // If otpCode is entered, verify OTP first with type: 'email'
      if (otpCode.trim().length === 6 && (forgotEmail || otpEmail)) {
        const email = (forgotEmail || otpEmail).trim().toLowerCase();
        let verifyRes = await supabase.auth.verifyOtp({
          email,
          token: otpCode.trim(),
          type: 'email',
        });
        if (verifyRes.error) {
          verifyRes = await supabase.auth.verifyOtp({
            email,
            token: otpCode.trim(),
            type: 'recovery',
          });
        }
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setErrorMsg(formatAuthError(error, 'Failed to update password.'));
        setLoading(false);
        return;
      }

      setInfoMsg('Your password has been reset successfully! You can now sign in with your new password.');
      setNewPassword('');
      setConfirmNewPassword('');
      setOtpCode('');
      // Clean up recovery hash parameters from address bar
      if (typeof window !== 'undefined' && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      setTimeout(() => {
        setActiveTab('signin');
        setLoading(false);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update password.');
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
          {activeTab === 'verify_otp' && (
            <button
              id="tab-btn-verify-otp"
              type="button"
              className="flex-1 py-2 rounded-xl transition bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm font-bold"
            >
              {lang === 'ar' ? 'تأكيد الرمز' : 'Verify Code'}
            </button>
          )}
          {activeTab === 'update_password' && (
            <button
              id="tab-btn-update-password"
              type="button"
              className="flex-1 py-2 rounded-xl transition bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm font-bold"
            >
              Reset Password
            </button>
          )}
        </div>

        {/* Notifications / Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="leading-relaxed flex-1">{errorMsg}</span>
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

            {otpEmail && errorMsg && (errorMsg.toLowerCase().includes('not confirmed') || errorMsg.includes('غير مؤكد')) && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('verify_otp');
                  handleResendOtp(otpEmail, 'signup');
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-semibold hover:bg-sky-100 dark:hover:bg-sky-900/60 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShieldCheck size={15} />
                <span>{lang === 'ar' ? 'إدخال رمز التحقق (6 أرقام) لتفعيل الحساب' : 'Enter 6-digit OTP code to verify account'}</span>
              </button>
            )}
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

        {/* TAB 4: FORGOT PASSWORD & 6-DIGIT OTP RECOVERY */}
        {activeTab === 'forgot_password' && (
          <div className="space-y-4">
            {!resetCodeSent ? (
              <form onSubmit={handleForgotPassword} className="space-y-3.5">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {lang === 'ar'
                    ? 'أدخل بريدك الإلكتروني المسجل لتلقي رمز التحقق المكون من 6 أرقام (OTP) لإعادة تعيين كلمة المرور بشكل فوري دون الحاجة إلى روابط خارجية.'
                    : lang === 'fr'
                    ? 'Entrez votre adresse e-mail pour recevoir un code de vérification à 6 chiffres (OTP) afin de réinitialiser votre mot de passe en toute sécurité.'
                    : 'Enter your registered email address to receive a secure 6-digit verification code (OTP) to reset your password directly.'}
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.email || 'Email Address'}
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
                  {loading
                    ? (lang === 'ar' ? 'جارٍ إرسال رمز التحقق...' : 'Sending Verification Code...')
                    : (lang === 'ar' ? 'إرسال رمز التحقق (OTP)' : 'Send 6-Digit Verification Code')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyRecoveryOtp} className="space-y-3.5">
                <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900 rounded-2xl text-xs text-sky-800 dark:text-sky-300 flex items-start gap-2.5">
                  <ShieldCheck size={18} className="shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold block">
                      {lang === 'ar' ? 'تم إرسال رمز التحقق (OTP)' : '6-Digit Code Sent'}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 block">
                      {lang === 'ar'
                        ? `تم إرسال الرمز المكون من 6 أرقام إلى ${forgotEmail}. أدخل الرمز وكلمة المرور الجديدة.`
                        : `We sent a 6-digit code to ${forgotEmail}. Enter it below with your new password.`}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'رمز التحقق (6 أرقام)' : '6-Digit Verification Code (OTP)'}
                  </label>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="forgot-password-otp-input"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm tracking-[0.25em] font-mono text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="forgot-password-new-password"
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="forgot-password-confirm-password"
                      type="password"
                      required
                      minLength={6}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <button
                  id="btn-verify-reset-password"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {loading
                    ? (lang === 'ar' ? 'جارٍ التحقق وتحديث كلمة المرور...' : 'Verifying & Updating Password...')
                    : (lang === 'ar' ? 'تأكيد الرمز وتحديث كلمة المرور' : 'Confirm Code & Reset Password')}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => handleResendOtp(forgotEmail, 'recovery')}
                    disabled={loading}
                    className="text-sky-600 dark:text-sky-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    <span>{lang === 'ar' ? 'إعادة إرسال الرمز' : 'Resend Code'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setResetCodeSent(false);
                      setOtpCode('');
                    }}
                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold cursor-pointer"
                  >
                    {lang === 'ar' ? 'تغيير البريد الإلكتروني' : 'Change Email'}
                  </button>
                </div>
              </form>
            )}

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setResetCodeSent(false);
                  setOtpCode('');
                }}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: DEDICATED SIGN-UP OTP VERIFICATION */}
        {activeTab === 'verify_otp' && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
              <ShieldCheck size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">
                  {lang === 'ar' ? 'تأكيد الحساب برمز التحقق' : 'Account Verification Code'}
                </span>
                <span className="text-slate-600 dark:text-slate-300 block">
                  {lang === 'ar'
                    ? `أدخل رمز التحقق (6 أرقام) المرسل إلى ${otpEmail || patientEmail || doctorEmail}`
                    : `Enter the 6-digit code sent to ${otpEmail || patientEmail || doctorEmail}`}
                </span>
              </div>
            </div>

            <form onSubmit={handleVerifySignupOtp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'رمز التحقق (6 أرقام)' : '6-Digit Verification Code (OTP)'}
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="signup-otp-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm tracking-[0.25em] font-mono text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                id="btn-submit-signup-otp"
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {loading
                  ? (lang === 'ar' ? 'جارٍ التحقق وتفعيل الحساب...' : 'Verifying & Activating Account...')
                  : (lang === 'ar' ? 'تأكيد الرمز وتفعيل الحساب' : 'Verify Code & Activate Account')}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => handleResendOtp(otpEmail || patientEmail || doctorEmail, 'signup')}
                  disabled={loading}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                  <span>{lang === 'ar' ? 'إعادة إرسال الرمز' : 'Resend Code'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin');
                    setOtpCode('');
                  }}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold cursor-pointer"
                >
                  {lang === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 5: UPDATE PASSWORD (TRIGGERED VIA EMAIL RECOVERY LINK) */}
        {activeTab === 'update_password' && (
          <div className="space-y-4">
            <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900 rounded-2xl text-xs text-sky-800 dark:text-sky-300 flex items-start gap-2.5">
              <KeyRound size={18} className="shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" />
              <div>
                <span className="font-bold block">Password Recovery Verified</span>
                <span className="text-slate-600 dark:text-slate-300">
                  Please create a strong new password for your Istichary account.
                </span>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="update-password-new-input"
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="update-password-confirm-input"
                    type="password"
                    required
                    minLength={6}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <button
                id="btn-submit-new-password"
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
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
