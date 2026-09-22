import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Check,
  X,
  AlertCircle,
  Smartphone,
} from 'lucide-react';
import { NativeCameraModal } from './NativeCameraModal';
import { launchNativeDeviceCamera } from '../utils/nativeCameraBridge';

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
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(currentPhotoUrl);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Handle Gallery Image Pick
  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  // 2. Open Camera Modal
  const handleOpenCamera = () => {
    setCameraError(null);
    setIsCameraModalOpen(true);
  };

  // 3. Fallback: Direct Native OS Camera Trigger
  const handleDirectNativeCamera = () => {
    launchNativeDeviceCamera(
      'user',
      (dataUrl) => {
        setPreviewPhoto(dataUrl);
        onPhotoSelected(dataUrl);
        setCameraError(null);
      },
      (err) => {
        setCameraError(err);
      }
    );
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
        {/* Photo Display */}
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

        {/* Dual Pick Controls */}
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
            onClick={handleOpenCamera}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Camera size={14} />
            <span>التقاط بالكاميرا</span>
          </button>
        </div>

        {cameraError && (
          <div className="mt-2 text-red-300 text-[11px] flex items-center gap-1.5 text-center">
            <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}
      </div>

      {/* Native Camera Modal */}
      <NativeCameraModal
        isOpen={isCameraModalOpen}
        title={title}
        subtitle={subtitle}
        facingMode="user"
        onCapture={(dataUrl) => {
          setPreviewPhoto(dataUrl);
          onPhotoSelected(dataUrl);
        }}
        onClose={() => setIsCameraModalOpen(false)}
      />
    </div>
  );
};
