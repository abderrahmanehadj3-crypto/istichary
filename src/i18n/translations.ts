import { Language } from '../types';

export interface Translations {
  appName: string;
  tagline: string;
  
  // Navigation
  navHome: string;
  navConsultations: string;
  navNearby: string;
  navFollowed: string;
  navProfile: string;
  navAdmin: string;

  // Common UI
  searchPlaceholder: string;
  specializations: string;
  allSpecialties: string;
  allDoctors: string;
  verifiedDoctorBadge: string;
  pendingVerification: string;
  verified: string;
  experienceYears: string;
  urgent: string;
  normal: string;
  low: string;
  cancel: string;
  confirm: string;
  save: string;
  delete: string;
  submit: string;
  loading: string;
  success: string;
  error: string;
  viewDetails: string;
  close: string;

  // Follow feature
  followDoctor: string;
  followingDoctor: string;
  unfollowDoctor: string;
  followedDoctors: string;
  noFollowedDoctors: string;
  filterFollowedOnly: string;

  // Doctor Star Rating System
  rateDoctor: string;
  ratingStars: string;
  rateDoctorModalTitle: string;
  submitRating: string;
  yourRating: string;
  ratingSuccess: string;
  basedOnReviews: string;
  ratingPrompt: string;
  alreadyRated: string;
  ratingAverage: string;

  // Nearby Doctors & Strict Location Restrictions
  nearbyDoctorsTitle: string;
  nearbyDoctorsSubtitle: string;
  filterByCity: string;
  allCities: string;
  verifiedClinicLocation: string;
  workingHours: string;
  clinicAddress: string;
  practiceDetails: string;
  onlyVerifiedDoctorsCanSetLocation: string;
  patientsCannotAddClinics: string;
  updateClinicLocation: string;
  clinicNamePlaceholder: string;
  clinicCityPlaceholder: string;
  clinicAddressPlaceholder: string;
  clinicHoursPlaceholder: string;
  clinicUpdatedSuccess: string;
  noNearbyDoctorsFound: string;
  viewOnMap: string;

  // Notifications & Interactions Center
  notificationsTitle: string;
  notificationsSubtitle: string;
  allNotifications: string;
  followNotifications: string;
  replyNotifications: string;
  interactionNotifications: string;
  noNotifications: string;
  markAllAsRead: string;
  clearAllNotifications: string;
  startedFollowingYou: string;
  doctorRepliedToYourInquiry: string;
  patientRatedYourConsultation: string;
  likedYourResponse: string;
  likePost: string;
  likedPost: string;

  // Auth & Account
  signIn: string;
  signOut: string;
  signUp: string;
  signUpAsPatient: string;
  signUpAsDoctor: string;
  loginTitle: string;
  username: string;
  usernamePlaceholder: string;
  emailPrivate: string;
  emailPrivateNotice: string;
  updateEmail: string;
  newEmailPlaceholder: string;
  emailUpdatedSuccess: string;
  password: string;
  passwordPlaceholder: string;
  confirmPassword: string;
  forgotPassword: string;
  resetPassword: string;
  changePassword: string;
  currentPassword: string;
  newPassword: string;
  passwordChangedSuccess: string;
  sendResetLink: string;
  resetCodeSent: string;
  doctorRealNameOptional: string;
  doctorRealNameNotice: string;
  doctorRealNamePlaceholder: string;
  showRealNameOnProfile: string;
  doctorSpecialtyMandatory: string;
  doctorSpecialtyNotice: string;
  medicalLicenseNumber: string;
  medicalLicensePlaceholder: string;
  uploadMedicalLicense: string;
  licenseFileUploaded: string;
  licenseVerificationNotice: string;
  noGenderPrivacyNotice: string;
  avatarRoleNotice: string;
  alreadyHaveAccount: string;
  dontHaveAccount: string;
  switchRole: string;

  // Inactive Account & Deletion
  accountDeactivatedNotice: string;
  inactivePolicyDesc: string;
  lastActiveDate: string;
  accountActiveStatus: string;
  deleteAccount: string;
  deleteAccountWarning: string;
  enterPasswordToDelete: string;
  accountDeletedSuccess: string;

  // Public Consultations & Input
  publicConsultationsTitle: string;
  publicConsultationsSubtitle: string;
  homePostInputPlaceholder: string;
  newConsultationPost: string;
  publishInquiryBtn: string;
  postTitlePlaceholder: string;
  postSymptomsPlaceholder: string;
  selectSpecialty: string;
  discussionThread: string;
  doctorRepliesOnlyNotice: string;
  patientAuthorBadge: string;
  verifiedDoctorReplyBadge: string;
  otherPatientBlockedNotice: string;
  replyPlaceholder: string;
  doctorAdvicePlaceholder: string;
  patientFollowUpPlaceholder: string;
  sendReply: string;
  noPostsYet: string;
  noPrivateDMsNotice: string;
  inquiryPublishedSuccess: string;
  doctorReplySentSuccess: string;

  // Moderation
  moderationActiveBadge: string;
  moderationBannedBadge: string;
  moderationRestrictedBadge: string;
  bannedAlertTitle: string;
  bannedAlertDesc: string;
  restrictedAlertTitle: string;
  restrictedAlertDesc: string;

  // Appearance & Language
  language: string;
  theme: string;
  lightMode: string;
  darkMode: string;

  // Admin & Review
  adminDashboard: string;
  moderatorDashboard: string;
  verificationQueue: string;
  pendingApplicationsCount: string;
  approveDoctor: string;
  rejectDoctor: string;
  rejectionReasonPrompt: string;
  medicalDocumentsConfidential: string;
  restrictedReviewNotice: string;
  doctorVerifiedSuccess: string;
  doctorRejectedSuccess: string;
  systemMetrics: string;
  teamManagement: string;
  appointModerator: string;
  revokeModerator: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'Istichary',
    tagline: 'Minimalist Medical Consultations & Verified Doctors',
    
    // Navigation
    navHome: 'Consultations',
    navConsultations: 'Feed',
    navNearby: 'Nearby',
    navFollowed: 'Followed',
    navProfile: 'Profile',
    navAdmin: 'Verification',

    // Common UI
    searchPlaceholder: 'Search medical questions, symptoms, specialties...',
    specializations: 'Specialties',
    allSpecialties: 'All Specialties',
    allDoctors: 'All Specialists',
    verifiedDoctorBadge: 'Verified Specialist',
    pendingVerification: 'Verification Pending',
    verified: 'Verified Doctor',
    experienceYears: 'yrs clinical experience',
    urgent: 'Urgent Priority',
    normal: 'Standard Query',
    low: 'Routine Inquiry',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save Changes',
    delete: 'Delete Permanently',
    submit: 'Post Inquiry',
    loading: 'Processing...',
    success: 'Success',
    error: 'An error occurred',
    viewDetails: 'View Details',
    close: 'Close',

    // Follow feature
    followDoctor: '+ Follow Specialist',
    followingDoctor: '✓ Following',
    unfollowDoctor: 'Unfollow',
    followedDoctors: 'Followed Specialists',
    noFollowedDoctors: 'You are not following any specialists yet. Follow doctors from their consultation replies.',
    filterFollowedOnly: '⭐ Followed Specialists',

    // Doctor Star Rating System
    rateDoctor: 'Rate Doctor',
    ratingStars: 'Star Rating',
    rateDoctorModalTitle: 'Rate Specialist Consultation',
    submitRating: 'Submit Rating',
    yourRating: 'Your Rating',
    ratingSuccess: 'Thank you! Specialist rating has been recorded.',
    basedOnReviews: 'ratings',
    ratingPrompt: 'Clinical feedback (optional)',
    alreadyRated: 'You rated this doctor',
    ratingAverage: 'Average Rating',

    // Nearby Doctors & Strict Location Restrictions
    nearbyDoctorsTitle: 'Nearby Verified Doctors & Clinics',
    nearbyDoctorsSubtitle: 'Discover authenticated clinics and practice locations verified by our medical board',
    filterByCity: 'Filter by City',
    allCities: 'All Cities & Regions',
    verifiedClinicLocation: 'Verified Clinic Practice',
    workingHours: 'Working Hours',
    clinicAddress: 'Clinic Address',
    practiceDetails: 'Clinic Practice & Location Settings',
    onlyVerifiedDoctorsCanSetLocation: '🔒 STRICT CLINICAL RULE: Only verified doctors are allowed to set or update clinic locations. Patients have ZERO permission to add or modify locations to prevent fraudulent entries.',
    patientsCannotAddClinics: 'Patient Notice: All clinic practice locations on Istichary are strictly verified through authentic medical board licenses.',
    updateClinicLocation: 'Save Clinic Location',
    clinicNamePlaceholder: 'e.g. Heart & Vascular Specialty Clinic',
    clinicCityPlaceholder: 'e.g. Paris, Algiers, Casablanca, Dubai, London',
    clinicAddressPlaceholder: 'e.g. 14 Medical Boulevard, Suite 300',
    clinicHoursPlaceholder: 'e.g. Mon - Fri: 08:30 - 16:30',
    clinicUpdatedSuccess: 'Clinic location details updated and verified successfully!',
    noNearbyDoctorsFound: 'No verified clinics found in this city currently.',
    viewOnMap: 'View Clinic Details',

    // Notifications & Interactions Center
    notificationsTitle: 'Notifications & Activity Center',
    notificationsSubtitle: 'Real-time alerts for specialist replies, patient follows, and clinical ratings',
    allNotifications: 'All Activity',
    followNotifications: 'Follows',
    replyNotifications: 'Replies',
    interactionNotifications: 'Ratings & Likes',
    noNotifications: 'No notifications at this time.',
    markAllAsRead: 'Mark all as read',
    clearAllNotifications: 'Clear all',
    startedFollowingYou: 'started following your specialist profile',
    doctorRepliedToYourInquiry: 'replied to your consultation inquiry',
    patientRatedYourConsultation: 'submitted a star rating for your consultation',
    likedYourResponse: 'found your medical guidance helpful',
    likePost: 'Helpful',
    likedPost: 'Helpful ✓',

    // Auth & Account
    signIn: 'Sign In',
    signOut: 'Sign Out',
    signUp: 'Sign Up',
    signUpAsPatient: 'Patient Sign-Up',
    signUpAsDoctor: 'Doctor Registration',
    loginTitle: 'Access your account',
    username: 'Unique Username',
    usernamePlaceholder: '@unique_handle (e.g. @sarah_k)',
    emailPrivate: 'Registered Private Email',
    emailPrivateNotice: '🔒 Strictly Private & Encrypted: Never displayed publicly to other users.',
    updateEmail: 'Update Private Email',
    newEmailPlaceholder: 'Enter new private email address',
    emailUpdatedSuccess: 'Private email updated successfully!',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    passwordChangedSuccess: 'Password changed successfully!',
    sendResetLink: 'Send Recovery Link',
    resetCodeSent: 'A secure recovery link has been dispatched to your private email.',
    doctorRealNameOptional: 'Doctor Real Name (Optional)',
    doctorRealNameNotice: 'Displaying your verified real name alongside your specialty builds clinical trust.',
    doctorRealNamePlaceholder: 'Dr. Sarah Chen, MD',
    showRealNameOnProfile: 'Display real clinical name publicly next to username',
    doctorSpecialtyMandatory: 'Medical Specialty (Mandatory)',
    doctorSpecialtyNotice: 'Your specialty is mandatorily displayed in high visibility on all clinical responses.',
    medicalLicenseNumber: 'Medical Board License Number',
    medicalLicensePlaceholder: 'e.g. MD-8392-CARD',
    uploadMedicalLicense: 'Upload Medical License / Certificate (PDF/JPG)',
    licenseFileUploaded: 'Document attached for board verification',
    licenseVerificationNotice: 'Uploaded documents are strictly confidential and reviewed solely by the verification board.',
    noGenderPrivacyNotice: '🛡️ Privacy First: We do not collect or display any gender field.',
    avatarRoleNotice: 'Role avatar assigned automatically. Personal photo uploads are disabled for privacy.',
    alreadyHaveAccount: 'Already have an account? Sign In',
    dontHaveAccount: 'Need an account? Sign Up',
    switchRole: 'Switch Registration Path',

    // Inactive Account & Deletion
    accountDeactivatedNotice: 'Account Deactivated Due to Inactivity',
    inactivePolicyDesc: 'Accounts with zero login activity for 12 consecutive months are automatically deactivated.',
    lastActiveDate: 'Last Active Date',
    accountActiveStatus: 'Account Status: Active',
    deleteAccount: 'Permanently Delete Account',
    deleteAccountWarning: 'This action permanently erases your account, credentials, and anonymizes inquiries. This cannot be undone.',
    enterPasswordToDelete: 'Enter your password to confirm permanent deletion',
    accountDeletedSuccess: 'Account and associated records deleted permanently.',

    // Public Consultations & Input
    publicConsultationsTitle: 'Public Medical Consultations',
    publicConsultationsSubtitle: 'Publish your inquiry publicly to receive certified clinical guidance exclusively from verified specialists.',
    homePostInputPlaceholder: 'Ask a specialist doctor: describe your symptoms or medical inquiry...',
    newConsultationPost: 'Post a Medical Inquiry',
    publishInquiryBtn: 'Publish Inquiry',
    postTitlePlaceholder: 'Brief symptom summary (e.g. Persistent palpitations after coffee)',
    postSymptomsPlaceholder: 'Describe your symptoms in detail: onset, duration, severity, and any relevant medical history...',
    selectSpecialty: 'Target Medical Specialty',
    discussionThread: 'Clinical Discussion & Guidance',
    doctorRepliesOnlyNotice: 'To prevent medical misinformation, replies are strictly restricted to verified doctors and the inquiry author.',
    patientAuthorBadge: 'Inquiry Author',
    verifiedDoctorReplyBadge: 'Certified Specialist Reply',
    otherPatientBlockedNotice: 'Responses are strictly limited to verified doctors and the original patient.',
    replyPlaceholder: 'Type your follow-up reply or question...',
    doctorAdvicePlaceholder: 'Provide clinical assessment, recommended diagnostic exams, or triage advice...',
    patientFollowUpPlaceholder: 'Reply to the specialist with symptom clarification or lab results...',
    sendReply: 'Send Reply',
    noPostsYet: 'No consultation inquiries posted in this category yet.',
    noPrivateDMsNotice: 'Direct private messaging is disabled to enforce transparent clinical safety standards.',
    inquiryPublishedSuccess: 'Medical inquiry posted publicly to the consultation feed.',
    doctorReplySentSuccess: 'Clinical recommendation published to the inquiry.',

    // Moderation
    moderationActiveBadge: 'Active & Verified',
    moderationBannedBadge: 'Permanently Banned',
    moderationRestrictedBadge: 'Restricted (48 Hours)',
    bannedAlertTitle: 'Account Suspended by AI Safety Filter',
    bannedAlertDesc: 'Abusive language or malicious safety violations result in permanent suspension.',
    restrictedAlertTitle: 'Account Restricted for 48 Hours',
    restrictedAlertDesc: 'Repeated non-medical or spam content led to temporary restriction.',

    // Appearance & Language
    language: 'Language',
    theme: 'Theme Mode',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',

    // Admin & Review
    adminDashboard: 'Super Admin Verification & Governance',
    moderatorDashboard: 'Medical License Review Queue',
    verificationQueue: 'Doctor License Applications',
    pendingApplicationsCount: 'Pending Applications',
    approveDoctor: 'Approve & Grant Verified Badge',
    rejectDoctor: 'Reject Application',
    rejectionReasonPrompt: 'Rejection reason (e.g. Medical board license could not be confirmed in national registry)',
    medicalDocumentsConfidential: 'Confidential Medical License Documents',
    restrictedReviewNotice: '🔒 STRICT MEDICAL CONFIDENTIALITY: Uploaded diplomas and license credentials are viewable ONLY by Super Admin and authorized review moderators. Patients and external users have zero access.',
    doctorVerifiedSuccess: 'Doctor approved! Verified specialist badge granted.',
    doctorRejectedSuccess: 'Doctor application rejected. Notification sent.',
    systemMetrics: 'Clinical Safety & System Metrics',
    teamManagement: 'Review Committee & Moderators',
    appointModerator: 'Appoint Moderator',
    revokeModerator: 'Revoke Moderator Role',
  },

  ar: {
    appName: 'استشاري',
    tagline: 'استشارات طبية مبسطة وأطباء معتمدون',
    
    // Navigation
    navHome: 'الاستشارات',
    navConsultations: 'الاستشارات',
    navNearby: 'بالجوار',
    navFollowed: 'المتابعون',
    navProfile: 'حسابي',
    navAdmin: 'التحقق',

    // Common UI
    searchPlaceholder: 'ابحث عن استشارات طبية، أعراض، أو تخصصات...',
    specializations: 'التخصصات',
    allSpecialties: 'جميع التخصصات',
    allDoctors: 'جميع الأطباء',
    verifiedDoctorBadge: 'طبيب متخصص معتمد',
    pendingVerification: 'قيد مراجعة الترخيص',
    verified: 'طبيب موثق',
    experienceYears: 'سنوات خبرة سريرية',
    urgent: 'أولوية عاجلة',
    normal: 'استفسار عادي',
    low: 'استفسار روتيني',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    save: 'حفظ التعديلات',
    delete: 'حذف نهائياً',
    submit: 'نشر الاستشارة',
    loading: 'جاري المعالجة...',
    success: 'تمت العملية بنجاح',
    error: 'حدث خطأ غير متوقع',
    viewDetails: 'عرض التفاصيل',
    close: 'إغلاق',

    // Follow feature
    followDoctor: '+ متابعة الطبيب',
    followingDoctor: '✓ متابَع',
    unfollowDoctor: 'إلغاء المتابعة',
    followedDoctors: 'الأطباء المتابعون',
    noFollowedDoctors: 'أنت لا تتابع أي طبيب حالياً. تابع الأطباء من خلال ردودهم على الاستشارات.',
    filterFollowedOnly: '⭐ الأطباء المتابعون',

    // Doctor Star Rating System
    rateDoctor: 'تقييم الطبيب',
    ratingStars: 'تقييم بالنجوم',
    rateDoctorModalTitle: 'تقييم استشارة الطبيب المتخصص',
    submitRating: 'إرسال التقييم',
    yourRating: 'تقييمك',
    ratingSuccess: 'شكراً لك! تم تسجيل تقييمك للطبيب بنجاح.',
    basedOnReviews: 'تقييماً',
    ratingPrompt: 'ملاحظة أو انطباع سريري (اختياري)',
    alreadyRated: 'لقد قيّمت هذا الطبيب مسبقاً',
    ratingAverage: 'متوسط التقييم',

    // Nearby Doctors & Strict Location Restrictions
    nearbyDoctorsTitle: 'الأطباء والعيادات المعتمدة بالجوار',
    nearbyDoctorsSubtitle: 'استعرض العيادات ومواقع الممارسة السريرية الموثقة رسمياً من نقابة الأطباء',
    filterByCity: 'تصفية حسب المدينة',
    allCities: 'جميع المدن والمناطق',
    verifiedClinicLocation: 'موقع العيادة المعتمد',
    workingHours: 'ساعات العمل',
    clinicAddress: 'عنوان العيادة',
    practiceDetails: 'إعدادات وموقع العيادة الطبية',
    onlyVerifiedDoctorsCanSetLocation: '🔒 قاعدة سريرية صارمة: يحق فقط للأطباء الموثقين تحديد أو تحديث موقع العيادة. المرضى لا يملكون أي صلاحية لإضافة عيادات لمنع السجلات الوهمية.',
    patientsCannotAddClinics: 'تنبيه للمرضى: جميع عناوين العيادات موثقة حصراً عبر تراخيص الممارسة الطبية الرسمية.',
    updateClinicLocation: 'حفظ موقع وبيانات العيادة',
    clinicNamePlaceholder: 'مثال: مركز النور التخصصي للقلب والأوعية',
    clinicCityPlaceholder: 'مثال: الرياض، القاهرة، الجزائر، الدار البيضاء، دبي',
    clinicAddressPlaceholder: 'مثال: شارع الملك فيصل، المجمع الطبي، الطابق الثالث',
    clinicHoursPlaceholder: 'مثال: الأحد - الخميس: 09:00 - 17:00',
    clinicUpdatedSuccess: 'تم حفظ وتوثيق بيانات موقع العيادة بنجاح!',
    noNearbyDoctorsFound: 'لا توجد عيادات موثقة مسجلة في هذه المدينة حالياً.',
    viewOnMap: 'تفاصيل العيادة والموقع',

    // Notifications & Interactions Center
    notificationsTitle: 'مركز الإشعارات والأنشطة',
    notificationsSubtitle: 'متابعة فورية لردود الأطباء المتخصصين، المتابعات الجديدة، والتقييمات',
    allNotifications: 'جميع الإشعارات',
    followNotifications: 'المتابعات',
    replyNotifications: 'الردود الطبية',
    interactionNotifications: 'التقييمات والتفاعلات',
    noNotifications: 'لا توجد إشعارات جديدة حالياً.',
    markAllAsRead: 'تحديد الكل كمقروء',
    clearAllNotifications: 'مسح الكل',
    startedFollowingYou: 'بدأ بمتابعة ملفك الطبي المتخصص',
    doctorRepliedToYourInquiry: 'أضاف رداً طبياً على استشارتك المنشورة',
    patientRatedYourConsultation: 'أرسل تقييماً بالنجوم لاستشارتك الطبية',
    likedYourResponse: 'أبدى إعجابه بنصيحتك وإرشادك السريري',
    likePost: 'مفيد',
    likedPost: 'مفيد ✓',

    // Auth & Account
    signIn: 'تسجيل الدخول',
    signOut: 'تسجيل الخروج',
    signUp: 'إنشاء حساب جديد',
    signUpAsPatient: 'تسجيل حساب مريض',
    signUpAsDoctor: 'تسجيل حساب طبيب',
    loginTitle: 'الوصول إلى حسابك',
    username: 'اسم المستخدم الفريد',
    usernamePlaceholder: '@اسم_المستخدم (مثال: @sarah_k)',
    emailPrivate: 'البريد الإلكتروني الخاص المسجل',
    emailPrivateNotice: '🔒 سري ومحمي بالكامل: لا يظهر إطلاقاً للمستخدمين الآخرين.',
    updateEmail: 'تحديث البريد الإلكتروني الخاص',
    newEmailPlaceholder: 'أدخل البريد الإلكتروني الجديد',
    emailUpdatedSuccess: 'تم تحديث البريد الإلكتروني الخاص بنجاح!',
    password: 'كلمة المرور',
    passwordPlaceholder: 'أدخل كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    forgotPassword: 'نسيت كلمة المرور؟',
    resetPassword: 'استعادة كلمة المرور',
    changePassword: 'تغيير كلمة المرور',
    currentPassword: 'كلمة المرور الحالية',
    newPassword: 'كلمة المرور الجديدة',
    passwordChangedSuccess: 'تم تغيير كلمة المرور بنجاح!',
    sendResetLink: 'إرسال رابط الاستعادة',
    resetCodeSent: 'تمت محاكاة إرسال رابط استعادة آمن إلى بريدك الإلكتروني الخاص.',
    doctorRealNameOptional: 'الاسم الحقيقي للطبيب (اختياري)',
    doctorRealNameNotice: 'إظهار اسمك الحقيقي يعزز الثقة السريرية بجانب تخصصك الطبي.',
    doctorRealNamePlaceholder: 'د. سارة المنصوري',
    showRealNameOnProfile: 'إظهار الاسم الحقيقي علناً بجانب اسم المستخدم',
    doctorSpecialtyMandatory: 'التخصص الطبي (إلزامي)',
    doctorSpecialtyNotice: 'يتم عرض تخصصك الطبي بشكل بارز وإلزامي بجانب اسمك في كل رد استشاري.',
    medicalLicenseNumber: 'رقم ترخيص مزاولة المهنة الطبية',
    medicalLicensePlaceholder: 'مثال: MD-8392-CARD',
    uploadMedicalLicense: 'رفع وثيقة ترخيص المزاولة / البورد (PDF/JPG)',
    licenseFileUploaded: 'تم إرفاق الوثيقة لمراجعة لجنة التحقق',
    licenseVerificationNotice: 'الوثائق المرفوعة سرية للغاية ولا يطلع عليها إلا لجنة التحقق الطبية المصرح لها.',
    noGenderPrivacyNotice: '🛡️ الأولوية للخصوصية: نحن لا نجمع أو نعرض أي حقل للجنس (ذكر/أنثى).',
    avatarRoleNotice: 'تم تعيين أيقونة رمزية افتراضية للمهنة تلقائياً. تم إيقاف الصور الشخصية لحماية الخصوصية.',
    alreadyHaveAccount: 'لديك حساب بالفعل؟ تسجيل الدخول',
    dontHaveAccount: 'ليس لديك حساب؟ إنشاء حساب جديد',
    switchRole: 'تبديل مسار التسجيل',

    // Inactive Account & Deletion
    accountDeactivatedNotice: 'تم تعطيل الحساب لعدم النشاط',
    inactivePolicyDesc: 'الحسابات التي لا تسجل أي دخول لمدة 12 شهراً متتالية يتم تعطيلها تلقائياً للحماية.',
    lastActiveDate: 'تاريخ آخر نشاط',
    accountActiveStatus: 'حالة الحساب: نشط',
    deleteAccount: 'حذف الحساب نهائياً',
    deleteAccountWarning: 'سيؤدي هذا الإجراء إلى حذف حسابك نهائياً وتجريد بياناتك. لا يمكن التراجع عن هذا الإجراء.',
    enterPasswordToDelete: 'أدخل كلمة المرور لتأكيد الحذف النهائي',
    accountDeletedSuccess: 'تم حذف الحساب وجميع سجلاته نهائياً.',

    // Public Consultations & Input
    publicConsultationsTitle: 'الاستشارات الطبية العامة',
    publicConsultationsSubtitle: 'انشر استفسارك الطبي علناً لتتلقى إرشادات سريرية موثوقة حصراً من أطباء معتمدين.',
    homePostInputPlaceholder: 'اسأل طبيباً متخصصاً: صف استفسارك الطبي أو الأعراض التي تشعر بها...',
    newConsultationPost: 'طرح استشارة طبية',
    publishInquiryBtn: 'نشر الاستشارة',
    postTitlePlaceholder: 'ملخص العرض أو السؤال (مثال: خفقان صباحي بعد القهوة والرياضة الخفيفة)',
    postSymptomsPlaceholder: 'صف الأعراض بالتفصيل: وقت الظهور، المدة، الشدة، وأي تاريخ مرضي ذي صلة...',
    selectSpecialty: 'التخصص الطبي المستهدف',
    discussionThread: 'النقاش والإرشاد السريري',
    doctorRepliesOnlyNotice: 'لمنع الشائعات الطبية، يسمح فقط للأطباء الموثقين وصاحب الاستشارة بالرد.',
    patientAuthorBadge: 'صاحب الاستشارة',
    verifiedDoctorReplyBadge: 'رد طبيب متخصص معتمد',
    otherPatientBlockedNotice: 'الردود مقتصرة حصرياً على الأطباء الموثقين وصاحب السؤال.',
    replyPlaceholder: 'اكتب ردك أو استفسارك المتابع...',
    doctorAdvicePlaceholder: 'قدم التقييم السريري، الفحوصات المقترحة، أو إرشادات التشخيص الأولية...',
    patientFollowUpPlaceholder: 'أجب الطبيب بالتوضيحات أو مستجدات الأعراض...',
    sendReply: 'إرسال الرد',
    noPostsYet: 'لا توجد استشارات منشورة ضمن هذا الفلتر حالياً.',
    noPrivateDMsNotice: 'الرسائل الخاصة المباشرة معطلة لضمان التزام الإرشادات السريرية بالمعايير الشفافة.',
    inquiryPublishedSuccess: 'تم نشر الاستشارة الطبية علناً في الخلاصة بنجاح.',
    doctorReplySentSuccess: 'تم إرسال ونشر النصيحة السريرية على الاستشارة.',

    // Moderation
    moderationActiveBadge: 'نشط وموثق',
    moderationBannedBadge: 'محظور نهائياً',
    moderationRestrictedBadge: 'مقيد (48 ساعة)',
    bannedAlertTitle: 'تم إيقاف الحساب بواسطة المشرف الآلي',
    bannedAlertDesc: 'الألفاظ المسيئة أو انتهاكات الأمان الصريحة تؤدي للحظر الفوري الدائم.',
    restrictedAlertTitle: 'الحساب مقيد لمدة 48 ساعة',
    restrictedAlertDesc: 'تكرار النشر العشوائي غير الطبي أدى إلى تقييد المشاركة مؤقتاً.',

    // Appearance & Language
    language: 'اللغة',
    theme: 'المظهر',
    lightMode: 'الوضع الفاتح',
    darkMode: 'الوضع الداكن',

    // Admin & Review
    adminDashboard: 'لوحة المشرفين والتحقق',
    moderatorDashboard: 'طابور مراجعة تراخيص الأطباء',
    verificationQueue: 'قائمة تراخيص الأطباء المعلقة',
    pendingApplicationsCount: 'طلبات أطباء قيد المراجعة',
    approveDoctor: 'قبول وتفعيل شارة الطبيب الموثق',
    rejectDoctor: 'رفض الطلب',
    rejectionReasonPrompt: 'سبب الرفض (مثال: رقم الترخيص غير مطابق لسجل النقابة)',
    medicalDocumentsConfidential: 'الوثائق والتراخيص الطبية السرية',
    restrictedReviewNotice: '🔒 خصوصية طبية صارمة: الوثائق والشهادات المرفوعة متاحة حصراً للمشرف العام وفريق المراجعة المصرح لهم. المرضى والمستخدمون الآخرون لا يملكون أي وصول إليها إطلاقاً.',
    doctorVerifiedSuccess: 'تم اعتماد الطبيب ومنحه الشارة الموثقة بنجاح.',
    doctorRejectedSuccess: 'تم رفض الطلب مع إرسال الملاحظات للطبيب.',
    systemMetrics: 'مؤشرات المنصة والأمان السريري',
    teamManagement: 'إدارة المشرفين وفريق التحقق',
    appointModerator: 'تعيين كمشرف مراجعة',
    revokeModerator: 'إلغاء صلاحية المشرف',
  },

  fr: {
    appName: 'Istichary',
    tagline: 'Consultations Médicales Épurées & Médecins Vérifiés',
    
    // Navigation
    navHome: 'Consultations',
    navConsultations: 'Fil',
    navNearby: 'À Proximité',
    navFollowed: 'Suivis',
    navProfile: 'Profil',
    navAdmin: 'Vérification',

    // Common UI
    searchPlaceholder: 'Rechercher questions médicales, symptômes, spécialités...',
    specializations: 'Spécialités',
    allSpecialties: 'Toutes les spécialités',
    allDoctors: 'Tous les spécialistes',
    verifiedDoctorBadge: 'Spécialiste Vérifié',
    pendingVerification: 'Vérification en cours',
    verified: 'Médecin Vérifié',
    experienceYears: 'ans d’expérience clinique',
    urgent: 'Urgence Prioritaire',
    normal: 'Demande Standard',
    low: 'Question de Routine',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    save: 'Enregistrer les modifications',
    delete: 'Supprimer Définitivement',
    submit: 'Publier la Consultation',
    loading: 'Traitement en cours...',
    success: 'Opération réussie',
    error: 'Une erreur est survenue',
    viewDetails: 'Voir Détails',
    close: 'Fermer',

    // Follow feature
    followDoctor: '+ Suivre le spécialiste',
    followingDoctor: '✓ Suivi',
    unfollowDoctor: 'Ne plus suivre',
    followedDoctors: 'Médecins Suivis',
    noFollowedDoctors: 'Vous ne suivez aucun spécialiste pour le moment. Suivez des médecins depuis leurs réponses cliniques.',
    filterFollowedOnly: '⭐ Spécialistes Suivis',

    // Doctor Star Rating System
    rateDoctor: 'Évaluer le médecin',
    ratingStars: 'Évaluation par étoiles',
    rateDoctorModalTitle: 'Évaluer la consultation du spécialiste',
    submitRating: 'Valider la note',
    yourRating: 'Votre note',
    ratingSuccess: 'Merci ! Votre évaluation a été enregistrée avec succès.',
    basedOnReviews: 'avis',
    ratingPrompt: 'Commentaire clinique (optionnel)',
    alreadyRated: 'Vous avez déjà évalué ce médecin',
    ratingAverage: 'Note Moyenne',

    // Nearby Doctors & Strict Location Restrictions
    nearbyDoctorsTitle: 'Médecins & Cabinets Médicaux à Proximité',
    nearbyDoctorsSubtitle: 'Découvrez les cabinets et lieux d’exercice médical certifiés par notre comité',
    filterByCity: 'Filtrer par Ville',
    allCities: 'Toutes les Villes & Régions',
    verifiedClinicLocation: 'Cabinet Médical Vérifié',
    workingHours: 'Horaires d’Ouverture',
    clinicAddress: 'Adresse du Cabinet',
    practiceDetails: 'Paramètres du Cabinet & Lieu d’Exercice',
    onlyVerifiedDoctorsCanSetLocation: '🔒 RÈGLE CLINIQUE STRICTE : Seuls les médecins vérifiés ont l’autorisation de définir ou modifier l’adresse de leur cabinet. Les patients ont ZERO permission d’ajouter des lieux pour éliminer les fausses adresses.',
    patientsCannotAddClinics: 'Avis aux Patients : Tous les cabinets sur Istichary sont obligatoirement validés via les numéros d’ordre des praticiens.',
    updateClinicLocation: 'Enregistrer l’Adresse du Cabinet',
    clinicNamePlaceholder: 'ex: Centre Médical Cardiovasculaire et Préventif',
    clinicCityPlaceholder: 'ex: Paris, Lyon, Marseille, Alger, Casablanca, Tunis, Bruxelles',
    clinicAddressPlaceholder: 'ex: 14 Avenue des Médecins, Bâtiment B, 3ème étage',
    clinicHoursPlaceholder: 'ex: Lun - Ven : 08h30 - 17h00',
    clinicUpdatedSuccess: 'Coordonnées du cabinet enregistrées et vérifiées avec succès !',
    noNearbyDoctorsFound: 'Aucun cabinet vérifié répertorié dans cette ville pour l’instant.',
    viewOnMap: 'Voir Coordonnées & Plan',

    // Notifications & Interactions Center
    notificationsTitle: 'Centre de Notifications & Activités',
    notificationsSubtitle: 'Alertes en direct pour réponses médicales, abonnements de patients et évaluations',
    allNotifications: 'Toutes les Activités',
    followNotifications: 'Abonnements',
    replyNotifications: 'Réponses Médicales',
    interactionNotifications: 'Évaluations & Mentions Utiles',
    noNotifications: 'Aucune notification pour l’instant.',
    markAllAsRead: 'Tout marquer comme lu',
    clearAllNotifications: 'Tout effacer',
    startedFollowingYou: 'a commencé à suivre votre profil de praticien',
    doctorRepliedToYourInquiry: 'a répondu à votre consultation médicale',
    patientRatedYourConsultation: 'a attribué une note par étoiles à votre consultation',
    likedYourResponse: 'a trouvé votre recommandation médicale très utile',
    likePost: 'Utile',
    likedPost: 'Utile ✓',

    // Auth & Account
    signIn: 'Connexion',
    signOut: 'Déconnexion',
    signUp: 'Inscription',
    signUpAsPatient: 'Compte Patient',
    signUpAsDoctor: 'Inscription Médecin',
    loginTitle: 'Accédez à votre compte',
    username: 'Nom d’utilisateur unique',
    usernamePlaceholder: '@nom_utilisateur (ex: @sarah_k)',
    emailPrivate: 'Adresse E-mail Enregistrée',
    emailPrivateNotice: '🔒 Strictement Privé & Chiffré : Jamais affiché aux autres utilisateurs.',
    updateEmail: 'Modifier l’adresse e-mail privée',
    newEmailPlaceholder: 'Entrez votre nouvelle adresse e-mail privée',
    emailUpdatedSuccess: 'Adresse e-mail privée mise à jour avec succès !',
    password: 'Mot de passe',
    passwordPlaceholder: 'Entrez votre mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    forgotPassword: 'Mot de passe oublié ?',
    resetPassword: 'Réinitialiser le mot de passe',
    changePassword: 'Changer le mot de passe',
    currentPassword: 'Mot de passe actuel',
    newPassword: 'Nouveau mot de passe',
    passwordChangedSuccess: 'Mot de passe modifié avec succès !',
    sendResetLink: 'Envoyer le lien de récupération',
    resetCodeSent: 'Un lien sécurisé de récupération a été transmis à votre adresse e-mail privée.',
    doctorRealNameOptional: 'Nom Complet du Médecin (Optionnel)',
    doctorRealNameNotice: 'Afficher votre vrai nom renforce la crédibilité clinique à côté de votre spécialité.',
    doctorRealNamePlaceholder: 'Dr. Sarah Chen, MD',
    showRealNameOnProfile: 'Afficher publiquement le nom clinique à côté du pseudo',
    doctorSpecialtyMandatory: 'Spécialité Médicale (Obligatoire)',
    doctorSpecialtyNotice: 'Votre spécialité est obligatoirement et visiblement affichée sur chacune de vos réponses cliniques.',
    medicalLicenseNumber: 'Numéro d’Ordre / Licence Médicale',
    medicalLicensePlaceholder: 'ex: MD-8392-CARD',
    uploadMedicalLicense: 'Téléverser Licence Médicale / Diplôme de Spécialité (PDF/JPG)',
    licenseFileUploaded: 'Document joint pour examen de vérification',
    licenseVerificationNotice: 'Les documents téléversés sont strictement confidentiels et examinés par le comité de vérification.',
    noGenderPrivacyNotice: '🛡️ Confidentialité Absolue : Nous ne collectons ni n’affichons aucun genre (homme/femme).',
    avatarRoleNotice: 'Avatar de rôle standardisé assigné. Téléversement de photos personnelles désactivé.',
    alreadyHaveAccount: 'Déjà un compte ? Se connecter',
    dontHaveAccount: 'Pas encore de compte ? S’inscrire',
    switchRole: 'Changer le type d’inscription',

    // Inactive Account & Deletion
    accountDeactivatedNotice: 'Compte désactivé pour inactivité',
    inactivePolicyDesc: 'Les comptes sans connexion pendant 12 mois consécutifs sont automatiquement archivés.',
    lastActiveDate: 'Dernière date d’activité',
    accountActiveStatus: 'Statut du compte : Actif',
    deleteAccount: 'Supprimer définitivement le compte',
    deleteAccountWarning: 'Cette action supprime irréversiblement votre compte et anonymise vos questions. Action irréversible.',
    enterPasswordToDelete: 'Entrez votre mot de passe pour confirmer la suppression',
    accountDeletedSuccess: 'Compte et dossiers associés supprimés avec succès.',

    // Public Consultations & Input
    publicConsultationsTitle: 'Consultations Médicales Publiques',
    publicConsultationsSubtitle: 'Posez vos questions médicales ouvertement pour recevoir des conseils cliniques dispensés uniquement par des spécialistes vérifiés.',
    homePostInputPlaceholder: 'Demandez à un médecin spécialisé : Décrivez vos symptômes ou votre question...',
    newConsultationPost: 'Poser une Question Médicale',
    publishInquiryBtn: 'Publier la Consultation',
    postTitlePlaceholder: 'Résumé du symptôme ou de la question (ex: Palpitations après café et marche)',
    postSymptomsPlaceholder: 'Décrivez précisément vos symptômes : apparition, durée, intensité et antécédents médicaux...',
    selectSpecialty: 'Spécialité Médicale Ciblée',
    discussionThread: 'Discussion & Orientation Clinique',
    doctorRepliesOnlyNotice: 'Pour éviter la désinformation, seuls les médecins vérifiés et l’auteur du post peuvent répondre.',
    patientAuthorBadge: 'Auteur Patient',
    verifiedDoctorReplyBadge: 'Réponse Clinique du Spécialiste',
    otherPatientBlockedNotice: 'Les réponses sont réservées aux médecins vérifiés et au patient auteur.',
    replyPlaceholder: 'Rédigez votre réponse ou question de suivi...',
    doctorAdvicePlaceholder: 'Rédigez votre avis clinique, examens recommandés ou conseils de triage...',
    patientFollowUpPlaceholder: 'Répondez au médecin avec des précisions ou l’évolution des symptômes...',
    sendReply: 'Publier la Réponse',
    noPostsYet: 'Aucune consultation sous ce filtre pour l’instant.',
    noPrivateDMsNotice: 'Les messages privés sont désactivés afin d’assurer la conformité et la transparence médicale.',
    inquiryPublishedSuccess: 'Consultation médicale publiée avec succès dans le fil public.',
    doctorReplySentSuccess: 'Recommandation clinique publiée sur la consultation.',

    // Moderation
    moderationActiveBadge: 'Actif & Vérifié',
    moderationBannedBadge: 'Banni Définitivement',
    moderationRestrictedBadge: 'Restreint (48h)',
    bannedAlertTitle: 'Compte suspendu par la modération IA',
    bannedAlertDesc: 'Les propos injurieux ou infractions graves entraînent une suspension immédiate permanente.',
    restrictedAlertTitle: 'Compte restreint pour 48 heures',
    restrictedAlertDesc: 'Des messages hors-sujet répétés ont entraîné une restriction temporaire.',

    // Appearance & Language
    language: 'Langue',
    theme: 'Mode Thème',
    lightMode: 'Mode Clair',
    darkMode: 'Mode Sombre',

    // Admin & Review
    adminDashboard: 'Contrôle Administrateur & Vérification',
    moderatorDashboard: 'File d’Examen des Médecins',
    verificationQueue: 'File de Vérification des Licences',
    pendingApplicationsCount: 'Candidatures de Médecins en Attente',
    approveDoctor: 'Approuver et Accorder le Badge Vérifié',
    rejectDoctor: 'Rejeter la Demande',
    rejectionReasonPrompt: 'Motif du rejet (ex: numéro d’ordre non trouvé dans le registre national)',
    medicalDocumentsConfidential: 'Documents Médicaux Confidentiels',
    restrictedReviewNotice: '🔒 CONFIDENTIALITÉ MÉDICALE STRICTE : Les diplômes et certificats sont consultables EXCLUSIVEMENT par le Super Administrateur et l’équipe de révision. Zéro accès pour les patients et autres utilisateurs.',
    doctorVerifiedSuccess: 'Médecin approuvé ! Badge de spécialiste accordé.',
    doctorRejectedSuccess: 'Demande rejetée avec notification transmise.',
    systemMetrics: 'Métriques du Système & Confidentialité',
    teamManagement: 'Équipe d’Évaluation & Modérateurs',
    appointModerator: 'Nommer Modérateur',
    revokeModerator: 'Révoquer le Rôle de Modérateur',
  },
};
