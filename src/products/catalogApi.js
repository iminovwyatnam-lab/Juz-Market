import { getPublicSellerProducts, getPublicSellerProduct } from '../seller/sellerApi';
const API_ORIGIN = 'http://localhost:4000';
export function productImageUrl(image) {
  if (!image) return '';
  return /^(https?:|data:|blob:)/i.test(image) ? image : `${API_ORIGIN}${image}`;
}
async function originalProducts(signal) {
  const response = await fetch(`${API_ORIGIN}/api/products`, { signal });
  if (!response.ok) throw new Error('Не удалось загрузить товары.');
  const products = await response.json();
  if (!Array.isArray(products)) throw new Error('Не удалось загрузить товары.');
  return products;
}
export async function getCatalogProducts(signal) {
  const results = await Promise.allSettled([originalProducts(signal), getPublicSellerProducts(signal)]);
  if (signal?.aborted) throw new DOMException('Запрос отменён', 'AbortError');
  if (results.every(result => result.status === 'rejected')) throw new Error('Не удалось загрузить товары.');
  return results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
}
export async function getCatalogProduct(id, signal) {
  if (String(id).startsWith('seller-')) return getPublicSellerProduct(id, signal);
  return (await originalProducts(signal)).find(product => String(product.id) === String(id));
}
