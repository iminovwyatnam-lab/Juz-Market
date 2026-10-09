// src/admin/pages/OrdersPage.jsx
import { useEffect, useState } from 'react';
import { loadOrders, saveOrders, deleteCancelledOrder, orderTotal, ORDER_STATUS_LABELS } from '../adminStorage';
import OrderModal from '../components/OrderModal';

export default function OrdersPage(){
  const [orders, setOrders] = useState(loadOrders);
  const [filter, setFilter] = useState('all');
  const [activeOrderId, setActiveOrderId] = useState(null);

  useEffect(() => {
    const refresh = () => setOrders(loadOrders());
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('jm-orders-change', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('jm-orders-change', refresh);
    };
  }, []);

  const activeOrder = orders.find(o => o.id === activeOrderId) || null;

  function handleStatusChange(id, status){
    const updated = loadOrders().map(o => o.id === id ? { ...o, status } : o);
    try { saveOrders(updated); setOrders(updated); }
    catch { alert('Не удалось сохранить статус заказа.'); }
  }

  function handleDelete(id){
    const order = loadOrders().find(item => item.id === id);
    if(!order || order.status !== 'cancelled') return;
    if(!confirm(`Удалить отменённый заказ ${id} навсегда? Он также исчезнет из истории покупателя.`)) return;
    try {
      setOrders(deleteCancelledOrder(id));
      if(activeOrderId === id) setActiveOrderId(null);
    } catch(error) { alert(error.message); }
  }

  const filtered = [...orders]
    .filter(o => filter === 'all' || o.status === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <section>
      <header className="adm-view-head">
        <p className="adm-view-sub">Локация клиента приходит вместе с заказом</p>
        <div className="adm-head-actions">
          <select className="adm-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Все статусы</option>
            {Object.entries(ORDER_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="adm-panel">
        <div className="adm-table-wrap">
          <table>
            <thead>
              <tr>
                <th>№</th><th>Дата</th><th>Клиент</th><th>Телефон</th>
                <th>Товары</th><th>Сумма</th><th>Локация</th><th>Статус</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="9" className="adm-empty-row">Заказов с таким статусом пока нет</td></tr>
              ) : filtered.map(o => (
                <tr key={o.id}>
                  <td className="adm-mono">{o.id}</td>
                  <td className="adm-muted">{o.date}</td>
                  <td>{o.customerName}</td>
                  <td className="adm-mono">{o.phone}</td>
                  <td className="adm-muted">{o.items.length} тов.</td>
                  <td className="adm-mono">{orderTotal(o).toLocaleString('ru-RU')} сум</td>
                  <td>
                    {o.lat && o.lng ? (
                      <a className="adm-loc-cell" href={`https://www.google.com/maps?q=${o.lat},${o.lng}`} target="_blank" rel="noopener noreferrer">
                        📍 {o.lat.toFixed(4)}, {o.lng.toFixed(4)}
                      </a>
                    ) : (
                      <span className="adm-muted">Не указана</span>
                    )}
                  </td>
                  <td><span className={`adm-pill adm-pill-${o.status}`}>{ORDER_STATUS_LABELS[o.status]}</span></td>
                  <td>
                    <button className="adm-row-btn" onClick={() => setActiveOrderId(o.id)}>Открыть</button>
                    {o.status === 'cancelled' && <button className="adm-row-btn adm-row-btn-danger" onClick={() => handleDelete(o.id)}>Удалить</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <OrderModal order={activeOrder} onClose={() => setActiveOrderId(null)} onStatusChange={handleStatusChange} onDelete={handleDelete} />
    </section>
  );
}
