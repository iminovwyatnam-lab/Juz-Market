// src/admin/applicationsApi.js
// Заявки продавцов: говорит с сервером продавцов (npm run sellers, порт 4002).
// Доступ защищён ключом администратора (seller-server/data/admin-key.txt).

const ORIGIN = (import.meta.env.VITE_SELLER_API_ORIGIN || 'http://localhost:4002').replace(/\/$/, '');
const KEY = 'jm_admin_key';

export const getAdminKey = () => sessionStorage.getItem(KEY) || '';
export const setAdminKey = (value) => sessionStorage.setItem(KEY, value);
export const clearAdminKey = () => sessionStorage.removeItem(KEY);

export async function call(route, { method = 'GET', raw = false, data, signal } = {}){
  let res;
  try {
    res = await fetch(`${ORIGIN}/api/admin${route}`, { method, signal, headers: { 'X-Admin-Key': getAdminKey(), ...(data ? { 'Content-Type': 'application/json' } : {}) }, body: data ? JSON.stringify(data) : undefined });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw Object.assign(new Error('Сервер продавцов недоступен. Запустите: npm run sellers'), { status: 0 });
  }
  if(!res.ok){
    let message = 'Не удалось выполнить запрос.';
    try { message = (await res.json()).error || message; } catch { /* ответ без JSON */ }
    throw Object.assign(new Error(message), { status: res.status });
  }
  return raw ? res.blob() : res.json();
}

export const getApplications = () => call('/applications');
export const decideApplication = (id, decision) => call(`/applications/${encodeURIComponent(id)}/${decision}`, { method: 'POST' });
export async function getPassportPhotoUrl(id, side){
  return URL.createObjectURL(await call(`/applications/${encodeURIComponent(id)}/photo/${side}`, { raw: true }));
}
