// src/admin/adminStorage.js
// Заказы и пользователи пока хранятся в localStorage браузера —
// для них ещё нет отдельного backend-эндпоинта (только для
// товаров/категорий, через adminApi.js).

const KEYS = {
  orders: 'jm_orders',
  users: 'jm_users'
};

export const ORDER_STATUS_LABELS = {
  new: 'Новый',
  processing: 'В обработке',
  delivering: 'В пути',
  done: 'Доставлен',
  cancelled: 'Отменён'
};

function read(key){
  const raw = localStorage.getItem(key);
  if(!raw) return [];
  try{ return JSON.parse(raw); }
  catch(e){ return []; }
}

function write(key, data){
  localStorage.setItem(key, JSON.stringify(data));
}

export function loadOrders(){ return read(KEYS.orders); }
export function saveOrders(orders){ write(KEYS.orders, orders); }

export function loadUsers(){ return read(KEYS.users); }
export function saveUsers(users){ write(KEYS.users, users); }

export function orderTotal(order){
  return order.items.reduce((sum, it) => sum + it.price * it.qty, 0);
}
