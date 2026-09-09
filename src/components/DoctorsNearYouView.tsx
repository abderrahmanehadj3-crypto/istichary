import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Building2,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Search,
  Clock,
  Compass,
  ArrowUpDown,
} from 'lucide-react';
import { DoctorProfile, Language } from '../types';
import { translations } from '../i18n/translations';
import { POPULAR_CITIES, calculateDistanceKm, Coordinates } from '../utils/geo';
import { RoleAvatar } from './RoleAvatar';

interface DoctorsNearYouViewProps {
  doctors: DoctorProfile[];
  lang: Language;
  onSelectDoctor: (doctor: DoctorProfile) => void;
}

export const DoctorsNearYouView: React.FC<DoctorsNearYouViewProps> = ({
  doctors,
  lang,
  onSelectDoctor,
}) => {
  const t = translations[lang];

  // Default coordinate: Algiers
  const [currentCoords, setCurrentCoords] = useState<Coordinates>({
    lat: 36.7538,
    lng: 3.0588,
  });
  const [activeLocationLabel, setActiveLocationLabel] = useState<string>('Algiers (Default City)');
  const [isGpsActive, setIsGpsActive] = useState<boolean>(false);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const requestGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentCoords(coords);
        setIsGpsActive(true);
        setActiveLocationLabel('Your GPS Device Location');
        setGpsLoading(false);
      },
      (error) => {
        setGpsLoading(false);
        setGpsError(`Could not access GPS coordinates: ${error.message}. Please select your city below.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectCity = (cityName: string) => {
    const city = POPULAR_CITIES.find((c) => c.name === cityName);
    if (city) {
      setCurrentCoords(city.coords);
      setIsGpsActive(false);
      setActiveLocationLabel(`${city.name}, ${city.country}`);
      setGpsError('');
    }
  };

  // Calculate distances and sort
  const doctorsWithDistance = doctors
    .map((doc) => {
      const dist = calculateDistanceKm(
        currentCoords.lat,
        currentCoords.lng,
        doc.clinicLat,
        doc.clinicLng
      );
      return {
        ...doc,
        distanceKm: dist,
      };
    })
    .filter((doc) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        doc.specialty.toLowerCase().includes(q) ||
        (doc.realName && doc.realName.toLowerCase().includes(q)) ||
        doc.username.toLowerCase().includes(q) ||
        doc.clinicName.toLowerCase().includes(q) ||
        doc.clinicAddress.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));

  return (
    <div id="doctors-near-you-container" className="space-y-4">
      {/* Header and Location Setup */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-600 to-sky-700 text-white shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-xs">
              <Compass size={22} className="text-sky-200" />
            </div>
            <div>
              <h2 className="text-base font-bold">{t.nearYouTitle}</h2>
              <p className="text-xs text-sky-100/90">{t.nearYouSubtitle}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs">
            {doctorsWithDistance.length} Specialists
          </span>
        </div>

        {/* Location selector bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <button
            id="btn-enable-gps"
            onClick={requestGpsLocation}
            disabled={gpsLoading}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              isGpsActive
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-sky-700 hover:bg-sky-50'
            }`}
          >
            <Navigation size={14} className={gpsLoading ? 'animate-spin' : ''} />
            <span>{isGpsActive ? t.locationEnabled : t.enableGpsLocation}</span>
          </button>

          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs text-sky-100 hidden sm:inline whitespace-nowrap">
              {t.selectCityFallback}:
            </span>
            <select
              id="select-city-region"
              value={isGpsActive ? '' : activeLocationLabel.split(',')[0].split(' ')[0]}
              onChange={(e) => handleSelectCity(e.target.value)}
              className="w-full sm:w-auto flex-1 px-3 py-1.5 text-xs rounded-xl bg-white/20 hover:bg-white/25 text-white border border-white/30 focus:outline-hidden"
            >
              {isGpsActive && <option value="" disabled>GPS Coordinates Active</option>}
              {POPULAR_CITIES.map((c) => (
                <option key={c.name} value={c.name} className="text-slate-900">
                  {c.name} ({c.country})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active location indicator */}
        <div className="flex items-center gap-2 text-xs text-sky-100/90 pt-0.5">
          <MapPin size={13} className="text-amber-300 shrink-0" />
          <span>Calculated from: <strong>{activeLocationLabel}</strong></span>
        </div>

        {gpsError && (
          <p className="text-xs text-amber-200 bg-black/20 p-2 rounded-lg">
            {gpsError}
          </p>
        )}
      </div>

      {/* Search within nearby clinics */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id="search-nearby-doctors"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter nearby doctors by specialty, doctor name, clinic..."
          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* Sorted Doctors List */}
      <div className="space-y-3">
        {doctorsWithDistance.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400">
            {t.noNearbyDoctors}
          </div>
        ) : (
          doctorsWithDistance.map((doc) => (
            <div
              key={doc.id}
              id={`nearby-doctor-${doc.id}`}
              className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 transition shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              {/* Doctor Profile Info */}
              <div className="flex items-start gap-3.5">
                <RoleAvatar
                  role="doctor"
                  size="lg"
                  verificationStatus={doc.verificationStatus}
                  className="shrink-0"
                />

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {doc.showRealName && doc.realName ? (
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {doc.realName}
                      </h3>
                    ) : (
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {doc.username}
                      </h3>
                    )}

                    {doc.showRealName && doc.realName && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {doc.username}
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 flex items-center gap-0.5">
                      <ShieldCheck size={11} /> {t.verifiedDoctorBadge}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                    {doc.specialty} • {doc.experienceYears} {t.experienceYears}
                  </p>

                  {/* Clinic Address */}
                  <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300 pt-0.5">
                    <Building2 size={13} className="text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {doc.clinicName}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {doc.clinicAddress} ({doc.clinicCity})
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Distance Pill & Booking CTA */}
              <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-100 dark:border-indigo-900/50">
                  <MapPin size={12} className="text-indigo-500" />
                  <span>
                    {doc.distanceKm} {t.kilometersAway}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">
                    {doc.nextAvailable}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    ${doc.consultationFee} / session
                  </span>
                </div>

                <button
                  id={`btn-book-nearby-${doc.id}`}
                  onClick={() => onSelectDoctor(doc)}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  {t.viewDetails}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
