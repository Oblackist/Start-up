/**
 * AUTH SERVİSİ — MOCK (müvəqqəti).
 *
 * Backend hazır olanda yalnız bu faylın funksiyalarını API çağırışları ilə əvəz etmək kifayətdir,
 * UI kodu dəyişməz qalır. Gözlənilən endpoint-lər:
 *   POST /auth/register  { fullName, email, password, grade } → { user, token }
 *   POST /auth/login     { email, password }                   → { user, token }
 *   POST /auth/logout
 *
 * Hazırkı davranış (yalnız brauzerdə, serversiz):
 *  - Qeydiyyatdan keçən istifadəçilər localStorage-də saxlanır. Şifrə SAXLANMIR və yoxlanmır.
 *  - Daxil olmaq üçün e-poçt əvvəlcə qeydiyyatdan keçmiş olmalıdır.
 */
import type { AuthUser, Grade } from '../types';

const USERS_KEY = 'ca-users';
const SESSION_KEY = 'ca-session';
const LATENCY_MS = 600;

export class AuthError extends Error {}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  grade: Grade;
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

export function getSession(): AuthUser | null {
  return (
    readJson<AuthUser>(localStorage, SESSION_KEY) ?? readJson<AuthUser>(sessionStorage, SESSION_KEY)
  );
}

export async function register(input: RegisterInput): Promise<AuthUser> {
  await wait(LATENCY_MS);
  const email = normalizeEmail(input.email);
  const users = readJson<UserRegistry>(localStorage, USERS_KEY) ?? {};

  if (users[email]) {
    throw new AuthError('Bu e-poçt artıq qeydiyyatdan keçib. Daxil olmağa cəhd edin.');
  }

  const stored: StoredUser = {
    id: crypto.randomUUID(),
    fullName: input.fullName.trim(),
    grade: input.grade,
  };
  writeJson(localStorage, USERS_KEY, { ...users, [email]: stored });

  const user: AuthUser = { ...stored, email };
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
  const users = readJson<UserRegistry>(localStorage, USERS_KEY) ?? {};
  const stored = users[normalized];

  if (!stored) {
    throw new AuthError('Bu e-poçt ilə hesab tapılmadı. Əvvəlcə qeydiyyatdan keçin.');
  }

  const user: AuthUser = { ...stored, email: normalized };
  const target = remember ? localStorage : sessionStorage;
  writeJson(target, SESSION_KEY, user);
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
