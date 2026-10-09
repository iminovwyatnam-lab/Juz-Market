import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

export function createMarketFeatures({ getDb, commit, body, fail, requiredText, imageInput, uploadsDir, removePhoto, authenticateUser, throttle, isPublished }) {
  const banners = () => getDb().banners || [];
  const reviews = () => getDb().reviews || [];
  const publicReview = ({ userId, clientId, ...review }) => ({ ...review, comments: (review.comments || []).map(({ userId, clientId, ...comment }) => comment) });
  const author = user => [user.name, user.surname].filter(Boolean).join(' ') || user.login || 'Покупатель';
  function savePhoto(photo) {
    const filename = `${randomUUID()}.${photo.extension}`;
    writeFileSync(path.join(uploadsDir, filename), photo.bytes, { mode: 0o600 });
    return `/uploads/${filename}`;
  }
  function validClientId(value) {
    if (typeof value !== 'string' || !/^[\w-]{8,80}$/.test(value)) throw fail(400, 'Некорректный идентификатор запроса.');
    return value;
  }
  async function requireProduct(id) {
    if (id.startsWith('seller-')) {
      const product = getDb().products.find(p => p.id === id && isPublished(p));
      if (!product) throw fail(404, 'Товар не найден.');
      return;
    }
    let response;
    try { response = await fetch(`${(process.env.MARKET_API_ORIGIN || 'http://localhost:4000').replace(/\/$/, '')}/api/products`, { signal: AbortSignal.timeout(8000) }); }
    catch { throw fail(503, 'Не удалось проверить товар. Попробуйте позже.'); }
    if (!response.ok) throw fail(503, 'Не удалось проверить товар. Попробуйте позже.');
    const products = await response.json();
    if (!Array.isArray(products) || !products.some(p => String(p.id) === id)) throw fail(404, 'Товар не найден.');
  }
  async function publicRoute(req, route, send) {
    if (route === '/api/banners' && req.method === 'GET') {
      send(200, banners().filter(b => b.active).sort((a, b) => a.position - b.position)); return true;
    }
    if (route === '/api/ratings' && req.method === 'GET') {
      const totals = {};
      for (const r of reviews()) {
        const value = Number(r.rating);
        if (!(value >= 1 && value <= 5)) continue;
        const item = totals[r.productId] || (totals[r.productId] = { sum: 0, count: 0 });
        item.sum += value; item.count += 1;
      }
      send(200, Object.fromEntries(Object.entries(totals).map(([id, { sum, count }]) => [id, { average: sum / count, count }]))); return true;
    }
    const match = route.match(/^\/api\/reviews\/([^/]+)(?:\/([\w-]+)\/comments)?$/);
    if (!match) return false;
    let productId;
    try { productId = decodeURIComponent(match[1]); } catch { throw fail(400, 'Неверный товар.'); }
    if (!/^[\w-]{1,160}$/.test(productId)) throw fail(400, 'Неверный товар.');
    if (req.method === 'GET' && !match[2]) {
      send(200, reviews().filter(r => r.productId === productId).map(publicReview).reverse()); return true;
    }
    if (req.method !== 'POST') return false;
    authenticateUser(req);
    throttle(req);
    const input = await body(req, 12 * 1024 * 1024);
    const text = requiredText(input.text, 'Комментарий', 1, 3000);
    const clientId = validClientId(input.clientId);
    await requireProduct(productId);
    const user = authenticateUser(req);
    if (match[2]) {
      const review = reviews().find(r => r.id === match[2] && r.productId === productId);
      if (!review) throw fail(404, 'Отзыв не найден.');
      if (!(review.comments || []).some(c => c.userId === user.id && c.clientId === clientId)) {
        const comment = { id: randomUUID(), userId: user.id, author: author(user), text, clientId, createdAt: new Date().toISOString() };
        commit({ ...getDb(), reviews: reviews().map(r => r.id === review.id ? { ...r, comments: [...(r.comments || []), comment] } : r) });
      }
    } else {
      if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) throw fail(400, 'Выберите оценку от 1 до 5.');
      if (!['ideal', 'defective', 'other'].includes(input.condition)) throw fail(400, 'Укажите состояние товара.');
      if (!Array.isArray(input.photos) || input.photos.length > 4) throw fail(400, 'Добавьте не больше 4 фото.');
      const photos = input.photos.map(value => imageInput(value));
      if (photos.some(photo => !photo)) throw fail(400, 'Некорректное фото.');
      if (!reviews().some(r => r.productId === productId && r.userId === user.id && r.clientId === clientId)) {
        const saved = [];
        try {
          photos.forEach(photo => saved.push(savePhoto(photo)));
          const review = { id: randomUUID(), productId, userId: user.id, author: author(user), text, rating: input.rating, condition: input.condition, photos: saved, comments: [], clientId, createdAt: new Date().toISOString() };
          commit({ ...getDb(), reviews: [...reviews(), review] });
        } catch (err) { saved.forEach(removePhoto); throw err; }
      }
    }
    send(201, reviews().filter(r => r.productId === productId).map(publicReview).reverse()); return true;
  }
  // Доступ сюда даётся только после adminAuth.
  async function adminRoute(req, route, send) {
    const match = route.match(/^\/api\/admin\/banners(?:\/([\w-]+))?$/);
    if (!match) return false;
    const id = match[1];
    if (req.method === 'GET' && !id) { send(200, [...banners()].sort((a, b) => a.position - b.position)); return true; }
    if (req.method === 'DELETE' && id) {
      const current = banners().find(b => b.id === id);
      if (!current) throw fail(404, 'Баннер не найден.');
      commit({ ...getDb(), banners: banners().filter(b => b.id !== id) }); removePhoto(current.image);
      send(200, { ok: true }); return true;
    }
    if ((req.method === 'POST' && !id) || (req.method === 'PUT' && id)) {
      const input = await body(req, 8 * 1024 * 1024);
      const current = id && banners().find(b => b.id === id);
      if (id && !current) throw fail(404, 'Баннер не найден.');
      const title = requiredText(input.title, 'Название', 1, 160);
      const link = typeof input.link === 'string' ? input.link.trim() : '';
      if (link.length > 2000 || (link && !(/^\/(?!\/)[^\\\s]*$/.test(link) || /^https?:\/\/[^\s\\]+$/i.test(link)))) throw fail(400, 'Ссылка должна начинаться с /, http:// или https://.');
      if (!Number.isInteger(input.position) || input.position < 0 || input.position > 9999) throw fail(400, 'Порядок: число от 0 до 9999.');
      if (typeof input.active !== 'boolean') throw fail(400, 'Укажите видимость баннера.');
      const photo = imageInput(input.imageData, 5 * 1024 * 1024);
      if (!photo && !current?.image) throw fail(400, 'Добавьте изображение баннера.');
      let image = current?.image;
      try {
        if (photo) image = savePhoto(photo);
        const banner = { id: id || randomUUID(), title, link, position: input.position, active: input.active, image };
        commit({ ...getDb(), banners: current ? banners().map(b => b.id === id ? banner : b) : [...banners(), banner] });
        if (photo && current) removePhoto(current.image);
        send(current ? 200 : 201, banner);
      } catch (err) { if (photo && image) removePhoto(image); throw err; }
      return true;
    }
    return false;
  }
  return { publicRoute, adminRoute };
}
