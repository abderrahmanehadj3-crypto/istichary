/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Battery,
  Signal,
  Smartphone,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  Heart,
  MessageSquare,
  MapPin,
  Star,
} from 'lucide-react';
import {
  UserAccount,
  Language,
  ThemeMode,
  DoctorProfile,
  ConsultationPost,
  ConsultationComment,
  AppNotification,
} from './types';
import {
  MOCK_USERS,
  MOCK_DOCTORS,
  MOCK_POSTS,
  INITIAL_NOTIFICATIONS,
  mockPatientUser,
} from './data/mockData';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { PublicConsultationsView } from './components/PublicConsultationsView';
import { FollowedView } from './components/FollowedView';
import { ProfileView } from './components/ProfileView';
import { NearbyDoctorsView } from './components/NearbyDoctorsView';
import { AdminModeratorDashboard } from './components/AdminModeratorDashboard';
import { AuthModal } from './components/AuthModal';
import { NotificationsCenterModal } from './components/NotificationsCenterModal';
import { RateDoctorModal } from './components/RateDoctorModal';
import { translations, getTranslations } from './i18n/translations';

export default function App() {
  // Multilingual & Theme with localStorage persistence to prevent falling back to English
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('istichary_lang');
      if (saved === 'en' || saved === 'ar' || saved === 'fr') return saved;
    } catch (e) {}
    return 'en';
  });

  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('istichary_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return 'light';
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('consultations');

  // Authentication State
  const [users, setUsers] = useState<UserAccount[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(mockPatientUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Doctors and Public Consultations
  const [doctors, setDoctors] = useState<DoctorProfile[]>(MOCK_DOCTORS);
  const [posts, setPosts] = useState<ConsultationPost[]>(MOCK_POSTS);

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('istichary_notifications');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_NOTIFICATIONS;
  });
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  // Doctor Star Rating Modal State
  const [ratingModalDoctor, setRatingModalDoctor] = useState<DoctorProfile | null>(null);

  // Responsive Frame toggle for desktop preview
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  // Toast alert
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = getTranslations(lang);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync HTML direction attribute for Arabic (RTL) and French/English (LTR)
  useEffect(() => {
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else if (lang === 'fr') {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'fr';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    }
  }, [lang]);

  // Persist language
  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    try {
      localStorage.setItem('istichary_lang', newLang);
    } catch (e) {}
  };

  // Sync Dark class to document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('istichary_theme', theme);
    } catch (e) {}
  }, [theme]);

  // Sync notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('istichary_notifications', JSON.stringify(notifications));
    } catch (e) {}
  }, [notifications]);

  // Toggle Theme
  const handleThemeToggle = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Unread Notifications Count
  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast(t.markAllAsRead);
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    showToast(t.clearAllNotifications);
  };

  const handleSelectNotification = (notif: AppNotification) => {
    // Mark this specific notification as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    setIsNotificationsModalOpen(false);

    if (notif.postId) {
      setActiveTab('consultations');
    } else if (notif.type === 'follow') {
      setActiveTab('followed');
    } else if (notif.targetDoctorId) {
      setActiveTab('nearby');
    }
  };

  // Follow / Unfollow Doctor with Notification Creation
  const handleToggleFollowDoctor = (doctorId: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const currentFollowed = currentUser.followingDoctorIds || [];
    const isAlreadyFollowing = currentFollowed.includes(doctorId);

    let updatedFollowed: string[];
    if (isAlreadyFollowing) {
      updatedFollowed = currentFollowed.filter((id) => id !== doctorId);
      showToast('Specialist unfollowed.');
    } else {
      updatedFollowed = [...currentFollowed, doctorId];
      const doc = doctors.find((d) => d.id === doctorId);
      showToast(`Now following Dr. ${doc?.realName || doc?.username} (${doc?.specialty})`);

      // Alert in Notifications Center
      const newNotif: AppNotification = {
        id: `notif-follow-${Date.now()}`,
        type: 'follow',
        actorUsername: currentUser.username,
        actorRole: currentUser.role,
        targetDoctorId: doctorId,
        message: `You started following Dr. ${doc?.realName || doc?.username} (${doc?.specialty}).`,
        timestamp: 'Just now',
        isRead: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }

    const updatedUser: UserAccount = {
      ...currentUser,
      followingDoctorIds: updatedFollowed,
    };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
  };

  // Doctor Star Rating Submission
  const handleSubmitDoctorRating = (doctorId: string, stars: number, feedback?: string) => {
    setDoctors((prev) =>
      prev.map((doc) => {
        if (doc.id === doctorId) {
          const oldTotal = doc.rating * doc.reviewCount;
          const newReviewCount = doc.reviewCount + 1;
          const newRating = Number(((oldTotal + stars) / newReviewCount).toFixed(1));
          return {
            ...doc,
            rating: newRating,
            reviewCount: newReviewCount,
          };
        }
        return doc;
      })
    );

    const doc = doctors.find((d) => d.id === doctorId);
    showToast(t.ratingSuccess);

    // Track interaction notification in Notifications Center
    const newNotif: AppNotification = {
      id: `notif-rate-${Date.now()}`,
      type: 'rating',
      actorUsername: currentUser?.username || 'Patient',
      actorRole: currentUser?.role || 'patient',
      targetDoctorId: doctorId,
      stars,
      message: `Verified consultation rating: ${stars} Stars submitted for Dr. ${
        doc?.realName || doc?.username
      } (${doc?.specialty}). ${feedback ? `"${feedback}"` : ''}`,
      timestamp: 'Just now',
      isRead: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Like / Heart Consultation Post with Interaction Notification
  const handleLikePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            likesCount: (p.likesCount || 0) + 1,
          };
        }
        return p;
      })
    );

    const post = posts.find((p) => p.id === postId);
    showToast('Consultation inquiry upvoted.');

    const newNotif: AppNotification = {
      id: `notif-like-${Date.now()}`,
      type: 'like',
      actorUsername: currentUser?.username || 'Patient',
      actorRole: currentUser?.role || 'patient',
      postId,
      message: `Someone appreciated clinical inquiry: "${post?.title ? post.title.slice(0, 35) + '...' : 'Medical Post'}"`,
      timestamp: 'Just now',
      isRead: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Add Consultation Post
  const handleAddPost = (newPost: ConsultationPost) => {
    setPosts((prev) => [newPost, ...prev]);
    showToast(t.inquiryPublishedSuccess);
  };

  // Edit Consultation Post (Allowed for post author - doctor or patient)
  const handleEditPost = (postId: string, updatedData: Partial<ConsultationPost>) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            ...updatedData,
            isEdited: true,
            updatedAt: 'Just now',
          };
        }
        return p;
      })
    );
    showToast(t.postUpdatedSuccess);
  };

  // Delete Consultation Post (Allowed for post author)
  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    showToast(t.postDeletedSuccess);
  };

  // Edit Comment / Reply (Allowed for comment author)
  const handleEditComment = (postId: string, commentId: string, newContent: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: p.comments.map((c) => {
              if (c.id === commentId) {
                return {
                  ...c,
                  content: newContent,
                  isEdited: true,
                  updatedAt: 'Just now',
                };
              }
              return c;
            }),
          };
        }
        return p;
      })
    );
    showToast(t.commentUpdatedSuccess);
  };

  // Delete Comment / Reply (Allowed for comment author)
  const handleDeleteComment = (postId: string, commentId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: p.comments.filter((c) => c.id !== commentId),
          };
        }
        return p;
      })
    );
    showToast(t.commentDeletedSuccess);
  };

  // Add Comment / Doctor Response to a Post with Notification Alert
  const handleAddComment = (postId: string, newComment: ConsultationComment) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [...p.comments, newComment],
          };
        }
        return p;
      })
    );

    showToast(newComment.authorRole === 'doctor' ? t.doctorReplySentSuccess : 'Reply submitted.');

    // Alert in Notifications Center for doctor replies
    if (newComment.authorRole === 'doctor') {
      const newNotif: AppNotification = {
        id: `notif-reply-${Date.now()}`,
        type: 'reply',
        actorUsername: newComment.authorUsername,
        actorRealName: newComment.authorRealName,
        actorRole: newComment.authorRole,
        actorSpecialty: newComment.authorSpecialty,
        postId,
        message: `Certified specialist Dr. ${
          newComment.authorRealName || newComment.authorUsername
        } (${newComment.authorSpecialty || 'Specialist'}) published medical guidance.`,
        timestamp: 'Just now',
        isRead: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }
  };

  // STRICT RULE: ONLY VERIFIED DOCTORS CAN SET CLINIC LOCATION
  const handleUpdateClinicLocation = (clinicData: {
    hospitalOrClinic: string;
    clinicCity: string;
    clinicAddress: string;
    clinicWorkingHours: string;
    clinicPhone: string;
  }) => {
    if (!currentUser || currentUser.role !== 'doctor' || currentUser.verificationStatus !== 'verified') {
      showToast(t.onlyVerifiedDoctorsCanSetLocation);
      return;
    }

    const updatedUser: UserAccount = {
      ...currentUser,
      hospitalOrClinic: clinicData.hospitalOrClinic,
      clinicCity: clinicData.clinicCity,
      clinicAddress: clinicData.clinicAddress,
      clinicWorkingHours: clinicData.clinicWorkingHours,
      clinicPhone: clinicData.clinicPhone,
    };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

    // Sync into doctors catalog so nearby filter immediately reflects it
    setDoctors((prev) =>
      prev.map((d) => {
        if (d.userId === currentUser.id || d.username === currentUser.username) {
          return {
            ...d,
            hospitalOrClinic: clinicData.hospitalOrClinic,
            clinicCity: clinicData.clinicCity,
            clinicAddress: clinicData.clinicAddress,
            clinicWorkingHours: clinicData.clinicWorkingHours,
            clinicPhone: clinicData.clinicPhone,
          };
        }
        return d;
      })
    );

    showToast(t.clinicUpdatedSuccess);
  };

  // Update Email with strict privacy
  const handleUpdateEmail = (newEmail: string, passwordConfirm: string) => {
    if (!currentUser) return { success: false, error: 'User not signed in.' };

    if (currentUser.password && currentUser.password !== passwordConfirm) {
      return { success: false, error: 'Incorrect password confirmation.' };
    }

    const exists = users.some(
      (u) => u.id !== currentUser.id && u.email.toLowerCase() === newEmail.toLowerCase()
    );
    if (exists) {
      return { success: false, error: 'Email address is already linked to another account.' };
    }

    const updatedUser: UserAccount = {
      ...currentUser,
      email: newEmail,
    };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    showToast(t.emailUpdatedSuccess);
    return { success: true };
  };

  // Change Password
  const handleChangePassword = (oldPass: string, newPass: string) => {
    if (!currentUser) return { success: false, error: 'User not signed in.' };

    if (currentUser.password && currentUser.password !== oldPass) {
      return { success: false, error: 'Current password does not match.' };
    }

    const updatedUser: UserAccount = {
      ...currentUser,
      password: newPass,
    };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    showToast(t.passwordChangedSuccess);
    return { success: true };
  };

  // Delete Account
  const handleDeleteAccount = (password: string): boolean => {
    if (!currentUser) return false;

    if (currentUser.password && currentUser.password !== password) {
      return false;
    }

    const userId = currentUser.id;
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setDoctors((prev) => prev.filter((d) => d.userId !== userId && d.id !== userId));

    setPosts((prev) =>
      prev.map((p) => ({
        ...p,
        authorUsername: p.authorId === userId ? '[Deleted Account]' : p.authorUsername,
        comments: p.comments.map((c) => ({
          ...c,
          authorUsername: c.authorId === userId ? '[Deleted Account]' : c.authorUsername,
          authorRealName: c.authorId === userId ? undefined : c.authorRealName,
        })),
      }))
    );

    setCurrentUser(null);
    showToast(t.accountDeletedSuccess);
    return true;
  };

  // Doctor Toggle Public Real Name
  const handleToggleDoctorRealName = (show: boolean) => {
    if (!currentUser || currentUser.role !== 'doctor') return;

    const updatedUser: UserAccount = {
      ...currentUser,
      showRealName: show,
    };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

    setDoctors((prev) =>
      prev.map((d) => (d.userId === currentUser.id ? { ...d, showRealName: show } : d))
    );

    showToast(show ? 'Real name will appear on posts.' : 'Only username will appear.');
  };

  // Simulate 12-Month Inactivity
  const handleSimulateInactivity = () => {
    if (!currentUser) return;
    const deactivatedUser: UserAccount = {
      ...currentUser,
      isDeactivatedInactive: true,
      lastLoginDate: '2023-01-01T00:00:00Z',
    };
    setCurrentUser(deactivatedUser);
    setUsers((prev) => prev.map((u) => (u.id === deactivatedUser.id ? deactivatedUser : u)));
    showToast('Simulated 12-month inactivity policy. Account deactivated.');
  };

  // Apply moderation penalties
  const handleApplyPenalty = (penaltyType: 'banned' | 'restricted_48h', reason: string) => {
    if (!currentUser) return;

    const updatedUser: UserAccount = {
      ...currentUser,
      moderationStatus: penaltyType,
      penaltyReason: reason,
      penaltyExpiresAt:
        penaltyType === 'restricted_48h'
          ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
          : undefined,
    };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    showToast(penaltyType === 'banned' ? t.bannedAlertTitle : t.restrictedAlertTitle);
  };

  const handleClearModerationPenalty = () => {
    if (!currentUser) return;

    const updatedUser: UserAccount = {
      ...currentUser,
      moderationStatus: 'active',
      penaltyReason: undefined,
      penaltyExpiresAt: undefined,
    };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    showToast('Moderation penalty cleared.');
  };

  // Doctor Verification status change by Admin/Moderator
  const handleVerifyDoctor = (userId: string, newStatus: 'verified' | 'rejected') => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, verificationStatus: newStatus } : u))
    );

    setDoctors((prev) =>
      prev.map((d) => (d.userId === userId ? { ...d, verificationStatus: newStatus } : d))
    );

    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, verificationStatus: newStatus } : null));
    }

    showToast(
      newStatus === 'verified' ? 'Doctor credentials approved.' : 'Doctor verification rejected.'
    );
  };

  // Pending doctors count for badge
  const pendingDocsCount = users.filter(
    (u) => u.role === 'doctor' && u.verificationStatus === 'pending'
  ).length;

  return (
    <div
      id="app-root"
      className="min-h-screen bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col items-center justify-start p-0 sm:p-4 transition-colors duration-200"
    >
      {/* Desktop Responsive Toolbar */}
      <div className="w-full max-w-md hidden sm:flex items-center justify-between pb-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sky-700 dark:text-sky-400">Istichary</span>
          <span>• Minimalist Medical Consultations</span>
        </div>
        <button
          id="btn-toggle-phone-frame"
          onClick={() => setIsPhoneFrame(!isPhoneFrame)}
          className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition cursor-pointer"
        >
          {isPhoneFrame ? <Maximize2 size={13} /> : <Smartphone size={13} />}
          <span>{isPhoneFrame ? 'Full Width View' : 'Mobile Frame'}</span>
        </button>
      </div>

      {/* Main Container / Mobile Device Frame */}
      <div
        id="app-viewport-container"
        className={`w-full bg-white dark:bg-slate-900 flex flex-col transition-all duration-300 relative ${
          isPhoneFrame
            ? 'sm:max-w-md sm:rounded-[36px] sm:shadow-2xl sm:border sm:border-slate-300 dark:sm:border-slate-800 sm:my-auto sm:min-h-[850px] overflow-hidden'
            : 'max-w-3xl rounded-none sm:rounded-3xl shadow-none sm:shadow-xl sm:border sm:border-slate-200 dark:sm:border-slate-800 overflow-hidden'
        }`}
      >
        {/* Mobile Status Bar Simulation */}
        <div
          id="mobile-status-bar"
          className="px-6 pt-3 pb-1 flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 select-none"
        >
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <Signal size={12} />
            <Wifi size={12} />
            <Battery size={14} className="fill-current" />
          </div>
        </div>

        {/* Global Toast Notification */}
        {toastMessage && (
          <div
            id="global-toast-notification"
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 text-xs font-semibold shadow-xl flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-2"
          >
            <CheckCircle2 size={14} className="text-emerald-400 dark:text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Clean Header with Language Switcher and Notifications Bell */}
        <Header
          currentUser={currentUser}
          lang={lang}
          theme={theme}
          onLanguageChange={handleLanguageChange}
          onThemeToggle={handleThemeToggle}
          onRequestAuth={() => setIsAuthModalOpen(true)}
          unreadNotificationsCount={unreadNotificationsCount}
          onOpenNotifications={() => setIsNotificationsModalOpen(true)}
          onSwitchUser={(user) => {
            setCurrentUser(user);
            showToast(`Switched to test user: ${user.username} (${user.role})`);
          }}
          availableUsers={users}
        />

        {/* Dynamic Body Content by Active Tab */}
        <main id="main-content-scroll" className="flex-1 overflow-y-auto p-4 scroll-smooth">
          {/* TAB 1: Streamlined Homepage with Prominent Post Input & Consultations */}
          {activeTab === 'consultations' && (
            <PublicConsultationsView
              posts={posts}
              currentUser={currentUser}
              lang={lang}
              followedDoctorIds={currentUser?.followingDoctorIds || []}
              onToggleFollowDoctor={handleToggleFollowDoctor}
              onAddPost={handleAddPost}
              onEditPost={handleEditPost}
              onDeletePost={handleDeletePost}
              onAddComment={handleAddComment}
              onEditComment={handleEditComment}
              onDeleteComment={handleDeleteComment}
              onApplyPenalty={handleApplyPenalty}
              onRequestAuth={() => setIsAuthModalOpen(true)}
              doctors={doctors}
              onOpenRatingModal={setRatingModalDoctor}
              onLikePost={handleLikePost}
            />
          )}

          {/* TAB 2: Strictly Restricted Nearby Doctors (Verified clinic locations only) */}
          {activeTab === 'nearby' && (
            <NearbyDoctorsView
              doctors={doctors}
              currentUser={currentUser}
              lang={lang}
              followedDoctorIds={currentUser?.followingDoctorIds || []}
              onToggleFollow={handleToggleFollowDoctor}
              onOpenRatingModal={setRatingModalDoctor}
              onNavigateToProfileClinic={() => setActiveTab('profile')}
              onRequestAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {/* TAB 3: Followed Doctors & Specialists */}
          {activeTab === 'followed' && (
            <FollowedView
              followedDoctorIds={currentUser?.followingDoctorIds || []}
              doctors={doctors}
              posts={posts}
              lang={lang}
              currentUser={currentUser}
              onToggleFollow={handleToggleFollowDoctor}
              onSelectConsultationTab={() => setActiveTab('consultations')}
              onRequestAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {/* TAB 4: Profile & Account Management */}
          {activeTab === 'profile' && (
            <ProfileView
              currentUser={currentUser}
              doctors={doctors}
              lang={lang}
              theme={theme}
              onLanguageChange={handleLanguageChange}
              onThemeToggle={handleThemeToggle}
              onSignOut={() => {
                setCurrentUser(null);
                showToast('Signed out successfully.');
              }}
              onRequestAuth={() => setIsAuthModalOpen(true)}
              onUpdateEmail={handleUpdateEmail}
              onChangePassword={handleChangePassword}
              onDeleteAccount={handleDeleteAccount}
              onToggleRealName={handleToggleDoctorRealName}
              onUnfollowDoctor={handleToggleFollowDoctor}
              onSimulateInactivity={handleSimulateInactivity}
              onClearModerationPenalty={handleClearModerationPenalty}
              onUpdateClinicLocation={handleUpdateClinicLocation}
            />
          )}

          {/* TAB 5: Admin & Moderator Verification Governance */}
          {activeTab === 'admin' && (
            <AdminModeratorDashboard
              currentUser={currentUser}
              lang={lang}
              users={users}
              onVerifyDoctor={handleVerifyDoctor}
              onRevokeDoctorAccess={(userId) => handleVerifyDoctor(userId, 'rejected')}
            />
          )}
        </main>

        {/* Minimalist Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          lang={lang}
          currentUser={currentUser}
          consultationsBadge={posts.length}
          pendingVerifBadge={pendingDocsCount}
        />

        {/* Notifications & Interactions Center Modal */}
        <NotificationsCenterModal
          isOpen={isNotificationsModalOpen}
          onClose={() => setIsNotificationsModalOpen(false)}
          notifications={notifications}
          lang={lang}
          onMarkAllAsRead={handleMarkAllNotificationsAsRead}
          onClearAll={handleClearAllNotifications}
          onNotificationClick={handleSelectNotification}
        />

        {/* Doctor Star Rating Modal */}
        <RateDoctorModal
          isOpen={ratingModalDoctor !== null}
          doctor={ratingModalDoctor}
          lang={lang}
          onClose={() => setRatingModalDoctor(null)}
          onSubmitRating={handleSubmitDoctorRating}
        />

        {/* Authentication Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          lang={lang}
          existingUsers={users}
          onAuthSuccess={(user) => {
            setUsers((prev) => (prev.some((u) => u.id === user.id) ? prev : [...prev, user]));
            setCurrentUser(user);
            showToast(`Signed in as ${user.username}`);
          }}
          onRegisterDoctor={(newDocUser, docDetails) => {
            const newDocProfile: DoctorProfile = {
              id: `doc-${Date.now()}`,
              userId: newDocUser.id,
              username: newDocUser.username,
              realName: newDocUser.realName,
              showRealName: newDocUser.showRealName,
              specializationId: newDocUser.specializationId || 'general',
              specialty: newDocUser.specialty || 'General Medicine',
              rating: 5.0,
              reviewCount: 0,
              experienceYears: docDetails.experienceYears || 5,
              hospitalOrClinic: newDocUser.hospitalOrClinic || 'Health Center',
              clinicCity: newDocUser.clinicCity || 'Paris',
              clinicAddress: newDocUser.clinicAddress || '',
              medicalLicenseNumber: newDocUser.medicalLicenseNumber || 'PENDING',
              verificationStatus: 'pending',
              about: docDetails.about || 'Specialist physician.',
            };
            setDoctors((prev) => [...prev, newDocProfile]);
          }}
        />
      </div>
    </div>
  );
}
