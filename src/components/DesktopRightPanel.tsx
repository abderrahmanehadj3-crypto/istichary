import React from 'react';
import {
  ShieldCheck,
  Star,
  UserPlus,
  UserCheck,
  MapPin,
  ChevronRight,
  Sparkles,
  Award,
  Stethoscope,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { DoctorProfile, Language, UserAccount } from '../types';
import { translations, getSpecialtyLabel } from '../i18n/translations';
import { SPECIALIZATIONS } from '../data/mockData';
import { NavTab } from './BottomNav';
import { RoleAvatar } from './RoleAvatar';

interface DesktopRightPanelProps {
  doctors: DoctorProfile[];
  followedDoctorIds: string[];
  onToggleFollowDoctor: (doctorId: string) => void;
  onOpenRatingModal?: (doctor: DoctorProfile) => void;
  onSelectTab: (tab: NavTab) => void;
  lang: Language;
  currentUser: UserAccount | null;
  onRequestAuth: () => void;
}

export const DesktopRightPanel: React.FC<DesktopRightPanelProps> = ({
  doctors,
  followedDoctorIds,
  onToggleFollowDoctor,
  onOpenRatingModal,
  onSelectTab,
  lang,
  currentUser,
  onRequestAuth,
}) => {
  const t = translations[lang];

  // Top verified doctors for widget
  const verifiedDoctors = doctors
    .filter((d) => d.verificationStatus === 'verified')
    .slice(0, 4);

  return (
    <aside
      id="desktop-right-info-panel"
      aria-label="Quick Information Panel"
      className="hidden xl:flex w-80 shrink-0 flex-col gap-5 py-5 px-4 bg-slate-50/70 dark:bg-slate-900/60 border-l rtl:border-l-0 rtl:border-r border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 overflow-y-auto transition-colors"
    >
      {/* 1. TOP VERIFIED SPECIALISTS WIDGET */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Award size={16} className="text-sky-600 dark:text-sky-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {lang === 'ar' ? 'أطباء معتمدون متميزون' : lang === 'fr' ? 'Médecins certifiés' : 'Featured Specialists'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('nearby')}
            className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
          >
            {lang === 'ar' ? 'عرض الكل' : lang === 'fr' ? 'Voir tout' : 'View all'}
          </button>
        </div>

        <div className="space-y-3">
          {verifiedDoctors.map((doc) => {
            const isFollowing = followedDoctorIds.includes(doc.id);
            return (
              <div
                key={doc.id}
                id={`desktop-specialist-card-${doc.id}`}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <RoleAvatar role="doctor" size="sm" verificationStatus={doc.verificationStatus} />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {doc.realName || doc.username}
                    </div>
                    <div className="text-[11px] text-sky-600 dark:text-sky-400 font-medium truncate">
                      {doc.specialty}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-0.5 font-bold text-amber-500">
                        <Star size={10} className="fill-amber-400" />
                        {doc.rating.toFixed(1)}
                      </span>
                      {doc.clinicCity && (
                        <span className="flex items-center gap-0.5 truncate">
                          <MapPin size={9} />
                          {doc.clinicCity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1">
                  {onOpenRatingModal && (
                    <button
                      type="button"
                      onClick={() => onOpenRatingModal(doc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title={t.rateDoctor}
                    >
                      <Star size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser) {
                        onRequestAuth();
                      } else {
                        onToggleFollowDoctor(doc.id);
                      }
                    }}
                    className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isFollowing
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                        : 'bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 hover:bg-sky-200'
                    }`}
                    title={isFollowing ? t.unfollowDoctor : t.followDoctor}
                  >
                    {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. MEDICAL SPECIALTIES QUICK EXPLORER */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Stethoscope size={16} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {t.specializations}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {SPECIALIZATIONS.filter((s) => s.id !== 'all').map((spec) => (
            <button
              key={spec.id}
              type="button"
              onClick={() => onSelectTab('consultations')}
              className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-100 dark:bg-slate-900/70 hover:bg-sky-50 dark:hover:bg-sky-950 hover:text-sky-700 dark:hover:text-sky-300 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 transition cursor-pointer"
            >
              {getSpecialtyLabel(spec.id, t)}
            </button>
          ))}
        </div>
      </div>

      {/* 3. PLATFORM TRUST & CLINICAL INTEGRITY GUARANTEE */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-md space-y-3 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-sky-400" />
          <h4 className="font-bold text-white text-xs">
            {lang === 'ar' ? 'معايير النزاهة الطبية' : lang === 'fr' ? 'Intégrité médicale' : 'Clinical Integrity'}
          </h4>
        </div>
        <ul className="space-y-2 text-[11px] text-slate-300 leading-relaxed">
          <li className="flex items-start gap-2">
            <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
            <span>
              {lang === 'ar'
                ? 'فحص يدوي لرخص مزاولة المهنة للأطباء'
                : lang === 'fr'
                ? 'Vérification stricte des licences professionnelles'
                : 'Manual audit of official medical licenses'}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
            <span>
              {lang === 'ar'
                ? 'عناوين العيادات محصورة بالأطباء المعتمدين'
                : lang === 'fr'
                ? 'Adresses de cabinets réservées aux médecins vérifiés'
                : 'Clinic locations restricted to approved physicians'}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
            <span>
              {lang === 'ar'
                ? 'إشراف آلي لمنع الإعلانات والمحتوى المضلل'
                : lang === 'fr'
                ? 'Modération algorithmique contre les abus'
                : 'Automated moderation against spurious medical advice'}
            </span>
          </li>
        </ul>
      </div>
    </aside>
  );
};
