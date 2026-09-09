import React, { useState } from 'react';
import { Bell, ShieldCheck, PhoneCall, X, CheckCircle2, Clock } from 'lucide-react';
import { PatientProfile } from '../types';

interface HeaderProps {
  profile: PatientProfile;
  onEmergencyClick: () => void;
  onOpenNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ profile, onEmergencyClick }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    {
      id: 'notif-1',
      title: 'Consultation in 2 Hours',
      desc: 'Video session with Dr. Evelyn Vance at 02:30 PM today.',
      time: '12:30 PM',
      unread: true,
    },
    {
      id: 'notif-2',
      title: 'Prescription Refilled',
      desc: 'Dr. Aaron Patel approved your topical care prescription.',
      time: 'Yesterday',
      unread: false,
    },
    {
      id: 'notif-3',
      title: 'Health Tip of the Day',
      desc: 'Remember to stay hydrated and take a 5-minute eye rest.',
      time: '2 days ago',
      unread: false,
    },
  ];

  return (
    <header id="app-header" className="relative px-5 pt-6 pb-5 bg-gradient-to-b from-sky-100/70 via-sky-50/40 to-white">
      {/* Top greeting row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
              alt={profile.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm border border-sky-100"
            />
            <span
              className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"
              title="Health Status: Active"
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 tracking-wide">
              <span>WELCOME BACK</span>
              <span className="text-amber-500">👋</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {profile.name}
            </h1>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {/* Quick 24/7 helpline button */}
          <button
            id="emergency-helpline-btn"
            onClick={onEmergencyClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-xs font-semibold hover:bg-rose-100 active:scale-95 transition-all shadow-xs"
            title="Emergency Medical Contact"
          >
            <PhoneCall className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">SOS</span>
          </button>

          {/* Notifications bell */}
          <button
            id="header-notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 bg-white/90 hover:bg-white text-slate-700 rounded-full border border-sky-100 shadow-xs active:scale-95 transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-sky-500 border-2 border-white rounded-full animate-pulse" />
          </button>
        </div>
      </div>

      {/* Welcoming health card / banner */}
      <div className="mt-4 p-4 bg-gradient-to-r from-sky-600 to-sky-700 rounded-2xl text-white shadow-md relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -right-6 -bottom-8 w-28 h-28 bg-white/10 rounded-full blur-xs pointer-events-none" />
        <div className="absolute right-12 -top-6 w-20 h-20 bg-sky-400/20 rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-1.5 text-xs font-medium text-sky-100 mb-1">
            <ShieldCheck className="w-4 h-4 text-sky-200" />
            <span>Verified Telehealth Care</span>
          </div>
          <h2 className="text-lg font-bold text-white leading-snug">
            Need medical advice today?
          </h2>
          <p className="text-xs text-sky-100/90 mt-1 max-w-[280px]">
            Connect with board-certified specialists in under 15 minutes via video or clinic visit.
          </p>
        </div>
      </div>

      {/* Notifications Drawer Dropdown */}
      {showNotifications && (
        <div
          id="notifications-popover"
          className="absolute top-20 right-5 left-5 z-40 bg-white rounded-2xl shadow-xl border border-sky-100 p-4 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-sky-600" />
              <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
            </div>
            <button
              id="close-notifications-btn"
              onClick={() => setShowNotifications(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2.5 max-h-60 overflow-y-auto">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl text-xs transition-colors ${
                  item.unread ? 'bg-sky-50/70 border border-sky-100' : 'bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{item.title}</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.time}
                  </span>
                </div>
                <p className="text-slate-600 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2 text-center border-t border-slate-100">
            <button
              id="mark-all-read-btn"
              onClick={() => setShowNotifications(false)}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark all as read
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
