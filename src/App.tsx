/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Wifi,
  Battery,
  Signal,
  Sparkles,
  Smartphone,
  Maximize2,
  CheckCircle2,
  CalendarCheck2,
} from 'lucide-react';
import {
  SpecializationId,
  Doctor,
  Appointment,
  ChatThread,
  ConsultationType,
} from './types';
import {
  SPECIALIZATIONS,
  DOCTORS,
  INITIAL_APPOINTMENTS,
  INITIAL_CHATS,
  PATIENT_PROFILE,
} from './data/mockData';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { DoctorCard } from './components/DoctorCard';
import { DoctorModal } from './components/DoctorModal';
import { BottomNav, NavTab } from './components/BottomNav';
import { AppointmentsView } from './components/AppointmentsView';
import { MessagesView } from './components/MessagesView';
import { ProfileView } from './components/ProfileView';
import { VideoCallModal } from './components/VideoCallModal';
import { EmergencyModal } from './components/EmergencyModal';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<SpecializationId>('all');
  const [availableTodayOnly, setAvailableTodayOnly] = useState(false);
  const [topRatedOnly, setTopRatedOnly] = useState(false);

  // Doctors & Appointments State
  const [doctors] = useState<Doctor[]>(DOCTORS);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);

  // Messages State
  const [chatThreads, setChatThreads] = useState<ChatThread[]>(INITIAL_CHATS);

  // Telehealth Call & Emergency States
  const [activeCallAppointment, setActiveCallAppointment] = useState<Appointment | null>(null);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

  // Toast alert
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Desktop view mode toggle (phone mockup vs expanded)
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Doctors list
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      // Specialization match
      if (selectedSpecialization !== 'all' && doc.specializationId !== selectedSpecialization) {
        return false;
      }

      // Search Query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = doc.name.toLowerCase().includes(q);
        const matchesSpecialty = doc.specialty.toLowerCase().includes(q);
        const matchesHospital = doc.hospital.toLowerCase().includes(q);
        const matchesService = doc.services.some((s) => s.toLowerCase().includes(q));
        if (!matchesName && !matchesSpecialty && !matchesHospital && !matchesService) {
          return false;
        }
      }

      // Available today toggle
      if (availableTodayOnly && !doc.isAvailableToday) {
        return false;
      }

      // Top-rated 4.9+
      if (topRatedOnly && doc.rating < 4.9) {
        return false;
      }

      return true;
    });
  }, [doctors, selectedSpecialization, searchQuery, availableTodayOnly, topRatedOnly]);

  // Appointment Booking Handler
  const handleConfirmBooking = (
    doctor: Doctor,
    date: string,
    time: string,
    type: ConsultationType,
    notes: string
  ) => {
    const newAppointment: Appointment = {
      id: `app-${Date.now()}`,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      doctorAvatar: doctor.avatar,
      hospital: doctor.hospital,
      date,
      time,
      type,
      status: 'upcoming',
      fee: doctor.consultationFee,
      patientNotes: notes || undefined,
    };

    setAppointments((prev) => [newAppointment, ...prev]);
    showToast(`Appointment confirmed with ${doctor.name}!`);
    setActiveTab('appointments');
  };

  // Appointment Cancellation
  const handleCancelAppointment = (id: string) => {
    setAppointments((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: 'cancelled' as const } : app))
    );
    showToast('Appointment cancelled successfully.');
  };

  // Send message in chat thread
  const handleSendMessage = (threadId: string, text: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== threadId) return thread;

        const newMsg = {
          id: `m-${Date.now()}`,
          sender: 'patient' as const,
          text,
          timestamp: timeStr,
        };

        return {
          ...thread,
          lastMessage: text,
          lastMessageTime: timeStr,
          messages: [...thread.messages, newMsg],
        };
      })
    );

    // Simulate friendly doctor automated assistant response
    setTimeout(() => {
      setChatThreads((prev) =>
        prev.map((thread) => {
          if (thread.id !== threadId) return thread;
          const reply = {
            id: `m-reply-${Date.now()}`,
            sender: 'doctor' as const,
            text: `Thank you for your note, ${PATIENT_PROFILE.greetingName}. I have received this and will review it prior to our consultation.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          return {
            ...thread,
            lastMessage: reply.text,
            lastMessageTime: reply.timestamp,
            messages: [...thread.messages, reply],
          };
        })
      );
    }, 1200);
  };

  const handleStartCallFromDoctor = (doctorName: string) => {
    const matchedDoc = doctors.find((d) => d.name === doctorName) || doctors[0];
    const temporaryApp: Appointment = {
      id: `temp-call-${Date.now()}`,
      doctorId: matchedDoc.id,
      doctorName: matchedDoc.name,
      doctorSpecialty: matchedDoc.specialty,
      doctorAvatar: matchedDoc.avatar,
      hospital: matchedDoc.hospital,
      date: 'Now',
      time: 'Live',
      type: 'video',
      status: 'upcoming',
      fee: matchedDoc.consultationFee,
    };
    setActiveCallAppointment(temporaryApp);
  };

  const upcomingCount = appointments.filter((a) => a.status === 'upcoming').length;
  const unreadMessagesCount = chatThreads.reduce((sum, t) => sum + t.unreadCount, 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start py-0 sm:py-6 selection:bg-sky-100 selection:text-sky-900">
      {/* Desktop Helper Bar for Responsive Preview */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-md px-3 mb-2 text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-1.5 text-sky-700">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Medical Consultation Mobile UI</span>
        </div>
        <button
          id="toggle-frame-mode-btn"
          onClick={() => setIsPhoneFrame(!isPhoneFrame)}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-800 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs transition-colors"
        >
          {isPhoneFrame ? (
            <>
              <Maximize2 className="w-3 h-3" />
              <span>Expanded</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3 h-3" />
              <span>Mobile Frame</span>
            </>
          )}
        </button>
      </div>

      {/* Main App Container */}
      <div
        id="app-mobile-container"
        className={`w-full bg-white relative flex flex-col overflow-hidden transition-all duration-300 ${
          isPhoneFrame
            ? 'sm:max-w-md sm:rounded-[36px] sm:shadow-2xl sm:border sm:border-sky-100 min-h-screen sm:min-h-[850px]'
            : 'max-w-3xl sm:rounded-3xl sm:shadow-xl sm:border sm:border-sky-100 min-h-screen'
        }`}
      >
        {/* Mobile Status Bar */}
        <div className="px-6 pt-3 pb-1 bg-sky-100/70 flex items-center justify-between text-[11px] font-semibold text-slate-700 select-none">
          <span>09:41</span>
          {/* Dynamic Island / speaker notch placeholder */}
          <div className="w-24 h-4 bg-slate-800/10 rounded-full hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* View Switcher Content */}
        <main className="flex-1 overflow-y-auto no-scrollbar">
          {activeTab === 'home' && (
            <div className="space-y-5 pb-24">
              {/* Welcoming Header */}
              <Header
                profile={PATIENT_PROFILE}
                onEmergencyClick={() => setIsEmergencyOpen(true)}
              />

              {/* Search Bar & Specialization filters */}
              <SearchBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                specializations={SPECIALIZATIONS}
                selectedSpecialization={selectedSpecialization}
                onSelectSpecialization={setSelectedSpecialization}
                availableTodayOnly={availableTodayOnly}
                onToggleAvailableToday={() => setAvailableTodayOnly(!availableTodayOnly)}
                topRatedOnly={topRatedOnly}
                onToggleTopRated={() => setTopRatedOnly(!topRatedOnly)}
                totalResults={filteredDoctors.length}
              />

              {/* Top-Rated Doctors Section */}
              <section id="top-rated-doctors-section" className="px-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      Top-Rated Specialists
                    </h3>
                    <p className="text-xs text-slate-500">
                      Verified physicians with highest patient satisfaction
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-sky-600">
                    {filteredDoctors.length} Available
                  </span>
                </div>

                {/* Doctor List */}
                {filteredDoctors.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                    <p className="text-sm font-semibold text-slate-700">No specialists match your criteria</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting the search query or clearing the active filters.
                    </p>
                    <button
                      id="reset-filters-btn"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedSpecialization('all');
                        setAvailableTodayOnly(false);
                        setTopRatedOnly(false);
                      }}
                      className="mt-3 px-3.5 py-1.5 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredDoctors.map((doc) => (
                      <DoctorCard
                        key={doc.id}
                        doctor={doc}
                        onSelectDoctor={(d) => {
                          setSelectedDoctor(d);
                          setIsDoctorModalOpen(true);
                        }}
                        onQuickBook={(d) => {
                          setSelectedDoctor(d);
                          setIsDoctorModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'appointments' && (
            <AppointmentsView
              appointments={appointments}
              onStartVideoCall={(app) => setActiveCallAppointment(app)}
              onCancelAppointment={handleCancelAppointment}
              onNavigateHome={() => setActiveTab('home')}
            />
          )}

          {activeTab === 'messages' && (
            <MessagesView
              threads={chatThreads}
              onSendMessage={handleSendMessage}
              onStartDoctorCall={handleStartCallFromDoctor}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              profile={PATIENT_PROFILE}
              onEmergencyClick={() => setIsEmergencyOpen(true)}
            />
          )}
        </main>

        {/* Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          upcomingAppointmentsCount={upcomingCount}
          unreadMessagesCount={unreadMessagesCount}
        />

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div
            id="app-toast-alert"
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-slate-900/90 text-white rounded-2xl shadow-xl flex items-center gap-2 text-xs font-medium backdrop-blur-md animate-in fade-in slide-in-from-bottom-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Doctor Details & Booking Modal */}
        <DoctorModal
          doctor={selectedDoctor}
          isOpen={isDoctorModalOpen}
          onClose={() => {
            setIsDoctorModalOpen(false);
            setSelectedDoctor(null);
          }}
          onConfirmBooking={handleConfirmBooking}
        />

        {/* Active Telehealth Video Call Overlay */}
        <VideoCallModal
          appointment={activeCallAppointment}
          isOpen={!!activeCallAppointment}
          onEndCall={() => {
            setActiveCallAppointment(null);
            showToast('Consultation ended. Summary sent to your medical records.');
          }}
        />

        {/* Emergency SOS Modal */}
        <EmergencyModal
          isOpen={isEmergencyOpen}
          onClose={() => setIsEmergencyOpen(false)}
          profile={PATIENT_PROFILE}
        />
      </div>
    </div>
  );
}
