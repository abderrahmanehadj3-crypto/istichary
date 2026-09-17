import React, { useState } from 'react';
import { ShieldAlert, X, Send, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { AccountAppeal, UserAccount, Language } from '../types';
import { generateUUID } from '../utils/supabaseSync';

interface AccountAppealModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  currentLang?: Language;
  existingAppeal?: AccountAppeal | null;
  onSubmitAppeal: (appeal: AccountAppeal) => void;
}

export const AccountAppealModal: React.FC<AccountAppealModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentLang = 'ar',
  existingAppeal,
  onSubmitAppeal,
}) => {
  const [appealCategory, setAppealCategory] = useState<AccountAppeal['appealCategory']>('false_positive_ai');
  const [appealReason, setAppealReason] = useState('');
  const [appealDetails, setAppealDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isAr = currentLang === 'ar';
  const isBanned = currentUser.moderationStatus === 'banned';

  const categoryOptions: {
    id: AccountAppeal['appealCategory'];
    labelAr: string;
    labelEn: string;
    descAr: string;
    descEn: string;
  }[] = [
    {
      id: 'false_positive_ai',
      labelAr: 'خطأ في الكشف الآلي للذكاء الاصطناعي',
      labelEn: 'False Positive AI Auto-Moderation',
      descAr: 'تم تفسير النص أو المصطلحات الطبية المتخصصة بشكل خاطئ من قبل خوارزميات الفحص الآلي.',
      descEn: 'Medical or clinical terminology was mistakenly flagged by automatic moderation algorithms.',
    },
    {
      id: 'medical_context_misunderstanding',
      labelAr: 'سوء فهم للسياق الطبي السريري',
      labelEn: 'Misunderstanding of Clinical Context',
      descAr: 'المحتوى كان ضمن إطار توجيه علمي بحت أو مناقشة طبية موضوعية تم فهمها خارج سياقها.',
      descEn: 'The message was strictly within objective clinical discourse misinterpreted out of context.',
    },
    {
      id: 'rehabilitation_request',
      labelAr: 'التماس إعادة تفعيل والتعهد بالالتزام بالمعايير',
      labelEn: 'Request for Account Restoration & Good Faith Pledge',
      descAr: 'أقر بالخطأ غير المقصود وأتعهد بالالتزام الكامل بسياسات الاستشارة الطبية في المنصة.',
      descEn: 'I acknowledge the unintentional issue and pledge full compliance with platform guidelines.',
    },
    {
      id: 'other',
      labelAr: 'أسباب ومبررات أخرى',
      labelEn: 'Other Grounds for Appeal',
      descAr: 'توضيحات إضافية حول سبب تقييد الحساب والرغبة في مراجعة يدوية رسمية.',
      descEn: 'Additional explanations supporting a formal human administrative review.',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason.trim() || !appealDetails.trim()) return;

    setIsSubmitting(true);

    const appeal: AccountAppeal = {
      id: generateUUID(),
      userId: currentUser.id,
      username: currentUser.username,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      originalPenalty: currentUser.moderationStatus,
      penaltyReason: currentUser.penaltyReason || (isBanned ? 'Permanent Ban' : '48h Restriction'),
      appealCategory,
      appealReason: appealReason.trim(),
      appealDetails: appealDetails.trim(),
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    onSubmitAppeal(appeal);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
      dir={isAr ? 'rtl' : 'ltr'}
      id="account-appeal-modal"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                isBanned
                  ? 'bg-rose-50 text-rose-600 border-rose-100'
                  : 'bg-amber-50 text-amber-600 border-amber-100'
              }`}
            >
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm md:text-base">
                {isAr ? 'طلب استئناف ومراجعة رسمية للحساب' : 'Formal Account Restriction Appeal'}
              </h3>
              <p className="text-xs text-slate-500">
                {currentUser.realName || currentUser.username} ({currentUser.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            id="close-appeal-modal-btn"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status of Restriction Banner */}
        <div
          className={`p-4 border-b text-xs flex items-start gap-3 ${
            isBanned ? 'bg-rose-50/70 border-rose-100 text-rose-900' : 'bg-amber-50/70 border-amber-100 text-amber-900'
          }`}
        >
          <AlertTriangle size={17} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm">
              {isBanned
                ? (isAr ? 'حالة الحساب الحالية: محظور نهائياً' : 'Current Account Status: Permanently Banned')
                : (isAr ? 'حالة الحساب الحالية: مقيد مؤقتاً لمدة 48 ساعة' : 'Current Account Status: Restricted for 48 Hours')}
            </p>
            {currentUser.penaltyReason && (
              <p className="text-xs opacity-90">
                {isAr ? 'سبب العقوبة المسجل:' : 'Recorded Infraction:'} <strong>{currentUser.penaltyReason}</strong>
              </p>
            )}
            {currentUser.penaltyExpiresAt && (
              <p className="text-[11px] opacity-80 flex items-center gap-1">
                <Clock size={12} />
                {isAr ? 'ينتهي التقييد تلقائياً في:' : 'Expires automatically at:'}{' '}
                {new Date(currentUser.penaltyExpiresAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Existing Appeal Pending View */}
        {existingAppeal && existingAppeal.status === 'pending' ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Clock size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 text-base">
                {isAr ? 'طلب الاستئناف قيد المراجعة الرسمية' : 'Appeal Under Administrative Review'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isAr
                  ? 'تم استلام طلب الاستئناف الخاص بك وهو قيد التدقيق حالياً من قبل الإدارة الطبية. سيتم إخطارك فور اتخاذ القرار.'
                  : 'Your formal appeal has been received and is currently being scrutinized by our clinical administration committee.'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 text-right">
              <p><strong>{isAr ? 'موضوع الاستئناف:' : 'Subject:'}</strong> {existingAppeal.appealReason}</p>
              <p className="mt-1"><strong>{isAr ? 'التفاصيل:' : 'Details:'}</strong> {existingAppeal.appealDetails}</p>
              <p className="text-[11px] text-slate-400 mt-2">
                {isAr ? 'تاريخ التقديم:' : 'Submitted at:'} {new Date(existingAppeal.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition-colors"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 flex-1">
            {/* Category Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                {isAr ? 'تصنيف سبب الاستئناف:' : 'Appeal Classification Category:'}
              </label>
              <div className="space-y-2">
                {categoryOptions.map((opt) => {
                  const isSelected = appealCategory === opt.id;
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/40 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="appealCategory"
                        value={opt.id}
                        checked={isSelected}
                        onChange={() => setAppealCategory(opt.id)}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="text-xs">
                        <p className={`font-bold ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
                          {isAr ? opt.labelAr : opt.labelEn}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {isAr ? opt.descAr : opt.descEn}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Appeal Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isAr ? 'عنوان أو ملخص الاستئناف:' : 'Appeal Subject / Summary:'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder={
                  isAr
                    ? 'مثال: توضيح سياق الوصفة الطبية / استئناف ضد حظر غير مقصود'
                    : 'e.g., Clarification on clinical recommendation context'
                }
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Appeal Details */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isAr ? 'شرح تفصيلي ومبررات طلب رفع العقوبة:' : 'Detailed Justification for Review:'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={appealDetails}
                onChange={(e) => setAppealDetails(e.target.value)}
                placeholder={
                  isAr
                    ? 'يرجى تقديم شرح دقيق للموقف والمبررات التي تدعو لرفع الحظر أو التقييد عن حسابك...'
                    : 'Provide comprehensive context, clarifications, or evidence supporting your appeal...'
                }
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
              <CheckCircle2 size={15} className="text-blue-600 shrink-0 mt-0.5" />
              <span>
                {isAr
                  ? 'تتم مراجعة طلبات الاستئناف بعناية فائقة من قبل لجنة الإشراف الطبي والإدارة العليا. ستتلقى إشعاراً بنتيجة المراجعة فور صدور القرار.'
                  : 'Appeals are rigorously audited by our senior medical advisory board. You will receive an immediate notification once a verdict is reached.'}
              </span>
            </div>

            {/* Footer */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                id="cancel-appeal-btn"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !appealReason.trim() || !appealDetails.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-1.5"
                id="submit-appeal-btn"
              >
                <Send size={13} />
                <span>{isAr ? 'إرسال طلب الاستئناف الرسمي' : 'Submit Formal Appeal'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
