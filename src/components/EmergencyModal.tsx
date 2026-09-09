import React, { useState } from 'react';
import { Phone, X, AlertTriangle, MapPin, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { PatientProfile } from '../types';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PatientProfile;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  if (!isOpen) return null;

  const [simulatedCall, setSimulatedCall] = useState<string | null>(null);

  const handleDial = (target: string) => {
    setSimulatedCall(target);
    setTimeout(() => {
      setSimulatedCall(null);
      onClose();
    }, 2000);
  };

  return (
    <div
      id="emergency-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        id="emergency-modal-content"
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-rose-200 p-5 space-y-4 animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-rose-100">
          <div className="flex items-center gap-2 text-rose-600">
            <div className="p-2 bg-rose-100 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Emergency Assistance</h3>
              <p className="text-[11px] text-slate-500">24/7 Urgent Medical Dispatch</p>
            </div>
          </div>
          <button
            id="close-emergency-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Location Beacon */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs flex items-center gap-2">
          <MapPin className="w-4 h-4 text-sky-600 flex-shrink-0" />
          <div>
            <span className="font-semibold text-slate-800">Your Current GPS Coordinates:</span>
            <p className="text-slate-500 text-[11px]">42.3601° N, 71.0589° W (Central Boston)</p>
          </div>
        </div>

        {/* Immediate Call Options */}
        <div className="space-y-2.5">
          <button
            id="call-911-btn"
            type="button"
            onClick={() => handleDial('Emergency Services (911)')}
            className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-2xl font-bold text-sm shadow-md flex items-center justify-between transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Phone className="w-5 h-5" />
              <span>Call Emergency Services (911)</span>
            </div>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-md font-normal">Immediate</span>
          </button>

          <button
            id="call-kin-btn"
            type="button"
            onClick={() => handleDial(`${profile.emergencyContact.name} (${profile.emergencyContact.relationship})`)}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 rounded-2xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-slate-600" />
              <span>Call {profile.emergencyContact.name} ({profile.emergencyContact.relationship})</span>
            </div>
            <span className="text-[11px] text-slate-500 font-normal">{profile.emergencyContact.phone}</span>
          </button>
        </div>

        {simulatedCall && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-pulse flex-shrink-0" />
            <span>Connecting call to {simulatedCall}...</span>
          </div>
        )}

        <div className="text-[11px] text-slate-400 text-center leading-relaxed">
          If you are experiencing chest pain, severe shortness of breath, or trauma, please dial local emergency services immediately.
        </div>
      </div>
    </div>
  );
};
