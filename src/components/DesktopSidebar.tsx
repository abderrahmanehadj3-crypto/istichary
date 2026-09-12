import React from 'react';
import {
  MessageSquare,
  MapPin,
  Heart,
  User,
  ShieldCheck,
  Stethoscope,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Language, UserAccount } from '../types';
import { translations } from '../i18n/translations';
import { NavTab } from './BottomNav';
import { RoleAvatar } from './RoleAvatar';

interface DesktopSidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  lang: Language;
  currentUser: UserAccount | null;
  postsCount?: number;
  pendingVerifBadge?: number;
  onRequestAuth: () => void;
  onNewConsultation?: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onSelectTab,
  lang,
  currentUser,
  postsCount = 0,
  pendingVerifBadge = 0,
  onRequestAuth,
  onNewConsultation,
}) => {
  const t = translations[lang];

  const hasAdminAccess =
    currentUser?.role === 'super_admin' || currentUser?.role === 'moderator';

  const navItems: Array<{
    id: NavTab;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    badge?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'consultations',
      label: t.navConsultations,
      description: lang === 'ar' ? 'الاستشارات والنقاشات الطبية' : lang === 'fr' ? 'Fils de consultations médicales' : 'Medical questions & discussions',
      icon: MessageSquare,
      badge: postsCount,
      badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
    },
    {
      id: 'nearby',
      label: t.navNearby,
      description: lang === 'ar' ? 'عيادات الأطباء المعتمدين' : lang === 'fr' ? 'Cabinets médicaux vérifiés' : 'Verified doctor clinics',
      icon: MapPin,
    },
    {
      id: 'followed',
      label: t.navFollowed,
      description: lang === 'ar' ? 'الأطباء المفضلون' : lang === 'fr' ? 'Spécialistes suivis' : 'Followed specialists',
      icon: Heart,
      badge: currentUser?.followingDoctorIds?.length || 0,
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    },
    {
      id: 'profile',
      label: t.navProfile,
      description: lang === 'ar' ? 'إعدادات الحساب والتوثيق' : lang === 'fr' ? 'Compte et coordonnées' : 'Account & settings',
      icon: User,
    },
  ];

  return (
    <aside
      id="desktop-sidebar-navigation"
      aria-label="Sidebar Navigation"
      className="w-64 xl:w-72 shrink-0 flex flex-col justify-between py-5 px-3 bg-white dark:bg-slate-900 border-r rtl:border-r-0 rtl:border-l border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 select-none transition-colors"
    >
      <div className="space-y-6">
        {/* Brand Header on Desktop Sidebar */}
        <div className="px-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
            <Stethoscope size={22} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t.appName}
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* User Card Summary */}
        <div className="px-2">
          {currentUser ? (
            <div
              id="desktop-user-profile-badge"
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center gap-3"
            >
              <RoleAvatar
                role={currentUser.role}
                size="md"
                verificationStatus={currentUser.verificationStatus}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {currentUser.role === 'doctor' && currentUser.showRealName && currentUser.realName
                      ? currentUser.realName
                      : currentUser.username}
                  </span>
                </div>
                <div className="text-[11px] text-sky-600 dark:text-sky-400 font-medium truncate">
                  {currentUser.role === 'doctor'
                    ? currentUser.specialty || 'Doctor'
                    : currentUser.role === 'super_admin'
                    ? 'Super Admin'
                    : currentUser.role === 'moderator'
                    ? 'Moderator'
                    : 'Patient'}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-900/60 text-xs space-y-2">
              <p className="text-sky-900 dark:text-sky-200 font-medium">
                {lang === 'ar' ? 'سجل الدخول للمشاركة في الاستشارات' : lang === 'fr' ? 'Connectez-vous pour participer' : 'Sign in to ask questions & consult doctors'}
              </p>
              <button
                id="btn-desktop-sidebar-signin"
                type="button"
                onClick={onRequestAuth}
                className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                {t.signIn}
              </button>
            </div>
          )}
        </div>

        {/* Quick Consultation CTA */}
        <div className="px-2">
          <button
            id="btn-desktop-quick-ask"
            type="button"
            onClick={() => {
              if (!currentUser) {
                onRequestAuth();
              } else {
                onSelectTab('consultations');
                onNewConsultation?.();
              }
            }}
            className="w-full py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>{t.askMedicalQuestion}</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 px-1">
          <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {lang === 'ar' ? 'القائمة الرئيسية' : lang === 'fr' ? 'Navigation Principale' : 'Main Dashboard'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`desktop-nav-link-${item.id}`}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 shadow-2xs border border-sky-200/80 dark:border-sky-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-1.5 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400'
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="text-start truncate">
                    <span className="block leading-tight">{item.label}</span>
                    <span className="block text-[10px] font-normal text-slate-400 dark:text-slate-500 truncate">
                      {item.description}
                    </span>
                  </div>
                </div>

                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.badgeColor || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Emergency Hotline Advisory */}
      <div className="px-2 pt-4 space-y-3 border-t border-slate-100 dark:border-slate-800">
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/60 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
            <AlertCircle size={14} className="shrink-0" />
            <span>{lang === 'ar' ? 'طوارئ طبية عاجلة؟' : lang === 'fr' ? 'Urgences vitales ?' : 'Medical Emergency?'}</span>
          </div>
          <p className="text-[10px] text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
            {lang === 'ar'
              ? 'اتصل فوراً بالإسعاف (15 / 112) للحالات الحرجة. هذا التطبيق للاستشارات غير الطارئة.'
              : lang === 'fr'
              ? 'Appelez immédiatement le 15 ou le 112 pour toute détresse vitale.'
              : 'Call 15, 112, or 911 for life-threatening emergencies immediately.'}
          </p>
        </div>

        <div className="px-1 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Istichary v2.4</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>Telehealth</span>
          </div>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 size={11} /> 100% Verified
          </span>
        </div>
      </div>
    </aside>
  );
};
