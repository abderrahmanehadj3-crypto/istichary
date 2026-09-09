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
  availableToday: string;
  topRated: string;
  boardVerifiedLicense: string;
  resetFilters: string;
  searchNearbyPlaceholder: string;

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
  star5Desc: string;
  star4Desc: string;
  star3Desc: string;
  star2Desc: string;
  star1Desc: string;
  ratingPlaceholder: string;

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
  unreadAlertsCount: string;
  allNotificationsRead: string;

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
  authRequiredFields: string;
  authPasswordsDoNotMatch: string;
  authUsernameTaken: string;
  authLicenseRequired: string;
  authDoctorHandleTaken: string;
  authEnterCredentials: string;

  // Inactive Account & Deletion & Protection
  accountDeactivatedNotice: string;
  inactivePolicyDesc: string;
  lastActiveDate: string;
  accountActiveStatus: string;
  deleteAccount: string;
  deleteAccountWarning: string;
  enterPasswordToDelete: string;
  accountDeletedSuccess: string;
  inactivityProtectionPolicy: string;
  accountActive: string;
  simulateInactivity: string;
  verificationRequiredForClinic: string;
  verificationPendingClinicDesc: string;
  patientNoClinicPermissionDesc: string;
  validEmailRequired: string;
  passwordMinLength: string;
  passwordsDoNotMatch: string;

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
  inquirySummaryLabel: string;
  urgencyLevelLabel: string;
  inquiryDetailsLabel: string;
  fillRequiredFields: string;

  // Specialties
  specialtyAll: string;
  specialtyCardiology: string;
  specialtyDermatology: string;
  specialtyPediatrics: string;
  specialtyNeurology: string;
  specialtyGeneral: string;
  specialtyOrthopedics: string;
  specialtyPsychiatry: string;

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
  appearanceAndLanguage: string;

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
  restrictedDashboardTitle: string;
  strictHealthcarePrivacyPolicy: string;
  adminSecurityNotice: string;
  loggedInAs: string;

  // Post & Comment Management (Edit & Delete)
  editPost: string;
  deletePost: string;
  editComment: string;
  deleteComment: string;
  saveChanges: string;
  editedBadge: string;
  deletePostConfirmTitle: string;
  deletePostConfirmDesc: string;
  deleteCommentConfirmTitle: string;
  deleteCommentConfirmDesc: string;
  confirmDelete: string;
  postUpdatedSuccess: string;
  postDeletedSuccess: string;
  commentUpdatedSuccess: string;
  commentDeletedSuccess: string;
  doctorAuthorBadge: string;
}
