import React, { useState, useEffect } from 'react';
import { formatRelativeTime } from '../utils/timeAgo';
import { Language } from '../types';
import { Clock } from 'lucide-react';

interface LiveRelativeTimestampProps {
  timestamp: string | number | Date | null | undefined;
  lang?: Language;
  prefix?: string;
  className?: string;
  showIcon?: boolean;
}

/**
 * LiveRelativeTimestamp component
 * Displays human-readable relative time (e.g., "منذ 5 دقائق", "5 minutes ago")
 * and updates automatically in real-time every 10 seconds without page refresh.
 */
export const LiveRelativeTimestamp: React.FC<LiveRelativeTimestampProps> = ({
  timestamp,
  lang = 'ar',
  prefix,
  className = '',
  showIcon = false,
}) => {
  // Trigger re-render every 10 seconds to keep the relative time live
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!timestamp) return;
    const interval = setInterval(() => {
      setTick((prev) => (prev + 1) % 100000);
    }, 10000);
    return () => clearInterval(interval);
  }, [timestamp]);

  const safeLang: Language = (lang === 'en' || lang === 'fr') ? lang : 'ar';
  const relativeText = formatRelativeTime(timestamp, safeLang);
  let fullDateTitle = '';
  try {
    if (timestamp) {
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) {
        fullDateTitle = d.toLocaleString();
      }
    }
  } catch {}

  return (
    <span
      className={`inline-flex items-center gap-1 transition-opacity duration-300 ${className}`}
      title={fullDateTitle}
    >
      {showIcon && <Clock size={11} className="shrink-0 opacity-70" />}
      {prefix && <span>{prefix}</span>}
      <time dateTime={typeof timestamp === 'string' ? timestamp : undefined}>
        {relativeText}
      </time>
    </span>
  );
};

/**
 * Hook to get a live relative time string that refreshes every interval
 */
export function useLiveRelativeTime(
  timestamp: string | number | Date | null | undefined,
  lang: Language = 'ar',
  intervalMs = 10000
): string {
  const [formatted, setFormatted] = useState(() => formatRelativeTime(timestamp, lang));

  useEffect(() => {
    setFormatted(formatRelativeTime(timestamp, lang));
    if (!timestamp) return;

    const interval = setInterval(() => {
      setFormatted(formatRelativeTime(timestamp, lang));
    }, intervalMs);

    return () => clearInterval(interval);
  }, [timestamp, lang, intervalMs]);

  return formatted;
}
