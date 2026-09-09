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
} from 'lucide-react';
import {
  ConsultationPost,
  ConsultationComment,
  UserAccount,
  Language,
  SpecializationId,
} from '../types';
import { translations } from '../i18n/translations';
import { SPECIALIZATIONS, MOCK_DOCTORS } from '../data/mockData';
import { RoleAvatar } from './RoleAvatar';
import { evaluateContent, checkUserCanPost } from '../utils/moderation';

interface PublicConsultationsViewProps {
  posts: ConsultationPost[];
  currentUser: UserAccount | null;
  lang: Language;
  followedDoctorIds: string[];
  onToggleFollowDoctor: (doctorId: string) => void;
  onAddPost: (post: ConsultationPost) => void;
  onAddComment: (postId: string, comment: ConsultationComment) => void;
  onApplyPenalty: (penaltyType: 'banned' | 'restricted_48h', reason: string) => void;
  onRequestAuth: () => void;
}

export const PublicConsultationsView: React.FC<PublicConsultationsViewProps> = ({
  posts,
  currentUser,
  lang,
  followedDoctorIds,
  onToggleFollowDoctor,
  onAddPost,
  onAddComment,
  onApplyPenalty,
  onRequestAuth,
}) => {
  const t = translations[lang];
  const [selectedSpecialty, setSelectedSpecialty] = useState<SpecializationId | 'followed'>('all');
  const [expandedPostIds, setExpandedPostIds] = useState<Record<string, boolean>>({
    'post-101': true,
  });
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

  const toggleExpandPost = (postId: string) => {
    setExpandedPostIds((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // Filtered posts
  const filteredPosts = posts.filter((p) => {
    if (selectedSpecialty === 'all') return true;
    if (selectedSpecialty === 'followed') {
      // Show posts where at least one comment is from a followed doctor
      return p.comments.some(
        (c) => c.authorDoctorId && followedDoctorIds.includes(c.authorDoctorId)
      );
    }
    return p.specializationId === selectedSpecialty;
  });

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
      setFormError('Please provide both an inquiry title and symptom description.');
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
      authorRole: 'patient',
      title: postTitle.trim(),
      specializationId: postSpecialty,
      description: postDescription.trim(),
      urgency: postUrgency,
      createdAt: 'Just now',
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
      timestamp: 'Just now',
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
                Inquiry Summary / Primary Symptom
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
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Symptom Urgency Level
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
                      {urg}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Detailed Medical Inquiry Description
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
            {spec.name}
          </button>
        ))}
      </div>

      {/* 3. CONSULTATION POSTS FEED */}
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
            const isPostAuthor = currentUser && post.authorId === currentUser.id;
            const isDoctor = currentUser?.role === 'doctor';
            const isVerifiedDoc = isDoctor && currentUser?.verificationStatus === 'verified';
            const canReply = isPostAuthor || isVerifiedDoc;

            return (
              <article
                key={post.id}
                id={`consultation-post-${post.id}`}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs space-y-3.5"
              >
                {/* Post Top Row: Author, Time, Urgency */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <RoleAvatar role="patient" size="sm" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {post.authorUsername}
                        </span>
                        <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          {t.patientAuthorBadge}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock size={11} />
                        <span>{post.createdAt}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        post.urgency === 'high'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                          : post.urgency === 'medium'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      }`}
                    >
                      {post.urgency}
                    </span>

                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 capitalize">
                      {post.specializationId}
                    </span>
                  </div>
                </div>

                {/* Post Title & Description */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    {post.description}
                  </p>
                </div>

                {/* Discussion Thread Stats / Expand Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                    <MessageCircle size={14} className="text-sky-600" />
                    <span>
                      {post.comments.length} {post.comments.length === 1 ? 'Specialist Response' : 'Clinical Responses'}
                    </span>
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

                                      {comment.authorLicenseNumber && (
                                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                          {comment.authorLicenseNumber}
                                        </span>
                                      )}
                                    </div>

                                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                      <Clock size={10} />
                                      <span>{comment.timestamp}</span>
                                    </div>
                                  </div>
                                </div>

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

                              {/* Comment Content */}
                              <div className="text-slate-700 dark:text-slate-200 leading-relaxed pl-1">
                                {comment.content}
                              </div>

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
