// src/admin/AdminLayout.jsx
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { pingApi } from './adminApi';
import './adminLayout.css';

const PAGE_TITLES = {
  '/admin': 'Обзор',
  '/admin/orders': 'Заказы',
  '/admin/products': 'Товары',
  '/admin/users': 'Пользователи',
  '/admin/applications': 'Заявки',
  '/admin/support': 'Поддержка',
  '/admin/banners': 'Баннеры'
};

export default function AdminLayout(){
  const location = useLocation();
  const [apiOnline, setApiOnline] = useState(null); // null = ещё проверяем

  useEffect(() => {
    let cancelled = false;

    async function check(){
      const ok = await pingApi();
      if(!cancelled) setApiOnline(ok);
    }

    check();
    const interval = setInterval(check, 5000); // перепроверяем раз в 5 секунд
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const linkClass = ({ isActive }) => `adm-link${isActive ? ' is-active' : ''}`;
  const title = PAGE_TITLES[location.pathname] || (location.pathname.startsWith('/admin/sellers/') ? 'Кабинет продавца' : 'Панель управления');

  return (
    <div className="adm-shell">
      <aside className="adm-side">
        <div className="adm-brand">
          <span className="adm-brand-mark">JM</span>
          <span className="adm-brand-name">Juz Market</span>
        </div>

        <nav className="adm-nav">
          <NavLink to="/admin" end className={linkClass}>
            <span className="adm-link-ico"></span> Обзор
          </NavLink>
          <NavLink to="/admin/orders" className={linkClass}>
            <span className="adm-link-ico"></span> Заказы
          </NavLink>
          <NavLink to="/admin/products" className={linkClass}>
            <span className="adm-link-ico"></span> Товары
          </NavLink>
          <NavLink to="/admin/users" className={linkClass}>
            <span className="adm-link-ico"></span> Пользователи
          </NavLink>
          <NavLink to="/admin/applications" className={linkClass}>
            <span className="adm-link-ico"></span> Заявки
          </NavLink>
          <NavLink to="/admin/banners" className={linkClass}><span className="adm-link-ico"></span> Баннеры</NavLink>
          <NavLink to="/admin/support" className={linkClass}>
            <span className="adm-link-ico"></span> Поддержка
          </NavLink>
        </nav>
      </aside>

      <div className="adm-content">
        <header className="adm-topbar">
          <h1>{title}</h1>
          <div className={`adm-api-status ${apiOnline ? 'is-online' : apiOnline === false ? 'is-offline' : 'is-checking'}`}>
            <span className="adm-api-dot"></span>
            {apiOnline === null && 'Проверка API…'}
            {apiOnline === true && 'API подключён (localhost:4000)'}
            {apiOnline === false && 'API недоступен — запусти сервер (npm start в juz-market-api)'}
          </div>
        </header>

        <main className="adm-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
