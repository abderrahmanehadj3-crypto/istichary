import React, { useState, useEffect } from 'react';
import { translations } from './i18n/translations';
import {
  DeliveryOrder,
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
  INITIAL_DEMO_ORDERS,
} from './utils/supabaseSync';
import { soundNotifier } from './utils/audioNotification';
import { Sari3Logo } from './components/Sari3Logo';
import { UnifiedAuthFlow } from './components/UnifiedAuthFlow';
import { RoleSelectionScreen } from './components/RoleSelectionScreen';
import { DriverVerificationWizard } from './components/DriverVerificationWizard';
import { CustomerProfileSetupScreen } from './components/CustomerProfileSetupScreen';
import { CustomerHome } from './components/CustomerHome';
import { DriverHome } from './components/DriverHome';
import { ActiveDeliveryView } from './components/ActiveDeliveryView';
import { PackageInspectionModal } from './components/PackageInspectionModal';
import { DriverDrawerMenu } from './components/DriverDrawerMenu';
import { CustomerDrawerMenu } from './components/CustomerDrawerMenu';
import {
  Menu,
  Sun,
  Moon,
  Globe,
  User,
  LogOut,
  Package,
  Bike,
  ShieldCheck,
  MapPin,
  Bell,
  X,
  Sparkles,
} from 'lucide-react';

export function App() {
  // Localization & Theme
  const [lang, setLang] = useState<Language>('ar');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const t = translations[lang];

  // Global Wilaya state (default Wilaya 16 - Algiers)
  const [selectedWilaya, setSelectedWilaya] = useState<string>('16');

  // Authenticated User State (Must be null on startup to ensure login is the mandatory first screen)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Package Inspection Modal
  const [inspectionPhoto, setInspectionPhoto] = useState<string | null>(null);
  const [inspectionDesc, setInspectionDesc] = useState<string | null>(null);

  // Real-time floating Notification Toast
  const [activeNotification, setActiveNotification] = useState<{
    id: string;
    title: string;
    desc: string;
    type: 'order' | 'bid' | 'accepted';
  } | null>(null);

  // Orders State
  const [orders, setOrders] = useState<DeliveryOrder[]>(INITIAL_DEMO_ORDERS);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string | null>(null);

  // Side Navigation Drawer State
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

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

  // Logout / Reset to Entry Authentication Flow
  const handleLogout = () => {
    setCurrentUser(null);
    setIsSidebarOpen(false);
    localStorage.removeItem('sari3_user_profile');
  };

  // Update Profile (Name, Phone, Avatar)
  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updatedUser: UserProfile = {
      ...currentUser,
      ...updated,
    };
    setCurrentUser(updatedUser);
    saveUserProfile(updatedUser);
    setActiveNotification({
      id: `notif-${Date.now()}`,
      title: 'تم حفظ التعديلات بنجاح!',
      desc: 'تم تحديث بيانات ملفك الشخصي في Sari3',
      type: 'accepted',
    });
  };

  // Order Actions: Customer publishes new order
  const handlePublishOrder = async (newOrder: DeliveryOrder) => {
    await saveNewOrderToSupabase(newOrder);
    setOrders((prev) => [newOrder, ...prev]);

    // Play Dispatch alert sound
    soundNotifier.playNewOrderSound();

    setActiveNotification({
      id: `notif-${Date.now()}`,
      title: '📦 تم بث طلب التوصيل بنجاح!',
      desc: `تم إشعار الكباتن في ${newOrder.pickupAddress} بسعر مقترح ${newOrder.customerOfferPrice} دج`,
      type: 'order',
    });
  };

  // Driver submits price offer / counter-offer
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

  // Customer accepts driver offer -> Starts Live Delivery Tracking
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

  // Customer counter-offers
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

  // Driver finishes delivery -> Permanently terminates live tracking
  const handleFinishDelivery = async (orderId: string) => {
    await updateOrderStatus(orderId, 'delivered');
    await reloadOrders();
    setActiveTrackingOrderId(null);
    soundNotifier.playNewOrderSound();

    setActiveNotification({
      id: `notif-${Date.now()}`,
      title: '🎉 اكتملت عملية التوصيل بنجاح!',
      desc: 'تم إنهاء الجلسة وإغلاق التتبع الحي بنجاح',
      type: 'accepted',
    });
  };

  // Cancel delivery
  const handleCancelOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'cancelled');
    await reloadOrders();
    if (activeTrackingOrderId === orderId) {
      setActiveTrackingOrderId(null);
    }
  };

  // Active in-transit or accepted delivery order
  const activeTrackingOrder = orders.find(
    (o) =>
      o.id === activeTrackingOrderId ||
      ((o.status === 'accepted' || o.status === 'in_transit') &&
        (o.customerId === currentUser?.id || o.assignedDriver?.id === currentUser?.id))
  );

  // =========================================================================
  // VIEW ROUTING & USER JOURNEY
  // =========================================================================

  // 1. INITIAL AUTHENTICATION SCREEN: Clean unified auth supporting Email or Phone Number
  if (!currentUser) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0B0F17] text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-200`}>
        <UnifiedAuthFlow
          t={t}
          lang={lang}
          theme={theme}
          onLanguageChange={setLang}
          onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onAuthSuccess={(authenticatedUser) => {
            setCurrentUser(authenticatedUser);
            saveUserProfile(authenticatedUser);
          }}
        />
      </div>
    );
  }

  // 2. ROLE SELECTION SCREEN: Immediately after successful authentication, choose Customer or Driver
  if (!currentUser.role) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0B0F17] text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-200`}>
        <RoleSelectionScreen
          currentUser={currentUser}
          t={t}
          lang={lang}
          theme={theme}
          onSelectRole={(selectedRole) => {
            const updatedUser: UserProfile = {
              ...currentUser,
              role: selectedRole,
              customerProfileCompleted:
                selectedRole === 'customer'
                  ? currentUser.customerProfileCompleted ?? false
                  : undefined,
            };
            setCurrentUser(updatedUser);
            saveUserProfile(updatedUser);
            setActiveNotification({
              id: `notif-${Date.now()}`,
              title: selectedRole === 'driver' ? 'مرحباً بك ككابتن في سريع!' : 'مرحباً بك كزبون في سريع!',
              desc:
                selectedRole === 'driver'
                  ? 'يرجى إكمال توثيق بياناتك ومستنداتك لبدء العمل'
                  : 'يرجى إكمال إعداد ملفك الشخصي للانتقال إلى الخريطة',
              type: 'accepted',
            });
          }}
          onLanguageChange={setLang}
          onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  // 3. CUSTOMER PROFILE CUSTOMIZATION FLOW:
  // Once "Customer" is selected, present a smart prompt/choice for their profile setup:
  // - Quick Option: Instantly use Email account's name, profile picture, and birthdate
  // - Manual Option: Input alternative/custom personal information manually
  if (currentUser.role === 'customer' && !currentUser.customerProfileCompleted) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0B0F17] text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-200`}>
        <CustomerProfileSetupScreen
          currentUser={currentUser}
          t={t}
          lang={lang}
          theme={theme}
          onLanguageChange={setLang}
          onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onBackToRoleSelection={() => {
            const resetUser: UserProfile = {
              ...currentUser,
              role: undefined,
              customerProfileCompleted: false,
            };
            setCurrentUser(resetUser);
            saveUserProfile(resetUser);
          }}
          onCompleteProfile={({ displayName, avatarUrl, birthDate, wilaya }) => {
            const completedUser: UserProfile = {
              ...currentUser,
              displayName,
              avatarUrl,
              birthDate,
              wilaya,
              customerProfileCompleted: true,
              accountConfirmed: true,
            };
            setCurrentUser(completedUser);
            saveUserProfile(completedUser);
            setSelectedWilaya(wilaya);
            setActiveNotification({
              id: `notif-${Date.now()}`,
              title: '✨ تم إعداد ملفك الشخصي بنجاح!',
              desc: `أهلاً بك يا ${displayName}، يمكنك الآن تحديد موقعك وبدء نشر الطلبات`,
              type: 'accepted',
            });
          }}
        />
      </div>
    );
  }

  // 4. DRIVER FLOW: The moment the user selects "Driver", redirect them directly to complete onboarding, verification & documents
  if (
    currentUser.role === 'driver' &&
    (!currentUser.driverDetails || currentUser.driverDetails.verificationStatus !== 'verified')
  ) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0B0F17] text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-200 p-4 sm:p-6`}>
        <div className="max-w-xl mx-auto">
          <DriverVerificationWizard
            currentUser={currentUser}
            t={t}
            lang={lang}
            onComplete={(driverDetails) => {
              const verifiedUser: UserProfile = {
                ...currentUser,
                driverDetails: {
                  ...driverDetails,
                  verificationStatus: 'verified',
                },
                accountConfirmed: true,
              };
              setCurrentUser(verifiedUser);
              saveUserProfile(verifiedUser);
              setActiveNotification({
                id: `notif-${Date.now()}`,
                title: '🎉 تم توثيق حساب الكابتن بنجاح!',
                desc: 'مرحباً بك في أسطول كباتن سريع، يمكنك الآن استقبال وتوصيل الطلبات',
                type: 'accepted',
              });
            }}
            onCancel={() => {
              // Return to role selection screen
              const resetRoleUser: UserProfile = {
                ...currentUser,
                role: undefined,
              };
              setCurrentUser(resetRoleUser);
              saveUserProfile(resetRoleUser);
            }}
          />
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED USER FLOW (DEDICATED DASHBOARDS)
  return (
    <div
      className={`min-h-screen ${
        theme === 'dark'
          ? 'bg-[#0B0F17] text-slate-100'
          : 'bg-slate-50 text-slate-900'
      } transition-colors duration-200 relative`}
    >
      {/* Real-time floating Notification Toast */}
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

      {/* App Header (Clean native container, no fake phone bezels) */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0B0F17]/95 backdrop-blur-md px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          {/* Hamburger Menu & Brand Logo */}
          <div className="flex items-center gap-2.5">
            <button
              id="btn-open-sidebar-menu"
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 hover:text-emerald-400 hover:border-emerald-500/50 transition cursor-pointer flex items-center justify-center shadow-sm"
              aria-label="القائمة الجانبية"
              title="فتح القائمة الجانبية"
            >
              <Menu size={20} />
            </button>
            <Sari3Logo size="md" showTagline taglineText={t.tagline} />
          </div>

          {/* Controls: Role Badge, Language, Theme, Logout */}
          <div className="flex items-center gap-2">
            {/* Active Role Indicator Badge (Clickable to switch between Customer and Driver) */}
            <button
              type="button"
              id="btn-header-switch-role"
              onClick={() => {
                const switchUser: UserProfile = {
                  ...currentUser,
                  role: undefined,
                };
                setCurrentUser(switchUser);
                saveUserProfile(switchUser);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer hover:scale-105 active:scale-95 ${
                currentUser.role === 'driver'
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              }`}
              title="انقر لتبديل الدور (زبون / كابتن)"
            >
              {currentUser.role === 'driver' ? (
                <>
                  <Bike size={14} />
                  <span className="hidden sm:inline">كابتن سريع</span>
                  <span className="text-[10px] text-purple-400/80 mr-0.5">🔄</span>
                </>
              ) : (
                <>
                  <Package size={14} />
                  <span className="hidden sm:inline">زبون</span>
                  <span className="text-[10px] text-emerald-400/80 mr-0.5">🔄</span>
                </>
              )}
            </button>

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

            {/* Theme Toggle (Light / Soft Matte Black) */}
            <button
              id="btn-theme-toggle"
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-emerald-400 transition cursor-pointer"
              title="تبديل المظهر"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Logout / Switch Role Gateway */}
            <button
              id="btn-user-logout"
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-400 hover:text-red-400 transition cursor-pointer"
              title="تسجيل الخروج والعودة للبوابة الرئيسية"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Role-Segregated Side Navigation Drawers */}
      {currentUser.role === 'driver' ? (
        <DriverDrawerMenu
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentUser={currentUser}
          t={t}
          lang={lang}
          theme={theme}
          onLanguageChange={setLang}
          onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onLogout={() => {
            setIsSidebarOpen(false);
            handleLogout();
          }}
          onUpdateProfile={handleUpdateProfile}
        />
      ) : (
        <CustomerDrawerMenu
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentUser={currentUser}
          t={t}
          lang={lang}
          theme={theme}
          onLanguageChange={setLang}
          onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onLogout={() => {
            setIsSidebarOpen(false);
            handleLogout();
          }}
          onUpdateProfile={handleUpdateProfile}
        />
      )}

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
              currentRole={currentUser.role || 'customer'}
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
        ) : currentUser.role === 'driver' ? (
          /* ISOLATED DRIVER DASHBOARD */
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
          /* ISOLATED CUSTOMER DASHBOARD */
          <CustomerHome
            currentUser={currentUser}
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

      {/* Package Photo Inspection Modal */}
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
