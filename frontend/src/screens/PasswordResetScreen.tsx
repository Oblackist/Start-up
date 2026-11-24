import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Field, PasswordInput, inputClass } from '../components/FormFields';
import { authPasswordResetConfirm, authPasswordResetRequest } from '../lib/api';
import { useNavigate } from '../lib/navigation';

export function PasswordResetScreen({ initialToken }: { initialToken: string }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(initialToken);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [sent, setSent] = useState(false);
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialToken) {
      window.history.replaceState(window.history.state, document.title, window.location.pathname);
    }
  }, [initialToken]);

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await authPasswordResetRequest({ email: email.trim().toLowerCase() });
      setSent(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Sorğu göndərilmədi.');
    } finally {
      setBusy(false);
    }
  };

  const confirmReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 8 || !/[A-Za-zÀ-ÿİıŞĞƏəÇçÖöÜü]/.test(password) || !/\d/.test(password)) {
      setError('Şifrə ən azı 8 simvol, bir hərf və bir rəqəm olmalıdır.');
      return;
    }
    if (password !== confirm) {
      setError('Şifrələr uyğun gəlmir.');
      return;
    }
    setBusy(true);
    try {
      await authPasswordResetConfirm({ token, new_password: password });
      setToken('');
      setPassword('');
      setConfirm('');
      setComplete(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Keçid etibarsızdır və ya vaxtı bitib.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="max-w-lg w-full mx-auto px-4 py-10 sm:py-16">
      <div className="bg-surface dark:bg-surface-dark border border-stone-200 dark:border-stone-800 rounded-[20px] p-6 sm:p-8 space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold">{complete ? 'Şifrə yeniləndi' : token ? 'Yeni şifrə seç' : 'Şifrəni bərpa et'}</h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
            {complete
              ? 'Hesabınla yeni şifrə vasitəsilə daxil ola bilərsən.'
              : token
                ? 'E-poçtuna göndərilən birdəfəlik keçid 30 dəqiqə qüvvədədir.'
                : 'E-poçt ünvanını daxil et. Ünvan qeydiyyatlıdırsa, bərpa keçidi göndəriləcək.'}
          </p>
        </div>

        {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
        {sent && !token && (
          <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
            Əgər bu ünvanla hesab varsa, bərpa keçidi göndərildi. E-poçtunu və spam qovluğunu yoxla.
          </p>
        )}
        {complete && (
          <p role="status" className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4" /> Şifrən uğurla dəyişdirildi.
          </p>
        )}

        {!complete && token && (
          <form onSubmit={confirmReset} className="space-y-4">
            <Field id="reset-password" label="Yeni şifrə">
              <PasswordInput id="reset-password" value={password} onChange={setPassword} autoComplete="new-password" placeholder="Ən azı 8 simvol" />
            </Field>
            <Field id="reset-confirm" label="Yeni şifrəni təkrarla">
              <PasswordInput id="reset-confirm" value={confirm} onChange={setConfirm} autoComplete="new-password" placeholder="Şifrəni yenidən yaz" />
            </Field>
            <button disabled={busy} className="w-full h-11 rounded-xl bg-brand text-white font-semibold disabled:opacity-50">
              {busy ? 'Yadda saxlanılır…' : 'Şifrəni yenilə'}
            </button>
          </form>
        )}

        {!complete && !token && !sent && (
          <form onSubmit={requestReset} className="space-y-4">
            <Field id="reset-email" label="E-poçt">
              <input id="reset-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass(false)} />
            </Field>
            <button disabled={busy} className="w-full h-11 rounded-xl bg-brand text-white font-semibold disabled:opacity-50">
              {busy ? 'Göndərilir…' : 'Bərpa keçidi göndər'}
            </button>
          </form>
        )}

        <button type="button" onClick={() => navigate('/login')} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-fg hover:underline">
          <ArrowLeft className="w-4 h-4" /> Girişə qayıt
        </button>
      </div>
    </section>
  );
}
