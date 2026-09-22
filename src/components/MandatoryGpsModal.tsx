import React, { useState } from 'react';
import {
  MapPin,
  Compass,
  AlertTriangle,
  RefreshCw,
  Smartphone,
  ShieldAlert,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { GpsStatus } from '../hooks/useNativeGps';

interface MandatoryGpsModalProps {
  isOpen: boolean;
  status: GpsStatus;
  errorMessage: string | null;
  onRetryGps: () => Promise<any>;
  onEnableTestLocation: () => void;
  role?: 'customer' | 'driver';
}

export const MandatoryGpsModal: React.FC<MandatoryGpsModalProps> = ({
  isOpen,
  status,
  errorMessage,
  onRetryGps,
  onEnableTestLocation,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-6 shadow-2xl text-slate-100 relative overflow-hidden">
        {/* Animated Top Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-emerald-500/20 blur-2xl rounded-full pointer-events-none" />

        {/* Icon & Pulse Radar */}
        <div className="text-center mb-5 relative">
          <div className="relative w-16 h-16 mx-auto mb-3 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Compass size={32} className={isChecking ? 'animate-spin' : ''} />
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-[11px] font-bold inline-flex items-center gap-1.5 mb-2">
            <ShieldAlert size={13} />
            <span>تحديد موقع GPS إلزامي</span>
          </span>

          <h3 className="text-lg font-black text-white font-['Cairo']">
            {role === 'driver' ? 'تفعيل نظام GPS إلزامي للكابتن' : 'تفعيل نظام GPS إلزامي لإرسال الطلب'}
          </h3>

          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            تطبيق <span className="text-emerald-400 font-bold">سريع (Sari3)</span> يعتمد على الحساب اللحظي الدقيق للمسافات وتتبع حركة الكباتن والطرود بالوقت الحقيقي.
          </p>
        </div>

        {/* Real Device Instructions */}
        <div className="space-y-2.5 mb-6 text-xs bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">
              1
            </div>
            <p className="text-slate-300">
              اسحب شريط الإشعارات العلوي على هاتفك وتأكد من <strong className="text-white">تشغيل زر الموقع (Location / GPS)</strong>.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">
              2
            </div>
            <p className="text-slate-300">
              عند ظهور نافذة المتصفح، اختر <strong className="text-emerald-400">السماح (Allow)</strong> لتطبيق سريع بالوصول إلى موقعك.
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
          <button
            type="button"
            onClick={handleCheckNow}
            disabled={isChecking}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw size={17} className={isChecking ? 'animate-spin' : ''} />
            <span>{isChecking ? 'جارٍ فحص استجابة GPS...' : 'إعادة فحص وتفعيل GPS الآن'}</span>
          </button>

          {/* Fallback for Desktop Browsers / Sandbox Emulators */}
          <button
            type="button"
            onClick={onEnableTestLocation}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition border border-slate-700/60"
          >
            <Radio size={14} className="text-emerald-400" />
            <span>متابعة بإحداثيات تجريبية للجزائر (للمحاكاة)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
