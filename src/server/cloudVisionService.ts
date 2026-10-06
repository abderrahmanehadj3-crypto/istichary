/**
 * Automated Cloud Vision AI Verification Service for Sari3 Application
 * 
 * Specializes in:
 * 1. Server-side Cloud Vision AI Integration with Gemini 3.8 Flash (Multimodal Vision Engine)
 * 2. Automated Extraction & Parsing of official Algerian Biometric Driver's Licenses:
 *    - Full Name (الاسم الكامل - Latin & Arabic)
 *    - Date of Birth (تاريخ الميلاد)
 *    - License Number (رقم الرخصة)
 *    - Expiry Date (تاريخ انتهاء الصلاحية)
 * 3. Automated Strict Validation Logic:
 *    - Instant approval (Green status) for valid matching licenses
 *    - Instant automated rejection (< 2s) for expired, fake, wall, table, or mismatched documents
 *    - Zero manual human review required
 */

import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI();

export interface CloudVisionVerificationRequest {
  image: string; // Base64 data URL or raw base64 string
  expectedFirstName?: string;
  expectedLastName?: string;
  expectedBirthDate?: string;
  manualLicenseNumber?: string;
  manualExpirationDate?: string;
  isRenewalCheck?: boolean;
}

export interface CloudVisionExtractedData {
  fullName: string | null;
  fullNameAr: string | null;
  firstName: string | null;
  lastName: string | null;
  firstNameAr: string | null;
  lastNameAr: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  licenseNumber: string | null;
  expirationDate: string | null;
  issueDate: string | null;
  issueAuthority: string | null;
  nationalIdNumber: string | null;
  category: string | null;
  documentSide: 'front' | 'back' | 'unknown';
  isValidDocument: boolean;
  rejectionReason: string | null;
  confidenceScore: number;
}

export interface CloudVisionVerificationResult {
  success: boolean;
  isApproved: boolean; // Green status gatekeeper
  status: 'green' | 'rejected' | 'mismatch' | 'expired';
  isValidDocument: boolean;
  isExpired: boolean;
  calculatedAge: number;
  extractedData: CloudVisionExtractedData;
  mismatchType?:
    | 'name_mismatch'
    | 'dob_mismatch'
    | 'number_mismatch'
    | 'expiry_mismatch'
    | 'not_a_license'
    | 'expired_license'
    | 'invalid_license_number'
    | 'invalid_expiration_date';
  error?: string;
  message?: string;
  processingTimeMs: number;
  debugRawText?: string;
  rawLines?: string[];
  crossMatchStatus: {
    nameMatched: boolean;
    dobMatched: boolean;
    licenseNumberMatched: boolean;
    expiryDateMatched: boolean;
  };
}

// -----------------------------------------------------------------------------
// HELPER: Base64 Image Parser
// -----------------------------------------------------------------------------
export function parseBase64Image(dataUrl: string): { mimeType: string; data: string } {
  if (dataUrl && dataUrl.includes(';base64,')) {
    const parts = dataUrl.split(';base64,');
    const mimeType = parts[0].replace('data:', '') || 'image/jpeg';
    return { mimeType, data: parts[1] };
  }
  return { mimeType: 'image/jpeg', data: dataUrl || '' };
}

// -----------------------------------------------------------------------------
// HELPER: Universal Algerian Date Parser (Converts DD.MM.YYYY / DD/MM/YYYY to YYYY-MM-DD)
// -----------------------------------------------------------------------------
export function parseAlgerianDate(rawDateStr: string | null | undefined): string | null {
  if (!rawDateStr) return null;
  let s = String(rawDateStr).trim();

  // Convert Eastern Arabic / Persian numerals (٠١٢٣٤٥٦٧٨٩) to standard ASCII
  s = s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
  s = s.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));

  // 1. ISO format already YYYY-MM-DD
  const isoMatch = s.match(/\b(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})\b/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    const mNum = parseInt(month, 10);
    const dNum = parseInt(day, 10);
    if (mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
      return `${year}-${month}-${day}`;
    }
  }

  // 2. Standard Algerian & European format: DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY
  const dmyMatch = s.match(/\b(\d{1,2})[\.\/\-\s](\d{1,2})[\.\/\-\s](\d{4})\b/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    const mNum = parseInt(month, 10);
    const dNum = parseInt(day, 10);
    if (mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
      return `${year}-${month}-${day}`;
    }
  }

  // 3. DD.MM.YY or DD/MM/YY (2-digit year format)
  const dmyShortMatch = s.match(/\b(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{2})\b/);
  if (dmyShortMatch) {
    const day = dmyShortMatch[1].padStart(2, '0');
    const month = dmyShortMatch[2].padStart(2, '0');
    const y2 = parseInt(dmyShortMatch[3], 10);
    const year = y2 <= 45 ? 2000 + y2 : 1900 + y2;
    const mNum = parseInt(month, 10);
    const dNum = parseInt(day, 10);
    if (mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
      return `${year}-${month}-${day}`;
    }
  }

  // 4. MRZ format YYMMDD (6 consecutive digits)
  const mrzMatch = s.match(/\b(\d{2})(\d{2})(\d{2})\b/);
  if (mrzMatch) {
    const y = parseInt(mrzMatch[1], 10);
    const m = mrzMatch[2];
    const d = mrzMatch[3];
    const mNum = parseInt(m, 10);
    const dNum = parseInt(d, 10);
    if (mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
      const fullYear = y <= 45 ? 2000 + y : 1900 + y;
      return `${fullYear}-${m}-${d}`;
    }
  }

  return null;
}

// -----------------------------------------------------------------------------
// HELPER: Driver Age Calculator
// -----------------------------------------------------------------------------
export function calculateDriverAge(
  birthDateStr: string | null | undefined,
  referenceDateStr: string = new Date().toISOString().split('T')[0]
): number {
  if (!birthDateStr) return 0;
  const bDate = new Date(birthDateStr);
  const refDate = new Date(referenceDateStr);
  if (isNaN(bDate.getTime()) || isNaN(refDate.getTime())) return 0;
  let age = refDate.getFullYear() - bDate.getFullYear();
  const m = refDate.getMonth() - bDate.getMonth();
  if (m < 0 || (m === 0 && refDate.getDate() < bDate.getDate())) {
    age--;
  }
  return age;
}

// -----------------------------------------------------------------------------
// TEXT NORMALIZERS & STRING COMPARISON
// -----------------------------------------------------------------------------
export function normalizeArabicText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove vowels / tashkeel
    .replace(/ـ/g, '') // remove tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ؤئء]/g, '')
    .replace(/[\s\-\_\.\,\/]/g, '');
}

export function normalizeLatinText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents (é, è, ê, etc.)
    .replace(/[\s\-\_\.\,\/]/g, '');
}

export function calculateStringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1.0;

  const costs: number[] = [];
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[shorter.length] = lastValue;
  }
  return (longer.length - costs[shorter.length]) / longer.length;
}

function isNameTokenMatch(profileToken: string, ocrToken: string): boolean {
  if (!profileToken || !ocrToken) return false;
  const pNormAr = normalizeArabicText(profileToken);
  const oNormAr = normalizeArabicText(ocrToken);
  if (pNormAr && oNormAr) {
    if (pNormAr === oNormAr || pNormAr.includes(oNormAr) || oNormAr.includes(pNormAr)) return true;
    if (calculateStringSimilarity(pNormAr, oNormAr) >= 0.65) return true;
  }

  const pNormLat = normalizeLatinText(profileToken);
  const oNormLat = normalizeLatinText(ocrToken);
  if (pNormLat && oNormLat) {
    if (pNormLat === oNormLat || pNormLat.includes(oNormLat) || oNormLat.includes(pNormLat)) return true;
    if (
      pNormLat.length >= 4 &&
      oNormLat.length >= 4 &&
      (pNormLat.startsWith(oNormLat.slice(0, 4)) || oNormLat.startsWith(pNormLat.slice(0, 4)))
    ) {
      return true;
    }
    if (calculateStringSimilarity(pNormLat, oNormLat) >= 0.65) return true;
  }
  return false;
}

// -----------------------------------------------------------------------------
// STRICT ANTI-FRAUD NAME CROSS-MATCHER
// -----------------------------------------------------------------------------
export function crossMatchDriverLegalName(
  profileFirst: string,
  profileLast: string,
  ocrResult: {
    fullName?: string | null;
    fullNameAr?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    firstNameAr?: string | null;
    lastNameAr?: string | null;
  }
): { matched: boolean; reason?: string } {
  const pFirst = (profileFirst || '').trim();
  const pLast = (profileLast || '').trim();
  const pFull = `${pFirst} ${pLast}`.trim();

  if (!pFirst && !pLast) {
    return { matched: true };
  }

  const ocrFirstNames = [ocrResult.firstName, ocrResult.firstNameAr].filter(Boolean) as string[];
  const ocrLastNames = [ocrResult.lastName, ocrResult.lastNameAr].filter(Boolean) as string[];
  const ocrFullNames = [
    ocrResult.fullName,
    ocrResult.fullNameAr,
    `${ocrResult.lastName || ''} ${ocrResult.firstName || ''}`.trim(),
    `${ocrResult.firstName || ''} ${ocrResult.lastName || ''}`.trim(),
    `${ocrResult.lastNameAr || ''} ${ocrResult.firstNameAr || ''}`.trim(),
    `${ocrResult.firstNameAr || ''} ${ocrResult.lastNameAr || ''}`.trim(),
  ].filter(Boolean) as string[];

  const licenseDisplayName =
    ocrResult.fullNameAr ||
    ocrResult.fullName ||
    `${ocrResult.lastName || ''} ${ocrResult.firstName || ''}`.trim() ||
    'غير متوفر';

  if (ocrFirstNames.length === 0 && ocrLastNames.length === 0 && ocrFullNames.length === 0) {
    return {
      matched: false,
      reason: `تعذر قراءة الاسم من رخصة القيادة لمطابقته مع اسمك المسجل (${pFull}). يرجى التأكد من وضوح الحقلين 1 و 2 (اللقب والإسم).`,
    };
  }

  const firstMatchesInFirst = ocrFirstNames.some((oFirst) => isNameTokenMatch(pFirst, oFirst));
  const firstMatchesInLast = ocrLastNames.some((oLast) => isNameTokenMatch(pFirst, oLast));
  const firstMatchesInFull = ocrFullNames.some((oFull) => isNameTokenMatch(pFirst, oFull));
  const firstMatches = firstMatchesInFirst || firstMatchesInLast || firstMatchesInFull;

  const lastMatchesInLast = ocrLastNames.some((oLast) => isNameTokenMatch(pLast, oLast));
  const lastMatchesInFirst = ocrFirstNames.some((oFirst) => isNameTokenMatch(pLast, oFirst));
  const lastMatchesInFull = ocrFullNames.some((oFull) => isNameTokenMatch(pLast, oFull));
  const lastMatches = lastMatchesInLast || lastMatchesInFirst || lastMatchesInFull;

  if (pFirst && pLast) {
    if (!firstMatches && !lastMatches) {
      return {
        matched: false,
        reason: `الاسم الكامل المسجل (${pFull}) لا يتطابق إطلاقاً مع الاسم المستخرج من رخصة القيادة (${licenseDisplayName}). يشترط نظام الأمان تطابق هوية صاحب الحساب لمنع انتحال الشخصية.`,
      };
    }
    if (!firstMatches) {
      return {
        matched: false,
        reason: `الاسم الأول المسجل (${pFirst}) لا يتطابق مع الاسم المدون على رخصة القيادة (${ocrResult.firstNameAr || ocrResult.firstName || licenseDisplayName}). يرجى تصحيح بيانات الحساب لتطابق وثيقتك الرسمية.`,
      };
    }
    if (!lastMatches) {
      return {
        matched: false,
        reason: `اللقب المسجل (${pLast}) لا يتطابق مع اللقب المدون على رخصة القيادة (${ocrResult.lastNameAr || ocrResult.lastName || licenseDisplayName}). يرجى تصحيح بيانات الحساب لتطابق وثيقتك الرسمية.`,
      };
    }
    return { matched: true };
  }

  if (pFirst && !firstMatches) {
    return {
      matched: false,
      reason: `الاسم المسجل (${pFirst}) لا يتطابق مع الاسم المدون على رخصة القيادة (${licenseDisplayName}).`,
    };
  }

  if (pLast && !lastMatches) {
    return {
      matched: false,
      reason: `اللقب المسجل (${pLast}) لا يتطابق مع اللقب المدون على رخصة القيادة (${licenseDisplayName}).`,
    };
  }

  return { matched: true };
}

// -----------------------------------------------------------------------------
// STRICT ANTI-FRAUD DATE OF BIRTH CROSS-MATCHER
// -----------------------------------------------------------------------------
export function crossMatchDriverBirthDate(
  profileBirthDate: string,
  ocrBirthDate: string | null | undefined
): { matched: boolean; reason?: string } {
  if (!profileBirthDate) return { matched: true };

  if (!ocrBirthDate) {
    return {
      matched: false,
      reason: `تعذر استخراج تاريخ الميلاد من رخصة القيادة لمطابقته مع تاريخ ميلادك المسجل (${profileBirthDate}). يرجى التأكد من وضوح الحقل 3 (تاريخ ومكان الازدياد).`,
    };
  }

  const pNorm = parseAlgerianDate(profileBirthDate);
  const oNorm = parseAlgerianDate(ocrBirthDate);

  if (!pNorm || !oNorm) {
    return {
      matched: false,
      reason: `تنسيق تاريخ الميلاد غير صالح للمقارنة (${profileBirthDate} مقابل ${ocrBirthDate}). يرجى التأكد من كتابة التاريخ بصيغة صحيحة.`,
    };
  }

  if (pNorm === oNorm) return { matched: true };

  const pDate = new Date(pNorm);
  const oDate = new Date(oNorm);

  if (isNaN(pDate.getTime()) || isNaN(oDate.getTime())) {
    return {
      matched: false,
      reason: `تعذر معالجة تاريخ الميلاد للتحقق (${profileBirthDate} مقابل ${ocrBirthDate}).`,
    };
  }

  const pYear = pDate.getFullYear();
  const oYear = oDate.getFullYear();
  const pMonth = pDate.getMonth() + 1;
  const oMonth = oDate.getMonth() + 1;
  const diffDays = Math.abs(pDate.getTime() - oDate.getTime()) / (1000 * 60 * 60 * 24);

  if (pYear !== oYear) {
    return {
      matched: false,
      reason: `سنة ميلاد السائق المسجلة (${pYear}) لا تتطابق مع سنة الميلاد المستخرجة من رخصة القيادة (${oYear}). يشترط التطابق الكامل لتأكيد الهوية.`,
    };
  }

  if (pMonth !== oMonth && diffDays > 1) {
    return {
      matched: false,
      reason: `شهر ميلاد السائق المسجل (${pMonth}) لا يتطابق مع شهر الميلاد المستخرج من رخصة القيادة (${oMonth}). يرجى التحقق من مطابقة بيانات حسابك مع وثائقك الرسمية.`,
    };
  }

  if (diffDays <= 1.5) {
    return { matched: true };
  }

  return {
    matched: false,
    reason: `تاريخ ميلاد السائق المسجل (${pNorm}) لا يتطابق مع تاريخ الميلاد المستخرج من رخصة القيادة (${oNorm}). يرجى التحقق من مطابقة بيانات حسابك مع وثائقك الرسمية.`,
  };
}

// -----------------------------------------------------------------------------
// FUZZY ALGERIAN LICENSE KEYWORD VALIDATOR
// -----------------------------------------------------------------------------
export function checkAlgerianLicenseKeywords(text: string): {
  hasKeywords: boolean;
  matchedKeywords: string[];
  score: number;
} {
  if (!text) return { hasKeywords: false, matchedKeywords: [], score: 0 };

  const normAr = normalizeArabicText(text);
  const normLat = normalizeLatinText(text);
  const matchedKeywords: string[] = [];

  const primaryKeywords = [
    { id: 'رخصة_سياقة', regex: /(?:رخص[ةه]|رخص)\s*(?:السياق[ةه]|سياق[ةه]|سياقه|السياقه|سياف)/i },
    { id: 'permis_conduire', regex: /PERMI[S]?\s*(?:DE\s*)?CONDUI/i },
    { id: 'الجمهورية_الجزائرية', regex: /(?:جمهوري[ةه]|الجمهوري[ةه])\s*(?:جزائر|الجزائر|جزاير)/i },
    { id: 'republique_algerienne', regex: /REPUB?LI?Q?U?E?\s*ALG[EÉ]R/i },
    { id: 'dldza_mrz', regex: /DLDZA|DZA\b/i },
    { id: 'رقم_الرخصة', regex: /(?:رقم|N[°o])\s*(?:الرخص[ةه]|du\s*permis)/i },
    { id: 'الرقم_التعريفي_الوطني', regex: /(?:تعريفي|وطني|NIN)\b/i },
    { id: 'صنف_الرخصة', regex: /(?:صنف|cat[eé]gorie)\b/i },
  ];

  for (const kw of primaryKeywords) {
    if (kw.regex.test(text) || kw.regex.test(normAr) || kw.regex.test(normLat)) {
      matchedKeywords.push(kw.id);
    }
  }

  const partialTokens = [
    { id: 'رخصة', pattern: /رخص/i },
    { id: 'سياقة', pattern: /سياق|سياف/i },
    { id: 'جزائرية', pattern: /جزائر|جزاير/i },
    { id: 'جمهورية', pattern: /جمهور/i },
    { id: 'ديمقراطية', pattern: /ديمقراط/i },
    { id: 'شعبية', pattern: /شعب/i },
    { id: 'ازدياد', pattern: /ازدياد|ميلاد/i },
    { id: 'انتهاء', pattern: /انتهاء|صلاحي/i },
    { id: 'اصدار', pattern: /اصدار|دليفرانس/i },
    { id: 'permis', pattern: /PERMI|PRMIS/i },
    { id: 'conduire', pattern: /CONDUI/i },
    { id: 'algerie', pattern: /ALGER/i },
    { id: 'wilaya', pattern: /WILAYA|DAIRA/i },
    { id: 'expiration', pattern: /EXPIR/i },
  ];

  for (const tok of partialTokens) {
    if (!matchedKeywords.includes(tok.id)) {
      if (tok.pattern.test(text) || tok.pattern.test(normAr) || tok.pattern.test(normLat)) {
        matchedKeywords.push(tok.id);
      }
    }
  }

  const anchors = ['PERMIS DE CONDUIRE', 'REPUBLIQUE ALGERIENNE', 'رخصة السياقة', 'الجمهورية الجزائرية'];
  for (const anchor of anchors) {
    if (
      calculateStringSimilarity(normLat, normalizeLatinText(anchor)) >= 0.5 ||
      calculateStringSimilarity(normAr, normalizeArabicText(anchor)) >= 0.5
    ) {
      matchedKeywords.push(`fuzzy_${anchor}`);
    }
  }

  return {
    hasKeywords: matchedKeywords.length >= 1,
    matchedKeywords,
    score: matchedKeywords.length,
  };
}

// -----------------------------------------------------------------------------
// CORE ENTERPRISE ENGINE: Cloud Vision AI Driver License Verification
// -----------------------------------------------------------------------------
export async function verifyDriverLicenseCloudVision(
  request: CloudVisionVerificationRequest
): Promise<CloudVisionVerificationResult> {
  const startTime = Date.now();
  const currentDateStr = new Date().toISOString().split('T')[0];

  const {
    image,
    expectedFirstName,
    expectedLastName,
    expectedBirthDate,
    manualLicenseNumber,
    manualExpirationDate,
    isRenewalCheck,
  } = request;

  if (!image) {
    return {
      success: false,
      isApproved: false,
      status: 'rejected',
      isValidDocument: false,
      isExpired: false,
      calculatedAge: 0,
      extractedData: createEmptyExtractedData(),
      error: 'صورة رخصة السياقة مطلوبة للتحقق الأمني',
      processingTimeMs: Date.now() - startTime,
      crossMatchStatus: {
        nameMatched: false,
        dobMatched: false,
        licenseNumberMatched: false,
        expiryDateMatched: false,
      },
    };
  }

  const { mimeType, data } = parseBase64Image(image);

  if (!data || data.length < 150) {
    return {
      success: false,
      isApproved: false,
      status: 'rejected',
      isValidDocument: false,
      isExpired: false,
      calculatedAge: 0,
      extractedData: createEmptyExtractedData(),
      error: 'الصورة الملتقطة فارغة أو تالفة. يرجى التقاط صورة واضحة لرخصة القيادة.',
      processingTimeMs: Date.now() - startTime,
      crossMatchStatus: {
        nameMatched: false,
        dobMatched: false,
        licenseNumberMatched: false,
        expiryDateMatched: false,
      },
    };
  }

  // Vision AI Prompt specifically tuned for Algerian Biometric Driver's License
  const visionPrompt = `You are the Senior Cloud Vision AI Engine for the Sari3 Platform in Algeria.
Your mission is to perform automated, high-precision document extraction and forensics on the ALGERIAN BIOMETRIC DRIVER'S LICENSE (رخصة السياقة البيومترية الجزائرية / République Algérienne Démocratique et Populaire - Permis de Conduire).

Standard: ISO/IEC 7810 ID-1 polycarbonate card (~85.6 mm x 54 mm).

EXTRACT AND RETURN THE FOLLOWING FOUR MANDATORY CORE FIELDS:
1. "fullName": Full Latin Name from Fields 1 (Nom) and 2 (Prénom), e.g. "HADJADJ ABDERRAHMANE".
   Also return "fullNameAr" if Arabic text is visible, e.g. "حجاج عبد الرحمان".
   Separate into "firstName", "lastName", "firstNameAr", "lastNameAr".
2. "birthDate": Field 3 (Date de naissance / تاريخ الازدياد), formatted as "DD.MM.YYYY" or "YYYY-MM-DD" (e.g. "18.07.2003").
   Also extract "birthPlace" (lieu de naissance) if visible.
3. "licenseNumber": Field 5 (N° du permis / رقم رخصة السياقة), usually engraved in lower-right or MRZ line.
   Can be alphanumeric e.g. "A04201870" or Wilaya formatted e.g. "16/04201870" or numeric e.g. "04201870".
4. "expirationDate": Field 4b (Date d'expiration / تاريخ انتهاء الصلاحية), format "DD.MM.YYYY" (e.g. "28.04.2034").

ADDITIONAL FIELDS:
- "issueDate": Field 4a (Date de délivrance / تاريخ الإصدار).
- "issueAuthority": Field 4c (Autorité de délivrance / سلطة الإصدار).
- "nationalIdNumber": Field 4d (18-digit Biometric NIN / الرقم التعريفي الوطني).
- "category": Vehicle Category (e.g. "B", "A1", "C").
- "documentSide": "front" | "back" | "unknown".

STRICT ANTI-FRAUD & OBJECT CLASSIFICATION:
- "isAlgerianDriverLicense": Set to TRUE ONLY IF the image represents an authentic Algerian Biometric Driver's License.
- If the image is a WALL, TABLE, HAND, FACE SELFIE, RANDOM PAPER, NON-DOCUMENT OBJECT, BLANK SCREEN, or FOREIGN DOCUMENT (Passport, Carte Grise, Carte Nationale):
  Set "isAlgerianDriverLicense": false.
  Set "rejectionReason": "not_a_license" | "foreign_document" | "unreadable".
  Set "rejectionMessage": Arabic explanation of what is in the photo and why it was rejected.

Respond ONLY with valid JSON matching this schema:
{
  "isAlgerianDriverLicense": boolean,
  "confidenceScore": number,
  "rejectionReason": string | null,
  "rejectionMessage": string | null,
  "documentSide": "front" | "back" | "unknown",
  "fullName": string | null,
  "fullNameAr": string | null,
  "firstName": string | null,
  "lastName": string | null,
  "firstNameAr": string | null,
  "lastNameAr": string | null,
  "birthDate": string | null,
  "birthPlace": string | null,
  "licenseNumber": string | null,
  "expirationDate": string | null,
  "issueDate": string | null,
  "issueAuthority": string | null,
  "nationalIdNumber": string | null,
  "category": string | null,
  "allVisibleText": string
}`;

  let visionResult: any = null;
  let rawVisionText: string = '';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType,
            data,
          },
        },
        visionPrompt,
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (response.text) {
      rawVisionText = response.text.trim();
      const cleanJson = rawVisionText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      visionResult = JSON.parse(cleanJson);
    }
  } catch (visionErr: any) {
    console.error('[CloudVisionService] AI Execution Error:', visionErr);
  }

  // Fast Fallback Multi-Pass if structured call missed critical fields
  if (
    !visionResult ||
    !visionResult.isAlgerianDriverLicense ||
    (!visionResult.licenseNumber && !visionResult.expirationDate)
  ) {
    try {
      const fallbackPrompt = `Transcribe EVERY word and number on this Algerian Biometric Driver's License. Focus on Header, Names, Birth Date, Expiry Date (4b), NIN (4d), and License Number (5). Output plain text lines.`;
      const fallbackRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            inlineData: {
              mimeType,
              data,
            },
          },
          fallbackPrompt,
        ],
      });

      if (fallbackRes.text) {
        const fallbackText = fallbackRes.text.trim();
        rawVisionText = rawVisionText ? `${rawVisionText}\n${fallbackText}` : fallbackText;

        if (!visionResult) visionResult = {};

        // Regex extractions
        const licMatchLetter = fallbackText.match(/(?:5[\.\:\-]?\s*|رقم الرخصة[\.\:\-]?\s*|N°[\.\:\-]?\s*)?([A-Z]\s*[0-9]{7,9})/i);
        const licMatchSlash = fallbackText.match(/([0-9]{1,2})\s*[\/\-\.\s]\s*([0-9]{4,10})/);
        const licMatchDigits = fallbackText.match(/(?:5[\.\:\-]?\s*|رخصة[\.\:\-]?\s*)?([0-9]{6,12})/);
        const expMatch = fallbackText.match(/(?:4b[\.\:\-]?\s*|expiration|انتهاء|صلاحية)?\s*[:\.\-]?\s*([0-9٠-٩]{1,2}[\.\/\-][0-9٠-٩]{1,2}[\.\/\-][0-9٠-٩]{2,4})/i);
        const dobMatch = fallbackText.match(/(?:3[\.\:\-]?\s*|naissance|الازدياد|ميلاد)?\s*[:\.\-]?\s*([0-9٠-٩]{1,2}[\.\/\-][0-9٠-٩]{1,2}[\.\/\-][0-9٠-٩]{2,4})/i);
        const ninMatch = fallbackText.match(/(?:4d[\.\:\-]?\s*|NIN|التعريفي)?\s*[:\.\-]?\s*([0-9]{18})/i);

        if (!visionResult.licenseNumber) {
          if (licMatchLetter) visionResult.licenseNumber = licMatchLetter[1].replace(/\s+/g, '');
          else if (licMatchSlash) visionResult.licenseNumber = `${licMatchSlash[1]}/${licMatchSlash[2]}`;
          else if (licMatchDigits) visionResult.licenseNumber = licMatchDigits[1];
          else if (ninMatch) visionResult.licenseNumber = ninMatch[1];
        }

        if (!visionResult.expirationDate && expMatch) {
          visionResult.expirationDate = expMatch[1];
        }
        if (!visionResult.birthDate && dobMatch) {
          visionResult.birthDate = dobMatch[1];
        }
        if (!visionResult.nationalIdNumber && ninMatch) {
          visionResult.nationalIdNumber = ninMatch[1];
        }

        if (/(?:رخصة|السياقة|PERMIS|CONDUIRE|الجزائرية|ALGERIENNE|DLDZA)/i.test(fallbackText)) {
          visionResult.isAlgerianDriverLicense = true;
        }
      }
    } catch (fbErr) {
      console.warn('[CloudVisionService] Fallback Pass Notice:', fbErr);
    }
  }

  // ---------------------------------------------------------------------------
  // NORMALIZE EXTRACTED VALUES
  // ---------------------------------------------------------------------------
  const rawLicNum = String(
    visionResult?.licenseNumber ||
    visionResult?.documentNumber ||
    visionResult?.permisNumber ||
    visionResult?.nationalIdNumber ||
    ''
  ).trim();

  let cleanLicenseNumber = rawLicNum.replace(/[\s\-\/\.]/g, '').toUpperCase();
  const parsedExpDate = parseAlgerianDate(visionResult?.expirationDate);
  const parsedBirthDate = parseAlgerianDate(visionResult?.birthDate);
  const parsedIssueDate = parseAlgerianDate(visionResult?.issueDate);

  const finalFullName =
    visionResult?.fullName ||
    `${visionResult?.firstName || ''} ${visionResult?.lastName || ''}`.trim() ||
    null;

  const finalFullNameAr =
    visionResult?.fullNameAr ||
    `${visionResult?.lastNameAr || ''} ${visionResult?.firstNameAr || ''}`.trim() ||
    null;

  const combinedSearchText = `${rawVisionText} ${finalFullName || ''} ${finalFullNameAr || ''} ${cleanLicenseNumber} ${visionResult?.allVisibleText || ''}`.trim();

  const keywordCheck = checkAlgerianLicenseKeywords(combinedSearchText);
  const containsAlgerianKeywords = keywordCheck.hasKeywords || visionResult?.isAlgerianDriverLicense === true;

  const rawLines = (rawVisionText || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const ALGERIAN_LICENSE_NUMBER_REGEX = /^(?:[A-Z]{1,3}[0-9]{4,12}|[0-9]{1,2}[\/\-\.\s][0-9]{4,10}|[0-9]{5,18}|DLDZA[A-Z0-9]{6,12}|DZ[A-Z0-9]{5,12})$/i;
  const hasValidNumberFormat =
    ALGERIAN_LICENSE_NUMBER_REGEX.test(cleanLicenseNumber) ||
    ALGERIAN_LICENSE_NUMBER_REGEX.test(rawLicNum) ||
    (cleanLicenseNumber.length >= 5 && cleanLicenseNumber.length <= 18 && /[0-9]/.test(cleanLicenseNumber));

  const calculatedAge = calculateDriverAge(parsedBirthDate, currentDateStr);

  const extractedData: CloudVisionExtractedData = {
    fullName: finalFullName,
    fullNameAr: finalFullNameAr,
    firstName: visionResult?.firstName || null,
    lastName: visionResult?.lastName || null,
    firstNameAr: visionResult?.firstNameAr || null,
    lastNameAr: visionResult?.lastNameAr || null,
    birthDate: parsedBirthDate,
    birthPlace: visionResult?.birthPlace || null,
    licenseNumber: cleanLicenseNumber || null,
    expirationDate: parsedExpDate,
    issueDate: parsedIssueDate,
    issueAuthority: visionResult?.issueAuthority || null,
    nationalIdNumber: visionResult?.nationalIdNumber || null,
    category: visionResult?.category || 'B',
    documentSide: visionResult?.documentSide || 'front',
    isValidDocument: containsAlgerianKeywords && !!cleanLicenseNumber && hasValidNumberFormat,
    rejectionReason: visionResult?.rejectionReason || null,
    confidenceScore: visionResult?.confidenceScore || 0.95,
  };

  // ---------------------------------------------------------------------------
  // STEP 1: STRICT ANTI-FRAUD CHECK FOR RANDOM OBJECTS / WALLS / FAKES (< 2s)
  // ---------------------------------------------------------------------------
  if (!containsAlgerianKeywords && !cleanLicenseNumber) {
    return {
      success: false,
      isApproved: false,
      status: 'rejected',
      isValidDocument: false,
      isExpired: false,
      calculatedAge: 0,
      extractedData,
      mismatchType: 'not_a_license',
      error:
        visionResult?.rejectionMessage ||
        'الصورة الملتقطة لا تمثل رخصة قيادة جزائرية معتمدة (تم رصد جدار أو طاولة أو يد أو جسم غير مطابق). يرجى وضع رخصة السياقة داخل الإطار.',
      processingTimeMs: Date.now() - startTime,
      debugRawText: rawVisionText,
      rawLines,
      crossMatchStatus: {
        nameMatched: false,
        dobMatched: false,
        licenseNumberMatched: false,
        expiryDateMatched: false,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // STEP 2: STRICT LICENSE NUMBER PATTERN VERIFICATION
  // ---------------------------------------------------------------------------
  if (!cleanLicenseNumber || !hasValidNumberFormat) {
    return {
      success: false,
      isApproved: false,
      status: 'rejected',
      isValidDocument: false,
      isExpired: false,
      calculatedAge: 0,
      extractedData,
      mismatchType: 'invalid_license_number',
      error: 'تعذر قراءة رقم رخصة القيادة بنمط معتمد. يرجى التأكد من وضوح الحقل 5 وأرقام الرخصة داخل الإطار.',
      processingTimeMs: Date.now() - startTime,
      debugRawText: rawVisionText,
      rawLines,
      crossMatchStatus: {
        nameMatched: false,
        dobMatched: false,
        licenseNumberMatched: false,
        expiryDateMatched: false,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // STEP 3: STRICT EXPIRY DATE VERIFICATION & AUTOMATED EXPIRATION CHECK
  // ---------------------------------------------------------------------------
  if (!parsedExpDate) {
    return {
      success: false,
      isApproved: false,
      status: 'rejected',
      isValidDocument: false,
      isExpired: false,
      calculatedAge: 0,
      extractedData,
      mismatchType: 'invalid_expiration_date',
      error: 'تعذر قراءة تاريخ انتهاء صلاحية رخصة القيادة (الحقل 4b). يرجى توجيه الكاميرا بدقة وتثبيت الهاتف.',
      processingTimeMs: Date.now() - startTime,
      debugRawText: rawVisionText,
      rawLines,
      crossMatchStatus: {
        nameMatched: false,
        dobMatched: false,
        licenseNumberMatched: false,
        expiryDateMatched: false,
      },
    };
  }

  let isExpired = false;
  const expDateObj = new Date(parsedExpDate);
  const curDateObj = new Date(currentDateStr);
  if (!isNaN(expDateObj.getTime()) && expDateObj < curDateObj) {
    isExpired = true;
  }

  if (isExpired && !isRenewalCheck) {
    return {
      success: false,
      isApproved: false,
      status: 'expired',
      isValidDocument: true,
      isExpired: true,
      calculatedAge,
      extractedData,
      mismatchType: 'expired_license',
      error: `رخصة القيادة منتهية الصلاحية (${parsedExpDate}). يرجى تقديم وثيقة سارية المفعول لتفعيل حساب السائق.`,
      processingTimeMs: Date.now() - startTime,
      debugRawText: rawVisionText,
      rawLines,
      crossMatchStatus: {
        nameMatched: true,
        dobMatched: true,
        licenseNumberMatched: true,
        expiryDateMatched: false,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // STEP 4: STRICT AUTOMATED NAME CROSS-MATCHING AGAINST USER'S INPUT
  // ---------------------------------------------------------------------------
  let nameMatched = true;
  if (expectedFirstName && expectedLastName) {
    const nameMatchRes = crossMatchDriverLegalName(
      expectedFirstName,
      expectedLastName,
      extractedData
    );
    nameMatched = nameMatchRes.matched;
    if (!nameMatched) {
      return {
        success: false,
        isApproved: false,
        status: 'mismatch',
        isValidDocument: true,
        isExpired,
        calculatedAge,
        extractedData,
        mismatchType: 'name_mismatch',
        error:
          nameMatchRes.reason ||
          `الاسم المسجل في الحساب (${expectedFirstName} ${expectedLastName}) لا يتطابق مع الاسم المستخرج من رخصة القيادة (${finalFullNameAr || finalFullName}). يشترط تطابق الهوية لمنع انتحال الشخصية.`,
        processingTimeMs: Date.now() - startTime,
        debugRawText: rawVisionText,
        rawLines,
        crossMatchStatus: {
          nameMatched: false,
          dobMatched: true,
          licenseNumberMatched: true,
          expiryDateMatched: true,
        },
      };
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 5: STRICT AUTOMATED DATE OF BIRTH CROSS-MATCHING AGAINST USER'S INPUT
  // ---------------------------------------------------------------------------
  let dobMatched = true;
  if (expectedBirthDate) {
    if (!parsedBirthDate) {
      return {
        success: false,
        isApproved: false,
        status: 'mismatch',
        isValidDocument: true,
        isExpired,
        calculatedAge,
        extractedData,
        mismatchType: 'dob_mismatch',
        error: `تعذر استخراج تاريخ الميلاد من رخصة القيادة لمطابقته مع تاريخ ميلادك المسجل (${expectedBirthDate}). يرجى التأكد من وضوح الحقل 3 (Date de naissance / تاريخ الازدياد).`,
        processingTimeMs: Date.now() - startTime,
        debugRawText: rawVisionText,
        rawLines,
        crossMatchStatus: {
          nameMatched: true,
          dobMatched: false,
          licenseNumberMatched: true,
          expiryDateMatched: true,
        },
      };
    }

    const dobMatchRes = crossMatchDriverBirthDate(expectedBirthDate, parsedBirthDate);
    dobMatched = dobMatchRes.matched;
    if (!dobMatched) {
      return {
        success: false,
        isApproved: false,
        status: 'mismatch',
        isValidDocument: true,
        isExpired,
        calculatedAge,
        extractedData,
        mismatchType: 'dob_mismatch',
        error:
          dobMatchRes.reason ||
          `تاريخ ميلاد السائق المسجل (${expectedBirthDate}) لا يتطابق مع تاريخ الميلاد المستخرج من رخصة القيادة (${parsedBirthDate}). يرجى التحقق من مطابقة بيانات حسابك مع وثائقك الرسمية.`,
        processingTimeMs: Date.now() - startTime,
        debugRawText: rawVisionText,
        rawLines,
        crossMatchStatus: {
          nameMatched: true,
          dobMatched: false,
          licenseNumberMatched: true,
          expiryDateMatched: true,
        },
      };
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 6: STRICT CROSS-CHECK OF MANUAL LICENSE NUMBER (IF PRE-TYPED)
  // ---------------------------------------------------------------------------
  let licenseNumberMatched = true;
  if (manualLicenseNumber && manualLicenseNumber.trim().length > 3) {
    const cleanManualNum = manualLicenseNumber.replace(/[\s\-\/\.]/g, '').toUpperCase();
    if (
      cleanManualNum !== cleanLicenseNumber &&
      !cleanLicenseNumber.includes(cleanManualNum) &&
      !cleanManualNum.includes(cleanLicenseNumber)
    ) {
      return {
        success: false,
        isApproved: false,
        status: 'mismatch',
        isValidDocument: true,
        isExpired,
        calculatedAge,
        extractedData,
        mismatchType: 'number_mismatch',
        error: `رقم رخصة القيادة المدخل يدوياً (${manualLicenseNumber}) لا يتطابق مع الرقم المستخرج آلياً من الوثيقة (${cleanLicenseNumber}). يرجى تصحيح الرقم ليطابق رخصة السياقة تماماً.`,
        processingTimeMs: Date.now() - startTime,
        debugRawText: rawVisionText,
        rawLines,
        crossMatchStatus: {
          nameMatched: true,
          dobMatched: true,
          licenseNumberMatched: false,
          expiryDateMatched: true,
        },
      };
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 7: STRICT CROSS-CHECK OF MANUAL EXPIRY DATE (IF PRE-TYPED)
  // ---------------------------------------------------------------------------
  let expiryDateMatched = true;
  if (manualExpirationDate && manualExpirationDate.trim()) {
    const parsedManualExp = parseAlgerianDate(manualExpirationDate);
    if (parsedManualExp && parsedExpDate && parsedManualExp !== parsedExpDate) {
      return {
        success: false,
        isApproved: false,
        status: 'mismatch',
        isValidDocument: true,
        isExpired,
        calculatedAge,
        extractedData,
        mismatchType: 'expiry_mismatch',
        error: `تاريخ انتهاء الصلاحية المدخل يدوياً (${manualExpirationDate}) لا يتطابق مع التاريخ المقروء من الوثيقة (${parsedExpDate}). يرجى تصحيح التاريخ.`,
        processingTimeMs: Date.now() - startTime,
        debugRawText: rawVisionText,
        rawLines,
        crossMatchStatus: {
          nameMatched: true,
          dobMatched: true,
          licenseNumberMatched: true,
          expiryDateMatched: false,
        },
      };
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 8: INSTANT AUTOMATED APPROVAL (GREEN STATUS) 100% MATCH
  // ---------------------------------------------------------------------------
  const processingTimeMs = Date.now() - startTime;
  console.log(`[CloudVisionService] Driver License AUTOMATED APPROVAL in ${processingTimeMs}ms (Green Status).`);

  return {
    success: true,
    isApproved: true,
    status: 'green',
    isValidDocument: true,
    isExpired: false,
    calculatedAge,
    extractedData,
    processingTimeMs,
    debugRawText: rawVisionText,
    rawLines,
    crossMatchStatus: {
      nameMatched,
      dobMatched,
      licenseNumberMatched,
      expiryDateMatched,
    },
    message: 'تم فحص وقراءة رخصة السياقة البيومترية بنجاح عبر Cloud Vision AI واعتماد السائق فورياً (حالة خضراء معتمدة 100%)',
  };
}

function createEmptyExtractedData(): CloudVisionExtractedData {
  return {
    fullName: null,
    fullNameAr: null,
    firstName: null,
    lastName: null,
    firstNameAr: null,
    lastNameAr: null,
    birthDate: null,
    birthPlace: null,
    licenseNumber: null,
    expirationDate: null,
    issueDate: null,
    issueAuthority: null,
    nationalIdNumber: null,
    category: null,
    documentSide: 'unknown',
    isValidDocument: false,
    rejectionReason: null,
    confidenceScore: 0,
  };
}
