import { supabase } from '../supabaseClient';
import { DeliveryOrder, DriverOffer, OrderStatus, UserProfile } from '../types';

const LOCAL_STORAGE_ORDERS_KEY = 'sari3_delivery_orders_v1';
const LOCAL_STORAGE_PROFILE_KEY = 'sari3_current_user_profile_v1';

// Seed demo initial orders across Algeria (Algiers, Oran, Constantine) for instant testing
export const INITIAL_DEMO_ORDERS: DeliveryOrder[] = [
  {
    id: 'ord-alger-101',
    customerId: 'cust-demo-1',
    customerName: 'أمين بلحاج',
    customerPhone: '+213 555 12 34 56',
    wilaya: '16', // Alger
    pickupAddress: 'ديدوش مراد، وسط الجزائر العاصمة',
    pickupCoords: { lat: 36.7538, lng: 3.0588 },
    dropoffAddress: 'باب الزوار، قرب المركز التجاري',
    dropoffCoords: { lat: 36.7167, lng: 3.1833 },
    packagePhotoUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80',
    packageDescription: 'علبة هدايا ومستندات رسمية مغلفة بعناية، وزن خفيف أقل من 1 كغ.',
    packageCategory: 'documents',
    distanceKm: 8.5,
    suggestedBasePrice: 650,
    customerOfferPrice: 600,
    status: 'searching',
    offers: [
      {
        id: 'off-1',
        orderId: 'ord-alger-101',
        driverId: 'drv-demo-1',
        driverName: 'كريم الدراجي',
        driverPhone: '+213 661 88 99 00',
        driverRating: 4.9,
        driverAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        vehicleInfo: 'دراجة نارية Sym Orbit II',
        vehiclePlate: '16-12345-121',
        offeredPrice: 700,
        etaMinutes: 12,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'ord-oran-102',
    customerId: 'cust-demo-2',
    customerName: 'فاطمة الزهراء',
    customerPhone: '+213 770 44 55 66',
    wilaya: '31', // Oran
    pickupAddress: 'حي مرافال، وهران',
    pickupCoords: { lat: 35.6971, lng: -0.6308 },
    dropoffAddress: 'ميدان أول نوفمبر (ساحة السلاح)، وهران',
    dropoffCoords: { lat: 35.7022, lng: -0.6433 },
    packagePhotoUrl: 'https://images.unsplash.com/photo-1585336261026-63d76b1e6a6b?w=800&auto=format&fit=crop&q=80',
    packageDescription: 'قطع غيار إلكترونية صغيرة في علبة محكمة الإغلاق.',
    packageCategory: 'electronics',
    distanceKm: 3.2,
    suggestedBasePrice: 350,
    customerOfferPrice: 400,
    status: 'searching',
    offers: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
];

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

  // Initialize with demos
  localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(INITIAL_DEMO_ORDERS));
  if (wilayaFilter && wilayaFilter !== 'all') {
    return INITIAL_DEMO_ORDERS.filter((o) => o.wilaya === wilayaFilter);
  }
  return INITIAL_DEMO_ORDERS;
}

/**
 * Saves a new delivery order to Supabase & local cache
 */
export async function saveNewOrderToSupabase(order: DeliveryOrder): Promise<void> {
  // Update local storage first for snappy UI
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    const existing: DeliveryOrder[] = raw ? JSON.parse(raw) : INITIAL_DEMO_ORDERS;
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
    const existing: DeliveryOrder[] = raw ? JSON.parse(raw) : INITIAL_DEMO_ORDERS;
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
    const existing: DeliveryOrder[] = raw ? JSON.parse(raw) : INITIAL_DEMO_ORDERS;
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
    const existing: DeliveryOrder[] = raw ? JSON.parse(raw) : INITIAL_DEMO_ORDERS;
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
