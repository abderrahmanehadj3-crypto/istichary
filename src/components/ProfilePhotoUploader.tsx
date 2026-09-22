import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

interface ProfilePhotoUploaderProps {
  currentPhotoUrl: string | null;
  onPhotoSelected: (photoUrl: string) => void;
  title?: string;
  subtitle?: string;
}

export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  currentPhotoUrl,
  onPhotoSelected,
  title = 'الصورة الشخصية',
  subtitle = 'اختر صورة من المعرض أو التقط صورة حية بالكاميرا',
}) => {
  const [activeMode, setActiveMode] = useState<'idle' | 'camera'>('idle');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(currentPhotoUrl);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // 1. Handle Gallery Image Pick
  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size < 10MB
    if (file.size > 10 * 1024 * 1024) {
      setCameraError('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 10 ميغابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setPreviewPhoto(dataUrl);
        onPhotoSelected(dataUrl);
        setCameraError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // 2. Start Live Camera
  const startCamera = async () => {
    setCameraError(null);
    setActiveMode('camera');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('الكاميرا غير مدعومة على هذا المتصفح');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError('تعذر الوصول إلى الكاميرا. يرجى السماح بالإذن أو رفع صورة من المعرض');
      setActiveMode('idle');
    }
  };

  // 3. Snap Photo from Video
  const capturePhoto = () => {
    if (!videoRef.current) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 480;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setPreviewPhoto(dataUrl);
        onPhotoSelected(dataUrl);
      }
    } catch (err) {
      console.error('Failed to capture frame:', err);
    }

    stopCamera();
    setActiveMode('idle');
  };

  return (
    <div className="space-y-3">
      {/* Hidden File Input for Gallery Selection */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleGalleryFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      <div className="flex flex-col items-center">
        {/* Photo Display / Viewfinder */}
        {activeMode === 'camera' ? (
          <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-emerald-500 shadow-xl shadow-emerald-500/20 bg-black flex items-center justify-center mb-3">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
            <div className="absolute inset-0 border-2 border-dashed border-emerald-400/60 rounded-full pointer-events-none" />
          </div>
        ) : (
          <div className="relative w-28 h-28 rounded-full overflow-hidden border-3 border-emerald-500 shadow-lg bg-slate-900 flex items-center justify-center mb-3">
            {previewPhoto ? (
              <img
                src={previewPhoto}
                alt="Profile Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center text-slate-500">
                <Camera size={28} />
                <span className="text-[10px] mt-1 font-bold">لا توجد صورة</span>
              </div>
            )}
          </div>
        )}

        {/* Live Camera Controls or Dual Pick Buttons */}
        {activeMode === 'camera' ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={capturePhoto}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Camera size={14} />
              <span>التقاط الآن</span>
            </button>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setActiveMode('idle');
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <X size={14} />
              <span>إلغاء</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Gallery Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer hover:border-emerald-500/40"
            >
              <ImageIcon size={14} className="text-emerald-400" />
              <span>اختيار من المعرض</span>
            </button>

            {/* Live Camera Button */}
            <button
              type="button"
              onClick={startCamera}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Camera size={14} />
              <span>التقاط بالكاميرا</span>
            </button>
          </div>
        )}

        {cameraError && (
          <div className="mt-2 text-red-300 text-[11px] flex items-center gap-1.5 text-center">
            <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}
      </div>
    </div>
  );
};
