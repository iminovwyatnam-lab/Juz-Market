const SELLER_ORIGIN = (import.meta.env.VITE_SELLER_API_ORIGIN || 'http://localhost:4002').replace(/\/$/, '');
const TOKEN_KEY = 'jm_seller_token';
// Переносим уже открытый сеанс из старого хранилища без повторного входа.
function getSellerToken() {
  const saved = localStorage.getItem(TOKEN_KEY);
  if (saved) return saved;
  const previous = sessionStorage.getItem(TOKEN_KEY);
  if (previous) {
    localStorage.setItem(TOKEN_KEY, previous);
    sessionStorage.removeItem(TOKEN_KEY);
  }
  return previous || '';
}
export function hasSellerSession() { return Boolean(getSellerToken()); }
export function clearSellerSession() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}
async function request(route, { method = 'GET', data, authorized = false, signal } = {}) {
  const headers = {};
  if (data) headers['Content-Type'] = 'application/json';
  if (authorized) headers.Authorization = `Bearer ${getSellerToken()}`;
  let response;
  try {
    response = await fetch(`${SELLER_ORIGIN}/api${route}`, { method, headers, body: data ? JSON.stringify(data) : undefined, signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error('Не удалось подключиться к кабинету продавца. Попробуйте позже.', { cause: err });
  }
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error || 'Не удалось выполнить запрос.'), { status: response.status });
  return result;
}
function withImage(product) {
  return { ...product, image: product.image ? `${SELLER_ORIGIN}${product.image}` : '' };
}
export async function sellerSignIn(mode, fields) {
  const result = await request(`/seller/${mode}`, { method: 'POST', data: fields });
  if (!result.token) return null; // регистрация: заявка отправлена и ждёт решения администратора
  localStorage.setItem(TOKEN_KEY, result.token);
  sessionStorage.removeItem(TOKEN_KEY);
  return result.seller;
}
export const getSeller = () => request('/seller/me', { authorized: true });
export async function sellerSignOut() {
  await request('/seller/logout', { method: 'POST', authorized: true });
  clearSellerSession();
}
export const getSellerProducts = async () => (await request('/seller/products', { authorized: true })).map(withImage);
export const getPublicSellerProducts = async (signal) => (await request('/products', { signal })).map(withImage);
export const getPublicSellerProduct = async (id, signal) => withImage(await request(`/products/${encodeURIComponent(id)}`, { signal }));
export const saveSellerProduct = async (id, data) => withImage(await request(`/seller/products${id ? `/${encodeURIComponent(id)}` : ''}`, { method: id ? 'PUT' : 'POST', data, authorized: true }));
export const deleteSellerProduct = id => request(`/seller/products/${encodeURIComponent(id)}`, { method: 'DELETE', authorized: true });
