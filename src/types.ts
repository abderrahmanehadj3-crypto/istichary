export type Language = 'en' | 'ar' | 'fr';
export type ThemeMode = 'light' | 'dark';

export type UserRole = 'patient' | 'doctor';

export type VerificationStatus = 'verified' | 'pending' | 'rejected';

export type ModerationStatus = 'active' | 'restricted_48h' | 'banned';

export interface UserAccount {
  id: string;
  username: string; // e.g. "@alex_m" or "@dr_vance"
  email: string; // STRICTLY PRIVATE: Never displayed publicly to other users
  role: UserRole;
  password?: string;
  // Doctor-specific fields
  realName?: string; // Doctor's optional real name displayed alongside/above username
  showRealName?: boolean;
  specialty?: string;
  specializationId?: SpecializationId;
  verificationStatus?: VerificationStatus;
  medicalLicenseNumber?: string;
  medicalCertificateFile?: string; // name of uploaded document
  clinicName?: string;
  clinicAddress?: string;
  clinicCity?: string;
  clinicLat?: number;
  clinicLng?: number;
  consultationFee?: number;
  // Inactivity tracking
  lastLoginDate: string; // ISO string
  isDeactivatedInactive: boolean; // Auto-flagged after 12 months of inactivity
  // AI Moderation & Auto-Penalties
  moderationStatus: ModerationStatus;
  restrictionExpiresAt?: string; // ISO string for 48h restriction
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
  | 'psychiatry';

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
  specialty: string;
  specializationId: SpecializationId;
  verificationStatus: VerificationStatus;
  medicalLicenseNumber: string;
  medicalCertificateFile?: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  patientsCount: number;
  clinicName: string;
  clinicAddress: string;
  clinicCity: string;
  clinicLat: number;
  clinicLng: number;
  distanceKm?: number;
  about: string;
  consultationFee: number;
  isAvailableToday: boolean;
  nextAvailable: string;
  availableDates: string[];
  timeSlots: string[];
  languages: string[];
  education: string;
  services: string[];
}

export type ConsultationType = 'video' | 'voice' | 'clinic';

export interface Appointment {
  id: string;
  doctorId: string;
  doctorUsername: string;
  doctorRealName?: string;
  doctorSpecialty: string;
  clinicName: string;
  clinicAddress: string;
  date: string;
  time: string;
  type: ConsultationType;
  status: 'upcoming' | 'completed' | 'cancelled';
  fee: number;
  patientNotes?: string;
}

export interface ConsultationComment {
  id: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorRole: UserRole;
  authorRealName?: string;
  isVerifiedDoctor?: boolean;
  authorSpecialty?: string;
  content: string;
  timestamp: string;
  isDoctorRecommendation?: boolean;
}

export interface ConsultationPost {
  id: string;
  authorId: string;
  authorUsername: string;
  authorRole: 'patient';
  title: string;
  specializationId: SpecializationId;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  createdAt: string;
  comments: ConsultationComment[];
  isClosed?: boolean;
}

export interface ModerationResult {
  allowed: boolean;
  penaltyType: 'none' | 'restricted_48h' | 'banned';
  reason: string;
  matchedCategory?: 'abusive_language' | 'off_topic' | 'spam';
}
