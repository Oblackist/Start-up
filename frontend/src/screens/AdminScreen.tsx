import { useState, type FormEvent } from 'react';
import { useRequest } from '../hooks/useRequest';
import { fetchJson } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useNavigate } from '../lib/navigation';
import { AuthScreen } from './AuthScreen';

const loadBank = () => fetchJson<{ question_count: number }>('/admin/question-bank');
const confirmationText = 'SİL';

function QuestionBankAdmin() {
  const { data, loading, error } = useRequest(loadBank);
  const [confirmation, setConfirmation] = useState('');
  const [deleted, setDeleted] = useState<number | null>(null);
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const count = deleted == null ? data?.question_count : 0;

  async function clear(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !count || confirmation !== confirmationText) return;
    setBusy(true);
    setFailure('');
    try {
      const result = await fetchJson<{ deleted: number }>('/admin/question-bank/clear', {
        method: 'POST',
        body: { confirmation },
      });
      setDeleted(result.deleted);
      setConfirmation('');
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'Sual bazası silinmədi.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p role="status">Admin səlahiyyəti yoxlanılır…</p>;
  if (error || count === undefined) return <p role="alert">{error ?? 'Sual bazası yüklənmədi.'}</p>;

  return (
    <section className="space-y-5 rounded-2xl border border-stone-200 bg-surface p-6 dark:border-stone-800 dark:bg-surface-dark">
      <h2 className="text-xl font-bold">Sual bazası</h2>
      <p>{count.toLocaleString('az-AZ')} sual</p>
      {deleted !== null && <p role="status">{deleted.toLocaleString('az-AZ')} sual silindi.</p>}
      {count > 0 && (
        <form onSubmit={clear} className="space-y-4">
          <p>Bütün siniflərin sualları silinəcək. Davam edən imtahanlar yenidən başladılmalıdır.</p>
          <label className="block space-y-2">
            <span>
              Təsdiqləmək üçün <strong>{confirmationText}</strong> yaz.
            </span>
            <input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              disabled={busy}
              className="block w-full rounded-lg border border-stone-300 bg-transparent px-3 py-2 sm:max-w-56 dark:border-stone-700"
            />
          </label>
          <button
            type="submit"
            disabled={busy || confirmation !== confirmationText}
            className="rounded-lg bg-red-700 px-4 py-2 font-bold text-white hover:bg-red-800 disabled:opacity-50"
          >
            {busy ? 'Silinir…' : 'Bütün sualları sil'}
          </button>
          {failure && <p role="alert">{failure}</p>}
        </form>
      )}
    </section>
  );
}

export default function AdminScreen() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading)
    return (
      <p className="p-6" role="status">
        Sessiya yoxlanılır…
      </p>
    );
  if (!user) {
    return <AuthScreen mode="login" adminOnly onSelectScreen={() => navigate('/reset-password')} />;
  }
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold">Admin paneli</h1>
        <button type="button" onClick={() => void logout()} className="font-bold text-brand-fg">
          Hesabdan çıx
        </button>
      </header>
      <QuestionBankAdmin key={user.id} />
    </div>
  );
}
