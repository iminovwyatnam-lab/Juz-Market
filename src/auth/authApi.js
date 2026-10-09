// src/auth/authApi.js
// Запросы к серверу авторизации (juz-market-auth, порт 4001) и хранение сессии.
import { useSyncExternalStore } from 'react';
import { disconnectSupport } from '../support/supportApi';

const AUTH_URL = (import.meta.env.VITE_AUTH_URL || 'http://localhost:4001') + '/api';
const SESSION_KEY = 'jm_session';
const EVENT = 'jm-auth-change';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${AUTH_URL}${path}`, options);
  } catch {
    throw new Error('Сервер авторизации не отвечает. Запущен ли juz-market-auth?');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
  return data;
}

function post(path, body) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ---- сессия (token + user в localStorage) ----
export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(EVENT));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(EVENT));
}

// ---- API ----
export async function register(data) {
  const res = await post('/auth/register', data);
  saveSession({ token: res.token, user: res.user });
  return res.user;
}

export async function login(loginName, password) {
  const res = await post('/auth/login', { login: loginName, password });
  saveSession({ token: res.token, user: res.user });
  return res.user;
}

export async function logout() {
  const session = getSession();
  if (session) {
    void disconnectSupport(session.user.id);
    try {
      await request('/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
      });
    } catch {
      // даже если сервер недоступен — локально всё равно выходим
    }
  }
  clearSession();
}

// Список зарегистрированных пользователей для админки
export function getRegisteredUsers() {
  return request('/admin/users');
}

// ---- хук: текущий пользователь, обновляется при входе/выходе ----
function subscribe(cb) {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

const getSnapshot = () => localStorage.getItem(SESSION_KEY);

function parseUser(raw) {
  try {
    return raw ? JSON.parse(raw).user : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const raw = useSyncExternalStore(subscribe, getSnapshot);
  return { user: parseUser(raw), logout };
}
