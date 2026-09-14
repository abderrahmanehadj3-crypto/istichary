export type Language = 'en' | 'ar' | 'fr';
export type ThemeMode = 'light' | 'dark';

export type UserRole = 'patient' | 'doctor' | 'moderator' | 'super_admin';

export type VerificationStatus = 'verified' | 'pending' | 'rejected';

export type ModerationStatus = 'active' | 'restricted_48h' | 'banned';

export interface VerificationDocument {
  id: string;
  title: string;
  type: 'medical_license' | 'board_diploma' | 'council_id' | 'identity_proof';
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  previewNote: string;
}

export interface UserAccount {
  id: string;
  username: string; // e.g. "@alex_m" or "@dr_vance"
  email: string; // STRICTLY PRIVATE: Never displayed publicly to other users
  role: UserRole;
  password?: string;
  followingDoctorIds?: string[]; // IDs of doctors followed by this user
  
  // Doctor-specific fields
  realName?: string;
  showRealName?: boolean;
  specialty?: string; // MANDATORY: Every doctor's specialty is explicitly defined
  specializationId?: SpecializationId;
  verificationStatus?: VerificationStatus;
  medicalLicenseNumber?: string;
  hospitalOrClinic?: string;
  
  // Strictly restricted clinic location fields (ONLY editable by verified doctors)
  clinicCity?: string;
  clinicAddress?: string;
  clinicRegion?: string;
  clinicWorkingHours?: string;
  clinicPhone?: string;

  verificationDocuments?: VerificationDocument[]; // Accessible ONLY by Super Admin & Moderators
  rejectionReason?: string;
  
  // Inactivity tracking (12-month rule)
  lastLoginDate: string; // ISO string
  isDeactivatedInactive: boolean;
  
  // AI Moderation & Auto-Penalties
  moderationStatus: ModerationStatus;
  restrictionExpiresAt?: string;
  penaltyReason?: string;
}

export type SpecializationId =
  | 'all'
  | 'cardiology'
  | 'neurology'
  | 'pediatrics'
  | 'dermatology'
  | 'general'
  | 'orthopedics'
  | 'dentistry'
  | 'psychiatry'
  | 'laboratory';

export interface Specialization {
  id: SpecializationId;
  name: string;
  iconName: string;
  doctorCount: number;
  description: string;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  username: string;
  realName?: string;
  showRealName: boolean;
  specialty: string; // MANDATORY: prominently displayed
  specializationId: SpecializationId;
  verificationStatus: VerificationStatus;
  medicalLicenseNumber: string;
  hospitalOrClinic: string;
  clinicCity?: string;
  clinicAddress?: string;
  clinicRegion?: string;
  clinicWorkingHours?: string;
  clinicPhone?: string;
  experienceYears: number;
  about: string;
  education?: string;
  rating: number; // Star rating (1 to 5)
  reviewCount: number;
  followersCount?: number;
  verificationDocuments?: VerificationDocument[];
  rejectionReason?: string;
}

export interface DoctorRating {
  id: string;
  doctorId: string;
  patientId: string;
  patientUsername: string;
  stars: number; // 1 to 5
  feedback?: string;
  createdAt: string;
}

export interface ConsultationComment {
  id: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorRole: UserRole;
  authorRealName?: string;
  isVerifiedDoctor?: boolean;
  authorSpecialty?: string; // MANDATORY: prominently displayed on every doctor reply
  authorLicenseNumber?: string;
  authorDoctorId?: string;
  content: string;
  timestamp: string;
  isEdited?: boolean;
  updatedAt?: string;
  isDoctorRecommendation?: boolean;
  likesCount?: number;
  likedByUserIds?: string[];
}

export interface ConsultationPost {
  id: string;
  authorId: string;
  authorUsername: string;
  authorRole?: UserRole;
  authorRealName?: string;
  authorSpecialty?: string;
  title: string;
  specializationId: SpecializationId;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  createdAt: string;
  isEdited?: boolean;
  updatedAt?: string;
  comments: ConsultationComment[];
  isClosed?: boolean;
  likesCount?: number;
  likedByUserIds?: string[];
}

export interface ModerationResult {
  allowed: boolean;
  penaltyType: 'none' | 'restricted_48h' | 'banned';
  reason: string;
  matchedCategory?: 'abusive_language' | 'off_topic' | 'spam';
}

export type NotificationType = 'follow' | 'reply' | 'rating' | 'like' | 'moderation';

export interface AppNotification {
  id: string;
  recipientUserId?: string;
  type: NotificationType;
  actorUsername: string;
  actorRealName?: string;
  actorRole: UserRole;
  actorSpecialty?: string;
  title?: string;
  message: string;
  targetPostId?: string;
  postId?: string;
  targetDoctorId?: string;
  stars?: number;
  timestamp: string;
  isRead: boolean;
}
