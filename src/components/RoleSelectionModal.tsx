import React, { useState } from 'react';
import { AppTranslations } from '../i18n/translations';
import { UserRole, UserProfile } from '../types';
import { Package, Bike, Check, ArrowRight } from 'lucide-react';
import { Sari3Logo } from './Sari3Logo';

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
  const [customerPhone, setCustomerPhone] = useState(currentUser.phone || '');
  const [customerName, setCustomerName] = useState(currentUser.displayName || '');
  const [phoneVerified, setPhoneVerified] = useState(!!currentUser.phoneVerified);
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  if (!isOpen) return null;

  const handleSendCustomerPhoneOtp = () => {
    if (!customerPhone || customerPhone.length < 9) return;
    setOtpSent(true);
  };

  const handleVerifyCustomerPhone = () => {
    if (otpInput.length >= 4) {
      setPhoneVerified(true);
    }
  };

  const handleConfirm = () => {
    const updated: Partial<UserProfile> = {
      role: selectedRole,
      displayName: customerName || currentUser.displayName,
      phone: customerPhone || currentUser.phone,
      phoneVerified: phoneVerified,
    };
    onSelectRole(selectedRole, updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
        <div className="text-center mb-6">
          <Sari3Logo size="md" className="justify-center mb-3" />
          <h2 className="text-xl font-black text-white font-['Cairo']">
            {t.selectRoleTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t.selectRoleSubtitle}
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {/* Customer Card */}
          <div
            id="role-card-customer"
            onClick={() => setSelectedRole('customer')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              selectedRole === 'customer'
                ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/10'
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
                ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/10'
                : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
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
              <span className="text-[11px] font-semibold text-purple-400">
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

        {/* Customer Phone Verification details if missing (Google Login Requirement) */}
        {selectedRole === 'customer' && (!currentUser.phone || !currentUser.phoneVerified) && (
          <div className="mb-5 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-3">
            <p className="font-bold text-slate-300">
              📱 يرجى إدخال وتوثيق رقم هاتفك لتسهيل تواصل السائق معك:
            </p>
            <div className="flex gap-2">
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="05 / 06 / 07 XX XX XX"
                dir="ltr"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
              />
              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendCustomerPhoneOtp}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold"
                >
                  رمز SMS
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleVerifyCustomerPhone}
                  className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold"
                >
                  تأكيد
                </button>
              )}
            </div>
            {otpSent && !phoneVerified && (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="رمز 889315"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-28 px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500 text-emerald-400 text-center font-mono font-bold"
                />
                <span className="text-[11px] text-emerald-400">أدخل الرمز لتأكيد الرقم</span>
              </div>
            )}
            {phoneVerified && (
              <p className="text-emerald-400 font-bold text-[11px]">✓ تم توثيق رقم الهاتف بنجاح</p>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          id="btn-confirm-role"
          type="button"
          onClick={handleConfirm}
          className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{t.confirmRole}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
