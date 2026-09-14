import {
  DoctorProfile,
  Specialization,
  ConsultationPost,
  UserAccount,
  VerificationDocument,
  AppNotification,
} from '../types';

export const SPECIALIZATIONS: Specialization[] = [
  {
    id: 'all',
    name: 'All Specialties',
    iconName: 'LayoutGrid',
    doctorCount: 38,
    description: 'All medical fields & clinical inquiries',
  },
  {
    id: 'cardiology',
    name: 'Cardiology',
    iconName: 'HeartPulse',
    doctorCount: 8,
    description: 'Heart and cardiovascular clinical guidance',
  },
  {
    id: 'dermatology',
    name: 'Dermatology',
    iconName: 'Sparkles',
    doctorCount: 7,
    description: 'Skin, hair, allergy and dermatological lesions',
  },
  {
    id: 'pediatrics',
    name: 'Pediatrics',
    iconName: 'Baby',
    doctorCount: 9,
    description: 'Infant, child, and adolescent medicine',
  },
  {
    id: 'neurology',
    name: 'Neurology',
    iconName: 'Brain',
    doctorCount: 5,
    description: 'Brain, nerves, migraine, and cognitive health',
  },
  {
    id: 'general',
    name: 'General Medicine',
    iconName: 'Stethoscope',
    doctorCount: 12,
    description: 'Primary triage, systemic symptoms & internal medicine',
  },
  {
    id: 'orthopedics',
    name: 'Orthopedics',
    iconName: 'Bone',
    doctorCount: 5,
    description: 'Bones, joints, sports injuries, and spine health',
  },
  {
    id: 'psychiatry',
    name: 'Psychiatry',
    iconName: 'Activity',
    doctorCount: 6,
    description: 'Mental health, anxiety, and behavioral therapy',
  },
  {
    id: 'laboratory',
    name: 'Laboratory',
    iconName: 'FlaskConical',
    doctorCount: 4,
    description: 'Medical laboratory tests, blood analysis, pathology, and diagnostics',
  },
];

export const MOCK_DOCTORS: DoctorProfile[] = [];

export const DOCTOR_PROFILES = MOCK_DOCTORS;

export const INITIAL_CONSULTATION_POSTS: ConsultationPost[] = [];

export const MOCK_CONSULTATIONS = INITIAL_CONSULTATION_POSTS;
export const MOCK_POSTS = INITIAL_CONSULTATION_POSTS;

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export const MOCK_USERS: UserAccount[] = [];
