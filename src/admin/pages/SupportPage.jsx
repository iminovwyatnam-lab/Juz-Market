import { useEffect, useState } from 'react';
import AdminAccess from '../components/AdminAccess';
import ChatPanel from '../../support/ChatPanel';
import { getAdminThread, getSupportThreads, markAdminRead, newerThread, sendAdminMessage } from '../../support/supportApi';
import '../../support/support.css';

function Conversation({ id }) {
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    let inFlight = false;
    async function refresh() {
      if (inFlight) return;
      inFlight = true;
      try {
        const next = await getAdminThread(id, controller.signal);
        if (controller.signal.aborted) return;
        setThread(current => newerThread(current, next)); setError('');
        if (next.unread) await markAdminRead(id, next.messages.at(-1)?.seq || 0);
      } catch (err) { if (!controller.signal.aborted) setError(err.message); }
      finally { inFlight = false; if (!controller.signal.aborted) setLoading(false); }
    }
    refresh();
    const interval = setInterval(refresh, 4000);
    return () => { controller.abort(); clearInterval(interval); };
  }, [id]);
  async function send(data) {
    const next = await sendAdminMessage(id, data);
    setThread(current => newerThread(current, next)); setError('');
  }
  return <div className="jm-support-conversation">
    {thread && <div className="jm-support-person"><b>{[thread.user.name, thread.user.surname].filter(Boolean).join(' ') || thread.user.login}</b><span>{thread.user.email} · {thread.user.login}</span></div>}
    <ChatPanel thread={thread} side="admin" onSend={send} loading={loading} error={error} />
  </div>;
}

function SupportInbox() {
  const [threads, setThreads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    let inFlight = false;
    async function refresh() {
      if (inFlight) return;
      inFlight = true;
      try { const next = await getSupportThreads(controller.signal); if (!controller.signal.aborted) { setThreads(next); setError(''); } }
      catch (err) { if (!controller.signal.aborted) setError(err.message); }
      finally { inFlight = false; if (!controller.signal.aborted) setLoading(false); }
    }
    refresh(); const interval = setInterval(refresh, 4000);
    return () => { controller.abort(); clearInterval(interval); };
  }, []);
  return <section>
    <p className="adm-view-sub">Обращения пользователей из профиля. Новые сообщения появляются автоматически.</p>
    {error && <p role="alert" className="jm-chat-error">{error}</p>}
    <div className="jm-support-inbox adm-panel">
      <div className="jm-support-threads" aria-label="Обращения пользователей">
        {loading ? <p className="jm-chat-empty">Загрузка обращений…</p> : !threads.length ? <p className="jm-chat-empty">Обращений пока нет.</p> : threads.map(thread => <button type="button" className={`jm-support-thread ${selected === thread.id ? 'is-active' : ''}`} key={thread.id} onClick={() => setSelected(thread.id)}>
          <span><b>{thread.user.name || thread.user.login}</b>{thread.unread > 0 && <b className="jm-support-badge">{thread.unread}</b>}</span>
          <small>{thread.user.email}</small><p>{thread.lastMessage?.text}</p>
        </button>)}
      </div>
      {selected ? <Conversation key={selected} id={selected} /> : <p className="jm-chat-empty">Выберите обращение, чтобы ответить пользователю.</p>}
    </div>
  </section>;
}
export default function SupportPage() { return <AdminAccess><SupportInbox /></AdminAccess>; }
