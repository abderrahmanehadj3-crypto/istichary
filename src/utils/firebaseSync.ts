import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebaseClient';
import {
  DeliveryOrder,
  DriverDetails,
  DriverOffer,
  OrderStatus,
  UserProfile,
} from '../types';

const LOCAL_STORAGE_ORDERS_KEY = 'sari3_delivery_orders_v1';
const LOCAL_STORAGE_PROFILE_KEY = 'sari3_current_user_profile_v1';

// No demo orders - pure real-time production orders
export const INITIAL_ORDERS: DeliveryOrder[] = [];

/**
 * Standard RFC4122 v4 UUID Generator
 */
export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Ensures any ID string is guaranteed to be a valid UUID or identifier
 */
export function ensureUuid(id?: string): string {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  if (id && id.length >= 8) {
    return id;
  }
  return generateUuid();
}

/**
 * Loads orders live from Cloud Firestore database
 */
export async function getOrdersFromFirestore(wilayaFilter?: string): Promise<DeliveryOrder[]> {
  try {
    const ordersCol = collection(db, 'delivery_orders');
    let q = query(ordersCol, orderBy('createdAt', 'desc'));

    if (wilayaFilter && wilayaFilter !== 'all') {
      q = query(ordersCol, where('wilaya', '==', wilayaFilter), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    const parsedOrders: DeliveryOrder[] = [];

    for (const orderDoc of snapshot.docs) {
      const data = orderDoc.data();

      // Read offers subcollection if present, or fallback to embedded offers
      let offers: DriverOffer[] = [];
      try {
        const offersSnap = await getDocs(collection(db, 'delivery_orders', orderDoc.id, 'offers'));
        offers = offersSnap.docs.map((d) => d.data() as DriverOffer);
      } catch (e) {
        offers = (data.offers as DriverOffer[]) || [];
      }

      parsedOrders.push({
        id: data.id || orderDoc.id,
        customerId: data.customerId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        wilaya: data.wilaya,
        pickupAddress: data.pickupAddress,
        pickupCoords: data.pickupCoords || { lat: 36.75, lng: 3.05 },
        dropoffAddress: data.dropoffAddress,
        dropoffCoords: data.dropoffCoords || { lat: 36.75, lng: 3.05 },
        packagePhotoUrl: data.packagePhotoUrl,
        packageDescription: data.packageDescription,
        packageCategory: data.packageCategory || 'documents',
        distanceKm: data.distanceKm || 5,
        suggestedBasePrice: data.suggestedBasePrice || 500,
        customerOfferPrice: data.customerOfferPrice || 500,
        agreedPrice: data.agreedPrice,
        status: (data.status as OrderStatus) || 'searching',
        assignedDriver: data.assignedDriver,
        offers,
        createdAt: data.createdAt || new Date().toISOString(),
        acceptedAt: data.acceptedAt,
        completedAt: data.completedAt,
      });
    }

    // Cache locally for instantaneous offline rendering
    try {
      localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(parsedOrders));
    } catch (e) {}

    return parsedOrders;
  } catch (err) {
    console.warn('[FirebaseSync] Firestore orders fetch notice, checking local cache:', err);
  }

  // Local storage fallback if offline
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    if (raw) {
      const parsed: DeliveryOrder[] = JSON.parse(raw);
      if (wilayaFilter && wilayaFilter !== 'all') {
        return parsed.filter((o) => o.wilaya === wilayaFilter);
      }
      return parsed;
    }
  } catch (e) {}

  return [];
}

/**
 * Saves a new delivery order directly to Cloud Firestore database
 */
export async function saveNewOrderToFirestore(order: DeliveryOrder): Promise<void> {
  const safeOrderId = ensureUuid(order.id);
  const safeCustomerId = ensureUuid(order.customerId);

  order.id = safeOrderId;
  order.customerId = safeCustomerId;

  // Optimistic local update
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    const existing: DeliveryOrder[] = raw ? JSON.parse(raw) : [];
    const updated = [order, ...existing.filter((o) => o.id !== safeOrderId)];
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updated));
  } catch (e) {}

  // 1. Direct Firestore Insert
  try {
    const orderRef = doc(db, 'delivery_orders', safeOrderId);
    await setDoc(orderRef, {
      id: safeOrderId,
      customerId: safeCustomerId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      wilaya: order.wilaya,
      pickupAddress: order.pickupAddress,
      pickupCoords: order.pickupCoords,
      dropoffAddress: order.dropoffAddress,
      dropoffCoords: order.dropoffCoords,
      packagePhotoUrl: order.packagePhotoUrl,
      packageDescription: order.packageDescription,
      packageCategory: order.packageCategory || 'documents',
      distanceKm: order.distanceKm,
      suggestedBasePrice: order.suggestedBasePrice,
      customerOfferPrice: order.customerOfferPrice,
      status: order.status || 'searching',
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[FirebaseSync] Direct Firestore order save notice:', err);
    // Fallback via server API
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    }).catch(() => {});
  }
}

/**
 * Submits a driver counter-offer (Negotiation) live to Firestore
 */
export async function submitDriverOfferToFirestore(offer: DriverOffer): Promise<void> {
  const safeOfferId = ensureUuid(offer.id);
  const safeOrderId = ensureUuid(offer.orderId);
  const safeDriverId = ensureUuid(offer.driverId);

  offer.id = safeOfferId;
  offer.orderId = safeOrderId;
  offer.driverId = safeDriverId;

  // Update local cache optimistically
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    const existing: DeliveryOrder[] = raw ? JSON.parse(raw) : [];
    const updated = existing.map((order) => {
      if (order.id === safeOrderId) {
        const otherOffers = (order.offers || []).filter((o) => o.driverId !== safeDriverId);
        return {
          ...order,
          status: 'negotiating' as OrderStatus,
          offers: [offer, ...otherOffers],
        };
      }
      return order;
    });
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updated));
  } catch (e) {}

  // Write to Firestore subcollection and update order status
  try {
    const offerRef = doc(db, 'delivery_orders', safeOrderId, 'offers', safeOfferId);
    await setDoc(offerRef, {
      ...offer,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    const orderRef = doc(db, 'delivery_orders', safeOrderId);
    await updateDoc(orderRef, {
      status: 'negotiating',
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[FirebaseSync] Offer Firestore insert notice:', err);
  }
}

/**
 * Accepts an offer and assigns the driver live in Firestore
 */
export async function acceptDriverOfferInFirestore(orderId: string, offer: DriverOffer): Promise<void> {
  const safeOrderId = ensureUuid(orderId);
  const safeDriverId = ensureUuid(offer.driverId);

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    const existing: DeliveryOrder[] = raw ? JSON.parse(raw) : [];
    const updated = existing.map((order) => {
      if (order.id === safeOrderId) {
        return {
          ...order,
          status: 'accepted' as OrderStatus,
          agreedPrice: offer.offeredPrice,
          assignedDriver: {
            id: safeDriverId,
            name: offer.driverName,
            phone: offer.driverPhone,
            rating: offer.driverRating,
            avatarUrl: offer.driverAvatar,
            vehicle: offer.vehicleInfo,
            plate: offer.vehiclePlate,
            currentCoords: {
              lat: order.pickupCoords.lat + 0.005,
              lng: order.pickupCoords.lng + 0.005,
            },
          },
          acceptedAt: new Date().toISOString(),
        };
      }
      return order;
    });
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updated));
  } catch (e) {}

  try {
    const orderRef = doc(db, 'delivery_orders', safeOrderId);
    await updateDoc(orderRef, {
      status: 'accepted',
      assignedDriverId: safeDriverId,
      agreedPrice: offer.offeredPrice,
      assignedDriver: {
        id: safeDriverId,
        name: offer.driverName,
        phone: offer.driverPhone,
        rating: offer.driverRating,
        avatarUrl: offer.driverAvatar,
        vehicle: offer.vehicleInfo,
        plate: offer.vehiclePlate,
      },
      acceptedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const offerRef = doc(db, 'delivery_orders', safeOrderId, 'offers', ensureUuid(offer.id));
    await updateDoc(offerRef, {
      status: 'accepted',
    });
  } catch (err) {
    console.warn('[FirebaseSync] Accept offer Firestore update notice:', err);
  }
}

/**
 * Updates order status (e.g., delivered or cancelled) live in Firestore
 */
export async function updateOrderStatusInFirestore(orderId: string, newStatus: OrderStatus): Promise<void> {
  const safeOrderId = ensureUuid(orderId);

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    const existing: DeliveryOrder[] = raw ? JSON.parse(raw) : [];
    const updated = existing.map((order) => {
      if (order.id === safeOrderId) {
        return {
          ...order,
          status: newStatus,
          completedAt: newStatus === 'delivered' ? new Date().toISOString() : order.completedAt,
        };
      }
      return order;
    });
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updated));
  } catch (e) {}

  try {
    const orderRef = doc(db, 'delivery_orders', safeOrderId);
    const updatePayload: any = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    if (newStatus === 'delivered') {
      updatePayload.completedAt = new Date().toISOString();
    }
    await updateDoc(orderRef, updatePayload);
  } catch (err) {
    console.warn('[FirebaseSync] Order status Firestore update notice:', err);
  }
}

/**
 * User Profile Persistence live to Cloud Firestore profiles collection
 * STRICT SECURITY: Private face photo is NEVER saved here!
 */
export async function saveUserProfileToFirestore(profile: UserProfile): Promise<void> {
  profile.id = ensureUuid(profile.id);
  localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(profile));

  try {
    const profileRef = doc(db, 'profiles', profile.id);
    await setDoc(
      profileRef,
      {
        id: profile.id,
        email: profile.email || null,
        phone: profile.phone || null,
        phoneVerified: !!profile.phoneVerified,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl || null, // ONLY public avatar, never verification selfie
        role: profile.role || 'customer',
        wilaya: profile.wilaya || '16',
        cameraPermissionGranted: !!profile.cameraPermissionGranted,
        locationPermissionGranted: !!profile.locationPermissionGranted,
        accountConfirmed: !!profile.accountConfirmed,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[FirebaseSync] Profile Firestore save notice:', err);
  }
}

/**
 * Saves driver verification records to private /driver_verifications collection in Firestore.
 * STRICT SECURITY SEPARATION:
 * - facePhotoUrl (صورة الوجه الحية) is stored ONLY in this private collection.
 * - publicAvatarUrl is the separate, distinct public photo shown to customers.
 */
export async function saveDriverVerificationToFirestore(
  driverId: string,
  details: DriverDetails
): Promise<void> {
  const safeDriverId = ensureUuid(driverId);
  try {
    const verifRef = doc(db, 'driver_verifications', safeDriverId);
    await setDoc(
      verifRef,
      {
        driverId: safeDriverId,
        firstName: details.firstName,
        lastName: details.lastName,
        birthDate: details.birthDate,
        age: details.age,
        // STRICT PRIVACY: Biometric face capture is preserved ONLY in this private document
        facePhotoUrl: details.facePhotoUrl,
        // Public avatar is stored separately
        publicAvatarUrl: details.publicAvatarUrl || '',
        licenseNumber: details.licenseNumber,
        licenseExpirationDate: details.licenseExpirationDate,
        licenseFrontUrl: details.licenseFrontUrl,
        licenseBackUrl: details.licenseBackUrl,
        vehicleType: details.vehicleType,
        vehicleRegType: details.vehicleRegType,
        vehiclePlate: details.vehiclePlate,
        vehicleBrand: details.vehicleBrand,
        vehicleModel: details.vehicleModel,
        verificationStatus: details.verificationStatus || 'verified',
        isOnline: !!details.isOnline,
        rating: details.rating || 5.0,
        totalDeliveries: details.totalDeliveries || 0,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Update public profile with ONLY the public avatar and driver role
    const profileRef = doc(db, 'profiles', safeDriverId);
    await setDoc(
      profileRef,
      {
        role: 'driver',
        displayName: `${details.firstName} ${details.lastName}`.trim(),
        avatarUrl: details.publicAvatarUrl || null, // NEVER the facePhotoUrl!
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[FirebaseSync] Driver verification save notice:', err);
  }
}

export function loadCachedUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

// Backwards-compatible aliases for seamless transition
export const getOrdersFromSupabase = getOrdersFromFirestore;
export const saveNewOrderToSupabase = saveNewOrderToFirestore;
export const submitDriverOffer = submitDriverOfferToFirestore;
export const acceptDriverOffer = acceptDriverOfferInFirestore;
export const updateOrderStatus = updateOrderStatusInFirestore;
export const saveUserProfile = saveUserProfileToFirestore;
