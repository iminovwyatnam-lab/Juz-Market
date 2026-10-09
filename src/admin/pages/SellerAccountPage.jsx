import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminAccess from '../components/AdminAccess';
import { deleteSellerAccount, getManagedProducts, getManagedSeller, removeManagedProduct, setSellerBlocked } from '../sellersApi';
import '../sellers.css';

function Account({ id }) {
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    Promise.all([getManagedSeller(id), getManagedProducts(id)]).then(([s, p]) => { if (active) { setSeller(s); setProducts(p); setError(''); } })
      .catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, retry]);
  async function remove(product) {
    if (busy || !window.confirm(`Удалить товар «${product.name}» из магазина и каталога?`)) return;
    setBusy(true); setError('');
    try { await removeManagedProduct(id, product.id); setProducts(items => items.filter(p => p.id !== product.id)); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function block() {
    if (busy || !window.confirm(`${seller.blocked ? 'Разблокировать' : 'Заблокировать'} магазин «${seller.storeName}»?`)) return;
    setBusy(true); setError('');
    try { setSeller(await setSellerBlocked(id, !seller.blocked)); } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function removeAccount() {
    if (busy || !window.confirm(`Удалить аккаунт продавца «${seller.storeName}» (${seller.email}) навсегда?\n\nБудут удалены его товары, заявка и фотографии паспорта. Доступ к аккаунту будет закрыт. Отменить удаление нельзя.`)) return;
    setBusy(true); setError('');
    try { await deleteSellerAccount(id); navigate('/admin/users', { replace: true }); }
    catch (err) { setError(err.message); setBusy(false); }
  }
  return <section className="adm-managed-store">
    <Link to="/admin/users">← К пользователям</Link>
    {error && <p role="alert" className="adm-app-error">{error} <button className="adm-row-btn" disabled={busy} onClick={() => { setLoading(true); setRetry(v => v + 1); }}>Повторить</button></p>}
    {loading ? <p>Открываем кабинет…</p> : seller && <>
      <div className="adm-panel adm-store-heading"><div><p className="adm-muted">Кабинет продавца · режим администратора</p><h2>{seller.storeName}</h2><p>{seller.email} · {seller.phone}</p><p>Статус: {seller.blocked ? 'Заблокирован — товары скрыты из каталога' : 'Активен'}</p></div><div className="adm-seller-actions"><button className="adm-row-btn" disabled={busy} onClick={block}>{seller.blocked ? 'Разблокировать' : 'Заблокировать'}</button><button className="adm-row-btn adm-row-btn-danger" disabled={busy} onClick={removeAccount}>Удалить аккаунт</button></div></div>
      <div className="adm-panel adm-store-products"><h2>Товары магазина ({products.length})</h2>
        {!products.length ? <p className="adm-empty-row">У продавца пока нет товаров.</p> : products.map(product => <article className="adm-store-product" key={product.id}>
          {product.image && <img src={product.image} alt={product.name} />}
          <div><h3>{product.name}</h3><p className="adm-muted">{product.category} · {Number(product.price).toLocaleString('ru-RU')} сум · {product.stock} шт.</p><p>{product.shortDescription}</p><details><summary>Полное описание</summary><p>{product.description}</p>{product.specifications?.map((s, i) => <p key={i}>{s.name}: {s.value}</p>)}</details></div>
          <button className="adm-row-btn adm-row-btn-danger" disabled={busy} onClick={() => remove(product)}>Удалить товар</button>
        </article>)}
      </div>
    </>}
  </section>;
}
export default function SellerAccountPage() {
  const { sellerId } = useParams();
  return <AdminAccess><Account key={sellerId} id={sellerId} /></AdminAccess>;
}
