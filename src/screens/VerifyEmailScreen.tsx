import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, MailCheck } from 'lucide-react';
import type { AuthUser, ScreenType } from '../types';
import {
  AuthError,
  DEMO_VERIFICATION_CODE,
  VERIFICATION_CODE_LENGTH,
  resendVerificationCode,
  verifyEmail,
} from '../services/authService';

interface VerifyEmailScreenProps {
  user: AuthUser | null;
  onVerified: (user: AuthUser) => void;
  onSelectScreen: (screen: ScreenType) => void;
}

const RESEND_SECONDS = 60;

const maskEmail = (email: string) => {
  const [name, domain] = email.split('@');
  return `${name.slice(0, 2)}${'*'.repeat(Math.max(2, name.length - 2))}@${domain}`;
};

export const VerifyEmailScreen: React.FC<VerifyEmailScreenProps> = ({
  user,
  onVerified,
  onSelectScreen,
}) => {
  const [digits, setDigits] = useState<string[]>(Array(VERIFICATION_CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(!!user?.emailVerified);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [resent, setResent] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  useEffect(() => {
    if (!done) refs.current[0]?.focus();
  }, [done]);

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-10 bg-canvas dark:bg-canvas-dark">
        <div className="text-center space-y-4">
          <p className="text-stone-600 dark:text-stone-300">
            Əvvəlcə qeydiyyatdan keç və ya daxil ol.
          </p>
          <button
            onClick={() => onSelectScreen('login')}
            className="h-11 px-6 rounded-[12px] bg-brand text-white text-sm font-semibold"
          >
            Daxil ol
          </button>
        </div>
      </div>
    );
  }

  const submit = async (code: string) => {
    setLoading(true);
    setError('');
    try {
      const updated = await verifyEmail(code);
      onVerified(updated);
      setDone(true);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Xəta baş verdi. Yenidən cəhd edin.');
      setDigits(Array(VERIFICATION_CODE_LENGTH).fill(''));
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const setAt = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      setDigits((d) => d.map((x, i) => (i === index ? '' : x)));
      return;
    }
    // Bir neçə rəqəm (yapışdırma / avtomatik doldurma) gələrsə, xanalara bölüb yerləşdir
    const next = [...digits];
    clean
      .slice(0, VERIFICATION_CODE_LENGTH - index)
      .split('')
      .forEach((ch, i) => {
        next[index + i] = ch;
      });
    setDigits(next);
    const focusIndex = Math.min(index + clean.length, VERIFICATION_CODE_LENGTH - 1);
    refs.current[focusIndex]?.focus();
    if (next.every(Boolean)) void submit(next.join(''));
  };

  const onKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) refs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < VERIFICATION_CODE_LENGTH - 1)
      refs.current[index + 1]?.focus();
  };

  const resend = async () => {
    await resendVerificationCode();
    setSeconds(RESEND_SECONDS);
    setResent(true);
    setError('');
  };

  return (
    <div className="flex-1 w-full bg-canvas dark:bg-canvas-dark py-12 px-4 transition-colors">
      <div className="max-w-md mx-auto bg-surface dark:bg-surface-dark rounded-[24px] border border-stone-200 dark:border-stone-800 shadow-calm-lg p-8 sm:p-10 text-center space-y-6">
        {done ? (
          <>
            <span className="mx-auto w-16 h-16 rounded-full bg-sage-100 dark:bg-sage-950/60 text-sage-700 dark:text-sage-300 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </span>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-ink dark:text-white">
                E-poçt təsdiqləndi
              </h1>
              <p className="text-sm text-stone-600 dark:text-stone-300">
                Hesabın tam aktivdir. Hazırlığa başlaya bilərsən.
              </p>
            </div>
            <button
              onClick={() => onSelectScreen('dashboard')}
              className="w-full h-12 rounded-[12px] bg-brand dark:bg-brand-400 dark:text-ink text-white font-semibold text-sm"
            >
              İnkişaf panelinə keç
            </button>
          </>
        ) : (
          <>
            <span className="mx-auto w-16 h-16 rounded-full bg-brand-soft dark:bg-brand-950/60 text-brand-fg flex items-center justify-center">
              <MailCheck className="w-8 h-8" />
            </span>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-ink dark:text-white">
                E-poçtunu təsdiqlə
              </h1>
              <p className="text-sm text-stone-600 dark:text-stone-300">
                <b className="text-ink dark:text-white">{maskEmail(user.email)}</b> ünvanına
                göndərilən {VERIFICATION_CODE_LENGTH} rəqəmli kodu daxil et.
              </p>
            </div>

            <div
              className="flex justify-center gap-2 sm:gap-2.5"
              role="group"
              aria-label="Təsdiq kodu"
            >
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  value={d}
                  onChange={(e) => setAt(i, e.target.value)}
                  onKeyDown={(e) => onKeyDown(i, e)}
                  onFocus={(e) => e.target.select()}
                  inputMode="numeric"
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  maxLength={VERIFICATION_CODE_LENGTH}
                  disabled={loading}
                  aria-label={`${i + 1}-ci rəqəm`}
                  className={`w-11 h-14 sm:w-12 sm:h-14 rounded-[12px] border bg-surface dark:bg-inset-dark text-center text-xl font-bold text-ink dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                    error
                      ? 'border-red-500 focus:ring-red-500/30'
                      : 'border-stone-300 dark:border-stone-700 focus:border-brand-fg focus:ring-brand-fg/30'
                  }`}
                />
              ))}
            </div>

            {error && (
              <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            {resent && !error && (
              <p role="status" className="text-sm text-sage-700 dark:text-sage-300">
                Yeni kod göndərildi.
              </p>
            )}
            {loading && (
              <p className="text-sm text-stone-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Yoxlanılır...
              </p>
            )}

            <div className="text-sm text-stone-500 dark:text-stone-400">
              {seconds > 0 ? (
                <>
                  Kodu almadın? <b className="font-mono">{seconds}</b> saniyədən sonra yenidən
                  göndərə bilərsən.
                </>
              ) : (
                <button onClick={resend} className="font-semibold text-brand-fg hover:underline">
                  Kodu yenidən göndər
                </button>
              )}
            </div>

            {import.meta.env.DEV && (
              <p className="text-xs rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 p-2.5">
                Demo rejimi: kod <b className="font-mono">{DEMO_VERIFICATION_CODE}</b> (yalnız{' '}
                <code>npm run dev</code>-də göstərilir).
              </p>
            )}

            <button
              onClick={() => onSelectScreen('dashboard')}
              className="text-sm font-semibold text-stone-500 dark:text-stone-400 hover:text-brand-fg"
            >
              Sonra təsdiqləyəcəm
            </button>
          </>
        )}
      </div>
    </div>
  );
};
