// src/admin/components/OrderModal.jsx
import { ORDER_STATUS_LABELS } from '../adminStorage';

export default function OrderModal({ order, onClose, onStatusChange }){
  if(!order) return null;
  const hasLoc = order.lat && order.lng;

  return (
    <div className="adm-modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}>
      <div className="adm-modal-card">
        <button className="adm-modal-close" onClick={onClose}>&times;</button>
        <h2>Заказ {order.id}</h2>

        <div className="adm-modal-grid">
          <div><span className="adm-modal-label">Клиент</span><p>{order.customerName}</p></div>
          <div><span className="adm-modal-label">Телефон</span><p>{order.phone}</p></div>
        </div>

        <span className="adm-modal-label">Состав заказа</span>
        <ul className="adm-modal-items">
          {order.items.length === 0 ? (
            <li><span className="adm-muted">Без позиций</span></li>
          ) : order.items.map((it, i) => (
            <li key={i}>
              <span>{it.name} × {it.qty}</span>
              <span className="adm-mono">{(it.price * it.qty).toLocaleString('ru-RU')} сум</span>
            </li>
          ))}
        </ul>

        <span className="adm-modal-label">Адрес доставки</span>
        <p>{order.address}</p>
        <p className="adm-modal-coords">{hasLoc ? `Координаты: ${order.lat}, ${order.lng}` : 'Координаты не переданы'}</p>
        {hasLoc && (
          <a
            className="adm-btn-secondary"
            href={`https://www.google.com/maps?q=${order.lat},${order.lng}`}
            target="_blank" rel="noopener noreferrer"
            style={{ marginTop: 10, marginBottom: 6, display: 'inline-block' }}
          >
            Открыть локацию на карте ↗
          </a>
        )}

        <span className="adm-modal-label" style={{ marginTop: 16, display: 'block' }}>Статус заказа</span>
        <select
          className="adm-select"
          style={{ width: '100%', marginTop: 6 }}
          value={order.status}
          onChange={(e) => onStatusChange(order.id, e.target.value)}
        >
          {Object.entries(ORDER_STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
