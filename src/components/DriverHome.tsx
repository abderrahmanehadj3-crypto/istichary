import React, { useState } from 'react';
import { AppTranslations } from '../i18n/translations';
import { DeliveryOrder, DriverOffer, Language, ThemeMode, UserProfile } from '../types';
import { ALGERIA_WILAYAS, getWilayaByCode } from '../data/wilayas';
import { Sari3Map } from './Sari3Map';
import { useNativeGps } from '../hooks/useNativeGps';
import { MandatoryGpsModal } from './MandatoryGpsModal';
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
} from 'lucide-react';

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
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [customBids, setCustomBids] = useState<Record<string, number>>({});
  const currentWilayaObj = getWilayaByCode(selectedWilaya);

  // Native GPS Hook for Driver
  const {
    coords: driverGpsCoords,
    status: gpsStatus,
    errorMessage: gpsErrorMessage,
    requestGps,
    startLiveTracking,
    stopLiveTracking,
  } = useNativeGps(isOnline);
  const [showGpsModal, setShowGpsModal] = useState<boolean>(false);

  // Check if driver has an active assigned mission
  const activeMission = orders.find(
    (o) =>
      o.assignedDriver?.id === currentUser.id &&
      (o.status === 'accepted' || o.status === 'in_transit')
  );

  // Toggle online with real GPS validation
  const handleToggleOnline = async () => {
    if (!isOnline) {
      const coords = await requestGps();
      if (!coords && (gpsStatus === 'denied' || gpsStatus === 'disabled')) {
        setShowGpsModal(true);
        return;
      }
      setIsOnline(true);
      startLiveTracking();
    } else {
      setIsOnline(false);
      stopLiveTracking();
    }
  };

  // Filter available broadcast orders in this Wilaya
  const availableOrders = orders.filter(
    (o) =>
      o.wilaya === selectedWilaya &&
      (o.status === 'searching' || o.status === 'negotiating') &&
      (!activeMission || o.id === activeMission.id)
  );

  // Submit Counter Offer with GPS coordinates
  const handleMakeBid = (order: DeliveryOrder, extraAmount: number = 0) => {
    if (gpsStatus === 'denied' || gpsStatus === 'disabled') {
      setShowGpsModal(true);
      return;
    }

    const baseAmount = customBids[order.id] || order.customerOfferPrice;
    const finalBid = baseAmount + extraAmount;

    const offer: DriverOffer = {
      id: `off-${Date.now()}`,
      orderId: order.id,
      driverId: currentUser.id,
      driverName: currentUser.displayName,
      driverPhone: currentUser.phone || '+213 661 00 00 00',
      driverRating: currentUser.driverDetails?.rating || 4.9,
      driverAvatar:
        currentUser.driverDetails?.facePhotoUrl ||
        currentUser.avatarUrl ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      vehicleInfo: `${currentUser.driverDetails?.vehicleBrand || 'Sym'} (${currentUser.driverDetails?.vehiclePlate || '16-Matricule'})`,
      vehiclePlate: currentUser.driverDetails?.vehiclePlate || '16-12345-121',
      offeredPrice: finalBid,
      etaMinutes: 10,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    onSendOffer(offer);
  };

  return (
    <div className="space-y-5">
      {/* Driver Header & Online Toggle */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={
                currentUser.driverDetails?.facePhotoUrl ||
                currentUser.avatarUrl ||
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'
              }
              alt="Driver avatar"
              className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-md"
            />
            <span
              className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
              }`}
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-sm text-white">{currentUser.displayName}</h3>
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
            className="h-48 w-full"
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
      />
    </div>
  );
};
