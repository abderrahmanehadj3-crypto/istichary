import React, { useState } from 'react';
import { AppTranslations } from '../i18n/translations';
import { UserRole, UserProfile } from '../types';
import { Package, Bike, Check, ArrowRight, User, ShieldCheck } from 'lucide-react';
import { Sari3Logo } from './Sari3Logo';
import { CUSTOMER_DEFAULT_AVATAR, DRIVER_DEFAULT_AVATAR } from '../utils/defaultAvatars';

interface RoleSelectionModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  t: AppTranslations;
  onSelectRole: (role: UserRole, updatedProfile?: Partial<UserProfile>) => void;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  isOpen,
  currentUser,
  t,
  onSelectRole,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [customerName, setCustomerName] = useState(currentUser.displayName || 'أمين بلحاج');

  if (!isOpen) return null;

  const handleConfirm = () => {
    const updated: Partial<UserProfile> = {
      role: selectedRole,
      displayName: customerName.trim() || currentUser.displayName,
      avatarUrl: selectedRole === 'driver' ? DRIVER_DEFAULT_AVATAR : CUSTOMER_DEFAULT_AVATAR,
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

            {/* Customer Vector Avatar Display */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500 bg-slate-950 flex items-center justify-center shrink-0">
                <img
                  src={CUSTOMER_DEFAULT_AVATAR}
                  alt="Customer Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">صورة الحساب الرمزية الرسمية</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  رسم توضيحي لزبون يحمل هاتفاً ذكياً وعناصر التسوق. لا حاجة لرفع صور شخصية.
                </span>
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
