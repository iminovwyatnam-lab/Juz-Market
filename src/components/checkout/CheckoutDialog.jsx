import { translate as t, useLanguage } from '../../preferences/preferences';
// src/components/checkout/CheckoutDialog.jsx
// Окно оформления заказа: телефон, адрес и локация "по клику".
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './checkout.css';
import { useAuth } from '../../auth/authApi';
import { createOrder, detectLocation, getSavedDelivery, saveDelivery } from '../../orders/ordersStore';

const formatPrice = (value) => Number(value).toLocaleString('ru-RU');

export default function CheckoutDialog({ items, onClose }) {
    useLanguage();
  const { user } = useAuth();
  const location = useLocation();

  const [saved] = useState(getSavedDelivery);
  const [phone, setPhone] = useState(saved.phone);
  const [address, setAddress] = useState(saved.address);
  const [coords, setCoords] = useState(saved.coords);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  const total = items.reduce((sum, it) => sum + Number(it.price) * it.qty, 0);

  // onClose получает заказ, если он был оформлен (корзина по нему очищается)
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose(created);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [created, onClose]);

  async function handleDetect() {
    setLocLoading(true);
    setLocError('');
    try {
      setCoords(await detectLocation());
    } catch (err) {
      setLocError(err.message);
    } finally {
      setLocLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) {
      setError(t("Введите номер телефона"));
      return;
    }
    if (!address.trim() && !coords) {
      setError(t("Укажите адрес или определите локацию"));
      return;
    }

    const finalAddress = address.trim() || t("Определено по геолокации");
    saveDelivery({ phone: phone.trim(), address: address.trim(), coords });
    setCreated(createOrder({
      user,
      items,
      phone: phone.trim(),
      address: finalAddress,
      coords,
    }));
  }

  return (
    <div className="co-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(created); }}>
      <div className="co-card" role="dialog" aria-modal="true" aria-labelledby="co-title">
        <button type="button" className="co-close" onClick={() => onClose(created)} aria-label={t("Закрыть")}>&times;</button>

        {!user && (
          <>
            <h2 id="co-title">{t("Войдите, чтобы заказать")}</h2>
            <p className="co-text">{t("Заказ привязывается к вашему аккаунту, чтобы вы могли следить за его статусом в профиле.")}</p>
            <Link
              to="/login"
              state={{ from: location.pathname }}
              className="co-btn"
              onClick={() => onClose(null)}
            >{t("Войти или зарегистрироваться")}</Link>
          </>
        )}

        {user && created && (
          <>
            <h2 id="co-title">{t("Заказ оформлен ✓")}</h2>
            <p className="co-text">{t("Ориентировочный срок прибытия: 2–3 дня")}</p>
            <p className="co-text">{t("Номер заказа:")} <b>{created.id}</b></p>
            <p className="co-text">{t("Статус: Новый. Следить за ним можно в профиле.")}</p>
            <Link to="/profile" className="co-btn" onClick={() => onClose(created)}>{t("Перейти в профиль")}</Link>
            <button type="button" className="co-btn co-btn-light" onClick={() => onClose(created)}>{t("Закрыть")}</button>
          </>
        )}

        {user && !created && (
          <form onSubmit={handleSubmit}>
            <h2 id="co-title">{t("Оформление заказа")}</h2>
            <p className="co-text">{t("Ориентировочный срок прибытия: 2–3 дня")}</p>

            <ul className="co-items">
              {items.map((it) => (
                <li key={it.id}>
                  <span>{it.name} × {it.qty}</span>
                  <span>{formatPrice(it.price * it.qty)} {t("сум")}</span>
                </li>
              ))}
            </ul>
            <p className="co-total"><span>{t("Итого:")}</span><b>{formatPrice(total)} {t("сум")}</b></p>

            <label className="co-label" htmlFor="co-phone">{t("Телефон")}</label>
            <input
              id="co-phone"
              className="co-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998 90 123 45 67"
              autoComplete="tel"
            />

            <label className="co-label" htmlFor="co-address">{t("Адрес доставки")}</label>
            <input
              id="co-address"
              className="co-input"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("Город, улица, дом")}
              maxLength={250}
              autoComplete="street-address"
            />

            <button type="button" className="co-detect" onClick={handleDetect} disabled={locLoading}>
              📍 {locLoading ? t("Определяем...") : coords ? t("Обновить мою локацию") : t("Определить мою локацию")}
            </button>
            {coords && !locError && (
              <p className="co-ok">{t("Локация определена (")}{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}){' '}
                <button type="button" className="co-link" onClick={() => setCoords(null)}>{t("убрать")}</button>
              </p>
            )}
            {locError && <p className="co-error">{locError}</p>}

            {error && <p className="co-error">{error}</p>}

            <button type="submit" className="co-btn">{t("Подтвердить заказ")}</button>
          </form>
        )}
      </div>
    </div>
  );
}
