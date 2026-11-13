/**
 * AUTH SERVİSİ — MOCK (müvəqqəti).
 *
 * Backend hazır olanda yalnız bu faylın funksiyalarını API çağırışları ilə əvəz etmək kifayətdir,
 * UI kodu dəyişməz qalır. Gözlənilən endpoint-lər:
 *   POST  /auth/register        { fullName, email, password }  → { user, token }
 *   POST  /auth/login           { email, password }            → { user, token }
 *   POST  /auth/logout
 *   POST  /auth/verify-email    { code }                       → { user }
 *   POST  /auth/resend-code
 *   PATCH /me                   { fullName?, avatar? }         → { user }
 *   POST  /me/password          { currentPassword, newPassword }
 *
 * Hazırkı davranış (yalnız brauzerdə, serversiz):
 *  - İstifadəçilər localStorage-də saxlanır. Şifrə SAXLANMIR və yoxlanmır.
 *  - E-poçt təsdiq kodu: DEMO_VERIFICATION_CODE.
 */
import type { AuthUser } from '../types';

const USERS_KEY = 'ca-users';
const SESSION_KEY = 'ca-session';
const LATENCY_MS = 600;

/** Yalnız nümayiş üçün. Real sistemdə kod e-poçtla göndərilir. */
export const DEMO_VERIFICATION_CODE = '123456';
export const VERIFICATION_CODE_LENGTH = 6;

export class AuthError extends Error {}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

type StoredUser = Omit<AuthUser, 'email'>;
type UserRegistry = Record<string, StoredUser>;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const normalizeEmail = (email: string) => email.trim().toLowerCase();

function readJson<T>(storage: Storage, key: string): T | null {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(storage: Storage, key: string, value: unknown) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage əlçatmazdırsa (məs. məxfi rejim) səssiz keç */
  }
}

const readUsers = () => readJson<UserRegistry>(localStorage, USERS_KEY) ?? {};

export function getSession(): AuthUser | null {
  return (
    readJson<AuthUser>(localStorage, SESSION_KEY) ?? readJson<AuthUser>(sessionStorage, SESSION_KEY)
  );
}

/** Sessiyanı hansı yaddaşda idisə, orada yeniləyir */
function persistSession(user: AuthUser) {
  const storage = readJson<AuthUser>(localStorage, SESSION_KEY) ? localStorage : sessionStorage;
  writeJson(storage, SESSION_KEY, user);
}

function persistUser(user: AuthUser) {
  const { email, ...stored } = user;
  writeJson(localStorage, USERS_KEY, { ...readUsers(), [email]: stored });
  persistSession(user);
}

export async function register(input: RegisterInput): Promise<AuthUser> {
  await wait(LATENCY_MS);
  const email = normalizeEmail(input.email);
  const users = readUsers();

  if (users[email]) {
    throw new AuthError('Bu e-poçt artıq qeydiyyatdan keçib. Daxil olmağa cəhd edin.');
  }

  const user: AuthUser = {
    id: crypto.randomUUID(),
    fullName: input.fullName.trim(),
    email,
    createdAt: new Date().toISOString(),
    emailVerified: false,
    plan: 'free',
  };
  const { email: _email, ...stored } = user;
  writeJson(localStorage, USERS_KEY, { ...users, [email]: stored });
  writeJson(localStorage, SESSION_KEY, user);
  return user;
}

export async function login(
  email: string,
  _password: string,
  remember: boolean,
): Promise<AuthUser> {
  await wait(LATENCY_MS);
  const normalized = normalizeEmail(email);
  const stored = readUsers()[normalized];

  if (!stored) {
    throw new AuthError('Bu e-poçt ilə hesab tapılmadı. Əvvəlcə qeydiyyatdan keçin.');
  }

  const user: AuthUser = { ...stored, email: normalized };
  writeJson(remember ? localStorage : sessionStorage, SESSION_KEY, user);
  return user;
}

export function logout() {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export async function verifyEmail(code: string): Promise<AuthUser> {
  await wait(LATENCY_MS);
  const current = getSession();
  if (!current) throw new AuthError('Sessiya bitib. Yenidən daxil olun.');
  if (code !== DEMO_VERIFICATION_CODE) throw new AuthError('Kod yanlışdır. Yenidən yoxlayın.');

  const user: AuthUser = { ...current, emailVerified: true };
  persistUser(user);
  return user;
}

export async function resendVerificationCode(): Promise<void> {
  await wait(LATENCY_MS);
}

export async function updateProfile(patch: {
  fullName?: string;
  /** null = şəkli sil */
  avatarUrl?: string | null;
}): Promise<AuthUser> {
  await wait(300);
  const current = getSession();
  if (!current) throw new AuthError('Sessiya bitib. Yenidən daxil olun.');

  const user: AuthUser = { ...current };
  if (patch.fullName !== undefined) user.fullName = patch.fullName.trim();
  if (patch.avatarUrl === null) delete user.avatarUrl;
  else if (patch.avatarUrl !== undefined) user.avatarUrl = patch.avatarUrl;

  persistUser(user);
  return user;
}

/** MOCK: cari şifrə yoxlanmır (backend hazır olanda server yoxlayacaq) */
export async function changePassword(_current: string, _next: string): Promise<void> {
  await wait(LATENCY_MS);
}
