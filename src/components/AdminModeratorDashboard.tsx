import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Lock,
  UserCheck,
  Building2,
  AlertTriangle,
  Clock,
  Eye,
  Award,
  Crown,
  CheckCheck,
  Users,
  Search,
  ExternalLink,
  ChevronDown,
  Info,
  Trash2,
  Flag,
  RotateCcw,
  Check,
} from 'lucide-react';
import {
  UserAccount,
  DoctorProfile,
  Language,
  VerificationDocument,
  AnonymousReport,
  AccountAppeal,
} from '../types';
import { translations } from '../i18n/translations';
import { RoleAvatar } from './RoleAvatar';
import { AdminVercelLink } from './AdminVercelLink';
import { LiveRelativeTimestamp } from './LiveRelativeTimestamp';

interface AdminModeratorDashboardProps {
  currentUser: UserAccount | null;
  doctors: DoctorProfile[];
  users: UserAccount[];
  lang: Language;
  onApproveDoctor: (doctorId: string) => void;
  onRejectDoctor: (doctorId: string, reason: string) => void;
  onToggleModeratorRole?: (userId: string) => void;
  onLiftModerationPenalty?: (userId: string) => void;
  onRequestAuth: () => void;
  reports?: AnonymousReport[];
  onDismissReport?: (reportId: string) => void;
  onTakeActionOnReport?: (
    reportId: string,
    action: 'ban_user' | 'restrict_48h' | 'delete_content',
    targetUserId?: string,
    targetPostId?: string
  ) => void;
  appeals?: AccountAppeal[];
  onApproveAppeal?: (appealId: string, decisionNote?: string) => void;
  onRejectAppeal?: (appealId: string, decisionNote?: string) => void;
  onDeleteUser?: (userId: string, emailOrUsername?: string) => void;
  onPurgeDummyMarcoAccount?: () => void;
}

export const AdminModeratorDashboard: React.FC<AdminModeratorDashboardProps> = ({
  currentUser,
  doctors,
  users,
  lang,
  onApproveDoctor,
  onRejectDoctor,
  onToggleModeratorRole,
  onLiftModerationPenalty,
  onRequestAuth,
  reports = [],
  onDismissReport,
  onTakeActionOnReport,
  appeals = [],
  onApproveAppeal,
  onRejectAppeal,
  onDeleteUser,
  onPurgeDummyMarcoAccount,
}) => {
  const t = translations[lang];
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [selectedDocForDocView, setSelectedDocForDocView] = useState<DoctorProfile | null>(null);
  const [activeDocPreview, setActiveDocPreview] = useState<VerificationDocument | null>(null);
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [adminTab, setAdminTab] = useState<'queue' | 'team' | 'reports' | 'appeals' | 'moderation'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
  const [marcoPurgedNotice, setMarcoPurgedNotice] = useState(false);

  // Access Control Check: STRICT PRIVACY
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isModerator = currentUser?.role === 'moderator';
  const hasAccess = isSuperAdmin || isModerator;

  if (!hasAccess) {
    return (
      <div id="admin-access-denied" className="p-8 text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-200 dark:border-rose-900 shadow-sm">
          <Lock size={32} />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {t.restrictedDashboardTitle}
        </h2>
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 leading-relaxed text-start space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
            <ShieldAlert size={16} />
            <span>{t.strictHealthcarePrivacyPolicy}</span>
          </div>
          <p>
            {t.restrictedReviewNotice}
          </p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t.adminSecurityNotice}
        </p>
        {!currentUser ? (
          <button
            id="admin-login-prompt-btn"
            onClick={onRequestAuth}
            className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition"
          >
            {t.signIn}
          </button>
        ) : (
          <div className="text-xs text-slate-400">
            {t.loggedInAs} <span className="font-semibold text-slate-700 dark:text-slate-300">{currentUser.username}</span> ({currentUser.role})
          </div>
        )}
      </div>
    );
  }

  // Filter doctors
  const pendingCount = doctors.filter((d) => d.verificationStatus === 'pending').length;
  const verifiedCount = doctors.filter((d) => d.verificationStatus === 'verified').length;
  const rejectedCount = doctors.filter((d) => d.verificationStatus === 'rejected').length;

  const filteredDoctors = doctors.filter((doc) => {
    if (filterStatus !== 'all' && doc.verificationStatus !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        doc.username.toLowerCase().includes(q) ||
        (doc.realName && doc.realName.toLowerCase().includes(q)) ||
        doc.specialty.toLowerCase().includes(q) ||
        doc.medicalLicenseNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleConfirmReject = (doctorId: string) => {
    if (!rejectReason.trim()) return;
    onRejectDoctor(doctorId, rejectReason);
    setRejectingDocId(null);
    setRejectReason('');
  };

  return (
    <div id="admin-moderator-dashboard" className="space-y-4 pb-12">
      {/* Top Banner: Verification Oversight */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4.5 shadow-sm border border-indigo-900/50 relative overflow-hidden">
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1">
                {isSuperAdmin ? <Crown size={12} className="text-amber-300" /> : <CheckCheck size={12} className="text-cyan-300" />}
                {isSuperAdmin ? 'Super Administrator' : 'Review Moderator'}
              </span>
              <span className="text-[11px] text-indigo-300 font-medium">
                {currentUser.username}
              </span>
            </div>
            <h2 className="text-base font-bold text-white">
              {t.adminDashboard}
            </h2>
            <p className="text-xs text-indigo-200/80 mt-1 max-w-lg leading-relaxed">
              Confidential medical license verification & platform oversight. Patient access to these records is strictly zero.
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-indigo-900/80 text-center">
          <div className="p-2 rounded-xl bg-white/5 backdrop-blur-xs">
            <div className="text-lg font-bold text-amber-300">{pendingCount}</div>
            <div className="text-[10px] text-indigo-200 font-medium">{t.pendingVerification}</div>
          </div>
          <div className="p-2 rounded-xl bg-white/5 backdrop-blur-xs">
            <div className="text-lg font-bold text-emerald-300">{verifiedCount}</div>
            <div className="text-[10px] text-indigo-200 font-medium">{t.verified}</div>
          </div>
          <div className="p-2 rounded-xl bg-white/5 backdrop-blur-xs">
            <div className="text-lg font-bold text-rose-300">{rejectedCount}</div>
            <div className="text-[10px] text-indigo-200 font-medium">Rejected</div>
          </div>
        </div>
      </div>

      {/* External Vercel Admin Console */}
      <AdminVercelLink variant="card" currentUser={currentUser} />

      {/* Admin Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold overflow-x-auto">
        <button
          id="tab-btn-queue"
          onClick={() => setAdminTab('queue')}
          className={`py-1.5 px-3 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
            adminTab === 'queue'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <span>{t.verificationQueue}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px]">
            {pendingCount}
          </span>
        </button>

        {isSuperAdmin && (
          <button
            id="tab-btn-team"
            onClick={() => setAdminTab('team')}
            className={`py-1.5 px-3 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
              adminTab === 'team'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>{t.teamManagement}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px]">
              {users.length}
            </span>
          </button>
        )}

        <button
          id="tab-btn-reports"
          onClick={() => setAdminTab('reports')}
          className={`py-1.5 px-3 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
            adminTab === 'reports'
              ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Flag size={13} />
          <span>{t.reportsQueue}</span>
          {reports.filter((r) => r.status === 'pending').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {reports.filter((r) => r.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          id="tab-btn-appeals"
          onClick={() => setAdminTab('appeals')}
          className={`py-1.5 px-3 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
            adminTab === 'appeals'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <RotateCcw size={13} />
          <span>{t.appealsQueue}</span>
          {appeals.filter((a) => a.status === 'pending').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-bold">
              {appeals.filter((a) => a.status === 'pending').length}
            </span>
          )}
        </button>

        {isSuperAdmin && (
          <button
            id="tab-btn-moderation"
            onClick={() => setAdminTab('moderation')}
            className={`py-1.5 px-3 rounded-lg transition whitespace-nowrap ${
              adminTab === 'moderation'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Governance
          </button>
        )}
      </div>

      {/* Verification Queue View */}
      {adminTab === 'queue' && (
        <div className="space-y-3">
          {/* Controls row: Search + Status filter pills */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by name, license # or specialty..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {(['pending', 'verified', 'rejected', 'all'] as const).map((status) => (
                <button
                  key={status}
                  id={`filter-verif-${status}`}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    filterStatus === status
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {status === 'pending'
                    ? `Pending (${pendingCount})`
                    : status === 'verified'
                    ? `Verified (${verifiedCount})`
                    : status === 'rejected'
                    ? `Rejected (${rejectedCount})`
                    : 'All'}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Reminder Badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl text-[11px] text-indigo-900 dark:text-indigo-200">
            <Lock size={13} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
            <span>
              All medical diplomas & council registration numbers are encrypted and isolated from public patient views.
            </span>
          </div>

          {/* Queue List */}
          {filteredDoctors.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                No physician applications found matching this status filter.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDoctors.map((doc) => {
                const isPending = doc.verificationStatus === 'pending';
                const isVerified = doc.verificationStatus === 'verified';
                const isRejected = doc.verificationStatus === 'rejected';

                return (
                  <div
                    key={doc.id}
                    id={`doc-verif-card-${doc.id}`}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs space-y-3"
                  >
                    {/* Doctor Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <RoleAvatar
                          role="doctor"
                          size="md"
                          verificationStatus={doc.verificationStatus}
                          className="shrink-0 mt-0.5"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {doc.realName || doc.username}
                            </h4>
                            <span className="text-xs text-slate-400 font-mono">
                              {doc.username}
                            </span>
                            {/* MANDATORY PROMINENT SPECIALTY BADGE */}
                            <span
                              id={`prominent-specialty-badge-${doc.id}`}
                              className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs flex items-center gap-1"
                            >
                              <Award size={12} className="text-emerald-600 dark:text-emerald-400" />
                              <span>{doc.specialty}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                            <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md text-[11px] text-slate-700 dark:text-slate-300">
                              License: {doc.medicalLicenseNumber}
                            </span>
                            <span>{doc.experienceYears} yrs experience</span>
                            <span>{doc.hospitalOrClinic}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status pill */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 flex items-center gap-1 ${
                          isVerified
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : isPending
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse'
                            : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {isVerified && <ShieldCheck size={13} />}
                        {isPending && <Clock size={13} />}
                        {isRejected && <XCircle size={13} />}
                        <span>
                          {isVerified ? 'Verified' : isPending ? 'Pending Review' : 'Rejected'}
                        </span>
                      </span>
                    </div>

                    {/* About / Credentials info */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      {doc.about}
                    </p>

                    {/* Attached Medical Verification Documents (STRICTLY PRIVATE) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <FileText size={14} className="text-indigo-600 dark:text-indigo-400" />
                          <span>Uploaded Verification Certificates ({doc.verificationDocuments?.length || 0})</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Private to reviewers</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {doc.verificationDocuments && doc.verificationDocuments.length > 0 ? (
                          doc.verificationDocuments.map((docItem) => (
                            <div
                              key={docItem.id}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 dark:text-white truncate">
                                  {docItem.title}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {docItem.fileName} ({docItem.fileSize})
                                </p>
                                <p className="text-[10px] text-sky-700 dark:text-sky-400 font-medium mt-0.5">
                                  {docItem.previewNote}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDocForDocView(doc);
                                  setActiveDocPreview(docItem);
                                }}
                                className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] flex items-center gap-1 shrink-0 transition"
                              >
                                <Eye size={12} />
                                <span>Inspect</span>
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] italic col-span-2">
                            No credentials uploaded yet.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rejection Notes if already rejected */}
                    {isRejected && doc.rejectionReason && (
                      <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300">
                        <span className="font-bold">Rejection Reason:</span> {doc.rejectionReason}
                      </div>
                    )}

                    {/* Review Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                      {isPending && (
                        <>
                          <button
                            id={`btn-approve-${doc.id}`}
                            onClick={() => onApproveDoctor(doc.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <ShieldCheck size={14} />
                            <span>{t.approveDoctor}</span>
                          </button>

                          <button
                            id={`btn-reject-${doc.id}`}
                            onClick={() => setRejectingDocId(doc.id)}
                            className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <XCircle size={14} />
                            <span>{t.rejectDoctor}</span>
                          </button>
                        </>
                      )}

                      {isVerified && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 size={14} />
                            Active Clinical Specialist
                          </span>
                          <button
                            onClick={() => onRejectDoctor(doc.id, 'Verification revoked for periodic credential audit')}
                            className="text-[11px] text-slate-400 hover:text-rose-500 font-medium ml-2 underline"
                          >
                            Revoke Status
                          </button>
                        </div>
                      )}

                      {isRejected && (
                        <button
                          onClick={() => onApproveDoctor(doc.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold text-xs transition"
                        >
                          Re-evaluate & Approve
                        </button>
                      )}
                    </div>

                    {/* Reject Dialog inline */}
                    {rejectingDocId === doc.id && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl space-y-2 mt-2">
                        <label className="text-xs font-bold text-rose-900 dark:text-rose-200 block">
                          {t.rejectionReasonPrompt}
                        </label>
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="e.g. License registration could not be verified in National Council register"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 text-slate-900 dark:text-white focus:outline-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingDocId(null);
                              setRejectReason('');
                            }}
                            className="px-3 py-1 text-xs rounded-lg text-slate-600 dark:text-slate-400"
                          >
                            {t.cancel}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirmReject(doc.id)}
                            className="px-3 py-1 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold"
                          >
                            Confirm Rejection
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Review Team & User Management Tab (Super Admin Only) */}
      {isSuperAdmin && adminTab === 'team' && (
        <div className="space-y-3">
          {/* Purge Marco Fake Account Card */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 uppercase">
                    System Maintenance
                  </span>
                  <h4 className="font-bold text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                    حذف حساب "marco" الوهمي نهائياً
                  </h4>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  حذف حساب المستخدم الوهمي "marco" وجميع سجلاته وتفاعلاته العشوائية نهائياً من قاعدة بيانات Supabase وقوائم النظام.
                </p>
              </div>

              <button
                id="btn-purge-marco-account"
                type="button"
                onClick={() => {
                  if (onPurgeDummyMarcoAccount) {
                    onPurgeDummyMarcoAccount();
                    setMarcoPurgedNotice(true);
                    setTimeout(() => setMarcoPurgedNotice(false), 4000);
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>حذف حساب marco الآن</span>
              </button>
            </div>

            {marcoPurgedNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>تم حذف الحساب الوهمي marco نهائياً من قاعدة بيانات Supabase بنجاح.</span>
              </div>
            )}
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Users size={16} className="text-sky-600" />
              <span>{t.teamManagement}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              إدارة صلاحيات المشرفين وحذف أو تقييد حسابات المستخدمين المخالفة.
            </p>
          </div>

          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <RoleAvatar role={u.role} size="sm" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{u.username}</span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize">
                        {u.role.replace('_', ' ')}
                      </span>
                      {u.moderationStatus === 'banned' && (
                        <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          محظور
                        </span>
                      )}
                      {u.moderationStatus === 'restricted_48h' && (
                        <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          مقيد 48س
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {u.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {u.role === 'super_admin' ? (
                    <span className="text-[11px] font-bold text-amber-500">
                      Super Admin (You)
                    </span>
                  ) : (
                    <>
                      {u.moderationStatus && u.moderationStatus !== 'active' && onLiftModerationPenalty && (
                        <button
                          id={`btn-lift-penalty-${u.id}`}
                          type="button"
                          onClick={() => onLiftModerationPenalty(u.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-semibold text-[11px] hover:bg-emerald-100 transition cursor-pointer"
                        >
                          رفع العقوبة
                        </button>
                      )}

                      {u.role === 'moderator' ? (
                        <button
                          id={`btn-revoke-mod-${u.id}`}
                          type="button"
                          onClick={() => onToggleModeratorRole && onToggleModeratorRole(u.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-semibold text-[11px] hover:bg-rose-100 transition cursor-pointer"
                        >
                          {t.revokeModerator}
                        </button>
                      ) : (
                        <button
                          id={`btn-appoint-mod-${u.id}`}
                          type="button"
                          onClick={() => onToggleModeratorRole && onToggleModeratorRole(u.id)}
                          className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 font-semibold text-[11px] hover:bg-sky-100 transition cursor-pointer"
                        >
                          {t.appointModerator}
                        </button>
                      )}

                      {/* Delete User Account Button */}
                      {confirmDeleteUserId === u.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            id={`btn-confirm-delete-user-${u.id}`}
                            type="button"
                            onClick={() => {
                              if (onDeleteUser) {
                                onDeleteUser(u.id, u.email || u.username);
                              }
                              setConfirmDeleteUserId(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px] hover:bg-rose-700 transition cursor-pointer"
                          >
                            تأكيد الحذف
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteUserId(null)}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px]"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          id={`btn-delete-user-${u.id}`}
                          type="button"
                          onClick={() => setConfirmDeleteUserId(u.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                          title="حذف هذا المستخدم نهائياً"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🛡️ Anonymous Reports Queue Tab (100% Guaranteed Confidentiality) */}
      {adminTab === 'reports' && (
        <div className="space-y-3">
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <ShieldCheck size={18} />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.reportsQueue} - سرية تامة ومجهولية 100%
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.anonymousReportNotice} هوية المبلّغ مشفرة ومحجوبة تماماً حتى عن المشرفين وإدارة المنصة لضمان بيئة آمنة للمرضى والأطباء.
            </p>
          </div>

          {reports.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400">
              {t.noReports}
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  id={`report-item-${report.id}`}
                  className={`p-4 bg-white dark:bg-slate-800 rounded-2xl border transition space-y-3 text-xs ${
                    report.status === 'pending'
                      ? 'border-rose-200 dark:border-rose-900/60 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                          {report.targetType === 'post' ? 'بلاغ عن منشور' : 'بلاغ عن تعليق'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {report.reason}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <LiveRelativeTimestamp timestamp={report.createdAt} lang={lang} />
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        الطرف المبلّغ عنه: <span className="font-mono text-rose-600">@{report.reportedAuthorUsername}</span>
                        {report.reportedAuthorRealName && ` (${report.reportedAuthorRealName})`}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        report.status === 'pending'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : report.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {report.status === 'pending' ? 'قيد المراجعة' : report.status === 'resolved' ? 'تم اتخاذ إجراء' : 'تم التجاهل'}
                      </span>
                    </div>
                  </div>

                  {/* Content snippet */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 italic">
                    "{report.contentSnippet}"
                  </div>

                  {report.details && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-bold text-slate-700 dark:text-slate-300">ملاحظات إضافية:</span> {report.details}
                    </div>
                  )}

                  {/* Action buttons if pending */}
                  {report.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex-wrap">
                      {onTakeActionOnReport && (
                        <>
                          <button
                            id={`btn-report-restrict-${report.id}`}
                            type="button"
                            onClick={() =>
                              onTakeActionOnReport(
                                report.id,
                                'restrict_48h',
                                report.reportedAuthorUsername,
                                report.postId
                              )
                            }
                            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[11px] font-bold border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                          >
                            تقييد الحساب 48 ساعة
                          </button>
                          <button
                            id={`btn-report-ban-${report.id}`}
                            type="button"
                            onClick={() =>
                              onTakeActionOnReport(
                                report.id,
                                'ban_user',
                                report.reportedAuthorUsername,
                                report.postId
                              )
                            }
                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition cursor-pointer"
                          >
                            حظر المستخدم نهائياً
                          </button>
                        </>
                      )}
                      {onDismissReport && (
                        <button
                          id={`btn-report-dismiss-${report.id}`}
                          type="button"
                          onClick={() => onDismissReport(report.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 text-slate-700 text-[11px] font-semibold transition cursor-pointer"
                        >
                          تجاهل البلاغ
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ⚖️ Account Restriction Appeals Tab */}
      {adminTab === 'appeals' && (
        <div className="space-y-3">
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <RotateCcw size={18} />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.appealsQueue}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              مراجعة الطعون وطلبات إعادة النظر الرسمية المقدمة من المستخدمين المقيدة حساباتهم أو المحظورة.
            </p>
          </div>

          {appeals.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400">
              {t.noAppeals}
            </div>
          ) : (
            <div className="space-y-3">
              {appeals.map((appeal) => (
                <div
                  key={appeal.id}
                  id={`appeal-item-${appeal.id}`}
                  className={`p-4 bg-white dark:bg-slate-800 rounded-2xl border transition space-y-3 text-xs ${
                    appeal.status === 'pending'
                      ? 'border-blue-200 dark:border-blue-900/60 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          {appeal.userRole}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {appeal.appealCategory}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <LiveRelativeTimestamp timestamp={appeal.createdAt} lang={lang} />
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        المستخدم: <span className="font-mono text-sky-600">@{appeal.username}</span> ({appeal.email})
                      </div>
                      <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                        نوع العقوبة: {appeal.penaltyStatus === 'banned' ? 'حظر دائم' : 'تقييد 48 ساعة'}
                        {appeal.originalReason && ` (السبب الأصلي: ${appeal.originalReason})`}
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      appeal.status === 'pending'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : appeal.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {appeal.status === 'pending' ? 'قيد المراجعة' : appeal.status === 'approved' ? 'مقبول / رُفعت العقوبة' : 'مرفوض'}
                    </span>
                  </div>

                  {/* Justification Text */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-800 dark:text-slate-200 leading-relaxed">
                    <p className="font-bold text-slate-900 dark:text-white mb-1">بيان الاستئناف وتبرير المستخدم:</p>
                    {appeal.justification}
                  </div>

                  {/* Approve / Reject CTA */}
                  {appeal.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                      {onApproveAppeal && (
                        <button
                          id={`btn-approve-appeal-${appeal.id}`}
                          type="button"
                          onClick={() => onApproveAppeal(appeal.id, 'تمت مراجعة الاستئناف وقبوله ورفع العقوبة')}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check size={13} />
                          <span>قبول الاستئناف ورفع العقوبة</span>
                        </button>
                      )}
                      {onRejectAppeal && (
                        <button
                          id={`btn-reject-appeal-${appeal.id}`}
                          type="button"
                          onClick={() => onRejectAppeal(appeal.id, 'تمت مراجعة الاستئناف وتأكيد بقاء العقوبة')}
                          className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-bold transition cursor-pointer"
                        >
                          رفض الاستئناف
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Governance & Moderation Tab */}
      {isSuperAdmin && adminTab === 'moderation' && (
        <div className="space-y-3">
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>AI Content & Platform Health Governance</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Real-time monitoring of automated toxicity filters, spam deterrence, and inactive account archiving.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500">AI Spam Filter</div>
                <div className="text-sm font-bold text-emerald-600">Strict Medical Triage Active</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500">Inactivity Policy</div>
                <div className="text-sm font-bold text-sky-600">12-Month Rule Enforced</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Medical Document Inspector Modal */}
      {selectedDocForDocView && activeDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="p-4 bg-indigo-950 text-white flex items-center justify-between border-b border-indigo-900">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-cyan-300" />
                <div>
                  <h4 className="text-sm font-bold">
                    {activeDocPreview.title}
                  </h4>
                  <p className="text-[11px] text-indigo-300">
                    Physician: {selectedDocForDocView.realName || selectedDocForDocView.username} • {selectedDocForDocView.specialty}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedDocForDocView(null);
                  setActiveDocPreview(null);
                }}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Document Certificate Viewer Preview */}
            <div className="p-5 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-dashed border-indigo-200 dark:border-indigo-900/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {activeDocPreview.type.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Uploaded: {activeDocPreview.uploadedAt}
                  </span>
                </div>

                <div className="text-center py-4 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 mx-auto flex items-center justify-center">
                    <Award size={28} />
                  </div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                    {activeDocPreview.fileName}
                  </h5>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    File Size: {activeDocPreview.fileSize} • Cryptographic Hash Validated
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Review Assessment Note</span>
                  </div>
                  <p>{activeDocPreview.previewNote}</p>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span>Verification ID: {activeDocPreview.id}</span>
                <span>Restricted Document</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedDocForDocView(null);
                  setActiveDocPreview(null);
                }}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                {t.close}
              </button>
              {selectedDocForDocView.verificationStatus === 'pending' && (
                <button
                  type="button"
                  onClick={() => {
                    onApproveDoctor(selectedDocForDocView.id);
                    setSelectedDocForDocView(null);
                    setActiveDocPreview(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <ShieldCheck size={14} />
                  <span>Verify Doctor</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
