import { useEffect, useState } from 'react';
import { call, clearAdminKey, getAdminKey, setAdminKey } from '../applicationsApi';
import '../applications.css';

export default function AdminAccess({ children }) {
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState(() => getAdminKey() ? 'checking' : 'locked');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    if (!getAdminKey()) return;
    call('/access').then(() => { if (active) { setStatus('open'); setError(''); } }).catch(err => {
      if (!active) return;
      if (err.status === 401) clearAdminKey();
      setError(err.message); setStatus('locked');
    });
    return () => { active = false; };
  }, [revision]);
  if (status === 'checking') return <p className="adm-empty-row">Проверка доступа…</p>;
  if (status === 'open') return children;
  return <section className="adm-panel adm-app-gate">
    <h2>Доступ администратора</h2>
    <p className="adm-view-sub">Введите ключ администратора, который используется для просмотра заявок.</p>
    <form onSubmit={event => { event.preventDefault(); setAdminKey(new FormData(event.currentTarget).get('key').trim()); setStatus('checking'); setRevision(v => v + 1); }}>
      <input className="adm-app-input" name="key" type="password" autoComplete="off" aria-label="Ключ администратора" placeholder="Ключ администратора" required />
      {error && <p className="adm-app-error" role="alert">{error}</p>}
      <button type="submit" className="adm-btn-primary">Открыть</button>
    </form>
  </section>;
}
