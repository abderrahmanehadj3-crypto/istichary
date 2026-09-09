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
} from 'lucide-react';
import {
  ConsultationPost,
  ConsultationComment,
  UserAccount,
  Language,
  SpecializationId,
} from '../types';
import { translations } from '../i18n/translations';
import { SPECIALIZATIONS } from '../data/mockData';
import { RoleAvatar } from './RoleAvatar';
import { evaluateContent, checkUserCanPost } from '../utils/moderation';

interface PublicConsultationsViewProps {
  posts: ConsultationPost[];
  currentUser: UserAccount | null;
  lang: Language;
  onAddPost: (post: ConsultationPost) => void;
  onAddComment: (postId: string, comment: ConsultationComment) => void;
  onApplyPenalty: (penaltyType: 'banned' | 'restricted_48h', reason: string) => void;
  onRequestAuth: () => void;
}

export const PublicConsultationsView: React.FC<PublicConsultationsViewProps> = ({
  posts,
  currentUser,
  lang,
  onAddPost,
  onAddComment,
  onApplyPenalty,
  onRequestAuth,
}) => {
  const t = translations[lang];
  const [selectedSpecialty, setSelectedSpecialty] = useState<SpecializationId>('all');
  const [activePostId, setActivePostId] = useState<string | null>(posts[0]?.id || null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  // New Post Form State
  const [postTitle, setPostTitle] = useState('');
  const [postSpecialty, setPostSpecialty] = useState<SpecializationId>('general');
  const [postUrgency, setPostUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [postDescription, setPostDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Reply State
  const [replyContent, setReplyContent] = useState('');
  const [replyError, setReplyError] = useState('');

  // Active Post object
  const activePost = posts.find((p) => p.id === activePostId) || posts[0];

  // Filtered posts list
  const filteredPosts = posts.filter((p) => {
    if (selectedSpecialty === 'all') return true;
    return p.specializationId === selectedSpecialty;
  });

  // Check commenting permission for active post
  const isPostAuthor = currentUser && activePost && currentUser.id === activePost.authorId;
  const isDoctor = currentUser?.role === 'doctor';
  const isVerifiedDoctor = isDoctor && currentUser?.verificationStatus === 'verified';
  const canComment = isPostAuthor || isVerifiedDoctor;

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
        setFormError(moderation.reason);
        return;
      }
    }

    const newPost: ConsultationPost = {
      id: 'post-' + Date.now(),
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
    setActivePostId(newPost.id);
    setIsCreatingPost(false);
    setPostTitle('');
    setPostDescription('');
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    setReplyError('');

    if (!currentUser) {
      onRequestAuth();
      return;
    }

    if (!activePost) return;

    if (!canComment) {
      setReplyError(t.otherPatientBlockedNotice);
      return;
    }

    const permission = checkUserCanPost(currentUser);
    if (!permission.allowed) {
      setReplyError(permission.message || 'Commenting not permitted.');
      return;
    }

    // AI Content Moderation on replies
    const moderation = evaluateContent(replyContent);
    if (!moderation.allowed) {
      if (moderation.penaltyType === 'banned') {
        onApplyPenalty('banned', moderation.reason);
        setReplyError(moderation.reason);
        return;
      } else if (moderation.penaltyType === 'restricted_48h') {
        onApplyPenalty('restricted_48h', moderation.reason);
        setReplyError(moderation.reason);
        return;
      } else {
        setReplyError(moderation.reason);
        return;
      }
    }

    const newComment: ConsultationComment = {
      id: 'comm-' + Date.now(),
      postId: activePost.id,
      authorId: currentUser.id,
      authorUsername: currentUser.username,
      authorRole: currentUser.role,
      authorRealName: currentUser.showRealName ? currentUser.realName : undefined,
      isVerifiedDoctor: isVerifiedDoctor,
      authorSpecialty: currentUser.specialty,
      content: replyContent.trim(),
      timestamp: 'Just now',
      isDoctorRecommendation: isDoctor,
    };

    onAddComment(activePost.id, newComment);
    setReplyContent('');
  };

  return (
    <div id="public-consultations-container" className="space-y-4">
      {/* Top Banner: Privacy & Medical Protocol Safety Notice */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/40 border border-sky-100 dark:border-sky-900/40 text-slate-800 dark:text-slate-200">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400 shrink-0">
            <Lock size={20} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.publicConsultationsTitle}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                Direct DMs Disabled
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 flex items-center gap-1">
                <Sparkles size={11} /> AI Moderated
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.publicConsultationsSubtitle}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Info size={13} className="text-sky-500 shrink-0" />
              {t.doctorRepliesOnlyNotice}
            </p>
          </div>
        </div>
      </div>

      {/* Action Bar & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Specialization Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-400 dark:text-slate-500 shrink-0 flex items-center gap-1 pl-1">
            <Filter size={13} />
          </span>
          {SPECIALIZATIONS.map((spec) => (
            <button
              key={spec.id}
              onClick={() => setSelectedSpecialty(spec.id)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition font-medium text-xs ${
                selectedSpecialty === spec.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {spec.name}
            </button>
          ))}
        </div>

        {/* New Question Button */}
        <button
          id="btn-new-consultation"
          onClick={() => {
            if (!currentUser) {
              onRequestAuth();
            } else {
              setIsCreatingPost(true);
            }
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition shrink-0"
        >
          <MessageSquarePlus size={15} />
          <span>{t.newConsultationPost}</span>
        </button>
      </div>

      {/* Modal / Inline Creator for New Consultation */}
      {isCreatingPost && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-900 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquarePlus size={16} className="text-sky-600" />
              {t.newConsultationPost}
            </h3>
            <button
              onClick={() => setIsCreatingPost(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {t.cancel}
            </button>
          </div>

          {formError && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertOctagon size={15} className="shrink-0 mt-0.5 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleCreatePost} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Consultation Summary / Question
              </label>
              <input
                id="new-post-title"
                type="text"
                required
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder={t.postTitlePlaceholder}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t.selectSpecialty}
                </label>
                <select
                  id="new-post-specialty"
                  value={postSpecialty}
                  onChange={(e) => setPostSpecialty(e.target.value as SpecializationId)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {SPECIALIZATIONS.filter((s) => s.id !== 'all').map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Urgency Level
                </label>
                <select
                  id="new-post-urgency"
                  value={postUrgency}
                  onChange={(e) => setPostUrgency(e.target.value as 'low' | 'medium' | 'high')}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="low">Low / Non-Urgent</option>
                  <option value="medium">Standard Priority</option>
                  <option value="high">Urgent / High Priority</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Detailed Clinical Description
              </label>
              <textarea
                id="new-post-description"
                rows={3}
                required
                value={postDescription}
                onChange={(e) => setPostDescription(e.target.value)}
                placeholder={t.postSymptomsPlaceholder}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* AI Moderation Test Helper Shortcuts */}
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-500" />
                  AI Moderation Test Controls:
                </span>
                <span className="text-[10px] text-slate-400">Try auto-penalties</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  id="btn-test-abusive"
                  type="button"
                  onClick={() => {
                    setPostTitle('Question with insult');
                    setPostDescription('This is a test post containing idiot and moron insults to test instant ban.');
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 transition font-medium"
                >
                  {t.testModerationToxicity}
                </button>
                <button
                  id="btn-test-offtopic"
                  type="button"
                  onClick={() => {
                    setPostTitle('Special investment opportunity');
                    setPostDescription('Check out this forex trading bitcoin profit telegram signal cheap replica sales.');
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 transition font-medium"
                >
                  {t.testModerationOffTopic}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreatingPost(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                {t.cancel}
              </button>
              <button
                id="btn-submit-consultation"
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
              >
                {t.postConsultationBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Layout: Split Feed and Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Post Cards List */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[75vh] overflow-y-auto pr-1">
          {filteredPosts.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs">
              {t.noPostsYet}
            </div>
          ) : (
            filteredPosts.map((post) => {
              const isSelected = activePost?.id === post.id;
              const doctorCommentsCount = post.comments.filter((c) => c.authorRole === 'doctor').length;

              return (
                <div
                  key={post.id}
                  id={`post-card-${post.id}`}
                  onClick={() => setActivePostId(post.id)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition border text-left ${
                    isSelected
                      ? 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 shadow-xs'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border-slate-200/80 dark:border-slate-700/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <RoleAvatar role="patient" size="sm" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {post.authorUsername}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          post.urgency === 'high'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                            : post.urgency === 'medium'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                        }`}
                      >
                        {post.urgency === 'high' ? t.urgent : post.urgency === 'medium' ? t.normal : t.low}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {post.createdAt}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 mb-1">
                    {post.title}
                  </h4>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                    {post.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                    <span className="capitalize font-medium text-sky-600 dark:text-sky-400">
                      {post.specializationId}
                    </span>
                    <div className="flex items-center gap-1 font-medium">
                      <Stethoscope size={13} className="text-emerald-500" />
                      <span>{doctorCommentsCount} verified doctor {doctorCommentsCount === 1 ? 'reply' : 'replies'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Thread Details & Responses */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col justify-between min-h-[500px] max-h-[75vh]">
          {activePost ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Post Header */}
              <div className="pb-3 border-b border-slate-100 dark:border-slate-700/80 shrink-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <RoleAvatar role="patient" size="md" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {activePost.authorUsername}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                          {t.patientAuthorBadge}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{activePost.createdAt}</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900/50">
                    {activePost.specializationId.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                  {activePost.title}
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  {activePost.description}
                </p>
              </div>

              {/* Comments / Clinical Thread */}
              <div className="flex-1 overflow-y-auto py-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {t.discussionThread} ({activePost.comments.length})
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <ShieldCheck size={13} /> Only Author & Verified Doctors
                  </span>
                </div>

                {activePost.comments.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Awaiting clinical review from verified specialists.
                  </div>
                ) : (
                  activePost.comments.map((comm) => {
                    const isCommDoctor = comm.authorRole === 'doctor';
                    const isCommAuthor = comm.authorId === activePost.authorId;

                    return (
                      <div
                        key={comm.id}
                        id={`comment-${comm.id}`}
                        className={`p-3 rounded-xl border ${
                          isCommDoctor
                            ? 'bg-sky-50/50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/60'
                            : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-700/80'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <RoleAvatar
                              role={comm.authorRole}
                              size="sm"
                              verificationStatus={comm.isVerifiedDoctor ? 'verified' : undefined}
                            />
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {comm.authorRealName ? (
                                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                                    {comm.authorRealName}
                                  </span>
                                ) : null}
                                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                  {comm.authorUsername}
                                </span>
                                {isCommDoctor && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-semibold flex items-center gap-0.5">
                                    <ShieldCheck size={11} /> {t.verifiedDoctorBadge}
                                  </span>
                                )}
                                {isCommAuthor && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 font-semibold">
                                    {t.patientAuthorBadge}
                                  </span>
                                )}
                              </div>
                              {comm.authorSpecialty && (
                                <p className="text-[10px] text-sky-600 dark:text-sky-400">
                                  {comm.authorSpecialty}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400">{comm.timestamp}</span>
                        </div>

                        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed pl-8">
                          {comm.content}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply Section with Strict Access Control */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 shrink-0">
                {replyError && (
                  <div className="mb-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                    <span>{replyError}</span>
                  </div>
                )}

                {canComment ? (
                  <form onSubmit={handleSendReply} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        id="input-consultation-reply"
                        type="text"
                        required
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={t.replyPlaceholder}
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                      />
                      <button
                        id="btn-send-reply"
                        type="submit"
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Send size={13} />
                        <span>{t.sendReply}</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        Commenting as{' '}
                        <strong className="text-slate-700 dark:text-slate-300">
                          {currentUser?.username} ({isDoctor ? 'Doctor' : 'Author Patient'})
                        </strong>
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-sky-500">
                        <Sparkles size={11} /> AI Moderation Active
                      </span>
                    </div>
                  </form>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                    <Lock size={18} className="shrink-0 text-amber-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold">Participation Restricted by Medical Protocol</p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400/90 leading-relaxed">
                        {t.otherPatientBlockedNotice}
                      </p>
                      {!currentUser && (
                        <button
                          onClick={onRequestAuth}
                          className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline pt-0.5"
                        >
                          Sign in with your account →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
              Select a consultation from the list to read the clinical discussion.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
