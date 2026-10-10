import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

// Оба процесса запускаются из одной папки: существующая база остаётся на месте.
const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || process.env.SELLER_PORT || 4002);
const host = process.env.SELLER_HOST || '127.0.0.1';
const probeHost = ['0.0.0.0', '::'].includes(host) ? '127.0.0.1' : host;
const origin = `http://${probeHost.includes(':') ? `[${probeHost}]` : probeHost}:${port}`;
const children = new Set();
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill('SIGTERM');
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

function launch(file, args = []) {
  const child = spawn(process.execPath, [file, ...args], { cwd: root, stdio: 'inherit' });
  children.add(child);
  child.on('error', err => { console.error(err.message); children.delete(child); stop(1); });
  child.on('exit', (code, signal) => {
    children.delete(child);
    if (!stopping) stop(code ?? (signal ? 1 : 0));
  });
  return child;
}

async function available() {
  try {
    const response = await fetch(`${origin}/api/banners`, { signal: AbortSignal.timeout(800) });
    return response.ok && Array.isArray(await response.json());
  } catch { return false; }
}

try {
  // Если npm run sellers уже работает, используем его и не останавливаем при выходе.
  if (!await available() && !stopping) {
    const server = launch(fileURLToPath(new URL('../seller-server/server.mjs', import.meta.url)));
    let ready = false;
    for (let attempt = 0; attempt < 40 && !stopping; attempt++) {
      if (await available()) { ready = true; break; }
      if (server.exitCode !== null) break;
      await delay(150);
    }
    if (!ready && !stopping) throw new Error('Сервер данных не запустился. Проверьте сообщение выше и доступность порта ' + port + '.');
  }
  if (!stopping) {
    console.log('Сервер баннеров и продавцов подключён. Данные сохраняются в seller-server/data (или SELLER_DATA_DIR).');
    const vite = launch(fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), process.argv.slice(2));
    await once(vite, 'exit');
  }
} catch (err) {
  console.error(err.message);
  stop(1);
}
