// src/orders/ordersStore.js
// Заказы покупателей. Хранятся в localStorage в том же формате (jm_orders),
// который читает админка (adminStorage.js) — поэтому заказы сразу видны в админке.
import { loadOrders, saveOrders } from '../admin/adminStorage.js';

const ADDRESS_KEY = 'jm_delivery_address';   // тот же ключ, что и на странице товара
const LOCATION_KEY = 'jm_delivery_location';
const PHONE_KEY = 'jm_phone';

function readString(key) {
  try { return localStorage.getItem(key) || ''; }
  catch { return ''; }
}

function writeString(key, value) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch { /* хранилище недоступно — просто не запоминаем */ }
}

// ---- сохранённые данные доставки ----
export function getSavedLocation() {
  try {
    const loc = JSON.parse(localStorage.getItem(LOCATION_KEY));
    if (loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) return loc;
  } catch { /* битые данные игнорируем */ }
  return null;
}

export function saveLocation(coords) {
  writeString(LOCATION_KEY, coords ? JSON.stringify(coords) : '');
}

export function getSavedDelivery() {
  return {
    phone: readString(PHONE_KEY),
    address: readString(ADDRESS_KEY),
    coords: getSavedLocation(),
  };
}

export function saveDelivery({ phone, address, coords }) {
  writeString(PHONE_KEY, phone);
  writeString(ADDRESS_KEY, address);
  saveLocation(coords);
}

// ---- геолокация по клику ----
export function detectLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Ваш браузер не поддерживает определение локации. Введите адрес вручную.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: Number(pos.coords.latitude.toFixed(6)),
        lng: Number(pos.coords.longitude.toFixed(6)),
      }),
      (err) => {
        const messages = {
          1: 'Доступ к локации запрещён. Разрешите его в настройках браузера или введите адрес вручную.',
          2: 'Не удалось определить локацию. Введите адрес вручную.',
          3: 'Определение локации заняло слишком много времени. Попробуйте ещё раз.',
        };
        reject(new Error(messages[err.code] || messages[2]));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

// ---- заказы ----
function pad(n) { return String(n).padStart(2, '0'); }

function nowString() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function idNumber(order) {
  const match = String(order.id).match(/(\d+)\s*$/);
  return match ? Number(match[1]) : 0;
}

function nextOrderId(orders) {
  const max = orders.reduce((m, o) => Math.max(m, idNumber(o)), 1000);
  return `JM-${max + 1}`;
}

export function createOrder({ user, items, phone, address, coords }) {
  const orders = loadOrders();
  const order = {
    id: nextOrderId(orders),
    date: nowString(),
    status: 'new',
    userId: user.id,
    customerName: `${user.name || ''} ${user.surname || ''}`.trim() || user.login,
    email: user.email,
    phone,
    address,
    lat: coords ? coords.lat : null,
    lng: coords ? coords.lng : null,
    items: items.map((it) => ({
      id: it.id,
      name: it.name,
      price: Number(it.price) || 0,
      qty: it.qty,
      ...(it.sellerId ? { sellerId: it.sellerId, sellerName: it.sellerName, sellerPhone: it.sellerPhone } : {}),
    })),
  };
  saveOrders([...orders, order]);
  return order;
}

export function getUserOrders(userId) {
  return loadOrders()
    .filter((o) => o.userId === userId)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || idNumber(b) - idNumber(a));
}
