import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  MessageSquare,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';
import { Appointment } from '../types';

interface VideoCallModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onEndCall: () => void;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  appointment,
  isOpen,
  onEndCall,
}) => {
  if (!isOpen || !appointment) return null;

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [seconds, setSeconds] = useState(12);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div
      id="telehealth-video-call-overlay"
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-4 sm:p-6 text-white animate-in fade-in duration-200"
    >
      {/* Top Bar: Doctor info, duration, encryption */}
      <div className="flex items-center justify-between z-10 bg-slate-900/60 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3">
          <img
            src={appointment.doctorAvatar}
            alt={appointment.doctorName}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-sky-400"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white">{appointment.doctorName}</h3>
              <ShieldCheck className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-[11px] text-sky-200">{appointment.doctorSpecialty}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {formatDuration(seconds)}
          </span>
        </div>
      </div>

      {/* Main Video Stage (Simulated doctor stream) */}
      <div className="relative flex-1 my-4 rounded-3xl overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl">
        <img
          src={appointment.doctorAvatar}
          alt={appointment.doctorName}
          className="w-full h-full object-cover object-center filter brightness-95"
        />

        {/* Doctor speaking pill indicator */}
        <div className="absolute top-4 left-4 px-3 py-1.5 bg-slate-900/70 backdrop-blur-md rounded-xl text-xs font-semibold flex items-center gap-2 border border-white/10">
          <div className="flex items-end gap-0.5 h-3">
            <span className="w-1 bg-sky-400 animate-pulse h-full rounded-xs" />
            <span className="w-1 bg-sky-400 animate-pulse h-2 rounded-xs" />
            <span className="w-1 bg-sky-400 animate-pulse h-3 rounded-xs" />
          </div>
          <span>{appointment.doctorName} speaking</span>
        </div>

        {/* Patient self-view picture-in-picture */}
        <div className="absolute bottom-4 right-4 w-28 h-38 sm:w-32 sm:h-44 bg-slate-800 rounded-2xl overflow-hidden ring-2 ring-white/20 shadow-xl">
          {isVideoOff ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 text-xs font-medium p-2 text-center">
              <VideoOff className="w-6 h-6 mb-1 text-slate-500" />
              <span>Camera Off</span>
            </div>
          ) : (
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
              alt="You"
              className="w-full h-full object-cover"
            />
          )}
          <span className="absolute bottom-1 left-2 text-[10px] font-bold bg-slate-950/70 px-1.5 py-0.5 rounded text-white">
            You
          </span>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="flex items-center justify-center gap-3 sm:gap-5 z-10 py-2">
        <button
          id="call-mute-toggle-btn"
          type="button"
          onClick={() => setIsMuted(!isMuted)}
          className={`p-3.5 rounded-full transition-all shadow-md active:scale-95 ${
            isMuted
              ? 'bg-rose-600 text-white'
              : 'bg-white/15 hover:bg-white/25 text-white backdrop-blur-md'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button
          id="call-video-toggle-btn"
          type="button"
          onClick={() => setIsVideoOff(!isVideoOff)}
          className={`p-3.5 rounded-full transition-all shadow-md active:scale-95 ${
            isVideoOff
              ? 'bg-rose-600 text-white'
              : 'bg-white/15 hover:bg-white/25 text-white backdrop-blur-md'
          }`}
          title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
        </button>

        <button
          id="end-call-btn"
          type="button"
          onClick={onEndCall}
          className="p-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-lg active:scale-95 transition-all"
          title="End Telehealth Call"
        >
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};
