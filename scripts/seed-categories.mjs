// Разово добавляет все категории в API, чтобы они появились в админке
// (выпадающий список у товара). Запуск при включённом API:
//   node scripts/seed-categories.mjs
const API = 'http://localhost:4000/api';
const CATEGORIES = [
  'Техника','Гаджеты','Парфюмы','Зоотовары','Канцтовары','Электроника',
  'Рыбалка и Охота','Обувь','Мебель','Одежда','Гигиена','Продукты',
  'Аксессуары','Оборудование','Все для Пк','Все для Дома','Все для Сада',
  'Все для Авто','Все для Детей','Все для Спорта','Все для Ремонта',
  'Бытовая Химия','Бытовая техника',
];

const existing = await (await fetch(`${API}/categories`)).json();
for (const name of CATEGORIES) {
  if (existing.includes(name)) { console.log('уже есть:', name); continue; }
  const res = await fetch(`${API}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  console.log(res.ok ? 'добавлена:' : 'ошибка:', name);
}
