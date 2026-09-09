import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Building2,
  Clock,
  Phone,
  ShieldCheck,
  Star,
  Award,
  Filter,
  UserPlus,
  UserCheck,
  ChevronRight,
  AlertCircle,
  Stethoscope,
  Sparkles,
} from 'lucide-react';
import { DoctorProfile, Language, UserAccount } from '../types';
import { translations } from '../i18n/translations';
import { RoleAvatar } from './RoleAvatar';

interface NearbyDoctorsViewProps {
  doctors: DoctorProfile[];
  currentUser: UserAccount | null;
  lang: Language;
  followedDoctorIds: string[];
  onToggleFollow: (doctorId: string) => void;
  onOpenRatingModal: (doctor: DoctorProfile) => void;
  onNavigateToProfileClinic?: () => void;
  onRequestAuth: () => void;
}

export const NearbyDoctorsView: React.FC<NearbyDoctorsViewProps> = ({
  doctors,
  currentUser,
  lang,
  followedDoctorIds,
  onToggleFollow,
  onOpenRatingModal,
  onNavigateToProfileClinic,
  onRequestAuth,
}) => {
  const t = translations[lang];

  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique cities from doctors who have set clinicCity
  const cities = useMemo(() => {
    const list = new Set<string>();
    doctors.forEach((d) => {
      if (d.clinicCity && d.verificationStatus === 'verified') {
        list.add(d.clinicCity);
      }
    });
    return Array.from(list);
  }, [doctors]);

  // Filter verified doctors only (pending doctors cannot display public clinic addresses until approved)
  const verifiedDoctorsWithClinics = useMemo(() => {
    return doctors.filter((doc) => {
      if (doc.verificationStatus !== 'verified') return false;
      if (!doc.clinicCity && !doc.clinicAddress) return false;

      // City filter
      if (selectedCity !== 'all' && doc.clinicCity?.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }

      // Specialty filter
      if (selectedSpecialty !== 'all' && doc.specializationId !== selectedSpecialty) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName =
          (doc.realName && doc.realName.toLowerCase().includes(q)) ||
          doc.username.toLowerCase().includes(q);
        const matchesSpecialty = doc.specialty.toLowerCase().includes(q);
        const matchesClinic = doc.hospitalOrClinic.toLowerCase().includes(q);
        const matchesCity = doc.clinicCity ? doc.clinicCity.toLowerCase().includes(q) : false;
        const matchesAddress = doc.clinicAddress ? doc.clinicAddress.toLowerCase().includes(q) : false;

        if (!matchesName && !matchesSpecialty && !matchesClinic && !matchesCity && !matchesAddress) {
          return false;
        }
      }

      return true;
    });
  }, [doctors, selectedCity, selectedSpecialty, searchQuery]);

  const isVerifiedDoctor =
    currentUser?.role === 'doctor' && currentUser?.verificationStatus === 'verified';

  return (
    <div id="nearby-doctors-view" className="space-y-4 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-sky-600 to-indigo-700 text-white rounded-3xl p-5 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
            <MapPin size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">{t.nearbyDoctorsTitle}</h2>
            <p className="text-xs text-sky-100">{t.nearbyDoctorsSubtitle}</p>
          </div>
        </div>

        {/* STRICT PERMISSION SECURITY NOTICE */}
        <div className="mt-3 p-3 bg-white/10 rounded-2xl border border-white/20 text-xs text-white/95 leading-relaxed space-y-1">
          <div className="flex items-start gap-2">
            <ShieldCheck size={16} className="text-emerald-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-200">
                {t.onlyVerifiedDoctorsCanSetLocation}
              </p>
              <p className="text-[11px] text-white/80 mt-0.5">
                {t.patientsCannotAddClinics}
              </p>
            </div>
          </div>

          {isVerifiedDoctor && onNavigateToProfileClinic && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onNavigateToProfileClinic}
                className="px-3 py-1.5 rounded-xl bg-white text-sky-700 text-xs font-bold hover:bg-sky-50 transition shadow-xs cursor-pointer"
              >
                {t.practiceDetails} →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters: City selector & Search */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 shadow-xs space-y-3">
        {/* City Filter Pills */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
            {t.filterByCity}
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCity('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCity === 'all'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {t.allCities}
            </button>
            {cities.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedCity === city
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                📍 {city}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Search */}
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by doctor name, specialty, or clinic address..."
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Verified Doctors & Clinics Listing */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
          <span>
            {verifiedDoctorsWithClinics.length} {t.allDoctors}
          </span>
          {selectedCity !== 'all' && (
            <span className="text-sky-600 dark:text-sky-400 font-semibold">
              📍 {selectedCity}
            </span>
          )}
        </div>

        {verifiedDoctorsWithClinics.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-2">
            <Building2 size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t.noNearbyDoctorsFound}
            </p>
            <button
              onClick={() => {
                setSelectedCity('all');
                setSearchQuery('');
              }}
              className="text-xs text-sky-600 dark:text-sky-400 font-bold hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          verifiedDoctorsWithClinics.map((doctor) => {
            const isFollowed = followedDoctorIds.includes(doctor.id);

            return (
              <div
                key={doctor.id}
                id={`nearby-doc-${doctor.id}`}
                className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-xs hover:border-sky-300 dark:hover:border-sky-600 transition-all space-y-3.5"
              >
                {/* Doctor Identity & Star Rating Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <RoleAvatar
                      role="doctor"
                      size="md"
                      verificationStatus={doctor.verificationStatus}
                      className="shrink-0 mt-0.5"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {doctor.realName || doctor.username}
                        </h4>
                        <span className="text-xs text-slate-400 font-mono">
                          {doctor.username}
                        </span>
                      </div>

                      {/* MANDATORY PROMINENT SPECIALTY BADGE */}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                          id={`nearby-specialty-${doctor.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs"
                        >
                          <Award size={12} className="text-emerald-600 dark:text-emerald-400" />
                          <span>{doctor.specialty}</span>
                        </span>

                        {/* STAR RATING DISPLAY */}
                        <div
                          id={`doctor-rating-pill-${doctor.id}`}
                          className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-800 dark:text-amber-300"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          <span>{doctor.rating.toFixed(1)}</span>
                          <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-normal">
                            ({doctor.reviewCount} {t.basedOnReviews})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Follow button */}
                  <button
                    id={`btn-nearby-follow-${doctor.id}`}
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

                {/* VERIFIED CLINIC PRACTICE DETAILS */}
                <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                    <Building2 size={15} className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                    <span className="truncate">
                      {doctor.hospitalOrClinic}
                    </span>
                  </div>

                  {doctor.clinicAddress && (
                    <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                      <MapPin size={15} className="text-rose-500 shrink-0 mt-0.5" />
                      <span>{doctor.clinicAddress}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                    {doctor.clinicWorkingHours && (
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-slate-400" />
                        <span>{doctor.clinicWorkingHours}</span>
                      </div>
                    )}

                    {doctor.clinicPhone && (
                      <div className="flex items-center gap-1 font-mono">
                        <Phone size={12} className="text-emerald-500" />
                        <span>{doctor.clinicPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom row: Rate doctor button & verification badge */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                    <ShieldCheck size={14} />
                    <span>Board Verified License #{doctor.medicalLicenseNumber}</span>
                  </div>

                  {/* Rate Doctor Button (Patients can rate verified doctors) */}
                  <button
                    id={`btn-rate-doc-${doctor.id}`}
                    type="button"
                    onClick={() => {
                      if (!currentUser) {
                        onRequestAuth();
                      } else {
                        onOpenRatingModal(doctor);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-xs transition cursor-pointer"
                  >
                    <Star size={13} className="fill-amber-400 text-amber-500" />
                    <span>{t.rateDoctor}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
