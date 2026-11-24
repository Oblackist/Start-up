import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Mail, Moon, Sun } from 'lucide-react';
import { authResendVerification, fetchJson, validateEmail } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { User } from '../types';
import { Field, inputClass } from '../components/FormFields';
import { BrandLogo } from '../components/BrandLogo';

const CODE_LENGTH = 6;
const RESEND_DELAY_MS = 30_000;
const codeDigits = (value: string) => value.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);

export function VerifyEmailScreen({
  initialEmail,
  initialError,
  isDark,
  onSetDark,
  onEditEmail,
  onVerified,
}: {
  initialEmail: string;
  initialError: string;
  isDark: boolean;
  onSetDark: (dark: boolean) => void;
  onEditEmail: () => void;
  onVerified: () => void;
}) {
  const { refresh } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState('');
  const [focused, setFocused] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [localPart, domain] = initialEmail.split('@');
  const pending = Boolean(initialEmail && localPart && domain);
  const validEmail = validateEmail(email.trim()).valid;
  const activeDigit = Math.min(code.length, CODE_LENGTH - 1);

  useEffect(() => {
    if (!resendAt) return;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0) setResendAt(0);
    }, 300);
    return () => window.clearInterval(timer);
  }, [resendAt]);

  const updateCode = (value: string) => {
    setCode(codeDigits(value));
    setError('');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || resending || !validEmail || code.length !== CODE_LENGTH) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fetchJson<{ user: User }>('/auth/verify-otp', {
        method: 'POST',
        body: { email: email.trim(), code },
      });
      await refresh();
      onVerified();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Hesabı təsdiqləmək mümkün olmadı.');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (busy || resending || seconds > 0 || !validEmail) return;
    setResending(true);
    setNotice('');
    setError('');
    try {
      await authResendVerification({ email: email.trim() });
      setNotice('Kod sorğusu qəbul edildi. Gələnlər və spam qovluğunu yoxla.');
      setCode('');
      setSeconds(RESEND_DELAY_MS / 1000);
      setResendAt(Date.now() + RESEND_DELAY_MS);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Kod sorğusu göndərilmədi.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex min-h-[70px] items-center justify-between gap-3 border-b border-stone-200 bg-white px-3 sm:px-10 dark:border-stone-800 dark:bg-nav-dark">
        <a href="/" className="flex items-center gap-2 whitespace-nowrap text-base font-extrabold tracking-tight sm:text-lg">
          <BrandLogo className="w-12 h-9" />
          <span aria-hidden="true">Career Arena</span>
        </a>
        <div role="group" aria-label="Görünüş rejimi" className="flex gap-0.5 rounded-xl border border-stone-200 bg-stone-50 p-1 dark:border-stone-800 dark:bg-canvas-dark">
          {[{ dark: false, icon: Sun, label: 'İşıqlı' }, { dark: true, icon: Moon, label: 'Qaranlıq' }].map(({ dark, icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              aria-pressed={isDark === dark}
              onClick={() => onSetDark(dark)}
              className="flex min-h-9 items-center gap-1 rounded-lg border border-transparent px-2 text-xs text-stone-600 aria-pressed:border-stone-200 aria-pressed:bg-white aria-pressed:font-bold aria-pressed:text-brand-fg sm:px-3 dark:text-stone-300 dark:aria-pressed:border-stone-800 dark:aria-pressed:bg-surface-dark"
            >
              <Icon className="hidden size-3.5 min-[400px]:block" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid flex-1 place-items-center bg-[#f1f6f5] bg-[radial-gradient(ellipse_at_0%_0%,#d9eee7,transparent_52%),radial-gradient(ellipse_at_100%_100%,#d9eee7,transparent_46%)] px-3 py-8 sm:py-12 dark:bg-canvas-dark dark:bg-[radial-gradient(ellipse_at_0%_0%,#15332f,transparent_52%),radial-gradient(ellipse_at_100%_100%,#15332f,transparent_46%)]">
        <section aria-labelledby="verify-heading" className="w-full max-w-[470px] rounded-[26px] border border-stone-200 bg-surface px-5 py-7 shadow-calm-lg sm:px-9 dark:border-stone-800 dark:bg-surface-dark">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-stone-400">
            <span>Qeydiyyat</span>
            <span className="flex items-center gap-2">
              Addım 2/2
              <span aria-hidden="true" className="flex gap-1">
                <span className="h-1 w-3.5 rounded-full bg-brand-fg" />
                <span className="h-1 w-3.5 rounded-full bg-[#e0a93b]" />
              </span>
            </span>
          </div>

          <div className="my-7 text-center">
            <div aria-hidden="true" className="relative mx-auto mb-4 grid size-[62px] place-items-center rounded-[19px] border border-brand-fg/15 bg-brand-soft text-brand-fg dark:bg-brand-950/45">
              <Mail className="size-7" />
              <span className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full border-2 border-white bg-[#e0a93b] text-ink dark:border-surface-dark">
                <Check className="size-3.5" />
              </span>
            </div>
            <h1 id="verify-heading" className="text-[27px] font-extrabold tracking-tight sm:text-[31px]">E-poçtunu təsdiqlə</h1>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
              {pending && !initialError
                ? 'Bu ünvana göndərdiyimiz 6 rəqəmli kodu daxil et.'
                : 'E-poçt ünvanın üçün 6 rəqəmli təsdiq kodunu daxil et.'}
            </p>
            {pending && (
              <span className="mt-3 inline-flex max-w-full items-center gap-2 break-all rounded-lg bg-brand-soft px-3 py-1.5 text-sm font-bold text-brand-fg dark:bg-brand-950/45">
                <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
                {Array.from(localPart)[0]}••••••@{domain}
              </span>
            )}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {!pending && (
              <Field label="E-poçt" id="verify-email">
                <input id="verify-email" type="email" required autoComplete="email"
                  value={email} onChange={(event) => { setEmail(event.target.value); updateCode(''); }}
                  className={inputClass(false)} />
              </Field>
            )}
            <div>
              <label htmlFor="verify-code" className="mb-2 block text-sm font-bold">Təsdiq kodu</label>
              <div className="relative">
                <div aria-hidden="true" className="grid grid-cols-6 gap-1.5 sm:gap-2">
                  {Array.from({ length: CODE_LENGTH }, (_, index) => (
                    <span
                      key={index}
                      className={`grid h-12 place-items-center rounded-[10px] border font-mono text-lg font-bold sm:h-14 ${focused && index === activeDigit
                        ? 'border-brand-fg bg-white ring-2 ring-brand-fg/25 dark:bg-surface-dark'
                        : 'border-stone-300 bg-stone-50 dark:border-stone-700 dark:bg-inset-dark'}`}
                    >
                      {code[index] || <span className={focused && index === activeDigit
                        ? 'h-5 w-0.5 rounded bg-brand-fg'
                        : 'size-1.5 rounded-full bg-stone-300 dark:bg-stone-600'} />}
                    </span>
                  ))}
                </div>
                <input
                  id="verify-code"
                  required
                  pattern="[0-9]{6}"
                  maxLength={CODE_LENGTH}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  autoFocus={pending}
                  disabled={busy || resending}
                  value={code}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onChange={(event) => updateCode(event.target.value)}
                  onPaste={(event) => {
                    const pasted = codeDigits(event.clipboardData.getData('text'));
                    if (pasted.length === CODE_LENGTH) {
                      event.preventDefault();
                      updateCode(pasted);
                    }
                  }}
                  className="absolute inset-0 size-full cursor-text opacity-0"
                />
              </div>
            </div>
            <button type="submit" disabled={busy || resending || code.length !== CODE_LENGTH || !validEmail}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 font-bold text-white hover:bg-brand-700 disabled:opacity-75 dark:bg-brand-400 dark:text-ink dark:hover:bg-brand-300">
              {busy ? 'Təsdiqlənir…' : 'Təsdiqlə'} <ArrowRight className="size-4" aria-hidden="true" />
            </button>
            {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
            {notice && <p role="status" className="text-sm text-brand-fg">{notice}</p>}
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-1.5 text-sm">
            <span className="text-stone-600 dark:text-stone-300">Kod gəlmədi?</span>
            <button type="button" onClick={resend} disabled={busy || resending || seconds > 0 || !validEmail}
              className="min-h-10 font-bold text-brand-fg underline underline-offset-4 disabled:opacity-70">
              {resending ? 'Göndərilir…' : seconds > 0 ? `Yenidən göndər (${seconds} san.)` : 'Kodu yenidən göndər'}
            </button>
          </div>
          <div className="mt-2 flex justify-center border-t border-stone-200 pt-2 dark:border-stone-800">
            <button type="button" onClick={onEditEmail} disabled={busy || resending}
              className="flex min-h-10 items-center gap-2 text-sm font-semibold text-stone-600 hover:text-brand-fg dark:text-stone-300">
              <ArrowLeft className="size-4" aria-hidden="true" /> {pending ? 'E-poçtu dəyiş' : 'Qeydiyyata qayıt'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
