import { supabase, isSupabaseConfigured, uploadSecureDriverVerificationFile } from '../supabaseClient';
import {
  DeliveryOrder,
  DriverDetails,
  DriverOffer,
  OrderStatus,
  UserProfile,
} from '../types';

const LOCAL_STORAGE_ORDERS_KEY = 'sari3_delivery_orders_v2';
const LOCAL_STORAGE_PROFILE_KEY = 'sari3_current_user_profile_v2';

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
 * Ensures any ID string is guaranteed to be a valid UUID
 */
export function ensureUuid(id?: string): string {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  return generateUuid();
}

/**
 * Loads orders live from Supabase PostgreSQL database
 */
export async function getOrdersFromSupabase(wilayaFilter?: string): Promise<DeliveryOrder[]> {
  try {
    let query = supabase
      .from('delivery_orders')
      .select(`
        *,
        driver_offers (*)
      `)
      .order('created_at', { ascending: false });

    if (wilayaFilter && wilayaFilter !== 'all') {
      query = query.eq('wilaya', wilayaFilter);
    }

    const { data, error } = await query;

    if (!error && Array.isArray(data)) {
      const parsedOrders: DeliveryOrder[] = data.map((row: any) => {
        const rawOffers = row.driver_offers || [];
        const offers: DriverOffer[] = rawOffers.map((o: any) => ({
          id: o.id,
          orderId: o.order_id,
          driverId: o.driver_id,
          driverName: o.driver_name,
          driverPhone: o.driver_phone,
          driverRating: Number(o.driver_rating) || 5.0,
          driverAvatar: o.driver_avatar,
          vehicleInfo: o.vehicle_info,
          vehiclePlate: o.vehicle_plate,
          offeredPrice: Number(o.offered_price),
          etaMinutes: Number(o.eta_minutes) || 10,
          status: o.status || 'pending',
          createdAt: o.created_at || new Date().toISOString(),
        }));

        return {
          id: row.id,
          customerId: row.customer_id,
          customerName: row.customer_name,
          customerPhone: row.customer_phone,
          wilaya: row.wilaya,
          pickupAddress: row.pickup_address,
          pickupCoords: {
            lat: Number(row.pickup_lat) || 36.75,
            lng: Number(row.pickup_lng) || 3.05,
          },
          dropoffAddress: row.dropoff_address,
          dropoffCoords: {
            lat: Number(row.dropoff_lat) || 36.75,
            lng: Number(row.dropoff_lng) || 3.05,
          },
          packagePhotoUrl: row.package_photo_url || '',
          packageDescription: row.package_description || '',
          packageCategory: row.package_category || 'documents',
          distanceKm: Number(row.distance_km) || 5,
          suggestedBasePrice: Number(row.suggested_base_price) || 500,
          customerOfferPrice: Number(row.customer_offer_price) || 500,
          agreedPrice: row.agreed_price ? Number(row.agreed_price) : undefined,
          status: (row.status as OrderStatus) || 'searching',
          assignedDriver: row.assigned_driver_id
            ? {
                id: row.assigned_driver_id,
                name: row.assigned_driver_name || 'الكابتن',
                phone: row.assigned_driver_phone || '',
                rating: 5.0,
                vehicle: row.assigned_driver_vehicle || '',
                plate: row.assigned_driver_plate || '',
              }
            : undefined,
          offers,
          createdAt: row.created_at || new Date().toISOString(),
          acceptedAt: row.accepted_at,
          completedAt: row.completed_at,
        };
      });

      // Cache locally for instantaneous offline rendering
      try {
        localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(parsedOrders));
      } catch (e) {}

      return parsedOrders;
    }
  } catch (err) {
    console.warn('[SupabaseSync] Supabase orders fetch notice, reading cache:', err);
  }

  // Also query backend API fallback
  try {
    const res = await fetch(`/api/orders${wilayaFilter && wilayaFilter !== 'all' ? `?wilaya=${wilayaFilter}` : ''}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.orders)) {
        return data.orders;
      }
    }
  } catch (e) {}

  // Local storage fallback
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
 * Saves a new delivery order to Supabase database
 */
export async function saveNewOrderToSupabase(order: DeliveryOrder): Promise<void> {
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

  const payload = {
    id: safeOrderId,
    customer_id: safeCustomerId,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    wilaya: order.wilaya,
    pickup_address: order.pickupAddress,
    pickup_lat: order.pickupCoords?.lat || 36.75,
    pickup_lng: order.pickupCoords?.lng || 3.05,
    dropoff_address: order.dropoffAddress,
    dropoff_lat: order.dropoffCoords?.lat || 36.75,
    dropoff_lng: order.dropoffCoords?.lng || 3.05,
    package_photo_url: order.packagePhotoUrl || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400',
    package_description: order.packageDescription,
    package_category: order.packageCategory || 'documents',
    distance_km: order.distanceKm,
    suggested_base_price: order.suggestedBasePrice,
    customer_offer_price: order.customerOfferPrice,
    status: order.status || 'searching',
    created_at: order.createdAt || new Date().toISOString(),
  };

  // 1. Direct Supabase Insert
  try {
    const { error } = await supabase.from('delivery_orders').upsert(payload);
    if (error) {
      console.warn('[SupabaseSync] Supabase direct order insert notice:', error.message);
    }
  } catch (err) {
    console.warn('[SupabaseSync] Supabase order exception:', err);
  }

  // 2. Server API Sync
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
  } catch (apiErr) {}
}

/**
 * Submits a driver counter-offer (Negotiation) to Supabase
 */
export async function submitDriverOffer(offer: DriverOffer): Promise<void> {
  const safeOfferId = ensureUuid(offer.id);
  const safeOrderId = ensureUuid(offer.orderId);
  const safeDriverId = ensureUuid(offer.driverId);

  offer.id = safeOfferId;
  offer.orderId = safeOrderId;
  offer.driverId = safeDriverId;

  // Local cache update
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

  // Supabase Database Insert
  try {
    await supabase.from('driver_offers').upsert({
      id: safeOfferId,
      order_id: safeOrderId,
      driver_id: safeDriverId,
      driver_name: offer.driverName,
      driver_phone: offer.driverPhone,
      driver_rating: offer.driverRating,
      driver_avatar: offer.driverAvatar || null,
      vehicle_info: offer.vehicleInfo,
      vehicle_plate: offer.vehiclePlate,
      offered_price: offer.offeredPrice,
      eta_minutes: offer.etaMinutes,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    await supabase
      .from('delivery_orders')
      .update({ status: 'negotiating' })
      .eq('id', safeOrderId);
  } catch (err) {
    console.warn('[SupabaseSync] Offer insert notice:', err);
  }
}

/**
 * Accepts an offer and assigns the driver in Supabase
 */
export async function acceptDriverOffer(orderId: string, offer: DriverOffer): Promise<void> {
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
          },
          acceptedAt: new Date().toISOString(),
        };
      }
      return order;
    });
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updated));
  } catch (e) {}

  try {
    await supabase
      .from('delivery_orders')
      .update({
        status: 'accepted',
        assigned_driver_id: safeDriverId,
        agreed_price: offer.offeredPrice,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', safeOrderId);

    await supabase
      .from('driver_offers')
      .update({ status: 'accepted' })
      .eq('id', ensureUuid(offer.id));
  } catch (err) {
    console.warn('[SupabaseSync] Accept offer update notice:', err);
  }
}

/**
 * Updates order status in Supabase
 */
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<void> {
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
    const payload: any = { status: newStatus };
    if (newStatus === 'delivered') {
      payload.completed_at = new Date().toISOString();
    }
    await supabase.from('delivery_orders').update(payload).eq('id', safeOrderId);
  } catch (err) {
    console.warn('[SupabaseSync] Order status update notice:', err);
  }
}

/**
 * User Profile Persistence in Supabase public.profiles table.
 * For customers: NEVER requires or forces profile pictures or file uploads.
 */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  profile.id = ensureUuid(profile.id);
  localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(profile));

  try {
    const profilePayload = {
      id: profile.id,
      email: profile.email || null,
      phone: profile.phone || null,
      phone_verified: !!profile.phoneVerified,
      display_name: profile.displayName || 'مستخدم سريع',
      avatar_url: profile.avatarUrl || null,
      role: profile.role || 'customer',
      wilaya: profile.wilaya || '16',
      camera_permission_granted: !!profile.cameraPermissionGranted,
      location_permission_granted: !!profile.locationPermissionGranted,
      account_confirmed: !!profile.accountConfirmed,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(profilePayload);
    if (error) {
      console.warn('[SupabaseSync] Profile upsert notice:', error.message);
    }
  } catch (err) {
    console.warn('[SupabaseSync] Profile save exception:', err);
  }
}

/**
 * Driver Verification Persistence in Supabase public.driver_verifications table.
 * - Private biometric selfie is stored securely and NEVER made public.
 * - Public avatar is strictly optional.
 */
export async function saveDriverVerification(
  driverId: string,
  details: DriverDetails
): Promise<void> {
  const safeDriverId = ensureUuid(driverId);

  // If face photo is base64, attempt upload to private bucket
  let secureFaceUrl = details.facePhotoUrl || '';
  if (details.facePhotoUrl && details.facePhotoUrl.startsWith('data:')) {
    try {
      secureFaceUrl = await uploadSecureDriverVerificationFile(
        safeDriverId,
        details.facePhotoUrl,
        'biometric_face_selfie.jpg'
      );
    } catch (e) {}
  }

  try {
    const verifPayload = {
      driver_id: safeDriverId,
      first_name: details.firstName,
      last_name: details.lastName,
      nickname: details.nickname || null,
      birth_date: details.birthDate,
      age: details.age,
      face_photo_url: secureFaceUrl, // Private biometric face capture
      public_avatar_url: details.publicAvatarUrl || null, // Default vector illustration
      license_number: details.licenseNumber,
      license_expiration_date: details.licenseExpirationDate,
      license_expired: !!details.licenseExpired,
      license_in_grace_period: !!details.licenseInGracePeriod,
      license_grace_period_ends_at: details.licenseGracePeriodEndsAt || null,
      license_renewal_required: !!details.licenseRenewalRequired,
      gray_card_front_url: details.grayCardFrontUrl || '', // Confidential Gray Card
      license_front_url: details.licenseFrontUrl || '',
      license_back_url: details.licenseBackUrl || '',
      vehicle_type: details.vehicleType,
      vehicle_reg_type: details.vehicleRegType,
      vehicle_plate: details.vehiclePlate,
      vehicle_brand: details.vehicleBrand,
      vehicle_model: details.vehicleModel,
      verification_status: details.verificationStatus || 'verified',
      is_online: !!details.isOnline,
      rating: details.rating || 5.0,
      total_deliveries: details.totalDeliveries || 0,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('driver_verifications').upsert(verifPayload);
    if (error) {
      console.warn('[SupabaseSync] Driver verification upsert notice:', error.message);
    }

    // Update public profile with driver role, custom public nickname, and vector avatar
    const publicDisplayName = details.nickname?.trim() || `${details.firstName} ${details.lastName}`.trim();
    await supabase.from('profiles').upsert({
      id: safeDriverId,
      role: 'driver',
      display_name: publicDisplayName,
      avatar_url: details.publicAvatarUrl || null,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[SupabaseSync] Driver verification save notice:', err);
  }
}

export function loadCachedUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

// Backwards-compatible aliases
export const getOrdersFromFirestore = getOrdersFromSupabase;
export const saveNewOrderToFirestore = saveNewOrderToSupabase;
export const submitDriverOfferToFirestore = submitDriverOffer;
export const acceptDriverOfferInFirestore = acceptDriverOffer;
export const updateOrderStatusInFirestore = updateOrderStatus;
export const saveUserProfileToFirestore = saveUserProfile;
export const saveDriverVerificationToFirestore = saveDriverVerification;
