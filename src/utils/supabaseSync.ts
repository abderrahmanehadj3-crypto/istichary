import { supabase, SUPABASE_URL } from '../supabaseClient';
import {
  UserAccount,
  DoctorProfile,
  ConsultationPost,
  ConsultationComment,
  SpecializationId,
  UserRole,
} from '../types';
import { SPECIALIZATIONS } from '../data/mockData';

export interface SyncStatus {
  connected: boolean;
  url: string;
  latencyMs?: number;
  consultationsCount?: number;
  usersCount?: number;
  error?: string | null;
  lastSyncedAt?: string;
}

export function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Maps specialty string into a supported SpecializationId
 */
function mapSpecialtyToId(specStr?: string): SpecializationId {
  if (!specStr) return 'general';
  const lower = specStr.toLowerCase();
  for (const s of SPECIALIZATIONS) {
    if (lower.includes(s.id) || lower.includes(s.name.toLowerCase())) {
      return s.id;
    }
  }
  if (lower.includes('cardio') || lower.includes('قلب')) return 'cardiology';
  if (lower.includes('neuro') || lower.includes('أعصاب')) return 'neurology';
  if (lower.includes('pedia') || lower.includes('أطفال')) return 'pediatrics';
  if (lower.includes('derma') || lower.includes('جلد')) return 'dermatology';
  if (lower.includes('ortho') || lower.includes('عظام')) return 'orthopedics';
  if (lower.includes('dent') || lower.includes('أسنان')) return 'dentistry';
  if (lower.includes('psych') || lower.includes('نفس')) return 'psychiatry';
  if (lower.includes('lab') || lower.includes('مخبر') || lower.includes('تحاليل')) return 'laboratory';
  return 'general';
}

/**
 * 1. USER SYNCHRONIZATION
 * Saves or upserts a UserAccount into public.users (and fallback to public.profiles)
 */
export async function saveUserToSupabase(user: UserAccount): Promise<{ success: boolean; error?: string }> {
  try {
    const isDoctor = user.role === 'doctor';
    const fullName = user.realName || user.username.replace(/^@/, '');
    
    let status = 'active';
    if (user.moderationStatus === 'banned') {
      status = 'banned';
    } else if (isDoctor && user.verificationStatus === 'pending') {
      status = 'pending_verification';
    } else if (isDoctor && user.verificationStatus === 'rejected') {
      status = 'banned';
    }

    const payload = {
      id: user.id,
      full_name: fullName,
      email: user.email,
      phone: user.clinicPhone || null,
      role: isDoctor ? 'doctor' : (user.role || 'patient'),
      specialty: user.specialty || (isDoctor ? 'General Medicine' : null),
      status,
      ban_reason: user.penaltyReason || null,
      banned_at: user.moderationStatus === 'banned' ? new Date().toISOString() : null,
      consultations_count: 0,
      reports_count: 0,
      created_at: user.lastLoginDate || new Date().toISOString(),
    };

    const { error } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('[SupabaseSync] Upsert to public.users returned error:', error.message);
      
      // Fallback: try profiles table if custom schema exists
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          username: user.username,
          full_name: fullName,
          email: user.email,
          role: user.role,
          specialty: user.specialty,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch (profileErr) {
        // Ignore fallback failure
      }

      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('[SupabaseSync] Network or execution error while saving user:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * 2. CONSULTATION / POST SYNCHRONIZATION
 * Saves a ConsultationPost directly into public.consultations (matching the Supabase database schema)
 * and ensures all post data and user_id linkage persist across sessions.
 */
export async function saveConsultationToSupabase(
  post: ConsultationPost,
  patientEmail?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Ensure post ID is a valid UUID for Postgres UUID column
    if (!isValidUUID(post.id)) {
      post.id = generateUUID();
    }

    const doctorComment = post.comments?.find((c) => c.authorRole === 'doctor');
    let status = 'waiting_doctor';
    if (post.isClosed) {
      status = 'completed';
    } else if (doctorComment) {
      status = 'in_progress';
    }

    const detailsPayload = {
      user_id: post.authorId,
      authorId: post.authorId,
      authorUsername: post.authorUsername,
      authorRole: post.authorRole || 'patient',
      authorRealName: post.authorRealName || null,
      authorSpecialty: post.authorSpecialty || null,
      patient_email: patientEmail || null,
      title: post.title,
      description: post.description,
      specializationId: post.specializationId,
      urgency: post.urgency,
      comments: post.comments || [],
      likesCount: post.likesCount || 0,
      isClosed: !!post.isClosed,
      isEdited: !!post.isEdited,
      createdAt: post.createdAt || new Date().toISOString(),
      updatedAt: post.updatedAt || new Date().toISOString(),
    };

    const consultationPayload: Record<string, any> = {
      id: post.id,
      patient_name: post.authorRealName || post.authorUsername || 'Patient',
      status,
      details: JSON.stringify(detailsPayload),
      created_at: post.createdAt || new Date().toISOString(),
    };

    const { error: consultError } = await supabase
      .from('consultations')
      .upsert(consultationPayload, { onConflict: 'id' });

    if (consultError) {
      console.warn('[SupabaseSync] Upsert to public.consultations error:', consultError.message);
    }

    // Also try saving to public.posts if the table exists
    try {
      await supabase.from('posts').upsert({
        id: post.id,
        user_id: post.authorId,
        author_id: post.authorId,
        author_username: post.authorUsername,
        title: post.title,
        description: post.description,
        specialization_id: post.specializationId,
        urgency: post.urgency,
        comments: JSON.stringify(post.comments || []),
        likes_count: post.likesCount || 0,
        is_closed: !!post.isClosed,
        created_at: post.createdAt,
        updated_at: post.updatedAt || post.createdAt,
      }, { onConflict: 'id' });
    } catch {
      // Ignore if posts table doesn't exist
    }

    return { success: !consultError, error: consultError?.message };
  } catch (err: any) {
    console.warn('[SupabaseSync] Error saving consultation:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * 3. UPDATE CONSULTATION COMMENTS / RESPONSES
 * Updates doctor replies and clinical status in public.consultations
 */
export async function updateConsultationCommentsInSupabase(
  postId: string,
  comments: ConsultationComment[],
  isClosed?: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const doctorComment = comments.find((c) => c.authorRole === 'doctor');
    let status = 'waiting_doctor';
    if (isClosed) {
      status = 'completed';
    } else if (doctorComment) {
      status = 'in_progress';
    }

    // Fetch existing row to preserve other details
    const { data: existing } = await supabase
      .from('consultations')
      .select('*')
      .eq('id', postId)
      .maybeSingle();

    let detailsObj: any = {};
    if (existing?.details) {
      try {
        detailsObj = typeof existing.details === 'object' ? existing.details : JSON.parse(existing.details);
      } catch {
        detailsObj = { description: existing.details };
      }
    }

    detailsObj.comments = comments;
    if (isClosed !== undefined) detailsObj.isClosed = isClosed;
    detailsObj.updatedAt = new Date().toISOString();

    const { error } = await supabase
      .from('consultations')
      .update({
        status,
        details: JSON.stringify(detailsObj),
      })
      .eq('id', postId);

    // Also update posts table if available
    try {
      await supabase
        .from('posts')
        .update({
          comments: JSON.stringify(comments),
          is_closed: isClosed,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId);
    } catch {}

    return { success: !error, error: error?.message };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * 4. DELETE CONSULTATION
 */
export async function deleteConsultationFromSupabase(postId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('consultations').delete().eq('id', postId);
    try {
      await supabase.from('posts').delete().eq('id', postId);
    } catch {}
    return { success: !error, error: error?.message };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * 5. FETCH CONSULTATIONS FROM SUPABASE
 * Loads public consultations directly from the Supabase production project,
 * linking every post to its user_id and preserving full metadata.
 */
export async function fetchConsultationsFromSupabase(): Promise<ConsultationPost[]> {
  try {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !Array.isArray(data)) {
      console.warn('[SupabaseSync] fetchConsultations warning:', error?.message);
      return [];
    }

    // Map each database row into ConsultationPost
    return data.map((row: any): ConsultationPost => {
      const id = String(row.id);
      
      let meta: any = {};
      if (row.details) {
        if (typeof row.details === 'object' && row.details !== null) {
          meta = row.details;
        } else if (typeof row.details === 'string') {
          try {
            meta = JSON.parse(row.details);
          } catch {
            meta = { description: row.details };
          }
        }
      }

      const authorId = String(meta.user_id || meta.authorId || row.patient_id || row.user_id || 'remote-patient');
      const authorUsername = String(meta.authorUsername || row.patient_name || 'Patient');

      // Title & Description resolution
      let title = meta.title;
      let description = meta.description;
      if (!title && !description) {
        const complaint = String(row.chief_complaint || row.details || 'Medical inquiry');
        const lines = complaint.split('\n').map((l: string) => l.trim()).filter(Boolean);
        title = lines.length > 0 ? lines[0].slice(0, 90) : 'Medical Inquiry';
        description = lines.length > 1 ? lines.slice(1).join('\n') : complaint;
      } else if (!title) {
        title = 'Medical Inquiry';
      }

      // Urgency mapping
      let urgency: 'low' | 'medium' | 'high' = 'medium';
      const rawUrgency = String(meta.urgency || row.urgency || '').toLowerCase();
      if (rawUrgency.includes('crit') || rawUrgency.includes('high')) urgency = 'high';
      else if (rawUrgency.includes('rout') || rawUrgency.includes('low')) urgency = 'low';

      // Comments resolution
      let comments: ConsultationComment[] = [];
      if (Array.isArray(meta.comments)) {
        comments = meta.comments;
      } else if (row.doctor_name) {
        comments.push({
          id: `reply-${id}-1`,
          postId: id,
          authorId: String(row.doctor_id || 'doc-verified'),
          authorUsername: `@${row.doctor_name.toLowerCase().replace(/\s+/g, '_')}`,
          authorRealName: row.doctor_name,
          authorRole: 'doctor',
          authorSpecialty: row.doctor_specialty || row.specialty || 'General Medicine',
          isVerifiedDoctor: true,
          content: row.clinical_summary || 'Clinical assessment received. Please follow standard prescribed guidelines.',
          timestamp: row.updated_at ? new Date(row.updated_at).toLocaleDateString() : 'Recent',
        });
      }

      const createdAt = row.created_at || meta.createdAt || new Date().toISOString();
      const updatedAt = meta.updatedAt || row.updated_at || createdAt;

      return {
        id,
        authorId,
        authorUsername,
        authorRole: meta.authorRole || 'patient',
        authorRealName: meta.authorRealName || undefined,
        authorSpecialty: meta.authorSpecialty || undefined,
        title,
        description: description || '',
        specializationId: (meta.specializationId as SpecializationId) || mapSpecialtyToId(meta.specialty || row.specialty),
        urgency,
        createdAt,
        updatedAt,
        isClosed: row.status === 'completed' || row.status === 'cancelled' || !!meta.isClosed,
        isEdited: !!meta.isEdited,
        comments,
        likesCount: typeof meta.likesCount === 'number' ? meta.likesCount : 0,
      };
    });
  } catch (err) {
    console.warn('[SupabaseSync] Failed to fetch consultations:', err);
    return [];
  }
}

/**
 * 6. FETCH USERS FROM SUPABASE
 * Loads users from public.users to keep user accounts and doctors synchronized
 */
export async function fetchUsersFromSupabase(): Promise<{
  users: UserAccount[];
  doctors: DoctorProfile[];
}> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !Array.isArray(data)) {
      return { users: [], doctors: [] };
    }

    const users: UserAccount[] = [];
    const doctors: DoctorProfile[] = [];

    for (const row of data) {
      const id = String(row.id);
      const email = String(row.email || '');
      const rawRole = String(row.role || 'patient').toLowerCase();
      const isDoctor = rawRole.includes('doc');
      const role: UserRole = isDoctor ? 'doctor' : (rawRole === 'super_admin' ? 'super_admin' : (rawRole === 'moderator' ? 'moderator' : 'patient'));

      const fullName = row.full_name || '';
      const username = fullName.startsWith('@')
        ? fullName
        : `@${(fullName || email.split('@')[0] || 'user').toLowerCase().replace(/\s+/g, '_')}`;

      const rawStatus = String(row.status || 'active').toLowerCase();
      const isBanned = rawStatus.includes('ban');
      const isPending = rawStatus.includes('pend');

      const userAcc: UserAccount = {
        id,
        username,
        email,
        role,
        realName: fullName || undefined,
        showRealName: !!fullName,
        specialty: row.specialty || (isDoctor ? 'General Medicine' : undefined),
        specializationId: isDoctor ? mapSpecialtyToId(row.specialty) : undefined,
        verificationStatus: isPending ? 'pending' : (isBanned ? 'rejected' : 'verified'),
        moderationStatus: isBanned ? 'banned' : 'active',
        penaltyReason: row.ban_reason || undefined,
        clinicPhone: row.phone || undefined,
        lastLoginDate: row.created_at || new Date().toISOString(),
        isDeactivatedInactive: false,
        followingDoctorIds: [],
      };

      users.push(userAcc);

      if (isDoctor) {
        doctors.push({
          id: `doc-${id}`,
          userId: id,
          username,
          realName: fullName,
          showRealName: true,
          specialty: row.specialty || 'General Medicine',
          specializationId: mapSpecialtyToId(row.specialty),
          verificationStatus: isPending ? 'pending' : 'verified',
          medicalLicenseNumber: 'VERIFIED-SUPABASE',
          hospitalOrClinic: 'Health Center',
          clinicPhone: row.phone || undefined,
          experienceYears: 5,
          rating: 5.0,
          reviewCount: 1,
          about: `${fullName || username}, registered specialist in ${row.specialty || 'General Medicine'}.`,
        });
      }
    }

    return { users, doctors };
  } catch (err) {
    console.warn('[SupabaseSync] Failed to fetch users:', err);
    return { users: [], doctors: [] };
  }
}

/**
 * 7. REAL-TIME SYNCHRONIZATION LISTENER
 * Subscribes to postgres changes on public.consultations and public.users
 * using exact channels compatible with the Super-Admin dashboard!
 */
export function setupRealtimeSubscriptions(callbacks: {
  onConsultationChange: (payload: any) => void;
  onUserChange: (payload: any) => void;
}): () => void {
  try {
    // Channel 1: Consultations
    const consultChannel = supabase
      .channel('supabase-realtime-consultations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'consultations' },
        (payload) => {
          console.log('[Supabase Realtime] Consultation changed:', payload.eventType);
          callbacks.onConsultationChange(payload);
        }
      )
      .subscribe();

    // Channel 2: Users
    const usersChannel = supabase
      .channel('supabase-realtime-users')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          console.log('[Supabase Realtime] User changed:', payload.eventType);
          callbacks.onUserChange(payload);
        }
      )
      .subscribe();

    // Channel 3: Posts (if table exists)
    const postsChannel = supabase
      .channel('supabase-realtime-posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          console.log('[Supabase Realtime] Post changed:', payload.eventType);
          callbacks.onConsultationChange(payload);
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      supabase.removeChannel(consultChannel);
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(postsChannel);
    };
  } catch (err) {
    console.warn('[Supabase Realtime] Subscription setup error:', err);
    return () => {};
  }
}

/**
 * 8. TEST SUPABASE CONNECTION
 * Tests connectivity and latency with the configured Supabase project
 */
export async function testSupabaseConnection(): Promise<SyncStatus> {
  const start = Date.now();
  try {
    const { count: usersCount, error: usersErr } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: consultCount, error: consultErr } = await supabase
      .from('consultations')
      .select('*', { count: 'exact', head: true });

    const latencyMs = Date.now() - start;
    const connected = !usersErr || !consultErr;

    return {
      connected,
      url: SUPABASE_URL,
      latencyMs,
      usersCount: usersCount ?? undefined,
      consultationsCount: consultCount ?? undefined,
      error: usersErr?.message || consultErr?.message || null,
      lastSyncedAt: new Date().toLocaleTimeString(),
    };
  } catch (err: any) {
    return {
      connected: false,
      url: SUPABASE_URL,
      latencyMs: Date.now() - start,
      error: err?.message || String(err),
      lastSyncedAt: new Date().toLocaleTimeString(),
    };
  }
}
