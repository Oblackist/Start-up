import React, { useRef, useState } from 'react';
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  Circle,
  Loader2,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import type { AuthUser, ScreenType } from '../types';
import { Avatar } from '../components/Avatar';
import { Field, PasswordInput, inputClass } from '../components/FormFields';
import { AuthError, changePassword, updateProfile } from '../services/authService';

interface ProfileScreenProps {
  user: AuthUser | null;
  onUserChange: (user: AuthUser) => void;
  onSelectScreen: (screen: ScreenType) => void;
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const PLAN_LABEL = { free: 'Free', premium: 'Premium', school: 'Məktəb və kurslar' } as const;

/** Şəkli 256×256 kvadrata kəsib kiçildir (yaddaş və yükləmə həcmi üçün) */
function resizeToDataUrl(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('canvas'));
      const side = Math.min(img.width, img.height);
      ctx.drawImage(
        img,
        (img.width - side) / 2,
        (img.height - side) / 2,
        side,
        side,
        0,
        0,
        size,
        size,
      );
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('load'));
    };
    img.src = url;
  });
}

const passwordRules = (value: string, current: string) => [
  { label: 'Ən azı 8 simvol', ok: value.length >= 8 },
  { label: 'Ən azı bir hərf', ok: /[A-Za-zƏəİıÖöÜüÇçŞşĞğ]/.test(value) },
  { label: 'Ən azı bir rəqəm', ok: /\d/.test(value) },
  { label: 'Cari şifrədən fərqli olmalıdır', ok: value.length > 0 && value !== current },
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onUserChange,
  onSelectScreen,
}) => {
  const [tab, setTab] = useState<'info' | 'password'>('info');
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.fullName ?? '');
  const [nameError, setNameError] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwErrors, setPwErrors] = useState<Partial<Record<'current' | 'next' | 'confirm', string>>>(
    {},
  );
  const [pwLoading, setPwLoading] = useState(false);
  const [pwDone, setPwDone] = useState(false);
  const [pwFormError, setPwFormError] = useState('');

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-10 bg-canvas dark:bg-canvas-dark">
        <div className="max-w-sm text-center space-y-4 bg-surface dark:bg-surface-dark rounded-[20px] border border-stone-200 dark:border-stone-800 shadow-calm p-8">
          <h1 className="text-xl font-bold text-ink dark:text-white">
            Profilə baxmaq üçün daxil ol
          </h1>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => onSelectScreen('login')}
              className="h-11 px-6 rounded-[12px] bg-brand text-white text-sm font-semibold"
            >
              Daxil ol
            </button>
            <button
              onClick={() => onSelectScreen('register')}
              className="h-11 px-6 rounded-[12px] border border-stone-300 dark:border-stone-700 text-sm font-semibold"
            >
              Qeydiyyat
            </button>
          </div>
        </div>
      </div>
    );
  }

  const flash = (msg: string) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setAvatarError('');
    if (!ALLOWED_TYPES.includes(file.type))
      return setAvatarError('Yalnız PNG, JPG və ya WEBP şəkli yükləyə bilərsən.');
    if (file.size > MAX_AVATAR_BYTES) return setAvatarError('Şəkil 2 MB-dan böyük ola bilməz.');
    try {
      const dataUrl = await resizeToDataUrl(file);
      onUserChange(await updateProfile({ avatarUrl: dataUrl }));
      flash('Profil şəkli yeniləndi.');
    } catch {
      setAvatarError('Şəkli oxumaq mümkün olmadı. Başqa şəkil yoxlayın.');
    }
  };

  const removeAvatar = async () => {
    onUserChange(await updateProfile({ avatarUrl: null }));
    flash('Profil şəkli silindi.');
  };

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 3) return setNameError('Ad və soyadınızı daxil edin.');
    setNameError('');
    setSaving(true);
    onUserChange(await updateProfile({ fullName: name }));
    setSaving(false);
    flash('Məlumatlar yadda saxlandı.');
  };

  const rules = passwordRules(next, current);
  const score = rules.filter((r) => r.ok).length;
  const strength = [
    { label: 'Çox zəif', cls: 'bg-red-500' },
    { label: 'Zəif', cls: 'bg-red-500' },
    { label: 'Orta', cls: 'bg-amber-500' },
    { label: 'Yaxşı', cls: 'bg-sage-500' },
    { label: 'Güclü', cls: 'bg-sage-600' },
  ][score];

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwDone(false);
    setPwFormError('');
    const errs: typeof pwErrors = {};
    if (!current) errs.current = 'Cari şifrəni daxil edin.';
    if (rules.some((r) => !r.ok)) errs.next = 'Yeni şifrə tələbləri ödəmir.';
    if (confirm !== next) errs.confirm = 'Şifrələr uyğun gəlmir.';
    setPwErrors(errs);
    if (Object.keys(errs).length) return;

    setPwLoading(true);
    try {
      await changePassword(current, next);
      setPwDone(true);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setPwFormError(err instanceof AuthError ? err.message : 'Xəta baş verdi. Yenidən cəhd edin.');
    } finally {
      setPwLoading(false);
    }
  };

  const joined = new Date(user.createdAt).toLocaleDateString('az-AZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const tabs = [
    { id: 'info' as const, label: 'Profil məlumatları' },
    { id: 'password' as const, label: 'Şifrəni dəyiş' },
  ];

  return (
    <div className="w-full flex-1 bg-canvas dark:bg-canvas-dark text-ink dark:text-paper py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-[1100px] mx-auto space-y-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink dark:text-white tracking-tight">
          Profil
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sol kart: şəkil */}
          <aside className="lg:col-span-4 bg-surface dark:bg-surface-dark rounded-[20px] border border-stone-200 dark:border-stone-800 shadow-calm p-6 space-y-5 text-center">
            <div className="relative w-fit mx-auto">
              <Avatar
                name={user.fullName}
                src={user.avatarUrl}
                size={128}
                className="!rounded-[28px]"
              />
              <button
                onClick={() => fileRef.current?.click()}
                aria-label="Şəkil yüklə"
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-brand dark:bg-brand-400 dark:text-ink text-white flex items-center justify-center shadow-calm border-2 border-surface dark:border-surface-dark"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => {
                  void handleFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
            <div>
              <div className="text-xl font-bold text-ink dark:text-white">{user.fullName}</div>
              <div className="text-sm text-stone-500 dark:text-stone-400 break-all">
                {user.email}
              </div>
            </div>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="h-9 px-4 rounded-[10px] border border-stone-300 dark:border-stone-700 text-sm font-semibold hover:border-brand-fg"
              >
                Şəkil yüklə
              </button>
              {user.avatarUrl && (
                <button
                  onClick={removeAvatar}
                  aria-label="Şəkli sil"
                  className="h-9 w-9 rounded-[10px] border border-stone-300 dark:border-stone-700 flex items-center justify-center text-stone-500 hover:text-red-600 hover:border-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-stone-400">PNG, JPG və ya WEBP · maksimum 2 MB</p>
            {avatarError && (
              <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
                {avatarError}
              </p>
            )}

            <dl className="grid grid-cols-3 gap-2 pt-4 border-t border-stone-200 dark:border-stone-800 text-center">
              {[
                ['14', 'İmtahan'],
                ['85%', 'Orta nəticə'],
                ['#14', 'Reytinq'],
              ].map(([v, l]) => (
                <div key={l}>
                  <dd className="font-extrabold text-ink dark:text-white">{v}</dd>
                  <dt className="text-[11px] text-stone-500 dark:text-stone-400">{l}</dt>
                </div>
              ))}
            </dl>
          </aside>

          {/* Sağ: tab-lar */}
          <section className="lg:col-span-8 bg-surface dark:bg-surface-dark rounded-[20px] border border-stone-200 dark:border-stone-800 shadow-calm">
            <div
              role="tablist"
              className="flex gap-1 px-4 pt-3 border-b border-stone-200 dark:border-stone-800"
            >
              {tabs.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                    tab === t.id
                      ? 'border-brand-fg text-brand-fg'
                      : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-ink dark:hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-6 sm:p-8">
              {savedMsg && (
                <p
                  role="status"
                  className="mb-5 rounded-xl bg-sage-50 dark:bg-sage-950/40 border border-sage-200 dark:border-sage-900/60 text-sage-700 dark:text-sage-300 text-sm px-4 py-2.5 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> {savedMsg}
                </p>
              )}

              {tab === 'info' ? (
                <div className="space-y-7">
                  <form onSubmit={saveName} noValidate className="space-y-4 max-w-md">
                    <Field id="profile-name" label="Ad və soyad" error={nameError}>
                      <input
                        id="profile-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputClass(!!nameError)}
                      />
                    </Field>
                    <button
                      type="submit"
                      disabled={saving || name.trim() === user.fullName}
                      className="h-11 px-6 rounded-[12px] bg-brand dark:bg-brand-400 dark:text-ink text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />} Yadda saxla
                    </button>
                  </form>

                  <dl className="divide-y divide-stone-200 dark:divide-stone-800 border-t border-stone-200 dark:border-stone-800 text-sm">
                    <div className="flex items-center justify-between gap-4 py-4">
                      <dt className="text-stone-500 dark:text-stone-400">E-poçt</dt>
                      <dd className="flex items-center gap-3 font-semibold text-ink dark:text-white">
                        <span className="break-all">{user.email}</span>
                        {user.emailVerified ? (
                          <span className="inline-flex items-center gap-1 text-xs text-sage-700 dark:text-sage-300">
                            <BadgeCheck className="w-4 h-4" /> Təsdiqlənib
                          </span>
                        ) : (
                          <button
                            onClick={() => onSelectScreen('verify-email')}
                            className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 hover:underline"
                          >
                            <ShieldAlert className="w-4 h-4" /> Təsdiqlə
                          </button>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-4">
                      <dt className="text-stone-500 dark:text-stone-400">Paket</dt>
                      <dd className="flex items-center gap-3 font-semibold text-ink dark:text-white">
                        {PLAN_LABEL[user.plan]}
                        {user.plan === 'free' && (
                          <button
                            onClick={() => onSelectScreen('packages')}
                            className="text-xs text-brand-fg hover:underline"
                          >
                            Yüksəlt
                          </button>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-4">
                      <dt className="text-stone-500 dark:text-stone-400">Qeydiyyat tarixi</dt>
                      <dd className="font-semibold text-ink dark:text-white">{joined}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <form onSubmit={submitPassword} noValidate className="space-y-5 max-w-md">
                  {pwDone && (
                    <p
                      role="status"
                      className="rounded-xl bg-sage-50 dark:bg-sage-950/40 border border-sage-200 dark:border-sage-900/60 text-sage-700 dark:text-sage-300 text-sm px-4 py-2.5 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Şifrə uğurla dəyişdirildi.
                    </p>
                  )}
                  {pwFormError && (
                    <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                      {pwFormError}
                    </p>
                  )}

                  <Field id="pw-current" label="Cari şifrə" error={pwErrors.current}>
                    <PasswordInput
                      id="pw-current"
                      value={current}
                      onChange={setCurrent}
                      autoComplete="current-password"
                      error={pwErrors.current}
                    />
                  </Field>
                  <Field id="pw-next" label="Yeni şifrə" error={pwErrors.next}>
                    <PasswordInput
                      id="pw-next"
                      value={next}
                      onChange={setNext}
                      autoComplete="new-password"
                      error={pwErrors.next}
                    />
                  </Field>

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 grid grid-cols-4 gap-1.5">
                        {[1, 2, 3, 4].map((n) => (
                          <span
                            key={n}
                            className={`h-1.5 rounded-full ${next && n <= score ? strength.cls : 'bg-stone-200 dark:bg-stone-800'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 w-16 text-right">
                        {next ? strength.label : ''}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {rules.map((r) => (
                        <li
                          key={r.label}
                          className={`flex items-center gap-2 text-xs ${r.ok ? 'text-sage-700 dark:text-sage-300' : 'text-stone-500 dark:text-stone-400'}`}
                        >
                          {r.ok ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Circle className="w-3.5 h-3.5" />
                          )}{' '}
                          {r.label}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Field id="pw-confirm" label="Yeni şifrəni təkrarla" error={pwErrors.confirm}>
                    <PasswordInput
                      id="pw-confirm"
                      value={confirm}
                      onChange={setConfirm}
                      autoComplete="new-password"
                      error={pwErrors.confirm}
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={pwLoading}
                    className="h-11 px-6 rounded-[12px] bg-brand dark:bg-brand-400 dark:text-ink text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
                  >
                    {pwLoading && <Loader2 className="w-4 h-4 animate-spin" />} Şifrəni dəyiş
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
