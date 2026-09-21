import { Language } from '../types';

export interface AppTranslations {
  appName: string;
  tagline: string;
  arabic: string;
  french: string;
  english: string;
  russian: string;
  lightMode: string;
  darkMode: string;
  
  // Auth & Roles
  welcome: string;
  loginSubtitle: string;
  continueWithGoogle: string;
  orWithPhone: string;
  enterPhone: string;
  sendOtp: string;
  enterOtp: string;
  verifyOtp: string;
  otpSentTo: string;
  invalidOtp: string;
  selectRoleTitle: string;
  selectRoleSubtitle: string;
  roleCustomer: string;
  roleCustomerDesc: string;
  roleDriver: string;
  roleDriverDesc: string;
  confirmRole: string;
  logout: string;

  // Permissions (Mandatory timing: after role selection, before final account activation)
  permissionsTitle: string;
  permissionsSubtitle: string;
  cameraPermissionTitle: string;
  cameraPermissionDesc: string;
  locationPermissionTitle: string;
  locationPermissionDesc: string;
  grantPermissions: string;
  skipForNow: string;
  permissionsGranted: string;

  // Driver Wizard
  driverWizardTitle: string;
  step1Title: string;
  step1Desc: string;
  facePhotoConfidentialNotice: string;
  publicAvatarChoice: string;
  takeFacePhoto: string;
  retakeFacePhoto: string;
  facePhotoRequired: string;
  step2Title: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  ageNotice: string;
  ageError: string;
  step3Title: string;
  phoneVerifyDesc: string;
  step4Title: string;
  licenseAntiFraudNotice: string;
  licenseGuideTitle: string;
  licenseGuideItems: string;
  openLiveScanner: string;
  captureNow: string;
  retakeLive: string;
  licenseNumber: string;
  licenseExpiration: string;
  licenseFrontPhoto: string;
  licenseBackPhoto: string;
  step5Title: string;
  vehicleType: string;
  vehicleMotorcycle: string;
  vehicleCar: string;
  vehicleVan: string;
  regCertType: string;
  regCertPermanent: string; // بطاقة رمادية نهائية
  regCertTemporary: string; // بطاقة رمادية مؤقتة
  licensePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  nextStep: string;
  prevStep: string;
  submitDriverApp: string;

  // Google Sign-up Phone Verification
  googlePhoneVerifyTitle: string;
  googlePhoneVerifyDesc: string;

  // Customer Orders & Delivery
  selectWilaya: string;
  newOrder: string;
  activeOrders: string;
  pickupLocation: string;
  dropoffLocation: string;
  useCurrentGps: string;
  typeAddressPlaceholder: string;
  packageDetailsTitle: string;
  packagePhotoMandatory: string;
  packagePhotoDesc: string;
  uploadPackagePhoto: string;
  retakePackagePhoto: string;
  packageDescription: string;
  packageDescPlaceholder: string;
  packageCategory: string;
  distanceEstimated: string;
  suggestedBaseFare: string;
  yourOfferPrice: string;
  minFareWarning: string;
  publishOrder: string;

  // Negotiation & Bids
  searchingDrivers: string;
  incomingOffers: string;
  noOffersYet: string;
  driverOfferNotice: string;
  acceptOffer: string;
  counterOffer: string;
  declineOffer: string;
  yourCounterPrice: string;
  sendCounterOffer: string;
  offerAccepted: string;
  negotiationActive: string;

  // Active Delivery & Direct Contact (Crucial)
  deliveryAssigned: string;
  driverEnRoute: string;
  driverArrived: string;
  inTransit: string;
  deliveryCompleted: string;
  directContactDriver: string;
  driverPhoneLabel: string;
  btnCall: string;
  btnCancel: string;
  confirmCancelOrder: string;
  orderCancelled: string;
  liveMapTracking: string;
  distanceRemaining: string;
  etaLabel: string;

  // Driver View
  driverRadarTitle: string;
  onlineStatus: string;
  goOnline: string;
  goOffline: string;
  availableOrdersNearYou: string;
  noOrdersAvailable: string;
  orderDistance: string;
  inspectPackage: string;
  makeOffer: string;
  quickCounter: string;
  activeTask: string;
  pickupClient: string;
  deliverPackage: string;
  btnFinishDelivery: string;
  finishDeliveryConfirm: string;

  // General UI
  dzd: string;
  km: string;
  min: string;
  save: string;
  cancel: string;
  close: string;
  error: string;
  success: string;
}

export const translations: Record<Language, AppTranslations> = {
  ar: {
    appName: 'سريع',
    tagline: 'منصة التوصيل السريع والتفاوض المباشر',
    arabic: 'العربية',
    french: 'Français',
    english: 'English',
    russian: 'Русский',
    lightMode: 'الوضع الفاتح',
    darkMode: 'الوضع الداكن الهادئ',

    welcome: 'مرحباً بك في سريع',
    loginSubtitle: 'التوصيل الأسرع مع حرية التفاوض العادل على الأسعار',
    continueWithGoogle: 'المتابعة عبر حساب Google',
    orWithPhone: 'أو تسجيل الدخول برقم الهاتف',
    enterPhone: 'رقم الهاتف (الجزائر)',
    sendOtp: 'إرسال رمز التحقق SMS',
    enterOtp: 'أدخل رمز التحقق (OTP)',
    verifyOtp: 'تأكيد الرمز والدخول',
    otpSentTo: 'تم إرسال رمز التحقق إلى',
    invalidOtp: 'رمز التحقق غير صحيح، يرجى المحاولة ثانية',
    selectRoleTitle: 'اختر نوع حسابك للمتابعة',
    selectRoleSubtitle: 'هل ترغب في طلب توصيل طرود أم العمل كسائق كابتن؟',
    roleCustomer: 'زبون (أريد إرسال طرد)',
    roleCustomerDesc: 'حدد وجهتك، التقط صورة الطرد، واقترح السعر المناسب لك.',
    roleDriver: 'سائق توصيل (كابتن)',
    roleDriverDesc: 'استقبل طلبات التوصيل القريبة، فاوض على الأسعار، وحقق دخلاً يومياً.',
    confirmRole: 'تأكيد الحساب ومتابعة الإعداد',
    logout: 'تسجيل الخروج',

    permissionsTitle: 'أذونات الوصول الضرورية',
    permissionsSubtitle: 'لضمان دقة التتبع وسرعة الاستلام، يحتاج تطبيق سريع إلى الصلاحيات التالية:',
    cameraPermissionTitle: 'كاميرا الهاتف',
    cameraPermissionDesc: 'مطلوبة لتصوير الطرد لمعاينته، والتقاط السيلفي المباشر لتوثيق السائقين.',
    locationPermissionTitle: 'خدمات تحديد الموقع (GPS)',
    locationPermissionDesc: 'مطلوبة لتحديد نقطة الاستلام بدقة وعرض خط السير المباشر على الخريطة.',
    grantPermissions: 'تفعيل الصلاحيات ومتابعة الحساب',
    skipForNow: 'تخطي الآن والمتابعة',
    permissionsGranted: 'تم تفعيل الصلاحيات بنجاح!',

    driverWizardTitle: 'توثيق حساب السائق (كابتن سريع)',
    step1Title: 'الخطوة 1: صورة الوجه الحية (Selfie)',
    step1Desc: 'يرجى التقاط صورة واضحة ومباشرة لوجهك عبر كاميرا الجهاز للتحقق من الهوية.',
    facePhotoConfidentialNotice: 'صورة الوجه الحية سرية وخاصة: محفوظة حصرياً للإدارة لتوثيق الهوية البيومترية ومنع التزوير، ولن تظهر للزبائن.',
    publicAvatarChoice: 'صورة الحساب العامة للزبائن (اختياري)',
    takeFacePhoto: 'فتح الكاميرا والتقاط الصورة',
    retakeFacePhoto: 'إعادة التقاط صورة الوجه',
    facePhotoRequired: 'صورة الوجه المباشرة إلزامية لإتمام التوثيق',
    step2Title: 'الخطوة 2: المعلومات الشخصية والسن',
    firstName: 'الاسم الأول',
    lastName: 'اللقب (اسم العائلة)',
    birthDate: 'تاريخ الميلاد',
    ageNotice: 'ملاحظة قانونية: يجب ألا يقل عمر السائق عن 20 سنة تماماً.',
    ageError: 'عذراً، يجب أن يكون عمرك 20 عاماً على الأقل للانضمام كسائق في سريع.',
    step3Title: 'الخطوة 3: توثيق رقم الهاتف عبر SMS',
    phoneVerifyDesc: 'يرجى إدخال رقم هاتفك الجزائري الفعال للاتصال بك وتلقي رمز التحقق.',
    step4Title: 'الخطوة 4: رخصة السياقة',
    licenseAntiFraudNotice: 'منعاً للتزوير: تم تعطيل رفع الصور من الذاكرة لضمان الشفافية. يجب فتح الكاميرا وتصوير رخصة السياقة مباشرة داخل الإطار.',
    licenseGuideTitle: 'دليل التصوير الواضح لرخصة السياقة',
    licenseGuideItems: 'تأكد من وجودك في بيئة ساطعة وجيدة الإضاءة، وتأكد أن الاسم واللقب ورقم الرخصة مقروءة بوضوح ودون لمعان.',
    openLiveScanner: 'فتح الماسح الضوئي الحي لرخصة السياقة',
    captureNow: 'التقاط الصورة الحية الآن',
    retakeLive: 'إعادة المسح عبر الكاميرا',
    licenseNumber: 'رقم رخصة السياقة',
    licenseExpiration: 'تاريخ انتهاء الصلاحية',
    licenseFrontPhoto: 'صورة رخصة السياقة (الوجه الأمامي)',
    licenseBackPhoto: 'صورة رخصة السياقة (الوجه الخلفي)',
    step5Title: 'الخطوة 5: بيانات المركبة والبطاقة الرمادية',
    vehicleType: 'نوع المركبة',
    vehicleMotorcycle: 'دراجة نارية (Moto)',
    vehicleCar: 'سيارة سياحية (Voiture)',
    vehicleVan: 'شاحنة صغيرة (Fourgon / Utility)',
    regCertType: 'نوع البطاقة الرمادية للمركبة',
    regCertPermanent: 'بطاقة رمادية نهائية (Définitive)',
    regCertTemporary: 'بطاقة رمادية مؤقتة (Provisoire)',
    licensePlate: 'رقم لوحة الترقيم (Matricule)',
    vehicleBrand: 'علامة المركبة (مثلاً: Sym, Dacia, Peugeot)',
    vehicleModel: 'طراز المركبة وسنة الصنع',
    nextStep: 'التالي',
    prevStep: 'السابق',
    submitDriverApp: 'إرسال ملف السائق للاعتماد الفوري',

    googlePhoneVerifyTitle: 'توثيق رقم الهاتف لحساب Google',
    googlePhoneVerifyDesc: 'يرجى إدخال وتوثيق رقم هاتفك الجزائري لاستلام إشعارات الطلبات وتأكيد حسابك عبر رمز SMS',

    selectWilaya: 'اختر الولاية',
    newOrder: 'طلب توصيل جديد',
    activeOrders: 'الطلبات النشطة',
    pickupLocation: 'مكان الاستلام (من أين؟)',
    dropoffLocation: 'مكان التسليم (إلى أين؟)',
    useCurrentGps: 'موقعي الحالي (GPS)',
    typeAddressPlaceholder: 'اكتب العنوان بالتفصيل أو الحي...',
    packageDetailsTitle: 'تفاصيل ومعاينة الطرد',
    packagePhotoMandatory: 'صورة الطرد (إلزامية للمعاينة)',
    packagePhotoDesc: 'يجب رفع صورة واضحة للطرد حتى يطمئن السائق لنوع وحجم الشحنة قبل تقديم العرض.',
    uploadPackagePhoto: 'التقاط أو رفع صورة الطرد',
    retakePackagePhoto: 'تغيير صورة الطرد',
    packageDescription: 'وصف محتويات الطرد',
    packageDescPlaceholder: 'مثال: علبة أحذية متوسطة، مستندات هامة، أدوية خفيفة...',
    packageCategory: 'تصنيف الشحنة',
    distanceEstimated: 'المسافة المقدرة على المسار',
    suggestedBaseFare: 'السعر الاسترشادي المقترح',
    yourOfferPrice: 'سعرك المقترح للتفاوض (دج)',
    minFareWarning: 'يُفضل اقتراح سعر قريب من السعر الاسترشادي لجذب السائقين بسرعة.',
    publishOrder: 'نشر الطلب وبدء استلام عروض السائقين',

    searchingDrivers: 'جارٍ البحث عن كباتن في نطاقك...',
    incomingOffers: 'عروض السائقين المتاحة (تفاوض مباشر)',
    noOffersYet: 'في انتظار عروض السائقين القريبين...',
    driverOfferNotice: 'يقترح السائق توصيل طلبك مقابل هذا السعر:',
    acceptOffer: 'قبول العرض وتأكيد السائق',
    counterOffer: 'اقتراح سعر مضاد',
    declineOffer: 'رفض',
    yourCounterPrice: 'سعرك المضاد المقترح (دج):',
    sendCounterOffer: 'إرسال السعر المقترح للسائق',
    offerAccepted: 'تم قبول العرض بنجاح! السائق في طريقه إليك.',
    negotiationActive: 'مفاوضة السعر نشطة',

    deliveryAssigned: 'تم تعيين السائق وبدء الرحلة!',
    driverEnRoute: 'السائق متجه إلى نقطة الاستلام',
    driverArrived: 'وصل السائق إلى مكان الاستلام',
    inTransit: 'الطرد في الطريق إلى وجهة التسليم',
    deliveryCompleted: 'تم تسليم الطرد بنجاح!',
    directContactDriver: 'بيانات التواصل المباشر مع السائق',
    driverPhoneLabel: 'رقم هاتف السائق:',
    btnCall: 'اتصال هاتفي مباشر',
    btnCancel: 'إلغاء الطلب',
    confirmCancelOrder: 'هل أنت متأكد من رغبتك في إلغاء طلب التوصيل؟',
    orderCancelled: 'تم إلغاء طلب التوصيل.',
    liveMapTracking: 'تتبع حركة السائق الحية على الخريطة',
    distanceRemaining: 'المسافة المتبقية',
    etaLabel: 'الوقت المقدر للوصول',

    driverRadarTitle: 'رادار طلبات التوصيل القريبة',
    onlineStatus: 'حالة العمل',
    goOnline: 'أنا متاح (متصل)',
    goOffline: 'غير متاح (غير متصل)',
    availableOrdersNearYou: 'الطلبات المتاحة حالياً في ولايتك',
    noOrdersAvailable: 'لا توجد طلبات جديدة في هذه اللحظة، سيصلك إشعار فور نشر زبون لطلب جديد.',
    orderDistance: 'مسافة التوصيل',
    inspectPackage: 'معاينة صورة ووصف الطرد',
    makeOffer: 'تقديم عرض سعر',
    quickCounter: 'عرض مضاد سريع',
    activeTask: 'مهمة التوصيل الحالية',
    pickupClient: 'التوجه لاستلام الطرد',
    deliverPackage: 'التوجه لتسليم الطرد للزبون',
    btnFinishDelivery: 'تم تسليم الطرد (إنهاء التتبع)',
    finishDeliveryConfirm: 'هل تم تسليم الطرد وقبض المبلغ المتفق عليه؟',

    dzd: 'دج',
    km: 'كم',
    min: 'دقيقة',
    save: 'حفظ',
    cancel: 'إلغاء',
    close: 'إغلاق',
    error: 'خطأ',
    success: 'نجاح',
  },

  fr: {
    appName: 'Sari3',
    tagline: 'Livraison Express & Négociation Directe',
    arabic: 'العربية',
    french: 'Français',
    english: 'English',
    russian: 'Русский',
    lightMode: 'Mode Clair',
    darkMode: 'Mode Sombre Doux',

    welcome: 'Bienvenue sur Sari3',
    loginSubtitle: 'Livraison ultra-rapide avec négociation équitable des tarifs',
    continueWithGoogle: 'Continuer avec Google',
    orWithPhone: 'Ou se connecter par numéro de téléphone',
    enterPhone: 'Numéro de téléphone (Algérie)',
    sendOtp: 'Envoyer le code SMS OTP',
    enterOtp: 'Saisir le code de confirmation (OTP)',
    verifyOtp: 'Valider et continuer',
    otpSentTo: 'Code de vérification envoyé au',
    invalidOtp: 'Code invalide, veuillez réessayer',
    selectRoleTitle: 'Choisissez votre rôle pour continuer',
    selectRoleSubtitle: 'Souhaitez-vous expédier des colis ou devenir chauffeur-livreur ?',
    roleCustomer: 'Client (Expédier un colis)',
    roleCustomerDesc: 'Indiquez vos points, photographiez le colis et proposez votre tarif.',
    roleDriver: 'Chauffeur-Livreur (Capitaine)',
    roleDriverDesc: 'Consultez les colis, négociez vos tarifs et générez des revenus réguliers.',
    confirmRole: 'Confirmer et configurer le profil',
    logout: 'Se déconnecter',

    permissionsTitle: 'Autorisations Requises',
    permissionsSubtitle: 'Pour assurer un suivi précis et rapide, Sari3 a besoin des accès suivants :',
    cameraPermissionTitle: 'Appareil Photo',
    cameraPermissionDesc: 'Nécessaire pour photographier les colis et vérifier le visage en direct.',
    locationPermissionTitle: 'Géolocalisation (GPS)',
    locationPermissionDesc: 'Nécessaire pour le repérage précis et le suivi en temps réel sur carte.',
    grantPermissions: 'Activer les accès et continuer',
    skipForNow: 'Passer pour le moment',
    permissionsGranted: 'Autorisations accordées avec succès !',

    driverWizardTitle: 'Vérification du Livreur (Capitaine Sari3)',
    step1Title: 'Étape 1 : Photo selfie en direct',
    step1Desc: 'Veuillez capturer une photo nette de votre visage via la caméra.',
    facePhotoConfidentialNotice: 'Cette photo biométrique est strictement confidentielle : accessible uniquement au tableau de bord administrateur pour la sécurité, jamais visible par les clients.',
    publicAvatarChoice: 'Photo de profil public pour les clients (optionnel)',
    takeFacePhoto: 'Ouvrir la caméra et capturer',
    retakeFacePhoto: 'Reprendre la photo du visage',
    facePhotoRequired: 'La photo en direct est obligatoire pour la vérification.',
    step2Title: 'Étape 2 : Identité & Âge légal',
    firstName: 'Prénom',
    lastName: 'Nom de famille',
    birthDate: 'Date de naissance',
    ageNotice: 'Condition légale : Vous devez avoir au minimum 20 ans révolus.',
    ageError: 'Vous devez avoir au moins 20 ans pour postuler en tant que livreur.',
    step3Title: 'Étape 3 : Vérification du numéro de téléphone',
    phoneVerifyDesc: 'Renseignez votre numéro de mobile algérien actif pour le code SMS.',
    step4Title: 'Étape 4 : Permis de conduire',
    licenseAntiFraudNotice: 'Anti-fraude : le téléversement depuis les fichiers est désactivé. Veuillez capturer votre permis en direct via la caméra dans le cadre lumineux.',
    licenseGuideTitle: 'Guide de capture claire du permis',
    licenseGuideItems: "Assurez-vous d'être dans un endroit bien éclairé, sans reflet, avec nom et prénom parfaitement lisibles.",
    openLiveScanner: 'Ouvrir le scanner direct du permis',
    captureNow: 'Capturer le cliché en direct',
    retakeLive: 'Recommencer la capture',
    licenseNumber: 'Numéro de permis',
    licenseExpiration: "Date d'expiration",
    licenseFrontPhoto: 'Photo recto du permis',
    licenseBackPhoto: 'Photo verso du permis',
    step5Title: 'Étape 5 : Véhicule & Carte grise',
    vehicleType: 'Type de véhicule',
    vehicleMotorcycle: 'Moto',
    vehicleCar: 'Voiture',
    vehicleVan: 'Fourgon / Utilitaire',
    regCertType: 'Type de carte grise',
    regCertPermanent: 'Carte grise définitive',
    regCertTemporary: 'Carte grise provisoire',
    licensePlate: "Numéro d'immatriculation",
    vehicleBrand: 'Marque (ex. Sym, Dacia, Peugeot)',
    vehicleModel: 'Modèle et année',
    nextStep: 'Suivant',
    prevStep: 'Précédent',
    submitDriverApp: 'Soumettre mon dossier de validation',

    googlePhoneVerifyTitle: 'Vérification du numéro pour Google',
    googlePhoneVerifyDesc: 'Veuillez entrer votre numéro algérien pour recevoir le code SMS et activer votre compte',

    selectWilaya: 'Sélectionner la Wilaya',
    newOrder: 'Nouvelle livraison',
    activeOrders: 'Commandes en cours',
    pickupLocation: 'Lieu de ramassage (Départ)',
    dropoffLocation: 'Lieu de livraison (Arrivée)',
    useCurrentGps: 'Ma position GPS actuelle',
    typeAddressPlaceholder: "Saisir l'adresse détaillée ou le quartier...",
    packageDetailsTitle: 'Détails et inspection du colis',
    packagePhotoMandatory: 'Photo du colis (Obligatoire)',
    packagePhotoDesc: 'Une photo claire permet au livreur de voir le gabarit avant de faire une offre.',
    uploadPackagePhoto: 'Prendre ou importer la photo du colis',
    retakePackagePhoto: 'Changer la photo',
    packageDescription: 'Description du contenu',
    packageDescPlaceholder: 'Ex: Boîte à chaussures, documents urgents, petit électro...',
    packageCategory: 'Catégorie du colis',
    distanceEstimated: 'Distance estimée du trajet',
    suggestedBaseFare: 'Tarif indicatif suggéré',
    yourOfferPrice: 'Votre offre de prix (DZD)',
    minFareWarning: 'Un tarif proche du prix suggéré attire les livreurs plus vite.',
    publishOrder: 'Publier la commande et recevoir des offres',

    searchingDrivers: 'Recherche de livreurs à proximité...',
    incomingOffers: 'Offres des livreurs (Négociation directe)',
    noOffersYet: 'En attente des premières offres de livreurs...',
    driverOfferNotice: 'Un livreur propose de livrer votre colis pour :',
    acceptOffer: 'Accepter cette offre',
    counterOffer: 'Contre-proposition',
    declineOffer: 'Refuser',
    yourCounterPrice: 'Votre contre-offre (DZD) :',
    sendCounterOffer: 'Envoyer la contre-proposition',
    offerAccepted: 'Offre acceptée ! Le livreur est en route.',
    negotiationActive: 'Négociation en cours',

    deliveryAssigned: 'Livreur assigné ! Trajet commencé.',
    driverEnRoute: 'Livreur en route vers le point de retrait',
    driverArrived: 'Livreur arrivé au point de retrait',
    inTransit: 'Colis en cours de livraison',
    deliveryCompleted: 'Colis livré avec succès !',
    directContactDriver: 'Coordonnées directes du livreur',
    driverPhoneLabel: 'Numéro de téléphone :',
    btnCall: 'Appeler le livreur',
    btnCancel: 'Annuler la course',
    confirmCancelOrder: 'Êtes-vous sûr de vouloir annuler cette livraison ?',
    orderCancelled: 'Livraison annulée.',
    liveMapTracking: 'Suivi du livreur en direct sur la carte',
    distanceRemaining: 'Distance restante',
    etaLabel: "Temps d'arrivée estimé",

    driverRadarTitle: 'Radar des courses disponibles',
    onlineStatus: 'Statut de service',
    goOnline: 'Je suis en ligne (Disponible)',
    goOffline: 'Hors ligne (Pause)',
    availableOrdersNearYou: 'Courses disponibles dans votre Wilaya',
    noOrdersAvailable: 'Aucune commande pour le moment dans cette zone.',
    orderDistance: 'Distance de course',
    inspectPackage: 'Inspecter la photo du colis',
    makeOffer: 'Proposer mon tarif',
    quickCounter: 'Contre-offre rapide',
    activeTask: 'Mission en cours',
    pickupClient: 'Récupérer le colis',
    deliverPackage: 'Livrer au destinataire',
    btnFinishDelivery: 'Livraison terminée (Terminer le suivi)',
    finishDeliveryConfirm: 'Confirmez-vous la livraison et le paiement ?',

    dzd: 'DZD',
    km: 'km',
    min: 'min',
    save: 'Enregistrer',
    cancel: 'Annuler',
    close: 'Fermer',
    error: 'Erreur',
    success: 'Succès',
  },

  en: {
    appName: 'Sari3',
    tagline: 'Instant Delivery & Direct Negotiation',
    arabic: 'العربية',
    french: 'Français',
    english: 'English',
    russian: 'Русский',
    lightMode: 'Light Mode',
    darkMode: 'Muted Matte Dark',

    welcome: 'Welcome to Sari3',
    loginSubtitle: 'Ultra-fast delivery with fair, transparent fare negotiation',
    continueWithGoogle: 'Continue with Google',
    orWithPhone: 'Or sign in with phone number',
    enterPhone: 'Phone number (Algeria)',
    sendOtp: 'Send SMS OTP code',
    enterOtp: 'Enter verification OTP code',
    verifyOtp: 'Verify & Continue',
    otpSentTo: 'Verification code sent to',
    invalidOtp: 'Invalid code, please try again',
    selectRoleTitle: 'Select your account role',
    selectRoleSubtitle: 'Do you want to send packages or work as a delivery courier?',
    roleCustomer: 'Customer (Send a package)',
    roleCustomerDesc: 'Set pickup & drop-off, photograph your parcel, and set your desired price.',
    roleDriver: 'Delivery Driver (Captain)',
    roleDriverDesc: 'View nearby packages, negotiate custom fares, and earn daily income.',
    confirmRole: 'Confirm Role & Set Up',
    logout: 'Log Out',

    permissionsTitle: 'Required App Permissions',
    permissionsSubtitle: 'To ensure pinpoint accuracy and rapid courier dispatch, Sari3 requires:',
    cameraPermissionTitle: 'Device Camera',
    cameraPermissionDesc: 'Required for parcel photo inspection and driver live face verification.',
    locationPermissionTitle: 'Location Services (GPS)',
    locationPermissionDesc: 'Required for automatic pickup location and real-time live map tracking.',
    grantPermissions: 'Grant Permissions & Continue',
    skipForNow: 'Skip for now',
    permissionsGranted: 'Permissions successfully granted!',

    driverWizardTitle: 'Courier Onboarding & Verification',
    step1Title: 'Step 1: Live Face Selfie',
    step1Desc: 'Please capture a clear, real-time photo of your face using your camera.',
    facePhotoConfidentialNotice: 'Live biometric face capture is strictly confidential: accessible ONLY to the admin dashboard for identity verification and anti-fraud security, never shown to customers.',
    publicAvatarChoice: 'Public profile photo for customers (optional)',
    takeFacePhoto: 'Open Camera & Capture',
    retakeFacePhoto: 'Retake Face Photo',
    facePhotoRequired: 'Live selfie is required for identity verification.',
    step2Title: 'Step 2: Personal Info & Age Check',
    firstName: 'First Name',
    lastName: 'Last Name',
    birthDate: 'Date of Birth',
    ageNotice: 'Legal Requirement: Couriers must be strictly 20 years or older.',
    ageError: 'You must be at least 20 years old to register as a courier.',
    step3Title: 'Step 3: Phone Verification via SMS',
    phoneVerifyDesc: 'Enter your active Algerian phone number to receive the verification OTP.',
    step4Title: "Step 4: Driver's License",
    licenseAntiFraudNotice: 'Anti-Fraud Rule: File upload is disabled. Capture your driver license live using the camera inside the illuminated guide frame.',
    licenseGuideTitle: 'Clear License Capture Guide',
    licenseGuideItems: 'Ensure bright lighting, no glare or flash reflection, and clearly readable name, surname, and license number.',
    openLiveScanner: 'Open Live License Camera Scanner',
    captureNow: 'Capture Live Photo Now',
    retakeLive: 'Re-scan with Camera',
    licenseNumber: 'License Number',
    licenseExpiration: 'Expiration Date',
    licenseFrontPhoto: 'License Front Photo',
    licenseBackPhoto: 'License Back Photo',
    step5Title: 'Step 5: Vehicle & Registration',
    vehicleType: 'Vehicle Type',
    vehicleMotorcycle: 'Motorcycle',
    vehicleCar: 'Car',
    vehicleVan: 'Van / Small Truck',
    regCertType: 'Registration Certificate Type',
    regCertPermanent: 'Permanent Certificate',
    regCertTemporary: 'Temporary Certificate',
    licensePlate: 'License Plate (Matricule)',
    vehicleBrand: 'Brand (e.g., Sym, Dacia, Peugeot)',
    vehicleModel: 'Model & Year',
    nextStep: 'Next',
    prevStep: 'Back',
    submitDriverApp: 'Submit Driver Verification',

    googlePhoneVerifyTitle: 'Phone Verification for Google Account',
    googlePhoneVerifyDesc: 'Please enter and verify your active Algerian phone number to receive delivery alerts and activate your account via SMS code',

    selectWilaya: 'Select Wilaya (Province)',
    newOrder: 'New Delivery Order',
    activeOrders: 'Active Orders',
    pickupLocation: 'Pickup Location',
    dropoffLocation: 'Drop-off Destination',
    useCurrentGps: 'Current GPS Location',
    typeAddressPlaceholder: 'Type detailed address or street...',
    packageDetailsTitle: 'Package Details & Photo Inspection',
    packagePhotoMandatory: 'Package Photo (Mandatory)',
    packagePhotoDesc: 'A clear photo allows couriers to check dimensions before bidding.',
    uploadPackagePhoto: 'Take or Upload Package Photo',
    retakePackagePhoto: 'Change Photo',
    packageDescription: 'Package Contents Description',
    packageDescPlaceholder: 'E.g., Shoe box, official papers, fragile electronics...',
    packageCategory: 'Package Category',
    distanceEstimated: 'Estimated Distance',
    suggestedBaseFare: 'Suggested Base Fare',
    yourOfferPrice: 'Your Initial Price Offer (DZD)',
    minFareWarning: 'Offering close to the suggested price ensures faster courier bids.',
    publishOrder: 'Post Order & Receive Courier Bids',

    searchingDrivers: 'Searching for nearby couriers...',
    incomingOffers: 'Courier Bids (Live Negotiation)',
    noOffersYet: 'Waiting for couriers to submit bids...',
    driverOfferNotice: 'A courier offers to deliver your package for:',
    acceptOffer: 'Accept Offer & Confirm',
    counterOffer: 'Counter Offer',
    declineOffer: 'Decline',
    yourCounterPrice: 'Your counter-offer price (DZD):',
    sendCounterOffer: 'Send Counter Offer',
    offerAccepted: 'Offer accepted! The courier is heading to pickup.',
    negotiationActive: 'Negotiation in progress',

    deliveryAssigned: 'Courier assigned! Trip started.',
    driverEnRoute: 'Courier is en route to pickup point',
    driverArrived: 'Courier arrived at pickup',
    inTransit: 'Package is in transit to destination',
    deliveryCompleted: 'Package delivered successfully!',
    directContactDriver: 'Direct Courier Contact',
    driverPhoneLabel: 'Courier Phone:',
    btnCall: 'Call Courier',
    btnCancel: 'Cancel Delivery',
    confirmCancelOrder: 'Are you sure you want to cancel this delivery order?',
    orderCancelled: 'Order cancelled.',
    liveMapTracking: 'Live Courier Map Tracking',
    distanceRemaining: 'Remaining Distance',
    etaLabel: 'Estimated Arrival',

    driverRadarTitle: 'Available Delivery Orders',
    onlineStatus: 'Work Status',
    goOnline: 'Go Online (Available)',
    goOffline: 'Go Offline',
    availableOrdersNearYou: 'Available Orders in your Wilaya',
    noOrdersAvailable: 'No new orders right now in this area.',
    orderDistance: 'Delivery Distance',
    inspectPackage: 'Inspect Package Photo',
    makeOffer: 'Submit Fare Offer',
    quickCounter: 'Quick Counter Bid',
    activeTask: 'Current Active Mission',
    pickupClient: 'Pick up package',
    deliverPackage: 'Deliver to recipient',
    btnFinishDelivery: 'Finished (Terminate Live Tracking)',
    finishDeliveryConfirm: 'Has the package been delivered and fare collected?',

    dzd: 'DZD',
    km: 'km',
    min: 'min',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    error: 'Error',
    success: 'Success',
  },

  ru: {
    appName: 'Sari3',
    tagline: 'Быстрая доставка и прямые переговоры',
    arabic: 'العربية',
    french: 'Français',
    english: 'English',
    russian: 'Русский',
    lightMode: 'Светлая тема',
    darkMode: 'Мягкая матовая темная тема',

    welcome: 'Добро пожаловать в Sari3',
    loginSubtitle: 'Быстрая доставка со справедливым торгом за цену поездки',
    continueWithGoogle: 'Продолжить с Google',
    orWithPhone: 'Или по номеру телефона',
    enterPhone: 'Номер телефона (Алжир)',
    sendOtp: 'Отправить SMS-код',
    enterOtp: 'Введите код подтверждения (OTP)',
    verifyOtp: 'Подтвердить и войти',
    otpSentTo: 'Код отправлен на номер',
    invalidOtp: 'Неверный код, попробуйте еще раз',
    selectRoleTitle: 'Выберите вашу роль',
    selectRoleSubtitle: 'Вы хотите отправлять посылки или работать курьером?',
    roleCustomer: 'Клиент (Отправить посылку)',
    roleCustomerDesc: 'Укажите маршрут, сфотографируйте посылку и предложите цену.',
    roleDriver: 'Курьер-водитель (Капитан)',
    roleDriverDesc: 'Просматривайте заказы рядом, торгуйтесь за цену и зарабатывайте каждый день.',
    confirmRole: 'Подтвердить выбор роли',
    logout: 'Выйти из аккаунта',

    permissionsTitle: 'Необходимые разрешения',
    permissionsSubtitle: 'Для точного отслеживания и быстрой подачи курьера Sari3 нужны доступы:',
    cameraPermissionTitle: 'Камера устройства',
    cameraPermissionDesc: 'Требуется для фото посылки и проверки селфи курьера.',
    locationPermissionTitle: 'Геолокация (GPS)',
    locationPermissionDesc: 'Требуется для определения точки забора и трекинга на карте в реальном времени.',
    grantPermissions: 'Предоставить доступы и продолжить',
    skipForNow: 'Пропустить пока',
    permissionsGranted: 'Разрешения успешно предоставлены!',

    driverWizardTitle: 'Верификация курьера (Капитан Sari3)',
    step1Title: 'Шаг 1: Живое селфи лица',
    step1Desc: 'Сделайте четкое фото лица через камеру устройства.',
    facePhotoConfidentialNotice: 'Живое биометрическое фото лица строго конфиденциально: доступно ТОЛЬКО администраторам для проверки безопасности и защиты от мошенничества, клиенты его не увидят.',
    publicAvatarChoice: 'Публичное фото профиля для клиентов (опционально)',
    takeFacePhoto: 'Открыть камеру и сделать снимок',
    retakeFacePhoto: 'Переснять фото лица',
    facePhotoRequired: 'Живое селфи обязательно для проверки личности.',
    step2Title: 'Шаг 2: Личные данные и возраст',
    firstName: 'Имя',
    lastName: 'Фамилия',
    birthDate: 'Дата рождения',
    ageNotice: 'Требование закона: возраст курьера строго от 20 лет.',
    ageError: 'Вам должно быть не менее 20 лет для работы курьером.',
    step3Title: 'Шаг 3: Подтверждение телефона через SMS',
    phoneVerifyDesc: 'Укажите действующий алжирский номер для получения SMS-кода.',
    step4Title: 'Шаг 4: Водительское удостоверение',
    licenseAntiFraudNotice: 'Защита от подделок: загрузка файлов отключена. Сфотографируйте права вживую через камеру внутри рамки.',
    licenseGuideTitle: 'Инструкция по четкому снимку прав',
    licenseGuideItems: 'Снимайте при ярком свете, без бликов, имя, фамилия и номер удостоверения должны читаться идеально.',
    openLiveScanner: 'Открыть сканер прав через камеру',
    captureNow: 'Сделать снимок сейчас',
    retakeLive: 'Переснять через камеру',
    licenseNumber: 'Номер удостоверения',
    licenseExpiration: 'Срок действия',
    licenseFrontPhoto: 'Фото лицевой стороны',
    licenseBackPhoto: 'Фото обратной стороны',
    step5Title: 'Шаг 5: Транспорт и техпаспорт',
    vehicleType: 'Тип транспорта',
    vehicleMotorcycle: 'Мотоцикл',
    vehicleCar: 'Легковой автомобиль',
    vehicleVan: 'Фургон',
    regCertType: 'Тип техпаспорта',
    regCertPermanent: 'Постоянный техпаспорт',
    regCertTemporary: 'Временный техпаспорт',
    licensePlate: 'Госномер',
    vehicleBrand: 'Марка (напр., Sym, Dacia, Peugeot)',
    vehicleModel: 'Модель и год',
    nextStep: 'Далее',
    prevStep: 'Назад',
    submitDriverApp: 'Отправить заявку на проверку',

    googlePhoneVerifyTitle: 'Подтверждение номера для Google',
    googlePhoneVerifyDesc: 'Пожалуйста, укажите и подтвердите ваш алжирский номер телефона для активации аккаунта через SMS-код',

    selectWilaya: 'Выберите Вилайет (провинцию)',
    newOrder: 'Новый заказ доставки',
    activeOrders: 'Активные заказы',
    pickupLocation: 'Место забора посылки',
    dropoffLocation: 'Место доставки',
    useCurrentGps: 'Текущая GPS-точка',
    typeAddressPlaceholder: 'Введите точный адрес или район...',
    packageDetailsTitle: 'Детали и осмотр посылки',
    packagePhotoMandatory: 'Фото посылки (Обязательно)',
    packagePhotoDesc: 'Четкое фото позволяет водителю оценить габариты до ставки.',
    uploadPackagePhoto: 'Сделать или загрузить фото посылки',
    retakePackagePhoto: 'Изменить фото',
    packageDescription: 'Описание содержимого',
    packageDescPlaceholder: 'Например: обувная коробка, документы, электроника...',
    packageCategory: 'Категория посылки',
    distanceEstimated: 'Расчетное расстояние',
    suggestedBaseFare: 'Рекомендуемая базовая цена',
    yourOfferPrice: 'Ваша цена для торга (DZD)',
    minFareWarning: 'Цена близкая к базовой привлекает курьеров гораздо быстрее.',
    publishOrder: 'Опубликовать заказ и получать ставки',

    searchingDrivers: 'Поиск курьеров поблизости...',
    incomingOffers: 'Ставки курьеров (Прямой торг)',
    noOffersYet: 'Ожидание предложений от водителей...',
    driverOfferNotice: 'Курьер предлагает доставить ваш заказ за:',
    acceptOffer: 'Принять предложение',
    counterOffer: 'Встречное предложение',
    declineOffer: 'Отклонить',
    yourCounterPrice: 'Ваша встречная цена (DZD):',
    sendCounterOffer: 'Отправить встречное предложение',
    offerAccepted: 'Предложение принято! Курьер уже в пути.',
    negotiationActive: 'Идет торг',

    deliveryAssigned: 'Курьер назначен! Поездка началась.',
    driverEnRoute: 'Курьер едет на точку забора',
    driverArrived: 'Курьер прибыл на точку забора',
    inTransit: 'Посылка в пути к получателю',
    deliveryCompleted: 'Посылка успешно доставлена!',
    directContactDriver: 'Прямая связь с курьером',
    driverPhoneLabel: 'Номер телефона курьера:',
    btnCall: 'Позвонить курьеру',
    btnCancel: 'Отменить заказ',
    confirmCancelOrder: 'Вы уверены, что хотите отменить этот заказ?',
    orderCancelled: 'Заказ отменен.',
    liveMapTracking: 'Отслеживание курьера на карте в реальном времени',
    distanceRemaining: 'Осталось проехать',
    etaLabel: 'Примерное время прибытия',

    driverRadarTitle: 'Радар доступных заказов',
    onlineStatus: 'Статус работы',
    goOnline: 'На линии (Свободен)',
    goOffline: 'Не на линии (Отдых)',
    availableOrdersNearYou: 'Доступные заказы в вашем вилайете',
    noOrdersAvailable: 'Сейчас нет новых заказов в этой зоне.',
    orderDistance: 'Дистанция поездки',
    inspectPackage: 'Осмотреть фото посылки',
    makeOffer: 'Предложить свою цену',
    quickCounter: 'Быстрый встречный торг',
    activeTask: 'Текущий заказ',
    pickupClient: 'Забрать посылку',
    deliverPackage: 'Отвезти посылку получателю',
    btnFinishDelivery: 'Заказ завершен (Отключить трекинг)',
    finishDeliveryConfirm: 'Посылка передана получателю и оплата получена?',

    dzd: 'DZD',
    km: 'км',
    min: 'мин',
    save: 'Сохранить',
    cancel: 'Отмена',
    close: 'Закрыть',
    error: 'Ошибка',
    success: 'Успешно',
  },
};
