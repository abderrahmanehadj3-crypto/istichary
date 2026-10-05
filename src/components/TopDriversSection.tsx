import React, { useState } from 'react';
import { UserProfile, Language } from '../types';
import {
  Trophy,
  Award,
  Medal,
  Star,
  CheckCircle2,
  Bike,
  Car,
  Truck,
  TrendingUp,
  MapPin,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

export interface LeaderboardDriver {
  id: string;
  rank: number;
  name: string;
  avatarUrl: string;
  wilaya: string;
  wilayaCode: string;
  vehicleType: 'motorcycle' | 'car' | 'van';
  completedDeliveries: number;
  rating: number;
  onTimeRate: number;
  tier: 'gold' | 'silver' | 'bronze' | 'elite';
  badgeTitle: string;
}

const DEFAULT_TOP_DRIVERS: LeaderboardDriver[] = [
  {
    id: 'top-1',
    rank: 1,
    name: 'كريم بن ناصر (Karim B.)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    wilaya: 'وهران (Oran)',
    wilayaCode: '31',
    vehicleType: 'motorcycle',
    completedDeliveries: 1482,
    rating: 4.99,
    onTimeRate: 99.4,
    tier: 'gold',
    badgeTitle: 'كابتن النخبة الذهبي 🥇',
  },
  {
    id: 'top-2',
    rank: 2,
    name: 'أمين زروقي (Amine Z.)',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    wilaya: 'الجزائر (Alger)',
    wilayaCode: '16',
    vehicleType: 'car',
    completedDeliveries: 1315,
    rating: 4.97,
    onTimeRate: 98.9,
    tier: 'silver',
    badgeTitle: 'كابتن متميز فضي 🥈',
  },
  {
    id: 'top-3',
    rank: 3,
    name: 'ياسين قادري (Yassine K.)',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    wilaya: 'قسنطينة (Constantine)',
    wilayaCode: '25',
    vehicleType: 'motorcycle',
    completedDeliveries: 1180,
    rating: 4.96,
    onTimeRate: 98.5,
    tier: 'bronze',
    badgeTitle: 'كابتن محترف برونزي 🥉',
  },
  {
    id: 'top-4',
    rank: 4,
    name: 'هشام بلقاسم (Hichem B.)',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80',
    wilaya: 'البليدة (Blida)',
    wilayaCode: '09',
    vehicleType: 'car',
    completedDeliveries: 960,
    rating: 4.94,
    onTimeRate: 98.1,
    tier: 'elite',
    badgeTitle: 'كابتن سريع الفائق ⭐',
  },
  {
    id: 'top-5',
    rank: 5,
    name: 'وليد منصوري (Walid M.)',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80',
    wilaya: 'عنابة (Annaba)',
    wilayaCode: '23',
    vehicleType: 'motorcycle',
    completedDeliveries: 875,
    rating: 4.93,
    onTimeRate: 97.8,
    tier: 'elite',
    badgeTitle: 'سفير التوصيل السريع',
  },
  {
    id: 'top-6',
    rank: 6,
    name: 'حمزة بوزيد (Hamza B.)',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=250&q=80',
    wilaya: 'سطيف (Sétif)',
    wilayaCode: '19',
    vehicleType: 'van',
    completedDeliveries: 820,
    rating: 4.92,
    onTimeRate: 97.5,
    tier: 'elite',
    badgeTitle: 'كابتن مميز',
  },
  {
    id: 'top-7',
    rank: 7,
    name: 'عبد القادر دراجي (Abdelkader D.)',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80',
    wilaya: 'تلمسان (Tlemcen)',
    wilayaCode: '13',
    vehicleType: 'car',
    completedDeliveries: 780,
    rating: 4.91,
    onTimeRate: 97.2,
    tier: 'elite',
    badgeTitle: 'كابتن مميز',
  },
  {
    id: 'top-8',
    rank: 8,
    name: 'مهدي سعيدي (Mehdi S.)',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
    wilaya: 'باتنة (Batna)',
    wilayaCode: '05',
    vehicleType: 'motorcycle',
    completedDeliveries: 745,
    rating: 4.90,
    onTimeRate: 96.9,
    tier: 'elite',
    badgeTitle: 'كابتن موثوق',
  },
  {
    id: 'top-9',
    rank: 9,
    name: 'فاروق خيدر (Farouk K.)',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=250&q=80',
    wilaya: 'بجاية (Béjaïa)',
    wilayaCode: '06',
    vehicleType: 'motorcycle',
    completedDeliveries: 690,
    rating: 4.89,
    onTimeRate: 96.5,
    tier: 'elite',
    badgeTitle: 'كابتن موثوق',
  },
  {
    id: 'top-10',
    rank: 10,
    name: 'مراد حداد (Mourad H.)',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=250&q=80',
    wilaya: 'تيزي وزو (Tizi Ouzou)',
    wilayaCode: '15',
    vehicleType: 'car',
    completedDeliveries: 650,
    rating: 4.88,
    onTimeRate: 96.0,
    tier: 'elite',
    badgeTitle: 'كابتن موثوق',
  },
];

interface TopDriversSectionProps {
  currentUser: UserProfile;
  selectedWilaya: string;
  lang?: Language;
}

export const TopDriversSection: React.FC<TopDriversSectionProps> = ({
  currentUser,
  selectedWilaya,
}) => {
  const [filterScope, setFilterScope] = useState<'national' | 'wilaya'>('national');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Dynamic ranking list
  const driversList = filterScope === 'national'
    ? DEFAULT_TOP_DRIVERS
    : DEFAULT_TOP_DRIVERS.filter((d) => d.wilayaCode === selectedWilaya || d.wilayaCode === '16');

  // Compute current driver rank
  const myCompleted = currentUser.driverDetails?.totalDeliveries || 18;
  const myRating = currentUser.driverDetails?.rating || 4.9;
  const myRank = myCompleted > 1200 ? 3 : myCompleted > 700 ? 8 : 14;

  const top3 = driversList.slice(0, 3);
  const remainingDrivers = driversList.slice(3, 10);

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'motorcycle':
        return <Bike size={13} className="text-emerald-400" />;
      case 'car':
        return <Car size={13} className="text-blue-400" />;
      case 'van':
        return <Truck size={13} className="text-amber-400" />;
      default:
        return <Bike size={13} className="text-emerald-400" />;
    }
  };

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden transition-all">
      {/* Header Banner */}
      <div className="p-4 bg-gradient-to-r from-amber-500/15 via-slate-900 to-emerald-500/15 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg">
            <Trophy size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-white">لوحة شرف أفضل 10 كباتن (Top Drivers)</h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                <Sparkles size={10} />
                <span>أبطال التوصيل</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              ترتيب أفضل الشركاء بناءً على عدد الرحلات المكتملة وتقييمات العملاء المرتفعة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Scope Filter Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => setFilterScope('national')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                filterScope === 'national'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الوطني (الكل)
            </button>
            <button
              type="button"
              onClick={() => setFilterScope('wilaya')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                filterScope === 'wilaya'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ولايتي
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title={isExpanded ? 'طي القسم' : 'عرض القسم'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Current Logged-in Driver Standings Ribbon */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xs">
                #{myRank}
              </div>
              <div>
                <span className="text-white font-bold block text-xs">
                  مكانتك الحالية: {myRank <= 10 ? `ضمن أفضل 10 كباتن (#${myRank}) 🌟` : `المرتبة #${myRank} في الجزائر`}
                </span>
                <span className="text-[10px] text-slate-400">
                  {myCompleted} توصيلة مكتملة • تقييمك: ⭐ {myRating.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
              <TrendingUp size={13} />
              <span>اكسب رحلات إضافية للوصول للقمة!</span>
            </div>
          </div>

          {/* TOP 3 PODIUM SECTION */}
          {top3.length >= 3 && (
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              {/* 2nd Place (Silver) */}
              <div className="p-3 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-950 border border-slate-700 flex flex-col items-center text-center relative shadow-lg transform translate-y-2">
                <span className="absolute -top-3 w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center border-2 border-slate-900 shadow">
                  2
                </span>
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-300/60 shadow-md my-2">
                  <img src={top3[1].avatarUrl} alt={top3[1].name} className="w-full h-full object-cover" />
                </div>
                <h4 className="font-bold text-xs text-white line-clamp-1">{top3[1].name}</h4>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin size={10} />
                  <span>{top3[1].wilaya}</span>
                </span>
                <div className="mt-2 text-center w-full pt-2 border-t border-slate-800">
                  <span className="text-emerald-400 font-mono font-black text-xs block">
                    {top3[1].completedDeliveries} توصيلة
                  </span>
                  <span className="text-[10px] text-amber-300 font-bold flex items-center justify-center gap-0.5">
                    <Star size={10} className="fill-amber-400 text-amber-400" />
                    <span>{top3[1].rating}</span>
                  </span>
                </div>
              </div>

              {/* 1st Place (Gold) - Elevated Center */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/70 flex flex-col items-center text-center relative shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-2 ring-amber-500/20">
                <span className="absolute -top-3.5 w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center border-2 border-slate-900 shadow-md">
                  🥇
                </span>
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-xl my-2">
                  <img src={top3[0].avatarUrl} alt={top3[0].name} className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center gap-1">
                  <h4 className="font-black text-xs text-white line-clamp-1">{top3[0].name}</h4>
                  <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                </div>
                <span className="text-[10px] text-amber-300/90 flex items-center gap-1 mt-0.5 font-bold">
                  <Medal size={10} />
                  <span>{top3[0].badgeTitle}</span>
                </span>
                <div className="mt-2.5 text-center w-full pt-2 border-t border-amber-500/20">
                  <span className="text-emerald-400 font-mono font-black text-sm block">
                    {top3[0].completedDeliveries} توصيلة
                  </span>
                  <span className="text-[11px] text-amber-400 font-black flex items-center justify-center gap-1">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    <span>{top3[0].rating} (الأول وطنياً)</span>
                  </span>
                </div>
              </div>

              {/* 3rd Place (Bronze) */}
              <div className="p-3 rounded-2xl bg-gradient-to-b from-amber-950/20 to-slate-950 border border-amber-700/50 flex flex-col items-center text-center relative shadow-lg transform translate-y-3">
                <span className="absolute -top-3 w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center border-2 border-slate-900 shadow">
                  3
                </span>
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-700/60 shadow-md my-2">
                  <img src={top3[2].avatarUrl} alt={top3[2].name} className="w-full h-full object-cover" />
                </div>
                <h4 className="font-bold text-xs text-white line-clamp-1">{top3[2].name}</h4>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin size={10} />
                  <span>{top3[2].wilaya}</span>
                </span>
                <div className="mt-2 text-center w-full pt-2 border-t border-slate-800">
                  <span className="text-emerald-400 font-mono font-black text-xs block">
                    {top3[2].completedDeliveries} توصيلة
                  </span>
                  <span className="text-[10px] text-amber-300 font-bold flex items-center justify-center gap-0.5">
                    <Star size={10} className="fill-amber-400 text-amber-400" />
                    <span>{top3[2].rating}</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* RANKS 4 TO 10 LIST */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 px-1">
              <Award size={14} className="text-emerald-400" />
              <span>قائمة النخبة (المراكز 4 إلى 10):</span>
            </h4>

            <div className="space-y-1.5">
              {remainingDrivers.map((driver) => (
                <div
                  key={driver.id}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-black text-xs flex items-center justify-center">
                      #{driver.rank}
                    </span>

                    <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-700 shrink-0">
                      <img src={driver.avatarUrl} alt={driver.name} className="w-full h-full object-cover" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{driver.name}</span>
                        {getVehicleIcon(driver.vehicleType)}
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={9} />
                        <span>{driver.wilaya}</span>
                        <span>•</span>
                        <span className="text-emerald-400/90 font-medium">دقة المواعيد: {driver.onTimeRate}%</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-black text-emerald-400 text-xs block">
                      {driver.completedDeliveries} توصيلة
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold flex items-center justify-end gap-1">
                      <Star size={10} className="fill-amber-400" />
                      <span>{driver.rating}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
