import { call } from '../admin/applicationsApi';
const ORIGIN = (import.meta.env.VITE_SELLER_API_ORIGIN || 'http://localhost:4002').replace(/\/$/, '');
export const mediaUrl = value => value?.startsWith('/uploads/') ? `${ORIGIN}${value}` : value;
export async function marketRequest(route, { signal, data, userId } = {}) {
  let response;
  try {
    response = await fetch(`${ORIGIN}/api${route}`, { method: data ? 'POST' : 'GET', signal: signal || AbortSignal.timeout(20000),
      headers: { ...(data ? { 'Content-Type': 'application/json' } : {}), ...(userId != null ? { Authorization: `Bearer ${sessionStorage.getItem(`jm_support_token_${userId}`) || ''}` } : {}) },
      body: data ? JSON.stringify(data) : undefined });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error('Не удалось связаться с сервером. Попробуйте позже.', { cause: err });
  }
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error || 'Не удалось сохранить данные.'), { status: response.status });
  return result;
}
export const getRatings = signal => marketRequest('/ratings', { signal });
export const getBanners = signal => marketRequest('/banners', { signal });
export const getAdminBanners = () => call('/banners');
export const saveBanner = (id, data) => call(`/banners${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', data });
export const deleteBanner = id => call(`/banners/${id}`, { method: 'DELETE' });
export function readPhoto(file, maxMB = 2) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return Promise.reject(new Error('Выберите фото JPG, PNG или WebP.'));
  if (file.size > maxMB * 1024 * 1024) return Promise.reject(new Error(`Фото должно быть не больше ${maxMB} МБ.`));
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('Не удалось прочитать фото.')); reader.readAsDataURL(file); });
}
