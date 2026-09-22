import React, { useState } from 'react';
import {
  Compass,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  Settings,
  X,
  CheckCircle2,
} from 'lucide-react';
import { GpsStatus, openNativeLocationSettings } from '../hooks/useNativeGps';

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
  errorMessage,
  onRetryGps,
  onClose,
  onBypass,
  role = 'customer',
}) => {
  const [isChecking, setIsChecking] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCheckNow = async () => {
    setIsChecking(true);
    try {
      await onRetryGps();
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

        {/* Close Button to prevent unescapable loops */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="absolute top-4 left-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer z-10"
          >
            <X size={18} />
          </button>
        )}

        {/* Icon & Pulse Radar */}
        <div className="text-center mb-5 relative pt-1">
          <div className="relative w-16 h-16 mx-auto mb-3 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Compass size={32} className={isChecking ? 'animate-spin' : ''} />
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-bold inline-flex items-center gap-1.5 mb-2">
            <ShieldAlert size={13} />
            <span>تحديد موقع GPS الحقيقي</span>
          </span>

          <h3 className="text-lg font-black text-white font-['Cairo']">
            {role === 'driver' ? 'تفعيل نظام GPS للكابتن' : 'تفعيل إذن الموقع GPS'}
          </h3>

          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            تطبيق <span className="text-emerald-400 font-bold">سريع (Sari3)</span> يحتاج إلى إحداثيات الموقع لحساب مسافات التوصيل وتتبع الكباتن بدقة.
          </p>
        </div>

        {/* Real Device Instructions */}
        <div className="space-y-2.5 mb-6 text-xs bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">
              1
            </div>
            <p className="text-slate-300">
              اسحب شريط الإشعارات العلوي على هاتفك وتأكد من <strong className="text-white">تشغيل زر الموقع (GPS)</strong>.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">
              2
            </div>
            <p className="text-slate-300">
              عند ظهور نافذة الهاتف، اضغط <strong className="text-emerald-400">السماح (Allow)</strong> لتطبيق Sari3 بالوصول لموقع الجهاز.
            </p>
          </div>

          {errorMessage && (
            <div className="mt-2 p-2 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-[11px] flex items-start gap-1.5">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Primary Retry Button */}
          <button
            type="button"
            onClick={handleCheckNow}
            disabled={isChecking}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw size={17} className={isChecking ? 'animate-spin' : ''} />
            <span>{isChecking ? 'جارٍ قراءة موقع GPS...' : 'إعادة فحص وتفعيل GPS الآن'}</span>
          </button>

          {/* Android Native Settings Intent Button */}
          <button
            type="button"
            onClick={handleOpenSettings}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition border border-slate-700/60"
          >
            <Settings size={14} className="text-emerald-400" />
            <span>فتح إعدادات الموقع بالهاتف (Android Settings)</span>
          </button>

          {/* Seamless Fallback / Bypass Button to prevent unescapable loop */}
          {onBypass && (
            <button
              type="button"
              onClick={onBypass}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition border border-emerald-500/30"
            >
              <CheckCircle2 size={15} />
              <span>المتابعة بالموقع المحدد على الخريطة (تخطي)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
