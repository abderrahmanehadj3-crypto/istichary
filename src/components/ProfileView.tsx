import React, { useState } from 'react';
import {
  Shield,
  Heart,
  Phone,
  AlertTriangle,
  FileText,
  CreditCard,
  BellRing,
  Settings,
  ChevronRight,
  Activity,
  Droplet,
} from 'lucide-react';
import { PatientProfile } from '../types';

interface ProfileViewProps {
  profile: PatientProfile;
  onEmergencyClick: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onEmergencyClick,
}) => {
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [telehealthSync, setTelehealthSync] = useState(true);

  return (
    <div id="profile-view" className="px-5 pt-5 pb-24 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Health Profile
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Patient biometric records, allergies, and emergency data
        </p>
      </div>

      {/* Patient Card */}
      <div className="bg-white rounded-3xl border border-sky-100 p-4.5 shadow-xs relative overflow-hidden">
        <div className="flex items-center gap-3.5">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
            alt={profile.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-sky-100 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-bold text-slate-900">{profile.name}</h3>
              <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 text-[10px] font-bold rounded-md border border-sky-100">
                Verified Patient
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Age {profile.age} • General Patient ID #48291</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                <Droplet className="w-3 h-3 text-rose-500" />
                Blood {profile.bloodType}
              </span>
              <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-500" />
                Vitals Normal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Biometric Vitals Quick Grid */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-sky-50/70 p-2.5 rounded-2xl border border-sky-100/60 text-center">
          <span className="text-[10px] text-slate-500 font-semibold block">Blood</span>
          <span className="text-sm font-extrabold text-sky-900">{profile.bloodType}</span>
        </div>
        <div className="bg-sky-50/70 p-2.5 rounded-2xl border border-sky-100/60 text-center">
          <span className="text-[10px] text-slate-500 font-semibold block">Height</span>
          <span className="text-sm font-extrabold text-sky-900">{profile.height}</span>
        </div>
        <div className="bg-sky-50/70 p-2.5 rounded-2xl border border-sky-100/60 text-center">
          <span className="text-[10px] text-slate-500 font-semibold block">Weight</span>
          <span className="text-sm font-extrabold text-sky-900">{profile.weight}</span>
        </div>
        <div className="bg-sky-50/70 p-2.5 rounded-2xl border border-sky-100/60 text-center">
          <span className="text-[10px] text-slate-500 font-semibold block">Pulse</span>
          <span className="text-sm font-extrabold text-sky-900">72 bpm</span>
        </div>
      </div>

      {/* Allergies & Conditions */}
      <div className="bg-white rounded-2xl border border-sky-100 p-4 space-y-3 shadow-xs">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Documented Allergies</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {profile.allergies.map((allergy, i) => (
              <span
                key={i}
                className="px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg border border-rose-100"
              >
                {allergy}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            <Shield className="w-3.5 h-3.5 text-sky-600" />
            <span>Chronic Conditions</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {profile.chronicConditions.map((cond, i) => (
              <span
                key={i}
                className="px-2.5 py-1 bg-sky-50 text-sky-800 text-xs font-medium rounded-lg border border-sky-100"
              >
                {cond}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-gradient-to-r from-rose-500/10 via-rose-50 to-white rounded-2xl border border-rose-100 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Emergency SOS Contact</h4>
              <p className="text-[11px] text-slate-600">
                {profile.emergencyContact.name} ({profile.emergencyContact.relationship})
              </p>
              <p className="text-xs font-bold text-rose-700">{profile.emergencyContact.phone}</p>
            </div>
          </div>
          <button
            id="profile-sos-call-btn"
            type="button"
            onClick={onEmergencyClick}
            className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            Call SOS
          </button>
        </div>
      </div>

      {/* Settings & Preferences */}
      <div className="bg-white rounded-2xl border border-sky-100 p-3 space-y-1 shadow-xs text-xs">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <BellRing className="w-4 h-4 text-sky-600" />
            <span>Consultation Reminders</span>
          </div>
          <input
            type="checkbox"
            checked={remindersEnabled}
            onChange={() => setRemindersEnabled(!remindersEnabled)}
            className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <Activity className="w-4 h-4 text-sky-600" />
            <span>Sync Apple Health / Google Fit</span>
          </div>
          <input
            type="checkbox"
            checked={telehealthSync}
            onChange={() => setTelehealthSync(!telehealthSync)}
            className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <FileText className="w-4 h-4 text-sky-600" />
            <span>Insurance & Medical Claims</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <CreditCard className="w-4 h-4 text-sky-600" />
            <span>Payment Methods</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </div>
  );
};
