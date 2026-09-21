import React from 'react';
import { X, Package, ShieldCheck } from 'lucide-react';

interface PackageInspectionModalProps {
  isOpen: boolean;
  photoUrl: string | null;
  description: string | null;
  onClose: () => void;
}

export const PackageInspectionModal: React.FC<PackageInspectionModalProps> = ({
  isOpen,
  photoUrl,
  description,
  onClose,
}) => {
  if (!isOpen || !photoUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-slate-100 relative">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-emerald-400" />
            <h3 className="font-bold text-sm text-white font-['Cairo']">
              معاينة الطرد التفصيلية
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* High-res Image Preview */}
        <div className="relative max-h-[60vh] bg-black flex items-center justify-center overflow-hidden">
          <img
            src={photoUrl}
            alt="Package inspection high res"
            className="w-full h-auto max-h-[60vh] object-contain"
          />
        </div>

        {/* Package Description details */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
            <ShieldCheck size={16} />
            <span>وصف المحتوى المصرح به من الزبون:</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-2xl border border-slate-800">
            {description || 'لا يوجد وصف مفصل'}
          </p>
        </div>
      </div>
    </div>
  );
};
