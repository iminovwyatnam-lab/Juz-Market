// src/admin/pages/UsersPage.jsx
import { useEffect, useState } from 'react';
import { loadOrders, loadUsers } from '../adminStorage';

export default function UsersPage(){
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    setUsers(loadUsers());
    setOrders(loadOrders());
  }, []);

  return (
    <section>
      <header className="adm-view-head">
        <p className="adm-view-sub">Клиенты, оформлявшие заказы</p>
      </header>

      <div className="adm-panel">
        <div className="adm-table-wrap">
          <table>
            <thead>
              <tr><th>Имя</th><th>Телефон</th><th>Заказов</th><th>Регистрация</th></tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan="4" className="adm-empty-row">Пользователей пока нет</td></tr>
              ) : users.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td className="adm-mono">{u.phone}</td>
                  <td className="adm-mono">{orders.filter(o => o.userId === u.id).length}</td>
                  <td className="adm-muted">{u.registered}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
