import React from 'react';
import { Star, MapPin, Clock, Video, Award, ChevronRight, ShieldCheck, Building2 } from 'lucide-react';
import { DoctorProfile, Language } from '../types';
import { translations } from '../i18n/translations';
import { RoleAvatar } from './RoleAvatar';

interface DoctorCardProps {
  doctor: DoctorProfile;
  lang: Language;
  onSelectDoctor: (doctor: DoctorProfile) => void;
  onQuickBook: (doctor: DoctorProfile) => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  lang,
  onSelectDoctor,
  onQuickBook,
}) => {
  const t = translations[lang];

  return (
    <div
      id={`doctor-card-${doctor.id}`}
      onClick={() => onSelectDoctor(doctor)}
      className="group bg-white dark:bg-slate-800 rounded-2xl border border-sky-100/80 dark:border-slate-700 p-4 shadow-xs hover:shadow-md hover:border-sky-300 dark:hover:border-sky-600 transition-all cursor-pointer relative overflow-hidden"
    >
      {/* Top row: Role Avatar, Info & Rating */}
      <div className="flex items-start gap-3.5">
        {/* Role Avatar with status */}
        <div className="relative shrink-0">
          <RoleAvatar
            role="doctor"
            size="lg"
            verificationStatus={doctor.verificationStatus}
          />
          {doctor.isAvailableToday && (
            <span
              className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-md uppercase tracking-wider shadow-xs flex items-center gap-0.5"
              title="Available for consultation today"
            >
              Live
            </span>
          )}
        </div>

        {/* Doctor details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="inline-block text-[11px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md">
              {doctor.specialty}
            </span>

            {/* Rating pill */}
            <div className="flex items-center gap-1 bg-amber-50/80 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-100 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>{doctor.rating.toFixed(2)}</span>
              <span className="text-[10px] text-amber-700/70 dark:text-amber-400/70 font-normal">
                ({doctor.reviewCount})
              </span>
            </div>
          </div>

          <div className="mt-1">
            {doctor.showRealName && doctor.realName ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-sky-600 transition-colors">
                  {doctor.realName}
                </h4>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {doctor.username}
                </span>
              </div>
            ) : (
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-sky-600 transition-colors">
                {doctor.username}
              </h4>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{doctor.clinicName} ({doctor.clinicCity})</span>
          </p>

          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <Award className="w-3 h-3 text-sky-500" />
              {doctor.experienceYears} {t.experienceYears}
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <Clock className="w-3 h-3 text-emerald-500" />
              {doctor.nextAvailable}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom row: Pricing and Book Action */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 block leading-none">
            {t.consultationFee}
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            ${doctor.consultationFee}
            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400"> / session</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id={`view-doctor-btn-${doctor.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectDoctor(doctor);
            }}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
            title="View Details"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            id={`book-doctor-btn-${doctor.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickBook(doctor);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            <Video className="w-3.5 h-3.5" />
            <span>{t.bookConsultation}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
