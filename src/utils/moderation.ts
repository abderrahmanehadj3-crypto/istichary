import { ModerationResult, UserAccount } from '../types';

// Toxic and abusive keywords / patterns in English, French, and Arabic
const ABUSIVE_PATTERNS = [
  // English abusive/profanity
  /\b(idiot|moron|stupid|bastard|shut up|scam artist|kill yourself|hate you|trash doctor|bitch|asshole|bullshit|damn you|motherfucker)\b/i,
  // French abusive/profanity
  /\b(imbécile|idiot|connard|ferme ta gueule|va te faire|salaud|merde|pourriture|pute|enculé)\b/i,
  // Arabic abusive/profanity (phonetic and Arabic script)
  /(غبي|حقير|أحمق|سافل|تافه|انقلع|كلب|ابن الكلب|لعنة|نصاب|طبيب فاشل)/i,
];

// Off-topic and spam keywords (crypto, marketing, unrelated sales, money schemes)
const OFF_TOPIC_PATTERNS = [
  // Commercial spam & crypto
  /\b(buy crypto|bitcoin profit|forex trading|loan offer|casino|free money|earn \$\$\$|click this link|whatsapp me for investment|cheap replica|seo ranking|telegram signal)\b/i,
  // Off-topic / non-medical random chatter
  /\b(selling car|used iphone for sale|rent apartment|plumber service|mechanic repair|football match streaming|best pizza discount)\b/i,
  // French off-topic
  /\b(gagner argent facile|investir bitcoin|crédit sans justificatif|vente voiture|paris sportifs)\b/i,
  // Arabic off-topic
  /(ربح البيتكوين|قروض سريعة|استثمار فوري|شراء سيارات|مراهنات|عملات رقمية)/i,
];

export function evaluateContent(text: string): ModerationResult {
  const normalized = text.trim();

  if (!normalized) {
    return {
      allowed: false,
      penaltyType: 'none',
      reason: 'Content cannot be empty.',
    };
  }

  // 1. Check for abusive language -> Instant Ban
  for (const pattern of ABUSIVE_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        allowed: false,
        penaltyType: 'banned',
        reason: 'Abusive language, insults, or harassment detected by AI Content Moderation. Instant Ban applied.',
        matchedCategory: 'abusive_language',
      };
    }
  }

  // 2. Check for off-topic / spam -> 48-Hour Restriction
  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        allowed: false,
        penaltyType: 'restricted_48h',
        reason: 'Commercial spam, solicitation, or off-topic non-medical content detected. 48-Hour Restriction applied.',
        matchedCategory: 'off_topic',
      };
    }
  }

  return {
    allowed: true,
    penaltyType: 'none',
    reason: 'Approved by AI Content Moderation.',
  };
}

export function checkUserCanPost(user: UserAccount | null): { allowed: boolean; message?: string } {
  if (!user) {
    return { allowed: false, message: 'Please sign in to participate in medical consultations.' };
  }

  if (user.isDeactivatedInactive) {
    return {
      allowed: false,
      message: 'Account is deactivated due to 12 months of inactivity. Please contact support.',
    };
  }

  if (user.moderationStatus === 'banned') {
    return {
      allowed: false,
      message: 'Account permanently suspended due to violation of community anti-abuse standards.',
    };
  }

  if (user.moderationStatus === 'restricted_48h') {
    const expires = user.restrictionExpiresAt ? new Date(user.restrictionExpiresAt) : null;
    const now = new Date();
    if (expires && expires > now) {
      const remainingHours = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60));
      return {
        allowed: false,
        message: `Account temporarily restricted for ${remainingHours} more hours due to off-topic submission.`,
      };
    }
  }

  return { allowed: true };
}
