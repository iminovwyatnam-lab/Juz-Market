// src/admin/pages/ApplicationsPage.jsx
import { useCallback, useEffect, useState } from 'react';
import { clearAdminKey, decideApplication, getAdminKey, getApplications, getPassportPhotoUrl, setAdminKey } from '../applicationsApi';
import '../applications.css';

const STATUS = {
  pending: { label: 'Новая', pill: 'adm-pill-processing' },
  approved: { label: 'Одобрена', pill: 'adm-pill-done' },
  rejected: { label: 'Отклонена', pill: 'adm-pill-cancelled' },
};
const FILTERS = [['pending', 'Новые'], ['approved', 'Одобренные'], ['rejected', 'Отклонённые'], ['all', 'Все']];

const fullName = (a) => [a.lastName, a.firstName, a.middleName].filter(Boolean).join(' ');
const formatDate = (iso) => {
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(d) ? d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }) : '';
};
const formatBirth = (value) => {
  const d = value ? new Date(`${value}T00:00:00`) : null;
  return d && !isNaN(d) ? d.toLocaleDateString('ru-RU') : value || '';
};

function KeyGate({ onSubmit, error }){
  const [value, setValue] = useState('');
  return (
    <div className="adm-panel adm-app-gate">
      <h2>Доступ к заявкам</h2>
      <p className="adm-view-sub">В заявках есть паспортные данные, поэтому нужен ключ администратора. Он лежит в файле <span className="adm-mono">seller-server/data/admin-key.txt</span> и печатается в консоли при запуске <span className="adm-mono">npm run sellers</span>.</p>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(value.trim()); }}>
        <input className="adm-app-input" type="password" autoComplete="off" placeholder="Ключ администратора" value={value} onChange={(e) => setValue(e.target.value)} required />
        {error && <p className="adm-app-error" role="alert">{error}</p>}
        <button className="adm-btn-primary" type="submit">Открыть</button>
      </form>
    </div>
  );
}

function PassportPhoto({ id, side, label }){
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';
    getPassportPhotoUrl(id, side)
      .then((u) => { objectUrl = u; if(cancelled) URL.revokeObjectURL(u); else setUrl(u); })
      .catch(() => { if(!cancelled) setFailed(true); });
    return () => { cancelled = true; if(objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [id, side]);
  return (
    <figure className="adm-app-photo">
      <figcaption className="adm-modal-label">{label}</figcaption>
      {url ? <a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={label} /></a>
        : <div className="adm-app-photo-empty">{failed ? 'Фото недоступно' : 'Загрузка…'}</div>}
    </figure>
  );
}

function ApplicationModal({ application, busy, onClose, onDecide }){
  const st = STATUS[application.status] || STATUS.pending;
  return (
    <div className="adm-modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}>
      <div className="adm-modal-card adm-app-modal">
        <button className="adm-modal-close" onClick={onClose}>&times;</button>
        <h2>Заявка продавца <span className={`adm-pill ${st.pill}`}>{st.label}</span></h2>

        <div className="adm-modal-grid">
          <div><span className="adm-modal-label">Фамилия</span><p>{application.lastName}</p></div>
          <div><span className="adm-modal-label">Имя</span><p>{application.firstName}</p></div>
          <div><span className="adm-modal-label">Отчество</span><p>{application.middleName}</p></div>
          <div><span className="adm-modal-label">Дата рождения</span><p>{formatBirth(application.birthDate)}</p></div>
          <div><span className="adm-modal-label">Паспорт</span><p className="adm-mono">{application.passport}</p></div>
          <div><span className="adm-modal-label">Название магазина</span><p>{application.storeName}</p></div>
          <div><span className="adm-modal-label">Телефон</span><p className="adm-mono">{application.phone}</p></div>
          <div><span className="adm-modal-label">Почта</span><p className="adm-mono">{application.email}</p></div>
          <div><span className="adm-modal-label">Подана</span><p>{formatDate(application.createdAt)}</p></div>
          {application.decidedAt && <div><span className="adm-modal-label">Решение</span><p>{formatDate(application.decidedAt)}</p></div>}
        </div>

        <div className="adm-app-photos">
          <PassportPhoto id={application.id} side="front" label="Лицевая сторона" />
          <PassportPhoto id={application.id} side="back" label="Обратная сторона" />
        </div>

        {application.status === 'pending' && (
          <div className="adm-app-actions">
            <button className="adm-btn-primary" disabled={busy} onClick={() => onDecide(application, 'approve')}>Одобрить</button>
            <button className="adm-row-btn adm-row-btn-danger adm-app-reject" disabled={busy} onClick={() => onDecide(application, 'reject')}>Отказать</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ApplicationsPage(){
  const [hasKey, setHasKey] = useState(() => Boolean(getAdminKey()));
  const [keyError, setKeyError] = useState('');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [activeId, setActiveId] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setApplications(await getApplications());
      setError('');
    } catch(err) {
      if(err.status === 401){ clearAdminKey(); setKeyError(err.message); setHasKey(false); }
      else setError(err.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if(hasKey) load(); }, [hasKey, load]);

  if(!hasKey){
    return (
      <section>
        <KeyGate error={keyError} onSubmit={(value) => { setAdminKey(value); setKeyError(''); setHasKey(true); }} />
      </section>
    );
  }

  const visible = applications.filter(a => filter === 'all' || a.status === filter);
  const active = applications.find(a => a.id === activeId) || null;
  const pendingCount = applications.filter(a => a.status === 'pending').length;

  async function handleDecide(application, decision){
    const text = decision === 'approve'
      ? `Одобрить заявку: ${fullName(application)}? Продавец сможет войти в кабинет.`
      : `Отказать в заявке: ${fullName(application)}?`;
    if(!confirm(text)) return;
    setBusy(true);
    try {
      const updated = await decideApplication(application.id, decision);
      setApplications(list => list.map(a => a.id === updated.id ? updated : a));
    } catch(err) { alert(err.message); }
    finally { setBusy(false); }
  }

  return (
    <section>
      <header className="adm-view-head">
        <p className="adm-view-sub">Заявки на регистрацию продавцов{pendingCount ? ` · новых: ${pendingCount}` : ''}</p>
        <div className="adm-head-actions">
          <select className="adm-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            {FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <button className="adm-btn-secondary" onClick={load} disabled={loading}>Обновить</button>
        </div>
      </header>

      <div className="adm-panel">
        <div className="adm-table-wrap">
          <table>
            <thead>
              <tr><th>ФИО</th><th>Магазин</th><th>Телефон</th><th>Почта</th><th>Подана</th><th>Статус</th><th></th></tr>
            </thead>
            <tbody>
              {error ? (
                <tr><td colSpan="7" className="adm-empty-row">{error}</td></tr>
              ) : loading && applications.length === 0 ? (
                <tr><td colSpan="7" className="adm-empty-row">Загрузка…</td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan="7" className="adm-empty-row">Заявок нет</td></tr>
              ) : visible.map(a => {
                const st = STATUS[a.status] || STATUS.pending;
                return (
                  <tr key={a.id}>
                    <td>{fullName(a)}</td>
                    <td>{a.storeName}</td>
                    <td className="adm-mono">{a.phone}</td>
                    <td className="adm-mono">{a.email}</td>
                    <td className="adm-muted">{formatDate(a.createdAt)}</td>
                    <td><span className={`adm-pill ${st.pill}`}>{st.label}</span></td>
                    <td><button className="adm-row-btn" onClick={() => setActiveId(a.id)}>Рассмотреть</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {active && <ApplicationModal application={active} busy={busy} onClose={() => setActiveId(null)} onDecide={handleDecide} />}
    </section>
  );
}
