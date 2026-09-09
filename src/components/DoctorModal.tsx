import React, { useState } from 'react';
import {
  X,
  Star,
  MapPin,
  Calendar,
  Clock,
  Video,
  Phone,
  Building2,
  Award,
  Users,
  CheckCircle2,
  GraduationCap,
  Globe2,
  Heart,
  ShieldCheck,
} from 'lucide-react';
import { DoctorProfile, ConsultationType, Language } from '../types';
import { translations } from '../i18n/translations';
import { RoleAvatar } from './RoleAvatar';

interface DoctorModalProps {
  doctor: DoctorProfile | null;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onConfirmBooking: (
    doctor: DoctorProfile,
    date: string,
    time: string,
    type: ConsultationType,
    notes: string
  ) => void;
}

export const DoctorModal: React.FC<DoctorModalProps> = ({
  doctor,
  isOpen,
  onClose,
  lang,
  onConfirmBooking,
}) => {
  if (!isOpen || !doctor) return null;

  const t = translations[lang];

  const [selectedDate, setSelectedDate] = useState<string>(doctor.availableDates[0] || 'Today');
  const [selectedTime, setSelectedTime] = useState<string>(doctor.timeSlots[0] || '02:30 PM');
  const [consultationType, setConsultationType] = useState<ConsultationType>('video');
  const [patientNotes, setPatientNotes] = useState<string>('');
  const [isBooked, setIsBooked] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  const handleBooking = () => {
    setIsBooked(true);
    setTimeout(() => {
      onConfirmBooking(doctor, selectedDate, selectedTime, consultationType, patientNotes);
      setIsBooked(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      id="doctor-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="doctor-modal-content"
        className="w-full sm:max-w-lg bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-sky-100 dark:border-slate-700 max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-sky-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <RoleAvatar role="doctor" size="sm" verificationStatus={doctor.verificationStatus} />
            <span className="text-xs font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider">
              {t.verifiedDoctorBadge}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="favorite-doctor-btn"
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-500 transition-colors"
              title="Save Doctor"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
            <button
              id="close-doctor-modal-btn"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Doctor Header Card */}
          <div className="flex items-start gap-4">
            <RoleAvatar
              role="doctor"
              size="xl"
              verificationStatus={doctor.verificationStatus}
              className="shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="inline-block text-[11px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-md mb-1">
                {doctor.specialty}
              </span>

              {doctor.showRealName && doctor.realName ? (
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {doctor.realName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{doctor.username}</p>
                </div>
              ) : (
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  {doctor.username}
                </h3>
              )}

              {/* Clinic Practice */}
              <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Building2 size={13} className="text-sky-500" />
                  {doctor.clinicName}
                </p>
                <p className="text-[11px] text-slate-400 pl-4">
                  {doctor.clinicAddress} ({doctor.clinicCity})
                </p>
              </div>

              <div className="flex items-center gap-2 mt-1.5 text-xs">
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>{doctor.rating.toFixed(2)}</span>
                </div>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  {doctor.reviewCount} {t.reviews}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-medium flex items-center gap-0.5">
                  <ShieldCheck size={12} /> {doctor.medicalLicenseNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Key Metrics row */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-sky-50/60 dark:bg-sky-950/40 p-2.5 rounded-2xl border border-sky-100/60 dark:border-sky-900/40 text-center">
              <Award className="w-4 h-4 text-sky-600 mx-auto mb-0.5" />
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {doctor.experienceYears}+ {t.experienceYears}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Experience</div>
            </div>

            <div className="bg-sky-50/60 dark:bg-sky-950/40 p-2.5 rounded-2xl border border-sky-100/60 dark:border-sky-900/40 text-center">
              <Users className="w-4 h-4 text-sky-600 mx-auto mb-0.5" />
              <div className="text-xs font-bold text-slate-900 dark:text-white">{doctor.patientsCount}+</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Patients</div>
            </div>

            <div className="bg-sky-50/60 dark:bg-sky-950/40 p-2.5 rounded-2xl border border-sky-100/60 dark:border-sky-900/40 text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-500 mx-auto mb-0.5" />
              <div className="text-xs font-bold text-slate-900 dark:text-white">{t.verified}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Credentialed</div>
            </div>
          </div>

          {/* About Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
              About Doctor
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {doctor.about}
            </p>
          </div>

          {/* Education & Languages */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/80 space-y-1.5">
            <div className="flex items-start gap-2 text-xs">
              <GraduationCap className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span className="text-slate-700 dark:text-slate-300">{doctor.education}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Globe2 className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300">
                Languages: {doctor.languages.join(', ')}
              </span>
            </div>
          </div>

          {/* Consultation Mode Selection */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
              Select Consultation Mode
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setConsultationType('video')}
                className={`p-2.5 rounded-2xl border text-center transition ${
                  consultationType === 'video'
                    ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 ring-2 ring-sky-600/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Video className="w-4 h-4 mx-auto mb-1 text-sky-600" />
                <div className="text-xs font-bold">Video Call</div>
              </button>

              <button
                type="button"
                onClick={() => setConsultationType('voice')}
                className={`p-2.5 rounded-2xl border text-center transition ${
                  consultationType === 'voice'
                    ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 ring-2 ring-sky-600/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Phone className="w-4 h-4 mx-auto mb-1 text-sky-600" />
                <div className="text-xs font-bold">Voice Call</div>
              </button>

              <button
                type="button"
                onClick={() => setConsultationType('clinic')}
                className={`p-2.5 rounded-2xl border text-center transition ${
                  consultationType === 'clinic'
                    ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 ring-2 ring-sky-600/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Building2 className="w-4 h-4 mx-auto mb-1 text-sky-600" />
                <div className="text-xs font-bold">Clinic Visit</div>
              </button>
            </div>
          </div>

          {/* Date Selector */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              Available Dates
            </h4>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {doctor.availableDates.map((dateStr) => (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedDate === dateStr
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {dateStr}
                </button>
              ))}
            </div>
          </div>

          {/* Time Slots */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              Available Slots
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {doctor.timeSlots.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setSelectedTime(time)}
                  className={`py-1.5 px-2 text-center rounded-xl text-xs font-semibold transition ${
                    selectedTime === time
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms note */}
          <div>
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-1">
              Symptoms / Medical Reason (Optional)
            </label>
            <textarea
              value={patientNotes}
              onChange={(e) => setPatientNotes(e.target.value)}
              placeholder="e.g. Mild chest flutter, requesting clinical evaluation..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Footer with Price and Confirm Button */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block leading-none">
              {t.consultationFee}
            </span>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white">
              ${doctor.consultationFee}
            </span>
          </div>

          <button
            id="confirm-booking-btn"
            type="button"
            disabled={isBooked}
            onClick={handleBooking}
            className="flex-1 py-3 px-5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {isBooked ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300 animate-bounce" />
                <span>Confirmed!</span>
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                <span>Confirm Appointment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
