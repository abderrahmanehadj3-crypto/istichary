import React, { useState } from 'react';
import {
  ExternalLink,
  Shield,
  Settings,
  Check,
  RotateCcw,
  X,
  Lock,
} from 'lucide-react';
import {
  getAdminDashboardUrl,
  saveAdminDashboardUrl,
  resetAdminDashboardUrl,
  openAdminDashboardUrl,
  DEFAULT_VERCEL_ADMIN_URL,
} from '../utils/adminLink';
import { UserAccount } from '../types';

interface AdminVercelLinkProps {
  variant?: 'header' | 'footer' | 'badge' | 'card';
  currentUser?: UserAccount | null;
  className?: string;
  showConfigureOption?: boolean;
}

export const AdminVercelLink: React.FC<AdminVercelLinkProps> = ({
  variant = 'header',
  currentUser,
  className = '',
  showConfigureOption = true,
}) => {
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState(() => getAdminDashboardUrl());
  const [copied, setCopied] = useState(false);

  const isAdmin =
    currentUser?.role === 'super_admin' || currentUser?.role === 'moderator';

  const handleClick = (e: React.MouseEvent) => {
    // If holding Alt / Option or Shift key, open configuration dialog instead
    if (e.altKey || e.shiftKey) {
      e.preventDefault();
      setTempUrl(getAdminDashboardUrl());
      setIsConfigModalOpen(true);
      return;
    }

    // Default: open the Vercel admin URL securely
    openAdminDashboardUrl();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempUrl.trim()) {
      saveAdminDashboardUrl(tempUrl.trim());
      setIsConfigModalOpen(false);
      openAdminDashboardUrl(tempUrl.trim());
    }
  };

  const handleReset = () => {
    resetAdminDashboardUrl();
    setTempUrl(DEFAULT_VERCEL_ADMIN_URL);
  };

  const configModal = isConfigModalOpen && (
    <div
      id="admin-vercel-config-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => setIsConfigModalOpen(false)}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
              <Shield size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Admin Dashboard (Vercel)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Configure your external Vercel dashboard URL
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsConfigModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Vercel URL
            </label>
            <input
              type="text"
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              placeholder="https://your-admin-dashboard.vercel.app"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-mono"
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              Tip: Shift+click or Alt+click the button anytime to reopen this configuration.
            </p>
          </div>

          <div className="flex items-center justify-between pt-1 gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition flex items-center gap-1"
              >
                <Check size={13} />
                <span>Save & Open</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  // Variant: Header Utility (Subtle, sleek, discreet)
  if (variant === 'header') {
    return (
      <>
        <button
          id="header-admin-vercel-btn"
          type="button"
          onClick={handleClick}
          onContextMenu={(e) => {
            e.preventDefault();
            setTempUrl(getAdminDashboardUrl());
            setIsConfigModalOpen(true);
          }}
          title={
            isAdmin
              ? 'External Admin Dashboard (Vercel) • Alt+Click to edit URL'
              : 'External Admin Console • Alt+Click to edit URL'
          }
          className={`relative p-2 rounded-xl border transition cursor-pointer flex items-center justify-center ${
            isAdmin
              ? 'bg-violet-50/70 dark:bg-violet-950/40 border-violet-200/80 dark:border-violet-800/60 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/50 shadow-2xs'
              : 'bg-slate-100/80 dark:bg-slate-800/70 border-slate-200/70 dark:border-slate-700/60 text-slate-400/80 dark:text-slate-500/80 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700 shadow-2xs'
          } ${className}`}
        >
          <ExternalLink size={14} className="transition-transform group-hover:scale-105" />
          {isAdmin && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-violet-500 ring-2 ring-white dark:ring-slate-900" />
          )}
        </button>
        {configModal}
      </>
    );
  }

  // Variant: Footer (Very subtle and discreet text/micro-link)
  if (variant === 'footer') {
    return (
      <>
        <button
          id="footer-admin-vercel-link"
          type="button"
          onClick={handleClick}
          onContextMenu={(e) => {
            e.preventDefault();
            setTempUrl(getAdminDashboardUrl());
            setIsConfigModalOpen(true);
          }}
          title="Admin Console (Vercel) • Alt+Click to edit"
          className={`inline-flex items-center gap-1 text-[10px] text-slate-400/70 hover:text-slate-600 dark:text-slate-500/70 dark:hover:text-slate-300 transition cursor-pointer select-none ${className}`}
        >
          <span className="hover:underline">Admin</span>
          <ExternalLink size={9} className="opacity-70" />
        </button>
        {configModal}
      </>
    );
  }

  // Variant: Badge/Toolbar
  if (variant === 'badge') {
    return (
      <>
        <button
          id="toolbar-admin-vercel-btn"
          type="button"
          onClick={handleClick}
          title="External Admin Dashboard (Vercel) • Alt+Click to configure"
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer ${className}`}
        >
          <Lock size={10} className="opacity-60" />
          <span>Admin</span>
          <ExternalLink size={9} className="opacity-60" />
        </button>
        {configModal}
      </>
    );
  }

  // Variant: Card (Used inside AdminModeratorDashboard)
  return (
    <>
      <div
        id="card-admin-vercel-link"
        className={`p-3.5 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border border-violet-200/80 dark:border-violet-800/60 flex items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Shield size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-violet-950 dark:text-violet-200">
              <span>External Admin Dashboard</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-violet-200/80 dark:bg-violet-900 text-violet-800 dark:text-violet-300">
                Vercel
              </span>
            </div>
            <p className="text-[11px] text-violet-700/80 dark:text-violet-400 truncate max-w-xs sm:max-w-md">
              {getAdminDashboardUrl()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setTempUrl(getAdminDashboardUrl());
              setIsConfigModalOpen(true);
            }}
            title="Configure Vercel URL"
            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-700/60 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition cursor-pointer"
          >
            <Settings size={13} />
          </button>
          <button
            type="button"
            onClick={() => openAdminDashboardUrl()}
            className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open</span>
            <ExternalLink size={12} />
          </button>
        </div>
      </div>
      {configModal}
    </>
  );
};
