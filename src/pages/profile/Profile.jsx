import { translate as t, useLanguage } from '../../preferences/preferences';
// src/pages/profile/Profile.jsx
import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import './profile.css';
import { useAuth } from '../../auth/authApi';
import { getUserOrders } from '../../orders/ordersStore';
import { orderTotal, ORDER_STATUS_LABELS } from '../../admin/adminStorage';

const formatPrice = (value) => Number(value).toLocaleString('ru-RU');

export default function Profile() {
    useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const userId = user ? user.id : null;
  const [orders, setOrders] = useState(() => (userId ? getUserOrders(userId) : []));

  // Статус меняется в админке — подтягиваем свежие данные при возврате на вкладку
  useEffect(() => {
    if (!userId) return;
    const refresh = () => setOrders(getUserOrders(userId));
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('jm-orders-change', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('jm-orders-change', refresh);
    };
  }, [userId]);

  if (!user) return <Navigate to="/login" state={{ from: '/profile' }} replace />;

  const fullName = `${user.name || ''} ${user.surname || ''}`.trim() || user.login;

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <main className="pf-page">
      <section className="pf-card">
        <div className="pf-avatar">{fullName.charAt(0).toUpperCase()}</div>
        <div className="pf-info">
          <h1>{fullName}</h1>
          <p>{t("Логин:")} {user.login}</p>
          <p>{t("Почта:")} {user.email}</p>
        </div>
        <button type="button" className="pf-logout" onClick={handleLogout}>{t("Выйти")}</button>
      </section>

      <Link to="/seller" className="pf-seller">
        <span className="pf-seller-text">
          <b>{t("Кабинет продавца")}</b>
          <small>{t("Добавляйте товары и управляйте своим магазином")}</small>
        </span>
        <span className="pf-seller-arrow" aria-hidden="true">→</span>
      </Link>

      <Link to="/settings" className="pf-seller">
        <span className="pf-seller-text">
          <b>{t("Настройки")}</b>
          <small>{t("Язык сайта")} · {t("Тема")} · {t("Поддержка")}</small>
        </span>
        <span className="pf-seller-arrow" aria-hidden="true">→</span>
      </Link>


      <h2 className="pf-title">{t("Мои заказы")}</h2>

      {orders.length === 0 ? (
        <div className="pf-empty">
          <p>{t("У вас пока нет заказов")}</p>
          <Link to="/catalog">{t("Перейти в каталог")}</Link>
        </div>
      ) : (
        orders.map((o) => (
          <article className="pf-order" key={o.id}>
            <header className="pf-order-head">
              <div>
                <span className="pf-order-id">{t("Заказ")} {o.id}</span>
                <span className="pf-order-date">{o.date}</span>
              </div>
              <span className={`pf-status pf-status-${o.status}`}>
                {t(ORDER_STATUS_LABELS[o.status]) || o.status}
              </span>
            </header>

            <ul className="pf-items">
              {o.items.map((it, i) => (
                <li key={i}>
                  <span>{it.name} × {it.qty}</span>
                  <span>{formatPrice(it.price * it.qty)} {t("сум")}</span>
                </li>
              ))}
            </ul>

            <footer className="pf-order-foot">
              <div className="pf-address">
                <span>{o.address}</span>
                {o.lat && o.lng && (
                  <a href={`https://www.google.com/maps?q=${o.lat},${o.lng}`} target="_blank" rel="noopener noreferrer">{t("📍 Локация на карте")}</a>
                )}
              </div>
              <b>{formatPrice(orderTotal(o))} {t("сум")}</b>
            </footer>
          </article>
        ))
      )}
    </main>
  );
}
