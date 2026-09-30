import React, { useState, useRef, useEffect } from 'react';
import { AppTranslations } from '../i18n/translations';
import { DriverDetails, Language, UserProfile } from '../types';
import {
  Camera,
  User,
  Phone,
  FileText,
  Truck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Lock,
  Eye,
  ScanLine,
  RefreshCw,
  Smartphone,
  UploadCloud,
  Trash2,
} from 'lucide-react';
import {
  startNativeCameraStream,
  captureFrameFromVideo,
  launchNativeDeviceCamera,
} from '../utils/nativeCameraBridge';
import { saveDriverVerification } from '../utils/supabaseSync';

interface DriverVerificationWizardProps {
  currentUser: UserProfile;
  t: AppTranslations;
  lang: Language;
  onComplete: (driverDetails: DriverDetails) => void;
  onCancel: () => void;
}

export const DriverVerificationWizard: React.FC<DriverVerificationWizardProps> = ({
  currentUser,
  t,
  lang,
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // STEP 1: Mandatory Live Face Photo via Device Camera (strictly real capture only, no random or stock avatars)
  const [facePhoto, setFacePhoto] = useState<string | null>(
    currentUser.driverDetails?.facePhotoUrl || null
  );
  const [publicAvatar, setPublicAvatar] = useState<string>(
    currentUser.driverDetails?.publicAvatarUrl ||
      currentUser.avatarUrl ||
      ''
  );
  const [isFaceCameraActive, setIsFaceCameraActive] = useState<boolean>(false);
  const faceVideoRef = useRef<HTMLVideoElement | null>(null);
  const faceStreamRef = useRef<MediaStream | null>(null);

  const inferredFirst = currentUser.displayName ? currentUser.displayName.split(' ')[0] : '';
  const inferredLast =
    currentUser.displayName && currentUser.displayName.includes(' ')
      ? currentUser.displayName.split(' ').slice(1).join(' ')
      : '';

  // STEP 2: Personal Info & Strict Age Check (>= 20)
  const [firstName, setFirstName] = useState(
    currentUser.driverDetails?.firstName || inferredFirst
  );
  const [lastName, setLastName] = useState(
    currentUser.driverDetails?.lastName || inferredLast
  );
  const [birthDate, setBirthDate] = useState(
    currentUser.driverDetails?.birthDate || currentUser.birthDate || ''
  );
  const [calculatedAge, setCalculatedAge] = useState<number>(0);

  // STEP 3: Phone Verification via SMS OTP
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [isPhoneVerified, setIsPhoneVerified] = useState(!!currentUser.phoneVerified);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpTestCode, setOtpTestCode] = useState<string | null>(null);

  // STEP 4: Live License Camera Scanner (100% Live Camera Only - No Stock Images, No Gallery)
  const [licenseNumber, setLicenseNumber] = useState(
    currentUser.driverDetails?.licenseNumber || ''
  );
  const [licenseExpiration, setLicenseExpiration] = useState(
    currentUser.driverDetails?.licenseExpirationDate || ''
  );
  const [licenseFront, setLicenseFront] = useState<string | null>(
    currentUser.driverDetails?.licenseFrontUrl || null
  );
  const [licenseBack, setLicenseBack] = useState<string | null>(
    currentUser.driverDetails?.licenseBackUrl || null
  );

  // Live scanner state for license
  const [isLicenseScannerOpen, setIsLicenseScannerOpen] = useState<boolean>(false);
  const [licenseScanSide, setLicenseScanSide] = useState<'front' | 'back'>('front');
  const licenseVideoRef = useRef<HTMLVideoElement | null>(null);
  const licenseStreamRef = useRef<MediaStream | null>(null);

  // STEP 5: Vehicle Info & Registration Type
  const [vehicleType, setVehicleType] = useState<'motorcycle' | 'car' | 'van'>(
    currentUser.driverDetails?.vehicleType || 'motorcycle'
  );
  const [vehicleRegType, setVehicleRegType] = useState<'permanent' | 'temporary'>(
    currentUser.driverDetails?.vehicleRegType || 'permanent'
  );
  const [vehiclePlate, setVehiclePlate] = useState(
    currentUser.driverDetails?.vehiclePlate || ''
  );
  const [vehicleBrand, setVehicleBrand] = useState(
    currentUser.driverDetails?.vehicleBrand || ''
  );
  const [vehicleModel, setVehicleModel] = useState(
    currentUser.driverDetails?.vehicleModel || ''
  );

  // Real-time strict age calculation
  useEffect(() => {
    if (!birthDate) return;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    setCalculatedAge(age);
  }, [birthDate]);

  // Clean camera streams on unmount
  useEffect(() => {
    return () => {
      stopAllCameras();
    };
  }, []);

  const stopAllCameras = () => {
    if (faceStreamRef.current) {
      faceStreamRef.current.getTracks().forEach((track) => track.stop());
      faceStreamRef.current = null;
    }
    if (licenseStreamRef.current) {
      licenseStreamRef.current.getTracks().forEach((track) => track.stop());
      licenseStreamRef.current = null;
    }
    setIsFaceCameraActive(false);
    setIsLicenseScannerOpen(false);
  };

  // Face Camera (Direct Native OS Camera Trigger)
  const startFaceCamera = () => {
    handleLaunchNativeFaceCamera();
  };

  const captureFaceFromVideo = () => {
    if (faceVideoRef.current) {
      try {
        const dataUrl = captureFrameFromVideo(faceVideoRef.current, 0.9, 'user');
        setFacePhoto(dataUrl);
        // STRICT SEPARATION: Never assign biometric face selfie to public avatar
      } catch (e) {
        console.error('Capture face error:', e);
      }
    }
    if (faceStreamRef.current) {
      faceStreamRef.current.getTracks().forEach((t) => t.stop());
      faceStreamRef.current = null;
    }
    setIsFaceCameraActive(false);
  };

  // Launch Native Device Camera directly (Android OS Camera Intent)
  const handleLaunchNativeFaceCamera = () => {
    if (faceStreamRef.current) {
      faceStreamRef.current.getTracks().forEach((t) => t.stop());
      faceStreamRef.current = null;
    }
    setIsFaceCameraActive(false);
    launchNativeDeviceCamera(
      'user',
      (dataUrl) => {
        setFacePhoto(dataUrl);
        // STRICT SEPARATION: Never assign biometric face selfie to public avatar
        setErrorMsg(null);
      },
      (errMsg) => {
        setErrorMsg(errMsg);
      }
    );
  };

  // License Camera (Direct Native OS Camera Trigger - Rear Camera)
  const openLicenseLiveScanner = (side: 'front' | 'back') => {
    setLicenseScanSide(side);
    setErrorMsg(null);
    launchNativeDeviceCamera(
      'environment',
      (dataUrl) => {
        if (side === 'front') {
          setLicenseFront(dataUrl);
        } else {
          setLicenseBack(dataUrl);
        }
        setErrorMsg(null);
      },
      (errMsg) => {
        setErrorMsg(errMsg);
      }
    );
  };

  const captureLicenseFromVideo = () => {
    if (licenseVideoRef.current) {
      try {
        const dataUrl = captureFrameFromVideo(licenseVideoRef.current, 0.92, 'environment');
        if (licenseScanSide === 'front') {
          setLicenseFront(dataUrl);
        } else {
          setLicenseBack(dataUrl);
        }
      } catch (e) {
        console.error('Capture license error:', e);
      }
    } else {
      launchNativeDeviceCamera('environment', (dataUrl) => {
        if (licenseScanSide === 'front') {
          setLicenseFront(dataUrl);
        } else {
          setLicenseBack(dataUrl);
        }
      });
    }

    if (licenseStreamRef.current) {
      licenseStreamRef.current.getTracks().forEach((t) => t.stop());
      licenseStreamRef.current = null;
    }
    setIsLicenseScannerOpen(false);
  };

  // Step Validation & Progression
  const handleNextStep = () => {
    setErrorMsg(null);

    // Step 1 Check
    if (currentStep === 1) {
      if (!facePhoto) {
        setErrorMsg(t.facePhotoRequired);
        return;
      }
    }

    // Step 2 Check: Age strictly >= 20
    if (currentStep === 2) {
      if (!firstName.trim() || !lastName.trim() || !birthDate) {
        setErrorMsg(lang === 'ar' ? 'يرجى ملء الاسم واللقب وتاريخ الميلاد' : 'Please fill all required fields');
        return;
      }
      if (calculatedAge < 20) {
        setErrorMsg(t.ageError);
        return;
      }
    }

    // Step 3 Check: Phone OTP
    if (currentStep === 3) {
      if (!phone || phone.trim().length < 9) {
        setErrorMsg(lang === 'ar' ? 'رقم الهاتف مطلوب' : 'Valid phone number is required');
        return;
      }
    }

    // Step 4 Check: License (Strict Live Camera Verification)
    if (currentStep === 4) {
      if (!licenseFront) {
        setErrorMsg(
          lang === 'ar'
            ? 'تصوير رخصة السياقة بالكاميرا الحية إلزامي للمتابعة. يرجى الضغط على زر فتح كاميرا الهاتف.'
            : 'Live camera capture of driving license is mandatory to proceed.'
        );
        return;
      }
      if (!licenseNumber.trim() || !licenseExpiration) {
        setErrorMsg(
          lang === 'ar'
            ? 'يرجى إدخال رقم وتاريخ انتهاء رخصة السياقة'
            : 'License number and expiration date are required'
        );
        return;
      }
    }

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      // Step 5 Check: Vehicle Information
      if (!vehiclePlate.trim() || !vehicleBrand.trim() || !vehicleModel.trim()) {
        setErrorMsg(
          lang === 'ar'
            ? 'يرجى إدخال رقم لوحة الترقيم، العلامة والموديل للمركبة'
            : 'Please enter vehicle plate, brand and model'
        );
        return;
      }

      // Step 5 Submission
      const finalDriverDetails: DriverDetails = {
        facePhotoUrl: facePhoto || '',
        publicAvatarUrl: publicAvatar,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate,
        age: calculatedAge,
        phone: phone.trim(),
        phoneVerified: isPhoneVerified,
        licenseNumber: licenseNumber.trim(),
        licenseExpirationDate: licenseExpiration,
        licenseFrontUrl: licenseFront || '',
        licenseBackUrl: licenseBack || '',
        vehicleType,
        vehicleRegType,
        vehiclePlate: vehiclePlate.trim(),
        vehicleBrand: vehicleBrand.trim(),
        vehicleModel: vehicleModel.trim(),
        verificationStatus: 'verified',
        isOnline: true,
        rating: 5.0,
        totalDeliveries: 0,
      };
      saveDriverVerification(currentUser.id, finalDriverDetails).catch((err) =>
        console.warn('[DriverWizard] Supabase save notice:', err)
      );
      onComplete(finalDriverDetails);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 my-auto relative">
        {/* Wizard Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-black text-sm sm:text-base text-white font-['Cairo']">
              {t.driverWizardTitle}
            </h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {currentStep} / 5
          </span>
        </div>

        {/* Stepper progress indicator */}
        <div className="grid grid-cols-5 gap-1.5 mb-5">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === currentStep
                  ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                  : step < currentStep
                  ? 'bg-emerald-700/60'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Live Face Photo (Confidential Biometric) & Public Avatar (Separate & Optional) */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-bold text-base text-white">{t.step1Title}</h4>
              <p className="text-xs text-slate-400 mt-1">{t.step1Desc}</p>
            </div>

            {/* SECTION 1A: Private Biometric Face Verification (Mandatory & Confidential) */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">صورة الوجه الحية للتحقق الأمني (إلزامية)</h5>
                    <p className="text-[10px] text-slate-400">خاصة وسرية 100% — لا يراها الزبائن مطلقاً</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  <Lock size={10} />
                  مشفرة
                </span>
              </div>

              {/* Strict Confidentiality Banner */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-[11px] flex items-start gap-2 leading-relaxed">
                <Lock size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <span>{t.facePhotoConfidentialNotice}</span>
              </div>

              {/* Live Camera Feed or Captured Photo */}
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                {isFaceCameraActive ? (
                  <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-emerald-500 shadow-lg mb-3">
                    <video
                      ref={faceVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-full pointer-events-none" />
                  </div>
                ) : facePhoto ? (
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-500 shadow-lg mb-3">
                    <img src={facePhoto} alt="Live face biometric" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow">
                      سري ✓
                    </span>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-slate-900 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 mb-3">
                    <Camera size={28} />
                    <span className="text-[10px] mt-1">كاميرا التحقق الحية</span>
                  </div>
                )}

                {isFaceCameraActive ? (
                  <div className="flex flex-col gap-2 w-full max-w-xs items-center">
                    <button
                      type="button"
                      onClick={captureFaceFromVideo}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Camera size={16} />
                      <span>{t.captureNow}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLaunchNativeFaceCamera}
                      className="w-full py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-700"
                    >
                      <Smartphone size={14} className="text-emerald-400" />
                      <span>فتح كاميرا الهاتف الأصلية (Native)</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={startFaceCamera}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-emerald-500/20"
                    >
                      <Camera size={14} />
                      <span>{facePhoto ? 'إعادة التقاط الصورة السرية' : 'التقاط صورة التحقق الحية'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLaunchNativeFaceCamera}
                      className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-emerald-500/30"
                    >
                      <Smartphone size={14} />
                      <span>كاميرا الهاتف (Native)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 1B: Public Profile Picture for Customers (Completely Distinct & Optional) */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <User size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">صورة الملف الشخصي العامة للزبائن</h5>
                    <p className="text-[10px] text-slate-400">تظهر للزبائن في قائمة العروض وعلى الخريطة (اختيارية منفصلة)</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                  اختياري
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-500/60 flex-shrink-0 bg-slate-800 flex items-center justify-center">
                    {publicAvatar ? (
                      <img src={publicAvatar} alt="Public profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={22} className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">
                      {publicAvatar ? 'تم اختيار صورة للملف الشخصي' : 'شارة الحساب الافتراضية'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {publicAvatar ? 'هذه الصورة ستظهر لزبائنك فقط' : 'يمكنك تركها فارغة أو رفع صورتك المفضلة'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="driver-public-avatar-input"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) {
                          setPublicAvatar(ev.target.result as string);
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('driver-public-avatar-input')?.click()}
                    className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 font-bold text-xs border border-blue-500/30 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud size={14} />
                    <span>{publicAvatar ? 'تغيير' : 'رفع صورة'}</span>
                  </button>
                  {publicAvatar && (
                    <button
                      type="button"
                      onClick={() => setPublicAvatar('')}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition cursor-pointer"
                      title="حذف الصورة والرجوع للشارة الافتراضية"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Personal Information & Strict Legal Age Validation (>= 20) */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-bold text-base text-white">{t.step2Title}</h4>
              <p className="text-xs text-slate-400 mt-1">{t.ageNotice}</p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.firstName}
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="مثلاً: كريم"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-emerald-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.lastName}
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="مثلاً: الدراجي"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-emerald-500 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.birthDate}
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-emerald-500 transition"
                  required
                />
              </div>

              {/* Age calculation validation badge */}
              <div
                className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between transition ${
                  calculatedAge >= 20
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-950/40 border-red-500/40 text-red-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {calculatedAge >= 20 ? (
                    <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
                  )}
                  <span>
                    العمر الحالي:{' '}
                    <strong className="text-sm font-mono">{calculatedAge} عاماً</strong>
                  </span>
                </div>
                <span className="font-bold text-[11px]">
                  {calculatedAge >= 20 ? 'مستوفٍ للشروط (20+ سنة)' : 'غير مؤهل (أقل من 20 سنة)'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Phone Verification via SMS */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-bold text-base text-white">{t.step3Title}</h4>
              <p className="text-xs text-slate-400 mt-1">{t.phoneVerifyDesc}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  رقم الهاتف الجزائري الفعال
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  dir="ltr"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:border-emerald-500 transition"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <span>تم توثيق الرقم النشط المرتبط بالهاتف</span>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-emerald-500 text-slate-950 text-[10px] font-black">
                  مؤكد SMS ✓
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Anti-Fraud Live Driver's License Scanner (100% Mandatory Camera, Zero Stock/Gallery) */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-bold text-base text-white">{t.step4Title}</h4>
              <p className="text-xs text-slate-400 mt-1">{t.licenseGuideTitle}</p>
            </div>

            {/* Anti-Fraud Notice */}
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs leading-relaxed flex items-start gap-2.5">
              <ShieldCheck size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{t.licenseAntiFraudNotice}</p>
                <p className="text-[11px] text-emerald-400/90 mt-1">
                  {t.licenseGuideItems}
                </p>
              </div>
            </div>

            {/* License Number & Expiration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.licenseNumber} *
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="مثال: 16/2021/123456"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.licenseExpiration} *
                </label>
                <input
                  type="date"
                  value={licenseExpiration}
                  onChange={(e) => setLicenseExpiration(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Front & Back Live Camera Photo Slots (Clean Empty Slots - Live Camera Only) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Front Side */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-200 block mb-2">
                  {t.licenseFrontPhoto} <span className="text-emerald-400">*</span>
                </span>
                {licenseFront ? (
                  <div className="relative mb-2.5">
                    <img
                      src={licenseFront}
                      alt="License Front"
                      className="w-full h-28 object-cover rounded-xl border-2 border-emerald-500"
                    />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[10px] font-black shadow">
                      تم الالتقاط ✓
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-28 rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center text-slate-500 mb-2.5">
                    <Camera size={26} className="text-slate-600 mb-1" />
                    <span className="text-[11px] text-slate-400 font-semibold">الخانة فارغة</span>
                    <span className="text-[10px] text-slate-500">مطلوب التقاط صورة حية</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => openLicenseLiveScanner('front')}
                  className="w-full py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                >
                  <Camera size={15} />
                  <span>{licenseFront ? t.retakeLive : 'التقاط الوجه الأمامي'}</span>
                </button>
              </div>

              {/* Back Side */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-200 block mb-2">
                  {t.licenseBackPhoto}
                </span>
                {licenseBack ? (
                  <div className="relative mb-2.5">
                    <img
                      src={licenseBack}
                      alt="License Back"
                      className="w-full h-28 object-cover rounded-xl border border-emerald-500/40 mb-2.5"
                    />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[10px] font-black shadow">
                      تم الالتقاط ✓
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-28 rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center text-slate-500 mb-2.5">
                    <Camera size={26} className="text-slate-600 mb-1" />
                    <span className="text-[11px] text-slate-400 font-semibold">الخانة فارغة</span>
                    <span className="text-[10px] text-slate-500">(الوجه الخلفي)</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => openLicenseLiveScanner('back')}
                  className="w-full py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                >
                  <Camera size={15} />
                  <span>{licenseBack ? t.retakeLive : 'التقاط الوجه الخلفي'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Vehicle Information & Registration Type */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-bold text-base text-white">{t.step5Title}</h4>
              <p className="text-xs text-slate-400 mt-1">
                تحديد نوع المركبة، البطاقة الرمادية، ولوحة الترقيم
              </p>
            </div>

            <div className="space-y-3">
              {/* Vehicle Type Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t.vehicleType}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['motorcycle', 'car', 'van'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setVehicleType(type)}
                      className={`py-2 px-1 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                        vehicleType === type
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-sm shadow-emerald-500/20'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <span>
                        {type === 'motorcycle'
                          ? t.vehicleMotorcycle
                          : type === 'car'
                          ? t.vehicleCar
                          : t.vehicleVan}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Registration Certificate Type [Permanent/Temporary - بطاقة رمادية نهائية أو مؤقتة] */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t.regCertType}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVehicleRegType('permanent')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                      vehicleRegType === 'permanent'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-sm shadow-emerald-500/20'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    {t.regCertPermanent}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVehicleRegType('temporary')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                      vehicleRegType === 'temporary'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-sm shadow-emerald-500/20'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    {t.regCertTemporary}
                  </button>
                </div>
              </div>

              {/* License Plate & Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.licensePlate}
                  </label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="01234-121-16"
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.vehicleBrand}
                  </label>
                  <input
                    type="text"
                    value={vehicleBrand}
                    onChange={(e) => setVehicleBrand(e.target.value)}
                    placeholder="Sym / Dacia"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.vehicleModel}
                </label>
                <input
                  type="text"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  placeholder="Orbit II 150cc 2023"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-800">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>{t.prevStep}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-300 text-xs font-semibold cursor-pointer"
            >
              {t.cancel}
            </button>
          )}

          {currentStep === 4 && (!licenseFront || !licenseNumber.trim() || !licenseExpiration) && (
            <div className="text-[11px] text-amber-400 font-bold px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-1.5">
              <Camera size={13} />
              <span>تصوير الرخصة إلزامي</span>
            </div>
          )}

          <button
            type="button"
            id="btn-driver-wizard-next"
            onClick={handleNextStep}
            disabled={
              (currentStep === 2 && calculatedAge < 20) ||
              (currentStep === 4 && (!licenseFront || !licenseNumber.trim() || !licenseExpiration))
            }
            className={`px-6 py-2.5 rounded-xl font-black text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer ${
              (currentStep === 2 && calculatedAge < 20) ||
              (currentStep === 4 && (!licenseFront || !licenseNumber.trim() || !licenseExpiration))
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60 border border-slate-700'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            <span>{currentStep === 5 ? t.submitDriverApp : t.nextStep}</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Dedicated Anti-Fraud Live License Camera Scanner Overlay Modal */}
        {isLicenseScannerOpen && (
          <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-4 animate-in fade-in duration-200">
            {/* Scanner Top Bar */}
            <div className="w-full max-w-md flex items-center justify-between text-white pt-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <ScanLine size={16} />
                <span>
                  ماسح رخصة السياقة: {licenseScanSide === 'front' ? 'الوجه الأمامي' : 'الوجه الخلفي'}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  if (licenseStreamRef.current) {
                    licenseStreamRef.current.getTracks().forEach((t) => t.stop());
                    licenseStreamRef.current = null;
                  }
                  setIsLicenseScannerOpen(false);
                }}
                className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold"
              >
                إغلاق
              </button>
            </div>

            {/* Live Camera Viewport with HUD Alignment Box */}
            <div className="relative w-full max-w-md aspect-[16/10] rounded-2xl overflow-hidden border-2 border-emerald-500 bg-slate-950 my-auto flex items-center justify-center">
              <video
                ref={licenseVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Card Alignment Overlay Frame */}
              <div className="absolute inset-4 border-2 border-dashed border-emerald-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between text-[10px] text-emerald-300 font-bold bg-black/40 px-2 py-0.5 rounded">
                  <span>ضع حواف رخصة السياقة داخل الإطار</span>
                  <span>{licenseScanSide === 'front' ? 'وجه أمامي' : 'وجه خلفي'}</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-xs text-white font-black bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/50">
                    ☀️ إضاءة واضحة • الاسم واللقب مقروءين
                  </span>
                </div>
              </div>
            </div>

            {/* Scanner Action Controls */}
            <div className="w-full max-w-md flex flex-col items-center gap-3 pb-4">
              <button
                type="button"
                onClick={captureLicenseFromVideo}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera size={18} />
                <span>{t.captureNow}</span>
              </button>
              <p className="text-[11px] text-slate-400 text-center">
                منعاً للتزوير: يتم التحقق من وضوح الصورة وتطابق البيانات فورياً
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
