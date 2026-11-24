import { useState } from 'react';
import { authMfaConfirm, authMfaDisable, authMfaEnroll, authMfaRecoveryCodesRotate } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Field, inputClass, PasswordInput } from '../components/FormFields';

const cardClass =
  'bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4';

export function MfaSettings() {
  const { user, refresh } = useAuth();
  const [setup, setSetup] = useState<{ secret: string; otpauth_uri: string } | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [rotatePassword, setRotatePassword] = useState('');
  const [rotateCode, setRotateCode] = useState('');

  const start = async () => {
    setBusy(true);
    setError('');
    try {
      setSetup(await authMfaEnroll({ current_password: currentPassword }));
      setCurrentPassword('');
      setNotice('Authenticator tətbiqində yeni hesab əlavə et və aşağıdakı açarı daxil et.');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Quraşdırma baş tutmadı.');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await authMfaConfirm({ code: code.trim() });
      setRecoveryCodes(result.recovery_codes);
      setCode('');
      setSetup(null);
      setNotice('İki mərhələli doğrulama aktivdir. Bərpa kodlarını indi təhlükəsiz yerdə saxla.');
      await refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Kod təsdiqlənmədi.');
    } finally {
      setBusy(false);
    }
  };

  const disable = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await authMfaDisable({ code: code.trim(), current_password: currentPassword });
      setCode('');
      setCurrentPassword('');
      setRecoveryCodes([]);
      setNotice('İki mərhələli doğrulama söndürüldü. Aktiv sessiyalar yeniləndi.');
      await refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Söndürmək mümkün olmadı.');
    } finally {
      setBusy(false);
    }
  };

  const rotateRecoveryCodes = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await authMfaRecoveryCodesRotate({
        current_password: rotatePassword,
        code: rotateCode.trim(),
      });
      setRecoveryCodes(result.recovery_codes);
      setRotatePassword('');
      setRotateCode('');
      setNotice('Əvvəlki bərpa kodları ləğv edildi. Yeni kodları indi saxla.');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Bərpa kodlarını yeniləmək mümkün olmadı.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={cardClass} aria-labelledby="mfa-heading">
      <div>
        <h3 id="mfa-heading" className="text-base font-semibold">İki mərhələli doğrulama</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {user?.mfa_enabled
            ? 'Authenticator kodu və ya birdəfəlik bərpa kodu ilə giriş qorunur.'
            : 'Giriş zamanı paroldan əlavə authenticator kodu tələb et.'}
        </p>
      </div>
      {notice && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}

      {!user?.mfa_enabled && !setup && recoveryCodes.length === 0 && (
        <div className="space-y-4">
          <Field id="mfa-enroll-password" label="Təsdiq üçün cari parol">
            <PasswordInput id="mfa-enroll-password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" placeholder="Cari parol" />
          </Field>
          <button type="button" onClick={start} disabled={busy || !currentPassword} className="h-10 px-4 rounded-xl bg-brand text-white font-semibold disabled:opacity-50">
            {busy ? 'Hazırlanır…' : 'Authenticator qoş'}
          </button>
        </div>
      )}

      {setup && (
        <form onSubmit={confirm} className="space-y-4">
          <p className="text-sm">Authenticator tətbiqində bu açarı əl ilə daxil et:</p>
          <code className="block p-3 rounded-lg bg-slate-100 dark:bg-slate-900 break-all select-all">{setup.secret}</code>
          <details>
            <summary className="cursor-pointer text-sm font-semibold">Tətbiq üçün konfiqurasiya URI-si</summary>
            <code className="mt-2 block p-3 rounded-lg bg-slate-100 dark:bg-slate-900 break-all">{setup.otpauth_uri}</code>
          </details>
          <Field id="mfa-enroll-code" label="Authenticator kodu">
            <input id="mfa-enroll-code" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} className={inputClass(false)} />
          </Field>
          <button disabled={busy} className="h-10 px-4 rounded-xl bg-brand text-white font-semibold disabled:opacity-50">{busy ? 'Yoxlanılır…' : 'Təsdiqlə və aktiv et'}</button>
        </form>
      )}

      {recoveryCodes.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold">Bu kodların hər biri yalnız bir dəfə işləyir. Onları indi saxla:</p>
          <ul className="grid grid-cols-2 gap-2" aria-label="Bərpa kodları">
            {recoveryCodes.map((recoveryCode) => <li key={recoveryCode}><code className="block p-2 rounded bg-slate-100 dark:bg-slate-900 select-all">{recoveryCode}</code></li>)}
          </ul>
          <button type="button" onClick={() => { setRecoveryCodes([]); setNotice('Bərpa kodları yenidən göstərilə bilməz.'); }} className="h-10 px-4 rounded-xl border font-semibold">Kodları saxladım</button>
        </div>
      )}

      {user?.mfa_enabled && (
        <div className="space-y-5 border-t border-slate-200 dark:border-slate-700 pt-4">
          {recoveryCodes.length === 0 && (
            <form onSubmit={rotateRecoveryCodes} className="space-y-4">
              <div>
                <h4 className="font-semibold">Bərpa kodlarını yenilə</h4>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Bu əməliyyat əvvəlki kodları dərhal ləğv edir.</p>
              </div>
              <Field id="mfa-rotate-password" label="Cari parol">
                <PasswordInput id="mfa-rotate-password" value={rotatePassword} onChange={setRotatePassword} autoComplete="current-password" placeholder="Cari parol" />
              </Field>
              <Field id="mfa-rotate-code" label="Təzə authenticator kodu">
                <input id="mfa-rotate-code" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={rotateCode} onChange={(event) => setRotateCode(event.target.value)} className={inputClass(false)} />
              </Field>
              <button disabled={busy} className="h-10 px-4 rounded-xl border font-semibold disabled:opacity-50">{busy ? 'Yenilənir…' : 'Yeni bərpa kodları yarat'}</button>
            </form>
          )}
          <form onSubmit={disable} className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4">
            <h4 className="font-semibold">2FA-nı söndür</h4>
            <Field id="mfa-disable-password" label="Cari parol">
              <PasswordInput id="mfa-disable-password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" placeholder="Cari parol" />
            </Field>
            <Field id="mfa-disable-code" label="Authenticator kodu">
              <input id="mfa-disable-code" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} className={inputClass(false)} />
            </Field>
            <button disabled={busy} className="h-10 px-4 rounded-xl border border-red-300 text-red-700 dark:text-red-300 font-semibold disabled:opacity-50">{busy ? 'Yoxlanılır…' : '2FA-nı söndür'}</button>
          </form>
        </div>
      )}
    </section>
  );
}
