import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, X, Send, Lock } from 'lucide-react';
import { AnonymousReport, ReportReason, Language } from '../types';
import { generateUUID } from '../utils/supabaseSync';

interface AnonymousReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'post' | 'comment';
  targetId: string;
  postId: string;
  commentId?: string;
  authorUsername: string;
  authorRealName?: string;
  contentSnippet: string;
  currentLang?: Language;
  onSubmitReport: (report: AnonymousReport) => void;
}

export const AnonymousReportModal: React.FC<AnonymousReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  postId,
  commentId,
  authorUsername,
  authorRealName,
  contentSnippet,
  currentLang = 'ar',
  onSubmitReport,
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason>('medical_misinformation');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isAr = currentLang === 'ar';

  const reasonOptions: { id: ReportReason; labelAr: string; labelEn: string; descAr: string; descEn: string }[] = [
    {
      id: 'medical_misinformation',
      labelAr: 'معلومات طبية مضللة أو خطيرة',
      labelEn: 'Medical Misinformation / Harmful Advice',
      descAr: 'تشخيص غير سليم، نصائح دوائية خطرة، أو إدعاءات طبية غير موثوقة.',
      descEn: 'Inaccurate diagnosis, dangerous drug advice, or unsubstantiated clinical claims.',
    },
    {
      id: 'abusive_language',
      labelAr: 'إساءة، سب، أو لغة غير لائقة',
      labelEn: 'Abusive / Inappropriate Language',
      descAr: 'شتم، تهجم لفظي، أو إهانة للطبيب أو المريض.',
      descEn: 'Insults, harassment, or derogatory remarks directed at users or doctors.',
    },
    {
      id: 'commercial_spam',
      labelAr: 'إعلانات تجارية أو احتيال (سبام)',
      labelEn: 'Commercial Spam / Unsolicited Promotion',
      descAr: 'ترويج منتجات تجارية، روابط مشبوهة، أو رسائل مكررة مزعجة.',
      descEn: 'Commercial sales pitch, suspicious links, or repetitive advertising.',
    },
    {
      id: 'impersonation_fake_license',
      labelAr: 'انتحال صفة طبيب أو ترخيص مزيف',
      labelEn: 'Impersonation / Unverified License',
      descAr: 'ادعاء ممارسة الطب دون ترخيص نظامي معتمد.',
      descEn: 'Claiming medical credentials without valid official registration.',
    },
    {
      id: 'patient_privacy_violation',
      labelAr: 'انتهاك خصوصية أو بيانات المريض',
      labelEn: 'Patient Privacy / HIPAA Violation',
      descAr: 'نشر أرقام، أسماء كاملة، أو صور تكشف هوية المريض دون موافقته.',
      descEn: 'Sharing phone numbers, personal identities, or confidential health records.',
    },
    {
      id: 'other',
      labelAr: 'مخالفة أخرى لسياسات المنصة',
      labelEn: 'Other Community Policy Violation',
      descAr: 'أي سلوك آخر يتعارض مع المعايير الطبية والأخلاقية.',
      descEn: 'Any other behavior violating platform clinical and ethical standards.',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const chosenOption = reasonOptions.find((r) => r.id === selectedReason);

    const report: AnonymousReport = {
      id: generateUUID(),
      targetType,
      targetId,
      postId,
      commentId,
      reportedContentSnippet: contentSnippet.slice(0, 180),
      reportedUsername: authorUsername,
      reportedRealName: authorRealName,
      reason: selectedReason,
      reasonLabel: isAr ? chosenOption?.labelAr : chosenOption?.labelEn,
      details: details.trim() || undefined,
      createdAt: new Date().toISOString(),
      status: 'pending',
      isAnonymous: true,
    };

    onSubmitReport(report);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
      dir={isAr ? 'rtl' : 'ltr'}
      id="anonymous-report-modal"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm md:text-base">
                {isAr ? 'إبلاغ عن محتوى مخالف' : 'Report Content Violation'}
              </h3>
              <p className="text-xs text-slate-500">
                {targetType === 'post'
                  ? (isAr ? 'إبلاغ عن استشارة طبية' : 'Reporting Medical Post')
                  : (isAr ? 'إبلاغ عن تعليق أو رد' : 'Reporting Comment/Reply')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            id="close-report-modal-btn"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Guaranteed 100% Anonymity Banner */}
        <div className="p-4 bg-emerald-50/80 border-b border-emerald-100/80 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Lock size={15} />
          </div>
          <div className="text-xs text-emerald-900 leading-relaxed">
            <p className="font-bold text-emerald-950 flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-700" />
              {isAr ? 'ضمان إخفاء الهوية الكامل بنسبة 100%' : '100% Guaranteed Complete Anonymity'}
            </p>
            <p className="text-emerald-800/90 mt-0.5">
              {isAr
                ? 'لن يعرف الطرف المُبلَّغ عنه نهائياً من قام بتقديم هذا البلاغ. يتم تشفير هويتك وإرسال البلاغ مباشرة إلى فريق الإدارة الطبية للمراجعة المستقلة.'
                : 'The reported party will NEVER know who submitted this report. Your identity is strictly anonymous and sent exclusively to the clinical moderation team.'}
            </p>
          </div>
        </div>

        {/* Content Snippet */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/70 text-xs">
          <span className="text-slate-500 block mb-1">
            {isAr ? 'المحتوى المُبلَّغ عنه الخاص بالمستخدم:' : 'Reported Content by User:'}{' '}
            <strong className="text-slate-700">{authorRealName || authorUsername}</strong>
          </span>
          <p className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 italic line-clamp-3">
            "{contentSnippet}"
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              {isAr ? 'سبب الإبلاغ الرئيسي:' : 'Primary Reason for Report:'}
            </label>
            <div className="space-y-2">
              {reasonOptions.map((opt) => {
                const isSelected = selectedReason === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={opt.id}
                      checked={isSelected}
                      onChange={() => setSelectedReason(opt.id)}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div className="text-xs">
                      <p className={`font-bold ${isSelected ? 'text-rose-900' : 'text-slate-800'}`}>
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isAr ? 'تفاصيل إضافية لمساعدة المشرفين (اختياري):' : 'Additional Details for Moderators (Optional):'}
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={
                isAr
                  ? 'اذكر أية مراجع أو توضيحات تسهم في التحقق السريع من المخالفة...'
                  : 'Provide any additional context or details for verification...'
              }
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              id="cancel-report-btn"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-1.5"
              id="submit-report-btn"
            >
              <Send size={13} />
              <span>{isAr ? 'إرسال البلاغ بهوية مجهولة' : 'Submit Anonymous Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
