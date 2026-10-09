import { call } from './applicationsApi';

const ORIGIN = (import.meta.env.VITE_SELLER_API_ORIGIN || 'http://localhost:4002').replace(/\/$/, '');
const sellerRoute = id => `/sellers/${encodeURIComponent(id)}`;
export const getSellers = () => call('/sellers');
export const getManagedSeller = id => call(sellerRoute(id));
export const deleteSellerAccount = id => call(sellerRoute(id), { method: 'DELETE' });
export const setSellerBlocked = (id, blocked) => call(`${sellerRoute(id)}/${blocked ? 'block' : 'unblock'}`, { method: 'POST' });
export const getManagedProducts = async id => (await call(`${sellerRoute(id)}/products`)).map(p => ({ ...p, image: p.image ? `${ORIGIN}${p.image}` : '' }));
export const removeManagedProduct = (sellerId, productId) => call(`${sellerRoute(sellerId)}/products/${encodeURIComponent(productId)}`, { method: 'DELETE' });
