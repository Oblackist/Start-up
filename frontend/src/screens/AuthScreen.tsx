import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import type { ScreenType } from '../types';
import { Field, PasswordInput, inputClass } from '../components/FormFields';
import { ApiErrorClass, authMfaChallenge, validateEmail } from '../lib/api';
import { useAuth } from '../lib/auth';
import { removeTurnstile, renderTurnstile, resetTurnstile, turnstileEnabled } from '../lib/turnstile';
import { BrandLogo } from '../components/BrandLogo';

interface AuthScreenProps {
  mode: 'login' | 'register';
  adminOnly?: boolean;
  onSelectScreen: (screen: ScreenType) => void;
  onAuthSuccess?: (pendingEmail?: string, deliveryError?: string) => void;
}

const BENEFITS = [
  'Mövzu üzrə analiz və bilik xəritəsi',
  'Addım-addım izahlar',
  'Zəif mövzulara fərdi gündəlik məşq planı',
];

type FieldErrors = Partial<Record<'fullName' | 'email' | 'password' | 'confirm' | 'terms', string>>;

export const AuthScreen: React.FC<AuthScreenProps> = ({ mode, adminOnly, onSelectScreen, onAuthSuccess }) => {
  const isRegister = mode === 'register';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const { login, register, refresh } = useAuth();
  const captchaContainer = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const [captchaToken, setCaptchaToken] = useState<string>();
  const [mfaChallengeToken, setMfaChallengeToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  useEffect(() => {
    if (mfaChallengeToken || !turnstileEnabled || !captchaContainer.current) return;
    let active = true;
    void renderTurnstile({
      container: captchaContainer.current,
      theme: "auto",
      onToken: (token) => { if (active) setCaptchaToken(token); },
      onExpire: () => { if (active) setCaptchaToken(undefined); },
      onError: () => { if (active) setCaptchaToken(undefined); },
    }).then((id) => {
      if (!active && id) removeTurnstile(id);
      else widgetId.current = id;
    }).catch(() => {
      if (active) setFormError('Təhlükəsizlik yoxlaması yüklənmədi.');
    });
    return () => { active = false; if (widgetId.current) removeTurnstile(widgetId.current); };
  }, [isRegister, mfaChallengeToken]);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (isRegister && fullName.trim().length < 3) next.fullName = 'Ad və soyadınızı daxil edin.';
    if (isRegister) {
      const emailCheck = validateEmail(email);
      if (!emailCheck.valid) next.email = emailCheck.message;
    } else if (!email.trim()) next.email = 'E-poçt daxil edin.';
    if (isRegister) {
      if (password.length < 8) next.password = 'Şifrə ən azı 8 simvol olmalıdır.';
      if (confirm !== password) next.confirm = 'Şifrələr uyğun gəlmir.';
      if (!terms) next.terms = 'Davam etmək üçün şərtlərlə razılaşmalısınız.';
    } else if (password.length === 0) {
      next.password = 'Şifrənizi daxil edin.';
    }
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      if (isRegister) {
        const registration = await register(fullName.trim(), email.trim().toLowerCase(), password, confirm, captchaToken);
        onAuthSuccess?.(registration.requires_verification ? registration.user.email : undefined);
      } else {
        const result = await login(email.trim().toLowerCase(), password, captchaToken);
        if (result.mfa_required && result.challenge_token) {
          setMfaChallengeToken(result.challenge_token);
          setMfaCode('');
          setFormError('');
          if (widgetId.current) resetTurnstile(widgetId.current);
          setCaptchaToken(undefined);
        } else {
          onAuthSuccess?.();
        }
      }
    } catch (err) {
      const pendingVerification = err instanceof ApiErrorClass && err.fields?.verification_pending === 'true';
      if (isRegister && pendingVerification && onAuthSuccess) {
        onAuthSuccess(email.trim().toLowerCase(), err.message);
        return;
      }
      if (widgetId.current) resetTurnstile(widgetId.current);
      setCaptchaToken(undefined);
      const message = err instanceof ApiErrorClass ? err.message : 'Xəta baş verdi. Bir az sonra yenidən cəhd edin.';
      setFormError(!isRegister && pendingVerification ? 'E-poçt və ya parol yanlışdır' : message);
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!mfaChallengeToken || loading) return;
    setLoading(true);
    setFormError('');
    try {
      await authMfaChallenge({ challenge_token: mfaChallengeToken, code: mfaCode.trim() });
      await refresh();
      setMfaChallengeToken('');
      setMfaCode('');
      onAuthSuccess?.();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Doğrulama uğursuz oldu.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => onSelectScreen(isRegister ? 'login' : 'register');

  return (
    <div className="flex-1 w-full bg-canvas dark:bg-canvas-dark transition-colors">
      <div className={(adminOnly ? 'max-w-lg' : 'max-w-[1080px]') + ' mx-auto px-3 py-5 sm:px-6 sm:py-10 lg:px-8 lg:py-16'}>
        <div className={(adminOnly ? '' : 'grid lg:grid-cols-5 ') + 'rounded-[24px] overflow-hidden border border-stone-200 dark:border-stone-800 shadow-calm-lg'}>
          {/* Sol panel: dəyər təklifi (yalnız geniş ekranda) */}
          {!adminOnly && <aside className="hidden lg:flex lg:col-span-2 relative flex-col justify-between bg-brand-50 dark:bg-ink text-ink dark:text-white p-10 overflow-hidden border-r border-stone-200 dark:border-stone-800">
            <div
              className="absolute inset-0 pointer-events-none opacity-80 dark:opacity-20"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 85% 10%, var(--color-brand-100) 0%, transparent 60%)',
              }}
            />
            <div className="relative space-y-6">
              <BrandLogo className="w-24 h-14" />
              <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-balance">
                Hazırlığını ölç, zəif mövzularını tap.
              </h2>
              <ul className="space-y-3.5 text-sm text-stone-700 dark:text-stone-300">
                {BENEFITS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-brand dark:text-gold" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="relative text-xs text-stone-500 dark:text-stone-400">
              9–11-ci siniflər üçün DİM buraxılış standartına uyğun hazırlıq.
            </p>
          </aside>}

          {/* Sağ panel: forma */}
          <section className="bg-surface p-4 transition-colors max-sm:[&_input:not([type=checkbox])]:text-base sm:p-10 lg:col-span-3 dark:bg-surface-dark">
            <div className="max-w-md mx-auto space-y-6">
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink dark:text-white">
                  {mfaChallengeToken ? 'İki mərhələli doğrulama' : adminOnly ? 'Admin girişi' : isRegister ? 'Qeydiyyatdan keç' : 'Daxil ol'}
                </h1>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  {mfaChallengeToken
                    ? 'Authenticator tətbiqinin kodunu və ya birdəfəlik bərpa kodunu daxil et.'
                    : isRegister
                    ? 'Hesab yarat və ilk sınaq testini dərhal ver.'
                    : adminOnly ? 'Admin səlahiyyəti verilmiş hesabla daxil ol.'
                    : 'Hesabına daxil ol və hazırlığını davam etdir.'}
                </p>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={mfaChallengeToken ? handleMfaSubmit : handleSubmit} noValidate className="space-y-4">
                {mfaChallengeToken ? (
                  <Field id="mfaCode" label="Authenticator və ya bərpa kodu">
                    <input
                      id="mfaCode"
                      value={mfaCode}
                      onChange={(event) => setMfaCode(event.target.value)}
                      autoComplete="one-time-code"
                      inputMode="text"
                      required
                      maxLength={64}
                      className={inputClass(false)}
                    />
                  </Field>
                ) : <>
                {isRegister && (
                  <Field id="fullName" label="Ad və soyad" error={errors.fullName}>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                      placeholder="Məsələn: Aysel Yusifli"
                      aria-invalid={!!errors.fullName}
                      aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                      className={inputClass(!!errors.fullName)}
                    />
                  </Field>
                )}

                <Field id="email" label="E-poçt" error={errors.email}>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="ad@numune.az"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className={inputClass(!!errors.email)}
                  />
                </Field>

                <Field id="password" label="Şifrə" error={errors.password}>
                  <PasswordInput
                    id="password"
                    value={password}
                    onChange={setPassword}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    placeholder={isRegister ? 'Ən azı 8 simvol' : 'Şifrəniz'}
                    error={errors.password}
                  />
                </Field>

                {isRegister && (
                  <Field id="confirm" label="Şifrəni təkrarla" error={errors.confirm}>
                    <PasswordInput
                      id="confirm"
                      value={confirm}
                      onChange={setConfirm}
                      autoComplete="new-password"
                      placeholder="Şifrəni yenidən yazın"
                      error={errors.confirm}
                    />
                  </Field>
                )}

                {isRegister && (
                  <div className="space-y-1.5">
                    <label className="flex items-start gap-2.5 text-sm text-stone-600 dark:text-stone-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={terms}
                        onChange={(e) => setTerms(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded accent-brand"
                      />
                      <span>
                        <span className="font-semibold text-ink dark:text-paper">
                          İstifadə şərtləri
                        </span>{' '}
                        və{' '}
                        <span className="font-semibold text-ink dark:text-paper">
                          məxfilik siyasəti
                        </span>{' '}
                        ilə razıyam.
                      </span>
                    </label>
                    {errors.terms && (
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">
                        {errors.terms}
                      </p>
                    )}
                  </div>
                )}
                </>}

                {turnstileEnabled && !mfaChallengeToken && (
                  <div ref={captchaContainer} />
                )}

                <button
                  type="submit"
                  disabled={loading || (!mfaChallengeToken && turnstileEnabled && !captchaToken)}
                  className="w-full h-12 rounded-[12px] bg-brand hover:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 dark:text-ink text-white font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{loading ? 'Gözləyin...' : mfaChallengeToken ? 'Təsdiqlə' : isRegister ? 'Hesab yarat' : 'Daxil ol'}</span>
                </button>
              </form>

              {isRegister && (
                <button type="button" onClick={() => onSelectScreen('verify-email')} className="block mx-auto text-sm font-semibold text-brand-fg hover:underline">
                  E-poçt üçün təsdiq kodum var
                </button>
              )}

              {mfaChallengeToken && (
                <button
                  type="button"
                  onClick={() => { setMfaChallengeToken(''); setMfaCode(''); setFormError(''); }}
                  className="text-sm font-semibold text-brand-fg hover:underline"
                >
                  Parol girişinə qayıt
                </button>
              )}

              {!isRegister && !mfaChallengeToken && (
                <button type="button" onClick={() => onSelectScreen('password-reset')} className="block mx-auto text-sm font-semibold text-brand-fg hover:underline">
                  Şifrəni unutmusunuz?
                </button>
              )}

              {!adminOnly && !mfaChallengeToken && <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
                {isRegister ? 'Artıq hesabın var?' : 'Hesabın yoxdur?'}{' '}
                <button
                  type="button"
                  onClick={switchMode}
                  className="font-semibold text-brand-fg hover:underline"
                >
                  {isRegister ? 'Daxil ol' : 'Qeydiyyatdan keç'}
                </button>
              </p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
