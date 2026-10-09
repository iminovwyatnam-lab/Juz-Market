// src/admin/pages/UsersPage.jsx
import { useEffect, useState } from 'react';
import { loadOrders, loadUsers } from '../adminStorage';
import { getRegisteredUsers } from '../../auth/authApi';
import SellerAccounts from '../components/SellerAccounts';

function formatDate(iso){
  if(!iso) return '';
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleDateString('ru-RU');
}

export default function UsersPage(){
  // Зарегистрированные аккаунты (сервер juz-market-auth)
  const [accounts, setAccounts] = useState([]);
  const [accountsError, setAccountsError] = useState('');

  // Клиенты, оформлявшие заказы (как было раньше)
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    setUsers(loadUsers());
    setOrders(loadOrders());

    getRegisteredUsers()
      .then(setAccounts)
      .catch(err => setAccountsError(err.message));
  }, []);

  return (
    <section>
      <SellerAccounts />
      <header className="adm-view-head">
        <p className="adm-view-sub">Зарегистрированные пользователи</p>
      </header>

      <div className="adm-panel">
        <div className="adm-table-wrap">
          <table>
            <thead>
              <tr><th>Имя</th><th>Фамилия</th><th>Логин</th><th>Почта</th><th>Регистрация</th></tr>
            </thead>
            <tbody>
              {accountsError ? (
                <tr><td colSpan="5" className="adm-empty-row">{accountsError}</td></tr>
              ) : accounts.length === 0 ? (
                <tr><td colSpan="5" className="adm-empty-row">Зарегистрированных пользователей пока нет</td></tr>
              ) : accounts.map(a => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.surname}</td>
                  <td className="adm-mono">{a.login}</td>
                  <td className="adm-mono">{a.email}</td>
                  <td className="adm-muted">{formatDate(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
