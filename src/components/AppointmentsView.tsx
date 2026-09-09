import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Phone,
  Building2,
  FileText,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { Appointment, Language } from '../types';
import { RoleAvatar } from './RoleAvatar';
import { translations } from '../i18n/translations';

interface AppointmentsViewProps {
  appointments: Appointment[];
  onStartVideoCall: (appointment: Appointment) => void;
  onCancelAppointment: (id: string) => void;
  onNavigateHome: () => void;
  lang: Language;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  appointments,
  onStartVideoCall,
  onCancelAppointment,
  onNavigateHome,
  lang,
}) => {
  const [filter, setFilter] = useState<'upcoming' | 'completed'>('upcoming');
  const t = translations[lang];

  const filteredList = appointments.filter((app) =>
    filter === 'upcoming' ? app.status === 'upcoming' : app.status === 'completed'
  );

  return (
    <div id="appointments-view" className="space-y-4 pb-20 text-slate-900 dark:text-slate-100">
      {/* View Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          My Consultations
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Scheduled video sessions, clinic visits, and past medical interactions
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
        <button
          id="tab-upcoming-appointments"
          type="button"
          onClick={() => setFilter('upcoming')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            filter === 'upcoming'
              ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          Upcoming ({appointments.filter((a) => a.status === 'upcoming').length})
        </button>
        <button
          id="tab-past-appointments"
          type="button"
          onClick={() => setFilter('completed')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            filter === 'completed'
              ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          Past ({appointments.filter((a) => a.status === 'completed').length})
        </button>
      </div>

      {/* Appointments List */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="text-center py-10 px-4 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs">
            <div className="w-12 h-12 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">
              No {filter} appointments
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              {filter === 'upcoming'
                ? 'You do not have any consultations queued. Browse certified specialists to book a session.'
                : 'No past appointments found in your health records.'}
            </p>
            {filter === 'upcoming' && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                Find Specialists
              </button>
            )}
          </div>
        ) : (
          filteredList.map((app) => (
            <div
              key={app.id}
              id={`appointment-card-${app.id}`}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs space-y-3"
            >
              {/* Doctor Row */}
              <div className="flex items-start gap-3">
                <RoleAvatar role="doctor" size="md" verificationStatus="verified" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md">
                      {app.doctorSpecialty}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        app.status === 'upcoming'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
                    {app.doctorRealName ? `${app.doctorRealName} (${app.doctorUsername})` : app.doctorUsername}
                  </h3>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{app.clinicName || app.clinicAddress}</span>
                  </p>
                </div>
              </div>

              {/* Date & Time pill */}
              <div className="bg-sky-50/50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-sky-100/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                  <CalendarIcon className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>{app.date}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                  <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>{app.time}</span>
                </div>
                <div className="flex items-center gap-1 font-semibold text-sky-800 dark:text-sky-300 capitalize text-[11px]">
                  {app.type === 'video' ? (
                    <Video className="w-3.5 h-3.5 text-sky-600" />
                  ) : app.type === 'voice' ? (
                    <Phone className="w-3.5 h-3.5 text-sky-600" />
                  ) : (
                    <Building2 className="w-3.5 h-3.5 text-sky-600" />
                  )}
                  <span>{app.type}</span>
                </div>
              </div>

              {/* Patient Note */}
              {app.patientNotes && (
                <div className="text-[11px] bg-slate-50 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 p-2 rounded-lg border border-slate-100 dark:border-slate-700 flex items-start gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span className="line-clamp-2 italic">"{app.patientNotes}"</span>
                </div>
              )}

              {/* Actions */}
              {app.status === 'upcoming' ? (
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => onCancelAppointment(app.id)}
                    className="py-1.5 px-3 text-slate-500 hover:text-rose-600 text-xs font-semibold rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => onStartVideoCall(app)}
                    className="flex-1 py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Call</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Consultation Completed
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
