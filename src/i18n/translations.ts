import { Language } from '../types';

export interface Translations {
  appName: string;
  tagline: string;
  // Navigation
  navHome: string;
  navConsultations: string;
  navNearYou: string;
  navProfile: string;
  // Common
  searchPlaceholder: string;
  specializations: string;
  allDoctors: string;
  verifiedDoctorBadge: string;
  pendingVerification: string;
  verified: string;
  online: string;
  offline: string;
  experienceYears: string;
  reviews: string;
  consultationFee: string;
  bookConsultation: string;
  availableToday: string;
  topRated: string;
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
  password: string;
  passwordPlaceholder: string;
  confirmPassword: string;
  forgotPassword: string;
  resetPassword: string;
  sendResetLink: string;
  resetCodeSent: string;
  newPassword: string;
  doctorRealNameOptional: string;
  doctorRealNameNotice: string;
  doctorRealNamePlaceholder: string;
  showRealNameOnProfile: string;
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
  // Inactive Account
  accountDeactivatedNotice: string;
  inactivePolicyDesc: string;
  lastActiveDate: string;
  accountActiveStatus: string;
  // Account Deletion
  deleteAccount: string;
  deleteAccountWarning: string;
  enterPasswordToDelete: string;
  accountDeletedSuccess: string;
  // Public Consultations
  publicConsultationsTitle: string;
  publicConsultationsSubtitle: string;
  newConsultationPost: string;
  postTitlePlaceholder: string;
  postSymptomsPlaceholder: string;
  selectSpecialty: string;
  postConsultationBtn: string;
  discussionThread: string;
  doctorRepliesOnlyNotice: string;
  patientAuthorBadge: string;
  verifiedDoctorReplyBadge: string;
  otherPatientBlockedNotice: string;
  replyPlaceholder: string;
  sendReply: string;
  noPostsYet: string;
  noPrivateDMsNotice: string;
  // AI Moderation & Auto Penalties
  moderationActiveBadge: string;
  moderationBannedBadge: string;
  moderationRestrictedBadge: string;
  bannedAlertTitle: string;
  bannedAlertDesc: string;
  restrictedAlertTitle: string;
  restrictedAlertDesc: string;
  moderationWarningTriggered: string;
  testModerationToxicity: string;
  testModerationOffTopic: string;
  aiModerationNotice: string;
  // Doctors Near You & Practice Locations
  nearYouTitle: string;
  nearYouSubtitle: string;
  enableGpsLocation: string;
  locationEnabled: string;
  selectCityFallback: string;
  kilometersAway: string;
  clinicAddress: string;
  clinicName: string;
  practiceLocation: string;
  editPracticeLocation: string;
  updateClinicInfo: string;
  noNearbyDoctors: string;
  // Theme & Language
  language: string;
  theme: string;
  lightMode: string;
  darkMode: string;
  // Emergency
  emergencySOS: string;
  emergencyAlert: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'Medical Consultation',
    tagline: 'Verified Clinical Care & Privacy-First Consultations',
    navHome: 'Home',
    navConsultations: 'Consultations',
    navNearYou: 'Near You',
    navProfile: 'Profile',
    searchPlaceholder: 'Search verified doctors, clinics, specialties...',
    specializations: 'Specializations',
    allDoctors: 'All Doctors',
    verifiedDoctorBadge: 'Verified Specialist',
    pendingVerification: 'Pending Verification',
    verified: 'Verified',
    online: 'Online',
    offline: 'Offline',
    experienceYears: 'yrs experience',
    reviews: 'reviews',
    consultationFee: 'Consultation Fee',
    bookConsultation: 'Book Consultation',
    availableToday: 'Available Today',
    topRated: '⭐ 4.9+ Top Rated',
    urgent: 'Urgent',
    normal: 'Standard',
    low: 'Minor',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save Changes',
    delete: 'Permanently Delete',
    submit: 'Submit',
    loading: 'Processing...',
    success: 'Success',
    error: 'Error',
    viewDetails: 'View Details',
    close: 'Close',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    signUp: 'Sign Up',
    signUpAsPatient: 'Register as Patient',
    signUpAsDoctor: 'Register as Doctor',
    loginTitle: 'Access Your Account',
    username: 'Unique Username',
    usernamePlaceholder: '@username (e.g. @health_seeker)',
    emailPrivate: 'Private Email Address',
    emailPrivateNotice: '🔒 Your email is strictly confidential and never displayed to other users.',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    sendResetLink: 'Send Password Reset Link',
    resetCodeSent: 'A secure recovery link has been simulated to your private email address.',
    newPassword: 'New Secure Password',
    doctorRealNameOptional: 'Doctor Full Name (Optional)',
    doctorRealNameNotice: 'Displaying your real name builds clinical trust alongside your username.',
    doctorRealNamePlaceholder: 'Dr. Jane Smith',
    showRealNameOnProfile: 'Display full clinical name publicly alongside username',
    medicalLicenseNumber: 'Medical Board License / ID',
    medicalLicensePlaceholder: 'e.g. MD-9482-B2024',
    uploadMedicalLicense: 'Upload Medical License / Certificate (PDF/Image)',
    licenseFileUploaded: 'Certificate Document Attached',
    licenseVerificationNotice: 'Doctor accounts undergo credential verification before receiving the Verified badge.',
    noGenderPrivacyNotice: '🛡️ Privacy First: We do not collect or display your gender.',
    avatarRoleNotice: 'Professional role-based avatar automatically assigned. Real personal photos are disabled for privacy.',
    alreadyHaveAccount: 'Already have an account? Sign In',
    dontHaveAccount: "Don't have an account? Sign Up",
    switchRole: 'Switch Registration Type',
    accountDeactivatedNotice: 'Account Closed (Inactive for 12+ Months)',
    inactivePolicyDesc: 'To protect medical data retention, accounts inactive for 12 consecutive months are automatically closed.',
    lastActiveDate: 'Last Active Login',
    accountActiveStatus: 'Account Status: Active & Compliant',
    deleteAccount: 'Delete My Account',
    deleteAccountWarning: '⚠️ This action is permanent and purges all consultation records. Please enter your password to confirm.',
    enterPasswordToDelete: 'Enter your password to confirm deletion',
    accountDeletedSuccess: 'Your account and all associated data have been permanently deleted.',
    publicConsultationsTitle: 'Public Medical Consultations',
    publicConsultationsSubtitle: 'All discussions are open & moderated. Private direct messaging is disabled to prevent extortion.',
    newConsultationPost: 'Ask a Medical Question',
    postTitlePlaceholder: 'Brief summary of your symptom or medical inquiry...',
    postSymptomsPlaceholder: 'Describe your symptoms, duration, and relevant medical history...',
    selectSpecialty: 'Target Specialization',
    postConsultationBtn: 'Publish Consultation Post',
    discussionThread: 'Clinical Discussion Thread',
    doctorRepliesOnlyNotice: '🔒 Medical Safety: Only the patient author and verified doctors may reply to this consultation.',
    patientAuthorBadge: 'Original Patient Author',
    verifiedDoctorReplyBadge: 'Verified Medical Response',
    otherPatientBlockedNotice: 'You are viewing this public consultation for educational purposes. Other patients cannot comment to prevent medical misinformation.',
    replyPlaceholder: 'Write your clinical response or follow-up question...',
    sendReply: 'Send Reply',
    noPostsYet: 'No consultations published yet in this category.',
    noPrivateDMsNotice: 'ℹ️ Note: Direct private messaging is disabled by medical safety policy to protect patients and physicians.',
    moderationActiveBadge: 'Account in Good Standing',
    moderationBannedBadge: 'Permanently Banned (Abusive Language)',
    moderationRestrictedBadge: 'Restricted for 48 Hours (Off-Topic / Policy)',
    bannedAlertTitle: 'Account Suspended',
    bannedAlertDesc: 'AI content moderation detected curse words, insults, or abusive language. Your account has been permanently suspended.',
    restrictedAlertTitle: 'Posting Temporarily Restricted',
    restrictedAlertDesc: 'You have been restricted for 48 hours for submitting off-topic, spam, or non-medical content.',
    moderationWarningTriggered: 'AI Moderation Alert: Your post violated community safety policies.',
    testModerationToxicity: 'Simulate Abusive Word (Instant Ban)',
    testModerationOffTopic: 'Simulate Off-Topic Spam (48h Restriction)',
    aiModerationNotice: '🤖 All submissions are automatically evaluated by AI Content Moderation for clinical safety and civility.',
    nearYouTitle: 'Doctors Near You',
    nearYouSubtitle: 'Locate certified specialists and practice clinics in your geographical region',
    enableGpsLocation: 'Enable Device Location (GPS)',
    locationEnabled: 'GPS Location Active',
    selectCityFallback: 'Or Select Your Region / City',
    kilometersAway: 'km away',
    clinicAddress: 'Practice / Clinic Address',
    clinicName: 'Clinic / Hospital Name',
    practiceLocation: 'Workplace & Clinic Practice',
    editPracticeLocation: 'Update Practice Address',
    updateClinicInfo: 'Save Clinic Information',
    noNearbyDoctors: 'No verified doctors found in this immediate radius. Try selecting another city or region.',
    language: 'Language',
    theme: 'Theme',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    emergencySOS: 'Emergency SOS',
    emergencyAlert: 'For life-threatening emergencies, call your local ambulance dispatch immediately.',
  },
  ar: {
    appName: 'استشارة طبية',
    tagline: 'رعاية سريرية معتمدة واستشارات تحترم الخصوصية',
    navHome: 'الرئيسية',
    navConsultations: 'الاستشارات',
    navNearYou: 'أطباء بالقرب منك',
    navProfile: 'الملف الشخصي',
    searchPlaceholder: 'ابحث عن أطباء معتمدين، عيادات، تخصصات...',
    specializations: 'التخصصات الطبية',
    allDoctors: 'جميع الأطباء',
    verifiedDoctorBadge: 'طبيب معتمد',
    pendingVerification: 'قيد التحقق',
    verified: 'معتمد',
    online: 'متصل',
    offline: 'غير متصل',
    experienceYears: 'سنوات خبرة',
    reviews: 'تقييم',
    consultationFee: 'رسوم الاستشارة',
    bookConsultation: 'حجز استشارة',
    availableToday: 'متاح اليوم',
    topRated: '⭐ الأعلى تقييماً 4.9+',
    urgent: 'عاجل',
    normal: 'عادي',
    low: 'بسيط',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    save: 'حفظ التغييرات',
    delete: 'حذف نهائي',
    submit: 'إرسال',
    loading: 'جاري المعالجة...',
    success: 'تم بنجاح',
    error: 'خطأ',
    viewDetails: 'عرض التفاصيل',
    close: 'إغلاق',
    signIn: 'تسجيل الدخول',
    signOut: 'تسجيل الخروج',
    signUp: 'إنشاء حساب',
    signUpAsPatient: 'التسجيل كمريض',
    signUpAsDoctor: 'التسجيل كطبيب',
    loginTitle: 'الدخول إلى حسابك',
    username: 'اسم المستخدم الفريد',
    usernamePlaceholder: '@اسم_المستخدم (مثال: @health_seeker)',
    emailPrivate: 'البريد الإلكتروني السري',
    emailPrivateNotice: '🔒 بريدك الإلكتروني سري ومحمي تماماً ولا يظهر أبداً للمستخدمين الآخرين.',
    password: 'كلمة المرور',
    passwordPlaceholder: 'أدخل كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    forgotPassword: 'نسيت كلمة المرور؟',
    resetPassword: 'إعادة تعيين كلمة المرور',
    sendResetLink: 'إرسال رابط الاستعادة',
    resetCodeSent: 'تم إرسال رابط الاسترداد الآمن إلى بريدك الإلكتروني السري.',
    newPassword: 'كلمة مرور جديدة',
    doctorRealNameOptional: 'الاسم الكامل للطبيب (اختياري)',
    doctorRealNameNotice: 'عرض اسمك الحقيقي يعزز الثقة السريرية بجانب اسم المستخدم الفريد.',
    doctorRealNamePlaceholder: 'د. أحمد المنصوري',
    showRealNameOnProfile: 'إظهار الاسم السريري الكامل علناً بجانب اسم المستخدم',
    medicalLicenseNumber: 'رقم الترخيص الطبي / بطاقة النقابة',
    medicalLicensePlaceholder: 'مثال: MD-9482-DZ',
    uploadMedicalLicense: 'رفع الترخيص الطبي أو الشهادة (ملف PDF أو صورة)',
    licenseFileUploaded: 'تم إرفاق وثيقة الاعتماد الطبي',
    licenseVerificationNotice: 'تخضع حسابات الأطباء للتحقق والتدقيق قبل الحصول على شارة الاعتماد.',
    noGenderPrivacyNotice: '🛡️ أولوية الخصوصية: لا نقوم بجمع أو عرض أي بيانات متعلقة بالجنس.',
    avatarRoleNotice: 'يتم تعيين رمز رمزي مهني تلقائياً حسب نوع الحساب. الصور الشخصية ملغاة حمايةً للخصوصية.',
    alreadyHaveAccount: 'لديك حساب بالفعل؟ تسجيل الدخول',
    dontHaveAccount: 'ليس لديك حساب؟ إنشاء حساب جديد',
    switchRole: 'تغيير نوع التسجيل',
    accountDeactivatedNotice: 'الحساب مغلق (غير نشط لأكثر من 12 شهراً)',
    inactivePolicyDesc: 'لحماية سرية السجلات الصحية، يتم إلغاء تنشيط الحسابات التي لم تسجل الدخول لمدة 12 شهراً متتالياً.',
    lastActiveDate: 'آخر تسجيل دخول نشط',
    accountActiveStatus: 'حالة الحساب: نشط ومطابق للمعايير',
    deleteAccount: 'حذف حسابي نهائياً',
    deleteAccountWarning: '⚠️ هذا الإجراء دائم ولا يمكن التراجع عنه. يرجى إدخال كلمة المرور للتأكيد.',
    enterPasswordToDelete: 'أدخل كلمة المرور لتأكيد الحذف',
    accountDeletedSuccess: 'تم حذف حسابك وجميع السجلات المرتبطة به نهائياً.',
    publicConsultationsTitle: 'الاستشارات الطبية العامة',
    publicConsultationsSubtitle: 'جميع المناقشات علنية وخاضعة للإشراف الذكي. الرسائل المباشرة معطلة تماماً لمنع الابتزاز.',
    newConsultationPost: 'طرح سؤال طبي جديد',
    postTitlePlaceholder: 'ملخص موجز للأعراض أو الاستفسار الطبي...',
    postSymptomsPlaceholder: 'صف الأعراض، المدة، والتاريخ الصحي ذي الصلة...',
    selectSpecialty: 'التخصص الطبي المطلوب',
    postConsultationBtn: 'نشر الاستشارة الطبية',
    discussionThread: 'سلسلة النقاش السريري',
    doctorRepliesOnlyNotice: '🔒 أمان طبي: يُسمح فقط للمريض صاحب السؤال وللأطباء المعتمدين بالتعليق.',
    patientAuthorBadge: 'المريض صاحب السؤال',
    verifiedDoctorReplyBadge: 'رد طبيب معتمد',
    otherPatientBlockedNotice: 'أنت تتصفح هذه الاستشارة بهدف الاستفادة والتثقيف الطبي. لا يمكن للمرضى الآخرين التعليق منعاً للمعلومات الطبية الخاطئة.',
    replyPlaceholder: 'اكتب إجابتك الطبية أو سؤال المتابعة...',
    sendReply: 'إرسال الرد',
    noPostsYet: 'لا توجد استشارات منشورة في هذا التخصص حتى الآن.',
    noPrivateDMsNotice: 'ℹ️ تنبيه: الرسائل الخاصة معطلة تماماً بموجب سياسة السلامة الطبية لحماية المرضى والأطباء.',
    moderationActiveBadge: 'الحساب سليم ونشط',
    moderationBannedBadge: 'محظور نهائياً (ألفاظ مسيئة أو شتائم)',
    moderationRestrictedBadge: 'مقيد لمدة 48 ساعة (محتوى خارج الموضوع)',
    bannedAlertTitle: 'تم حظر الحساب',
    bannedAlertDesc: 'اكتشف نظام الإشراف الذكي شتائم أو ألفاظاً مسيئة. تم تعليق حسابك نهائياً.',
    restrictedAlertTitle: 'التعليق مقيد مؤقتاً',
    restrictedAlertDesc: 'تم تقييدك لمدة 48 ساعة بسبب نشر محتوى مضلل أو خارج النطاق الطبي.',
    moderationWarningTriggered: 'تنبيه الرقابة الذكية: انتهكت مشاركتك معايير المجتمع.',
    testModerationToxicity: 'تجربة كلمة مسيئة (حظر فوري)',
    testModerationOffTopic: 'تجربة محتوى تجاري/خارج الموضوع (تقييد 48 ساعة)',
    aiModerationNotice: '🤖 تتم مراجعة جميع المشاركات تلقائياً عبر الذكاء الاصطناعي لضمان السلامة والاحترام.',
    nearYouTitle: 'أطباء بالقرب منك',
    nearYouSubtitle: 'ابحث عن عيادات الأطباء المعتمدين الأقرب جغرافياً إلى منطقتك',
    enableGpsLocation: 'تفعيل الموقع الجغرافي (GPS)',
    locationEnabled: 'الموقع الجغرافي مفعل',
    selectCityFallback: 'أو اختر منطقتك / مدينتك يدوياً',
    kilometersAway: 'كم يبعد',
    clinicAddress: 'عنوان العيادة / مكان العمل',
    clinicName: 'اسم العيادة أو المستشفى',
    practiceLocation: 'موقع الممارسة والعيادة',
    editPracticeLocation: 'تعديل عنوان العيادة',
    updateClinicInfo: 'حفظ بيانات العيادة',
    noNearbyDoctors: 'لم يتم العثور على أطباء معتمدين في هذا النطاق المباشر. يرجى تجربة اختيار مدينة أخرى.',
    language: 'اللغة',
    theme: 'المظهر',
    lightMode: 'الوضع الفاتح',
    darkMode: 'الوضع الداكن',
    emergencySOS: 'طوارئ SOS',
    emergencyAlert: 'في الحالات الحرجة والمهددة للحياة، يرجى الاتصال بالإسعاف المحلي فوراً.',
  },
  fr: {
    appName: 'Consultation Médicale',
    tagline: 'Soins cliniques vérifiés & consultations axées sur la confidentialité',
    navHome: 'Accueil',
    navConsultations: 'Consultations',
    navNearYou: 'Près de chez vous',
    navProfile: 'Profil',
    searchPlaceholder: 'Rechercher médecins vérifiés, cliniques, spécialités...',
    specializations: 'Spécialisations',
    allDoctors: 'Tous les Médecins',
    verifiedDoctorBadge: 'Spécialiste Vérifié',
    pendingVerification: 'Vérification en attente',
    verified: 'Vérifié',
    online: 'En ligne',
    offline: 'Hors ligne',
    experienceYears: "ans d'expérience",
    reviews: 'avis',
    consultationFee: 'Tarif de consultation',
    bookConsultation: 'Prendre rendez-vous',
    availableToday: "Disponible aujourd'hui",
    topRated: '⭐ Top Noté 4.9+',
    urgent: 'Urgent',
    normal: 'Standard',
    low: 'Faible',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    save: 'Enregistrer les modifications',
    delete: 'Supprimer définitivement',
    submit: 'Soumettre',
    loading: 'Traitement en cours...',
    success: 'Succès',
    error: 'Erreur',
    viewDetails: 'Voir les détails',
    close: 'Fermer',
    signIn: 'Connexion',
    signOut: 'Déconnexion',
    signUp: 'Créer un compte',
    signUpAsPatient: 'S’inscrire en tant que Patient',
    signUpAsDoctor: 'S’inscrire en tant que Médecin',
    loginTitle: 'Accédez à votre compte',
    username: "Nom d'utilisateur unique",
    usernamePlaceholder: '@nom (ex: @patient_sante)',
    emailPrivate: 'Adresse e-mail privée',
    emailPrivateNotice: '🔒 Votre e-mail est strictement confidentiel et jamais affiché aux autres utilisateurs.',
    password: 'Mot de passe',
    passwordPlaceholder: 'Entrez votre mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    forgotPassword: 'Mot de passe oublié ?',
    resetPassword: 'Réinitialiser le mot de passe',
    sendResetLink: 'Envoyer le lien de réinitialisation',
    resetCodeSent: 'Un lien de récupération sécurisé a été simulé vers votre adresse e-mail privée.',
    newPassword: 'Nouveau mot de passe sécurisé',
    doctorRealNameOptional: 'Nom complet du Médecin (Optionnel)',
    doctorRealNameNotice: 'Afficher votre vrai nom renforce la confiance clinique aux côtés de votre identifiant.',
    doctorRealNamePlaceholder: 'Dr. Sophie Martin',
    showRealNameOnProfile: 'Afficher le nom complet publiquement avec l’identifiant',
    medicalLicenseNumber: "Numéro d'Ordre des Médecins / Licence",
    medicalLicensePlaceholder: 'ex: RPPS-84920482',
    uploadMedicalLicense: 'Télécharger licence ou certificat médical (PDF/Image)',
    licenseFileUploaded: 'Document de certification joint',
    licenseVerificationNotice: 'Les comptes de médecins sont vérifiés avant d’obtenir le badge Vérifié.',
    noGenderPrivacyNotice: '🛡️ Confidentialité garantie : Nous ne collectons ni n’affichons aucun champ de genre.',
    avatarRoleNotice: 'Un avatar professionnel adapté à votre rôle est attribué. Les photos réelles sont interdites pour la confidentialité.',
    alreadyHaveAccount: 'Vous avez déjà un compte ? Connexion',
    dontHaveAccount: "Pas encore de compte ? S'inscrire",
    switchRole: "Changer le type d'inscription",
    accountDeactivatedNotice: 'Compte désactivé (Inactif depuis plus de 12 mois)',
    inactivePolicyDesc: 'Pour protéger les données de santé, les comptes inactifs pendant 12 mois consécutifs sont automatiquement fermés.',
    lastActiveDate: 'Dernière connexion active',
    accountActiveStatus: 'Statut du compte : Actif et conforme',
    deleteAccount: 'Supprimer mon compte',
    deleteAccountWarning: '⚠️ Cette action est irréversible et supprime tous vos enregistrements. Saisissez votre mot de passe pour confirmer.',
    enterPasswordToDelete: 'Entrez votre mot de passe pour confirmer la suppression',
    accountDeletedSuccess: 'Votre compte et toutes les données associées ont été définitivement supprimés.',
    publicConsultationsTitle: 'Consultations Médicales Publiques',
    publicConsultationsSubtitle: 'Toutes les discussions sont modérées et publiques. La messagerie privée est désactivée contre le harcèlement.',
    newConsultationPost: 'Poser une question médicale',
    postTitlePlaceholder: 'Résumé de vos symptômes ou demande médicale...',
    postSymptomsPlaceholder: 'Décrivez vos symptômes, durée et antécédents utiles...',
    selectSpecialty: 'Spécialité ciblée',
    postConsultationBtn: 'Publier la consultation',
    discussionThread: 'Discussion clinique',
    doctorRepliesOnlyNotice: '🔒 Sécurité médicale : Seul le patient auteur et les médecins vérifiés peuvent répondre.',
    patientAuthorBadge: 'Patient Auteur',
    verifiedDoctorReplyBadge: 'Réponse Médicale Vérifiée',
    otherPatientBlockedNotice: 'Vous consultez ce post à titre éducatif. Les autres patients ne peuvent pas commenter pour éviter toute désinformation médicale.',
    replyPlaceholder: 'Rédigez votre réponse clinique ou question de suivi...',
    sendReply: 'Envoyer la réponse',
    noPostsYet: 'Aucune consultation publiée pour le moment dans cette spécialité.',
    noPrivateDMsNotice: 'ℹ️ Information : Les messages privés sont désactivés par mesure de sécurité médicale.',
    moderationActiveBadge: 'Compte en règle',
    moderationBannedBadge: 'Banni définitivement (Propos injurieux)',
    moderationRestrictedBadge: 'Restreint pour 48 heures (Hors sujet)',
    bannedAlertTitle: 'Compte Suspendu',
    bannedAlertDesc: 'La modération IA a détecté des insultes ou des propos injurieux. Votre compte a été banni définitivement.',
    restrictedAlertTitle: 'Restriction Temporaire de Publication',
    restrictedAlertDesc: 'Vous êtes restreint pendant 48h pour avoir soumis un contenu hors sujet ou non médical.',
    moderationWarningTriggered: 'Alerte Modération IA : Votre publication a enfreint les règles communautaires.',
    testModerationToxicity: 'Simuler insulte / mot abusif (Bannissement immédiat)',
    testModerationOffTopic: 'Simuler spam hors sujet (Restriction 48h)',
    aiModerationNotice: '🤖 Tous les contenus sont scannés par IA pour garantir civilité et rigueur médicale.',
    nearYouTitle: 'Médecins Près de Chez Vous',
    nearYouSubtitle: 'Trouvez des spécialistes et cabinets médicaux dans votre région géographique',
    enableGpsLocation: 'Activer la géolocalisation (GPS)',
    locationEnabled: 'Position GPS active',
    selectCityFallback: 'Ou choisissez votre ville / région',
    kilometersAway: 'km de vous',
    clinicAddress: 'Adresse du cabinet médical',
    clinicName: 'Nom du cabinet ou de la clinique',
    practiceLocation: 'Lieu d’exercice & Cabinet',
    editPracticeLocation: 'Modifier l’adresse du cabinet',
    updateClinicInfo: 'Enregistrer les coordonnées',
    noNearbyDoctors: 'Aucun médecin vérifié dans ce rayon immédiat. Essayez une autre ville.',
    language: 'Langue',
    theme: 'Thème',
    lightMode: 'Mode Clair',
    darkMode: 'Mode Sombre',
    emergencySOS: 'Urgences SOS',
    emergencyAlert: 'En cas d’urgence vitale, contactez immédiatement les services de secours locaux.',
  },
};
