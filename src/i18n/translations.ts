import { Language } from '../types';
import { Translations } from './types';
import { enTranslations } from './en';
import { frTranslations } from './fr';
import { arTranslations } from './ar';

export type { Translations } from './types';
export { enTranslations } from './en';
export { frTranslations } from './fr';
export { arTranslations } from './ar';

export const translations: Record<Language, Translations> = {
  en: enTranslations,
  fr: frTranslations,
  ar: arTranslations,
};

/**
 * Returns the translations dictionary for the specified language.
 * Strictly guarantees that French returns frTranslations without falling back to English.
 */
export function getTranslations(lang: Language): Translations {
  if (lang === 'fr') {
    return frTranslations;
  }
  if (lang === 'ar') {
    return arTranslations;
  }
  return enTranslations;
}

/**
 * Localized specialty name helper
 */
export function getSpecialtyLabel(specialtyId: string, t: Translations): string {
  switch (specialtyId.toLowerCase()) {
    case 'cardiology':
      return t.specialtyCardiology;
    case 'dermatology':
      return t.specialtyDermatology;
    case 'pediatrics':
      return t.specialtyPediatrics;
    case 'neurology':
      return t.specialtyNeurology;
    case 'general':
      return t.specialtyGeneral;
    case 'orthopedics':
      return t.specialtyOrthopedics;
    case 'psychiatry':
      return t.specialtyPsychiatry;
    case 'all':
      return t.specialtyAll;
    default:
      return specialtyId;
  }
}

/**
 * Localized urgency label helper
 */
export function getUrgencyLabel(urgency: 'low' | 'medium' | 'high', t: Translations): string {
  switch (urgency) {
    case 'high':
      return t.urgent;
    case 'medium':
      return t.normal;
    case 'low':
      return t.low;
    default:
      return urgency;
  }
}
