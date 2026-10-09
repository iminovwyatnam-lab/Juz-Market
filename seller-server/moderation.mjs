import { randomUUID } from 'node:crypto';

export function createModerationHandler({ getDb, commit, fail, sellerInfo, publicProduct, removePhoto, removePassportPhotos }) {
  const view = seller => ({ ...sellerInfo(seller), firstName: seller.firstName || '', lastName: seller.lastName || '', middleName: seller.middleName || '',
    blocked: Boolean(seller.blocked), blockedAt: seller.blockedAt || null, productCount: getDb().products.filter(p => p.sellerId === seller.id).length });
  const audit = (action, sellerId, productId) => [...(getDb().moderationLog || []), { id: randomUUID(), action, sellerId, ...(productId ? { productId } : {}), at: new Date().toISOString(), actor: 'admin' }];
  // Все маршруты защищает adminAuth в server.mjs.
  return function moderate(req, route, send) {
    if (route === '/api/admin/access' && req.method === 'GET') { send(200, { ok: true }); return true; }
    if (route === '/api/admin/sellers' && req.method === 'GET') { send(200, getDb().sellers.map(view)); return true; }
    const match = route.match(/^\/api\/admin\/sellers\/([\w-]+)(?:\/(block|unblock|products)(?:\/([\w-]+))?)?$/);
    if (!match) return false;
    const db = getDb();
    const seller = db.sellers.find(s => s.id === match[1]);
    if (!seller) throw fail(404, 'Продавец не найден.');
    if (req.method === 'GET' && !match[2]) send(200, view(seller));
    else if (req.method === 'DELETE' && !match[2]) {
      const products = db.products.filter(p => p.sellerId === seller.id);
      const applications = db.applications.filter(a => a.id === seller.applicationId || a.email === seller.email);
      const applicationIds = new Set(applications.map(a => a.id));
      commit({ ...db,
        sellers: db.sellers.filter(s => s.id !== seller.id),
        sessions: db.sessions.filter(s => s.sellerId !== seller.id),
        products: db.products.filter(p => p.sellerId !== seller.id),
        applications: db.applications.filter(a => !applicationIds.has(a.id)),
        moderationLog: audit('delete-seller', seller.id),
      });
      products.forEach(product => removePhoto(product.image));
      applications.forEach(removePassportPhotos);
      send(200, { ok: true });
    }
    else if (req.method === 'POST' && ['block', 'unblock'].includes(match[2]) && !match[3]) {
      const blocked = match[2] === 'block';
      const updated = { ...seller, blocked, blockedAt: blocked ? new Date().toISOString() : null };
      commit({ ...db, sellers: db.sellers.map(s => s.id === seller.id ? updated : s),
        sessions: blocked ? db.sessions.filter(s => s.sellerId !== seller.id) : db.sessions,
        moderationLog: audit(match[2], seller.id) });
      send(200, view(updated));
    } else if (req.method === 'GET' && match[2] === 'products' && !match[3]) send(200, db.products.filter(p => p.sellerId === seller.id).map(publicProduct));
    else if (req.method === 'DELETE' && match[2] === 'products' && match[3]) {
      const product = db.products.find(p => p.sellerId === seller.id && p.id === match[3]);
      if (!product) throw fail(404, 'Товар не найден в этом магазине.');
      commit({ ...db, products: db.products.filter(p => p.id !== product.id), moderationLog: audit('delete-product', seller.id, product.id) });
      removePhoto(product.image);
      send(200, { ok: true });
    } else throw fail(404, 'Страница не найдена.');
    return true;
  };
}
