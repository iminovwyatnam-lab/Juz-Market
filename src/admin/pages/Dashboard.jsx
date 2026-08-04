// src/admin/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { getProducts } from '../adminApi';
import { loadOrders, loadUsers, orderTotal, ORDER_STATUS_LABELS } from '../adminStorage';

export default function Dashboard(){
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    getProducts().then(setProducts).catch(() => setApiError(true));
    setOrders(loadOrders());
    setUsers(loadUsers());
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const newOrders = orders.filter(o => o.status === 'new').length;
  const revenueToday = orders
    .filter(o => o.date?.slice(0, 10) === today)
    .reduce((sum, o) => sum + orderTotal(o), 0);

  const recentOrders = [...orders].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <section>
      <div className="adm-stat-grid">
        <div className="adm-stat-card">
          <span className="adm-stat-label">Новые заказы</span>
          <span className="adm-stat-value">{newOrders}</span>
        </div>
        <div className="adm-stat-card">
          <span className="adm-stat-label">Выручка сегодня</span>
          <span className="adm-stat-value">{revenueToday.toLocaleString('ru-RU')} сум</span>
        </div>
        <div className="adm-stat-card">
          <span className="adm-stat-label">Товаров в каталоге</span>
          <span className="adm-stat-value">{apiError ? '—' : products.length}</span>
        </div>
        <div className="adm-stat-card">
          <span className="adm-stat-label">Пользователей</span>
          <span className="adm-stat-value">{users.length}</span>
        </div>
      </div>

      <div className="adm-panel">
        <div className="adm-panel-head"><h2>Последние заказы</h2></div>
        <div className="adm-table-wrap">
          <table>
            <thead>
              <tr><th>№</th><th>Клиент</th><th>Адрес</th><th>Сумма</th><th>Статус</th></tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan="5" className="adm-empty-row">Заказов пока нет</td></tr>
              ) : recentOrders.map(o => (
                <tr key={o.id}>
                  <td className="adm-mono">{o.id}</td>
                  <td>{o.customerName}</td>
                  <td className="adm-muted">{o.address}</td>
                  <td className="adm-mono">{orderTotal(o).toLocaleString('ru-RU')} сум</td>
                  <td><span className={`adm-pill adm-pill-${o.status}`}>{ORDER_STATUS_LABELS[o.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
