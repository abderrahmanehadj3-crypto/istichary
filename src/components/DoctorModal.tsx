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
} from 'lucide-react';
import { Doctor, ConsultationType } from '../types';

interface DoctorModalProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmBooking: (
    doctor: Doctor,
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
  onConfirmBooking,
}) => {
  if (!isOpen || !doctor) return null;

  const [selectedDate, setSelectedDate] = useState<string>(doctor.availableDates[0] || 'Today, Oct 12');
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="doctor-modal-content"
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-sky-100 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-sky-50/50">
          <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">
            Doctor Profile & Booking
          </span>
          <div className="flex items-center gap-2">
            <button
              id="favorite-doctor-btn"
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 rounded-full hover:bg-white text-slate-400 hover:text-rose-500 transition-colors"
              title="Save Doctor"
            >
              <Heart
                className={`w-5 h-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`}
              />
            </button>
            <button
              id="close-doctor-modal-btn"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white text-slate-400 hover:text-slate-700 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 no-scrollbar">
          {/* Doctor Header Card */}
          <div className="flex items-start gap-4">
            <img
              src={doctor.avatar}
              alt={doctor.name}
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-sky-100 shadow-sm flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="inline-block text-[11px] font-semibold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md mb-1">
                {doctor.specialty}
              </span>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                {doctor.name}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>{doctor.hospital}</span>
              </p>

              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <div className="flex items-center gap-1 text-amber-600 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>{doctor.rating.toFixed(2)}</span>
                </div>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500 text-[11px]">{doctor.reviewCount} reviews</span>
              </div>
            </div>
          </div>

          {/* Key Metrics row */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-sky-50/60 p-3 rounded-2xl border border-sky-100/60 text-center">
              <Award className="w-4 h-4 text-sky-600 mx-auto mb-1" />
              <div className="text-xs font-bold text-slate-900">{doctor.experienceYears}+ Years</div>
              <div className="text-[10px] text-slate-500 font-medium">Experience</div>
            </div>

            <div className="bg-sky-50/60 p-3 rounded-2xl border border-sky-100/60 text-center">
              <Users className="w-4 h-4 text-sky-600 mx-auto mb-1" />
              <div className="text-xs font-bold text-slate-900">{doctor.patientsCount}+</div>
              <div className="text-[10px] text-slate-500 font-medium">Patients</div>
            </div>

            <div className="bg-sky-50/60 p-3 rounded-2xl border border-sky-100/60 text-center">
              <Star className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <div className="text-xs font-bold text-slate-900">{doctor.rating.toFixed(1)}/5</div>
              <div className="text-[10px] text-slate-500 font-medium">Top Rated</div>
            </div>
          </div>

          {/* About Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              About Doctor
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {doctor.about}
            </p>
          </div>

          {/* Education & Languages */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex items-start gap-2 text-xs">
              <GraduationCap className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">{doctor.education}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Globe2 className="w-4 h-4 text-sky-600 flex-shrink-0" />
              <span className="text-slate-700">Languages: {doctor.languages.join(', ')}</span>
            </div>
          </div>

          {/* Specialization Services */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Clinical Services
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {doctor.services.map((service, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-sky-50 text-sky-800 text-[11px] font-medium rounded-lg border border-sky-100"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>

          {/* Consultation Format Selection */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Select Consultation Mode
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                id="mode-video-btn"
                type="button"
                onClick={() => setConsultationType('video')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  consultationType === 'video'
                    ? 'border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-600/20 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-sky-200'
                }`}
              >
                <Video
                  className={`w-5 h-5 mx-auto mb-1 ${
                    consultationType === 'video' ? 'text-sky-600' : 'text-slate-500'
                  }`}
                />
                <div className="text-xs font-bold">Video Call</div>
                <div className="text-[10px] text-slate-500">Telehealth HD</div>
              </button>

              <button
                id="mode-voice-btn"
                type="button"
                onClick={() => setConsultationType('voice')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  consultationType === 'voice'
                    ? 'border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-600/20 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-sky-200'
                }`}
              >
                <Phone
                  className={`w-5 h-5 mx-auto mb-1 ${
                    consultationType === 'voice' ? 'text-sky-600' : 'text-slate-500'
                  }`}
                />
                <div className="text-xs font-bold">Voice Call</div>
                <div className="text-[10px] text-slate-500">Direct Audio</div>
              </button>

              <button
                id="mode-clinic-btn"
                type="button"
                onClick={() => setConsultationType('clinic')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  consultationType === 'clinic'
                    ? 'border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-600/20 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-sky-200'
                }`}
              >
                <Building2
                  className={`w-5 h-5 mx-auto mb-1 ${
                    consultationType === 'clinic' ? 'text-sky-600' : 'text-slate-500'
                  }`}
                />
                <div className="text-xs font-bold">Clinic Visit</div>
                <div className="text-[10px] text-slate-500">In-Person</div>
              </button>
            </div>
          </div>

          {/* Date Selector */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              Available Dates
            </h4>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {doctor.availableDates.map((dateStr) => {
                const isSelected = selectedDate === dateStr;
                return (
                  <button
                    key={dateStr}
                    id={`date-slot-${dateStr.replace(/[^a-zA-Z0-9]/g, '')}`}
                    type="button"
                    onClick={() => setSelectedDate(dateStr)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-sky-50'
                    }`}
                  >
                    {dateStr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              Available Slots
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {doctor.timeSlots.map((time) => {
                const isSelected = selectedTime === time;
                return (
                  <button
                    key={time}
                    id={`time-slot-${time.replace(/[^a-zA-Z0-9]/g, '')}`}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`py-2 px-2 text-center rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-sky-600 text-white ring-2 ring-sky-600/30 shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-sky-300'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Patient Symptoms Note */}
          <div>
            <label
              htmlFor="patient-symptoms-input"
              className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5"
            >
              Symptoms / Reason for Visit (Optional)
            </label>
            <textarea
              id="patient-symptoms-input"
              value={patientNotes}
              onChange={(e) => setPatientNotes(e.target.value)}
              placeholder="e.g. Mild chest pressure after stairs, or requesting prescription review..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:bg-white"
            />
          </div>
        </div>

        {/* Footer with Price and Confirm Button */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block leading-none">
              Total Consultation
            </span>
            <span className="text-lg font-extrabold text-slate-900">
              ${doctor.consultationFee}
            </span>
          </div>

          <button
            id="confirm-booking-btn"
            type="button"
            disabled={isBooked}
            onClick={handleBooking}
            className="flex-1 py-3 px-5 bg-sky-600 hover:bg-sky-700 active:scale-98 text-white text-xs font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {isBooked ? (
              <>
                <CheckCircle2 className="w-4 h-4 animate-bounce text-emerald-300" />
                <span>Booking Confirmed!</span>
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
