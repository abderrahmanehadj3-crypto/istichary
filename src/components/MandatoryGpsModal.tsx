import React, { useState } from 'react';
import {
  Compass,
  RefreshCw,
  Settings,
  X,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import {
  GpsStatus,
  openNativeLocationSettings,
  setGpsBypassed,
  isGpsBypassed,
} from '../hooks/useNativeGps';

interface MandatoryGpsModalProps {
  isOpen: boolean;
  status: GpsStatus;
  errorMessage: string | null;
  onRetryGps: () => Promise<any>;
  onClose?: () => void;
  onBypass?: () => void;
  role?: 'customer' | 'driver';
}

export const MandatoryGpsModal: React.FC<MandatoryGpsModalProps> = ({
  isOpen,
  onRetryGps,
  onClose,
  onBypass,
  role = 'customer',
}) => {
  const [isChecking, setIsChecking] = useState<boolean>(false);

  // If already bypassed or not open, completely hide modal
  if (!isOpen || isGpsBypassed()) return null;

  // Unconditional, absolute bypass handler
  const handleBypass = () => {
    // 1. Save bypass flag to localStorage
    setGpsBypassed();

    // 2. Trigger parent callbacks
    if (onBypass) {
      try {
        onBypass();
      } catch (e) {
        console.warn('onBypass error:', e);
      }
    }
    if (onClose) {
      try {
        onClose();
      } catch (e) {
        console.warn('onClose error:', e);
      }
    }

    // 3. Immediately scroll to map interface
    setTimeout(() => {
      const mapElem =
        document.getElementById('sari3-main-map') ||
        document.querySelector('.leaflet-container');
      if (mapElem) {
        mapElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  const handleCheckNow = async () => {
    setIsChecking(true);
    try {
      await onRetryGps();
    } catch (e) {
      // In case of error, auto-bypass to never lock the user
      handleBypass();
    } finally {
      setIsChecking(false);
    }
  };

  const handleOpenSettings = () => {
    openNativeLocationSettings();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-6 shadow-2xl text-slate-100 relative overflow-hidden">
        {/* Animated Top Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-emerald-500/20 blur-2xl rounded-full pointer-events-none" />

        {/* Close Button: immediately dismisses and bypasses */}
        <button
          type="button"
          onClick={handleBypass}
          aria-label="إغلاق والتخطي"
          className="absolute top-4 left-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer z-10"
        >
          <X size={18} />
        </button>

        {/* Icon & Pulse Radar */}
        <div className="text-center mb-5 relative pt-1">
          <div className="relative w-16 h-16 mx-auto mb-3 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Compass size={32} className={isChecking ? 'animate-spin' : ''} />
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold inline-flex items-center gap-1.5 mb-2">
            <MapPin size={13} />
            <span>تحديد موقع GPS</span>
          </span>

          <h3 className="text-lg font-black text-white font-['Cairo']">
            {role === 'driver' ? 'تفعيل نظام GPS للكابتن' : 'تفعيل إذن الموقع GPS'}
          </h3>

          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            يمكنك تفعيل GPS أو المتابعة فوراً باختيار موقعك يدوياً على الخريطة.
          </p>
        </div>

        {/* Real Device Instructions */}
        <div className="space-y-2.5 mb-6 text-xs bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">
              1
            </div>
            <p className="text-slate-300">
              لتحديد موقعك تلقائياً، تأكد من <strong className="text-white">تشغيل زر الموقع (GPS)</strong> بهاتفك.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">
              2
            </div>
            <p className="text-slate-300">
              أو اضغط زر <strong className="text-emerald-400 font-bold">المتابعة بالموقع المحدد (تخطي)</strong> أدناه للانتقال للخريطة مباشرة.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* 1. ABSOLUTE UNCONDITIONAL OVERRIDE / BYPASS BUTTON (PRIMARY PROMINENT) */}
          <button
            type="button"
            id="btn-gps-bypass-override"
            onClick={handleBypass}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-black flex items-center justify-center gap-2 cursor-pointer transition shadow-xl shadow-emerald-500/25 active:scale-[0.98]"
          >
            <CheckCircle2 size={18} className="text-slate-950" />
            <span>المتابعة بالموقع المحدد على الخريطة (تخطي)</span>
          </button>

          {/* 2. Optional Retry GPS */}
          <button
            type="button"
            onClick={handleCheckNow}
            disabled={isChecking}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
          >
            <RefreshCw size={14} className={isChecking ? 'animate-spin' : ''} />
            <span>{isChecking ? 'جارٍ قراءة موقع GPS...' : 'إعادة فحص GPS تلقائياً'}</span>
          </button>

          {/* 3. Android Native Settings Intent */}
          <button
            type="button"
            onClick={handleOpenSettings}
            className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition"
          >
            <Settings size={13} className="text-slate-400" />
            <span>فتح إعدادات الموقع بالهاتف</span>
          </button>
        </div>
      </div>
    </div>
  );
};
