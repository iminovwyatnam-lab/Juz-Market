// src/admin/adminApi.js
// Обёртки над fetch для товаров и категорий.
// Говорят с сервером server.js (Juz Market API) на http://localhost:4000
// (запускается через npm start в отдельной папке juz-market-api).

const API_URL = import.meta.env.VITE_API_ORIGIN || 'http://localhost:4000';

async function request(path, options){
  const res = await fetch(`${API_URL}${path}`, options);
  if(!res.ok){
    throw new Error(`Ошибка запроса ${path}`);
  }
  return res.json();
}

export function getProducts(){
  return request('/products');
}
export function createProduct(formData){
  return request('/products', { method: 'POST', body: formData });
}
export function updateProduct(id, formData){
  return request(`/products/${id}`, { method: 'PUT', body: formData });
}
export function deleteProduct(id){
  return request(`/products/${id}`, { method: 'DELETE' });
}

export function getCategories(){
  return request('/categories');
}
export function createCategory(name){
  return request('/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
}
export function deleteCategory(name){
  return request(`/categories/${encodeURIComponent(name)}`, { method: 'DELETE' });
}

// Простая проверка "жив ли сервер" — используется в шапке админки.
// Проверяет отдельный /health-эндпоинт, который не зависит от
// файлов с данными — поэтому не путает "сервер выключен" с
// "сервер работает, но что-то не так с products.json".
export async function pingApi(){
  try{
    const res = await fetch('http://localhost:4000/health');
    return res.ok;
  } catch(e){
    return false;
  }
}
