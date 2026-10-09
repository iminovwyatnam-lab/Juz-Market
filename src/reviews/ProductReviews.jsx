import { translate as t, useLanguage } from '../preferences/preferences';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/authApi';
import { clearSupportSession, connectSupport, hasSupportSession } from '../support/supportApi';
import { marketRequest, mediaUrl, readPhoto } from '../market/marketApi';
import '../market/features.css';

function CommentForm({ onSend, busy }) {
    useLanguage();
  const [text, setText] = useState('');
  const clientId = useRef(crypto.randomUUID());
  return <form className="jm-review-comment-form" onSubmit={async event => { event.preventDefault(); if (await onSend(text, clientId.current)) { setText(''); clientId.current = crypto.randomUUID(); } }}>
    <label>{t("Комментарий")}<textarea required maxLength={3000} value={text} onChange={event => setText(event.target.value)} disabled={busy} /></label>
    <button type="submit" disabled={busy || !text.trim()}>{t("Отправить комментарий")}</button>
  </form>;
}
export default function ProductReviews({ productId, reviews, loading, error, onChange, onRetry }) {
    useLanguage();
  const { user } = useAuth();
  const connected = Boolean(user && hasSupportSession(user.id));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [rating, setRating] = useState(5);
  const [condition, setCondition] = useState('ideal');
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState([]);
  const [commentFor, setCommentFor] = useState(null);
  const clientId = useRef(crypto.randomUUID());
  const conditions = { ideal: t("В идеальном состоянии"), defective: t("Есть брак"), other: t("Другое") };
  const rated = reviews.filter(r => Number(r.rating) >= 1 && Number(r.rating) <= 5);
  const average = rated.length ? rated.reduce((sum, r) => sum + Number(r.rating), 0) / rated.length : 0;
  const [connectedNow, setConnectedNow] = useState(connected);
  useEffect(() => {
    if (!user || connectedNow) return;
    let active = true;
    connectSupport(user.id)
      .then(() => { if (active) setConnectedNow(true); })
      .catch(err => { if (active) setFormError(err.message); });
    return () => { active = false; };
  }, [user, connectedNow]);
  async function send(data, reviewId) {
    if (busy || uploading) return false;
    setBusy(true); setFormError(''); setNotice('');
    try {
      const result = await marketRequest(`/reviews/${encodeURIComponent(productId)}${reviewId ? `/${reviewId}/comments` : ''}`, { userId: user.id, data });
      onChange(result); setNotice(reviewId ? t("Комментарий добавлен.") : t("Отзыв опубликован.")); return true;
    } catch (err) {
      if (err.status === 401) { clearSupportSession(user.id); setConnectedNow(false); }
      setFormError(err.message); return false;
    } finally { setBusy(false); }
  }
  async function upload(event) {
    const files = [...event.target.files]; event.target.value = '';
    if (!files.length) return;
    if (photos.length + files.length > 4) { setFormError(t("Можно добавить не больше 4 фото.")); return; }
    setUploading(true); setFormError('');
    try { const data = await Promise.all(files.map(file => readPhoto(file))); setPhotos(current => [...current, ...data]); }
    catch (err) { setFormError(err.message); } finally { setUploading(false); }
  }
  return <section id="pd-reviews" className="jm-reviews">
    <h2>{t("Отзывы и комментарии")}</h2>
    <div className="jm-review-overview"><strong>{average ? average.toFixed(1) : '—'}</strong><span>★ · {reviews.length} {t("отзывов")}</span></div>
    {loading && <p role="status">{t("Загрузка отзывов…")}</p>}
    {error && <p className="jm-feature-error" role="alert">{t(error)} <button type="button" onClick={onRetry}>{t("Повторить")}</button></p>}
    {!loading && !error && reviews.length === 0 && <p>{t("Пока нет отзывов. Поделитесь впечатлениями о товаре.")}</p>}
    {!user ? <p><Link to="/login" state={{ from: `/product/${productId}` }}>{t("Войдите, чтобы оставить отзыв")}</Link></p> : !connectedNow ? (formError ? null : <p role="status">{t("Загрузка отзывов…")}</p>) : <form className="jm-feature-form" onSubmit={async event => {
      event.preventDefault(); if (await send({ text, rating, condition, photos, clientId: clientId.current })) { setText(''); setPhotos([]); setRating(5); setCondition('ideal'); clientId.current = crypto.randomUUID(); }
    }}>
      <fieldset disabled={busy || uploading}><legend>{t("Добавить отзыв")}</legend>
        <label>{t("Оценка")}<select value={rating} onChange={event => setRating(Number(event.target.value))}>{[5,4,3,2,1].map(value => <option key={value} value={value}>{'★'.repeat(value)} ({value}/5)</option>)}</select></label>
        <label>{t("Состояние товара")}<select value={condition} onChange={event => setCondition(event.target.value)}>{Object.entries(conditions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>{t("Ваш отзыв")}<textarea required maxLength={3000} value={text} onChange={event => setText(event.target.value)} placeholder={t("Расскажите о качестве и состоянии товара")} /></label>
        <p>{t("До 4 фото в формате JPG, PNG или WebP, до 2 МБ каждое.")}</p>
        <div className="jm-photo-controls"><label>{t("Добавить фото")}<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={upload} /></label><label>{t("Сфотографировать товар")}<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={upload} /></label></div>
        <div className="jm-review-photos">{photos.map((photo, index) => <div key={index}><img src={photo} alt={t("Фото {0}", [index + 1])} /><button type="button" aria-label={t("Удалить фото")} onClick={() => setPhotos(current => current.filter((_, i) => i !== index))}>×</button></div>)}</div>
        <button type="submit" disabled={!text.trim() || busy || uploading}>{uploading ? t("Загрузка фото…") : busy ? t("Отправка…") : t("Опубликовать отзыв")}</button>
      </fieldset>
    </form>}
    {formError && <p className="jm-feature-error" role="alert">{t(formError)}</p>}
    {notice && <p role="status">{notice}</p>}
    <div className="jm-review-list">{reviews.map((review, index) => <article className="jm-review-item" key={review.id || index}>
      <div className="jm-review-heading"><b>{review.author || review.name || t("Покупатель")}</b>{review.createdAt && <time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString()}</time>}</div>
      <p className="jm-review-stars" aria-label={`${review.rating} / 5`}>{'★'.repeat(Math.min(5, Math.max(0, Number(review.rating) || 0)))}</p>
      {review.condition && <p className={`jm-review-condition ${review.condition}`}>{conditions[review.condition]}</p>}
      <p className="jm-review-text">{review.text || review.comment}</p>
      <div className="jm-review-photos">{(review.photos || []).map(photo => <a href={mediaUrl(photo)} key={photo} target="_blank" rel="noreferrer"><img src={mediaUrl(photo)} alt={t("Фото товара из отзыва")} loading="lazy" /></a>)}</div>
      {(review.comments || []).map(comment => <div className="jm-review-comment" key={comment.id}><b>{comment.author}</b><p className="jm-review-text">{comment.text}</p></div>)}
      {user && connectedNow && review.id && <button type="button" onClick={() => setCommentFor(commentFor === review.id ? null : review.id)}>{commentFor === review.id ? t("Закрыть") : t("Комментировать")}</button>}
      {commentFor === review.id && connectedNow && <CommentForm busy={busy} onSend={(text, clientId) => send({ text, clientId }, review.id)} />}
    </article>)}</div>
  </section>;
}
