import { useEffect, useState } from 'react';
import AdminAccess from '../components/AdminAccess';
import { deleteBanner, getAdminBanners, mediaUrl, readPhoto, saveBanner } from '../../market/marketApi';
import '../../market/features.css';

const empty = { title: '', link: '', position: 0, active: true, imageData: '' };
function BannersManager() {
  const [banners, setBanners] = useState([]);
  const [draft, setDraft] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [fileKey, setFileKey] = useState(0);
  async function refresh() { setLoading(true); try { setBanners(await getAdminBanners()); setError(''); } catch (err) { setError(err.message); } finally { setLoading(false); } }
  useEffect(() => { let active = true; getAdminBanners().then(data => { if (active) setBanners(data); }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  function reset() { setEditing(null); setDraft(empty); setFileKey(k => k + 1); }
  async function submit(event) {
    event.preventDefault(); if (busy || uploading) return; setBusy(true); setError(''); setNotice('');
    try { await saveBanner(editing, draft); reset(); await refresh(); setNotice(draft.active ? 'Баннер сохранён. Он появится на главной странице.' : 'Баннер сохранён и скрыт с главной страницы.'); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function remove(banner) {
    if (!window.confirm(`Удалить баннер «${banner.title}»?`)) return;
    setBusy(true); setError('');
    try { await deleteBanner(banner.id); if (editing === banner.id) reset(); await refresh(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <section className="jm-banners">
    <h2>Рекламные баннеры</h2>
    <p>Добавленные баннеры показываются в существующей карусели на главной странице.</p>
    {error && <p role="alert" className="jm-feature-error">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    <form className="jm-feature-form" onSubmit={submit}>
      <fieldset disabled={busy || uploading}>
        <legend>{editing ? 'Редактировать баннер' : 'Добавить баннер'}</legend>
        <label>Название<input required maxLength={160} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></label>
        <label>Ссылка (необязательно)<input placeholder="/catalog или https://…" maxLength={2000} value={draft.link} onChange={e => setDraft({ ...draft, link: e.target.value })} /></label>
        <label>Порядок показа<input type="number" min="0" max="9999" required value={draft.position} onChange={e => setDraft({ ...draft, position: Number(e.target.value) })} /></label>
        <label>Изображение (JPG, PNG, WebP, до 5 МБ)<input key={fileKey} type="file" accept="image/jpeg,image/png,image/webp" required={!editing && !draft.imageData} onChange={async e => {
          const file = e.target.files[0]; if (!file) return; setUploading(true); setError('');
          try { const imageData = await readPhoto(file, 5); setDraft(current => ({ ...current, imageData })); } catch (err) { setError(err.message); e.target.value = ''; } finally { setUploading(false); }
        }} /></label>
        {(draft.imageData || draft.image) && <img className="jm-banner-preview" src={draft.imageData || mediaUrl(draft.image)} alt="Предпросмотр баннера" />}
        <label className="jm-feature-check"><input type="checkbox" checked={draft.active} onChange={e => setDraft({ ...draft, active: e.target.checked })} />Показывать на сайте</label>
        <div className="jm-feature-actions"><button type="submit">{busy ? 'Сохранение…' : 'Сохранить баннер'}</button>{editing && <button type="button" onClick={reset}>Отмена</button>}</div>
      </fieldset>
    </form>
    {loading ? <p>Загрузка…</p> : banners.length === 0 ? <p>Добавленных баннеров пока нет.</p> : <div className="jm-banner-list">{banners.map(banner => <article key={banner.id}>
      <img className="jm-banner-preview" src={mediaUrl(banner.image)} alt={banner.title} /><h3>{banner.title}</h3>
      <p>{banner.active ? 'Показывается' : 'Скрыт'} · Порядок: {banner.position}</p>
      <div className="jm-feature-actions"><button disabled={busy || uploading} onClick={() => { setEditing(banner.id); setDraft({ ...banner, imageData: '' }); setFileKey(k => k + 1); }}>Изменить</button><button disabled={busy || uploading} onClick={() => remove(banner)}>Удалить</button></div>
    </article>)}</div>}
    <button type="button" disabled={busy || loading} onClick={refresh}>Обновить список</button>
  </section>;
}
export default function BannersPage() { return <AdminAccess><BannersManager /></AdminAccess>; }
