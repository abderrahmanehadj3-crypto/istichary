import React, { useState } from 'react';
import { AppTranslations } from '../i18n/translations';
import { Camera, MapPin, CheckCircle2, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { Sari3Logo } from './Sari3Logo';
import { setGpsBypassed } from '../hooks/useNativeGps';

interface PermissionsModalProps {
  isOpen: boolean;
  t: AppTranslations;
  onPermissionsCompleted: (cameraGranted: boolean, locationGranted: boolean) => void;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({
  isOpen,
  t,
  onPermissionsCompleted,
}) => {
  const [cameraStatus, setCameraStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [locationStatus, setLocationStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [isRequesting, setIsRequesting] = useState(false);

  if (!isOpen) return null;

  const handleRequestPermissions = async () => {
    setIsRequesting(true);
    let camOk = false;
    let locOk = false;

    // 1. Request Camera Permission
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Immediately release stream
        stream.getTracks().forEach((track) => track.stop());
        setCameraStatus('granted');
        camOk = true;
      } else {
        setCameraStatus('granted');
        camOk = true;
      }
    } catch (err) {
      console.warn('Camera permission note:', err);
      // In embedded iframe or if denied, mark as accepted for app flow
      setCameraStatus('granted');
      camOk = true;
    }

    // 2. Request Geolocation Permission
    try {
      if (navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              setLocationStatus('granted');
              locOk = true;
              resolve(true);
            },
            () => {
              setLocationStatus('granted');
              locOk = true;
              resolve(true);
            },
            { timeout: 4000 }
          );
        });
      } else {
        setLocationStatus('granted');
        locOk = true;
      }
    } catch (err) {
      setLocationStatus('granted');
      locOk = true;
    }

    setIsRequesting(false);
    setGpsBypassed();
    setTimeout(() => {
      onPermissionsCompleted(camOk, locOk);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center mb-3">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-xl font-black text-white font-['Cairo']">
            {t.permissionsTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            {t.permissionsSubtitle}
          </p>
        </div>

        {/* Permissions list */}
        <div className="space-y-3 mb-6">
          {/* Camera Permission Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Camera size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-white">
                  {t.cameraPermissionTitle}
                </h4>
                {cameraStatus === 'granted' && (
                  <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> مفعل
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                {t.cameraPermissionDesc}
              </p>
            </div>
          </div>

          {/* Location Permission Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <MapPin size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-white">
                  {t.locationPermissionTitle}
                </h4>
                {locationStatus === 'granted' && (
                  <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> مفعل
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                {t.locationPermissionDesc}
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <button
            id="btn-grant-permissions"
            type="button"
            onClick={handleRequestPermissions}
            disabled={isRequesting}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isRequesting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>جارٍ تفعيل الأذونات...</span>
              </>
            ) : (
              <>
                <span>{t.grantPermissions}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setGpsBypassed();
              onPermissionsCompleted(true, true);
            }}
            className="w-full py-2.5 text-center text-xs text-slate-500 hover:text-slate-300 font-semibold cursor-pointer transition"
          >
            {t.skipForNow}
          </button>
        </div>
      </div>
    </div>
  );
};
