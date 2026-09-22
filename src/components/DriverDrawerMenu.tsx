import React, { useState } from 'react';
import { AppTranslations } from '../i18n/translations';
import {
  DeliveryEarningRecord,
  DriverDetails,
  Language,
  ThemeMode,
  UserProfile,
  WalletTransaction,
} from '../types';
import { ProfilePhotoUploader } from './ProfilePhotoUploader';
import { Sari3Logo } from './Sari3Logo';
import {
  X,
  User,
  TrendingUp,
  Wallet,
  Globe,
  Sun,
  Moon,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  CreditCard,
  Upload,
  Receipt,
  Check,
  AlertCircle,
  Bike,
  FileText,
  Calendar,
  Phone,
  Filter,
} from 'lucide-react';

interface DriverDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  t: AppTranslations;
  lang: Language;
  theme: ThemeMode;
  onLanguageChange: (lang: Language) => void;
  onThemeToggle: () => void;
  onLogout: () => void;
  onUpdateProfile?: (updated: Partial<UserProfile>) => void;
}

type DrawerView = 'menu' | 'profile' | 'stats' | 'wallet';

// Mock Initial Earnings Data for Driver
const INITIAL_EARNINGS: DeliveryEarningRecord[] = [
  {
    id: 'ern-1',
    orderId: 'ord-101',
    date: 'اليوم، 14:20',
    amount: 950,
    commission: 95,
    netEarning: 855,
    pickup: 'ديدوش مراد، الجزائر الوسطى',
    dropoff: 'باب الزوار',
    distanceKm: 14.2,
    status: 'completed',
  },
  {
    id: 'ern-2',
    orderId: 'ord-102',
    date: 'اليوم، 11:45',
    amount: 1400,
    commission: 140,
    netEarning: 1260,
    pickup: 'بئر خادم',
    dropoff: 'الرويبة',
    distanceKm: 22.0,
    status: 'completed',
  },
  {
    id: 'ern-3',
    orderId: 'ord-103',
    date: 'أمس، 18:10',
    amount: 700,
    commission: 70,
    netEarning: 630,
    pickup: 'حيدرة',
    dropoff: 'الأبيار',
    distanceKm: 6.5,
    status: 'completed',
  },
  {
    id: 'ern-4',
    orderId: 'ord-104',
    date: 'أمس، 15:30',
    amount: 1100,
    commission: 0,
    netEarning: 0,
    pickup: 'القبة',
    dropoff: 'الدار البيضاء',
    distanceKm: 16.0,
    status: 'cancelled',
  },
  {
    id: 'ern-5',
    orderId: 'ord-105',
    date: '19 سبتمبر، 16:00',
    amount: 1800,
    commission: 180,
    netEarning: 1620,
    pickup: 'زرالدة',
    dropoff: 'الشراقة',
    distanceKm: 18.5,
    status: 'completed',
  },
];

// Mock Initial Wallet Transactions
const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx-1',
    type: 'topup_edahabia',
    amount: 5000,
    date: '2026-09-21 16:30',
    status: 'completed',
    description: 'شحن رصيد إلكتروني (البطاقة الذهبية)',
    txRef: 'EDAH-998241',
  },
  {
    id: 'tx-2',
    type: 'delivery_earning',
    amount: 855,
    date: '2026-09-22 14:20',
    status: 'completed',
    description: 'أرباح توصيل طرد #101',
  },
  {
    id: 'tx-3',
    type: 'commission_fee',
    amount: -95,
    date: '2026-09-22 14:20',
    status: 'completed',
    description: 'عمولة تطبيق Sari3 (10%)',
  },
  {
    id: 'tx-4',
    type: 'topup_baridimob',
    amount: 3000,
    date: '2026-09-19 11:00',
    status: 'completed',
    description: 'تحويل بريدي موب (وصل يدوي مؤكد)',
    txRef: 'BMOB-341908',
  },
];

export const DriverDrawerMenu: React.FC<DriverDrawerMenuProps> = ({
  isOpen,
  onClose,
  currentUser,
  t,
  lang,
  theme,
  onLanguageChange,
  onThemeToggle,
  onLogout,
  onUpdateProfile,
}) => {
  const isRtl = lang === 'ar';
  const ArrowBackIcon = isRtl ? ArrowRight : ArrowLeft;
  const ArrowNextIcon = isRtl ? ArrowLeft : ArrowRight;

  const [activeView, setActiveView] = useState<DrawerView>('menu');
  const [statsPeriod, setStatsPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Wallet State
  const [walletBalance, setWalletBalance] = useState<number>(14500);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(INITIAL_TRANSACTIONS);
  const [topUpMethod, setTopUpMethod] = useState<'edahabia' | 'baridimob'>('edahabia');
  const [topUpAmount, setTopUpAmount] = useState<number>(2000);
  const [cardNumber, setCardNumber] = useState('6280 1234 5678 9012');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('789');
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [topUpSuccessMsg, setTopUpSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const driver = currentUser.driverDetails;

  // Stats Calculations
  const completedCount = INITIAL_EARNINGS.filter((e) => e.status === 'completed').length;
  const cancelledCount = INITIAL_EARNINGS.filter((e) => e.status === 'cancelled').length;
  const totalNetEarnings = INITIAL_EARNINGS.filter((e) => e.status === 'completed').reduce(
    (acc, curr) => acc + curr.netEarning,
    0
  );

  // Handle Top-Up Simulation
  const handleProcessTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (topUpAmount <= 0) return;

    if (topUpMethod === 'edahabia') {
      const newTx: WalletTransaction = {
        id: `tx-${Date.now()}`,
        type: 'topup_edahabia',
        amount: topUpAmount,
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        status: 'completed',
        description: 'شحن رصيد إلكتروني (البطاقة الذهبية / CIB)',
        txRef: `EDAH-${Math.floor(100000 + Math.random() * 900000)}`,
      };
      setTransactions([newTx, ...transactions]);
      setWalletBalance((prev) => prev + topUpAmount);
      setTopUpSuccessMsg(`تم شحن المحفظة بنجاح بمبلغ ${topUpAmount} دج`);
    } else {
      const newTx: WalletTransaction = {
        id: `tx-${Date.now()}`,
        type: 'topup_baridimob',
        amount: topUpAmount,
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        status: 'pending',
        description: 'تحويل بريدي موب / CCP (بانتظار مراجعة الوصل)',
        txRef: `BMOB-${Math.floor(100000 + Math.random() * 900000)}`,
      };
      setTransactions([newTx, ...transactions]);
      setTopUpSuccessMsg('تم رفع الوصل بنجاح! سيتم التحقق وتأكيد الرصيد خلال 10 دقائق');
    }

    setTimeout(() => {
      setTopUpSuccessMsg(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Dark Overlay Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Container (Sliding from edge) */}
      <div
        className={`absolute inset-y-0 ${
          isRtl ? 'right-0' : 'left-0'
        } max-w-sm w-full bg-[#0B0F17] border-slate-800 text-slate-100 shadow-2xl flex flex-col z-10 transition-transform animate-in ${
          isRtl ? 'slide-in-from-right' : 'slide-in-from-left'
        } duration-200 ${isRtl ? 'border-l' : 'border-r'}`}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            {activeView !== 'menu' && (
              <button
                onClick={() => setActiveView('menu')}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <ArrowBackIcon size={18} />
              </button>
            )}
            <Sari3Logo size="sm" />
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-400 font-bold text-[10px] border border-purple-500/20 flex items-center gap-1">
              <Bike size={12} />
              <span>لوحة الكابتن</span>
            </span>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Driver Profile Card Header */}
        <div className="p-4 bg-gradient-to-b from-slate-900/80 to-transparent border-b border-slate-800/60 flex items-center gap-3">
          <img
            src={
              driver?.publicAvatarUrl ||
              currentUser.avatarUrl ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'
            }
            alt="Driver Avatar"
            className="w-13 h-13 rounded-full object-cover border-2 border-purple-500 shadow-md"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-sm text-white truncate">{currentUser.displayName}</h3>
              <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0" />
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{currentUser.phone}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-amber-400 font-bold">★ {driver?.rating || 4.95}</span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                كابتن موثق
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* VIEW 1: MAIN NAVIGATION MENU */}
          {activeView === 'menu' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                {/* 1. Profile Link */}
                <button
                  onClick={() => setActiveView('profile')}
                  className="w-full p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 text-right flex items-center justify-between transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">ملف الكابتن والتوثيق</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">معلومات المركبة، رخصة القيادة، وحالة التحقق</p>
                    </div>
                  </div>
                  <ArrowNextIcon size={16} className="text-slate-500 group-hover:text-white transition" />
                </button>

                {/* 2. Delivery Statistics & Earnings */}
                <button
                  onClick={() => setActiveView('stats')}
                  className="w-full p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 text-right flex items-center justify-between transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-slate-950 transition">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">الإحصائيات والأرباح</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">الطلبات المكتملة، الملغاة، وملخص الدخل</p>
                    </div>
                  </div>
                  <ArrowNextIcon size={16} className="text-slate-500 group-hover:text-white transition" />
                </button>

                {/* 3. Driver Wallet */}
                <button
                  onClick={() => setActiveView('wallet')}
                  className="w-full p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 text-right flex items-center justify-between transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                      <Wallet size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-xs text-white">محفظة السائق</p>
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                          {walletBalance} دج
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">شحن الرصيد (الذهبية / بريدي موب) وسجل العمليات</p>
                    </div>
                  </div>
                  <ArrowNextIcon size={16} className="text-slate-500 group-hover:text-white transition" />
                </button>
              </div>

              {/* Preferences: Language & Theme */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <p className="text-[11px] font-bold text-slate-400 px-1">تفضيلات التطبيق</p>

                {/* Language Switcher */}
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Globe size={16} className="text-purple-400" />
                    <span>اللغة / Language</span>
                  </div>

                  <select
                    value={lang}
                    onChange={(e) => onLanguageChange(e.target.value as Language)}
                    className="bg-slate-950 border border-slate-700 text-xs font-bold rounded-xl px-2 py-1 text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="ar">العربية (RTL)</option>
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                  </select>
                </div>

                {/* Theme Toggle */}
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    {theme === 'dark' ? <Moon size={16} className="text-purple-400" /> : <Sun size={16} className="text-amber-400" />}
                    <span>المظهر: {theme === 'dark' ? 'الوضع الليلي الخافت' : 'الوضع الفاتح'}</span>
                  </div>

                  <button
                    onClick={onThemeToggle}
                    className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white"
                  >
                    {theme === 'dark' ? 'فاتح' : 'ليلي'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: DRIVER PROFILE & VERIFICATION DETAILS */}
          {activeView === 'profile' && (
            <div className="space-y-4">
              {/* Profile Photo Uploader (Gallery or Live Camera) */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <ProfilePhotoUploader
                  currentPhotoUrl={
                    currentUser.driverDetails?.publicAvatarUrl ||
                    currentUser.avatarUrl ||
                    currentUser.driverDetails?.facePhotoUrl ||
                    null
                  }
                  onPhotoSelected={(url) => {
                    if (onUpdateProfile) {
                      onUpdateProfile({
                        avatarUrl: url,
                        driverDetails: {
                          ...currentUser.driverDetails!,
                          publicAvatarUrl: url,
                        },
                      });
                    }
                  }}
                  title="صورة الكابتن الشخصية"
                  subtitle="تحديث الصورة الشخصية عبر المعرض أو الكاميرا الحية"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <span className="text-xs text-slate-400">حالة توثيق الكابتن</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>موثق رسمياً (Verified)</span>
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">الاسم الكامل:</span>
                    <span className="font-bold text-white">{driver?.firstName || 'كريم'} {driver?.lastName || 'الدراجي'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">العمر القانوني:</span>
                    <span className="font-bold text-white">{driver?.age || 25} سنة (≥ 20)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">تاريخ الميلاد:</span>
                    <span className="font-mono text-white">{driver?.birthDate || '2001-05-14'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">رقم الهاتف:</span>
                    <span className="font-mono text-emerald-400 font-bold">{currentUser.phone}</span>
                  </div>
                </div>
              </div>

              {/* License Details Card */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400 border-b border-slate-800/80 pb-2">
                  <FileText size={15} />
                  <span>رخصة القيادة (Permis de Conduire)</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">رقم الرخصة:</span>
                    <span className="font-mono font-bold text-white">{driver?.licenseNumber || '16/2021/987654'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">تاريخ الانتهاء:</span>
                    <span className="font-mono text-white">{driver?.licenseExpirationDate || '2030-12-31'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">المسح الحي للكاميرا:</span>
                    <span className="text-emerald-400 font-bold">تم المطابقة بنجاح ✓</span>
                  </div>
                </div>
              </div>

              {/* Vehicle & Gray Card Details */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400 border-b border-slate-800/80 pb-2">
                  <Bike size={15} />
                  <span>بيانات المركبة والبطاقة الرمادية</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">نوع المركبة:</span>
                    <span className="font-bold text-white">دراجة نارية (Moto)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">العلامة والموديل:</span>
                    <span className="font-bold text-white">{driver?.vehicleBrand || 'Sym'} {driver?.vehicleModel || 'Orbit II 150cc'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">رقم لوحة الترقيم (Matricule):</span>
                    <span className="font-mono font-bold text-emerald-400">{driver?.vehiclePlate || '01234-121-16'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">نوع البطاقة الرمادية:</span>
                    <span className="font-bold text-white">
                      {driver?.vehicleRegType === 'temporary' ? 'بطاقة رمادية مؤقتة' : 'بطاقة رمادية نهائية'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: DELIVERY STATISTICS & EARNINGS */}
          {activeView === 'stats' && (
            <div className="space-y-4">
              {/* Period Filter Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-center">
                <button
                  onClick={() => setStatsPeriod('daily')}
                  className={`py-2 rounded-xl transition ${
                    statsPeriod === 'daily'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  اليومي
                </button>
                <button
                  onClick={() => setStatsPeriod('weekly')}
                  className={`py-2 rounded-xl transition ${
                    statsPeriod === 'weekly'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  الأسبوعي
                </button>
                <button
                  onClick={() => setStatsPeriod('monthly')}
                  className={`py-2 rounded-xl transition ${
                    statsPeriod === 'monthly'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  الشهري
                </button>
              </div>

              {/* Highlights Summary Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 mb-1">
                    <CheckCircle2 size={14} />
                    <span>الطلبات المكتملة</span>
                  </div>
                  <p className="text-2xl font-black text-white font-mono">{completedCount}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">معدل الإنجاز 96%</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-red-400 mb-1">
                    <XCircle size={14} />
                    <span>الطلبات الملغاة</span>
                  </div>
                  <p className="text-2xl font-black text-white font-mono">{cancelledCount}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">ملغاة من الزبون أو الظروف</p>
                </div>
              </div>

              {/* Total Net Income Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">صافي الأرباح المحققة</p>
                  <p className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                    {totalNetEarnings} دج
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <DollarSign size={24} />
                </div>
              </div>

              {/* Earnings Breakdown per Individual Delivery */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-white px-1">تفاصيل الأرباح لكل طلب فردي</p>

                <div className="space-y-2">
                  {INITIAL_EARNINGS.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white truncate max-w-[180px]">
                          {rec.pickup} ← {rec.dropoff}
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            rec.status === 'completed' ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {rec.status === 'completed' ? `+${rec.netEarning} دج` : 'ملغاة (0 دج)'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{rec.date} • {rec.distanceKm} كم</span>
                        {rec.status === 'completed' && (
                          <span>(الإجمالي {rec.amount} - عمولة {rec.commission})</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: DRIVER WALLET & TOP-UP */}
          {activeView === 'wallet' && (
            <div className="space-y-4">
              {/* Wallet Balance Hero Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>الرصيد المتاح بالمحفظة</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                      نشط ومفعل
                    </span>
                  </div>
                  <p className="text-3xl font-black text-white font-mono tracking-tight">
                    {walletBalance.toLocaleString()} <span className="text-emerald-400 text-lg">دج</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2">
                    تُخصم عمولة الخدمة تلقائياً من هذا الرصيد عند إتمام التوصيل.
                  </p>
                </div>
              </div>

              {topUpSuccessMsg && (
                <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="flex-shrink-0" />
                  <span>{topUpSuccessMsg}</span>
                </div>
              )}

              {/* Top-up Options Accordion / Form */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CreditCard size={15} className="text-emerald-400" />
                    <span>شحن رصيد المحفظة</span>
                  </span>
                </div>

                {/* Top-up Method Switcher */}
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setTopUpMethod('edahabia')}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition ${
                      topUpMethod === 'edahabia'
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <CreditCard size={14} />
                    <span>البطاقة الذهبية / CIB</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTopUpMethod('baridimob')}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition ${
                      topUpMethod === 'baridimob'
                        ? 'border-purple-500 bg-purple-950/40 text-purple-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <Upload size={14} />
                    <span>بريدي موب / CCP</span>
                  </button>
                </div>

                <form onSubmit={handleProcessTopUp} className="space-y-3 pt-1">
                  {/* Preset Amount Badges */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1.5">المبلغ المراد شحنه (دج)</label>
                    <div className="grid grid-cols-3 gap-1.5 mb-2">
                      {[1000, 2000, 5000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setTopUpAmount(amt)}
                          className={`py-1.5 rounded-xl text-xs font-mono font-bold border transition ${
                            topUpAmount === amt
                              ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                              : 'border-slate-800 bg-slate-950 text-slate-300'
                          }`}
                        >
                          {amt} دج
                        </button>
                      ))}
                    </div>
                  </div>

                  {topUpMethod === 'edahabia' ? (
                    /* CIB / Edahabia Fields */
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1 text-[11px]">رقم البطاقة الذهبية / CIB</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-400 mb-1 text-[11px]">تاريخ الانتهاء</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 font-mono text-center text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1 text-[11px]">رمز CVC</label>
                          <input
                            type="password"
                            maxLength={3}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 font-mono text-center text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* BaridiMob / CCP Receipt Upload */
                    <div className="space-y-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <p className="text-slate-400 text-[11px]">حساب CCP لتحويل الرصيد:</p>
                        <p className="font-mono font-bold text-purple-400">RIP: 007999990001234567 89</p>
                        <p className="text-[10px] text-slate-500">الاسم: SARI3 DELIVERY EURL</p>
                      </div>

                      <div
                        onClick={() => setReceiptUploaded(true)}
                        className={`p-3.5 rounded-xl border-2 border-dashed text-center cursor-pointer transition ${
                          receiptUploaded
                            ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400'
                            : 'border-slate-800 hover:border-slate-700 text-slate-400'
                        }`}
                      >
                        {receiptUploaded ? (
                          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400">
                            <CheckCircle2 size={16} />
                            <span>تم إرفاق صورة وصل التحويل بنجاح ✓</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Upload size={20} className="mx-auto text-slate-500" />
                            <p className="font-bold text-xs">اضغط لرفع صورة وصل تحويل بريدي موب</p>
                            <p className="text-[10px] text-slate-500">JPG أو PNG واضح للعملية</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <span>تأكيد شحن {topUpAmount} دج</span>
                    <Check size={15} />
                  </button>
                </form>
              </div>

              {/* Transaction History List */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-white px-1">سجل العمليات المالية بالمحفظة</p>

                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          <Receipt size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-white truncate max-w-[160px]">{tx.description}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{tx.date}</p>
                        </div>
                      </div>

                      <div className="text-left">
                        <span
                          className={`font-mono font-black ${
                            tx.amount > 0 ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount} دج
                        </span>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {tx.status === 'completed' ? 'مكتمل' : 'قيد المراجعة'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Logout Button */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60">
          <button
            onClick={onLogout}
            className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-red-950/60 hover:text-red-300 text-slate-300 border border-slate-800 hover:border-red-800 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={16} />
            <span>تسجيل الخروج والعودة للبوابة الرئيسية</span>
          </button>
        </div>
      </div>
    </div>
  );
};
