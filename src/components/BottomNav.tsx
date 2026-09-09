import React from 'react';
import { Home, Calendar, MessageSquare, User } from 'lucide-react';

export type NavTab = 'home' | 'appointments' | 'messages' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  upcomingAppointmentsCount: number;
  unreadMessagesCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  upcomingAppointmentsCount,
  unreadMessagesCount,
}) => {
  const tabs = [
    {
      id: 'home' as NavTab,
      label: 'Home',
      icon: Home,
      badge: 0,
    },
    {
      id: 'appointments' as NavTab,
      label: 'Appointments',
      icon: Calendar,
      badge: upcomingAppointmentsCount,
    },
    {
      id: 'messages' as NavTab,
      label: 'Messages',
      icon: MessageSquare,
      badge: unreadMessagesCount,
    },
    {
      id: 'profile' as NavTab,
      label: 'Profile',
      icon: User,
      badge: 0,
    },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      aria-label="Main Navigation"
      className="fixed sm:sticky bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-sky-100/80 px-4 py-2 shadow-lg"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'text-sky-600 font-bold'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    isActive ? 'bg-sky-50 text-sky-600 scale-105' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {tab.badge > 0 && (
                  <span
                    id={`nav-badge-${tab.id}`}
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-sky-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs ring-2 ring-white"
                  >
                    {tab.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[11px] tracking-tight mt-0.5 transition-all ${
                  isActive ? 'font-bold text-sky-700' : 'font-medium text-slate-500'
                }`}
              >
                {tab.label}
              </span>

              {isActive && (
                <span className="w-1.5 h-1.5 bg-sky-600 rounded-full mt-0.5 shadow-xs" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
