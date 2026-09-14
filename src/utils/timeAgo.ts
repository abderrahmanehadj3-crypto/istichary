import { Language } from '../types';

/**
 * Dynamic human-readable relative time formatter ("Time Ago")
 * Handles ISO timestamps, numeric millisecond timestamps, and relative strings.
 * Supports Arabic, English, and French with accurate grammatical plurals.
 */
export function formatRelativeTime(
  input: string | number | Date | null | undefined,
  lang: Language = 'ar'
): string {
  if (!input) {
    if (lang === 'ar') return 'الآن';
    if (lang === 'fr') return "à l'instant";
    return 'just now';
  }

  // If input is already an explicit string like "Just now" or "Recent"
  if (typeof input === 'string') {
    const trimmed = input.trim().toLowerCase();
    if (trimmed === 'just now' || trimmed === 'recent' || trimmed === 'الآن' || trimmed === "à l'instant") {
      if (lang === 'ar') return 'منذ لحظات';
      if (lang === 'fr') return "à l'instant";
      return 'just now';
    }
  }

  let date: Date;
  if (input instanceof Date) {
    date = input;
  } else if (typeof input === 'number') {
    date = new Date(input);
  } else {
    date = new Date(input);
  }

  const timestamp = date.getTime();
  if (isNaN(timestamp)) {
    // Fallback if string cannot be parsed as a Date
    if (typeof input === 'string') return input;
    if (lang === 'ar') return 'منذ قليل';
    if (lang === 'fr') return 'récemment';
    return 'recently';
  }

  const now = Date.now();
  const diffInSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));

  // Within first 45 seconds
  if (diffInSeconds < 45) {
    if (lang === 'ar') return 'الآن';
    if (lang === 'fr') return "à l'instant";
    return 'just now';
  }

  const minutes = Math.floor(diffInSeconds / 60);
  const hours = Math.floor(diffInSeconds / 3600);
  const days = Math.floor(diffInSeconds / 86400);
  const weeks = Math.floor(diffInSeconds / 604800);
  const months = Math.floor(diffInSeconds / 2592000);
  const years = Math.floor(diffInSeconds / 31536000);

  // Arabic Grammatical Relative Time
  if (lang === 'ar') {
    if (minutes < 60) {
      if (minutes <= 1) return 'منذ دقيقة';
      if (minutes === 2) return 'منذ دقيقتين';
      if (minutes >= 3 && minutes <= 10) return `منذ ${minutes} دقائق`;
      return `منذ ${minutes} دقيقة`;
    }

    if (hours < 24) {
      if (hours <= 1) return 'منذ ساعة';
      if (hours === 2) return 'منذ ساعتين';
      if (hours >= 3 && hours <= 10) return `منذ ${hours} ساعات`;
      return `منذ ${hours} ساعة`;
    }

    if (days < 7) {
      if (days <= 1) return 'أمس';
      if (days === 2) return 'منذ يومين';
      if (days >= 3 && days <= 10) return `منذ ${days} أيام`;
      return `منذ ${days} يوماً`;
    }

    if (weeks < 4) {
      if (weeks <= 1) return 'منذ أسبوع';
      if (weeks === 2) return 'منذ أسبوعين';
      return `منذ ${weeks} أسابيع`;
    }

    if (months < 12) {
      if (months <= 1) return 'منذ شهر';
      if (months === 2) return 'منذ شهرين';
      if (months >= 3 && months <= 10) return `منذ ${months} أشهر`;
      return `منذ ${months} شهراً`;
    }

    if (years <= 1) return 'منذ سنة';
    if (years === 2) return 'منذ سنتين';
    if (years >= 3 && years <= 10) return `منذ ${years} سنوات`;
    return `منذ ${years} سنة`;
  }

  // French Relative Time
  if (lang === 'fr') {
    if (minutes < 60) {
      return minutes <= 1 ? 'il y a 1 minute' : `il y a ${minutes} minutes`;
    }
    if (hours < 24) {
      return hours <= 1 ? 'il y a 1 heure' : `il y a ${hours} heures`;
    }
    if (days < 7) {
      return days <= 1 ? 'hier' : `il y a ${days} jours`;
    }
    if (weeks < 4) {
      return weeks <= 1 ? 'il y a 1 semaine' : `il y a ${weeks} semaines`;
    }
    if (months < 12) {
      return `il y a ${months} mois`;
    }
    return years <= 1 ? 'il y a 1 an' : `il y a ${years} ans`;
  }

  // English Relative Time
  if (minutes < 60) {
    return minutes <= 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }
  if (hours < 24) {
    return hours <= 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (days < 7) {
    return days <= 1 ? 'yesterday' : `${days} days ago`;
  }
  if (weeks < 4) {
    return weeks <= 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  if (months < 12) {
    return months <= 1 ? '1 month ago' : `${months} months ago`;
  }
  return years <= 1 ? '1 year ago' : `${years} years ago`;
}

/**
 * Formats post creation time as an accurate, human-readable relative timestamp
 * e.g. "Published 3 hours ago" / "نُشر منذ 3 ساعات" / "Publié il y a 3 heures"
 */
export function formatPostPublishedTime(
  input: string | number | Date | null | undefined,
  lang: Language = 'ar'
): string {
  const relative = formatRelativeTime(input, lang);

  if (lang === 'ar') {
    if (relative === 'الآن' || relative === 'منذ لحظات') {
      return 'نُشر الآن';
    }
    if (relative === 'أمس') {
      return 'نُشر أمس';
    }
    if (relative.startsWith('نُشر ')) {
      return relative;
    }
    return `نُشر ${relative}`;
  }

  if (lang === 'fr') {
    if (relative === "à l'instant") {
      return "Publié à l'instant";
    }
    if (relative === 'hier') {
      return 'Publié hier';
    }
    if (relative.startsWith('Publié')) {
      return relative;
    }
    return `Publié ${relative}`;
  }

  // English
  if (relative === 'just now') {
    return 'Published just now';
  }
  if (relative === 'yesterday') {
    return 'Published yesterday';
  }
  if (relative.startsWith('Published ')) {
    return relative;
  }
  return `Published ${relative}`;
}

