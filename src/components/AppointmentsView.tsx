import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Phone,
  Building2,
  AlertCircle,
  FileText,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { Appointment } from '../types';

interface AppointmentsViewProps {
  appointments: Appointment[];
  onStartVideoCall: (appointment: Appointment) => void;
  onCancelAppointment: (id: string) => void;
  onNavigateHome: () => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  appointments,
  onStartVideoCall,
  onCancelAppointment,
  onNavigateHome,
}) => {
  const [filter, setFilter] = useState<'upcoming' | 'completed'>('upcoming');

  const filteredList = appointments.filter((app) =>
    filter === 'upcoming' ? app.status === 'upcoming' : app.status === 'completed'
  );

  return (
    <div id="appointments-view" className="px-5 pt-5 pb-24 space-y-4">
      {/* View Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          My Consultations
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your scheduled and past telehealth appointments
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl">
        <button
          id="tab-upcoming-appointments"
          type="button"
          onClick={() => setFilter('upcoming')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            filter === 'upcoming'
              ? 'bg-white text-sky-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
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
              ? 'bg-white text-sky-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Past Visits ({appointments.filter((a) => a.status === 'completed').length})
        </button>
      </div>

      {/* Appointments List */}
      <div className="space-y-3.5">
        {filteredList.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-3xl border border-sky-100/70 p-6 shadow-xs">
            <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No {filter} appointments</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {filter === 'upcoming'
                ? 'You do not have any consultations queued. Browse certified specialists to book a session.'
                : 'No past appointments found in your digital health records.'}
            </p>
            {filter === 'upcoming' && (
              <button
                id="book-first-consultation-btn"
                type="button"
                onClick={onNavigateHome}
                className="mt-4 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
              >
                Find & Book Doctor
              </button>
            )}
          </div>
        ) : (
          filteredList.map((app) => (
            <div
              key={app.id}
              id={`appointment-card-${app.id}`}
              className="bg-white rounded-2xl border border-sky-100 p-4 shadow-xs hover:border-sky-200 transition-all space-y-3.5"
            >
              {/* Doctor Row */}
              <div className="flex items-start gap-3">
                <img
                  src={app.doctorAvatar}
                  alt={app.doctorName}
                  className="w-14 h-14 rounded-2xl object-cover ring-1 ring-sky-100"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                      {app.doctorSpecialty}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        app.status === 'upcoming'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-1 truncate">
                    {app.doctorName}
                  </h3>

                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{app.hospital}</span>
                  </p>
                </div>
              </div>

              {/* Date & Time pill */}
              <div className="bg-sky-50/50 p-2.5 rounded-xl border border-sky-100/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <CalendarIcon className="w-3.5 h-3.5 text-sky-600" />
                  <span>{app.date}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  <span>{app.time}</span>
                </div>
                <div className="flex items-center gap-1 font-semibold text-sky-800 capitalize text-[11px]">
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

              {/* Patient Note if any */}
              {app.patientNotes && (
                <div className="text-[11px] bg-slate-50 text-slate-600 p-2 rounded-lg border border-slate-100 flex items-start gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2 italic">"{app.patientNotes}"</span>
                </div>
              )}

              {/* Actions */}
              {app.status === 'upcoming' ? (
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    id={`cancel-btn-${app.id}`}
                    type="button"
                    onClick={() => onCancelAppointment(app.id)}
                    className="py-2 px-3 text-slate-500 hover:text-rose-600 text-xs font-semibold rounded-xl hover:bg-rose-50 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    id={`join-call-btn-${app.id}`}
                    type="button"
                    onClick={() => onStartVideoCall(app)}
                    className="flex-1 py-2 px-4 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Video Call</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Consultation Completed
                  </span>
                  <button
                    id={`view-prescription-btn-${app.id}`}
                    type="button"
                    className="text-sky-600 font-semibold hover:text-sky-700 text-xs"
                  >
                    View Summary & Rx
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
