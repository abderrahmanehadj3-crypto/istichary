import React, { useState } from 'react';
import {
  MessageSquarePlus,
  ShieldCheck,
  AlertTriangle,
  Send,
  Lock,
  Stethoscope,
  Clock,
  Filter,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  User,
  Info,
  Award,
  UserPlus,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Heart,
  MessageCircle,
  Share2,
  Star,
  Pencil,
  Trash2,
  Check,
} from 'lucide-react';
import {
  ConsultationPost,
  ConsultationComment,
  UserAccount,
  Language,
  SpecializationId,
  DoctorProfile,
} from '../types';
import { translations, getSpecialtyLabel, getUrgencyLabel } from '../i18n/translations';
import { SPECIALIZATIONS, MOCK_DOCTORS } from '../data/mockData';
import { RoleAvatar } from './RoleAvatar';
import { evaluateContent, checkUserCanPost } from '../utils/moderation';
import { formatRelativeTime } from '../utils/timeAgo';

interface PublicConsultationsViewProps {
  posts: ConsultationPost[];
  currentUser: UserAccount | null;
  lang: Language;
  followedDoctorIds: string[];
  onToggleFollowDoctor: (doctorId: string) => void;
  onAddPost: (post: ConsultationPost) => void;
  onEditPost?: (postId: string, updatedData: Partial<ConsultationPost>) => void;
  onDeletePost?: (postId: string) => void;
  onAddComment: (postId: string, comment: ConsultationComment) => void;
  onEditComment?: (postId: string, commentId: string, newContent: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
  onApplyPenalty: (penaltyType: 'banned' | 'restricted_48h', reason: string) => void;
  onRequestAuth: () => void;
  doctors?: DoctorProfile[];
  onOpenRatingModal?: (doctor: DoctorProfile) => void;
  onLikePost?: (postId: string) => void;
}

export const PublicConsultationsView: React.FC<PublicConsultationsViewProps> = ({
  posts,
  currentUser,
  lang,
  followedDoctorIds,
  onToggleFollowDoctor,
  onAddPost,
  onEditPost,
  onDeletePost,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onApplyPenalty,
  onRequestAuth,
  doctors = MOCK_DOCTORS,
  onOpenRatingModal,
  onLikePost,
}) => {
  const t = translations[lang];
  const [selectedSpecialty, setSelectedSpecialty] = useState<SpecializationId | 'followed'>('all');
  const [expandedPostIds, setExpandedPostIds] = useState<Record<string, boolean>>({});
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  // New Post Form State
  const [postTitle, setPostTitle] = useState('');
  const [postSpecialty, setPostSpecialty] = useState<SpecializationId>('general');
  const [postUrgency, setPostUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [postDescription, setPostDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Per-post reply inputs
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [replyErrors, setReplyErrors] = useState<Record<string, string>>({});

  // Post Edit State
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editPostSpecialty, setEditPostSpecialty] = useState<SpecializationId>('general');
  const [editPostUrgency, setEditPostUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [editPostDescription, setEditPostDescription] = useState('');
  const [editPostError, setEditPostError] = useState('');

  // Post Delete Confirmation State
  const [confirmDeletePostId, setConfirmDeletePostId] = useState<string | null>(null);

  // Comment Edit State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [editingCommentError, setEditingCommentError] = useState('');

  // Comment Delete Confirmation State
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState<string | null>(null);

  const startEditingPost = (post: ConsultationPost) => {
    setEditingPostId(post.id);
    setEditPostTitle(post.title);
    setEditPostSpecialty(post.specializationId);
    setEditPostUrgency(post.urgency);
    setEditPostDescription(post.description);
    setEditPostError('');
    setConfirmDeletePostId(null);
  };

  const cancelEditingPost = () => {
    setEditingPostId(null);
    setEditPostError('');
  };

  const handleSavePostEdit = (postId: string) => {
    setEditPostError('');
    if (!editPostTitle.trim() || !editPostDescription.trim()) {
      setEditPostError(t.fillRequiredFields);
      return;
    }

    const moderation = evaluateContent(`${editPostTitle} ${editPostDescription}`);
    if (!moderation.allowed) {
      if (moderation.penaltyType === 'banned') {
        onApplyPenalty('banned', moderation.reason);
        setEditPostError(moderation.reason);
        return;
      } else if (moderation.penaltyType === 'restricted_48h') {
        onApplyPenalty('restricted_48h', moderation.reason);
        setEditPostError(moderation.reason);
        return;
      } else {
        setEditPostError(`Content moderation alert: ${moderation.reason}`);
        return;
      }
    }

    onEditPost?.(postId, {
      title: editPostTitle.trim(),
      specializationId: editPostSpecialty,
      urgency: editPostUrgency,
      description: editPostDescription.trim(),
    });
    setEditingPostId(null);
  };

  const handleConfirmDeletePost = (postId: string) => {
    onDeletePost?.(postId);
    setConfirmDeletePostId(null);
    if (editingPostId === postId) {
      setEditingPostId(null);
    }
  };

  const startEditingComment = (comment: ConsultationComment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content);
    setEditingCommentError('');
    setConfirmDeleteCommentId(null);
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingCommentError('');
  };

  const handleSaveCommentEdit = (postId: string, commentId: string) => {
    setEditingCommentError('');
    if (!editingCommentText.trim()) {
      setEditingCommentError(t.fillRequiredFields);
      return;
    }

    const moderation = evaluateContent(editingCommentText);
    if (!moderation.allowed) {
      if (moderation.penaltyType === 'banned') {
        onApplyPenalty('banned', moderation.reason);
        setEditingCommentError(moderation.reason);
        return;
      } else if (moderation.penaltyType === 'restricted_48h') {
        onApplyPenalty('restricted_48h', moderation.reason);
        setEditingCommentError(moderation.reason);
        return;
      } else {
        setEditingCommentError(`Content moderation alert: ${moderation.reason}`);
        return;
      }
    }

    onEditComment?.(postId, commentId, editingCommentText.trim());
    setEditingCommentId(null);
  };

  const handleConfirmDeleteComment = (postId: string, commentId: string) => {
    onDeleteComment?.(postId, commentId);
    setConfirmDeleteCommentId(null);
    if (editingCommentId === commentId) {
      setEditingCommentId(null);
    }
  };

  const toggleExpandPost = (postId: string) => {
    setExpandedPostIds((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // Doctor role check for clinical priority triage
  const isDoctorUser = currentUser?.role === 'doctor';

  // Filtered posts by specialty or followed
  const baseFilteredPosts = posts.filter((p) => {
    if (selectedSpecialty === 'all') return true;
    if (selectedSpecialty === 'followed') {
      // Show posts where at least one comment is from a followed doctor
      return p.comments.some(
        (c) => c.authorDoctorId && followedDoctorIds.includes(c.authorDoctorId)
      );
    }
    return p.specializationId === selectedSpecialty;
  });

  // Strict sorting rule:
  // For doctors: Urgent/Emergency ('high') consultations MUST appear at the very top!
  const filteredPosts = [...baseFilteredPosts].sort((a, b) => {
    if (isDoctorUser) {
      const isUrgentA = a.urgency === 'high';
      const isUrgentB = b.urgency === 'high';
      if (isUrgentA && !isUrgentB) return -1;
      if (!isUrgentA && isUrgentB) return 1;

      // Secondary ranking for doctors (medium urgency before low)
      const rank = (u: string) => (u === 'high' ? 3 : u === 'medium' ? 2 : 1);
      const rankDiff = rank(b.urgency) - rank(a.urgency);
      if (rankDiff !== 0) return rankDiff;
    }

    // Chronological ordering (newest first)
    const timeA = new Date(a.createdAt).getTime() || 0;
    const timeB = new Date(b.createdAt).getTime() || 0;
    return timeB - timeA;
  });

  const urgentEmergencyCount = filteredPosts.filter((p) => p.urgency === 'high').length;

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!currentUser) {
      onRequestAuth();
      return;
    }

    const permission = checkUserCanPost(currentUser);
    if (!permission.allowed) {
      setFormError(permission.message || 'Posting not permitted.');
      return;
    }

    if (!postTitle.trim() || !postDescription.trim()) {
      setFormError(t.fillRequiredFields);
      return;
    }

    // AI Content Moderation
    const moderation = evaluateContent(`${postTitle} ${postDescription}`);
    if (!moderation.allowed) {
      if (moderation.penaltyType === 'banned') {
        onApplyPenalty('banned', moderation.reason);
        setFormError(moderation.reason);
        return;
      } else if (moderation.penaltyType === 'restricted_48h') {
        onApplyPenalty('restricted_48h', moderation.reason);
        setFormError(moderation.reason);
        return;
      } else {
        setFormError(`Content moderation alert: ${moderation.reason}`);
        return;
      }
    }

    const newPost: ConsultationPost = {
      id: `post-${Date.now()}`,
      authorId: currentUser.id,
      authorUsername: currentUser.username,
      authorRole: currentUser.role,
      authorRealName: currentUser.role === 'doctor' && currentUser.showRealName ? currentUser.realName : undefined,
      authorSpecialty: currentUser.role === 'doctor' ? currentUser.specialty : undefined,
      title: postTitle.trim(),
      specializationId: postSpecialty,
      description: postDescription.trim(),
      urgency: postUrgency,
      createdAt: new Date().toISOString(),
      comments: [],
    };

    onAddPost(newPost);
    setPostTitle('');
    setPostDescription('');
    setIsComposerOpen(false);
    setExpandedPostIds((prev) => ({ ...prev, [newPost.id]: true }));
  };

  const handleSendComment = (postId: string) => {
    const text = replyInputs[postId]?.trim();
    if (!text) return;

    if (!currentUser) {
      onRequestAuth();
      return;
    }

    const permission = checkUserCanPost(currentUser);
    if (!permission.allowed) {
      setReplyErrors((prev) => ({
        ...prev,
        [postId]: permission.message || 'Account restricted.',
      }));
      return;
    }

    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost) return;

    const isAuthor = currentUser.id === targetPost.authorId;
    const isDoctor = currentUser.role === 'doctor';
    const isVerifiedDoc = isDoctor && currentUser.verificationStatus === 'verified';

    if (!isAuthor && !isVerifiedDoc) {
      setReplyErrors((prev) => ({
        ...prev,
        [postId]: t.otherPatientBlockedNotice,
      }));
      return;
    }

    // AI Content Moderation on comment
    const moderation = evaluateContent(text);
    if (!moderation.allowed) {
      if (moderation.penaltyType === 'banned') {
        onApplyPenalty('banned', moderation.reason);
      } else if (moderation.penaltyType === 'restricted_48h') {
        onApplyPenalty('restricted_48h', moderation.reason);
      }
      setReplyErrors((prev) => ({
        ...prev,
        [postId]: `Moderation alert: ${moderation.reason}`,
      }));
      return;
    }

    // Match doctor ID if doctor
    const docProfile = isDoctor
      ? MOCK_DOCTORS.find((d) => d.userId === currentUser.id || d.username === currentUser.username)
      : null;

    const newComment: ConsultationComment = {
      id: `comm-${Date.now()}`,
      postId,
      authorId: currentUser.id,
      authorDoctorId: docProfile?.id || (isDoctor ? currentUser.id : undefined),
      authorUsername: currentUser.username,
      authorRole: currentUser.role,
      authorRealName: currentUser.showRealName ? currentUser.realName : undefined,
      isVerifiedDoctor: isVerifiedDoc,
      authorSpecialty: isDoctor ? currentUser.specialty || 'Medical Specialist' : undefined,
      authorLicenseNumber: isDoctor ? currentUser.medicalLicenseNumber : undefined,
      content: text,
      timestamp: new Date().toISOString(),
      isDoctorRecommendation: isDoctor,
    };

    onAddComment(postId, newComment);
    setReplyInputs((prev) => ({ ...prev, [postId]: '' }));
    setReplyErrors((prev) => ({ ...prev, [postId]: '' }));
  };

  return (
    <div id="public-consultations-feed" className="space-y-4 pb-12">
      {/* 1. PROMINENT POST INPUT FIELD AT THE TOP */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-sky-200 dark:border-slate-700 p-4 shadow-sm space-y-3">
        {!isComposerOpen ? (
          <div className="flex items-center gap-3">
            <RoleAvatar
              role={currentUser?.role || 'patient'}
              size="md"
              verificationStatus={currentUser?.verificationStatus}
            />
            <button
              id="btn-open-post-composer"
              type="button"
              onClick={() => {
                if (!currentUser) {
                  onRequestAuth();
                } else {
                  setIsComposerOpen(true);
                }
              }}
              className="flex-1 text-start px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200/70 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs font-medium transition flex items-center justify-between group cursor-pointer"
            >
              <span>{t.homePostInputPlaceholder}</span>
              <MessageSquarePlus size={16} className="text-sky-600 dark:text-sky-400 group-hover:scale-110 transition shrink-0" />
            </button>
          </div>
        ) : (
          /* Expanded Medical Post Inquiry Composer */
          <form id="form-create-consultation" onSubmit={handleCreatePost} className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
              <div className="flex items-center gap-2">
                <Stethoscope size={16} className="text-sky-600 dark:text-sky-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {t.newConsultationPost}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-semibold px-2 py-0.5 rounded-lg"
              >
                {t.cancel}
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.inquirySummaryLabel}
              </label>
              <input
                id="input-post-title"
                type="text"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder={t.postTitlePlaceholder}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.selectSpecialty}
                </label>
                <select
                  id="select-post-specialty"
                  value={postSpecialty}
                  onChange={(e) => setPostSpecialty(e.target.value as SpecializationId)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  {SPECIALIZATIONS.filter((s) => s.id !== 'all').map((s) => (
                    <option key={s.id} value={s.id}>
                      {getSpecialtyLabel(s.id, t)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.urgencyLevelLabel}
                </label>
                <div className="flex gap-1.5">
                  {(['low', 'medium', 'high'] as const).map((urg) => (
                    <button
                      key={urg}
                      type="button"
                      onClick={() => setPostUrgency(urg)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-semibold capitalize border transition cursor-pointer ${
                        postUrgency === urg
                          ? urg === 'high'
                            ? 'bg-rose-500 text-white border-rose-600'
                            : urg === 'medium'
                            ? 'bg-amber-500 text-white border-amber-600'
                            : 'bg-emerald-500 text-white border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {getUrgencyLabel(urg, t)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.inquiryDetailsLabel}
              </label>
              <textarea
                id="input-post-description"
                rows={3}
                value={postDescription}
                onChange={(e) => setPostDescription(e.target.value)}
                placeholder={t.postSymptomsPlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <ShieldCheck size={13} className="text-sky-600" />
                <span>Responses provided exclusively by verified specialists.</span>
              </div>

              <button
                id="btn-publish-consultation"
                type="submit"
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Send size={13} />
                <span>{t.publishInquiryBtn}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. SPECIALTY & FOLLOWED FILTER PILLS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          id="filter-specialty-all"
          onClick={() => setSelectedSpecialty('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            selectedSpecialty === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          {t.allSpecialties}
        </button>

        {/* Dedicated Followed Specialists Filter */}
        <button
          id="filter-specialty-followed"
          onClick={() => setSelectedSpecialty('followed')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1 cursor-pointer ${
            selectedSpecialty === 'followed'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80 hover:bg-amber-50'
          }`}
        >
          <Award size={13} />
          <span>{t.filterFollowedOnly} ({followedDoctorIds.length})</span>
        </button>

        {SPECIALIZATIONS.filter((s) => s.id !== 'all').map((spec) => (
          <button
            key={spec.id}
            id={`filter-specialty-${spec.id}`}
            onClick={() => setSelectedSpecialty(spec.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedSpecialty === spec.id
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {getSpecialtyLabel(spec.id, t)}
          </button>
        ))}
      </div>

      {/* 3. DOCTOR EMERGENCY TRIAGE BANNER */}
      {isDoctorUser && urgentEmergencyCount > 0 && (
        <div
          id="doctor-emergency-triage-banner"
          className="p-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-md border border-red-400/40 flex items-center justify-between gap-3 animate-in fade-in"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-xs ring-2 ring-white/30">
              <AlertTriangle size={20} className="text-white fill-white/20 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider bg-white text-red-700 px-2 py-0.5 rounded-md shadow-xs">
                  {lang === 'ar' ? '🚨 أولوية الطوارئ للأطباء' : lang === 'fr' ? '🚨 PRIORITÉ URGENCES' : '🚨 DOCTOR EMERGENCY PRIORITY'}
                </span>
                <span className="text-xs font-bold text-red-100">
                  {urgentEmergencyCount} {lang === 'ar' ? 'حالة مستعجلة في صدارة القائمة' : 'urgent case(s) prioritized at the top'}
                </span>
              </div>
              <p className="text-[11px] text-red-100/90 mt-0.5">
                {lang === 'ar'
                  ? 'تم فرز الاستشارات الطارئة في الصدارة وتحديدها باللون الأحمر لسرعة التدخل الطبي.'
                  : lang === 'fr'
                  ? 'Consultations urgentes affichées en tête et surlignées en rouge pour prise en charge rapide.'
                  : 'Urgent consultations are prioritized at the top and highlighted in red for immediate medical response.'}
              </p>
            </div>
          </div>
          <span className="shrink-0 px-2.5 py-1 bg-white/20 text-white text-[11px] font-extrabold rounded-xl border border-white/30 whitespace-nowrap">
            {urgentEmergencyCount} {lang === 'ar' ? 'عاجل' : 'Urgent'}
          </span>
        </div>
      )}

      {/* 4. CONSULTATION POSTS FEED */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <Info size={28} className="mx-auto text-slate-400" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t.noPostsYet}
            </p>
            {selectedSpecialty === 'followed' && (
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                {t.noFollowedDoctors}
              </p>
            )}
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isExpanded = !!expandedPostIds[post.id];
            const isPostAuthor = Boolean(
              currentUser && (post.authorId === currentUser.id || post.authorUsername === currentUser.username)
            );
            const isDoctor = currentUser?.role === 'doctor';
            const isVerifiedDoc = isDoctor && currentUser?.verificationStatus === 'verified';
            const canReply = isPostAuthor || isVerifiedDoc;
            const isUrgent = post.urgency === 'high';

            return (
              <article
                key={post.id}
                id={`consultation-post-${post.id}`}
                className={`rounded-2xl p-4 shadow-xs space-y-3.5 transition-all ${
                  isUrgent
                    ? 'bg-red-50/70 dark:bg-red-950/30 border-2 border-red-500 dark:border-red-500/90 shadow-md shadow-red-500/10 ring-1 ring-red-500/30'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {/* Prominent Emergency Banner for Urgent Cases */}
                {isUrgent && (
                  <div
                    id={`emergency-banner-post-${post.id}`}
                    className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-red-600 text-white shadow-xs text-xs font-bold -mt-0.5 mb-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                      <span className="uppercase tracking-wider font-black text-[11px] flex items-center gap-1.5">
                        <AlertTriangle size={13} className="fill-white/20 text-white" />
                        {lang === 'ar'
                          ? 'استشارة طبية مستعجلة • أولوية قصوى'
                          : lang === 'fr'
                          ? 'CONSULTATION MÉDICALE URGENTE • PRIORITÉ MAX'
                          : 'EMERGENCY MEDICAL CONSULTATION • HIGH PRIORITY'}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-black uppercase tracking-wider">
                      {lang === 'ar' ? 'طوارئ' : 'URGENT'}
                    </span>
                  </div>
                )}

                {/* Post Top Row: Author, Time, Urgency, and Post Owner Action Buttons */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <RoleAvatar role={post.authorRole || 'patient'} size="sm" />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {post.authorRealName || post.authorUsername}
                        </span>
                        {post.authorRole === 'doctor' ? (
                          <span className="px-1.5 py-0.2 rounded-md bg-sky-100 dark:bg-sky-950 text-[10px] font-semibold text-sky-700 dark:text-sky-300">
                            {t.doctorAuthorBadge}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                            {t.patientAuthorBadge}
                          </span>
                        )}
                        {post.authorRole === 'doctor' && post.authorSpecialty && (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                            ({post.authorSpecialty})
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock size={11} />
                        <span>{formatRelativeTime(post.createdAt, lang)}</span>
                        {post.isEdited && (
                          <span className="text-[10px] text-slate-400 font-medium italic">
                            ({t.editedBadge})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {/* Post Owner Edit & Delete Buttons */}
                    {isPostAuthor && (
                      <div className="flex items-center gap-1 mr-1">
                        <button
                          id={`btn-edit-post-${post.id}`}
                          type="button"
                          onClick={() => startEditingPost(post)}
                          className="px-2 py-1 rounded-xl text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center gap-1 transition cursor-pointer"
                          title={t.editPost}
                        >
                          <Pencil size={11} />
                          <span>{t.editPost}</span>
                        </button>
                        <button
                          id={`btn-delete-post-${post.id}`}
                          type="button"
                          onClick={() => setConfirmDeletePostId(post.id)}
                          className="px-2 py-1 rounded-xl text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center gap-1 transition cursor-pointer"
                          title={t.deletePost}
                        >
                          <Trash2 size={11} />
                          <span>{t.deletePost}</span>
                        </button>
                      </div>
                    )}

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                        isUrgent
                          ? 'bg-red-600 text-white shadow-xs ring-2 ring-red-400/50'
                          : post.urgency === 'medium'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      }`}
                    >
                      {isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                      {getUrgencyLabel(post.urgency, t)}
                    </span>

                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 capitalize">
                      {getSpecialtyLabel(post.specializationId, t)}
                    </span>
                  </div>
                </div>

                {/* Confirm Delete Post Prompt */}
                {confirmDeletePostId === post.id && (
                  <div
                    id={`post-delete-confirm-${post.id}`}
                    className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 space-y-2 text-xs"
                  >
                    <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-200">
                      <AlertTriangle size={15} className="text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>{t.deletePostConfirmTitle}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      {t.deletePostConfirmDesc}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        id={`btn-confirm-delete-post-${post.id}`}
                        type="button"
                        onClick={() => handleConfirmDeletePost(post.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer"
                      >
                        {t.confirmDelete}
                      </button>
                      <button
                        id={`btn-cancel-delete-post-${post.id}`}
                        type="button"
                        onClick={() => setConfirmDeletePostId(null)}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs transition cursor-pointer"
                      >
                        {t.cancel}
                      </button>
                    </div>
                  </div>
                )}

                {/* Edit Post Form Mode */}
                {editingPostId === post.id ? (
                  <div
                    id={`post-edit-form-${post.id}`}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-sky-200 dark:border-sky-800/60 space-y-3"
                  >
                    {editPostError && (
                      <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                        {editPostError}
                      </div>
                    )}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t.inquirySummaryLabel}
                      </label>
                      <input
                        id={`input-edit-post-title-${post.id}`}
                        type="text"
                        value={editPostTitle}
                        onChange={(e) => setEditPostTitle(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t.selectSpecialty}
                        </label>
                        <select
                          id={`select-edit-post-specialty-${post.id}`}
                          value={editPostSpecialty}
                          onChange={(e) => setEditPostSpecialty(e.target.value as SpecializationId)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                        >
                          {SPECIALIZATIONS.filter((s) => s.id !== 'all').map((s) => (
                            <option key={s.id} value={s.id}>
                              {getSpecialtyLabel(s.id, t)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t.urgencyLevelLabel}
                        </label>
                        <div className="flex gap-1.5">
                          {(['low', 'medium', 'high'] as const).map((urg) => (
                            <button
                              key={urg}
                              type="button"
                              onClick={() => setEditPostUrgency(urg)}
                              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold capitalize border transition cursor-pointer ${
                                editPostUrgency === urg
                                  ? urg === 'high'
                                    ? 'bg-rose-500 text-white border-rose-600'
                                    : urg === 'medium'
                                    ? 'bg-amber-500 text-white border-amber-600'
                                    : 'bg-emerald-500 text-white border-emerald-600'
                                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {getUrgencyLabel(urg, t)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t.inquiryDetailsLabel}
                      </label>
                      <textarea
                        id={`textarea-edit-post-desc-${post.id}`}
                        rows={3}
                        value={editPostDescription}
                        onChange={(e) => setEditPostDescription(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        id={`btn-cancel-edit-post-${post.id}`}
                        type="button"
                        onClick={cancelEditingPost}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
                      >
                        {t.cancel}
                      </button>
                      <button
                        id={`btn-save-edit-post-${post.id}`}
                        type="button"
                        onClick={() => handleSavePostEdit(post.id)}
                        className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check size={13} />
                        <span>{t.saveChanges}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Post Title & Description */
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                      {post.description}
                    </p>
                  </div>
                )}

                {/* Discussion Thread Stats / Expand Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      id={`btn-like-post-${post.id}`}
                      type="button"
                      onClick={() => onLikePost && onLikePost(post.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition cursor-pointer"
                    >
                      <Heart size={14} className={post.likesCount ? 'fill-rose-500 text-rose-500' : ''} />
                      <span>{post.likesCount || 0}</span>
                    </button>

                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                      <MessageCircle size={14} className="text-sky-600" />
                      <span>
                        {post.comments.length} {post.comments.length === 1 ? 'Specialist Response' : 'Clinical Responses'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleExpandPost(post.id)}
                    className="flex items-center gap-1 font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Guidance' : 'View Clinical Guidance'}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* EXPANDED DOCTOR RESPONSES & REPLIES */}
                {isExpanded && (
                  <div className="space-y-3 pt-1">
                    {/* List of comments */}
                    {post.comments.length === 0 ? (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 text-center">
                        Awaiting certified specialist response. Our verified physician network has received this notification.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {post.comments.map((comment) => {
                          const isDocComment = comment.authorRole === 'doctor';
                          const isCommentAuthor = Boolean(
                            currentUser && (comment.authorId === currentUser.id || comment.authorUsername === currentUser.username)
                          );
                          const docProfile = isDocComment
                            ? (doctors || MOCK_DOCTORS).find(
                                (d) =>
                                  d.id === comment.authorDoctorId ||
                                  d.userId === comment.authorId ||
                                  d.username === comment.authorUsername
                              )
                            : null;

                          // Check if followed
                          const isFollowed =
                            comment.authorDoctorId &&
                            followedDoctorIds.includes(comment.authorDoctorId);

                          return (
                            <div
                              key={comment.id}
                              id={`comment-card-${comment.id}`}
                              className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                                isDocComment
                                  ? 'bg-sky-50/50 dark:bg-slate-900/90 border-sky-200 dark:border-sky-900/60 shadow-2xs'
                                  : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 ml-4'
                              }`}
                            >
                              {/* Commenter Header */}
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <RoleAvatar
                                    role={comment.authorRole}
                                    size="sm"
                                    verificationStatus={comment.isVerifiedDoctor ? 'verified' : undefined}
                                  />

                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-slate-900 dark:text-white">
                                        {comment.authorRealName || comment.authorUsername}
                                      </span>

                                      {comment.authorRealName && (
                                        <span className="text-[11px] text-slate-400 font-mono">
                                          {comment.authorUsername}
                                        </span>
                                      )}

                                      {/* MANDATORY PROMINENT DOCTOR SPECIALTY DISPLAY */}
                                      {isDocComment && comment.authorSpecialty && (
                                        <span
                                          id={`prominent-doctor-specialty-${comment.id}`}
                                          className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs flex items-center gap-1"
                                        >
                                          <Award size={12} className="text-emerald-600 dark:text-emerald-400" />
                                          <span>{comment.authorSpecialty}</span>
                                        </span>
                                      )}

                                      {/* DOCTOR STAR RATING SYSTEM DISPLAY */}
                                      {isDocComment && docProfile && (
                                        <div
                                          id={`comment-doc-rating-${comment.id}`}
                                          className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 text-[10px] font-bold text-amber-800 dark:text-amber-300"
                                        >
                                          <Star size={10} className="fill-amber-400 text-amber-500" />
                                          <span>{docProfile.rating.toFixed(1)}</span>
                                          <span className="text-[9px] text-amber-600/80 font-normal">
                                            ({docProfile.reviewCount})
                                          </span>
                                        </div>
                                      )}

                                      {comment.authorLicenseNumber && (
                                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                          {comment.authorLicenseNumber}
                                        </span>
                                      )}
                                    </div>

                                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                      <Clock size={10} />
                                      <span>{formatRelativeTime(comment.timestamp, lang)}</span>
                                      {comment.isEdited && (
                                        <span className="text-[10px] text-slate-400 font-medium italic">
                                          ({t.editedBadge})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {/* Author Edit & Delete Comment Buttons */}
                                  {isCommentAuthor && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        id={`btn-edit-comment-${comment.id}`}
                                        type="button"
                                        onClick={() => startEditingComment(comment)}
                                        className="p-1 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                        title={t.editComment}
                                      >
                                        <Pencil size={12} />
                                      </button>
                                      <button
                                        id={`btn-delete-comment-${comment.id}`}
                                        type="button"
                                        onClick={() => setConfirmDeleteCommentId(comment.id)}
                                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                                        title={t.deleteComment}
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  )}

                                  {/* 1. RATE DOCTOR BUTTON */}
                                  {isDocComment && docProfile && onOpenRatingModal && (
                                    <button
                                      id={`btn-rate-doc-${docProfile.id}`}
                                      type="button"
                                      onClick={() => {
                                        if (!currentUser) {
                                          onRequestAuth();
                                        } else {
                                          onOpenRatingModal(docProfile);
                                        }
                                      }}
                                      className="px-2 py-1 rounded-xl text-[11px] font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition flex items-center gap-1 cursor-pointer"
                                      title="Rate Doctor"
                                    >
                                      <Star size={11} className="fill-amber-400 text-amber-500" />
                                      <span>{t.rateDoctor}</span>
                                    </button>
                                  )}

                                  {/* 4. FOLLOW FEATURE BUTTON ON DOCTOR RESPONSE */}
                                  {isDocComment && comment.authorDoctorId && (
                                    <button
                                      id={`btn-follow-doctor-${comment.authorDoctorId}`}
                                      type="button"
                                      onClick={() => {
                                        if (!currentUser) {
                                          onRequestAuth();
                                        } else {
                                          onToggleFollowDoctor(comment.authorDoctorId!);
                                        }
                                      }}
                                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                        isFollowed
                                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                          : 'bg-white dark:bg-slate-800 hover:bg-slate-100 text-sky-700 dark:text-sky-300 border border-slate-200 dark:border-slate-700'
                                      }`}
                                    >
                                      {isFollowed ? (
                                        <>
                                          <UserCheck size={12} className="text-amber-600 dark:text-amber-400" />
                                          <span>{t.followingDoctor}</span>
                                        </>
                                      ) : (
                                        <>
                                          <UserPlus size={12} className="text-sky-600 dark:text-sky-400" />
                                          <span>{t.followDoctor}</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Comment Content / Confirm Delete / Inline Edit */}
                              {confirmDeleteCommentId === comment.id ? (
                                <div
                                  id={`comment-delete-confirm-${comment.id}`}
                                  className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 space-y-1.5 text-xs"
                                >
                                  <p className="font-semibold text-rose-800 dark:text-rose-200 text-[11px]">
                                    {t.deleteCommentConfirmDesc}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <button
                                      id={`btn-confirm-delete-comment-${comment.id}`}
                                      type="button"
                                      onClick={() => handleConfirmDeleteComment(post.id, comment.id)}
                                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition cursor-pointer"
                                    >
                                      {t.confirmDelete}
                                    </button>
                                    <button
                                      id={`btn-cancel-delete-comment-${comment.id}`}
                                      type="button"
                                      onClick={() => setConfirmDeleteCommentId(null)}
                                      className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-[11px] transition cursor-pointer"
                                    >
                                      {t.cancel}
                                    </button>
                                  </div>
                                </div>
                              ) : editingCommentId === comment.id ? (
                                <div id={`comment-edit-form-${comment.id}`} className="space-y-2 pt-1">
                                  {editingCommentError && (
                                    <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-700 dark:text-rose-300">
                                      {editingCommentError}
                                    </div>
                                  )}
                                  <textarea
                                    id={`textarea-edit-comment-${comment.id}`}
                                    rows={2}
                                    value={editingCommentText}
                                    onChange={(e) => setEditingCommentText(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
                                  />
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      id={`btn-cancel-edit-comment-${comment.id}`}
                                      type="button"
                                      onClick={cancelEditingComment}
                                      className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition cursor-pointer"
                                    >
                                      {t.cancel}
                                    </button>
                                    <button
                                      id={`btn-save-edit-comment-${comment.id}`}
                                      type="button"
                                      onClick={() => handleSaveCommentEdit(post.id, comment.id)}
                                      className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                                    >
                                      <Check size={11} />
                                      <span>{t.saveChanges}</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-slate-700 dark:text-slate-200 leading-relaxed pl-1">
                                  {comment.content}
                                </div>
                              )}

                              {comment.isDoctorRecommendation && (
                                <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 pt-1 border-t border-sky-100 dark:border-slate-800">
                                  <ShieldCheck size={12} />
                                  <span>Official Clinical Guidance • Medical Opinion</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* REPLY COMPOSER BOX */}
                    <div className="pt-2">
                      {replyErrors[post.id] && (
                        <div className="mb-2 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                          {replyErrors[post.id]}
                        </div>
                      )}

                      {!currentUser ? (
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
                          <p>Sign in to post medical replies or ask follow-up questions.</p>
                          <button
                            onClick={onRequestAuth}
                            className="px-4 py-1.5 rounded-xl bg-sky-600 text-white font-semibold text-xs hover:bg-sky-700 transition"
                          >
                            {t.signIn}
                          </button>
                        </div>
                      ) : canReply ? (
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <textarea
                              id={`input-reply-${post.id}`}
                              rows={2}
                              value={replyInputs[post.id] || ''}
                              onChange={(e) =>
                                setReplyInputs((prev) => ({
                                  ...prev,
                                  [post.id]: e.target.value,
                                }))
                              }
                              placeholder={
                                isVerifiedDoc
                                  ? t.doctorAdvicePlaceholder
                                  : t.patientFollowUpPlaceholder
                              }
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
                            />
                          </div>
                          <button
                            id={`btn-send-reply-${post.id}`}
                            type="button"
                            onClick={() => handleSendComment(post.id)}
                            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <Send size={13} />
                            <span>{t.sendReply}</span>
                          </button>
                        </div>
                      ) : (
                        /* Block other patients from responding */
                        <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <Lock size={14} className="shrink-0 text-slate-400" />
                          <span>{t.doctorRepliesOnlyNotice}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
