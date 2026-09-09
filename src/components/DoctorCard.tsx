import React from 'react';
import { Star, Award, ShieldCheck, UserPlus, UserCheck, Stethoscope } from 'lucide-react';
import { DoctorProfile, Language } from '../types';
import { translations } from '../i18n/translations';
import { RoleAvatar } from './RoleAvatar';

interface DoctorCardProps {
  doctor: DoctorProfile;
  lang: Language;
  isFollowed: boolean;
  onToggleFollow: (doctorId: string) => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  lang,
  isFollowed,
  onToggleFollow,
}) => {
  const t = translations[lang];

  return (
    <div
      id={`doctor-card-${doctor.id}`}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs hover:border-sky-300 dark:hover:border-sky-600 transition-all space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <RoleAvatar
            role="doctor"
            size="md"
            verificationStatus={doctor.verificationStatus}
            className="shrink-0 mt-0.5"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {doctor.realName || doctor.username}
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                {doctor.username}
              </span>
            </div>

            {/* MANDATORY PROMINENT SPECIALTY DISPLAY */}
            <div className="mt-1">
              <span
                id={`card-specialty-${doctor.id}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs"
              >
                <Award size={12} className="text-emerald-600 dark:text-emerald-400" />
                <span>{doctor.specialty}</span>
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {doctor.hospitalOrClinic} • {doctor.experienceYears} yrs experience
            </p>
          </div>
        </div>

        {/* FOLLOW BUTTON */}
        <button
          id={`btn-card-follow-${doctor.id}`}
          type="button"
          onClick={() => onToggleFollow(doctor.id)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            isFollowed
              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
              : 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs'
          }`}
        >
          {isFollowed ? (
            <>
              <UserCheck size={13} />
              <span>{t.followingDoctor}</span>
            </>
          ) : (
            <>
              <UserPlus size={13} />
              <span>{t.followDoctor}</span>
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
        {doctor.about}
      </p>

      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/60">
        <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-300">
          Lic. #{doctor.medicalLicenseNumber}
        </span>
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
          <ShieldCheck size={13} />
          Board Verified Specialist
        </span>
      </div>
    </div>
  );
};
