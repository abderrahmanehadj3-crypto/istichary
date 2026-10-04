import React, { useState } from 'react';
import { AppTranslations } from '../i18n/translations';
import {
  DeliveryEarningRecord,
  DeliveryOrder,
  DriverDetails,
  Language,
  ThemeMode,
  UserProfile,
  WalletTransaction,
} from '../types';
import { Sari3Logo } from './Sari3Logo';
import { DRIVER_DEFAULT_AVATAR } from '../utils/defaultAvatars';
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
  Package,
  AlertTriangle,
  Lock,
  RefreshCw,
  Camera,
} from 'lucide-react';
import { launchNativeDeviceCamera } from '../utils/nativeCameraBridge';

interface DriverDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  orders?: DeliveryOrder[];
  t: AppTranslations;
  lang: Language;
  theme: ThemeMode;
  onLanguageChange: (lang: Language) => void;
  onThemeToggle: () => void;
  onLogout: () => void;
  onUpdateProfile?: (updated: Partial<UserProfile>) => void;
}

type DrawerView = 'menu' | 'profile' | 'stats' | 'wallet';

export const DriverDrawerMenu: React.FC<DriverDrawerMenuProps> = ({
  isOpen,
  onClose,
  currentUser,
  orders = [],
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

  // Load wallet balance from local storage or default to 0
  const walletStorageKey = `sari3_driver_wallet_${currentUser.id}`;
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(walletStorageKey);
      return saved ? parseFloat(saved) : 0;
    } catch {
      return 0;
    }
  });

  const txStorageKey = `sari3_driver_txs_${currentUser.id}`;
  const [transactions, setTransactions] = useState<WalletTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(txStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [topUpMethod, setTopUpMethod] = useState<'edahabia' | 'baridimob'>('edahabia');
  const [topUpAmount, setTopUpAmount] = useState<number>(1000);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [topUpSuccessMsg, setTopUpSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const driver = currentUser.driverDetails;

  // SMART EXPIRED LICENSE & 1-MONTH (30 DAYS) GRACE PERIOD POLICY CHECK
  // Current reference date: 2026-10-01
  const referenceDate = new Date('2026-10-01');
  const expDateObj = driver?.licenseExpirationDate ? new Date(driver.licenseExpirationDate) : null;
  const isLicenseExpired = expDateObj ? expDateObj < referenceDate : false;

  // Calculate 1 month (30 days) grace period post-expiry
  let daysSinceExpiry = 0;
  let isInGracePeriod = false;
  let isPastGracePeriod = false;
  let daysRemainingInGrace = 0;

  if (isLicenseExpired && expDateObj) {
    const diffTime = referenceDate.getTime() - expDateObj.getTime();
    daysSinceExpiry = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (daysSinceExpiry <= 30) {
      isInGracePeriod = true;
      daysRemainingInGrace = Math.max(0, 30 - daysSinceExpiry);
    } else {
      isPastGracePeriod = true;
    }
  }

  // License Renewal State for drivers past grace period
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [renewalLicenseImage, setRenewalLicenseImage] = useState<string | null>(null);
  const [isScanningRenewal, setIsScanningRenewal] = useState(false);
  const [renewalError, setRenewalError] = useState<string | null>(null);
  const [renewalSuccess, setRenewalSuccess] = useState(false);

  // Handle License Renewal OCR
  const handleRenewalOcr = async (photoDataUrl: string) => {
    setRenewalLicenseImage(photoDataUrl);
    setIsScanningRenewal(true);
    setRenewalError(null);

    try {
      const res = await fetch('/api/driver/ocr-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: photoDataUrl,
          isRenewalCheck: true, // Allows inspecting new expiry date
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success || !data?.expirationDate) {
        setRenewalError(data?.error || 'الصورة الملتقطة غير مقروءة أو لا تمثل رخصة قيادة صالحة. يرجى إعادة التصوير بوضوح.');
        return;
      }

      const newExp = new Date(data.expirationDate);
      if (isNaN(newExp.getTime()) || newExp < referenceDate) {
        setRenewalError(`الرخصة المرفوعة لا تزال منتهية الصلاحية (${data.expirationDate}). يرجى تقديم وثيقة التجديد الرسمية.`);
        return;
      }

      // Success: Updated renewed license
      setRenewalSuccess(true);
      if (onUpdateProfile && driver) {
        onUpdateProfile({
          driverDetails: {
            ...driver,
            licenseExpirationDate: data.expirationDate,
            licenseNumber: data.licenseNumber || driver.licenseNumber,
            licenseExpired: false,
            licenseInGracePeriod: false,
            licenseRenewalRequired: false,
            licenseFrontUrl: photoDataUrl,
          },
        });
      }
      setTimeout(() => {
        setIsRenewalModalOpen(false);
        setRenewalSuccess(false);
        setRenewalLicenseImage(null);
      }, 2000);
    } catch (err: any) {
      setRenewalError('فشل التحقق من رخصة القيادة المجددة. يرجى المحاولة مجدداً.');
    } finally {
      setIsScanningRenewal(false);
    }
  };

  // Real-time Delivery Earnings derived from live orders
  const deliveredOrders = orders.filter(
    (o) => o.assignedDriver?.id === currentUser.id && o.status === 'delivered'
  );
  const cancelledOrders = orders.filter(
    (o) => o.assignedDriver?.id === currentUser.id && o.status === 'cancelled'
  );

  const earnings: DeliveryEarningRecord[] = deliveredOrders.map((o) => {
    const gross = o.agreedPrice || o.customerOfferPrice || 0;
    const commission = Math.round(gross * 0.1);
    const net = gross - commission;
    return {
      id: `ern-${o.id}`,
      orderId: o.id,
      date: o.completedAt
        ? new Date(o.completedAt).toLocaleDateString('ar-DZ', {
            hour: '2-digit',
            minute: '2-digit',
            day: 'numeric',
            month: 'short',
          })
        : 'مكتمل',
      amount: gross,
      commission,
      netEarning: net,
      pickup: o.pickupAddress,
      dropoff: o.dropoffAddress,
      distanceKm: o.distanceKm,
      status: 'completed' as const,
    };
  });

  // Stats Calculations
  const completedCount = deliveredOrders.length;
  const cancelledCount = cancelledOrders.length;
  const totalNetEarnings = earnings.reduce((acc, curr) => acc + curr.netEarning, 0);

  // Handle Top-Up Execution
  const handleProcessTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (topUpAmount <= 0) return;

    if (topUpMethod === 'edahabia') {
      if (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim()) {
        alert('يرجى إدخال بيانات البطاقة الذهبية / CIB كاملة');
        return;
      }
      const newTx: WalletTransaction = {
        id: `tx-${Date.now()}`,
        type: 'topup_edahabia',
        amount: topUpAmount,
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        status: 'completed',
        description: 'شحن رصيد إلكتروني (البطاقة الذهبية / CIB)',
        txRef: `EDAH-${Math.floor(100000 + Math.random() * 900000)}`,
      };
      const updatedTxs = [newTx, ...transactions];
      const updatedBalance = walletBalance + topUpAmount;
      setTransactions(updatedTxs);
      setWalletBalance(updatedBalance);
      localStorage.setItem(txStorageKey, JSON.stringify(updatedTxs));
      localStorage.setItem(walletStorageKey, String(updatedBalance));
      setTopUpSuccessMsg(`تم شحن المحفظة بنجاح بمبلغ ${topUpAmount} دج`);
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
    } else {
      if (!receiptUploaded) {
        alert('يرجى إرفاق صورة وصل تحويل بريدي موب للمتابعة');
        return;
      }
      const newTx: WalletTransaction = {
        id: `tx-${Date.now()}`,
        type: 'topup_baridimob',
        amount: topUpAmount,
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        status: 'pending',
        description: 'تحويل بريدي موب (قيد التأكيد الآلي)',
        txRef: `BMOB-${Math.floor(100000 + Math.random() * 900000)}`,
      };
      const updatedTxs = [newTx, ...transactions];
      setTransactions(updatedTxs);
      localStorage.setItem(txStorageKey, JSON.stringify(updatedTxs));
      setTopUpSuccessMsg(`تم استلام وصل التحويل بمبلغ ${topUpAmount} دج وسيتم تفعيله فوراً`);
      setReceiptUploaded(false);
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
          <div className="w-13 h-13 rounded-full overflow-hidden border-2 border-emerald-500 shadow-md bg-slate-950 flex items-center justify-center shrink-0">
            <img
              src={driver?.publicAvatarUrl || DRIVER_DEFAULT_AVATAR}
              alt="Driver Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-sm text-white truncate">
                {driver?.nickname || currentUser.displayName}
              </h3>
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
              {/* Default Vector Avatar Showcase (No upload allowed) */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3.5">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500 shadow-md bg-slate-950 flex items-center justify-center shrink-0">
                  <img
                    src={driver?.publicAvatarUrl || DRIVER_DEFAULT_AVATAR}
                    alt="Driver Vector Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-white">شارة الحساب الرمزية للزبائن</h4>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                      شارة موحدة
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    رسم توضيحي رمزي رسمي لكابتن التوصيل بالخوذة وصندوق التوصيل لحماية خصوصيتك التامة أمام الزبائن.
                  </p>
                </div>
              </div>

              {/* SMART LICENSE EXPIRY & 1-MONTH GRACE PERIOD BANNER */}
              {isLicenseExpired && (
                <div
                  className={`p-3.5 rounded-2xl border ${
                    isInGracePeriod
                      ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                      : 'bg-red-950/70 border-red-500 text-red-100 shadow-lg shadow-red-500/20'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle
                      size={20}
                      className={`shrink-0 mt-0.5 ${isInGracePeriod ? 'text-amber-400' : 'text-red-400 animate-pulse'}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs">
                          {isInGracePeriod ? 'تنبيه: رخصة القيادة منتهية (فترة سماح 30 يوم)' : 'تنبيه أمني: انتهاء فترة السماح لرخصة القيادة'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isInGracePeriod
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-red-600 text-white animate-bounce'
                          }`}
                        >
                          {isInGracePeriod ? `باقي ${daysRemainingInGrace} يوم` : 'مطلوب التجديد فوراً'}
                        </span>
                      </div>
                      <p className="text-[11px] mt-1.5 leading-relaxed">
                        {isInGracePeriod
                          ? `انتهت صلاحية رخصتك في (${driver?.licenseExpirationDate}). يمنحك نظام "سريع" فترة سماح استثنائية لمدة شهر (30 يوماً) لمواصلة العمل مع ضرورة تجديدها.`
                          : `لقد مضى أكثر من شهر (30 يوماً) على انتهاء رخصة قيادتك (${driver?.licenseExpirationDate}). تم إيقاف استقبال الطلبات مؤقتاً لحين رفع وثيقة الرخصة المجددة بالذكاء الاصطناعي.`}
                      </p>

                      <button
                        type="button"
                        onClick={() => setIsRenewalModalOpen(true)}
                        className={`mt-2.5 px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow ${
                          isInGracePeriod
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            : 'bg-red-600 hover:bg-red-500 text-white'
                        }`}
                      >
                        <RefreshCw size={12} />
                        <span>تحديث وتصوير الرخصة المجددة (OCR)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <span className="text-xs text-slate-400">حالة توثيق الكابتن</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>موثق رسمياً (Verified)</span>
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-400">الاسم المستعار للزبائن:</span>
                    <span className="font-bold text-emerald-400">
                      {driver?.nickname || currentUser.displayName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">الاسم القانوني (الرسمي):</span>
                    <span className="font-bold text-white">
                      {driver?.firstName || currentUser.displayName} {driver?.lastName || ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">العمر القانوني:</span>
                    <span className="font-bold text-white">
                      {driver?.age ? `${driver.age} سنة (≥ 20)` : 'مؤهل (≥ 20)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">تاريخ الميلاد:</span>
                    <span className="font-mono text-white">{driver?.birthDate || currentUser.birthDate || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">رقم الهاتف:</span>
                    <span className="font-mono text-emerald-400 font-bold">{currentUser.phone || '—'}</span>
                  </div>
                </div>
              </div>

              {/* License Details Card */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-purple-400 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={15} />
                    <span>رخصة القيادة (Permis de Conduire)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Lock size={10} />
                    تخزين آمن ومحمي
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">رقم الرخصة:</span>
                    <span className="font-mono font-bold text-white">{driver?.licenseNumber || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">تاريخ الانتهاء:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-white">{driver?.licenseExpirationDate || '—'}</span>
                      {isLicenseExpired && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${isInGracePeriod ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                          {isInGracePeriod ? 'فترة سماح 30 يوم' : 'منتهية'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">المطابقة البيومترية:</span>
                    <span className="text-emerald-400 font-bold">تم المطابقة ومحقونة أمنياً ✓</span>
                  </div>
                </div>
              </div>

              {/* Vehicle & Gray Card Details */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-purple-400 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Bike size={15} />
                    <span>بيانات المركبة والبطاقة الرمادية (Carte Grise)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Lock size={10} />
                    حقول مقفلة آلياً
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">نوع المركبة:</span>
                    <span className="font-bold text-white">
                      {driver?.vehicleType === 'car'
                        ? 'سيارة (Voiture)'
                        : driver?.vehicleType === 'van'
                        ? 'شاحنة صغيرة (Fourgonnette)'
                        : 'دراجة نارية (Moto)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">العلامة والموديل (OCR):</span>
                    <span className="font-bold text-white">
                      {driver?.vehicleBrand || '—'} {driver?.vehicleModel || ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">رقم لوحة الترقيم (Matricule):</span>
                    <span className="font-mono font-bold text-emerald-400">{driver?.vehiclePlate || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">نوع البطاقة الرمادية:</span>
                    <span className="font-bold text-white">
                      {driver?.vehicleRegType === 'temporary' ? 'بطاقة رمادية مؤقتة' : 'بطاقة رمادية نهائية'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">تأمين الوثيقة:</span>
                    <span className="text-emerald-400 font-bold">مخزنة بسيرفر خاص غير قابل للتنزيل ✓</span>
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
                  <p className="text-[10px] text-slate-500 mt-0.5">من الطلبات المسندة</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-red-400 mb-1">
                    <XCircle size={14} />
                    <span>الطلبات الملغاة</span>
                  </div>
                  <p className="text-2xl font-black text-white font-mono">{cancelledCount}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">ملغاة من الزبون</p>
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

                {earnings.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
                    <Package size={28} className="mx-auto text-slate-600" />
                    <p className="text-xs font-bold text-slate-300">لا توجد عمليات توصيل مكتملة حتى الآن</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      عند قبول عروضك وإتمام أول توصيلة بنجاح، ستُسجل أرباحك وتفاصيل المسافة هنا تلقائياً.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {earnings.map((rec) => (
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
                )}
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

                {transactions.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1.5">
                    <Receipt size={24} className="mx-auto text-slate-600" />
                    <p className="text-xs font-bold text-slate-300">لا توجد عمليات مالية مسجلة</p>
                    <p className="text-[10px] text-slate-500">
                      عمليات شحن المحفظة واقتطاع العمولات ستظهر هنا.
                    </p>
                  </div>
                ) : (
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
                )}
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

      {/* Forceful License Renewal Modal (AI OCR) */}
      {isRenewalModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <RefreshCw size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">تجديد رخصة القيادة بالذكاء الاصطناعي</h3>
                  <p className="text-[10px] text-slate-400">فحص وثيقة التجديد وتحديث تاريخ الصلاحية آلياً</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRenewalModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {renewalSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <span>تم توثيق وتحديث رخصة القيادة بنجاح! تم رفع أي تقييد عن الحساب.</span>
              </div>
            )}

            {renewalError && (
              <div className="p-3 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <span>{renewalError}</span>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
              {renewalLicenseImage ? (
                <div className="w-full h-36 rounded-xl overflow-hidden border border-emerald-500">
                  <img src={renewalLicenseImage} alt="Renewed License" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-36 rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/60 flex flex-col items-center justify-center text-slate-500">
                  <FileText size={32} className="text-slate-600 mb-1" />
                  <span className="text-xs font-bold text-slate-300">صورة رخصة القيادة المجددة</span>
                  <span className="text-[10px] text-amber-400 mt-0.5 font-semibold">كاميرا حية مباشرة • يُمنع المعرض</span>
                </div>
              )}

              <button
                type="button"
                disabled={isScanningRenewal}
                onClick={() => {
                  launchNativeDeviceCamera(
                    'environment',
                    (dataUrl) => handleRenewalOcr(dataUrl),
                    (err) => setRenewalError(err)
                  );
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                {isScanningRenewal ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>جاري الفحص الذكي للرخصة (OCR)...</span>
                  </>
                ) : (
                  <>
                    <Camera size={14} />
                    <span>التقاط صورة الرخصة المجددة (كاميرا حية فقط)</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-400">
                يتم فتح الكاميرا الحية مباشرة لتصوير الرخصة لمنع التزوير والاحتيال
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
