import { call } from '../admin/applicationsApi';

const ORIGIN = (import.meta.env.VITE_SELLER_API_ORIGIN || 'http://localhost:4002').replace(/\/$/, '');
const keyFor = id => `jm_support_token_${id}`;
export const hasSupportSession = id => Boolean(sessionStorage.getItem(keyFor(id)));
export const clearSupportSession = id => sessionStorage.removeItem(keyFor(id));

async function request(route, { userId, method = 'GET', data, signal } = {}) {
  let response;
  try {
    response = await fetch(`${ORIGIN}/api/support${route}`, { method, signal: signal || AbortSignal.timeout(15000),
      headers: { ...(data ? { 'Content-Type': 'application/json' } : {}), ...(userId !== undefined ? { Authorization: `Bearer ${sessionStorage.getItem(keyFor(userId)) || ''}` } : {}) },
      body: data ? JSON.stringify(data) : undefined });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error('Поддержка сейчас недоступна. Попробуйте ещё раз.', { cause: err });
  }
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error || 'Не удалось загрузить переписку.'), { status: response.status });
  return result;
}
export async function connectSupport(userId) {
  let main = null;
  try { main = JSON.parse(localStorage.getItem('jm_session')); } catch { /* нет сессии */ }
  if (!main?.token) throw Object.assign(new Error('Войдите в аккаунт, чтобы открыть переписку.'), { status: 401 });
  const result = await request('/session', { method: 'POST', data: { token: main.token, expectedUserId: userId } });
  sessionStorage.setItem(keyFor(userId), result.token);
}
export async function disconnectSupport(userId) {
  if (!hasSupportSession(userId)) return;
  const pending = request('/session', { method: 'DELETE', userId });
  clearSupportSession(userId);
  await pending.catch(() => {});
}
export const getSupportThread = (userId, signal) => request('/thread', { userId, signal });
export const sendSupportMessage = (userId, data) => request('/messages', { userId, method: 'POST', data });
export const markSupportRead = (userId, through) => request('/read', { userId, method: 'POST', data: { through } });
export const getSupportThreads = signal => call('/support', { signal });
export const getAdminThread = (id, signal) => call(`/support/${encodeURIComponent(id)}`, { signal });
export const sendAdminMessage = (id, data) => call(`/support/${encodeURIComponent(id)}/messages`, { method: 'POST', data });
export const markAdminRead = (id, through) => call(`/support/${encodeURIComponent(id)}/read`, { method: 'POST', data: { through } });

// Не даём старому ответу опроса затереть только что отправленное сообщение.
export function newerThread(current, incoming) {
  return (current?.messages?.at(-1)?.seq || 0) > (incoming.messages?.at(-1)?.seq || 0) ? current : incoming;
}
