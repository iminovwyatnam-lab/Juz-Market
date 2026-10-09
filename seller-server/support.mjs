import { randomBytes, randomUUID, createHash } from 'node:crypto';

const verifyPath = process.env.SUPPORT_AUTH_VERIFY_PATH || '/api/auth/me';
const digest = value => createHash('sha256').update(value).digest('hex');
const authOrigin = (process.env.SUPPORT_AUTH_API_ORIGIN || 'http://localhost:4001').replace(/\/$/, '');

// Пользователь определяется ответом существующего auth-сервера, а не данными браузера.
export function createSupportHandler({ getDb, commit, body, fail, throttle }) {
  const messageRates = new Map();
  const tokenHash = req => digest(req.headers.authorization?.replace(/^Bearer /, '') || '');
  const sessions = () => getDb().supportSessions || [];
  const threads = () => getDb().supportThreads || [];
  function authenticate(req) {
    const session = sessions().find(item => item.hash === tokenHash(req) && item.expires > Date.now());
    if (!session) throw fail(401, 'Подтвердите вход, чтобы открыть переписку.');
    return session.user;
  }
  function unread(thread, side) {
    return thread.messages.filter(m => m.sender !== side && m.seq > (thread[`${side}Read`] || 0)).length;
  }
  function view(thread, side, full = true) {
    if (!thread) return { id: null, messages: [], unread: 0 };
    const { id, user, createdAt, updatedAt, messages } = thread;
    return { id, user, createdAt, updatedAt, unread: unread(thread, side), lastMessage: messages.at(-1) || null,
      ...(full ? { messages } : {}) };
  }
  function save(thread) {
    const current = getDb();
    const all = current.supportThreads || [];
    commit({ ...current, supportThreads: all.some(t => t.id === thread.id) ? all.map(t => t.id === thread.id ? thread : t) : [...all, thread] });
  }
  function addMessage(thread, input, side, rateKey) {
    if (typeof input.text !== 'string' || !input.text.trim() || input.text.trim().length > 2000) throw fail(400, 'Сообщение должно содержать от 1 до 2000 символов.');
    if (typeof input.clientId !== 'string' || !/^[\w-]{8,80}$/.test(input.clientId)) throw fail(400, 'Некорректный идентификатор сообщения.');
    if (thread.messages.some(m => m.clientId === input.clientId && m.sender === side)) return thread;
    const now = Date.now();
    for (const [key, value] of messageRates) if (value.until <= now) messageRates.delete(key);
    const rate = messageRates.get(rateKey) || { count: 0, until: now + 60000 };
    if (++rate.count > 30) throw fail(429, 'Слишком много сообщений. Подождите минуту.');
    messageRates.set(rateKey, rate);
    const message = { id: randomUUID(), clientId: input.clientId, seq: (thread.messages.at(-1)?.seq || 0) + 1,
      sender: side, text: input.text.trim(), createdAt: new Date().toISOString() };
    const next = { ...thread, updatedAt: message.createdAt, messages: [...thread.messages, message] };
    save(next);
    return next;
  }
  function read(thread, input, side) {
    if (!Number.isSafeInteger(input.through) || input.through < 0) throw fail(400, 'Некорректный номер сообщения.');
    if (!thread) return;
    const through = Math.min(input.through, thread.messages.at(-1)?.seq || 0);
    if (through > (thread[`${side}Read`] || 0)) save({ ...thread, [`${side}Read`]: through });
  }
  async function userRoute(req, route, send) {
    if (!route.startsWith('/api/support/')) return false;
    if (route === '/api/support/session' && req.method === 'POST') {
      throttle(req);
      const input = await body(req, 8192);
      if (typeof input.token !== 'string' || !input.token || input.token.length > 2048) throw fail(401, 'Войдите в аккаунт, чтобы открыть переписку.');
      let response;
      try {
        response = await fetch(`${authOrigin}${verifyPath}`, { headers: { Authorization: `Bearer ${input.token}` }, signal: AbortSignal.timeout(8000) });
      } catch { throw fail(503, 'Не удалось связаться с сервером входа. Попробуйте позже.'); }
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw fail(response.status >= 500 ? 503 : 401, 'Сессия входа недействительна. Войдите в аккаунт заново.');
      const trusted = result.user || result;
      if (!trusted || !['string', 'number'].includes(typeof trusted.id) || !String(trusted.id)) throw fail(502, 'Сервер входа не вернул пользователя.');
      if (input.expectedUserId !== undefined && String(input.expectedUserId) !== String(trusted.id)) throw fail(403, 'Используйте аккаунт, открытый в профиле.');
      const user = { id: String(trusted.id), name: String(trusted.name || ''), surname: String(trusted.surname || ''), login: String(trusted.login || ''), email: String(trusted.email || '') };
      const token = randomBytes(32).toString('hex');
      commit({ ...getDb(), supportSessions: [...sessions().filter(s => s.expires > Date.now()), { hash: digest(token), user, expires: Date.now() + 7 * 86400000 }] });
      send(201, { token, user }); return true;
    }
    const user = authenticate(req);
    if (route === '/api/support/session' && req.method === 'DELETE') {
      commit({ ...getDb(), supportSessions: sessions().filter(s => s.hash !== tokenHash(req)) });
      send(200, { ok: true }); return true;
    }
    if (route === '/api/support/thread' && req.method === 'GET') {
      send(200, view(threads().find(t => t.user.id === user.id), 'user')); return true;
    }
    if (req.method === 'POST' && ['/api/support/messages', '/api/support/read'].includes(route)) {
      const input = await body(req, 16384);
      authenticate(req); // Сессия могла быть отозвана во время чтения тела запроса.
      const thread = threads().find(t => t.user.id === user.id);
      if (route.endsWith('/read')) { read(thread, input, 'user'); send(200, { ok: true }); }
      else {
        const createdAt = new Date().toISOString();
        send(200, view(addMessage(thread || { id: randomUUID(), user, createdAt, updatedAt: createdAt, messages: [], userRead: 0, adminRead: 0 }, input, 'user', user.id), 'user'));
      }
      return true;
    }
    throw fail(404, 'Страница поддержки не найдена.');
  }
  // Вызывается только после adminAuth в основном сервере.
  async function adminRoute(req, route, send) {
    if (route === '/api/admin/support' && req.method === 'GET') {
      send(200, [...threads()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(t => view(t, 'admin', false))); return true;
    }
    const match = route.match(/^\/api\/admin\/support\/([\w-]+)(?:\/(messages|read))?$/);
    if (!match) return false;
    const input = req.method === 'POST' ? await body(req, 16384) : null;
    const thread = threads().find(t => t.id === match[1]);
    if (!thread) throw fail(404, 'Переписка не найдена.');
    if (req.method === 'GET' && !match[2]) send(200, view(thread, 'admin'));
    else if (req.method === 'POST' && match[2] === 'messages') send(200, view(addMessage(thread, input, 'admin', `admin:${thread.id}`), 'admin'));
    else if (req.method === 'POST' && match[2] === 'read') { read(thread, input, 'admin'); send(200, { ok: true }); }
    else throw fail(404, 'Страница поддержки не найдена.');
    return true;
  }
  return { userRoute, adminRoute, authenticate };
}
