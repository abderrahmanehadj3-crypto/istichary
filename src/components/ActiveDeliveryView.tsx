import React from 'react';
import { AppTranslations } from '../i18n/translations';
import { DeliveryOrder, Language, ThemeMode, UserRole } from '../types';
import { calculateDistanceKm } from '../data/wilayas';
import { useNativeGps } from '../hooks/useNativeGps';
import { Sari3Map } from './Sari3Map';
import {
  Phone,
  Package,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Bike,
  Navigation,
  User,
} from 'lucide-react';

interface ActiveDeliveryViewProps {
  order: DeliveryOrder;
  currentRole: UserRole;
  t: AppTranslations;
  lang: Language;
  theme: ThemeMode;
  onFinishDelivery: (orderId: string) => void;
  onCancelDelivery: (orderId: string) => void;
  onOpenPackageInspection: (photoUrl: string, description: string) => void;
}

export const ActiveDeliveryView: React.FC<ActiveDeliveryViewProps> = ({
  order,
  currentRole,
  t,
  lang,
  theme,
  onFinishDelivery,
  onCancelDelivery,
  onOpenPackageInspection,
}) => {
  const driver = order.assignedDriver;
  const { coords: liveGpsCoords } = useNativeGps(true);

  // Determine effective coordinates: if driver is viewing, use their real-time device GPS!
  const effectiveDriverCoords =
    currentRole === 'driver' && liveGpsCoords
      ? liveGpsCoords
      : driver?.currentCoords || {
          lat: order.pickupCoords.lat + 0.002,
          lng: order.pickupCoords.lng + 0.002,
        };

  // Live proximity calculation (Driver to Pickup)
  const distanceToPickup = calculateDistanceKm(
    effectiveDriverCoords.lat,
    effectiveDriverCoords.lng,
    order.pickupCoords.lat,
    order.pickupCoords.lng
  );

  return (
    <div className="space-y-4 select-none">
      {/* Live Map with Route and Driver Marker */}
      <div className="rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 relative">
        <div className="p-3 bg-slate-950/80 backdrop-blur border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-black text-white">{t.deliveryInTransit}</span>
          </div>
          <span className="font-mono text-emerald-400 font-bold">
            {order.agreedPrice || order.customerOfferPrice} {t.dzd}
          </span>
        </div>

        <Sari3Map
          center={order.pickupCoords}
          pickupCoords={order.pickupCoords}
          dropoffCoords={order.dropoffCoords}
          driverCoords={effectiveDriverCoords}
          userLiveGps={liveGpsCoords}
          theme={theme}
          className="min-h-[350px] h-[350px] w-full"
        />

        {/* Live ETA & Proximity Banner */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock size={15} className="text-emerald-400" />
            <span>المسافة الحالية للكابتن:</span>
          </div>
          <div className="flex items-center gap-2">
            {distanceToPickup < 0.15 ? (
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-xs animate-pulse">
                وصل الكابتن الآن!
              </span>
            ) : (
              <span className="font-black text-white font-mono text-sm">
                {distanceToPickup} كم (~ {Math.max(2, Math.round(distanceToPickup * 2.5))} دقيقة)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Profile & Contact Details Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        {/* If Customer looking at Driver */}
        {currentRole === 'customer' ? (
          <div>
            <div className="flex items-center gap-3.5 mb-3">
              <img
                src={
                  driver?.avatarUrl ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
                }
                alt="Driver"
                className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-md"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-sm text-white">{driver?.name || 'كابتن سريع'}</h4>
                  <span className="text-xs text-amber-400 font-bold">★ {driver?.rating || 4.9}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{driver?.vehicle || 'دراجة نارية'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 font-mono text-[11px] text-emerald-400 font-bold">
                    {driver?.plate || '16-12345-121'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {driver?.phone || '+213 661 88 99 00'}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Contact & Action Buttons: Prominent Call & Cancel */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {/* Prominent Call Button */}
              <a
                id="btn-customer-call-driver"
                href={`tel:${driver?.phone || '+213661889900'}`}
                className="py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone size={17} />
                <span>{t.btnCall} ({driver?.phone || '+213 661 88 99 00'})</span>
              </a>

              {/* Prominent Cancel Button */}
              <button
                type="button"
                id="btn-customer-cancel-delivery"
                onClick={() => {
                  if (confirm(t.confirmCancelOrder || 'هل أنت متأكد من إلغاء رحلة التوصيل؟')) {
                    onCancelDelivery(order.id);
                  }
                }}
                className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-red-950/60 hover:text-red-300 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition border border-slate-700/60 hover:border-red-800/80"
              >
                <XCircle size={17} />
                <span>{t.btnCancel}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Driver View of the Customer */
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-black">
                  <User size={22} />
                </div>
                <div>
                  <h4 className="font-black text-sm text-white">{order.customerName}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{order.customerPhone}</p>
                </div>
              </div>

              {/* Driver Call Customer Button */}
              <a
                id="btn-driver-call-customer"
                href={`tel:${order.customerPhone}`}
                className="py-2.5 px-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Phone size={15} />
                <span>اتصال بالزبون</span>
              </a>
            </div>

            {/* Driver "Finish Delivery" Button (Terminates Live Tracking Permanently) */}
            <div className="pt-2">
              <button
                type="button"
                id="btn-driver-finish-delivery"
                onClick={() => onFinishDelivery(order.id)}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <CheckCircle2 size={19} />
                <span>{t.btnFinishDelivery} (إنهاء التوصيل وإغلاق الجلسة)</span>
              </button>
            </div>
          </div>
        )}

        {/* Route Details */}
        <div className="space-y-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs">
          <div className="flex items-start gap-2.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 flex-shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-slate-400">نقطة الاستلام:</p>
              <p className="font-semibold text-white">{order.pickupAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 mt-1 flex-shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-slate-400">نقطة التسليم:</p>
              <p className="font-semibold text-white">{order.dropoffAddress}</p>
            </div>
          </div>
        </div>

        {/* Package Media Inspection */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-2.5 text-xs text-slate-300">
            <Package size={17} className="text-emerald-400 flex-shrink-0" />
            <span className="truncate max-w-[200px]">{order.packageDescription}</span>
          </div>
          <button
            type="button"
            id="btn-inspect-package-photo"
            onClick={() => onOpenPackageInspection(order.packagePhotoUrl, order.packageDescription)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
          >
            <Eye size={14} />
            <span>معاينة الصورة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
