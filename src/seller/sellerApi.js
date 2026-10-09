const SELLER_ORIGIN = (import.meta.env.VITE_SELLER_API_ORIGIN || 'http://localhost:4002').replace(/\/$/, '');
const TOKEN_KEY = 'jm_seller_token';
export function hasSellerSession() { return Boolean(sessionStorage.getItem(TOKEN_KEY)); }
export function clearSellerSession() { sessionStorage.removeItem(TOKEN_KEY); }
async function request(route, { method = 'GET', data, authorized = false, signal } = {}) {
  const headers = {};
  if (data) headers['Content-Type'] = 'application/json';
  if (authorized) headers.Authorization = `Bearer ${sessionStorage.getItem(TOKEN_KEY) || ''}`;
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
  sessionStorage.setItem(TOKEN_KEY, result.token);
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
