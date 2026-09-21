import React, { useState } from 'react';
import { AppTranslations } from '../i18n/translations';
import { UserRole, UserProfile } from '../types';
import { Package, Bike, Check, ArrowRight, Camera, User, Sparkles } from 'lucide-react';
import { Sari3Logo } from './Sari3Logo';

interface RoleSelectionModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  t: AppTranslations;
  onSelectRole: (role: UserRole, updatedProfile?: Partial<UserProfile>) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
];

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  isOpen,
  currentUser,
  t,
  onSelectRole,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [customerName, setCustomerName] = useState(currentUser.displayName || 'أمين بلحاج');
  const [customerAvatar, setCustomerAvatar] = useState(
    currentUser.avatarUrl || PRESET_AVATARS[0]
  );

  if (!isOpen) return null;

  const handleConfirm = () => {
    const updated: Partial<UserProfile> = {
      role: selectedRole,
      displayName: customerName.trim() || currentUser.displayName,
      avatarUrl: customerAvatar,
    };
    onSelectRole(selectedRole, updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 my-auto">
        <div className="text-center mb-5">
          <Sari3Logo size="md" className="justify-center mb-3" />
          <h2 className="text-xl font-black text-white font-['Cairo']">
            {t.selectRoleTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t.selectRoleSubtitle}
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {/* Customer Card */}
          <div
            id="role-card-customer"
            onClick={() => setSelectedRole('customer')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              selectedRole === 'customer'
                ? 'border-emerald-500 bg-emerald-950/30 shadow-lg shadow-emerald-500/10'
                : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <Package size={26} />
              </div>
              <h3 className="font-bold text-sm text-white mb-1">
                {t.roleCustomer}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.roleCustomerDesc}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-400">
                إرسال واستلام
              </span>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                  selectedRole === 'customer'
                    ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                    : 'border-slate-700'
                }`}
              >
                {selectedRole === 'customer' && <Check size={13} strokeWidth={3} />}
              </div>
            </div>
          </div>

          {/* Delivery Driver Card */}
          <div
            id="role-card-driver"
            onClick={() => setSelectedRole('driver')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              selectedRole === 'driver'
                ? 'border-emerald-500 bg-emerald-950/30 shadow-lg shadow-emerald-500/10'
                : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <Bike size={26} />
              </div>
              <h3 className="font-bold text-sm text-white mb-1">
                {t.roleDriver}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.roleDriverDesc}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-400">
                كابتن معتمد
              </span>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                  selectedRole === 'driver'
                    ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                    : 'border-slate-700'
                }`}
              >
                {selectedRole === 'driver' && <Check size={13} strokeWidth={3} />}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Onboarding Details (Name & Profile Picture) */}
        {selectedRole === 'customer' && (
          <div className="mb-5 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3.5 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <User size={15} className="text-emerald-400" />
              <span>إعداد الملف الشخصي للزبون</span>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                الاسم واللقب (الذي يظهر للكباتن)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="أدخل اسمك الكامل"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                اختر صورة الحساب أو ارفع صورتك
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {PRESET_AVATARS.map((av, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCustomerAvatar(av)}
                    className={`w-11 h-11 rounded-full overflow-hidden border-2 transition flex-shrink-0 cursor-pointer ${
                      customerAvatar === av
                        ? 'border-emerald-500 scale-105 shadow-md shadow-emerald-500/30'
                        : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={av} alt="Avatar" className="w-full h-full object-cover" />
                  </button>
                ))}

                {/* Upload or Camera custom photo */}
                <label className="w-11 h-11 rounded-full border-2 border-dashed border-slate-700 hover:border-emerald-500 text-slate-400 hover:text-emerald-400 flex items-center justify-center cursor-pointer transition flex-shrink-0 bg-slate-900">
                  <Camera size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setCustomerAvatar(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          id="btn-confirm-role"
          type="button"
          onClick={handleConfirm}
          className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{selectedRole === 'driver' ? 'متابعة توثيق الكابتن' : 'تأكيد ومتابعة الصلاحيات'}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
