import { useCallback, useEffect, useState } from 'react';
import {
  authSessionRevoke,
  authSessions,
  authSessionsRevokeAll,
  authSessionsRevokeOthers,
  type AuthSession,
} from '../lib/api';
import { useAuth } from '../lib/auth';
import { useNavigate } from '../lib/navigation';

const cardClass =
  'bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4';

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('az-AZ');
}

export function SessionSettings() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const result = await authSessions();
      setSessions(result.sessions);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Sessiyaları yükləmək mümkün olmadı.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const finishCurrentRevocation = async () => {
    await refresh();
    navigate('/login');
  };

  const revokeOne = async (session: AuthSession) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await authSessionRevoke(session.id);
      if (session.current) {
        await finishCurrentRevocation();
        return;
      }
      setNotice('Sessiya bağlandı.');
      await load();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Sessiyanı bağlamaq mümkün olmadı.');
    } finally {
      setBusy(false);
    }
  };

  const revokeOthers = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await authSessionsRevokeOthers();
      setNotice(`${result.revoked_count} başqa sessiya bağlandı.`);
      await load();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Digər sessiyaları bağlamaq mümkün olmadı.');
    } finally {
      setBusy(false);
    }
  };

  const revokeAll = async () => {
    if (!window.confirm('Bütün cihazlardakı sessiyalar bağlanacaq və hesabdan çıxacaqsan. Davam edilsin?')) return;
    setBusy(true);
    setError('');
    try {
      await authSessionsRevokeAll();
      await finishCurrentRevocation();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Sessiyaları bağlamaq mümkün olmadı.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={cardClass} aria-labelledby="sessions-heading">
      <div>
        <h3 id="sessions-heading" className="text-base font-semibold">Aktiv sessiyalar</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Hesabının açıq olduğu cihazları yoxla və tanımadığın sessiyaları bağla.</p>
      </div>
      {notice && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
      {loading ? <p className="text-sm text-slate-500">Sessiyalar yüklənir…</p> : sessions.length === 0 ? (
        <p className="text-sm text-slate-500">Aktiv sessiya tapılmadı.</p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((session) => (
            <li key={session.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-sm">{session.current ? 'Bu cihaz' : 'Digər cihaz'}{session.current ? ' · cari sessiya' : ''}</p>
                {session.current && <span className="text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 px-2 py-1">Cari</span>}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 break-all">{session.user_agent || 'Brauzer məlumatı yoxdur'}</p>
              <p className="text-xs text-slate-500">IP: {session.ip || 'məlum deyil'} · Açılıb: {formatDate(session.created_at)}</p>
              <p className="text-xs text-slate-500">Bitmə vaxtı: {formatDate(session.expires_at)}</p>
              <button type="button" disabled={busy} onClick={() => void revokeOne(session)} className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-semibold disabled:opacity-50">
                {session.current ? 'Bu sessiyadan çıx' : 'Sessiyanı bağla'}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-3 border-t border-slate-200 dark:border-slate-700 pt-4">
        <button type="button" disabled={busy || loading || sessions.every((session) => session.current)} onClick={() => void revokeOthers()} className="h-10 px-4 rounded-xl border font-semibold disabled:opacity-50">Digər sessiyaları bağla</button>
        <button type="button" disabled={busy || loading || sessions.length === 0} onClick={() => void revokeAll()} className="h-10 px-4 rounded-xl border border-red-300 text-red-700 dark:text-red-300 font-semibold disabled:opacity-50">Bütün sessiyaları bağla</button>
      </div>
    </section>
  );
}
