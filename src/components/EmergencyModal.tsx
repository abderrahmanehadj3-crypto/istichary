import React, { useState } from 'react';
import { Phone, X, MapPin, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { UserAccount } from '../types';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  currentUser,
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-xs p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        id="emergency-modal-content"
        className="w-full sm:max-w-md bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900 p-5 space-y-4 text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-slate-700">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <div className="p-2 bg-rose-100 dark:bg-rose-950/60 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h3 className="font-bold text-base">Emergency Medical Dispatch</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">24/7 Urgent Response</p>
            </div>
          </div>
          <button
            id="close-emergency-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Location Beacon */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-2">
          <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Current GPS Coordinates:</span>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">36.7538° N, 3.0588° E (Algiers Center)</p>
          </div>
        </div>

        {/* Immediate Call Options */}
        <div className="space-y-2.5">
          <button
            id="call-emergency-btn"
            type="button"
            onClick={() => handleDial('Emergency Medical Services (14 / 911)')}
            className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs shadow-md flex items-center justify-between transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4" />
              <span>Call Emergency Medical (14 / 911)</span>
            </div>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-semibold">Immediate</span>
          </button>

          <button
            id="call-telehealth-triage-btn"
            type="button"
            onClick={() => handleDial('24/7 On-Call Medical Triage')}
            className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-2xl font-semibold text-xs flex items-center justify-between transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span>24/7 Urgent Medical Hotline</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">+1-800-555-0199</span>
          </button>
        </div>

        {simulatedCall && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 animate-pulse" />
            <span>Connecting urgent dispatch to {simulatedCall}...</span>
          </div>
        )}

        <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
          If you are experiencing severe symptoms, chest pressure, or acute trauma, dial local emergency services immediately.
        </div>
      </div>
    </div>
  );
};
