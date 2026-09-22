import React, { useState } from 'react';
import { AppTranslations } from '../i18n/translations';
import {
  CustomerContactCall,
  Language,
  ThemeMode,
  UserProfile,
} from '../types';
import { ProfilePhotoUploader } from './ProfilePhotoUploader';
import { Sari3Logo } from './Sari3Logo';
import {
  X,
  User,
  PhoneCall,
  Globe,
  Sun,
  Moon,
  LogOut,
  Phone,
  ShieldCheck,
  Check,
  AlertCircle,
  Clock,
  Bike,
  Package,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

interface CustomerDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  t: AppTranslations;
  lang: Language;
  theme: ThemeMode;
  onLanguageChange: (lang: Language) => void;
  onThemeToggle: () => void;
  onLogout: () => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

type DrawerView = 'menu' | 'profile' | 'call_history';

// Mock Contact History for Customer
const INITIAL_CALL_HISTORY: CustomerContactCall[] = [
  {
    id: 'call-1',
    driverId: 'drv-1',
    driverName: 'كريم الدراجي',
    driverPhone: '+213 661 88 99 00',
    driverRating: 4.95,
    vehicle: 'Sym Orbit II (دراجة نارية)',
    plate: '01234-121-16',
    orderTitle: 'توصيل وثائق وعقود مستعجلة',
    date: 'اليوم، 14:15',
    status: 'completed',
  },
  {
    id: 'call-2',
    driverId: 'drv-2',
    driverName: 'ياسين بوعلام',
    driverPhone: '+213 550 44 33 22',
    driverRating: 4.88,
    vehicle: 'Peugeot 208 (سيارة)',
    plate: '09812-118-16',
    orderTitle: 'طرد إلكترونيات وهاتف ذكي',
    date: 'أمس، 17:30',
    status: 'completed',
  },
  {
    id: 'call-3',
    driverId: 'drv-3',
    driverName: 'مراد سلطاني',
    driverPhone: '+213 770 12 90 45',
    driverRating: 4.92,
    vehicle: 'Kymco Agility 125',
    plate: '04512-120-16',
    orderTitle: 'وجبة طعام عائلية خاصة',
    date: '18 سبتمبر، 13:00',
    status: 'completed',
  },
];

export const CustomerDrawerMenu: React.FC<CustomerDrawerMenuProps> = ({
  isOpen,
  onClose,
  currentUser,
  t,
  lang,
  theme,
  onLanguageChange,
  onThemeToggle,
  onLogout,
  onUpdateProfile,
}) => {
  const isRtl = lang === 'ar';
  const ArrowBackIcon = isRtl ? ArrowRight : ArrowLeft;
  const ArrowNextIcon = isRtl ? ArrowLeft : ArrowRight;

  const [activeView, setActiveView] = useState<DrawerView>('menu');

  // Profile Edit State
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [phone, setPhone] = useState(currentUser.phone || '+213 555 12 34 56');
  const [selectedAvatar, setSelectedAvatar] = useState(
    currentUser.avatarUrl || ''
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      displayName: displayName.trim(),
      phone: phone.trim(),
      avatarUrl: selectedAvatar,
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setActiveView('menu');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Dark Overlay Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Container */}
      <div
        className={`absolute inset-y-0 ${
          isRtl ? 'right-0' : 'left-0'
        } max-w-sm w-full bg-[#0B0F17] border-slate-800 text-slate-100 shadow-2xl flex flex-col z-10 transition-transform animate-in ${
          isRtl ? 'slide-in-from-right' : 'slide-in-from-left'
        } duration-200 ${isRtl ? 'border-l' : 'border-r'}`}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            {activeView !== 'menu' && (
              <button
                onClick={() => setActiveView('menu')}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <ArrowBackIcon size={18} />
              </button>
            )}
            <Sari3Logo size="sm" />
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-[10px] border border-emerald-500/20 flex items-center gap-1">
              <Package size={12} />
              <span>حساب الزبون</span>
            </span>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Customer Header Card */}
        <div className="p-4 bg-gradient-to-b from-slate-900/80 to-transparent border-b border-slate-800/60 flex items-center gap-3">
          <img
            src={
              currentUser.avatarUrl ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'
            }
            alt="Customer Avatar"
            className="w-13 h-13 rounded-full object-cover border-2 border-emerald-500 shadow-md"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-sm text-white truncate">{currentUser.displayName}</h3>
              <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0" />
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{currentUser.phone}</p>
            <span className="inline-block mt-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
              رقم هاتف موثق ✓
            </span>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* VIEW 1: MAIN MENU */}
          {activeView === 'menu' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                {/* 1. Profile Link */}
                <button
                  onClick={() => setActiveView('profile')}
                  className="w-full p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 text-right flex items-center justify-between transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-slate-950 transition">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">الملف الشخصي للزبون</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">عرض وتحديث الاسم ورقم الهاتف الموثق</p>
                    </div>
                  </div>
                  <ArrowNextIcon size={16} className="text-slate-500 group-hover:text-white transition" />
                </button>

                {/* 2. Call / Contact History */}
                <button
                  onClick={() => setActiveView('call_history')}
                  className="w-full p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 text-right flex items-center justify-between transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition">
                      <PhoneCall size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">سجل الاتصال بالكباتن</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">قائمة الكباتن المتواصل معهم وأرقامهم للاتصال</p>
                    </div>
                  </div>
                  <ArrowNextIcon size={16} className="text-slate-500 group-hover:text-white transition" />
                </button>
              </div>

              {/* App Preferences: Language & Theme */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <p className="text-[11px] font-bold text-slate-400 px-1">تفضيلات التطبيق</p>

                {/* Language Switcher */}
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Globe size={16} className="text-emerald-400" />
                    <span>اللغة / Language</span>
                  </div>

                  <select
                    value={lang}
                    onChange={(e) => onLanguageChange(e.target.value as Language)}
                    className="bg-slate-950 border border-slate-700 text-xs font-bold rounded-xl px-2 py-1 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="ar">العربية (RTL)</option>
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                  </select>
                </div>

                {/* Theme Toggle */}
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    {theme === 'dark' ? <Moon size={16} className="text-emerald-400" /> : <Sun size={16} className="text-amber-400" />}
                    <span>المظهر: {theme === 'dark' ? 'الوضع الليلي الخافت' : 'الوضع الفاتح'}</span>
                  </div>

                  <button
                    onClick={onThemeToggle}
                    className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white"
                  >
                    {theme === 'dark' ? 'فاتح' : 'ليلي'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: PROFILE EDIT & UPDATE */}
          {activeView === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {saveSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="flex-shrink-0" />
                  <span>تم حفظ التعديلات بنجاح!</span>
                </div>
              )}

              {/* Profile Photo Uploader (Gallery or Camera) */}
              <div className="py-2">
                <ProfilePhotoUploader
                  currentPhotoUrl={selectedAvatar || null}
                  onPhotoSelected={(url) => setSelectedAvatar(url)}
                  title="صورة الملف الشخصي"
                  subtitle="اختر صورة من المعرض أو التقط صورة حية بالكاميرا"
                />
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  اسم الزبون (الاسم واللقب)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="أمين بلحاج"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    رقم الهاتف الموثق
                  </label>
                  <span className="text-[10px] text-emerald-400 font-bold">موثق بـ SMS ✓</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2 mt-3"
              >
                <Check size={16} />
                <span>حفظ التعديلات في الملف الشخصي</span>
              </button>
            </form>
          )}

          {/* VIEW 3: CALL / CONTACT HISTORY */}
          {activeView === 'call_history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>سجل الكباتن المتواصل معهم</span>
                <span className="font-mono font-bold text-emerald-400">{INITIAL_CALL_HISTORY.length} اتصالات</span>
              </div>

              <div className="space-y-2.5">
                {INITIAL_CALL_HISTORY.map((call) => (
                  <div
                    key={call.id}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-sm">
                          <User size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-black text-xs text-white">{call.driverName}</h4>
                            <span className="text-[11px] text-amber-400 font-bold">★ {call.driverRating}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{call.vehicle}</p>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">{call.plate}</span>
                        </div>
                      </div>

                      {/* Direct Call Button */}
                      <a
                        href={`tel:${call.driverPhone}`}
                        className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                      >
                        <Phone size={13} />
                        <span>اتصال الآن</span>
                      </a>
                    </div>

                    {/* Order Details & Call Date */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="truncate max-w-[180px]">📦 {call.orderTitle}</span>
                      <span className="font-mono text-slate-500">{call.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer: Logout Button */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60">
          <button
            onClick={onLogout}
            className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-red-950/60 hover:text-red-300 text-slate-300 border border-slate-800 hover:border-red-800 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={16} />
            <span>تسجيل الخروج والعودة للبوابة الرئيسية</span>
          </button>
        </div>
      </div>
    </div>
  );
};
