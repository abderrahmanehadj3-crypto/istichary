import React from 'react';
import { User, Stethoscope, ShieldCheck, Clock, ShieldAlert, CheckCheck, Crown } from 'lucide-react';
import { UserRole, VerificationStatus } from '../types';

interface RoleAvatarProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  verificationStatus?: VerificationStatus;
  className?: string;
}

export const RoleAvatar: React.FC<RoleAvatarProps> = ({
  role,
  size = 'md',
  verificationStatus,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-lg',
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 26,
    xl: 36,
  };

  const isSuperAdmin = role === 'super_admin';
  const isModerator = role === 'moderator';
  const isDoctor = role === 'doctor';
  const isVerified = verificationStatus === 'verified';
  const isPending = verificationStatus === 'pending';

  return (
    <div className={`relative inline-flex items-center justify-center rounded-full select-none ${sizeClasses[size]} ${className}`}>
      {isSuperAdmin ? (
        <div
          id="admin-avatar-badge"
          className="w-full h-full rounded-full bg-gradient-to-br from-violet-600 to-indigo-800 text-white flex items-center justify-center shadow-xs border border-violet-300 dark:border-violet-700"
          title="Super Administrator"
        >
          <Crown size={iconSizes[size]} strokeWidth={2.2} />
        </div>
      ) : isModerator ? (
        <div
          id="moderator-avatar-badge"
          className="w-full h-full rounded-full bg-gradient-to-br from-blue-600 to-cyan-700 text-white flex items-center justify-center shadow-xs border border-blue-300 dark:border-blue-700"
          title="Verification Moderator"
        >
          <CheckCheck size={iconSizes[size]} strokeWidth={2.2} />
        </div>
      ) : isDoctor ? (
        <div
          id="doctor-avatar-badge"
          className="w-full h-full rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 dark:from-sky-600 dark:to-indigo-700 text-white flex items-center justify-center shadow-xs border border-white/40 dark:border-slate-700"
          title="Physician Avatar"
        >
          <Stethoscope size={iconSizes[size]} strokeWidth={2.2} />
        </div>
      ) : (
        <div
          id="patient-avatar-badge"
          className="w-full h-full rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 dark:from-teal-600 dark:to-emerald-800 text-white flex items-center justify-center shadow-xs border border-white/40 dark:border-slate-700"
          title="Patient Avatar"
        >
          <User size={iconSizes[size]} strokeWidth={2.2} />
        </div>
      )}

      {/* Verification status badge for doctors */}
      {isDoctor && isVerified && (
        <div
          id="doctor-verified-tick"
          className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs border border-white dark:border-slate-900"
          title="Verified Specialist"
        >
          <ShieldCheck size={size === 'sm' ? 10 : size === 'md' ? 12 : 16} strokeWidth={2.8} />
        </div>
      )}

      {isDoctor && isPending && (
        <div
          id="doctor-pending-tick"
          className="absolute -bottom-0.5 -right-0.5 bg-amber-500 text-white rounded-full p-0.5 shadow-xs border border-white dark:border-slate-900"
          title="Verification Pending"
        >
          <Clock size={size === 'sm' ? 10 : size === 'md' ? 12 : 16} strokeWidth={2.8} />
        </div>
      )}
    </div>
  );
};
