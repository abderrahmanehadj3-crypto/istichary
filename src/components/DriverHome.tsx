import React, { useState } from 'react';
import { AppTranslations } from '../i18n/translations';
import { DeliveryOrder, DriverOffer, Language, ThemeMode, UserProfile } from '../types';
import { ALGERIA_WILAYAS, getWilayaByCode } from '../data/wilayas';
import { Sari3Map } from './Sari3Map';
import { useNativeGps } from '../hooks/useNativeGps';
import { MandatoryGpsModal } from './MandatoryGpsModal';
import { generateUuid, ensureUuid } from '../utils/firebaseSync';
import { DRIVER_DEFAULT_AVATAR } from '../utils/defaultAvatars';
import {
  Bike,
  Package,
  MapPin,
  Clock,
  DollarSign,
  Eye,
  CheckCircle2,
  Phone,
  Power,
  Navigation,
  Send,
  Flag,
  Radio,
  AlertTriangle,
  ShieldAlert,
  FileText,
  Camera,
  Upload,
  X,
  RefreshCw,
  AlertCircle,
  Lock,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { soundNotifier, calculateHaversineDistanceKm } from '../utils/audioNotification';
import { launchNativeDeviceCamera } from '../utils/nativeCameraBridge';
import { preprocessLicenseFrameForOcr } from '../utils/imagePreprocessingCV';

interface DriverHomeProps {
  currentUser: UserProfile;
  orders: DeliveryOrder[];
  t: AppTranslations;
  lang: Language;
  theme: ThemeMode;
  onSendOffer: (offer: DriverOffer) => void;
  onFinishDelivery: (orderId: string) => void;
  onOpenPackageInspection: (photoUrl: string, description: string) => void;
  selectedWilaya: string;
  onWilayaChange: (code: string) => void;
  onUpdateProfile?: (updated: Partial<UserProfile>) => void;
}

export const DriverHome: React.FC<DriverHomeProps> = ({
  currentUser,
  orders,
  t,
  lang,
  theme,
  onSendOffer,
  onFinishDelivery,
  onOpenPackageInspection,
  selectedWilaya,
  onWilayaChange,
  onUpdateProfile,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [customBids, setCustomBids] = useState<Record<string, number>>({});
  const currentWilayaObj = getWilayaByCode(selectedWilaya);

  // SMART EXPIRED LICENSE & 1-MONTH (30 DAYS) GRACE PERIOD POLICY CHECK
  // Current reference date: 2026-10-01
  const driver = currentUser.driverDetails;
  const referenceDate = new Date('2026-10-01');
  const expDateObj = driver?.licenseExpirationDate ? new Date(driver.licenseExpirationDate) : null;
  const isLicenseExpired = expDateObj ? expDateObj < referenceDate : false;

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

  // Renewal OCR State
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
      let processedDataUrl = photoDataUrl;
      try {
        const prep = await preprocessLicenseFrameForOcr(photoDataUrl);
        processedDataUrl = prep.processedDataUrl;
      } catch (cvErr) {
        console.warn('[CV Preprocessing fallback in DriverHome]:', cvErr);
      }

      const res = await fetch('/api/driver/ocr-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: processedDataUrl,
          expectedFirstName: driver?.firstName,
          expectedLastName: driver?.lastName,
          expectedBirthDate: driver?.birthDate,
          isRenewalCheck: true,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success || !data?.expirationDate) {
        setRenewalError(
          data?.error ||
          'الصورة الملتقطة غير مقروءة أو لا تمثل رخصة قيادة معتمدة. يرجى إعادة التصوير بوضوح في مكان جيد الإضاءة.'
        );
        return;
      }

      const newExp = new Date(data.expirationDate);
      if (isNaN(newExp.getTime()) || newExp < referenceDate) {
        setRenewalError(
          `رخصة القيادة المرفوعة لا تزال منتهية الصلاحية (${data.expirationDate}). يرجى تقديم وثيقة التجديد الرسمية.`
        );
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
      }, 1800);
    } catch (err: any) {
      setRenewalError('فشل التحقق من رخصة القيادة المجددة. يرجى المحاولة مجدداً.');
    } finally {
      setIsScanningRenewal(false);
    }
  };

  // Native GPS Hook for Driver
  const effectiveIsOnline = isPastGracePeriod ? false : isOnline;
  const {
    coords: driverGpsCoords,
    status: gpsStatus,
    errorMessage: gpsErrorMessage,
    requestGps,
    startLiveTracking,
    stopLiveTracking,
    bypassGps,
  } = useNativeGps(effectiveIsOnline);
  const [showGpsModal, setShowGpsModal] = useState<boolean>(false);

  // Check if driver has an active assigned mission
  const activeMission = orders.find(
    (o) =>
      o.assignedDriver?.id === currentUser.id &&
      (o.status === 'accepted' || o.status === 'in_transit')
  );

  // Toggle online with real GPS validation and safe fallback
  const handleToggleOnline = async () => {
    if (isPastGracePeriod) {
      setIsRenewalModalOpen(true);
      return;
    }
    if (!isOnline) {
      await requestGps();
      setIsOnline(true);
      startLiveTracking();
    } else {
      setIsOnline(false);
      stopLiveTracking();
    }
  };

  // Filter available broadcast orders in this Wilaya
  const availableOrders = isPastGracePeriod
    ? []
    : orders.filter(
        (o) =>
          o.wilaya === selectedWilaya &&
          (o.status === 'searching' || o.status === 'negotiating') &&
          (!activeMission || o.id === activeMission.id)
      );

  // 5. PROXIMITY-BASED AUDIO ORDER ALERTS (VOICE NOTIFICATION)
  // When a new delivery order is placed, calculate proximity and trigger audio alert + voice prompt
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState<boolean>(true);
  const alertedOrdersRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    if (!effectiveIsOnline || !audioAlertsEnabled || availableOrders.length === 0) return;

    availableOrders.forEach((order) => {
      if (alertedOrdersRef.current.has(order.id)) return;
      alertedOrdersRef.current.add(order.id);

      // Calculate proximity distance using Haversine formula
      let distKm = order.distanceKm || 2.5;
      if (driverGpsCoords && order.pickupCoords) {
        distKm = calculateHaversineDistanceKm(
          driverGpsCoords.lat,
          driverGpsCoords.lng,
          order.pickupCoords.lat,
          order.pickupCoords.lng
        );
      }

      // Proximity dispatch alert for nearby drivers (within 25 km)
      if (distKm <= 25) {
        soundNotifier.playProximityOrderAlert(order.id, distKm, 'هناك طلبية قريبة، انتبه!');
      }
    });
  }, [availableOrders, effectiveIsOnline, audioAlertsEnabled, driverGpsCoords]);

  // Submit Counter Offer with GPS coordinates
  const handleMakeBid = (order: DeliveryOrder, extraAmount: number = 0) => {
    const baseAmount = customBids[order.id] || order.customerOfferPrice;
    const finalBid = baseAmount + extraAmount;

    const publicDisplayName = currentUser.driverDetails?.nickname || currentUser.displayName;
    const offer: DriverOffer = {
      id: generateUuid(),
      orderId: ensureUuid(order.id),
      driverId: ensureUuid(currentUser.id),
      driverName: publicDisplayName,
      driverPhone: currentUser.phone || '',
      driverRating: currentUser.driverDetails?.rating || 5.0,
      driverAvatar: currentUser.driverDetails?.publicAvatarUrl || DRIVER_DEFAULT_AVATAR,
      vehicleInfo: currentUser.driverDetails?.vehicleBrand
        ? `${currentUser.driverDetails.vehicleBrand} (${currentUser.driverDetails.vehiclePlate})`
        : 'مركبة توصيل',
      vehiclePlate: currentUser.driverDetails?.vehiclePlate || '—',
      offeredPrice: finalBid,
      etaMinutes: 10,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    onSendOffer(offer);
  };

  return (
    <div className="space-y-5">
      {/* 1-MONTH (30 DAYS) GRACE PERIOD PROACTIVE REMINDER NOTIFICATION BANNER */}
      {isInGracePeriod && (
        <div className="p-4 rounded-3xl bg-amber-950/40 border-2 border-amber-500/60 shadow-xl space-y-2.5 animate-in fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Clock size={16} className="shrink-0" />
              <span>تنبيه مهلة التجديد: متبقي {daysRemainingInGrace} يوماً ضمن فترة السماح</span>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30 whitespace-nowrap">
              مهلة 30 يوماً
            </span>
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            انتهت صلاحية رخصة القيادة المسجلة في <strong>{driver?.licenseExpirationDate}</strong> (منذ {daysSinceExpiry} يوماً). يمكنك متابعة التوصيل واستقبال الطلبات بشكل طبيعي خلال هذا الشهر، لكن يرجى رفع وثيقة التجديد قبل انتهاء المهلة لتجنب التقييد التلقائي للحساب.
          </p>
          <div className="pt-1 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsRenewalModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <FileText size={13} />
              <span>رفع رخصة السياقة المجددة الآن (OCR)</span>
            </button>
            <span className="text-[10px] text-amber-400/80 font-bold">
              عمل طبيعي مستمر ✓
            </span>
          </div>
        </div>
      )}

      {/* POST-GRACE-PERIOD ENFORCEMENT BANNER (TEMPORARILY RESTRICTED DRIVING ACCESS) */}
      {isPastGracePeriod && (
        <div className="p-4 rounded-3xl bg-red-950/70 border-2 border-red-500 shadow-2xl space-y-3 animate-in fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
              <ShieldAlert size={18} className="shrink-0 animate-bounce" />
              <span>تم تقييد حساب السائق مؤقتاً: تجاوز فترة السماح (شهر كامل)</span>
            </div>
            <span className="text-[10px] bg-red-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
              مقيد مؤقتاً ✕
            </span>
          </div>
          <p className="text-xs text-red-200 leading-relaxed font-bold">
            انقضت مهلة السماح (30 يوماً كاملة) على انتهاء رخصة السياقة ({driver?.licenseExpirationDate}). تم إيقاف استقبال الطلبات وصلاحيات القيادة مؤقتاً حتى تقديم رخصة سياقة مجددة صالحة.
          </p>
          <button
            type="button"
            onClick={() => setIsRenewalModalOpen(true)}
            className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-500/20 active:scale-95"
          >
            <Camera size={15} />
            <span>تصوير / رفع الرخصة المجددة واستعادة الحساب الآن</span>
          </button>
        </div>
      )}

      {/* Driver Header & Online Toggle */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500 shadow-md bg-slate-950 flex items-center justify-center">
              <img
                src={currentUser.driverDetails?.publicAvatarUrl || DRIVER_DEFAULT_AVATAR}
                alt="Driver avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <span
              className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
              }`}
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-sm text-white">
                {currentUser.driverDetails?.nickname || currentUser.displayName}
              </h3>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                كابتن موثق
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentUser.driverDetails?.vehicleBrand} • {currentUser.driverDetails?.vehiclePlate}
            </p>
          </div>
        </div>

        {/* Online / Offline switch */}
        <button
          type="button"
          onClick={handleToggleOnline}
          className={`px-3.5 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
            isOnline
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Power size={14} />
          <span>{isOnline ? t.goOnline : t.goOffline}</span>
        </button>
      </div>

      {/* ACTIVE MISSION CARD (if driver is currently delivering) */}
      {activeMission && (
        <div className="p-5 rounded-3xl bg-slate-900 border-2 border-emerald-500 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="font-black text-sm text-white">{t.activeTask}</h3>
            </div>
            <span className="text-sm font-black text-emerald-400 font-mono">
              {activeMission.agreedPrice || activeMission.customerOfferPrice} {t.dzd}
            </span>
          </div>

          {/* Interactive Map Live Tracking */}
          <Sari3Map
            center={activeMission.pickupCoords}
            pickupCoords={activeMission.pickupCoords}
            dropoffCoords={activeMission.dropoffCoords}
            driverCoords={
              driverGpsCoords || {
                lat: activeMission.pickupCoords.lat + 0.003,
                lng: activeMission.pickupCoords.lng + 0.003,
              }
            }
            userLiveGps={driverGpsCoords}
            theme={theme}
            lang={lang}
            className="min-h-[350px] h-[350px] w-full"
          />

          {/* Customer info & Call */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">{activeMission.customerName}</p>
              <p className="text-[11px] text-slate-400 font-mono">{activeMission.customerPhone}</p>
            </div>
            <a
              href={`tel:${activeMission.customerPhone}`}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Phone size={14} />
              <span>{t.btnCall}</span>
            </a>
          </div>

          {/* Package Inspection for Driver */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-300 truncate max-w-[200px]">
              {activeMission.packageDescription}
            </span>
            <button
              type="button"
              onClick={() =>
                onOpenPackageInspection(
                  activeMission.packagePhotoUrl,
                  activeMission.packageDescription
                )
              }
              className="text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Eye size={13} />
              <span>معاينة الطرد</span>
            </button>
          </div>

          {/* FINISH DELIVERY BUTTON (TERMINATES LIVE TRACKING) */}
          <button
            type="button"
            id="btn-driver-finish-delivery"
            onClick={() => onFinishDelivery(activeMission.id)}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <CheckCircle2 size={18} />
            <span>{t.btnFinishDelivery}</span>
          </button>
        </div>
      )}

      {/* Wilaya Filter */}
      <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-emerald-400" />
          <span className="text-xs font-bold text-slate-300">{t.selectWilaya}:</span>
        </div>
        <select
          id="select-wilaya-driver"
          value={selectedWilaya}
          onChange={(e) => onWilayaChange(e.target.value)}
          className="bg-slate-950 border border-slate-700 text-emerald-400 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          {ALGERIA_WILAYAS.map((w) => (
            <option key={w.code} value={w.code}>
              {w.code} - {lang === 'ar' ? w.nameAr : w.nameFr}
            </option>
          ))}
        </select>
      </div>

      {/* 5. PROXIMITY-BASED AUDIO ORDER ALERTS (VOICE NOTIFICATION) BANNER */}
      <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-2.5 text-emerald-300">
          <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Volume2 size={16} className="animate-pulse" />
          </div>
          <div>
            <span className="font-bold block text-white text-xs">
              التنبيهات الصوتية الحية (Voice Alert)
            </span>
            <span className="text-[10px] text-emerald-300/80">
              إشعار صوتي فوري عند توفر طلبية قريبة حتى لا تضطر للنظر إلى الشاشة أثناء القيادة
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => soundNotifier.playProximityOrderAlert('test-audio', 2.3, 'هناك طلبية قريبة، انتبه!')}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold cursor-pointer transition active:scale-95 flex items-center gap-1"
            title="تجربة صوت التنبيه والنطق"
          >
            <Volume2 size={12} />
            <span>تجربة الصوت</span>
          </button>
          <button
            type="button"
            onClick={() => setAudioAlertsEnabled(!audioAlertsEnabled)}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer transition flex items-center gap-1 ${
              audioAlertsEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-red-950 text-red-300 border-red-500/40'
            }`}
          >
            {audioAlertsEnabled ? <span>مفعّل 🔊</span> : <span>صامت 🔇</span>}
          </button>
        </div>
      </div>

      {/* Available Orders Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-white flex items-center gap-2">
            <Radio size={16} className="text-emerald-400 animate-pulse" />
            <span>{t.availableOrdersNearYou}</span>
          </h3>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400">
            {availableOrders.length} طلب
          </span>
        </div>

        {!isOnline ? (
          <div className="p-8 text-center rounded-3xl bg-slate-900 border border-slate-800 text-slate-400 space-y-2">
            <p className="text-sm font-bold">أنت غير متصل حالياً</p>
            <p className="text-xs text-slate-500">
              اضغط على زر "أنا متاح" أعلاه لاستقبال طلبات التوصيل القريبة منك والتفاوض على الأسعار.
            </p>
          </div>
        ) : availableOrders.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-slate-900 border border-slate-800 text-slate-400 space-y-2">
            <Package size={36} className="mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-bold text-slate-300">{t.noOrdersAvailable}</p>
            <p className="text-xs text-slate-500">
              الرادار يفحص باستمرار، ستظهر الطلبات الجديدة فور نشرها من قبل الزبائن.
            </p>
          </div>
        ) : (
          availableOrders.map((order) => {
            const hasMyBid = order.offers?.some((o) => o.driverId === currentUser.id);
            const currentBidInput = customBids[order.id] || order.customerOfferPrice;

            return (
              <div
                key={order.id}
                className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3.5 transition hover:border-slate-700"
              >
                {/* Header: Distance & Customer Price */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-bold font-mono">
                      {order.distanceKm} {t.km}
                    </span>
                    <span className="text-xs text-slate-400">
                      طلب من: <strong className="text-white">{order.customerName}</strong>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">عرض الزبون:</span>
                    <span className="text-base font-black text-emerald-400 font-mono">
                      {order.customerOfferPrice} {t.dzd}
                    </span>
                  </div>
                </div>

                {/* Pickup & Dropoff Route */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-start gap-2 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 flex-shrink-0" />
                    <span><strong>الاستلام:</strong> {order.pickupAddress}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 mt-1 flex-shrink-0" />
                    <span><strong>التسليم:</strong> {order.dropoffAddress}</span>
                  </div>
                </div>

                {/* MANDATORY PACKAGE INSPECTION (PHOTO & DESCRIPTION) */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={order.packagePhotoUrl}
                      alt="Package preview"
                      className="w-14 h-14 rounded-xl object-cover border border-emerald-500/40 cursor-pointer shadow"
                      onClick={() =>
                        onOpenPackageInspection(order.packagePhotoUrl, order.packageDescription)
                      }
                    />
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                        صورة الطرد للمعاينة
                      </span>
                      <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                        {order.packageDescription}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onOpenPackageInspection(order.packagePhotoUrl, order.packageDescription)
                    }
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold flex items-center gap-1 cursor-pointer flex-shrink-0"
                  >
                    <Eye size={14} />
                    <span>معاينة</span>
                  </button>
                </div>

                {/* Negotiation Bidding Controls */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">قدم عرضك للتفاوض:</span>
                    {hasMyBid && (
                      <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                        <CheckCircle2 size={13} /> تم إرسال عرضك
                      </span>
                    )}
                  </div>

                  {/* Quick counter bid pills (+0, +50 DZD, +100 DZD, +150 DZD) */}
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleMakeBid(order, 0)}
                      className="py-2 px-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold text-center cursor-pointer transition"
                    >
                      {order.customerOfferPrice} {t.dzd}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMakeBid(order, 50)}
                      className="py-2 px-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono text-xs font-bold text-center cursor-pointer transition"
                    >
                      +{50} {t.dzd}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMakeBid(order, 100)}
                      className="py-2 px-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono text-xs font-bold text-center cursor-pointer transition"
                    >
                      +{100} {t.dzd}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMakeBid(order, 150)}
                      className="py-2 px-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono text-xs font-bold text-center cursor-pointer transition"
                    >
                      +{150} {t.dzd}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Smart License Renewal OCR Modal */}
      {isRenewalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-emerald-400" />
                <h3 className="font-bold text-sm text-white">تجديد وثيقة رخصة السياقة (OCR)</h3>
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
                <span>تم توثيق رخصة القيادة المجددة بنجاح! تم رفع تقييد الحساب فوراً.</span>
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
                <div className="w-full h-40 rounded-xl overflow-hidden border border-emerald-500">
                  <img src={renewalLicenseImage} alt="Renewed License" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-40 rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/60 flex flex-col items-center justify-center text-slate-500">
                  <FileText size={32} className="text-slate-600 mb-1" />
                  <span className="text-xs font-bold text-slate-300">صورة رخصة القيادة المجددة</span>
                  <span className="text-[10px] text-amber-400 mt-1 font-semibold">كاميرا حية مباشرة • يُمنع رفع صور من المعرض</span>
                </div>
              )}

              {isScanningRenewal && (
                <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-blue-300 text-xs flex items-center justify-center gap-2 animate-pulse">
                  <RefreshCw size={14} className="animate-spin text-blue-400" />
                  <span>جاري فحص رخصة القيادة وتاريخ الصلاحية الجديد بالذكاء الاصطناعي...</span>
                </div>
              )}

              <button
                type="button"
                disabled={isScanningRenewal}
                onClick={() => {
                  launchNativeDeviceCamera(
                    'environment',
                    (dataUrl) => handleRenewalOcr(dataUrl),
                    (errMsg) => setRenewalError(errMsg)
                  );
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95"
              >
                <Camera size={14} />
                <span>{renewalLicenseImage ? 'إعادة التقاط رخصة أخرى (كاميرا حية)' : 'التقاط صورة رخصة القيادة (كاميرا حية)'}</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              تقوم خوارزميات الذكاء الاصطناعي (OCR) بقراءة تاريخ الانتهاء الجديد والتحقق من صحة الوثيقة. عند التأكيد، يتم استئناف نشاط حسابك فوراً.
            </p>
          </div>
        </div>
      )}

      {/* Mandatory Device GPS Modal for Driver */}
      <MandatoryGpsModal
        isOpen={showGpsModal}
        status={gpsStatus}
        errorMessage={gpsErrorMessage}
        role="driver"
        onRetryGps={async () => {
          const res = await requestGps();
          if (res) {
            setShowGpsModal(false);
            setIsOnline(true);
            startLiveTracking();
          }
        }}
        onClose={() => setShowGpsModal(false)}
        onBypass={() => {
          bypassGps({ lat: currentWilayaObj.lat, lng: currentWilayaObj.lng });
          setIsOnline(true);
          setShowGpsModal(false);
        }}
      />
    </div>
  );
};
