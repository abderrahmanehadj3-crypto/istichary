import React, { useState, useRef, useEffect, useCallback } from 'react';
import { HeartPulse, Check } from 'lucide-react';
import { Language } from '../types';

interface HeartbeatPullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  lang?: Language;
  className?: string;
  id?: string;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
}

export const HeartbeatPullToRefresh: React.FC<HeartbeatPullToRefreshProps> = ({
  onRefresh,
  children,
  lang = 'ar',
  className = '',
  id = 'heartbeat-pull-to-refresh',
  scrollContainerRef,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const startYRef = useRef<number | null>(null);
  const internalContainerRef = useRef<HTMLDivElement>(null);

  const getScrollContainer = useCallback((): HTMLElement | null => {
    if (scrollContainerRef && scrollContainerRef.current) {
      return scrollContainerRef.current;
    }
    return internalContainerRef.current;
  }, [scrollContainerRef]);

  const threshold = 60;
  const maxPull = 95;

  const triggerRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setPullDistance(52); // Keep indicator visible at comfortable height

    try {
      await onRefresh();
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
      }, 700);
    } catch (err) {
      console.warn('[PullToRefresh] Refresh failed:', err);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 400);
    }
  }, [isRefreshing, onRefresh]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isRefreshing) return;
    const container = getScrollContainer();
    const scrollTop = container ? container.scrollTop : 0;

    // Only initiate pull when scroll is strictly at the top
    if (scrollTop <= 2) {
      startYRef.current = e.touches[0].clientY;
    } else {
      startYRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isRefreshing || startYRef.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    const container = getScrollContainer();
    const scrollTop = container ? container.scrollTop : 0;

    if (diff > 0 && scrollTop <= 2) {
      // Apply quadratic friction damping
      const rawDistance = diff * 0.45;
      const damped = Math.min(maxPull, rawDistance);
      setPullDistance(damped);
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = () => {
    if (isRefreshing || startYRef.current === null) return;
    startYRef.current = null;

    if (pullDistance >= threshold) {
      triggerRefresh();
    } else {
      setPullDistance(0);
    }
  };

  // Keyboard shortcut or programmatic trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+R or Ctrl+Shift+R helper
      if (e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        triggerRefresh();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerRefresh]);

  const pullProgress = Math.min(1, pullDistance / threshold);

  // Localized texts
  let statusText = '';
  if (isSuccess) {
    statusText = lang === 'ar' ? 'تم التحديث بنجاح' : lang === 'fr' ? 'Mis à jour avec succès' : 'Updated successfully';
  } else if (isRefreshing) {
    statusText = lang === 'ar' ? 'جاري تحديث البيانات الطبية...' : lang === 'fr' ? 'Actualisation des données...' : 'Updating clinical data...';
  } else if (pullDistance >= threshold) {
    statusText = lang === 'ar' ? 'أفلت للتحديث' : lang === 'fr' ? 'Relâchez pour actualiser' : 'Release to refresh';
  } else {
    statusText = lang === 'ar' ? 'اسحب للتحديث' : lang === 'fr' ? 'Tirez pour actualiser' : 'Pull to refresh';
  }

  return (
    <div
      id={id}
      ref={internalContainerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full ${className}`}
    >
      {/* Heartbeat Pull-to-Refresh Indicator */}
      <div
        id={`${id}-indicator`}
        aria-hidden={pullDistance === 0 && !isRefreshing}
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 0 || isRefreshing ? 1 : 0,
          pointerEvents: isRefreshing ? 'auto' : 'none',
        }}
        className="overflow-hidden transition-all duration-150 ease-out flex flex-col items-center justify-center select-none"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-800/95 shadow-sm border border-emerald-500/20 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 backdrop-blur-sm transition-transform">
          {/* Medical Heart Pulse Icon */}
          <div className={`p-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 ${isRefreshing ? 'animate-heartbeat-pulse' : ''}`}>
            {isSuccess ? (
              <Check size={14} className="text-emerald-600 dark:text-emerald-400 stroke-[3]" />
            ) : (
              <HeartPulse size={14} className="text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
            )}
          </div>

          {/* Medical Heartbeat ECG Waveform (خط نبض القلب) */}
          <div className="relative flex items-center justify-center w-28 h-5">
            <svg
              viewBox="0 0 160 36"
              className="w-full h-full overflow-visible text-emerald-500 dark:text-emerald-400"
            >
              {/* Background Guide ECG Line */}
              <path
                d="M 5 18 L 30 18 L 38 18 L 44 8 L 52 30 L 60 2 L 68 28 L 75 18 L 84 18 L 91 12 L 98 24 L 104 18 L 155 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.2"
              />
              {/* Active Animated Heartbeat Line */}
              <path
                d="M 5 18 L 30 18 L 38 18 L 44 8 L 52 30 L 60 2 L 68 28 L 75 18 L 84 18 L 91 12 L 98 24 L 104 18 L 155 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="220"
                strokeDashoffset={isRefreshing ? 0 : 220 - pullProgress * 220}
                className={isRefreshing ? 'animate-heartbeat-trace' : 'transition-all duration-75'}
              />
            </svg>
          </div>

          {/* Status Label */}
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 tracking-tight whitespace-nowrap">
            {statusText}
          </span>
        </div>
      </div>

      {/* Child Content */}
      <div
        id={`${id}-content`}
        style={{
          transform: pullDistance > 0 ? `translateY(${Math.min(18, pullDistance * 0.25)}px)` : undefined,
        }}
        className="transition-transform duration-100 ease-out"
      >
        {children}
      </div>
    </div>
  );
};
