import { Language } from '../types';

export interface Translations {
  appName: string;
  tagline: string;
  // Navigation
  navHome: string;
  navConsultations: string;
  navFollowed: string;
  navProfile: string;
  navAdmin: string;
  // Common
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
  // AI Moderation & Auto Penalties
  moderationActiveBadge: string;
  moderationBannedBadge: string;
  moderationRestrictedBadge: string;
  bannedAlertTitle: string;
  bannedAlertDesc: string;
  restrictedAlertTitle: string;
  restrictedAlertDesc: string;
  // Theme & Language
  language: string;
  theme: string;
  lightMode: string;
  darkMode: string;
  // Admin & Moderator
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
    tagline: 'Streamlined Medical Consultations & Verified Specialists',
    navHome: 'Consultations',
    navConsultations: 'Feed',
    navFollowed: 'Followed',
    navProfile: 'Profile',
    navAdmin: 'Verification',
    searchPlaceholder: 'Search medical questions, symptoms, specialties...',
    specializations: 'Specialties',
    allSpecialties: 'All Specialties',
    allDoctors: 'All Specialists',
    verifiedDoctorBadge: 'Board Verified Specialist',
    pendingVerification: 'Pending Board Verification',
    verified: 'Verified Specialist',
    experienceYears: 'years clinical exp.',
    urgent: 'Urgent Priority',
    normal: 'Standard Inquiry',
    low: 'Routine Question',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save Changes',
    delete: 'Permanently Delete',
    submit: 'Publish Question',
    loading: 'Processing...',
    success: 'Completed successfully',
    error: 'An error occurred',
    viewDetails: 'View Details',
    close: 'Close',
    followDoctor: '+ Follow Specialist',
    followingDoctor: '✓ Following',
    unfollowDoctor: 'Unfollow',
    followedDoctors: 'Followed Doctors',
    noFollowedDoctors: 'You are not following any specialists yet. Follow doctors from their replies.',
    filterFollowedOnly: '⭐ Followed Specialists',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    signUp: 'Sign Up',
    signUpAsPatient: 'Patient Account',
    signUpAsDoctor: 'Physician Registration',
    loginTitle: 'Access Your Account',
    username: 'Unique Username',
    usernamePlaceholder: '@username (e.g. @health_seeker)',
    emailPrivate: 'Registered Email',
    emailPrivateNotice: '🔒 Strictly Private & Encrypted: Never displayed to any other user.',
    updateEmail: 'Update Registered Email',
    newEmailPlaceholder: 'Enter new private email',
    emailUpdatedSuccess: 'Email address updated successfully!',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    passwordChangedSuccess: 'Password changed successfully!',
    sendResetLink: 'Send Password Reset Link',
    resetCodeSent: 'A secure recovery link has been simulated to your private email address.',
    doctorRealNameOptional: 'Physician Full Name (Optional)',
    doctorRealNameNotice: 'Displaying your real name builds clinical credibility next to your specialty.',
    doctorRealNamePlaceholder: 'Dr. Jane Smith, MD',
    showRealNameOnProfile: 'Display real clinical name alongside username',
    doctorSpecialtyMandatory: 'Medical Specialty (Mandatory)',
    doctorSpecialtyNotice: 'Your specialty is mandatorily displayed on every clinical response you write.',
    medicalLicenseNumber: 'Medical Board License Number',
    medicalLicensePlaceholder: 'e.g. MD-8392-CARD',
    uploadMedicalLicense: 'Upload Medical License / Board Certificate (PDF/JPG)',
    licenseFileUploaded: 'Document Attached for Verification Review',
    licenseVerificationNotice: 'Submitted documents are strictly confidential and reviewed only by the verification committee.',
    noGenderPrivacyNotice: '🛡️ Privacy First: We do not collect or display your gender.',
    avatarRoleNotice: 'Standardized role avatar assigned. Personal photo uploads are disabled for privacy.',
    alreadyHaveAccount: 'Already have an account? Sign In',
    dontHaveAccount: "Don't have an account? Sign Up",
    switchRole: 'Switch Registration Type',
    accountDeactivatedNotice: 'Account Deactivated Due to Inactivity',
    inactivePolicyDesc: 'Accounts with zero login activity for 12 consecutive months are automatically archived.',
    lastActiveDate: 'Last Active Date',
    accountActiveStatus: 'Account Status: Active',
    deleteAccount: 'Permanently Delete Account',
    deleteAccountWarning: 'This action permanently erases your account and anonymizes your inquiries. It cannot be undone.',
    enterPasswordToDelete: 'Enter your password to authorize permanent deletion',
    accountDeletedSuccess: 'Account and associated records permanently deleted.',
    publicConsultationsTitle: 'Public Medical Consultations',
    publicConsultationsSubtitle: 'Publish medical questions openly to receive clinical guidance exclusively from board-verified specialists.',
    homePostInputPlaceholder: 'Ask a verified specialist: Describe your medical question or symptoms...',
    newConsultationPost: 'Ask a Medical Question',
    publishInquiryBtn: 'Publish Inquiry',
    postTitlePlaceholder: 'Summary of symptom or question (e.g. Morning palpitations after espresso)',
    postSymptomsPlaceholder: 'Describe your symptoms in detail: onset, duration, severity, and any relevant health history...',
    selectSpecialty: 'Target Medical Specialty',
    discussionThread: 'Clinical Discussion & Guidance',
    doctorRepliesOnlyNotice: 'To prevent dangerous misinformation, only verified physicians and the post author may respond.',
    patientAuthorBadge: 'Patient Author',
    verifiedDoctorReplyBadge: 'Physician Clinical Response',
    otherPatientBlockedNotice: 'Replies are restricted to verified physicians and the patient author.',
    replyPlaceholder: 'Write your follow-up inquiry or doctor response...',
    doctorAdvicePlaceholder: 'Provide verified clinical assessment, recommended diagnostic steps, or triage advice...',
    patientFollowUpPlaceholder: 'Reply to the specialist with clarification or symptom updates...',
    sendReply: 'Post Response',
    noPostsYet: 'No consultation inquiries found under this filter.',
    noPrivateDMsNotice: 'Private DMs are disabled to ensure all clinical guidance adheres to public accountability standards.',
    moderationActiveBadge: 'Active & Verified',
    moderationBannedBadge: 'Permanently Banned',
    moderationRestrictedBadge: 'Restricted (48h)',
    bannedAlertTitle: 'Account Suspended by AI Moderation',
    bannedAlertDesc: 'Abusive language, harassment, or severe rule violations result in permanent suspension.',
    restrictedAlertTitle: 'Account Restricted for 48 Hours',
    restrictedAlertDesc: 'Repeated non-medical spam or off-topic advertising triggered a temporary restriction.',
    language: 'Language',
    theme: 'Theme Mode',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    adminDashboard: 'Admin & Verification Control',
    moderatorDashboard: 'Doctor Review Queue',
    verificationQueue: 'Doctor Credential Verification Queue',
    pendingApplicationsCount: 'Pending Physician Applications',
    approveDoctor: 'Approve & Grant Verified Badge',
    rejectDoctor: 'Reject Application',
    rejectionReasonPrompt: 'Reason for rejection (e.g., license unverified in council register)',
    medicalDocumentsConfidential: 'Confidential Medical Documents',
    restrictedReviewNotice: '🔒 STRICT MEDICAL PRIVACY: Uploaded credentials and certificates are accessible exclusively by Super Admin and authorized review moderators. Patients and other users have ZERO access.',
    doctorVerifiedSuccess: 'Physician approved! Verified specialist badge granted.',
    doctorRejectedSuccess: 'Application rejected with notification notes.',
    systemMetrics: 'System Metrics & Privacy Oversight',
    teamManagement: 'Review Team & Moderators',
    appointModerator: 'Appoint Moderator',
    revokeModerator: 'Revoke Moderator Role',
  },
  ar: {
    appName: 'إستشاري',
    tagline: 'منصة استشارات طبية مبسطة ونخبة أطباء موثقين',
    navHome: 'الاستشارات',
    navConsultations: 'المنشورات',
    navFollowed: 'المتابعون',
    navProfile: 'حسابي',
    navAdmin: 'التوثيق',
    searchPlaceholder: 'ابحث في الأسئلة الطبية، الأعراض، التخصصات...',
    specializations: 'التخصصات الطبية',
    allSpecialties: 'جميع التخصصات',
    allDoctors: 'جميع الأطباء',
    verifiedDoctorBadge: 'طبيب معتمد وموثق',
    pendingVerification: 'قيد مراجعة الترخيص',
    verified: 'طبيب موثق',
    experienceYears: 'سنوات خبرة سريرية',
    urgent: 'أولوية عاجلة',
    normal: 'استفسار عادي',
    low: 'سؤال روتيني',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    save: 'حفظ التعديلات',
    delete: 'حذف نهائي',
    submit: 'نشر الاستشارة',
    loading: 'جاري المعالجة...',
    success: 'تم بنجاح',
    error: 'حدث خطأ',
    viewDetails: 'عرض التفاصيل',
    close: 'إغلاق',
    followDoctor: '+ متابعة الطبيب',
    followingDoctor: '✓ تمت المتابعة',
    unfollowDoctor: 'إلغاء المتابعة',
    followedDoctors: 'الأطباء الذين تتابعهم',
    noFollowedDoctors: 'أنت لا تتابع أي طبيب حالياً. يمكنك متابعة الأطباء من ردودهم.',
    filterFollowedOnly: '⭐ أطبائي المتابعون',
    signIn: 'تسجيل الدخول',
    signOut: 'تسجيل الخروج',
    signUp: 'إنشاء حساب',
    signUpAsPatient: 'حساب مريض',
    signUpAsDoctor: 'تسجيل كطبيب',
    loginTitle: 'الدخول إلى حسابك',
    username: 'اسم المستخدم الفريد',
    usernamePlaceholder: 'username@ (مثال: health_seeker@)',
    emailPrivate: 'البريد الإلكتروني المسجل',
    emailPrivateNotice: '🔒 سري ومشفر بالكامل: لن يظهر لأي مستخدم آخر نهائياً.',
    updateEmail: 'تحديث البريد الإلكتروني',
    newEmailPlaceholder: 'أدخل البريد الإلكتروني الجديد',
    emailUpdatedSuccess: 'تم تحديث البريد الإلكتروني بنجاح!',
    password: 'كلمة المرور',
    passwordPlaceholder: 'أدخل كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    forgotPassword: 'نسيت كلمة المرور؟',
    resetPassword: 'إعادة تعيين كلمة المرور',
    changePassword: 'تغيير كلمة المرور',
    currentPassword: 'كلمة المرور الحالية',
    newPassword: 'كلمة المرور الجديدة',
    passwordChangedSuccess: 'تم تغيير كلمة المرور بنجاح!',
    sendResetLink: 'إرسال رابط استعادة كلمة المرور',
    resetCodeSent: 'تمت محاكاة إرسال رابط الأمان إلى بريدك الإلكتروني الخاص.',
    doctorRealNameOptional: 'الاسم الكامل للطبيب (اختياري)',
    doctorRealNameNotice: 'إظهار اسمك الحقيقي يعزز الثقة السريرية بجانب تخصصك.',
    doctorRealNamePlaceholder: 'د. سارة المنصوري',
    showRealNameOnProfile: 'إظهار الاسم الطبي الحقيقي بجانب اسم المستخدم علناً',
    doctorSpecialtyMandatory: 'التخصص الطبي (إلزامي)',
    doctorSpecialtyNotice: 'يتم عرض تخصصك الطبي بشكل بارز وإلزامي بجانب اسمك في كل رد سريري.',
    medicalLicenseNumber: 'رقم ترخيص مزاولة المهنة الطبية',
    medicalLicensePlaceholder: 'مثال: MD-8392-CARD',
    uploadMedicalLicense: 'رفع ترخيص مزاولة المهنة أو الشهادة الطبية (PDF/JPG)',
    licenseFileUploaded: 'تم إرفاق وثيقة الاعتماد للمراجعة',
    licenseVerificationNotice: 'الوثائق المرفوعة سرية للغاية ويتم فحصها حصراً من قبل لجنة التحقق الطبية.',
    noGenderPrivacyNotice: '🛡️ الخصوصية أولاً: لا نجمع أو نعرض جنس المستخدم.',
    avatarRoleNotice: 'تم تعيين أيقونة رمزية قياسية بحسب الدور لضمان الخصوصية ومنع الصور الشخصية.',
    alreadyHaveAccount: 'لديك حساب بالفعل؟ سجل دخولك',
    dontHaveAccount: 'ليس لديك حساب؟ أنشئ حساباً جديداً',
    switchRole: 'تغيير نوع التسجيل',
    accountDeactivatedNotice: 'تم تعطيل الحساب بسبب الخمول',
    inactivePolicyDesc: 'يتم أرشفة الحسابات التي لم تسجل أي نشاط دخول لمدة 12 شهراً متتالية.',
    lastActiveDate: 'تاريخ آخر نشاط',
    accountActiveStatus: 'حالة الحساب: نشط',
    deleteAccount: 'حذف الحساب نهائياً',
    deleteAccountWarning: 'سيؤدي هذا الإجراء إلى حذف حسابك نهائياً وتجريد بياناتك. لا يمكن التراجع عن هذا.',
    enterPasswordToDelete: 'أدخل كلمة المرور لتأكيد الحذف النهائي',
    accountDeletedSuccess: 'تم حذف الحساب وجميع سجلاته نهائياً.',
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
    moderationActiveBadge: 'نشط وموثق',
    moderationBannedBadge: 'محظور نهائياً',
    moderationRestrictedBadge: 'مقيد (48 ساعة)',
    bannedAlertTitle: 'تم إيقاف الحساب بواسطة المشرف الآلي',
    bannedAlertDesc: 'الألفاظ المسيئة أو انتهاكات الأمان الصريحة تؤدي للحظر الفوري الدائم.',
    restrictedAlertTitle: 'الحساب مقيد لمدة 48 ساعة',
    restrictedAlertDesc: 'تكرار النشر العشوائي غير الطبي أدى إلى تقييد المشاركة مؤقتاً.',
    language: 'اللغة',
    theme: 'المظهر',
    lightMode: 'الوضع الفاتح',
    darkMode: 'الوضع الداكن',
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
    navHome: 'Consultations',
    navConsultations: 'Fil',
    navFollowed: 'Suivis',
    navProfile: 'Profil',
    navAdmin: 'Vérification',
    searchPlaceholder: 'Rechercher questions médicales, symptômes, spécialités...',
    specializations: 'Spécialités',
    allSpecialties: 'Toutes les spécialités',
    allDoctors: 'Tous les spécialistes',
    verifiedDoctorBadge: 'Spécialiste Certifié',
    pendingVerification: 'Vérification en attente',
    verified: 'Médecin Vérifié',
    experienceYears: 'ans d’expérience clinique',
    urgent: 'Urgence Prioritaire',
    normal: 'Demande Standard',
    low: 'Question de Routine',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    save: 'Enregistrer',
    delete: 'Supprimer Définitivement',
    submit: 'Publier la Consultation',
    loading: 'Traitement en cours...',
    success: 'Opération réussie',
    error: 'Une erreur est survenue',
    viewDetails: 'Voir Détails',
    close: 'Fermer',
    followDoctor: '+ Suivre le spécialiste',
    followingDoctor: '✓ Suivi',
    unfollowDoctor: 'Ne plus suivre',
    followedDoctors: 'Médecins Suivis',
    noFollowedDoctors: 'Vous ne suivez aucun spécialiste pour le moment. Suivez des médecins depuis leurs réponses.',
    filterFollowedOnly: '⭐ Spécialistes Suivis',
    signIn: 'Connexion',
    signOut: 'Déconnexion',
    signUp: 'Inscription',
    signUpAsPatient: 'Compte Patient',
    signUpAsDoctor: 'Inscription Médecin',
    loginTitle: 'Accédez à votre compte',
    username: 'Nom d’utilisateur unique',
    usernamePlaceholder: '@nom_utilisateur (ex: @patient_sante)',
    emailPrivate: 'Adresse E-mail Enregistrée',
    emailPrivateNotice: '🔒 Strictement Privé & Chiffré : Jamais affiché aux autres utilisateurs.',
    updateEmail: 'Modifier l’adresse e-mail',
    newEmailPlaceholder: 'Entrez la nouvelle adresse e-mail',
    emailUpdatedSuccess: 'Adresse e-mail mise à jour avec succès !',
    password: 'Mot de passe',
    passwordPlaceholder: 'Entrez votre mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    forgotPassword: 'Mot de passe oublié ?',
    resetPassword: 'Réinitialiser le mot de passe',
    changePassword: 'Changer le mot de passe',
    currentPassword: 'Mot de passe actuel',
    newPassword: 'Nouveau mot de passe',
    passwordChangedSuccess: 'Mot de passe modifié avec succès !',
    sendResetLink: 'Envoyer le lien de réinitialisation',
    resetCodeSent: 'Un lien sécurisé de récupération a été simulé vers votre e-mail privé.',
    doctorRealNameOptional: 'Nom Complet du Médecin (Optionnel)',
    doctorRealNameNotice: 'Afficher votre vrai nom renforce la crédibilité clinique à côté de votre spécialité.',
    doctorRealNamePlaceholder: 'Dr. Sophie Bernard, MD',
    showRealNameOnProfile: 'Afficher publiquement le nom clinique à côté du pseudo',
    doctorSpecialtyMandatory: 'Spécialité Médicale (Obligatoire)',
    doctorSpecialtyNotice: 'Votre spécialité est obligatoirement et visiblement affichée sur chacune de vos réponses cliniques.',
    medicalLicenseNumber: 'Numéro d’Ordre / Licence Médicale',
    medicalLicensePlaceholder: 'ex: MD-8392-CARD',
    uploadMedicalLicense: 'Téléverser Licence Médicale / Diplôme de Spécialité (PDF/JPG)',
    licenseFileUploaded: 'Document joint pour examen de vérification',
    licenseVerificationNotice: 'Les documents téléversés sont strictement confidentiels et examinés par le comité de vérification.',
    noGenderPrivacyNotice: '🛡️ Confidentialité : Nous ne collectons ni n’affichons votre genre.',
    avatarRoleNotice: 'Avatar de rôle standardisé assigné. Téléversement de photos personnelles désactivé.',
    alreadyHaveAccount: 'Déjà un compte ? Se connecter',
    dontHaveAccount: 'Pas encore de compte ? S’inscrire',
    switchRole: 'Changer le type d’inscription',
    accountDeactivatedNotice: 'Compte désactivé pour inactivité',
    inactivePolicyDesc: 'Les comptes sans connexion pendant 12 mois consécutifs sont automatiquement archivés.',
    lastActiveDate: 'Dernière date d’activité',
    accountActiveStatus: 'Statut du compte : Actif',
    deleteAccount: 'Supprimer définitivement le compte',
    deleteAccountWarning: 'Cette action supprime irréversiblement votre compte et anonymise vos questions. Action irréversible.',
    enterPasswordToDelete: 'Entrez votre mot de passe pour confirmer la suppression',
    accountDeletedSuccess: 'Compte et dossiers associés supprimés avec succès.',
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
    moderationActiveBadge: 'Actif & Vérifié',
    moderationBannedBadge: 'Banni Définitivement',
    moderationRestrictedBadge: 'Restreint (48h)',
    bannedAlertTitle: 'Compte suspendu par la modération IA',
    bannedAlertDesc: 'Les propos injurieux ou infractions graves entraînent une suspension immédiate permanente.',
    restrictedAlertTitle: 'Compte restreint pour 48 heures',
    restrictedAlertDesc: 'Des messages hors-sujet répétés ont entraîné une restriction temporaire.',
    language: 'Langue',
    theme: 'Mode Thème',
    lightMode: 'Mode Clair',
    darkMode: 'Mode Sombre',
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
