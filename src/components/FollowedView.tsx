import React from 'react';
import { Heart, UserCheck, Stethoscope, Award, ArrowRight, MessageSquare } from 'lucide-react';
import { DoctorProfile, ConsultationPost, Language, UserAccount } from '../types';
import { translations } from '../i18n/translations';
import { DoctorCard } from './DoctorCard';

interface FollowedViewProps {
  followedDoctorIds: string[];
  doctors: DoctorProfile[];
  posts: ConsultationPost[];
  lang: Language;
  currentUser: UserAccount | null;
  onToggleFollow: (doctorId: string) => void;
  onSelectConsultationTab: () => void;
  onRequestAuth: () => void;
}

export const FollowedView: React.FC<FollowedViewProps> = ({
  followedDoctorIds,
  doctors,
  posts,
  lang,
  currentUser,
  onToggleFollow,
  onSelectConsultationTab,
  onRequestAuth,
}) => {
  const t = translations[lang];

  const followedDoctors = doctors.filter((d) => followedDoctorIds.includes(d.id));
  const suggestedDoctors = doctors.filter(
    (d) => !followedDoctorIds.includes(d.id) && d.verificationStatus === 'verified'
  );

  return (
    <div id="followed-doctors-view" className="space-y-4 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl p-4 shadow-sm space-y-1">
        <div className="flex items-center gap-2">
          <Heart size={18} className="fill-white" />
          <h2 className="text-base font-bold">
            {t.followedDoctors}
          </h2>
        </div>
        <p className="text-xs text-amber-100 leading-relaxed">
          Stay connected with verified medical specialists you trust. View their clinical answers and consultation responses.
        </p>
      </div>

      {/* Followed Doctors List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Your Trusted Specialists ({followedDoctors.length})
        </h3>

        {followedDoctors.length === 0 ? (
          <div className="p-6 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <UserCheck size={32} className="mx-auto text-amber-400" />
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium max-w-sm mx-auto">
              {t.noFollowedDoctors}
            </p>
            <button
              onClick={onSelectConsultationTab}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Explore Consultations Feed</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {followedDoctors.map((doc) => (
              <DoctorCard
                key={doc.id}
                doctor={doc}
                lang={lang}
                isFollowed={true}
                onToggleFollow={onToggleFollow}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recommended Verified Specialists to Follow */}
      {suggestedDoctors.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Recommended Verified Physicians
          </h3>
          <div className="space-y-3">
            {suggestedDoctors.slice(0, 3).map((doc) => (
              <DoctorCard
                key={doc.id}
                doctor={doc}
                lang={lang}
                isFollowed={false}
                onToggleFollow={onToggleFollow}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
