import React from 'react';
import { AppTranslations } from '../i18n/translations';
import { DeliveryOrder, Language, ThemeMode, UserRole } from '../types';
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

  return (
    <div className="space-y-4">
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
          driverCoords={
            driver?.currentCoords || {
              lat: order.pickupCoords.lat + 0.002,
              lng: order.pickupCoords.lng + 0.002,
            }
          }
          theme={theme}
          className="h-64 sm:h-72 w-full"
        />

        {/* Live ETA Banner */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock size={15} className="text-emerald-400" />
            <span>وقت الوصول المتوقع:</span>
          </div>
          <span className="font-black text-white font-mono text-sm">~ 10-15 دقيقة</span>
        </div>
      </div>

      {/* Driver/Customer Info Card */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={
                driver?.avatarUrl ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
              }
              alt="Driver"
              className="w-13 h-13 rounded-full object-cover border-2 border-emerald-500 shadow-md"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-black text-sm text-white">{driver?.name || 'كابتن سريع'}</h4>
                <span className="text-xs text-amber-400 font-bold">★ {driver?.rating || 4.9}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{driver?.vehicle || 'دراجة نارية'}</p>
              <p className="text-[11px] font-mono text-emerald-400 font-bold">{driver?.plate}</p>
            </div>
          </div>

          {/* Direct Call Button */}
          <a
            href={`tel:${driver?.phone || order.customerPhone}`}
            className="p-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Phone size={18} />
            <span className="text-xs font-black">{t.btnCall}</span>
          </a>
        </div>

        {/* Route Details */}
        <div className="space-y-2 p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs">
          <div className="flex items-start gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 flex-shrink-0" />
            <span><strong>الاستلام:</strong> {order.pickupAddress}</span>
          </div>
          <div className="flex items-start gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 mt-1 flex-shrink-0" />
            <span><strong>التسليم:</strong> {order.dropoffAddress}</span>
          </div>
        </div>

        {/* Package Media Inspection */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Package size={16} className="text-emerald-400" />
            <span className="truncate max-w-[200px]">{order.packageDescription}</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenPackageInspection(order.packagePhotoUrl, order.packageDescription)}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Eye size={13} />
            <span>معاينة الصورة</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="pt-2">
          {currentRole === 'driver' ? (
            <button
              type="button"
              id="btn-finish-delivery"
              onClick={() => onFinishDelivery(order.id)}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <CheckCircle2 size={18} />
              <span>{t.btnFinishDelivery} (إنهاء التوصيل)</span>
            </button>
          ) : (
            <button
              type="button"
              id="btn-cancel-delivery"
              onClick={() => {
                if (confirm('هل أنت متأكد من إلغاء رحلة التوصيل؟')) {
                  onCancelDelivery(order.id);
                }
              }}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-red-950/40 hover:text-red-400 text-slate-400 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition border border-transparent hover:border-red-800/50"
            >
              <XCircle size={16} />
              <span>{t.btnCancel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
