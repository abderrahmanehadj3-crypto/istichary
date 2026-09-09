import React from 'react';
import { MessageSquare, User, ShieldCheck, Heart, MapPin } from 'lucide-react';
import { Language, UserAccount } from '../types';
import { translations } from '../i18n/translations';

export type NavTab = 'consultations' | 'nearby' | 'followed' | 'profile' | 'admin';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  lang: Language;
  currentUser: UserAccount | null;
  consultationsBadge?: number;
  pendingVerifBadge?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  lang,
  currentUser,
  consultationsBadge = 0,
  pendingVerifBadge = 0,
}) => {
  const t = translations[lang];

  const hasAdminAccess =
    currentUser?.role === 'super_admin' || currentUser?.role === 'moderator';

  const tabs: Array<{ id: NavTab; label: string; icon: any; badge: number }> = [
    {
      id: 'consultations',
      label: t.navConsultations,
      icon: MessageSquare,
      badge: consultationsBadge,
    },
    {
      id: 'nearby',
      label: t.navNearby,
      icon: MapPin,
      badge: 0,
    },
    {
      id: 'followed',
      label: t.navFollowed,
      icon: Heart,
      badge: currentUser?.followingDoctorIds?.length || 0,
    },
    {
      id: 'profile',
      label: t.navProfile,
      icon: User,
      badge: 0,
    },
  ];

  if (hasAdminAccess) {
    tabs.push({
      id: 'admin',
      label: t.navAdmin,
      icon: ShieldCheck,
      badge: pendingVerifBadge,
    });
  }

  return (
    <nav
      id="bottom-navigation-bar"
      aria-label="Main Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 px-2 sm:px-4 py-2 shadow-lg safe-area-inset-bottom"
    >
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`relative min-h-[44px] flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'text-sky-600 dark:text-sky-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    isActive ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 scale-105' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {tab.badge > 0 && tab.id === 'admin' && (
                  <span
                    id={`nav-badge-${tab.id}`}
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900"
                  >
                    {tab.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] sm:text-[11px] tracking-tight mt-0.5 whitespace-nowrap transition-all ${
                  isActive
                    ? 'font-bold text-sky-700 dark:text-sky-400'
                    : 'font-medium text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
