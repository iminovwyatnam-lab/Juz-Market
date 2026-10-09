import { translate as t, useLanguage } from '../preferences/preferences';
import { useEffect, useRef, useState } from 'react';
import './support.css';

export default function ChatPanel({ thread, side, onSend, loading, error }) {
    useLanguage();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const pending = useRef(null);
  const lock = useRef(false);
  const list = useRef(null);
  const lastId = thread?.messages?.at(-1)?.id;
  useEffect(() => { if (list.current) list.current.scrollTop = list.current.scrollHeight; }, [lastId]);
  async function submit(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || lock.current) return;
    lock.current = true; setSending(true); setSendError('');
    if (!pending.current || pending.current.text !== text) pending.current = { text, clientId: crypto.randomUUID() };
    try { await onSend(pending.current); setDraft(''); pending.current = null; }
    catch (err) { setSendError(err.message); }
    finally { lock.current = false; setSending(false); }
  }
  return <div className="jm-chat">
    <div className="jm-chat-messages" ref={list} role="log" aria-live="polite" aria-label={t("Переписка с поддержкой")} aria-busy={loading}>
      {loading && !thread ? <p className="jm-chat-empty">{t("Загрузка переписки…")}</p> : !thread?.messages?.length ? <p className="jm-chat-empty">{t("Напишите ваш вопрос. Ответ администратора появится здесь.")}</p> : thread.messages.map(message => <div key={message.id} className={`jm-chat-message ${message.sender === side ? 'jm-chat-own' : ''}`}>
        <b>{message.sender === 'admin' ? t("Поддержка Juz Market") : side === 'user' ? t("Вы") : thread.user?.name || thread.user?.login || t("Пользователь")}</b>
        <p>{message.text}</p><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}</time>
      </div>)}
    </div>
    {(sendError || error) && <p className="jm-chat-error" role="alert">{sendError || error}</p>}
    <form className="jm-chat-compose" onSubmit={submit}>
      <label htmlFor={`jm-chat-text-${side}`}>{t("Сообщение")}</label>
      <textarea id={`jm-chat-text-${side}`} value={draft} onChange={event => setDraft(event.target.value)} placeholder={t("Напишите сообщение…")} rows={3} maxLength={2000} required disabled={sending} />
      <div><small>{draft.length}/2000</small><button type="submit" disabled={sending || loading || !draft.trim()}>{sending ? t("Отправка…") : t("Отправить")}</button></div>
    </form>
  </div>;
}
