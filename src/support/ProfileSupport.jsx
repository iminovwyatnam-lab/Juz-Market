import { translate as t, useLanguage } from '../preferences/preferences';
import { useEffect, useState } from 'react';
import ChatPanel from './ChatPanel';
import { clearSupportSession, connectSupport, getSupportThread, hasSupportSession, markSupportRead, newerThread, sendSupportMessage } from './supportApi';
import './support.css';

export default function ProfileSupport({ user }) {
    useLanguage();
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(() => hasSupportSession(user.id));
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(connected);
  const [error, setError] = useState('');
  useEffect(() => {
    if (connected || !open) return;
    let active = true;
    connectSupport(user.id)
      .then(() => { if (active) { setError(''); setLoading(true); setConnected(true); } })
      .catch(err => { if (active) { setError(err.message); setLoading(false); } });
    return () => { active = false; };
  }, [connected, open, user.id]);
  useEffect(() => {
    if (!connected) return;
    const controller = new AbortController();
    let inFlight = false;
    async function refresh() {
      if (inFlight) return;
      inFlight = true;
      try {
        const next = await getSupportThread(user.id, controller.signal);
        if (controller.signal.aborted) return;
        setThread(current => newerThread(current, next)); setError('');
        if (open && next.unread) {
          await markSupportRead(user.id, next.messages.at(-1)?.seq || 0);
          if (!controller.signal.aborted) setThread(current => ({ ...current, unread: 0 }));
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err.message);
        if (err.status === 401) { clearSupportSession(user.id); setConnected(false); setThread(null); }
      } finally { inFlight = false; if (!controller.signal.aborted) setLoading(false); }
    }
    refresh();
    const interval = setInterval(refresh, 4000);
    return () => { controller.abort(); clearInterval(interval); };
  }, [connected, open, user.id]);
  async function send(data) {
    try { const next = await sendSupportMessage(user.id, data); setThread(current => newerThread(current, next)); setError(''); }
    catch (err) { if (err.status === 401) { clearSupportSession(user.id); setConnected(false); setThread(null); } throw err; }
  }
  return <section className="jm-profile-support">
    <button type="button" className="jm-support-toggle" aria-expanded={open} aria-controls="jm-support-content" onClick={() => setOpen(value => !value)}>
      <span><b>{t("Чат поддержки")}</b><small>{t("Вопросы о заказах и работе сайта")}</small></span><span>{thread?.unread > 0 && <b className="jm-support-badge">{thread.unread}</b>} {open ? '−' : '+'}</span>
    </button>
    {open && <div id="jm-support-content">
      {connected ? <ChatPanel thread={thread} side="user" onSend={send} loading={loading} error={t(error)} /> : error ? <p role="alert" className="jm-chat-error">{t(error)}</p> : <p>{t("Загрузка переписки…")}</p>}
    </div>}
  </section>;
}
