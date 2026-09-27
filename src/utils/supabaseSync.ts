import { supabase } from '../supabaseClient';
import { DeliveryOrder, DriverOffer, OrderStatus, UserProfile } from '../types';

const LOCAL_STORAGE_ORDERS_KEY = 'sari3_delivery_orders_v1';
const LOCAL_STORAGE_PROFILE_KEY = 'sari3_current_user_profile_v1';

// No demo orders - pure real-time production orders
export const INITIAL_ORDERS: DeliveryOrder[] = [];

/**
 * Loads orders from Supabase with fallback to local storage
 */
export async function getOrdersFromSupabase(wilayaFilter?: string): Promise<DeliveryOrder[]> {
  try {
    let query = supabase.from('delivery_orders').select('*, offers:order_offers(*)');
    if (wilayaFilter && wilayaFilter !== 'all') {
      query = query.eq('wilaya', wilayaFilter);
    }
    const { data, error } = await query.order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((item: any) => ({
        id: item.id,
        customerId: item.customer_id,
        customerName: item.customer_name,
        customerPhone: item.customer_phone,
        wilaya: item.wilaya,
        pickupAddress: item.pickup_address,
        pickupCoords: { lat: item.pickup_lat, lng: item.pickup_lng },
        dropoffAddress: item.dropoff_address,
        dropoffCoords: { lat: item.dropoff_lat, lng: item.dropoff_lng },
        packagePhotoUrl: item.package_photo_url,
        packageDescription: item.package_description,
        packageCategory: item.package_category,
        distanceKm: item.distance_km,
        suggestedBasePrice: item.suggested_base_price,
        customerOfferPrice: item.customer_offer_price,
        agreedPrice: item.agreed_price,
        status: item.status,
        assignedDriver: item.assigned_driver_id
          ? {
              id: item.assigned_driver_id,
              name: item.assigned_driver_name || 'كابتن سريع',
              phone: item.assigned_driver_phone || '+213 661 00 00 00',
              rating: 4.9,
              vehicle: 'دراجة سريعة',
              plate: '16-Matricule',
              currentCoords: item.driver_lat
                ? { lat: item.driver_lat, lng: item.driver_lng }
                : undefined,
            }
          : undefined,
        offers: (item.offers || []).map((o: any) => ({
          id: o.id,
          orderId: o.order_id,
          driverId: o.driver_id,
          driverName: o.driver_name,
          driverPhone: o.driver_phone,
          driverRating: o.driver_rating || 5,
          driverAvatar: o.driver_avatar,
          vehicleInfo: o.vehicle_info,
          vehiclePlate: o.vehicle_plate,
          offeredPrice: o.offered_price,
          etaMinutes: o.eta_minutes,
          status: o.status,
          createdAt: o.created_at,
        })),
        createdAt: item.created_at,
        acceptedAt: item.accepted_at,
        completedAt: item.completed_at,
      }));
    }
  } catch (err) {
    console.warn('[SupabaseSync] Orders fetch fallback to local storage:', err);
  }

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
 * Saves a new delivery order to Supabase & local cache
 */
export async function saveNewOrderToSupabase(order: DeliveryOrder): Promise<void> {
  // Update local storage first for snappy UI
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    const existing: DeliveryOrder[] = raw ? JSON.parse(raw) : [];
    const updated = [order, ...existing.filter((o) => o.id !== order.id)];
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updated));
  } catch (e) {}

  // Try Supabase insert
  try {
    await supabase.from('delivery_orders').insert({
      id: order.id,
      customer_id: order.customerId,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      wilaya: order.wilaya,
      pickup_address: order.pickupAddress,
      pickup_lat: order.pickupCoords.lat,
      pickup_lng: order.pickupCoords.lng,
      dropoff_address: order.dropoffAddress,
      dropoff_lat: order.dropoffCoords.lat,
      dropoff_lng: order.dropoffCoords.lng,
      package_photo_url: order.packagePhotoUrl,
      package_description: order.packageDescription,
      package_category: order.packageCategory || 'general',
      distance_km: order.distanceKm,
      suggested_base_price: order.suggestedBasePrice,
      customer_offer_price: order.customerOfferPrice,
      status: order.status,
    });
  } catch (err) {
    console.warn('[SupabaseSync] Order cloud insert skipped:', err);
  }
}

/**
 * Submits a driver counter-offer (Negotiation)
 */
export async function submitDriverOffer(offer: DriverOffer): Promise<void> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    const existing: DeliveryOrder[] = raw ? JSON.parse(raw) : [];
    const updated = existing.map((order) => {
      if (order.id === offer.orderId) {
        const otherOffers = (order.offers || []).filter((o) => o.driverId !== offer.driverId);
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

  try {
    await supabase.from('order_offers').insert({
      id: offer.id,
      order_id: offer.orderId,
      driver_id: offer.driverId,
      driver_name: offer.driverName,
      driver_phone: offer.driverPhone,
      driver_rating: offer.driverRating,
      driver_avatar: offer.driverAvatar,
      vehicle_info: offer.vehicleInfo,
      vehicle_plate: offer.vehiclePlate,
      offered_price: offer.offeredPrice,
      eta_minutes: offer.etaMinutes,
      status: 'pending',
    });
    await supabase
      .from('delivery_orders')
      .update({ status: 'negotiating' })
      .eq('id', offer.orderId);
  } catch (err) {
    console.warn('[SupabaseSync] Offer cloud insert skipped:', err);
  }
}

/**
 * Accepts an offer and assigns the driver
 */
export async function acceptDriverOffer(orderId: string, offer: DriverOffer): Promise<void> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    const existing: DeliveryOrder[] = raw ? JSON.parse(raw) : [];
    const updated = existing.map((order) => {
      if (order.id === orderId) {
        return {
          ...order,
          status: 'accepted' as OrderStatus,
          agreedPrice: offer.offeredPrice,
          assignedDriver: {
            id: offer.driverId,
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
    await supabase
      .from('delivery_orders')
      .update({
        status: 'accepted',
        assigned_driver_id: offer.driverId,
        agreed_price: offer.offeredPrice,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    await supabase
      .from('order_offers')
      .update({ status: 'accepted' })
      .eq('id', offer.id);
  } catch (err) {
    console.warn('[SupabaseSync] Accept offer cloud update skipped:', err);
  }
}

/**
 * Updates order status (e.g., delivered or cancelled)
 */
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<void> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    const existing: DeliveryOrder[] = raw ? JSON.parse(raw) : [];
    const updated = existing.map((order) => {
      if (order.id === orderId) {
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
    await supabase
      .from('delivery_orders')
      .update({
        status: newStatus,
        completed_at: newStatus === 'delivered' ? new Date().toISOString() : undefined,
      })
      .eq('id', orderId);
  } catch (err) {
    console.warn('[SupabaseSync] Order status update skipped:', err);
  }
}

/**
 * User Profile Persistence
 */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(profile));
  try {
    await supabase.from('profiles').upsert({
      id: profile.id,
      email: profile.email,
      phone: profile.phone,
      phone_verified: profile.phoneVerified,
      display_name: profile.displayName,
      avatar_url: profile.avatarUrl,
      role: profile.role,
      wilaya: profile.wilaya,
      driver_details: profile.driverDetails,
      camera_permission_granted: profile.cameraPermissionGranted,
      location_permission_granted: profile.locationPermissionGranted,
      account_confirmed: profile.accountConfirmed,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[SupabaseSync] Profile upsert skipped:', err);
  }
}

export function loadCachedUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}
