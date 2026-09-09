/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Wifi,
  Battery,
  Signal,
  Sparkles,
  Smartphone,
  Maximize2,
  CheckCircle2,
  ArrowLeftRight,
  AlertTriangle,
} from 'lucide-react';
import {
  SpecializationId,
  DoctorProfile,
  Appointment,
  ConsultationPost,
  ConsultationType,
  UserAccount,
  Language,
  ThemeMode,
} from './types';
import {
  SPECIALIZATIONS,
  DOCTOR_PROFILES,
  MOCK_CONSULTATIONS,
  MOCK_APPOINTMENTS,
  MOCK_USERS,
  mockPatientUser,
  mockDoctorUser,
} from './data/mockData';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { DoctorCard } from './components/DoctorCard';
import { DoctorModal } from './components/DoctorModal';
import { BottomNav, NavTab } from './components/BottomNav';
import { PublicConsultationsView } from './components/PublicConsultationsView';
import { DoctorsNearYouView } from './components/DoctorsNearYouView';
import { AppointmentsView } from './components/AppointmentsView';
import { ProfileView } from './components/ProfileView';
import { AuthModal } from './components/AuthModal';
import { EmergencyModal } from './components/EmergencyModal';
import { VideoCallModal } from './components/VideoCallModal';
import { evaluateContent } from './utils/moderation';
import { translations } from './i18n/translations';

export default function App() {
  // Multilingual & Theme
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<ThemeMode>('light');

  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Authentication State
  const [users, setUsers] = useState<UserAccount[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(mockPatientUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Search and Filter State for Home
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<SpecializationId>('all');
  const [availableTodayOnly, setAvailableTodayOnly] = useState(false);
  const [topRatedOnly, setTopRatedOnly] = useState(false);

  // Doctors & Consultations State
  const [doctors, setDoctors] = useState<DoctorProfile[]>(DOCTOR_PROFILES);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [consultations, setConsultations] = useState<ConsultationPost[]>(MOCK_CONSULTATIONS);
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);

  // Emergency & Video Call Modals
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [activeCallAppointment, setActiveCallAppointment] = useState<Appointment | null>(null);

  // Responsive Frame toggle for desktop preview
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  // Toast alert
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = translations[lang];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync HTML direction attribute for Arabic (RTL)
  useEffect(() => {
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [lang]);

  // Sync Dark class to document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Filtered Doctors for Home view
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      // Specialization
      if (selectedSpecialization !== 'all' && doc.specializationId !== selectedSpecialization) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesUsername = doc.username.toLowerCase().includes(q);
        const matchesRealName = doc.realName ? doc.realName.toLowerCase().includes(q) : false;
        const matchesSpecialty = doc.specialty.toLowerCase().includes(q);
        const matchesClinic = doc.clinicName.toLowerCase().includes(q);
        const matchesCity = doc.clinicCity.toLowerCase().includes(q);
        const matchesServices = doc.services.some((s) => s.toLowerCase().includes(q));

        if (
          !matchesUsername &&
          !matchesRealName &&
          !matchesSpecialty &&
          !matchesClinic &&
          !matchesCity &&
          !matchesServices
        ) {
          return false;
        }
      }

      // Available today
      if (availableTodayOnly && !doc.isAvailableToday) {
        return false;
      }

      // Top-rated 4.9+
      if (topRatedOnly && doc.rating < 4.9) {
        return false;
      }

      return true;
    });
  }, [doctors, selectedSpecialization, searchQuery, availableTodayOnly, topRatedOnly]);

  // Auth Handlers
  const handleLogin = (user: UserAccount) => {
    // Check 12-month inactivity policy
    const lastLogin = new Date(user.lastLoginDate).getTime();
    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;

    if (lastLogin < oneYearAgo || user.isDeactivatedInactive) {
      showToast(t.accountDeactivatedInactive);
      return;
    }

    // Refresh lastLoginDate
    const updatedUser: UserAccount = {
      ...user,
      lastLoginDate: new Date().toISOString(),
      isDeactivatedInactive: false,
    };

    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    setIsAuthModalOpen(false);
    showToast(`Signed in as ${updatedUser.username}`);
  };

  const handleSignUpPatient = (newPatient: UserAccount) => {
    setUsers((prev) => [...prev, newPatient]);
    setCurrentUser(newPatient);
    setIsAuthModalOpen(false);
    showToast(`Welcome, ${newPatient.username}! Patient account created.`);
  };

  const handleSignUpDoctor = (newDocUser: UserAccount, docProfile: DoctorProfile) => {
    setUsers((prev) => [...prev, newDocUser]);
    setDoctors((prev) => [...prev, docProfile]);
    setCurrentUser(newDocUser);
    setIsAuthModalOpen(false);
    showToast(`Doctor account registered: ${docProfile.username}. Verification pending.`);
  };

  const handlePasswordReset = (email: string) => {
    showToast(`${t.resetEmailSent} (${email})`);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    showToast('Signed out successfully.');
  };

  const handleDeleteAccount = (password: string): boolean => {
    if (!currentUser) return false;

    // Check password if set
    if (currentUser.password && currentUser.password !== password) {
      return false;
    }

    const userId = currentUser.id;
    // Purge account from registered users
    setUsers((prev) => prev.filter((u) => u.id !== userId));

    // If doctor, remove from doctor directory
    if (currentUser.role === 'doctor') {
      setDoctors((prev) => prev.filter((d) => d.userId !== userId));
    }

    // Mark author as deleted in public consultations
    setConsultations((prev) =>
      prev.map((c) =>
        c.authorId === userId
          ? {
              ...c,
              authorUsername: '[Account Deleted]',
              isClosed: true,
            }
          : c
      )
    );

    setCurrentUser(null);
    showToast(t.accountDeletedSuccess);
    return true;
  };

  const handleUpdateDoctorClinic = (
    clinicName: string,
    clinicAddress: string,
    clinicCity: string
  ) => {
    if (!currentUser || currentUser.role !== 'doctor') return;

    const updatedUser: UserAccount = {
      ...currentUser,
      clinicName,
      clinicAddress,
      clinicCity,
    };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

    // Also update doctors array
    setDoctors((prev) =>
      prev.map((d) =>
        d.userId === updatedUser.id
          ? {
              ...d,
              clinicName,
              clinicAddress,
              clinicCity,
            }
          : d
      )
    );

    showToast('Doctor practice location updated!');
  };

  const handleToggleRealName = (show: boolean) => {
    if (!currentUser) return;
    const updated = { ...currentUser, showRealName: show };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));

    setDoctors((prev) =>
      prev.map((d) => (d.userId === updated.id ? { ...d, showRealName: show } : d))
    );
  };

  // Test simulation: Set account inactive for 14 months to test cleanup
  const handleSimulateInactivity = () => {
    if (!currentUser) return;
    const fourteenMonthsAgo = new Date(Date.now() - 420 * 24 * 60 * 60 * 1000).toISOString();
    const deactivatedUser: UserAccount = {
      ...currentUser,
      lastLoginDate: fourteenMonthsAgo,
      isDeactivatedInactive: true,
    };

    setUsers((prev) => prev.map((u) => (u.id === deactivatedUser.id ? deactivatedUser : u)));
    setCurrentUser(null);
    showToast('Account simulated as 14-month inactive. Auto-deactivation triggered.');
  };

  // Reset moderation penalty for testing
  const handleClearModerationPenalty = () => {
    if (!currentUser) return;
    const resetUser: UserAccount = {
      ...currentUser,
      moderationStatus: 'active',
      restrictionExpiresAt: undefined,
      penaltyReason: undefined,
    };
    setCurrentUser(resetUser);
    setUsers((prev) => prev.map((u) => (u.id === resetUser.id ? resetUser : u)));
    showToast('Moderation penalty cleared.');
  };

  // Quick Account Switcher (Patient <-> Doctor)
  const handleQuickSwitchRole = () => {
    if (!currentUser || currentUser.role === 'patient') {
      setCurrentUser(mockDoctorUser);
      showToast('Switched to Verified Doctor mode: @dr_evelyn');
    } else {
      setCurrentUser(mockPatientUser);
      showToast('Switched to Patient mode: @sarah_k');
    }
  };

  // Consultation Post Creation with AI Moderation
  const handleCreateConsultation = (
    title: string,
    specializationId: SpecializationId,
    description: string,
    urgency: 'low' | 'medium' | 'high'
  ): boolean => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return false;
    }

    if (currentUser.moderationStatus === 'banned') {
      showToast(t.bannedAlertTitle);
      return false;
    }

    if (currentUser.moderationStatus === 'restricted_48h') {
      showToast(t.restrictedAlertTitle);
      return false;
    }

    // Run AI Moderation
    const moderation = evaluateContent(`${title} ${description}`);
    if (!moderation.allowed) {
      if (moderation.penaltyType === 'banned') {
        const bannedUser: UserAccount = {
          ...currentUser,
          moderationStatus: 'banned',
          penaltyReason: moderation.reason,
        };
        setCurrentUser(bannedUser);
        setUsers((prev) => prev.map((u) => (u.id === bannedUser.id ? bannedUser : u)));
        showToast(`AI Moderation: Instant Ban applied (${moderation.reason})`);
      } else if (moderation.penaltyType === 'restricted_48h') {
        const restrictedUser: UserAccount = {
          ...currentUser,
          moderationStatus: 'restricted_48h',
          penaltyReason: moderation.reason,
          restrictionExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        };
        setCurrentUser(restrictedUser);
        setUsers((prev) => prev.map((u) => (u.id === restrictedUser.id ? restrictedUser : u)));
        showToast(`AI Moderation: 48h Restriction applied (${moderation.reason})`);
      }
      return false;
    }

    const newPost: ConsultationPost = {
      id: `post-${Date.now()}`,
      authorId: currentUser.id,
      authorUsername: currentUser.username,
      authorRole: 'patient',
      title,
      specializationId,
      description,
      urgency,
      createdAt: 'Just now',
      comments: [],
    };

    setConsultations((prev) => [newPost, ...prev]);
    showToast('Consultation published! Verified specialists have been notified.');
    return true;
  };

  // Consultation Comment with AI Moderation
  const handleAddComment = (postId: string, content: string): boolean => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return false;
    }

    if (currentUser.moderationStatus === 'banned') {
      showToast(t.bannedAlertTitle);
      return false;
    }

    if (currentUser.moderationStatus === 'restricted_48h') {
      showToast(t.restrictedAlertTitle);
      return false;
    }

    // AI Moderation on comment
    const moderation = evaluateContent(content);
    if (!moderation.allowed) {
      if (moderation.penaltyType === 'banned') {
        const bannedUser: UserAccount = {
          ...currentUser,
          moderationStatus: 'banned',
          penaltyReason: moderation.reason,
        };
        setCurrentUser(bannedUser);
        setUsers((prev) => prev.map((u) => (u.id === bannedUser.id ? bannedUser : u)));
        showToast(`AI Moderation: Instant Ban applied (${moderation.reason})`);
      } else if (moderation.penaltyType === 'restricted_48h') {
        const restrictedUser: UserAccount = {
          ...currentUser,
          moderationStatus: 'restricted_48h',
          penaltyReason: moderation.reason,
          restrictionExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        };
        setCurrentUser(restrictedUser);
        setUsers((prev) => prev.map((u) => (u.id === restrictedUser.id ? restrictedUser : u)));
        showToast(`AI Moderation: 48h Restriction applied (${moderation.reason})`);
      }
      return false;
    }

    const isVerifiedDoctor =
      currentUser.role === 'doctor' && currentUser.verificationStatus === 'verified';

    const newComment = {
      id: `comment-${Date.now()}`,
      postId,
      authorId: currentUser.id,
      authorUsername: currentUser.username,
      authorRole: currentUser.role,
      authorRealName: currentUser.showRealName ? currentUser.realName : undefined,
      isVerifiedDoctor,
      authorSpecialty: currentUser.specialty,
      content,
      timestamp: 'Just now',
      isDoctorRecommendation: isVerifiedDoctor,
    };

    setConsultations((prev) =>
      prev.map((c) =>
        c.id === postId
          ? {
              ...c,
              comments: [...c.comments, newComment],
            }
          : c
      )
    );

    showToast('Comment submitted to consultation.');
    return true;
  };

  // Appointment Booking Handler
  const handleConfirmBooking = (
    doc: DoctorProfile,
    date: string,
    time: string,
    type: ConsultationType,
    notes: string
  ) => {
    const newAppointment: Appointment = {
      id: `app-${Date.now()}`,
      doctorId: doc.id,
      doctorUsername: doc.username,
      doctorRealName: doc.realName,
      doctorSpecialty: doc.specialty,
      clinicName: doc.clinicName,
      clinicAddress: doc.clinicAddress,
      date,
      time,
      type,
      status: 'upcoming',
      fee: doc.consultationFee,
      patientNotes: notes || undefined,
    };

    setAppointments((prev) => [newAppointment, ...prev]);
    showToast(`Appointment confirmed with ${doc.username}!`);
  };

  const handleCancelAppointment = (id: string) => {
    setAppointments((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: 'cancelled' as const } : app))
    );
    showToast('Appointment cancelled.');
  };

  return (
    <div
      id="app-root"
      className={`min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-start py-0 sm:py-6 selection:bg-sky-100 selection:text-sky-900 transition-colors ${
        theme === 'dark' ? 'dark text-slate-100' : 'text-slate-900'
      }`}
    >
      {/* Desktop Helper Bar with Quick Role Switcher & Frame Toggle */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-md px-3 mb-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
        <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="font-semibold">{t.appName}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick role test switcher */}
          <button
            id="quick-role-switch-btn"
            onClick={handleQuickSwitchRole}
            className="flex items-center gap-1 text-[11px] bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 px-2.5 py-1 rounded-full hover:bg-sky-100 transition shadow-2xs"
            title="Toggle between Patient and Doctor test modes"
          >
            <ArrowLeftRight size={12} />
            <span>
              Role:{' '}
              <strong className="capitalize">
                {currentUser ? currentUser.role : 'Guest'}
              </strong>
            </span>
          </button>

          {/* Mobile frame toggle */}
          <button
            id="toggle-frame-mode-btn"
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs transition"
          >
            {isPhoneFrame ? (
              <>
                <Maximize2 className="w-3 h-3" />
                <span>Expanded</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3 h-3" />
                <span>Phone</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div
        id="app-mobile-container"
        className={`w-full bg-slate-50/50 dark:bg-slate-900 relative flex flex-col overflow-hidden transition-all duration-300 ${
          isPhoneFrame
            ? 'sm:max-w-md sm:rounded-[36px] sm:shadow-2xl sm:border sm:border-slate-200 dark:sm:border-slate-800 min-h-screen sm:min-h-[850px]'
            : 'max-w-3xl sm:rounded-3xl sm:shadow-xl sm:border sm:border-slate-200 dark:sm:border-slate-800 min-h-screen'
        }`}
      >
        {/* Mobile Status Bar */}
        <div className="px-6 pt-3 pb-1 bg-sky-100/70 dark:bg-slate-900 flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 select-none border-b border-sky-100/50 dark:border-slate-800">
          <span>09:41</span>
          <div className="w-24 h-4 bg-slate-800/10 dark:bg-slate-700/30 rounded-full hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* Global Header */}
        <Header
          currentUser={currentUser}
          lang={lang}
          theme={theme}
          onLanguageChange={setLang}
          onThemeToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          onEmergencyClick={() => setIsEmergencyOpen(true)}
          onRequestAuth={() => setIsAuthModalOpen(true)}
        />

        {/* Main View Switcher Content */}
        <main className="flex-1 overflow-y-auto px-4 py-3">
          {activeTab === 'home' && (
            <div className="space-y-4 pb-20">
              {/* Search Bar & Specialization filters */}
              <SearchBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                specializations={SPECIALIZATIONS}
                selectedSpecialization={selectedSpecialization}
                onSelectSpecialization={setSelectedSpecialization}
                availableTodayOnly={availableTodayOnly}
                onToggleAvailableToday={() => setAvailableTodayOnly(!availableTodayOnly)}
                topRatedOnly={topRatedOnly}
                onToggleTopRated={() => setTopRatedOnly(!topRatedOnly)}
                totalResults={filteredDoctors.length}
                lang={lang}
              />

              {/* Top-Rated Doctors Section */}
              <section id="top-rated-doctors-section" className="px-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      {t.topRatedSpecialists}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Board-verified physicians with patient satisfaction ratings
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                    {filteredDoctors.length} {t.available}
                  </span>
                </div>

                {filteredDoctors.length === 0 ? (
                  <div className="py-10 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No specialists match your filters
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedSpecialization('all');
                        setAvailableTodayOnly(false);
                        setTopRatedOnly(false);
                      }}
                      className="mt-3 px-3.5 py-1.5 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 transition"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredDoctors.map((doc) => (
                      <DoctorCard
                        key={doc.id}
                        doctor={doc}
                        lang={lang}
                        onSelectDoctor={(d) => {
                          setSelectedDoctor(d);
                          setIsDoctorModalOpen(true);
                        }}
                        onQuickBook={(d) => {
                          setSelectedDoctor(d);
                          setIsDoctorModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'consultations' && (
            <PublicConsultationsView
              currentUser={currentUser}
              consultations={consultations}
              lang={lang}
              onCreatePost={handleCreateConsultation}
              onAddComment={handleAddComment}
              onRequestAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {activeTab === 'near_you' && (
            <DoctorsNearYouView
              doctors={doctors}
              lang={lang}
              onSelectDoctor={(doc) => {
                setSelectedDoctor(doc);
                setIsDoctorModalOpen(true);
              }}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              currentUser={currentUser}
              lang={lang}
              theme={theme}
              onLanguageChange={setLang}
              onThemeToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              onEmergencyClick={() => setIsEmergencyOpen(true)}
              onSignOut={handleSignOut}
              onRequestAuth={() => setIsAuthModalOpen(true)}
              onDeleteAccount={handleDeleteAccount}
              onUpdateDoctorClinic={handleUpdateDoctorClinic}
              onToggleRealName={handleToggleRealName}
              onSimulateInactivity={handleSimulateInactivity}
              onClearModerationPenalty={handleClearModerationPenalty}
            />
          )}
        </main>

        {/* Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          lang={lang}
          consultationsBadge={consultations.length}
        />

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div
            id="app-toast-alert"
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-slate-900/95 dark:bg-slate-800 text-white rounded-2xl shadow-xl flex items-center gap-2 text-xs font-medium backdrop-blur-md max-w-[90vw] animate-in fade-in slide-in-from-bottom-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
        )}

        {/* Doctor Details & Booking Modal */}
        <DoctorModal
          doctor={selectedDoctor}
          isOpen={isDoctorModalOpen}
          lang={lang}
          onClose={() => {
            setIsDoctorModalOpen(false);
            setSelectedDoctor(null);
          }}
          onConfirmBooking={handleConfirmBooking}
        />

        {/* Auth Modal (Distinct Patient / Doctor Sign Up, Reset Password, Email Privacy) */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          users={users}
          lang={lang}
          onLogin={handleLogin}
          onSignUpPatient={handleSignUpPatient}
          onSignUpDoctor={handleSignUpDoctor}
          onPasswordReset={handlePasswordReset}
        />

        {/* Emergency SOS Modal */}
        <EmergencyModal
          isOpen={isEmergencyOpen}
          onClose={() => setIsEmergencyOpen(false)}
          currentUser={currentUser}
        />

        {/* Active Telehealth Video Call Overlay */}
        <VideoCallModal
          appointment={activeCallAppointment}
          isOpen={!!activeCallAppointment}
          onEndCall={() => {
            setActiveCallAppointment(null);
            showToast('Consultation ended. Summary sent to your medical records.');
          }}
        />
      </div>
    </div>
  );
}
