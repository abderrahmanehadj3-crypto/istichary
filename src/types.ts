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

export interface Doctor {
  id: string;
  name: string;
  title: string;
  specialty: string;
  specializationId: SpecializationId;
  avatar: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  patientsCount: number;
  hospital: string;
  location: string;
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
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar: string;
  hospital: string;
  date: string;
  time: string;
  type: ConsultationType;
  status: 'upcoming' | 'completed' | 'cancelled';
  fee: number;
  patientNotes?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'patient' | 'doctor';
  text: string;
  timestamp: string;
  isPrescription?: boolean;
}

export interface ChatThread {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar: string;
  isOnline: boolean;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  messages: ChatMessage[];
}

export interface PatientProfile {
  name: string;
  greetingName: string;
  age: number;
  bloodType: string;
  height: string;
  weight: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}
