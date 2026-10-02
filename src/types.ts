export type UserRole = 'customer' | 'driver';

export type Language = 'ar' | 'fr' | 'en' | 'ru';

export type ThemeMode = 'dark' | 'light';

export interface Wilaya {
  id: number;
  code: string;
  nameAr: string;
  nameFr: string;
  lat: number;
  lng: number;
}

export interface DriverDetails {
  facePhotoUrl?: string; // Private live biometric face photo (admin/internal confidential only - strictly private)
  publicAvatarUrl?: string; // Public vector avatar visible to customers
  nickname?: string; // Public custom nickname/display name for customers (e.g. "الكابتن سفيان")
  firstName: string; // Legal full name (verified against License OCR)
  lastName: string;  // Legal family name (verified against License OCR)
  birthDate: string;
  age: number; // Strictly >= 20
  phone: string;
  phoneVerified: boolean;
  email?: string; // Driver bound email for security notices
  licenseFrontUrl?: string; // Private storage
  licenseBackUrl?: string; // Private storage
  licenseNumber: string;
  licenseExpirationDate: string; // YYYY-MM-DD
  licenseExpired?: boolean;
  licenseInGracePeriod?: boolean; // Within 30 days post-expiry
  licenseGracePeriodEndsAt?: string; // ISO date for 1-month enforcement deadline
  licenseRenewalRequired?: boolean; // Forceful block after 1-month grace period
  grayCardFrontUrl?: string; // Vehicle registration Carte Grise (private storage, strictly non-downloadable)
  vehicleRegType: 'permanent' | 'temporary'; // بطاقة رمادية نهائية / مؤقتة
  vehiclePlate: string; // OCR extracted & locked (Read-Only)
  vehicleBrand: string; // OCR extracted & locked (Read-Only)
  vehicleModel: string; // OCR extracted & locked (Read-Only)
  vehicleType: 'motorcycle' | 'car' | 'van';
  verificationStatus: 'verified' | 'pending' | 'rejected';
  isOnline: boolean;
  rating: number;
  totalDeliveries: number;
  currentCoords?: { lat: number; lng: number };
}

export interface UserProfile {
  id: string;
  email?: string;
  phone?: string;
  phoneVerified: boolean;
  displayName: string;
  avatarUrl?: string;
  birthDate?: string;
  role?: UserRole;
  wilaya: string;
  customerProfileCompleted?: boolean;
  driverDetails?: DriverDetails;
  cameraPermissionGranted?: boolean;
  locationPermissionGranted?: boolean;
  accountConfirmed?: boolean;
  createdAt: string;
}

export interface DriverOffer {
  id: string;
  orderId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  driverRating: number;
  driverAvatar?: string;
  vehicleInfo: string;
  vehiclePlate: string;
  offeredPrice: number; // In DZD (Algerian Dinars)
  etaMinutes: number;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export type OrderStatus =
  | 'searching'     // Waiting for offers
  | 'negotiating'   // Has active bids
  | 'accepted'      // Customer accepted a driver
  | 'in_transit'    // Driver picked up package, heading to dropoff
  | 'delivered'     // Successfully delivered
  | 'cancelled';    // Cancelled by user or driver

export interface DeliveryOrder {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  wilaya: string;
  pickupAddress: string;
  pickupCoords: { lat: number; lng: number };
  dropoffAddress: string;
  dropoffCoords: { lat: number; lng: number };
  packagePhotoUrl: string; // Mandatory clear photo
  packageDescription: string;
  packageCategory?: 'documents' | 'food' | 'electronics' | 'clothes' | 'fragile' | 'other';
  distanceKm: number;
  suggestedBasePrice: number; // In DZD
  customerOfferPrice: number; // In DZD
  agreedPrice?: number; // In DZD
  status: OrderStatus;
  assignedDriver?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
    avatarUrl?: string;
    vehicle: string;
    plate: string;
    currentCoords?: { lat: number; lng: number };
  };
  offers: DriverOffer[];
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
}

export interface WalletTransaction {
  id: string;
  type: 'topup_edahabia' | 'topup_baridimob' | 'delivery_earning' | 'commission_fee';
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'rejected';
  receiptUrl?: string;
  description: string;
  txRef?: string;
}

export interface DeliveryEarningRecord {
  id: string;
  orderId: string;
  date: string;
  amount: number;
  netEarning: number;
  commission: number;
  pickup: string;
  dropoff: string;
  distanceKm: number;
  status: 'completed' | 'cancelled';
}

export interface CustomerContactCall {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  driverAvatar?: string;
  driverRating: number;
  vehicle: string;
  plate: string;
  orderTitle: string;
  date: string;
  status: 'completed' | 'in_transit' | 'cancelled';
}

