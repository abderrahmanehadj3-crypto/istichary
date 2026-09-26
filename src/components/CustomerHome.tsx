import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppTranslations } from '../i18n/translations';
import { DeliveryOrder, DriverOffer, Language, ThemeMode, UserProfile, Wilaya } from '../types';
import { ALGERIA_WILAYAS, calculateDistanceKm, calculateSuggestedFare, getWilayaByCode } from '../data/wilayas';
import { Sari3Map } from './Sari3Map';
import { useNativeGps } from '../hooks/useNativeGps';
import { MandatoryGpsModal } from './MandatoryGpsModal';
import { reverseGeocode } from '../utils/reverseGeocoding';
import { OsrmRouteResult } from '../utils/osrmRouting';
import { NativeCameraModal } from './NativeCameraModal';
import { launchNativeDeviceCamera } from '../utils/nativeCameraBridge';
import {
  MapPin,
  Camera,
  Upload,
  ArrowRight,
  Package,
  DollarSign,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Phone,
  XCircle,
  Eye,
  RefreshCw,
  Navigation,
  Crosshair,
} from 'lucide-react';

interface CustomerHomeProps {
  currentUser: UserProfile;
  orders: DeliveryOrder[];
  t: AppTranslations;
  lang: Language;
  theme: ThemeMode;
  onPublishOrder: (order: DeliveryOrder) => void;
  onAcceptOffer: (orderId: string, offer: DriverOffer) => void;
  onCounterOffer: (orderId: string, driverOffer: DriverOffer, counterPrice: number) => void;
  onCancelOrder: (orderId: string) => void;
  onOpenPackageInspection: (photoUrl: string, description: string) => void;
  selectedWilaya: string;
  onWilayaChange: (code: string) => void;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  currentUser,
  orders,
  t,
  lang,
  theme,
  onPublishOrder,
  onAcceptOffer,
  onCounterOffer,
  onCancelOrder,
  onOpenPackageInspection,
  selectedWilaya,
  onWilayaChange,
}) => {
  const currentWilayaObj = getWilayaByCode(selectedWilaya);

  // Form states
  const [pickupAddress, setPickupAddress] = useState('الجزائر الوسطى، شارع ديدوش مراد');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number }>({
    lat: currentWilayaObj.lat,
    lng: currentWilayaObj.lng,
  });

  const [dropoffAddress, setDropoffAddress] = useState('باب الزوار، الجزائر');
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number }>({
    lat: currentWilayaObj.lat + 0.04,
    lng: currentWilayaObj.lng + 0.05,
  });

  // Package mandatory photo & details
  const [packagePhoto, setPackagePhoto] = useState<string>(
    'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80'
  );
  const [isPackageCameraOpen, setIsPackageCameraOpen] = useState<boolean>(false);
  const [packageDescription, setPackageDescription] = useState(
    'طرد متوسط الحجم، أوراق ومستندات رسمية هامة مغلفة بإحكام'
  );
  const [packageCategory, setPackageCategory] = useState<
    'documents' | 'food' | 'electronics' | 'clothes' | 'fragile' | 'other'
  >('documents');

  // Interactive Pin Drop mode
  const [interactiveMode, setInteractiveMode] = useState<'pickup' | 'dropoff' | null>(null);

  // Real Native GPS Hook & Mandatory GPS Modal state
  const {
    coords: liveGpsCoords,
    status: gpsStatus,
    errorMessage: gpsErrorMessage,
    requestGps,
    bypassGps,
  } = useNativeGps(false);
  const [showGpsModal, setShowGpsModal] = useState<boolean>(false);

  // Dedicated state for map flyTo animation & location detection feedback
  const [mapFlyTo, setMapFlyTo] = useState<{
    lat: number;
    lng: number;
    zoom?: number;
    id: number;
  } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationFeedback, setLocationFeedback] = useState<{
    type: 'success' | 'info';
    message: string;
  } | null>(null);

  const hasAutoTriggeredRef = useRef<boolean>(false);
  const locatingTimeoutRef = useRef<any>(null);

  // Helper to unconditionally dismiss loading spinner
  const cancelLocating = useCallback(() => {
    if (locatingTimeoutRef.current) {
      clearTimeout(locatingTimeoutRef.current);
      locatingTimeoutRef.current = null;
    }
    setIsLocating(false);
  }, []);

  // Fare calculations
  const [distanceKm, setDistanceKm] = useState<number>(6.5);
  const [suggestedFare, setSuggestedFare] = useState<number>(550);
  const [customerOffer, setCustomerOffer] = useState<number>(500);

  // Counter offer state
  const [activeCounterOfferId, setActiveCounterOfferId] = useState<string | null>(null);
  const [counterPriceInput, setCounterPriceInput] = useState<number>(500);

  // Update distance & fare when coords change
  useEffect(() => {
    const dist = calculateDistanceKm(
      pickupCoords.lat,
      pickupCoords.lng,
      dropoffCoords.lat,
      dropoffCoords.lng
    );
    setDistanceKm(dist);
    const fare = calculateSuggestedFare(dist);
    setSuggestedFare(fare);
    if (!customerOffer || customerOffer === 500) {
      setCustomerOffer(fare);
    }
  }, [pickupCoords, dropoffCoords]);

  // Handle Real Road Route calculated via OSRM engine
  const handleRouteCalculated = useCallback((route: OsrmRouteResult) => {
    if (route && route.distanceKm > 0) {
      setDistanceKm(route.distanceKm);
      const fare = calculateSuggestedFare(route.distanceKm);
      setSuggestedFare(fare);
      setCustomerOffer((prev) => {
        if (!prev || prev === 500) {
          return fare;
        }
        return prev;
      });
    }
  }, []);

  // Smooth Permission-Triggered Geolocation Flow with STRICT 4s TIMEOUT
  const detectUserLocation = useCallback(
    async (isInitialAutoTrigger = false) => {
      // Clear any prior timer
      if (locatingTimeoutRef.current) {
        clearTimeout(locatingTimeoutRef.current);
      }

      setIsLocating(true);
      if (!isInitialAutoTrigger) {
        setLocationFeedback(null);
      }

      // Strict 4-second safety timer: Unconditionally release UI loading after 4s
      locatingTimeoutRef.current = setTimeout(() => {
        console.warn('[CustomerHome] Strict 4s safety timeout reached, unlocking UI');
        setIsLocating(false);
      }, 4000);

      try {
        // Race GPS against strict 4s promise
        const deadlinePromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 4000)
        );
        const target = await Promise.race([requestGps(true), deadlinePromise]);

        if (target && target.lat && target.lng) {
          setPickupCoords(target);
          setMapFlyTo({
            lat: target.lat,
            lng: target.lng,
            zoom: 16,
            id: Date.now(),
          });

          // Quick reverse geocode with 2s timeout
          try {
            const geoTimeout = new Promise<string>((resolve) =>
              setTimeout(() => resolve(''), 2000)
            );
            const addr = await Promise.race([
              reverseGeocode(target.lat, target.lng, lang),
              geoTimeout,
            ]);
            if (addr) {
              setPickupAddress(addr);
            }
          } catch (geoErr) {
            console.warn('Reverse geocode note:', geoErr);
          }

          setLocationFeedback({
            type: 'success',
            message:
              lang === 'ar'
                ? 'تم تحديد موقعك بدقة عبر GPS بنجاح 📍'
                : 'Your location was accurately detected via GPS 📍',
          });
          setTimeout(() => setLocationFeedback(null), 4000);
        } else {
          if (!isInitialAutoTrigger) {
            setLocationFeedback({
              type: 'info',
              message:
                lang === 'ar'
                  ? 'تعذر تحديد الموقع تلقائياً - يمكنك النقر مباشرة على الخريطة لتحديد مكانك'
                  : 'GPS detection unavailable - tap directly on the map to set location',
            });
            setTimeout(() => setLocationFeedback(null), 4000);
          }
        }
      } catch (err) {
        console.warn('GPS detection flow note:', err);
      } finally {
        cancelLocating();
      }
    },
    [requestGps, lang, cancelLocating]
  );

  // Trigger 1: Auto-detection on initial page load (ONLY ONCE ON MOUNT)
  useEffect(() => {
    if (hasAutoTriggeredRef.current) return;
    hasAutoTriggeredRef.current = true;

    const timer = setTimeout(() => {
      detectUserLocation(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [detectUserLocation]);

  // Handle GPS location click (Real Native GPS with safe fallback)
  const handleUseCurrentGps = () => {
    detectUserLocation(false);
  };

  // Handle Direct Map-Tap Pinning with automated reverse geocoding
  const handlePinDropped = (
    coords: { lat: number; lng: number },
    address: string,
    mode: 'pickup' | 'dropoff'
  ) => {
    cancelLocating();
    if (mode === 'pickup') {
      setPickupCoords(coords);
      setPickupAddress(address);
      setInteractiveMode(null);
    } else if (mode === 'dropoff') {
      setDropoffCoords(coords);
      setDropoffAddress(address);
      setInteractiveMode(null);
    }
  };

  // Handle Map Click for instant coordinate update
  const handleMapClick = (coords: { lat: number; lng: number }) => {
    cancelLocating();
    if (interactiveMode === 'dropoff') {
      setDropoffCoords(coords);
    } else {
      setPickupCoords(coords);
    }
  };

  // Publish New Order with coordinates verification
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!packagePhoto) {
      alert(t.packagePhotoMandatory);
      return;
    }

    // Verify valid coordinates exist
    if (!pickupCoords || !dropoffCoords) {
      alert(lang === 'ar' ? 'يرجى تحديد موقع الاستلام والتسليم على الخريطة' : 'Please select pickup and dropoff locations on the map');
      return;
    }

    const newOrder: DeliveryOrder = {
      id: `ord-${Date.now()}`,
      customerId: currentUser.id,
      customerName: currentUser.displayName,
      customerPhone: currentUser.phone || '+213 555 00 00 00',
      wilaya: selectedWilaya,
      pickupAddress,
      pickupCoords,
      dropoffAddress,
      dropoffCoords,
      packagePhotoUrl: packagePhoto,
      packageDescription,
      packageCategory,
      distanceKm,
      suggestedBasePrice: suggestedFare,
      customerOfferPrice: customerOffer,
      status: 'searching',
      offers: [],
      createdAt: new Date().toISOString(),
    };

    onPublishOrder(newOrder);
  };

  // Filter current user's active orders
  const myActiveOrders = orders.filter(
    (o) =>
      o.customerId === currentUser.id &&
      (o.status === 'searching' || o.status === 'negotiating' || o.status === 'accepted' || o.status === 'in_transit')
  );

  return (
    <div className="space-y-5">
      {/* Wilaya Selection & Top Bar */}
      <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-emerald-400" />
          <span className="text-xs font-bold text-slate-300">{t.selectWilaya}:</span>
        </div>
        <select
          id="select-wilaya-customer"
          value={selectedWilaya}
          onChange={(e) => onWilayaChange(e.target.value)}
          className="bg-slate-950 border border-slate-700 text-emerald-400 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          {ALGERIA_WILAYAS.map((w) => (
            <option key={w.code} value={w.code}>
              {w.code} - {lang === 'ar' ? w.nameAr : w.nameFr}
            </option>
          ))}
        </select>
      </div>

      {/* Active Orders with Negotiation Bids */}
      {myActiveOrders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>{t.activeOrders} ({myActiveOrders.length})</span>
            </h3>
          </div>

          {myActiveOrders.map((order) => (
            <div
              key={order.id}
              className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 relative overflow-hidden"
            >
              {/* Order Status Badge */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-black">
                  {order.status === 'searching'
                    ? t.searchingDrivers
                    : order.status === 'negotiating'
                    ? t.incomingOffers
                    : t.deliveryAssigned}
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {order.customerOfferPrice} {t.dzd}
                  </span>
                  <button
                    onClick={() => onCancelOrder(order.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                    title={t.btnCancel}
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              </div>

              {/* Locations summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-start gap-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  <span className="truncate"><strong>{t.pickupLocation}:</strong> {order.pickupAddress}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                  <span className="truncate"><strong>{t.dropoffLocation}:</strong> {order.dropoffAddress}</span>
                </div>
              </div>

              {/* Package inspection pill */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Package size={16} className="text-emerald-400" />
                  <span className="truncate max-w-[200px]">{order.packageDescription}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenPackageInspection(order.packagePhotoUrl, order.packageDescription)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Eye size={13} />
                  <span>معاينة الصورة</span>
                </button>
              </div>

              {/* Negotiation: Incoming Driver Offers List */}
              {order.offers && order.offers.length > 0 ? (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>{t.incomingOffers}</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 text-[10px]">
                      {order.offers.length}
                    </span>
                  </h4>

                  {order.offers.map((offer) => (
                    <div
                      key={offer.id}
                      className="p-3 rounded-2xl bg-slate-950 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={offer.driverAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
                          alt={offer.driverName}
                          className="w-11 h-11 rounded-full object-cover border-2 border-purple-500/50"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white">{offer.driverName}</span>
                            <span className="text-[10px] text-amber-400 font-bold">★ {offer.driverRating}</span>
                          </div>
                          <p className="text-[11px] text-slate-400">{offer.vehicleInfo}</p>
                          <p className="text-[10px] text-purple-400 font-semibold mt-0.5">
                            الوصول خلال: {offer.etaMinutes} {t.min}
                          </p>
                        </div>
                      </div>

                      {/* Offer Price & Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <div className="text-right">
                          <span className="text-base font-black text-emerald-400 font-mono">
                            {offer.offeredPrice} {t.dzd}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onAcceptOffer(order.id, offer)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer"
                        >
                          {t.acceptOffer}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveCounterOfferId(
                              activeCounterOfferId === offer.id ? null : offer.id
                            );
                            setCounterPriceInput(offer.offeredPrice - 50);
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-xs transition cursor-pointer"
                        >
                          {t.counterOffer}
                        </button>
                      </div>

                      {/* Inlined Counter-Offer negotiation slider/input */}
                      {activeCounterOfferId === offer.id && (
                        <div className="w-full mt-2 p-2.5 rounded-xl bg-slate-900 border border-purple-500/40 flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-300">{t.yourCounterPrice}</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="50"
                              value={counterPriceInput}
                              onChange={(e) => setCounterPriceInput(Number(e.target.value))}
                              className="w-24 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold text-sm text-center"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                onCounterOffer(order.id, offer, counterPriceInput);
                                setActiveCounterOfferId(null);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer"
                            >
                              إرسال
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-slate-500 italic">
                  {t.noOffersYet}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Main Order Creation Form */}
      <form onSubmit={handleCreateOrder} className="space-y-4">
        {/* Interactive Map Preview */}
        <div className="rounded-3xl overflow-hidden border border-slate-800 shadow-xl bg-slate-900">
          <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Navigation size={14} className="text-emerald-400" />
              <span>خريطة المسار التفاعلية</span>
            </span>

            {/* Dedicated "Detect My Location" Trigger in Header */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-detect-location-header"
                onClick={() => detectUserLocation(false)}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
              >
                <Crosshair size={13} className={isLocating ? 'animate-spin text-emerald-400' : 'text-emerald-400'} />
                <span>
                  {isLocating
                    ? (lang === 'ar' ? 'جاري التحديد...' : 'Locating...')
                    : (lang === 'ar' ? 'موقعي الحالي (GPS)' : 'Detect My Location')}
                </span>
              </button>

              <span className="text-[11px] font-mono text-emerald-400 font-bold hidden xs:inline">
                {distanceKm} {t.km} • {suggestedFare} {t.dzd}
              </span>
            </div>
          </div>

          <Sari3Map
            center={{ lat: currentWilayaObj.lat, lng: currentWilayaObj.lng }}
            pickupCoords={pickupCoords}
            dropoffCoords={dropoffCoords}
            interactivePinDropMode={interactiveMode}
            onMapClick={handleMapClick}
            onPinDropped={handlePinDropped}
            userLiveGps={liveGpsCoords}
            onCenterOnGps={() => detectUserLocation(false)}
            flyToCoords={mapFlyTo}
            isLocating={isLocating}
            theme={theme}
            lang={lang}
            onRouteCalculated={handleRouteCalculated}
            className="min-h-[350px] h-[350px] w-full"
          />

          {/* Quick pin drop controls - Always clickable and active, never blocked by loading */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2 text-xs relative z-30">
            <button
              type="button"
              id="btn-manual-pin-pickup"
              onClick={() => {
                cancelLocating();
                setInteractiveMode(interactiveMode === 'pickup' ? null : 'pickup');
              }}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
                interactiveMode === 'pickup'
                  ? 'border-emerald-500 bg-emerald-500/25 text-emerald-400 ring-2 ring-emerald-500/30'
                  : 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <MapPin size={14} className="text-emerald-400 shrink-0" />
              <span>{lang === 'ar' ? 'تحديد الاستلام بالنقر' : 'Select Pickup on Map'}</span>
            </button>

            <button
              type="button"
              id="btn-manual-pin-dropoff"
              onClick={() => {
                cancelLocating();
                setInteractiveMode(interactiveMode === 'dropoff' ? null : 'dropoff');
              }}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
                interactiveMode === 'dropoff'
                  ? 'border-purple-500 bg-purple-500/25 text-purple-400 ring-2 ring-purple-500/30'
                  : 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <MapPin size={14} className="text-purple-400 shrink-0" />
              <span>{lang === 'ar' ? 'تحديد التسليم بالنقر' : 'Select Dropoff on Map'}</span>
            </button>
          </div>
        </div>

        {/* Location Detection Status / Guidance Banner */}
        {locationFeedback && (
          <div
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 border shadow-lg transition animate-in fade-in duration-300 ${
              locationFeedback.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                : 'bg-amber-500/15 border-amber-500/35 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {locationFeedback.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              ) : (
                <MapPin size={16} className="text-amber-400 shrink-0" />
              )}
              <span>{locationFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setLocationFeedback(null)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer px-1 py-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Addresses Inputs */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          {/* Pickup Address */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>{t.pickupLocation}</span>
              </label>
              <button
                type="button"
                id="btn-use-current-gps-pickup"
                onClick={() => detectUserLocation(false)}
                className="text-[11px] text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Crosshair size={12} className={isLocating ? 'animate-spin' : ''} />
                <span>
                  {isLocating
                    ? (lang === 'ar' ? 'جاري التحديد...' : 'Locating...')
                    : t.useCurrentGps}
                </span>
              </button>
            </div>
            <input
              type="text"
              id="input-pickup-address"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder={t.typeAddressPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-white text-xs focus:border-emerald-500"
              required
            />
          </div>

          {/* Dropoff Address */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span>{t.dropoffLocation}</span>
            </label>
            <input
              type="text"
              id="input-dropoff-address"
              value={dropoffAddress}
              onChange={(e) => setDropoffAddress(e.target.value)}
              placeholder={t.typeAddressPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-white text-xs focus:border-purple-500"
              required
            />
          </div>
        </div>

        {/* Package Media & Details (Crucial Package Photo Upload & Description) */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-xs sm:text-sm text-white flex items-center gap-2">
              <Package size={18} className="text-emerald-400" />
              <span>{t.packageDetailsTitle}</span>
            </h4>
            <span className="text-[10px] font-bold text-amber-400 px-2 py-0.5 rounded-md bg-amber-400/10">
              إلزامي لمعاينة السائق
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-snug">
            {t.packagePhotoDesc}
          </p>

          {/* Photo preview + upload input */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
            {packagePhoto ? (
              <img
                src={packagePhoto}
                alt="Package inspection"
                className="w-20 h-20 rounded-xl object-cover border-2 border-emerald-500 shadow-md flex-shrink-0 cursor-pointer"
                onClick={() => onOpenPackageInspection(packagePhoto, packageDescription)}
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-slate-900 border border-dashed border-slate-700 flex items-center justify-center text-slate-500 flex-shrink-0">
                <Camera size={24} />
              </div>
            )}

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    launchNativeDeviceCamera('environment', (dataUrl) => setPackagePhoto(dataUrl))
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition cursor-pointer"
                >
                  <Camera size={14} />
                  <span>{packagePhoto ? 'إعادة التقاط الطرد' : 'التقاط صورة الطرد (الكاميرا)'}</span>
                </button>

                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer border border-slate-700">
                  <Upload size={13} />
                  <span>من المعرض</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setPackagePhoto(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>

              <p className="text-[10px] text-slate-500">
                يدعم كاميرا الهاتف الأصلية (WebView/Native) ومعرض الصور
              </p>
            </div>
          </div>

          {/* Package Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.packageDescription}
            </label>
            <textarea
              rows={2}
              value={packageDescription}
              onChange={(e) => setPackageDescription(e.target.value)}
              placeholder={t.packageDescPlaceholder}
              className="w-full px-3 py-2 rounded-2xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-emerald-500 resize-none"
              required
            />
          </div>
        </div>

        {/* Pricing & Negotiation Initial Offer */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{t.suggestedBaseFare}:</span>
            <span className="font-mono font-bold text-sm text-slate-200">
              ~ {suggestedFare} {t.dzd}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-white mb-1.5 flex items-center justify-between">
              <span>{t.yourOfferPrice}</span>
              <span className="text-[11px] text-emerald-400 font-semibold font-mono">
                {customerOffer} {t.dzd}
              </span>
            </label>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min="200"
                max="3000"
                step="50"
                value={customerOffer}
                onChange={(e) => setCustomerOffer(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <input
                type="number"
                step="50"
                value={customerOffer}
                onChange={(e) => setCustomerOffer(Number(e.target.value))}
                className="w-24 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-black text-center text-sm"
              />
            </div>

            <p className="text-[10px] text-slate-500 mt-1.5">
              {t.minFareWarning}
            </p>
          </div>
        </div>

        {/* Submit Order Button */}
        <button
          type="submit"
          id="btn-publish-order"
          className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Package size={20} />
          <span>{t.publishOrder}</span>
        </button>
      </form>

      {/* Mandatory Device GPS Modal */}
      <MandatoryGpsModal
        isOpen={showGpsModal}
        status={gpsStatus}
        errorMessage={gpsErrorMessage}
        role="customer"
        onRetryGps={async () => {
          const res = await requestGps();
          if (res) {
            setShowGpsModal(false);
            setPickupCoords(res);
            const addr = await reverseGeocode(res.lat, res.lng, lang);
            setPickupAddress(addr);
          }
        }}
        onClose={() => setShowGpsModal(false)}
        onBypass={() => {
          bypassGps(pickupCoords || { lat: currentWilayaObj.lat, lng: currentWilayaObj.lng });
          setShowGpsModal(false);
        }}
      />

      {/* Package Native Camera Capture Modal */}
      <NativeCameraModal
        isOpen={isPackageCameraOpen}
        title="التقاط صورة الطرد"
        subtitle="صوّر الطرد بشكل واضح لتمكين الكابتن من معاينته بدقة"
        facingMode="environment"
        onCapture={(dataUrl) => {
          setPackagePhoto(dataUrl);
          setIsPackageCameraOpen(false);
        }}
        onClose={() => setIsPackageCameraOpen(false)}
      />
    </div>
  );
};
