import React, { useState, useEffect } from 'react';
import { translations } from './i18n/translations';
import {
  DeliveryOrder,
  DriverDetails,
  DriverOffer,
  Language,
  ThemeMode,
  UserProfile,
  UserRole,
} from './types';
import { ALGERIA_WILAYAS } from './data/wilayas';
import {
  getOrdersFromSupabase,
  saveNewOrderToSupabase,
  submitDriverOffer,
  acceptDriverOffer,
  updateOrderStatus,
  saveUserProfile,
  loadCachedUserProfile,
  INITIAL_DEMO_ORDERS,
} from './utils/supabaseSync';
import { soundNotifier } from './utils/audioNotification';
import { Sari3Logo } from './components/Sari3Logo';
import { AuthModal } from './components/AuthModal';
import { RoleSelectionModal } from './components/RoleSelectionModal';
import { PermissionsModal } from './components/PermissionsModal';
import { DriverVerificationWizard } from './components/DriverVerificationWizard';
import { CustomerHome } from './components/CustomerHome';
import { DriverHome } from './components/DriverHome';
import { ActiveDeliveryView } from './components/ActiveDeliveryView';
import { PackageInspectionModal } from './components/PackageInspectionModal';
import {
  Sun,
  Moon,
  Globe,
  User,
  LogOut,
  Package,
  Bike,
  ShieldCheck,
  MapPin,
  RefreshCw,
  Bell,
  Sparkles,
  CheckCircle2,
  X,
} from 'lucide-react';

export function App() {
  // Localization & Theme
  const [lang, setLang] = useState<Language>('ar');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const t = translations[lang];

  // Global Wilaya state (default Wilaya 16 - Algiers)
  const [selectedWilaya, setSelectedWilaya] = useState<string>('16');

  // User State - Startup Requirement: If no cached user, defaults to null and triggers AuthModal directly
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return loadCachedUserProfile();
  });

  // Modal States - If user is not authenticated on startup, showAuthModal is TRUE immediately!
  const [showAuthModal, setShowAuthModal] = useState<boolean>(() => {
    return !loadCachedUserProfile();
  });
  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState<boolean>(false);
  const [showDriverWizard, setShowDriverWizard] = useState<boolean>(false);

  // Package Inspection Modal
  const [inspectionPhoto, setInspectionPhoto] = useState<string | null>(null);
  const [inspectionDesc, setInspectionDesc] = useState<string | null>(null);

  // Real-time floating Push Notification banner
  const [activeNotification, setActiveNotification] = useState<{
    id: string;
    title: string;
    desc: string;
    type: 'order' | 'bid' | 'accepted';
  } | null>(null);

  // Orders State
  const [orders, setOrders] = useState<DeliveryOrder[]>(INITIAL_DEMO_ORDERS);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string | null>(null);

  // Load orders on startup and when Wilaya changes
  const reloadOrders = async () => {
    const list = await getOrdersFromSupabase();
    setOrders(list);
  };

  useEffect(() => {
    reloadOrders();
  }, [selectedWilaya]);

  // Handle HTML document direction and theme class
  useEffect(() => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [lang, theme]);

  // Auth Success Handler
  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    saveUserProfile(user);

    // If role not yet chosen or account not finalized, guide through onboarding steps
    if (!user.role) {
      setShowRoleModal(true);
    } else if (user.role === 'driver' && !user.driverDetails) {
      setShowDriverWizard(true);
    } else if (!user.accountConfirmed) {
      setShowPermissionsModal(true);
    }
  };

  // Role Selection Handler
  const handleSelectRole = (role: UserRole, updatedData?: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updatedUser: UserProfile = {
      ...currentUser,
      ...updatedData,
      role: role,
    };
    setCurrentUser(updatedUser);
    saveUserProfile(updatedUser);
    setShowRoleModal(false);

    // If driver, open Driver Verification Wizard
    if (role === 'driver') {
      setShowDriverWizard(true);
    } else {
      // Customer: proceed to Permissions check before final confirmation
      setShowPermissionsModal(true);
    }
  };

  // Permissions Completion Handler
  const handlePermissionsCompleted = (cam: boolean, loc: boolean) => {
    if (!currentUser) return;
    const confirmedUser: UserProfile = {
      ...currentUser,
      cameraPermissionGranted: cam,
      locationPermissionGranted: loc,
      accountConfirmed: true,
    };
    setCurrentUser(confirmedUser);
    saveUserProfile(confirmedUser);
    setShowPermissionsModal(false);

    // Notification
    setActiveNotification({
      id: `notif-${Date.now()}`,
      title: 'تم تفعيل الحساب والصلاحيات بنجاح!',
      desc: confirmedUser.role === 'driver' ? 'أنت الآن كابتن معتمد جاهز لاستقبال الطلبات' : 'يمكنك الآن إرسال طرودك واستقبال العروض',
      type: 'accepted',
    });
  };

  // Driver Verification Completed
  const handleDriverVerificationCompleted = (details: DriverDetails) => {
    if (!currentUser) return;
    const updatedUser: UserProfile = {
      ...currentUser,
      role: 'driver',
      driverDetails: details,
      accountConfirmed: false, // Permissions still needed before final activation
    };
    setCurrentUser(updatedUser);
    saveUserProfile(updatedUser);
    setShowDriverWizard(false);
    // Request permissions strictly after role/driver data, before final confirmation
    setShowPermissionsModal(true);
  };

  // Logout / Reset to Startup Screen
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sari3_user_profile');
    setShowAuthModal(true);
  };

  // Role quick switch for demonstration & testing
  const toggleRole = () => {
    if (!currentUser) return;
    const nextRole: UserRole = currentUser.role === 'customer' ? 'driver' : 'customer';
    const updated: UserProfile = {
      ...currentUser,
      role: nextRole,
      driverDetails:
        nextRole === 'driver' && !currentUser.driverDetails
          ? {
              facePhotoUrl:
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
              publicAvatarUrl:
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
              firstName: 'كريم',
              lastName: 'الدراجي',
              birthDate: '2001-05-14',
              age: 25,
              phone: currentUser.phone || '+213 661 88 99 00',
              phoneVerified: true,
              licenseNumber: '16/2021/987654',
              licenseExpirationDate: '2030-12-31',
              licenseFrontUrl:
                'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
              licenseBackUrl:
                'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
              vehicleType: 'motorcycle',
              vehicleRegType: 'permanent',
              vehiclePlate: '01234-121-16',
              vehicleBrand: 'Sym',
              vehicleModel: 'Orbit II 150cc',
              verificationStatus: 'verified',
              isOnline: true,
              rating: 4.95,
              totalDeliveries: 42,
            }
          : currentUser.driverDetails,
    };
    setCurrentUser(updated);
    saveUserProfile(updated);
  };

  // Order Actions
  const handlePublishOrder = async (newOrder: DeliveryOrder) => {
    await saveNewOrderToSupabase(newOrder);
    setOrders((prev) => [newOrder, ...prev]);

    // Play Dispatch notification sound
    soundNotifier.playNewOrderSound();

    // Trigger floating notification
    setActiveNotification({
      id: `notif-${Date.now()}`,
      title: '📦 تم نشر طلب التوصيل بنجاح!',
      desc: `تم إشعار الكباتن في ${newOrder.pickupAddress} بسعر مقترح ${newOrder.customerOfferPrice} دج`,
      type: 'order',
    });
  };

  const handleSendDriverOffer = async (offer: DriverOffer) => {
    await submitDriverOffer(offer);
    await reloadOrders();
    soundNotifier.playBidSound();

    setActiveNotification({
      id: `notif-${Date.now()}`,
      title: '⚡ تم إرسال عرض السعر للزبون!',
      desc: `عرضك: ${offer.offeredPrice} دج • بانتظار موافقة صاحب الطلب`,
      type: 'bid',
    });
  };

  const handleAcceptOffer = async (orderId: string, offer: DriverOffer) => {
    await acceptDriverOffer(orderId, offer);
    await reloadOrders();
    soundNotifier.playNewOrderSound();
    setActiveTrackingOrderId(orderId);

    setActiveNotification({
      id: `notif-${Date.now()}`,
      title: '🚀 تم الاتفاق وبدء التوصيل!',
      desc: `الكابتن ${offer.driverName} في طريقه لاستلام الطرد`,
      type: 'accepted',
    });
  };

  const handleCounterOffer = async (
    orderId: string,
    driverOffer: DriverOffer,
    counterPrice: number
  ) => {
    const updatedOffer: DriverOffer = {
      ...driverOffer,
      offeredPrice: counterPrice,
      status: 'pending',
    };
    await submitDriverOffer(updatedOffer);
    await reloadOrders();
    soundNotifier.playBidSound();
  };

  const handleFinishDelivery = async (orderId: string) => {
    await updateOrderStatus(orderId, 'delivered');
    await reloadOrders();
    setActiveTrackingOrderId(null);
    soundNotifier.playNewOrderSound();

    setActiveNotification({
      id: `notif-${Date.now()}`,
      title: '🎉 اكتملت عملية التوصيل بنجاح!',
      desc: 'شكراً لاستخدامك تطبيق سريع Sari3',
      type: 'accepted',
    });
  };

  const handleCancelOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'cancelled');
    await reloadOrders();
    if (activeTrackingOrderId === orderId) {
      setActiveTrackingOrderId(null);
    }
  };

  // Active tracking order item
  const activeTrackingOrder = orders.find(
    (o) =>
      o.id === activeTrackingOrderId ||
      ((o.status === 'accepted' || o.status === 'in_transit') &&
        (o.customerId === currentUser?.id || o.assignedDriver?.id === currentUser?.id))
  );

  return (
    <div
      className={`min-h-screen ${
        theme === 'dark'
          ? 'bg-[#0B0F17] text-slate-100'
          : 'bg-slate-50 text-slate-900'
      } transition-colors duration-200 relative`}
    >
      {/* Floating Push Notification Toast */}
      {activeNotification && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md p-3.5 rounded-2xl bg-slate-900/95 border border-emerald-500/50 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Bell size={16} />
            </span>
            <div>
              <p className="font-bold text-white">{activeNotification.title}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{activeNotification.desc}</p>
            </div>
          </div>
          <button
            onClick={() => setActiveNotification(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* App Header (Clean, sleek, no fake phone bezel) */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0B0F17]/95 backdrop-blur-md px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          {/* Brand Logo & Stretched Font */}
          <Sari3Logo size="md" showTagline taglineText={t.tagline} />

          {/* Controls: Role Switcher, Language, Theme, Profile */}
          <div className="flex items-center gap-2">
            {/* Quick Role Switcher (Customer vs Driver) */}
            {currentUser && (
              <button
                id="btn-role-switcher"
                type="button"
                onClick={toggleRole}
                className="px-2.5 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900 hover:border-emerald-500 text-xs font-bold text-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="التبديل بين وضع الزبون ووضع السائق"
              >
                {currentUser?.role === 'driver' ? (
                  <>
                    <Bike size={14} className="text-purple-400" />
                    <span className="hidden sm:inline text-purple-400">كابتن سريع</span>
                  </>
                ) : (
                  <>
                    <Package size={14} className="text-emerald-400" />
                    <span className="hidden sm:inline text-emerald-400">زبون</span>
                  </>
                )}
              </button>
            )}

            {/* Language Selector (4 Languages: AR, FR, EN, RU) */}
            <div className="relative flex items-center">
              <select
                id="select-app-language"
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                className="bg-slate-900 border border-slate-700/80 text-slate-200 text-xs font-bold rounded-xl px-2 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none pr-6 pl-2"
              >
                <option value="ar">العربية</option>
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="ru">Русский</option>
              </select>
              <Globe size={12} className="absolute right-2 text-slate-400 pointer-events-none" />
            </div>

            {/* Theme Toggle (Light / Dark Soft Matte Black) */}
            <button
              id="btn-theme-toggle"
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-emerald-400 transition cursor-pointer"
              title="تبديل المظهر"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Logout / Switch User */}
            {currentUser ? (
              <button
                id="btn-user-logout"
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-400 hover:text-red-400 transition cursor-pointer"
                title="تسجيل الخروج والعودة لشاشة الدخول"
              >
                <LogOut size={15} />
              </button>
            ) : (
              <button
                id="btn-user-auth-trigger"
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="p-2 rounded-xl bg-emerald-500 text-slate-950 font-bold transition cursor-pointer"
                title={t.welcome}
              >
                <User size={15} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main App Container */}
      <main className="max-w-2xl mx-auto px-4 py-5 pb-16">
        {/* Active Live Tracking Screen Takeover (if there is an ongoing in-transit delivery) */}
        {activeTrackingOrder &&
        activeTrackingOrder.status !== 'delivered' &&
        activeTrackingOrder.status !== 'cancelled' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2">
              <h2 className="text-lg font-black text-white font-['Cairo'] flex items-center gap-2">
                <Bike className="text-emerald-400 animate-pulse" size={20} />
                <span>متابعة الشحنة الحية</span>
              </h2>
              <button
                onClick={() => setActiveTrackingOrderId(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                العودة للرئيسية
              </button>
            </div>

            <ActiveDeliveryView
              order={activeTrackingOrder}
              currentRole={currentUser?.role || 'customer'}
              t={t}
              lang={lang}
              theme={theme}
              onFinishDelivery={handleFinishDelivery}
              onCancelDelivery={handleCancelOrder}
              onOpenPackageInspection={(photo, desc) => {
                setInspectionPhoto(photo);
                setInspectionDesc(desc);
              }}
            />
          </div>
        ) : currentUser?.role === 'driver' ? (
          /* DRIVER VIEW */
          <DriverHome
            currentUser={currentUser}
            orders={orders}
            t={t}
            lang={lang}
            theme={theme}
            onSendOffer={handleSendDriverOffer}
            onFinishDelivery={handleFinishDelivery}
            onOpenPackageInspection={(photo, desc) => {
              setInspectionPhoto(photo);
              setInspectionDesc(desc);
            }}
            selectedWilaya={selectedWilaya}
            onWilayaChange={setSelectedWilaya}
          />
        ) : (
          /* CUSTOMER VIEW */
          <CustomerHome
            currentUser={
              currentUser || {
                id: 'demo-user',
                displayName: 'زبون سريع',
                wilaya: '16',
                phone: '+213 555 12 34 56',
                phoneVerified: true,
                createdAt: new Date().toISOString(),
              }
            }
            orders={orders}
            t={t}
            lang={lang}
            theme={theme}
            onPublishOrder={handlePublishOrder}
            onAcceptOffer={handleAcceptOffer}
            onCounterOffer={handleCounterOffer}
            onCancelOrder={handleCancelOrder}
            onOpenPackageInspection={(photo, desc) => {
              setInspectionPhoto(photo);
              setInspectionDesc(desc);
            }}
            selectedWilaya={selectedWilaya}
            onWilayaChange={setSelectedWilaya}
          />
        )}
      </main>

      {/* MODALS */}
      {/* 1. Supabase Auth Modal (Directly active on startup if unauthenticated) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          if (currentUser) {
            setShowAuthModal(false);
          }
        }}
        onAuthSuccess={handleAuthSuccess}
        t={t}
        lang={lang}
      />

      {/* 2. Role Selection Wizard */}
      {currentUser && (
        <RoleSelectionModal
          isOpen={showRoleModal}
          currentUser={currentUser}
          t={t}
          onSelectRole={handleSelectRole}
        />
      )}

      {/* 3. Driver Multi-step Verification Wizard */}
      {currentUser && (
        <DriverVerificationWizard
          currentUser={currentUser}
          t={t}
          lang={lang}
          onComplete={handleDriverVerificationCompleted}
          onCancel={() => setShowDriverWizard(false)}
        />
      )}

      {/* 4. Permissions Overlay (Camera & GPS) */}
      <PermissionsModal
        isOpen={showPermissionsModal}
        t={t}
        onPermissionsCompleted={handlePermissionsCompleted}
      />

      {/* 5. Package Photo Inspection Modal */}
      <PackageInspectionModal
        isOpen={!!inspectionPhoto}
        photoUrl={inspectionPhoto}
        description={inspectionDesc}
        onClose={() => {
          setInspectionPhoto(null);
          setInspectionDesc(null);
        }}
      />
    </div>
  );
}

export default App;
