import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteSellerAccount, getSellers, setSellerBlocked } from '../sellersApi';
import AdminAccess from './AdminAccess';
import '../sellers.css';

function Accounts() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    getSellers().then(items => { if (active) { setSellers(items); setError(''); } })
      .catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);
  async function block(seller) {
    if (busy || !window.confirm(`${seller.blocked ? 'Разблокировать' : 'Заблокировать'} магазин «${seller.storeName}»?${seller.blocked ? '' : ' Его товары скроются из каталога.'}`)) return;
    setBusy(true); setError('');
    try { const updated = await setSellerBlocked(seller.id, !seller.blocked); setSellers(items => items.map(s => s.id === updated.id ? updated : s)); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function removeAccount(seller) {
    if (busy || !window.confirm(`Удалить аккаунт продавца «${seller.storeName}» (${seller.email}) навсегда?\n\nБудут удалены его товары, заявка и фотографии паспорта. Доступ к аккаунту будет закрыт. Отменить удаление нельзя.`)) return;
    setBusy(true); setError('');
    try { await deleteSellerAccount(seller.id); setSellers(items => items.filter(s => s.id !== seller.id)); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <div className="adm-panel adm-sellers">
    <div className="adm-seller-tools"><p className="adm-view-sub">Контакты, блокировка и управление товарами продавцов.</p><button className="adm-row-btn" onClick={() => { setLoading(true); setRetry(value => value + 1); }} disabled={loading || busy}>Обновить</button></div>
    {error && <p role="alert" className="adm-app-error">{error}</p>}
    <div className="adm-table-wrap"><table><thead><tr><th>Магазин / ФИО</th><th>Почта</th><th>Телефон</th><th>Пароль</th><th>Товары</th><th>Статус</th><th>Действия</th></tr></thead><tbody>
      {loading ? <tr><td colSpan="7" className="adm-empty-row">Загрузка продавцов…</td></tr> : !sellers.length ? <tr><td colSpan="7" className="adm-empty-row">Продавцов пока нет. Аккаунты появятся после одобрения заявок.</td></tr> : sellers.map(s => <tr key={s.id}>
        <td><strong>{s.storeName}</strong><small className="adm-seller-name">{[s.lastName, s.firstName, s.middleName].filter(Boolean).join(' ')}</small></td>
        <td>{s.email}</td><td>{s.phone}</td><td><span title="Пароль хранится в виде хеша. Для управления магазином используйте кнопку «Открыть кабинет».">Защищён</span></td><td>{s.productCount}</td>
        <td><span className={`adm-pill ${s.blocked ? 'adm-pill-cancelled' : 'adm-pill-done'}`}>{s.blocked ? 'Заблокирован' : 'Активен'}</span></td>
        <td><div className="adm-seller-actions"><Link className="adm-row-btn" to={`/admin/sellers/${s.id}`}>Открыть кабинет</Link><button disabled={busy} className={`adm-row-btn ${s.blocked ? '' : 'adm-row-btn-danger'}`} onClick={() => block(s)}>{s.blocked ? 'Разблокировать' : 'Заблокировать'}</button><button disabled={busy} className="adm-row-btn adm-row-btn-danger" onClick={() => removeAccount(s)}>Удалить аккаунт</button></div></td>
      </tr>)}
    </tbody></table></div>
  </div>;
}

export default function SellerAccounts() {
  return <section className="adm-seller-section"><h2>Аккаунты продавцов</h2><AdminAccess><Accounts /></AdminAccess></section>;
}
