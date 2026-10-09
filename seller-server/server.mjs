import http from 'node:http';
import { createMarketFeatures } from './market-features.mjs';
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { randomBytes, randomUUID, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { createSupportHandler } from './support.mjs';
import { createModerationHandler } from './moderation.mjs';

const hashPassword = promisify(scrypt);
const port = Number(process.env.PORT || process.env.SELLER_PORT || 4002);
const dataDir = process.env.SELLER_DATA_DIR || fileURLToPath(new URL('./data/', import.meta.url));
const uploadsDir = path.join(dataDir, 'uploads');
const passportsDir = path.join(dataDir, 'passports');
const database = path.join(dataDir, 'market.json');
const allowedOrigins = new Set((process.env.SELLER_ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173').split(',').map(v => v.trim()));
mkdirSync(uploadsDir, { recursive: true });
mkdirSync(passportsDir, { recursive: true });
let db = { applications: [], ...(existsSync(database) ? JSON.parse(readFileSync(database, 'utf8')) : { sellers: [], products: [], sessions: [] }) };
// Ключ администратора для страницы «Заявки»: из SELLER_ADMIN_KEY или создаётся один раз в data/admin-key.txt
const adminKeyFile = path.join(dataDir, 'admin-key.txt');
if (!process.env.SELLER_ADMIN_KEY && !existsSync(adminKeyFile)) writeFileSync(adminKeyFile, randomBytes(18).toString('hex'), { mode: 0o600 });
const adminKey = process.env.SELLER_ADMIN_KEY || readFileSync(adminKeyFile, 'utf8').trim();
const attempts = new Map();
const digest = value => createHash('sha256').update(value).digest('hex');
const fail = (status, message) => Object.assign(new Error(message), { status });
function commit(next) {
  writeFileSync(`${database}.tmp`, JSON.stringify(next), { mode: 0o600 });
  renameSync(`${database}.tmp`, database);
  db = next;
}
function sellerInfo(seller) {
  return { id: seller.id, storeName: seller.storeName, email: seller.email, phone: seller.phone };
}
function publicProduct(product) {
  const seller = db.sellers.find(s => s.id === product.sellerId);
  return { ...product, sellerName: seller?.storeName || '', sellerPhone: seller?.phone || '' };
}
function requiredText(value, label, min, max) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) throw fail(400, `Проверьте поле «${label}».`);
  return value.trim();
}
async function body(req, limit = 3 * 1024 * 1024) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw fail(415, 'Ожидаются данные JSON.');
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw fail(413, 'Данные слишком большие. Уменьшите фото.');
    chunks.push(chunk);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString());
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw fail(400, 'Некорректные данные запроса.'); }
}
function authenticate(req) {
  const token = req.headers.authorization?.replace(/^Bearer /, '') || '';
  const session = db.sessions.find(s => s.hash === digest(token) && s.expires > Date.now());
  const seller = session && db.sellers.find(s => s.id === session.sellerId);
  if (!seller) throw fail(401, 'Войдите в кабинет продавца.');
  if (seller.blocked) throw fail(403, 'Ваш магазин заблокирован администратором.');
  return seller;
}
function makeSession(seller, sellers = db.sellers) {
  const current = db.sellers.find(s => s.id === seller.id);
  if (!current) throw fail(401, 'Аккаунт продавца удалён.');
  if (current.blocked) throw fail(403, 'Ваш магазин заблокирован администратором.');
  const token = randomBytes(32).toString('hex');
  const sessions = db.sessions.filter(s => s.expires > Date.now());
  sessions.push({ hash: digest(token), sellerId: seller.id, expires: Date.now() + 7 * 86400000 });
  commit({ ...db, sellers, sessions });
  return { token, seller: sellerInfo(seller) };
}
function throttle(req) {
  const now = Date.now();
  for (const [key, item] of attempts) if (item.until < now) attempts.delete(key);
  const ip = req.socket.remoteAddress;
  const item = attempts.get(ip) || { count: 0, until: now + 15 * 60000 };
  if (++item.count > 30) throw fail(429, 'Слишком много попыток. Попробуйте через 15 минут.');
  attempts.set(ip, item);
}
const MIN_SELLER_AGE = 16;
function passportInput(value) {
  const passport = typeof value === 'string' ? value.replace(/[\s-]/g, '').toUpperCase() : '';
  if (!/^[A-Z]{2}\d{7}$/.test(passport)) throw fail(400, 'Введите паспорт в формате AA1234567 (2 буквы и 7 цифр).');
  return passport;
}
function birthDateInput(value) {
  const match = typeof value === 'string' && value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = match ? new Date(Date.UTC(+match[1], +match[2] - 1, +match[3])) : null;
  if (!date || date.getUTCFullYear() !== +match[1] || date.getUTCMonth() !== +match[2] - 1 || date.getUTCDate() !== +match[3]) throw fail(400, 'Укажите дату рождения.');
  const now = new Date();
  let age = now.getUTCFullYear() - date.getUTCFullYear();
  if (now.getUTCMonth() < date.getUTCMonth() || (now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() < date.getUTCDate())) age--;
  if (age < 0 || age > 120) throw fail(400, 'Проверьте дату рождения.');
  if (age < MIN_SELLER_AGE) throw fail(403, `Продавцом можно стать с ${MIN_SELLER_AGE} лет.`);
  return value;
}
function specificationsInput(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 40) throw fail(400, 'Проверьте характеристики товара.');
  return value.map(item => {
    const name = requiredText(item?.name, 'Название характеристики', 1, 80);
    const text = requiredText(item?.value, `Значение «${name}»`, 1, 300);
    return { name, value: text };
  });
}
function imageInput(value, maxBytes = 2 * 1024 * 1024) {
  if (!value) return null;
  if (typeof value !== 'string') throw fail(400, 'Некорректное фото.');
  const match = value.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match) throw fail(400, 'Загрузите фото JPG, PNG или WebP.');
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > maxBytes) throw fail(413, `Фото должно быть не больше ${maxBytes / 1048576} МБ.`);
  const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (!({ png, jpeg, webp })[match[1]]) throw fail(400, 'Файл не соответствует формату фото.');
  return { bytes, extension: match[1] };
}
function productInput(input, current) {
  const name = requiredText(input.name, 'Название', 2, 160);
  const category = requiredText(input.category, 'Категория', 1, 100);
  const shortDescription = requiredText(input.shortDescription, 'Краткое описание', 5, 300);
  const description = requiredText(input.description, 'Полное описание', 5, 5000);
  const specifications = specificationsInput(input.specifications);
  if (typeof input.price !== 'number' || !Number.isFinite(input.price) || input.price <= 0 || input.price > 1e12) throw fail(400, 'Цена должна быть больше нуля.');
  if (!Number.isSafeInteger(input.stock) || input.stock < 0 || input.stock > 10000000) throw fail(400, 'Остаток должен быть целым неотрицательным числом.');
  const photo = imageInput(input.imageData);
  if (!photo && !current?.image) throw fail(400, 'Добавьте фото товара.');
  return { fields: { name, category, shortDescription, description, specifications, price: input.price, stock: input.stock }, photo };
}
function adminAuth(req) {
  const key = Buffer.from(String(req.headers['x-admin-key'] || ''));
  const expected = Buffer.from(adminKey);
  if (key.length !== expected.length || !timingSafeEqual(key, expected)) { throttle(req); throw fail(401, 'Неверный ключ администратора.'); }
}
function adminApplication(a) {
  const { id, status, createdAt, decidedAt, lastName, firstName, middleName, storeName, phone, email, birthDate, passport } = a;
  return { id, status, createdAt, decidedAt, lastName, firstName, middleName, storeName, phone, email, birthDate, passport };
}
function removePassportPhotos(application) {
  for (const filename of Object.values(application.photos || {})) {
    try { unlinkSync(path.join(passportsDir, path.basename(filename))); } catch (err) { if (err.code !== 'ENOENT') console.error('Не удалось удалить фото паспорта:', filename); }
  }
}
function removePhoto(image) {
  if (!image) return;
  const filename = path.basename(image);
  try { unlinkSync(path.join(uploadsDir, filename)); } catch (err) { if (err.code !== 'ENOENT') console.error('Не удалось удалить старое фото:', filename); }
}
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  res.setHeader('Vary', 'Origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Key');
  }
  const send = (status, value) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(value));
  };
  try {
    if (origin && !allowedOrigins.has(origin)) throw fail(403, 'Этот адрес сайта не подключён к кабинету продавца.');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    const url = new URL(req.url, 'http://localhost');
    const route = url.pathname;
    const method = req.method;
    if (method === 'GET' && route === '/health') return send(200, { ok: true });
    if (method === 'GET' && /^\/uploads\/[a-f0-9-]+\.(png|jpeg|webp)$/.test(route)) {
      const filename = path.join(uploadsDir, path.basename(route));
      if (!existsSync(filename)) throw fail(404, 'Фото не найдено.');
      res.writeHead(200, { 'Content-Type': `image/${path.extname(filename).slice(1)}`, 'Cache-Control': 'public, max-age=86400' });
      res.end(readFileSync(filename));
      return;
    }
    if (await support.userRoute(req, route, send)) return;
    if (await features.publicRoute(req, route, send)) return;
    if (method === 'GET' && route === '/api/products') return send(200, db.products.filter(isPublished).map(publicProduct));
    if (method === 'GET' && route.startsWith('/api/products/')) {
      const product = db.products.find(p => p.id === route.slice('/api/products/'.length));
      if (!product || !isPublished(product)) throw fail(404, 'Товар не найден.');
      return send(200, publicProduct(product));
    }
    if (method === 'POST' && ['/api/seller/register', '/api/seller/login'].includes(route)) {
      throttle(req);
      const input = await body(req, route.endsWith('/register') ? 10 * 1024 * 1024 : undefined);
      const email = requiredText(input.email, 'Почта', 3, 254).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail(400, 'Введите правильную почту.');
      if (typeof input.password !== 'string' || input.password.length < 8 || input.password.length > 128) throw fail(400, 'Пароль: от 8 до 128 символов.');
      if (route.endsWith('/register')) {
        const storeName = requiredText(input.storeName, 'Название магазина', 2, 80);
        const phone = requiredText(input.phone, 'Телефон', 7, 30);
        if (!/^[+\d\s()-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7) throw fail(400, 'Введите правильный номер телефона.');
        const lastName = requiredText(input.lastName, 'Фамилия', 2, 60);
        const firstName = requiredText(input.firstName, 'Имя', 2, 60);
        const middleName = requiredText(input.middleName, 'Отчество', 2, 60);
        const passport = passportInput(input.passport);
        const birthDate = birthDateInput(input.birthDate);
        const front = imageInput(input.passportFront, 3 * 1024 * 1024);
        const back = imageInput(input.passportBack, 3 * 1024 * 1024);
        if (!front || !back) throw fail(400, 'Загрузите фото паспорта с двух сторон.');
        if (db.sellers.some(s => s.email === email)) throw fail(409, 'Эта почта уже зарегистрирована. Войдите в кабинет.');
        if (db.applications.some(a => a.email === email && a.status === 'pending')) throw fail(409, 'Заявка с этой почтой уже отправлена и ожидает рассмотрения.');
        const salt = randomBytes(16).toString('hex');
        const passwordHash = (await hashPassword(input.password, salt, 64)).toString('hex');
        const passportHash = (await hashPassword(passport, salt, 64)).toString('hex');
        const id = randomUUID();
        const photos = { front: `${id}-front.${front.extension}`, back: `${id}-back.${back.extension}` };
        writeFileSync(path.join(passportsDir, photos.front), front.bytes, { mode: 0o600 });
        writeFileSync(path.join(passportsDir, photos.back), back.bytes, { mode: 0o600 });
        const application = { id, status: 'pending', createdAt: new Date().toISOString(), lastName, firstName, middleName, storeName, phone, email, birthDate, passport, salt, passwordHash, passportHash, photos };
        const replaced = db.applications.filter(a => a.email === email);
        try { commit({ ...db, applications: [...db.applications.filter(a => a.email !== email), application] }); }
        catch (err) { removePassportPhotos(application); throw err; }
        replaced.forEach(removePassportPhotos);
        return send(201, { application: 'pending' });
      }
      const seller = db.sellers.find(s => s.email === email);
      const application = !seller && db.applications.find(a => a.email === email && a.status !== 'approved');
      if (application) {
        const check = await hashPassword(input.password, application.salt, 64);
        if (timingSafeEqual(check, Buffer.from(application.passwordHash, 'hex'))) {
          throw fail(403, application.status === 'pending'
            ? 'Ваша заявка на регистрацию рассматривается. Войти можно после одобрения.'
            : 'Ваша заявка отклонена. Вы можете отправить новую заявку.');
        }
      }
      const candidate = await hashPassword(input.password, seller?.salt || 'unknown-seller', 64);
      if (!seller || !timingSafeEqual(candidate, Buffer.from(seller.passwordHash, 'hex'))) throw fail(401, 'Неверная почта или пароль.');
      const passport = passportInput(input.passport);
      const passportCandidate = await hashPassword(passport, seller.salt, 64);
      if (seller.passportHash) {
        if (!timingSafeEqual(passportCandidate, Buffer.from(seller.passportHash, 'hex'))) throw fail(401, 'Неверная почта, пароль или паспорт.');
        return send(200, makeSession(seller));
      }
      // Аккаунт создан до проверки паспорта: сохраняем паспорт и дату рождения при первом входе
      const upgraded = { ...seller, passportHash: passportCandidate.toString('hex'), birthDate: birthDateInput(input.birthDate) };
      return send(200, makeSession(upgraded, db.sellers.map(s => s.id === seller.id ? upgraded : s)));
    }
    if (route.startsWith('/api/admin/')) {
      adminAuth(req);
      if (await features.adminRoute(req, route, send)) return;
      if (moderate(req, route, send)) return;
      if (await support.adminRoute(req, route, send)) return;
      if (method === 'GET' && route === '/api/admin/applications') return send(200, [...db.applications].reverse().map(adminApplication));
      const photoRoute = route.match(/^\/api\/admin\/applications\/([\w-]+)\/photo\/(front|back)$/);
      if (method === 'GET' && photoRoute) {
        const application = db.applications.find(a => a.id === photoRoute[1]);
        const filename = application?.photos?.[photoRoute[2]];
        if (!filename || !existsSync(path.join(passportsDir, filename))) throw fail(404, 'Фото не найдено.');
        res.writeHead(200, { 'Content-Type': `image/${path.extname(filename).slice(1)}` });
        res.end(readFileSync(path.join(passportsDir, filename)));
        return;
      }
      const decision = route.match(/^\/api\/admin\/applications\/([\w-]+)\/(approve|reject)$/);
      if (method === 'POST' && decision) {
        const application = db.applications.find(a => a.id === decision[1]);
        if (!application) throw fail(404, 'Заявка не найдена.');
        if (application.status !== 'pending') throw fail(409, 'Эта заявка уже рассмотрена.');
        const decidedAt = new Date().toISOString();
        const applications = db.applications.map(a => a.id === application.id ? { ...a, status: decision[2] === 'approve' ? 'approved' : 'rejected', decidedAt } : a);
        if (decision[2] === 'approve') {
          if (db.sellers.some(s => s.email === application.email)) throw fail(409, 'Продавец с этой почтой уже существует.');
          const { id, lastName, firstName, middleName, storeName, phone, email, salt, passwordHash, passportHash, birthDate } = application;
          commit({ ...db, applications, sellers: [...db.sellers, { id: randomUUID(), storeName, email, phone, salt, passwordHash, passportHash, birthDate, lastName, firstName, middleName, applicationId: id }] });
        } else commit({ ...db, applications });
        return send(200, adminApplication(applications.find(a => a.id === application.id)));
      }
      throw fail(404, 'Страница не найдена.');
    }
    if (!route.startsWith('/api/seller/')) throw fail(404, 'Страница не найдена.');
    const seller = authenticate(req);
    if (method === 'GET' && route === '/api/seller/me') return send(200, sellerInfo(seller));
    if (method === 'POST' && route === '/api/seller/logout') {
      const hash = digest(req.headers.authorization.replace(/^Bearer /, ''));
      commit({ ...db, sessions: db.sessions.filter(s => s.hash !== hash) });
      return send(200, { ok: true });
    }
    if (method === 'GET' && route === '/api/seller/products') return send(200, db.products.filter(p => p.sellerId === seller.id).map(publicProduct));
    const productId = route.startsWith('/api/seller/products/') ? route.slice('/api/seller/products/'.length) : null;
    if ((method === 'POST' && route === '/api/seller/products') || (method === 'PUT' && productId)) {
      const current = productId ? db.products.find(p => p.id === productId && p.sellerId === seller.id) : null;
      if (productId && !current) throw fail(404, 'Товар не найден в вашем магазине.');
      const input = await body(req);
      authenticate(req);
      if (productId && !db.products.some(p => p.id === productId && p.sellerId === seller.id)) throw fail(404, 'Товар уже удалён.');
      const { fields, photo } = productInput(input, current);
      let image = current?.image;
      if (photo) {
        image = `/uploads/${randomUUID()}.${photo.extension}`;
        writeFileSync(path.join(uploadsDir, path.basename(image)), photo.bytes);
      }
      const product = { ...current, ...fields, image, id: current?.id || `seller-${randomUUID()}`, sellerId: seller.id, updatedAt: new Date().toISOString() };
      try {
        commit({ ...db, products: current ? db.products.map(p => p.id === current.id ? product : p) : [...db.products, product] });
      } catch (err) { if (photo) removePhoto(image); throw err; }
      if (photo && current?.image) removePhoto(current.image);
      return send(current ? 200 : 201, publicProduct(product));
    }
    if (method === 'DELETE' && productId) {
      const product = db.products.find(p => p.id === productId && p.sellerId === seller.id);
      if (!product) throw fail(404, 'Товар не найден в вашем магазине.');
      commit({ ...db, products: db.products.filter(p => p.id !== productId) });
      removePhoto(product.image);
      return send(200, { ok: true });
    }
    throw fail(404, 'Страница не найдена.');
  } catch (err) {
    if (!err.status) console.error('Ошибка сервера продавцов:', err.message);
    if (!res.headersSent) send(err.status || 500, err.status ? { error: err.message } : { error: 'Не удалось сохранить данные. Попробуйте ещё раз.' });
  }
});
const isPublished = product => db.sellers.some(s => s.id === product.sellerId && !s.blocked);
const support = createSupportHandler({ getDb: () => db, commit, body, fail, throttle });
const moderate = createModerationHandler({ getDb: () => db, commit, fail, sellerInfo, publicProduct, removePhoto, removePassportPhotos });
const features = createMarketFeatures({ getDb: () => db, commit, body, fail, requiredText, imageInput, uploadsDir, removePhoto, authenticateUser: support.authenticate, throttle, isPublished });
server.listen(port, process.env.SELLER_HOST || '127.0.0.1', () => { console.log(`Кабинет продавцов: http://localhost:${port}`); console.log(process.env.SELLER_ADMIN_KEY ? 'Ключ администратора задан в SELLER_ADMIN_KEY.' : `Ключ администратора: файл ${adminKeyFile}`); });
