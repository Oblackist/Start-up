import React, { useState } from 'react';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { AuthUser, ScreenType } from '../types';
import { Field, PasswordInput, inputClass } from '../components/FormFields';
import { AuthError, login, register } from '../services/authService';
import { BrandLogo } from '../components/BrandLogo';

interface AuthScreenProps {
  mode: 'login' | 'register';
  onSelectScreen: (screen: ScreenType) => void;
  onAuthSuccess: (user: AuthUser, isNewAccount: boolean) => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const BENEFITS = [
  'Mövzu üzrə analiz və bilik xəritəsi',
  'AI ilə addım-addım izahlar',
  'Zəif mövzulara fərdi gündəlik məşq planı',
];

type FieldErrors = Partial<Record<'fullName' | 'email' | 'password' | 'confirm' | 'terms', string>>;

export const AuthScreen: React.FC<AuthScreenProps> = ({ mode, onSelectScreen, onAuthSuccess }) => {
  const isRegister = mode === 'register';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const [remember, setRemember] = useState(true);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (isRegister && fullName.trim().length < 3) next.fullName = 'Ad və soyadınızı daxil edin.';
    if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Düzgün e-poçt ünvanı daxil edin.';
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
    setNotice('');

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      const user = isRegister
        ? await register({ fullName, email, password })
        : await login(email, password, remember);
      onAuthSuccess(user, isRegister);
    } catch (err) {
      setFormError(
        err instanceof AuthError ? err.message : 'Xəta baş verdi. Bir az sonra yenidən cəhd edin.',
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => onSelectScreen(isRegister ? 'login' : 'register');

  return (
    <div className="flex-1 w-full bg-canvas dark:bg-canvas-dark transition-colors">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="grid lg:grid-cols-5 rounded-[24px] overflow-hidden border border-stone-200 dark:border-stone-800 shadow-calm-lg">
          {/* Sol panel: dəyər təklifi (yalnız geniş ekranda) */}
          <aside className="hidden lg:flex lg:col-span-2 relative flex-col justify-between bg-brand-50 dark:bg-ink text-ink dark:text-white p-10 overflow-hidden border-r border-stone-200 dark:border-stone-800">
            <div
              className="absolute inset-0 pointer-events-none opacity-80 dark:opacity-20"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 85% 10%, var(--color-brand-100) 0%, transparent 60%)',
              }}
            />
            <div className="relative space-y-6">
              <BrandLogo className="w-16 h-16 shadow-calm rounded-[16px]" />
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
          </aside>

          {/* Sağ panel: forma */}
          <section className="lg:col-span-3 bg-surface dark:bg-surface-dark p-6 sm:p-10 transition-colors">
            <div className="max-w-md mx-auto space-y-6">
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink dark:text-white">
                  {isRegister ? 'Qeydiyyatdan keç' : 'Daxil ol'}
                </h1>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  {isRegister
                    ? 'Hesab yarat və ilk sınaq testini dərhal ver.'
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

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
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

                {isRegister ? (
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
                ) : (
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <label className="flex items-center gap-2 text-stone-600 dark:text-stone-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="h-4 w-4 rounded accent-brand"
                      />
                      <span>Məni xatırla</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setNotice('Şifrə bərpası tezliklə əlavə olunacaq.')}
                      className="font-semibold text-brand-fg hover:underline"
                    >
                      Şifrəni unutmusan?
                    </button>
                  </div>
                )}

                {notice && (
                  <p role="status" className="text-xs text-stone-500 dark:text-stone-400">
                    {notice}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-[12px] bg-brand hover:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 dark:text-ink text-white font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{loading ? 'Gözləyin...' : isRegister ? 'Hesab yarat' : 'Daxil ol'}</span>
                </button>
              </form>

              <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
                {isRegister ? 'Artıq hesabın var?' : 'Hesabın yoxdur?'}{' '}
                <button
                  type="button"
                  onClick={switchMode}
                  className="font-semibold text-brand-fg hover:underline"
                >
                  {isRegister ? 'Daxil ol' : 'Qeydiyyatdan keç'}
                </button>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
