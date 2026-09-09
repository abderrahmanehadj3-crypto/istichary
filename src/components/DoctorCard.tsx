import React from 'react';
import { Star, MapPin, Clock, Video, Award, ChevronRight } from 'lucide-react';
import { Doctor } from '../types';

interface DoctorCardProps {
  doctor: Doctor;
  onSelectDoctor: (doctor: Doctor) => void;
  onQuickBook: (doctor: Doctor) => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onSelectDoctor,
  onQuickBook,
}) => {
  return (
    <div
      id={`doctor-card-${doctor.id}`}
      onClick={() => onSelectDoctor(doctor)}
      className="group bg-white rounded-2xl border border-sky-100/80 p-4 shadow-xs hover:shadow-md hover:border-sky-300 transition-all cursor-pointer relative overflow-hidden"
    >
      {/* Top row: Avatar, Info & Rating */}
      <div className="flex items-start gap-3.5">
        {/* Avatar with status */}
        <div className="relative flex-shrink-0">
          <img
            src={doctor.avatar}
            alt={doctor.name}
            className="w-18 h-18 rounded-2xl object-cover ring-2 ring-sky-50 shadow-xs group-hover:scale-102 transition-transform"
          />
          {doctor.isAvailableToday && (
            <span
              className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-md uppercase tracking-wider shadow-xs flex items-center gap-0.5"
              title="Available for immediate booking"
            >
              Live
            </span>
          )}
        </div>

        {/* Doctor details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="inline-block text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
              {doctor.specialty}
            </span>

            {/* Rating pill */}
            <div className="flex items-center gap-1 bg-amber-50/80 px-2 py-0.5 rounded-md border border-amber-100 text-amber-800 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>{doctor.rating.toFixed(2)}</span>
              <span className="text-[10px] text-amber-700/70 font-normal">
                ({doctor.reviewCount})
              </span>
            </div>
          </div>

          <h4 className="text-base font-bold text-slate-900 mt-1 truncate group-hover:text-sky-700 transition-colors">
            {doctor.name}
          </h4>

          <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span>{doctor.hospital}</span>
          </p>

          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Award className="w-3 h-3 text-sky-500" />
              {doctor.experienceYears} yrs exp
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 text-slate-600">
              <Clock className="w-3 h-3 text-emerald-500" />
              {doctor.nextAvailable}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom row: Pricing and Book Action */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 block leading-none">
            Consultation Fee
          </span>
          <span className="text-sm font-bold text-slate-900">
            ${doctor.consultationFee}
            <span className="text-[11px] font-normal text-slate-500"> / session</span>
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
            className="p-2 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-xl transition-colors"
            title="View Doctor Details"
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
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Book Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
