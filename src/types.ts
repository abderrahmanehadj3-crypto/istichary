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
  facePhotoUrl?: string; // Private live biometric face photo (admin only)
  publicAvatarUrl?: string; // Public avatar visible to customers
  firstName: string;
  lastName: string;
  birthDate: string;
  age: number; // Strictly >= 20
  phone: string;
  phoneVerified: boolean;
  licenseFrontUrl?: string;
  licenseBackUrl?: string;
  licenseNumber: string;
  licenseExpirationDate: string;
  vehicleRegType: 'permanent' | 'temporary'; // بطاقة رمادية نهائية / مؤقتة
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
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
  role?: UserRole;
  wilaya: string;
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
