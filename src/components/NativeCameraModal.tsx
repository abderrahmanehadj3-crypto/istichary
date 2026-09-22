import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X,
  RotateCcw,
  Check,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  startNativeCameraStream,
  captureFrameFromVideo,
  launchNativeDeviceCamera,
  isMobileWebView,
} from '../utils/nativeCameraBridge';

interface NativeCameraModalProps {
  isOpen: boolean;
  title: string;
  subtitle: string;
  facingMode?: 'user' | 'environment';
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

export const NativeCameraModal: React.FC<NativeCameraModalProps> = ({
  isOpen,
  title,
  subtitle,
  facingMode = 'user',
  onCapture,
  onClose,
}) => {
  const effectiveFacingMode: 'user' | 'environment' =
    facingMode === 'environment' ? 'environment' : 'user';
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks cleanly
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  };

  // Launch Camera (WebRTC if allowed, otherwise native OS Camera immediately)
  const initCamera = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      if (videoRef.current && navigator.mediaDevices?.getUserMedia) {
        const stream = await startNativeCameraStream(videoRef.current, effectiveFacingMode);
        streamRef.current = stream;
        setStreamActive(true);
      } else {
        // Direct Native OS Camera
        handleTriggerNativeIntent();
      }
    } catch (err: any) {
      console.warn('[NativeCameraModal] WebView stream unavailable, triggering Native OS Camera immediately');
      handleTriggerNativeIntent();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !capturedPhoto) {
      initCamera();
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Snap from live stream
  const handleSnap = () => {
    if (videoRef.current) {
      try {
        const photo = captureFrameFromVideo(videoRef.current, 0.9, effectiveFacingMode);
        setCapturedPhoto(photo);
        stopStream();
      } catch (e) {
        console.error('Capture error:', e);
      }
    }
  };

  // Retake
  const handleRetake = () => {
    setCapturedPhoto(null);
    initCamera();
  };

  // Confirm photo
  const handleConfirm = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      onClose();
    }
  };

  // Fallback: Trigger native OS Camera Intent
  const handleTriggerNativeIntent = () => {
    stopStream();
    launchNativeDeviceCamera(
      effectiveFacingMode,
      (dataUrl) => {
        setCapturedPhoto(dataUrl);
        setErrorMessage(null);
      },
      (err) => {
        setErrorMessage(err);
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-100 flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="font-black text-sm text-white font-['Cairo']">{title}</h3>
              <p className="text-[11px] text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder or Captured Preview */}
        <div className="relative w-64 h-64 rounded-3xl overflow-hidden border-2 border-emerald-500/60 bg-black shadow-xl flex items-center justify-center mb-4">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-10 text-emerald-400 gap-2">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-xs font-bold">جارٍ تفعيل الكاميرا...</span>
            </div>
          )}

          {capturedPhoto ? (
            <img
              src={capturedPhoto}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
              {/* Selfie Alignment Guide Ring */}
              <div className="absolute inset-4 border-2 border-dashed border-emerald-400/50 rounded-full pointer-events-none" />
            </>
          )}
        </div>

        {/* Error / Fallback Banner */}
        {errorMessage && (
          <div className="w-full p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs mb-4 flex items-start gap-2 text-start">
            <Smartphone size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[11px] leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="w-full space-y-2">
          {capturedPhoto ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleRetake}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={15} />
                <span>إعادة الالتقاط</span>
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check size={16} />
                <span>تأكيد الصورة</span>
              </button>
            </div>
          ) : streamActive ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSnap}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera size={18} />
                <span>التقاط الصورة الآن</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerNativeIntent}
                className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700/60"
              >
                <Smartphone size={14} className="text-emerald-400" />
                <span>فتح كاميرا الهاتف الأصلية (Native OS)</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleTriggerNativeIntent}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Smartphone size={18} />
              <span>تشغيل كاميرا الهاتف الآن</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
