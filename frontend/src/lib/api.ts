// Centralized API client for the Career Arena · Exam Arena Flask backend.
//
// Contract: docs/CONTRACT.md (single source of truth).
// Base URL: import.meta.env.VITE_API_URL (default empty for Vite proxy).
// Auth: opaque server-managed session cookies (no JWT in the client).
// CSRF: synchronizer token — token read from the non-HttpOnly `csrf_token`
// cookie and sent back via the `X-CSRF-Token` header on every state-changing
// request (POST/PUT/PATCH/DELETE).

import type {
  ApiError,
  AttemptsPage,
  Grade,
  LeaderboardPage,
  PracticeCard,
  Progress,
  SubjectDetail,
  SubjectSummary,
  TestStart,
  TestSubmitResult,
  Topic,
  User,
} from '../types';

export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) || '';

const API_V1 = '/api/v1';
const DEFAULT_TIMEOUT_MS = 15000;

// --- Cookie helper --------------------------------------------------------
/**
 * Read a single cookie value by name. Returns null if absent.
 * Used to extract the non-HttpOnly `csrf_token` cookie set by the backend.
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const parts = document.cookie ? document.cookie.split(';') : [];
  for (const raw of parts) {
    const idx = raw.indexOf('=');
    if (idx === -1) continue;
    const key = raw.slice(0, idx).trim();
    if (key === name) {
      const val = raw.slice(idx + 1).trim();
      return val === '' ? null : val;
    }
  }
  return null;
}

// --- Error model -----------------------------------------------------------
async function buildApiError(res: Response): Promise<ApiError> {
  let code = 'http_error';
  let message = res.statusText || 'Naməlum xəta baş verdi';
  let fields: Record<string, string> | undefined;

  try {
    const data = await res.json();
    if (data && typeof data === 'object') {
      const err = (data as { error?: Record<string, unknown> }).error;
      if (err) {
        if (typeof err.code === 'string') code = err.code;
        if (typeof err.message === 'string') message = err.message;
        if (err.fields && typeof err.fields === 'object') {
          fields = Object.fromEntries(
            Object.entries(err.fields).filter(
              ([, v]) => typeof v === 'string' || typeof v === 'number',
            ) as [string, string][],
          );
          if (Object.keys(fields).length === 0) fields = undefined;
        }
      }
    }
  } catch {
    // body wasn't JSON — keep the default message
  }

  return { code, message, fields, status: res.status };
}

function wrapUnknownError(err: unknown): ApiError {
  if (err instanceof ApiErrorClass) return err;
  if (err instanceof DOMException && err.name === 'AbortError') {
    return {
      code: 'timeout',
      message: 'Sorğu vaxtı bitdi. Bir az sonra yenidən cəhd edin.',
      status: 0,
    };
  }
  if (err instanceof TypeError) {
    return {
      code: 'network',
      message:
        'Backend-ə qoşulmaq mümkün olmadı. Backend-in işə salındığını yoxlayın (backend qovluğunda: python run.py → port 5000).',
      status: 0,
    };
  }
  const msg = err instanceof Error ? err.message : 'Naməlum xəta baş verdi';
  return { code: 'unknown', message: msg, status: 0 };
}

export class ApiErrorClass extends Error {
  code: string;
  fields?: Record<string, string>;
  status?: number;

  constructor(payload: ApiError) {
    super(payload.message);
    this.name = 'ApiError';
    this.code = payload.code;
    this.fields = payload.fields;
    this.status = payload.status;
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface FetchJsonOptions {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
  csrf?: boolean;
  signal?: AbortSignal;
  parseJson?: boolean;
}

function buildUrl(path: string, query?: FetchJsonOptions['query']): string {
  const url = `${API_URL}${API_V1}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    params.append(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

export async function fetchJson<T>(path: string, opts: FetchJsonOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    query,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    csrf = method !== 'GET',
    signal,
    parseJson = true,
  } = opts;

  const url = buildUrl(path, query);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (csrf) {
    const token = getCookie('csrf_token');
    if (token) headers['X-CSRF-Token'] = token;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      mode: 'cors',
      credentials: 'include',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    throw new ApiErrorClass(wrapUnknownError(err));
  }
  clearTimeout(timer);

  if (!res.ok) {
    const apiErr = await buildApiError(res);
    if (res.status === 401 && apiErr.code !== 'invalid_credentials' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    throw new ApiErrorClass(apiErr);
  }

  if (!parseJson || res.status === 204) return null as T;
  const text = await res.text();
  if (text === '') return null as T;
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new ApiErrorClass(wrapUnknownError(err));
  }
}

// --- E-poçt validator köməkçi funksiyası ------------------------------------
export function validateEmail(email: string): { valid: boolean; message?: string } {
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  
  if (!emailRegex.test(trimmed)) {
    return { valid: false, message: 'Düzgün və etibarlı e-poçt ünvanı daxil edin' };
  }

  return { valid: true };
}

// --- Auth endpoints --------------------------------------------------------
export function authRegister(input: {
  name: string;
  email: string;
  password: string;
  confirm: string;
  captcha_key?: string;
  captcha_text?: string;
  captcha_token?: string;
}): Promise<{ user: User; requires_verification?: boolean }> {
  const emailCheck = validateEmail(input.email);
  if (!emailCheck.valid) {
    throw new ApiErrorClass({ code: 'validation_failed', message: emailCheck.message || 'Xəta', status: 400 });
  }
  return fetchJson<{ user: User; requires_verification?: boolean }>('/auth/register', {
    method: 'POST',
    body: input,
  });
}

export function authLogin(input: {
  email: string;
  password: string;
  captcha_token?: string;
}): Promise<{ user?: User; mfa_required?: boolean; challenge_token?: string; expires_in?: number }> {
  return fetchJson<{ user?: User; mfa_required?: boolean; challenge_token?: string; expires_in?: number }>('/auth/login', { method: 'POST', body: input });
}

export function authMfaChallenge(input: { challenge_token: string; code: string }): Promise<{ user: User }> {
  return fetchJson<{ user: User }>('/auth/mfa/challenge', { method: 'POST', body: input, csrf: false });
}

export function authMfaEnroll(input: { current_password: string }): Promise<{ secret: string; otpauth_uri: string; issuer: string }> {
  return fetchJson('/auth/mfa/enroll', { method: 'POST', body: input });
}

export function authMfaConfirm(input: { code: string }): Promise<{ ok: true; recovery_codes: string[] }> {
  return fetchJson('/auth/mfa/confirm', { method: 'POST', body: input });
}

export function authMfaDisable(input: { code: string; current_password: string }): Promise<{ ok: true; user: User }> {
  return fetchJson('/auth/mfa/disable', { method: 'POST', body: input });
}

export function authMfaRecoveryCodesRotate(input: { code: string; current_password: string }): Promise<{ ok: true; recovery_codes: string[] }> {
  return fetchJson('/auth/mfa/recovery-codes/rotate', { method: 'POST', body: input });
}

export interface AuthSession {
  id: number;
  current: boolean;
  user_agent: string | null;
  ip: string | null;
  created_at: string;
  expires_at: string;
}

export function authSessions(): Promise<{ sessions: AuthSession[] }> {
  return fetchJson('/auth/sessions');
}

export function authSessionRevoke(sessionId: number): Promise<{ ok: true }> {
  return fetchJson(`/auth/sessions/${sessionId}`, { method: 'DELETE' });
}

export function authSessionsRevokeOthers(): Promise<{ ok: true; revoked_count: number }> {
  return fetchJson('/auth/sessions/revoke-others', { method: 'POST', body: {} });
}

export function authSessionsRevokeCurrent(): Promise<{ ok: true }> {
  return fetchJson('/auth/sessions/revoke-current', { method: 'POST', body: {} });
}

export function authSessionsRevokeAll(): Promise<{ ok: true; revoked_count: number }> {
  return fetchJson('/auth/sessions/revoke-all', { method: 'POST', body: {} });
}

export function authLogout(): Promise<{ ok: true }> {
  return fetchJson<{ ok: true }>('/auth/logout', { method: 'POST' });
}

export function authMe(): Promise<{ user: User }> {
  return fetchJson<{ user: User }>('/auth/me', { method: 'GET' });
}

export function authCsrf(): Promise<{ csrf_token: string }> {
  return fetchJson<{ csrf_token: string }>('/auth/csrf', { method: 'GET' });
}

export function authChangePassword(input: {
  current_password: string;
  new_password: string;
}): Promise<{ ok: true }> {
  return fetchJson<{ ok: true }>('/auth/change-password', { method: 'POST', body: input });
}

export function authPasswordResetRequest(input: { email: string }): Promise<{ ok: true }> {
  return fetchJson<{ ok: true }>('/auth/password-reset/request', { method: 'POST', body: input });
}

export function authResendVerification(input: { email: string }): Promise<{ ok: true }> {
  return fetchJson<{ ok: true }>('/auth/verification/resend', { method: 'POST', body: input });
}

export function authPasswordResetConfirm(input: {
  token: string;
  new_password: string;
}): Promise<{ ok: true }> {
  return fetchJson<{ ok: true }>('/auth/password-reset/confirm', {
    method: 'POST',
    body: input,
  });
}

// Profil məlumatlarını yeniləmək və OTP tələb etmək üçün:
export function updateProfileRequest(input: {
  name?: string;
  email?: string;
  current_password: string;
  mfa_code?: string;
}): Promise<{ ok: boolean; requires_otp: boolean; message: string }> {
  if (input.email) {
    const emailCheck = validateEmail(input.email);
    if (!emailCheck.valid) {
      throw new ApiErrorClass({ code: 'validation_failed', message: emailCheck.message || 'Xəta', status: 400 });
    }
  }
  return fetchJson('/user/profile', { method: 'PUT', body: input });
}

// Profil OTP kodunu təsdiqləmək üçün:
export function verifyProfileOtp(input: {
  code: string;
  email: string;
}): Promise<{ user: User; ok: boolean }> {
  return fetchJson('/user/profile/verify-otp', { method: 'POST', body: input });
}

// Köhnə uyumluluq üçün (gərəkərsə):
export function updateProfile(input: {
  name?: string;
  email?: string;
  current_password: string;
  mfa_code?: string;
}): Promise<{ user: User }> {
  return updateProfileRequest(input) as any;
}

// --- Subjects / topics -----------------------------------------------------
type SubjectList = SubjectSummary[] | { items: SubjectSummary[] };
let subjectListRequest: Promise<SubjectList> | undefined;

export function getSubjects(): Promise<SubjectList> {
  subjectListRequest ??= fetchJson<SubjectList>('/subjects').finally(() => {
    subjectListRequest = undefined;
  });
  return subjectListRequest;
}

export function getSubject(id: string): Promise<SubjectDetail> {
  return fetchJson<SubjectDetail>(`/subjects/${encodeURIComponent(id)}`);
}

export function getSubjectTopics(id: string): Promise<{ items: Topic[] } | Topic[]> {
  return fetchJson<Topic[] | { items: Topic[] }>(`/subjects/${encodeURIComponent(id)}/topics`);
}

// --- Tests -----------------------------------------------------------------
export function startTest(input: {
  subject_id: string;
  topic_id?: string;
  question_count?: number;
  grade?: Grade;
  quiz?: number;
}): Promise<TestStart> {
  return fetchJson<TestStart>('/tests', { method: 'POST', body: input });
}

export function submitTest(
  attemptId: number,
  answers: Record<string, string | null>,
  writtenAnswers?: Record<string, string | null>,
): Promise<TestSubmitResult> {
  return fetchJson<TestSubmitResult>(`/tests/${attemptId}/submit`, {
    method: 'POST',
    body: writtenAnswers ? { answers, written_answers: writtenAnswers } : { answers },
  });
}

export function getTest(attemptId: number): Promise<TestSubmitResult> {
  return fetchJson<TestSubmitResult>(`/tests/${attemptId}`);
}

// --- User-scoped aggregates -------------------------------------------------
export function getMyAttempts(input?: {
  page?: number;
  per_page?: number;
}): Promise<AttemptsPage> {
  return fetchJson<AttemptsPage>('/me/attempts', { method: 'GET', query: input });
}

export function getMyProgress(): Promise<Progress> {
  return fetchJson<Progress>('/me/progress', { method: 'GET' });
}

export function getPracticeCards(): Promise<{ items: PracticeCard[] } | PracticeCard[]> {
  return fetchJson<PracticeCard[] | { items: PracticeCard[] }>('/practice/cards');
}

// --- Leaderboard -----------------------------------------------------------
export function getLeaderboard(input?: {
  subject_id?: string;
  page?: number;
  per_page?: number;
}): Promise<LeaderboardPage> {
  return fetchJson<LeaderboardPage>('/leaderboard', { method: 'GET', query: input });
}

// --- Health check ----------------------------------------------------------
export function getHealth(): Promise<{ status: string; db: string }> {
  return fetchJson<{ status: string; db: string }>('/health', { method: 'GET' });
}

export function asArray<T>(raw: T[] | { items: T[] } | undefined | null): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && Array.isArray((raw as { items: T[] }).items)) {
    return (raw as { items: T[] }).items;
  }
  return [];
}

export async function tryAuthMe(): Promise<User | null> {
  try {
    const { user } = await authMe();
    return user;
  } catch (err) {
    if (err instanceof ApiErrorClass && err.status === 401) return null;
    return null;
  }
}
