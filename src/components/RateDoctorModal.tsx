import React, { useState } from 'react';
import { Star, X, Award, ShieldCheck, CheckCircle2, MessageSquare } from 'lucide-react';
import { DoctorProfile, Language } from '../types';
import { translations } from '../i18n/translations';
import { RoleAvatar } from './RoleAvatar';

interface RateDoctorModalProps {
  isOpen: boolean;
  doctor: DoctorProfile | null;
  lang: Language;
  onClose: () => void;
  onSubmitRating: (doctorId: string, stars: number, feedback?: string) => void;
}

export const RateDoctorModal: React.FC<RateDoctorModalProps> = ({
  isOpen,
  doctor,
  lang,
  onClose,
  onSubmitRating,
}) => {
  const t = translations[lang];
  const [stars, setStars] = useState<number>(5);
  const [hoverStars, setHoverStars] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!isOpen || !doctor) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitRating(doctor.id, stars, feedback.trim() || undefined);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      id="rate-doctor-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-5 sm:p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Star className="fill-amber-400" size={16} />
            <span>{t.rateDoctorModalTitle}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Doctor Identity Header */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-100 dark:border-slate-800">
          <RoleAvatar role="doctor" size="md" verificationStatus={doctor.verificationStatus} />
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {doctor.realName || doctor.username}
            </h4>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                <Award size={11} />
                {doctor.specialty}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Lic. #{doctor.medicalLicenseNumber}
              </span>
            </div>
          </div>
        </div>

        {isSubmitted ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 size={28} />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{t.ratingSuccess}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Interactive Stars Picker */}
            <div className="text-center space-y-2 py-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {t.ratingStars} (1 - 5)
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((starIndex) => {
                  const isFilled =
                    hoverStars !== null ? starIndex <= hoverStars : starIndex <= stars;
                  return (
                    <button
                      key={starIndex}
                      type="button"
                      onClick={() => setStars(starIndex)}
                      onMouseEnter={() => setHoverStars(starIndex)}
                      onMouseLeave={() => setHoverStars(null)}
                      className="p-1.5 transition-transform hover:scale-125 cursor-pointer"
                      title={`${starIndex} Stars`}
                    >
                      <Star
                        size={28}
                        className={
                          isFilled
                            ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                            : 'text-slate-300 dark:text-slate-600'
                        }
                      />
                    </button>
                  );
                })}
              </div>
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {stars === 5 && '⭐⭐⭐⭐⭐ Exceptional Guidance'}
                {stars === 4 && '⭐⭐⭐⭐ Very Good Consultation'}
                {stars === 3 && '⭐⭐⭐ Helpful Guidance'}
                {stars === 2 && '⭐⭐ Adequate'}
                {stars === 1 && '⭐ Needs Improvement'}
              </div>
            </div>

            {/* Optional Feedback */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.ratingPrompt}
              </label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="How helpful and clear was this specialist's consultation advice?"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                id="btn-submit-doctor-rating"
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Star size={13} className="fill-white" />
                <span>{t.submitRating}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
