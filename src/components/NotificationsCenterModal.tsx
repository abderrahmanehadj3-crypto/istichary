import React, { useState } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  Heart,
  MessageSquare,
  Star,
  UserPlus,
  ShieldCheck,
  Trash2,
  ExternalLink,
  Award,
} from 'lucide-react';
import { AppNotification, Language, NotificationType } from '../types';
import { translations } from '../i18n/translations';
import { formatRelativeTime } from '../utils/timeAgo';

interface NotificationsCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  lang: Language;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onNotificationClick: (notif: AppNotification) => void;
}

export const NotificationsCenterModal: React.FC<NotificationsCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  lang,
  onMarkAllAsRead,
  onClearAll,
  onNotificationClick,
}) => {
  const t = translations[lang];
  const [activeFilter, setActiveFilter] = useState<'all' | 'follow' | 'reply' | 'interaction'>('all');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'follow') return n.type === 'follow';
    if (activeFilter === 'reply') return n.type === 'reply';
    if (activeFilter === 'interaction') return n.type === 'rating' || n.type === 'like';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'follow':
        return <UserPlus size={16} className="text-amber-500" />;
      case 'reply':
        return <MessageSquare size={16} className="text-sky-500" />;
      case 'rating':
        return <Star size={16} className="text-amber-400 fill-amber-400" />;
      case 'like':
        return <Heart size={16} className="text-rose-500 fill-rose-500" />;
      default:
        return <Bell size={16} className="text-sky-500" />;
    }
  };

  return (
    <div
      id="notifications-center-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center relative">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                {t.notificationsTitle}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {unreadCount > 0
                  ? `${unreadCount} ${t.unreadAlertsCount}`
                  : t.allNotificationsRead}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="p-1.5 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title={t.markAllAsRead}
              >
                <CheckCheck size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Categories / Filter Pills */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {t.allNotifications}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('follow')}
            className={`px-3 py-1 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'follow'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {t.followNotifications}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('reply')}
            className={`px-3 py-1 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'reply'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {t.replyNotifications}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('interaction')}
            className={`px-3 py-1 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'interaction'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {t.interactionNotifications}
          </button>
        </div>

        {/* Notifications Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Bell size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t.noNotifications}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              return (
                <div
                  key={notif.id}
                  id={`notif-card-${notif.id}`}
                  onClick={() => onNotificationClick(notif)}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                    notif.isRead
                      ? 'bg-white dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      : 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60 shadow-2xs hover:border-sky-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-white dark:bg-slate-800 shadow-2xs">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {notif.actorUsername}
                          </span>
                          {notif.actorSpecialty && (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 rounded-md">
                              {notif.actorSpecialty}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                      {formatRelativeTime(notif.timestamp, lang)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-8">
                    {notif.message}
                  </p>

                  {notif.stars && (
                    <div className="pl-8 flex items-center gap-1 text-amber-500 text-xs">
                      {[...Array(notif.stars)].map((_, i) => (
                        <Star key={i} size={13} className="fill-amber-400" />
                      ))}
                    </div>
                  )}

                  <div className="pl-8 flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span className="font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                      {t.viewDetails} <ExternalLink size={10} />
                    </span>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        {notifications.length > 0 && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onClearAll}
              className="text-rose-600 dark:text-rose-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={12} />
              <span>{t.clearAllNotifications}</span>
            </button>

            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer"
            >
              {t.markAllAsRead}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
