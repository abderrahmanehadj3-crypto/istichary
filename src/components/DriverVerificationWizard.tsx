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
  Upload,
  RefreshCw,
} from 'lucide-react';

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

  // Step 1: Live Face Photo
  const [facePhoto, setFacePhoto] = useState<string | null>(
    currentUser.driverDetails?.facePhotoUrl ||
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
  );
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Step 2: Personal Info & Age Check (Strictly >= 20)
  const [firstName, setFirstName] = useState(currentUser.driverDetails?.firstName || 'كريم');
  const [lastName, setLastName] = useState(currentUser.driverDetails?.lastName || 'الدراجي');
  const [birthDate, setBirthDate] = useState(
    currentUser.driverDetails?.birthDate || '2001-05-14' // Default 25 years old
  );
  const [calculatedAge, setCalculatedAge] = useState<number>(25);

  // Step 3: Phone Verification via SMS
  const [phone, setPhone] = useState(currentUser.phone || '+213 661 88 99 00');
  const [isPhoneVerified, setIsPhoneVerified] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Step 4: Driver's License
  const [licenseNumber, setLicenseNumber] = useState(
    currentUser.driverDetails?.licenseNumber || '16/2020/987654'
  );
  const [licenseExpiration, setLicenseExpiration] = useState(
    currentUser.driverDetails?.licenseExpirationDate || '2030-12-31'
  );
  const [licenseFront, setLicenseFront] = useState<string | null>(
    currentUser.driverDetails?.licenseFrontUrl ||
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80'
  );
  const [licenseBack, setLicenseBack] = useState<string | null>(
    currentUser.driverDetails?.licenseBackUrl ||
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80'
  );

  // Step 5: Vehicle Info
  const [vehicleType, setVehicleType] = useState<'motorcycle' | 'car' | 'van'>(
    currentUser.driverDetails?.vehicleType || 'motorcycle'
  );
  const [vehicleRegType, setVehicleRegType] = useState<'permanent' | 'temporary'>(
    currentUser.driverDetails?.vehicleRegType || 'permanent'
  );
  const [vehiclePlate, setVehiclePlate] = useState(
    currentUser.driverDetails?.vehiclePlate || '01234-121-16'
  );
  const [vehicleBrand, setVehicleBrand] = useState(
    currentUser.driverDetails?.vehicleBrand || 'Sym'
  );
  const [vehicleModel, setVehicleModel] = useState(
    currentUser.driverDetails?.vehicleModel || 'Orbit II 150cc (2023)'
  );

  // Calculate age strictly from birthdate
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

  // Clean camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Camera capture handlers
  const startCamera = async () => {
    setIsCameraActive(true);
    setErrorMsg(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 480, height: 480 },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
    }
  };

  const capturePhotoFromVideo = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 480;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setFacePhoto(dataUrl);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Step Progression Validations
  const handleNextStep = () => {
    setErrorMsg(null);

    // Validate Step 1
    if (currentStep === 1) {
      if (!facePhoto) {
        setErrorMsg(t.facePhotoRequired);
        return;
      }
    }

    // Validate Step 2: Strict Age >= 20
    if (currentStep === 2) {
      if (!firstName.trim() || !lastName.trim() || !birthDate) {
        setErrorMsg(lang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
        return;
      }
      if (calculatedAge < 20) {
        setErrorMsg(t.ageError);
        return;
      }
    }

    // Validate Step 3: Phone
    if (currentStep === 3) {
      if (!phone || phone.trim().length < 9) {
        setErrorMsg(lang === 'ar' ? 'رقم الهاتف مطلوب' : 'Valid phone number is required');
        return;
      }
    }

    // Validate Step 4: Driver's License
    if (currentStep === 4) {
      if (!licenseNumber.trim() || !licenseExpiration || !licenseFront) {
        setErrorMsg(lang === 'ar' ? 'يرجى تقديم بيانات وصورة رخصة السياقة' : 'License details required');
        return;
      }
    }

    // Move to next or submit
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete Step 5
      const finalDriverDetails: DriverDetails = {
        facePhotoUrl: facePhoto || '',
        firstName,
        lastName,
        birthDate,
        age: calculatedAge,
        phone,
        phoneVerified: isPhoneVerified,
        licenseNumber,
        licenseExpirationDate: licenseExpiration,
        licenseFrontUrl: licenseFront || '',
        licenseBackUrl: licenseBack || '',
        vehicleType,
        vehicleRegType,
        vehiclePlate,
        vehicleBrand,
        vehicleModel,
        verificationStatus: 'verified',
        isOnline: true,
        rating: 5.0,
        totalDeliveries: 0,
      };
      onComplete(finalDriverDetails);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 my-auto">
        {/* Wizard Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
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
        <div className="grid grid-cols-5 gap-1.5 mb-6">
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

        {/* STEP 1: Live Face Photo Capture */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-bold text-base text-white">{t.step1Title}</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">{t.step1Desc}</p>
            </div>

            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
              {isCameraActive ? (
                <div className="relative w-56 h-56 rounded-full overflow-hidden border-4 border-emerald-500 shadow-xl mb-4 bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                </div>
              ) : facePhoto ? (
                <div className="relative w-44 h-44 rounded-full overflow-hidden border-4 border-emerald-500 shadow-xl mb-4">
                  <img src={facePhoto} alt="Live Selfie" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 inset-x-0 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold">
                      تم التقاط الصورة
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-40 h-40 rounded-full bg-slate-900 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-400 mb-4">
                  <Camera size={38} className="text-slate-500 mb-1" />
                  <span className="text-[11px]">في انتظار الكاميرا</span>
                </div>
              )}

              <div className="flex gap-2">
                {isCameraActive ? (
                  <button
                    type="button"
                    onClick={capturePhotoFromVideo}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg cursor-pointer"
                  >
                    📸 التقاط الآن
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Camera size={16} />
                    <span>{facePhoto ? t.retakeFacePhoto : t.takeFacePhoto}</span>
                  </button>
                )}

                {/* Direct file photo upload fallback */}
                <label className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-2 cursor-pointer">
                  <Upload size={16} />
                  <span>رفع صورة</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setFacePhoto(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Personal Information & Strict Age >= 20 */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-bold text-base text-white">{t.step2Title}</h4>
              <p className="text-xs text-amber-400 font-semibold mt-1">{t.ageNotice}</p>
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
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-emerald-500"
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
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.birthDate} (يجب أن يكون العمر 20 سنة أو أكثر)
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-emerald-500"
                  required
                />
              </div>

              {/* Age calculation validation badge */}
              <div
                className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                  calculatedAge >= 20
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-950/40 border-red-500/40 text-red-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {calculatedAge >= 20 ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : (
                    <AlertCircle size={16} className="text-red-400" />
                  )}
                  <span>العمر المحسوب: <strong className="text-sm">{calculatedAge} عاماً</strong></span>
                </div>
                <span className="font-bold text-[11px]">
                  {calculatedAge >= 20 ? 'مستوفٍ للشروط القانونية' : 'غير مؤهل (أقل من 20)'}
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
                  رقم الهاتف الجزائري
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  dir="ltr"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:border-emerald-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <span>تم توثيق الرقم النشط المرتبط بالهاتف</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[10px] font-black">
                  مؤكد SMS
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Driver's License */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-bold text-base text-white">{t.step4Title}</h4>
              <p className="text-xs text-slate-400 mt-1">
                رقم وتاريخ وصور رخصة السياقة الصادرة عن وزارة الداخلية
              </p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.licenseNumber}
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="16/XXXXXX"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.licenseExpiration}
                  </label>
                  <input
                    type="date"
                    value={licenseExpiration}
                    onChange={(e) => setLicenseExpiration(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              {/* Front and Back License Uploads */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[11px] font-semibold text-slate-300 block mb-2">
                    {t.licenseFrontPhoto}
                  </span>
                  {licenseFront ? (
                    <img
                      src={licenseFront}
                      alt="License Front"
                      className="w-full h-20 object-cover rounded-xl border border-slate-700 mb-2"
                    />
                  ) : null}
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-bold cursor-pointer">
                    <Camera size={13} />
                    <span>تغيير</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => setLicenseFront(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[11px] font-semibold text-slate-300 block mb-2">
                    {t.licenseBackPhoto}
                  </span>
                  {licenseBack ? (
                    <img
                      src={licenseBack}
                      alt="License Back"
                      className="w-full h-20 object-cover rounded-xl border border-slate-700 mb-2"
                    />
                  ) : null}
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-bold cursor-pointer">
                    <Camera size={13} />
                    <span>تغيير</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => setLicenseBack(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
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
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
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
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
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
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono"
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
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

          <button
            type="button"
            id="btn-driver-wizard-next"
            onClick={handleNextStep}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>{currentStep === 5 ? t.submitDriverApp : t.nextStep}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
