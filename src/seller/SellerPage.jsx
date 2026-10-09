import { translate as t, useLanguage } from '../preferences/preferences';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../components/catalog/categories';
import { clearSellerSession, deleteSellerProduct, getSeller, getSellerProducts, hasSellerSession, saveSellerProduct, sellerSignIn, sellerSignOut } from './sellerApi';
import './seller.css';

const money = value => Number(value).toLocaleString('ru-RU');

// Уменьшаем фото паспорта перед отправкой (до 1600 px, JPEG), чтобы заявка быстро отправлялась
function compressPhoto(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error(t("Не удалось прочитать фото паспорта."))); };
    image.src = url;
  });
}

function PassportPhoto({ name, label, onChange, preview }) {
    useLanguage();
  return <label className="seller-passport-photo">{label}
    <span className="seller-passport-drop">{preview ? <img src={preview} alt={label} /> : <span>{t("Выбрать фото")}</span>}</span>
    <input name={name} type="file" accept="image/png,image/jpeg,image/webp" required onChange={onChange} />
  </label>;
}

function SellerAuth({ onSignedIn }) {
    useLanguage();
  const [mode, setMode] = useState('register');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [needBirth, setNeedBirth] = useState(false);
  const [sent, setSent] = useState(false);
  const [photos, setPhotos] = useState({ passportFront: '', passportBack: '' });
  const previews = useRef({});
  function choosePhoto(event) {
    const { name, files } = event.target;
    if (previews.current[name]) URL.revokeObjectURL(previews.current[name]);
    previews.current[name] = files[0] ? URL.createObjectURL(files[0]) : '';
    setPhotos(current => ({ ...current, [name]: previews.current[name] }));
  }
  useEffect(() => () => Object.values(previews.current).forEach(url => url && URL.revokeObjectURL(url)), []);
  const today = new Date().toISOString().slice(0, 10);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (mode === 'register' && values.password !== values.confirmPassword) { setError(t("Пароли не совпадают.")); return; }
    setBusy(true);
    setError('');
    try {
      if (mode === 'register') {
        for (const key of ['passportFront', 'passportBack']) {
          const file = values[key];
          if (!file?.size || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error(t("Загрузите фото паспорта с двух сторон (JPG, PNG или WebP)."));
          values[key] = await compressPhoto(file);
        }
        await sellerSignIn(mode, values);
        setSent(true);
      } else onSignedIn(await sellerSignIn(mode, values));
    }
    catch (err) {
      if (mode === 'login' && err.message === t("Укажите дату рождения.")) setNeedBirth(true);
      setError(err.message);
    }
    finally { setBusy(false); }
  }
  return <div className="seller-welcome">
    <section className="seller-intro">
      <span className="seller-eyebrow">{t("JUZ MARKET · ПРОДАВЦАМ")}</span>
      <h1>{t("Ваш магазин")}<br />{t("на Juz Market")}</h1>
      <p>{t("Продавайте товары своего бизнеса в нашем интернет-магазине.")}</p>
      <ol className="seller-steps">
        <li><b>01</b><span><strong>{t("Создайте магазин")}</strong>{t("Укажите название и контактный телефон.")}</span></li>
        <li><b>02</b><span><strong>{t("Добавьте товары")}</strong>{t("Загрузите фото, описание, цену и остаток.")}</span></li>
        <li><b>03</b><span><strong>{t("Появитесь в каталоге")}</strong>{t("Покупатели смогут оформить заказ на сайте.")}</span></li>
      </ol>
    </section>
    <section className="seller-panel seller-auth">
      <div className="seller-tabs" aria-label={t("Вход или регистрация")}>
        <button type="button" aria-pressed={mode === 'register'} disabled={busy} onClick={() => { setMode('register'); setError(''); }}>{t("Открыть магазин")}</button>
        <button type="button" aria-pressed={mode === 'login'} disabled={busy} onClick={() => { setMode('login'); setError(''); }}>{t("Войти")}</button>
      </div>
      <h2>{mode === 'register' ? t("Заявка на открытие магазина") : t("Вход для продавца")}</h2>
      <p className="seller-muted">{mode === 'register' ? t("Заполните данные и отправьте заявку. Кабинет откроется после одобрения администратором.") : t("Используйте почту, пароль и паспорт, указанный при регистрации.")}</p>
      {sent && mode === 'register' ? <div className="seller-sent" role="status"><h3>{t("Заявка отправлена")}</h3><p>{t("Мы проверим ваши данные и паспорт. После одобрения вы сможете войти в кабинет, используя почту, пароль и паспорт.")}</p><button type="button" className="seller-secondary" onClick={() => { setSent(false); setMode('login'); }}>{t("Перейти ко входу")}</button></div> : <form onSubmit={submit} key={mode}>
        <fieldset disabled={busy}>
          {mode === 'register' && <>
            <div className="seller-form-row seller-name-row">
              <label>{t("Фамилия")}<input name="lastName" required minLength={2} maxLength={60} autoComplete="family-name" /></label>
              <label>{t("Имя")}<input name="firstName" required minLength={2} maxLength={60} autoComplete="given-name" /></label>
            </div>
            <label>{t("Отчество")}<input name="middleName" required minLength={2} maxLength={60} autoComplete="additional-name" /></label>
            <label>{t("Название магазина")}<input name="storeName" required minLength={2} maxLength={80} placeholder={t("Например, Iminov Shop")} autoComplete="organization" /></label>
            <label>{t("Телефон магазина")}<input name="phone" type="tel" required minLength={7} maxLength={30} placeholder="+998 90 123 45 67" autoComplete="tel" /></label>
          </>}
          <label>{t("Почта")}<input name="email" type="email" required maxLength={254} placeholder="shop@example.com" autoComplete="username" /></label>
          <label>{t("Пароль")}<input name="password" type="password" required minLength={8} maxLength={128} placeholder={t("Не менее 8 символов")} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} /></label>
          <label>{t("Паспорт (серия и номер)")}<input name="passport" required maxLength={12} pattern="[A-Za-z]{2}[\s\-]?\d{7}" title={t("Две буквы и 7 цифр, например AA1234567")} placeholder="AA1234567" autoComplete="off" style={{ textTransform: 'uppercase' }} /></label>
          {(mode === 'register' || needBirth) && <label>{t("Дата рождения")}<input name="birthDate" type="date" required max={today} min="1900-01-01" autoComplete="bday" /><span className="seller-hint">{mode === 'register' ? t("Продавцом можно стать с 16 лет.") : t("Нужна один раз для проверки возраста (аккаунт создан раньше).")}</span></label>}
          {mode === 'register' && <div className="seller-passport-photos">
            <PassportPhoto name="passportFront" label={t("Паспорт: лицевая сторона")} preview={photos.passportFront} onChange={choosePhoto} />
            <PassportPhoto name="passportBack" label={t("Паспорт: обратная сторона")} preview={photos.passportBack} onChange={choosePhoto} />
          </div>}
          {mode === 'register' && <label>{t("Повторите пароль")}<input name="confirmPassword" type="password" required minLength={8} maxLength={128} autoComplete="new-password" /></label>}
          {error && <p role="alert" className="seller-error">{error}</p>}
          <button className="seller-primary" type="submit">{busy ? t("Подождите…") : mode === 'register' ? t("Отправить заявку") : t("Войти в кабинет")}</button>
          {mode === 'register' && <p className="seller-hint">{t("Название магазина и телефон будут доступны покупателям вместе с вашими товарами. Паспорт (данные и фото) и дата рождения нужны для проверки личности и возраста и не показываются покупателям.")}</p>}
        </fieldset>
      </form>}
    </section>
  </div>;
}

function ProductEditor({ product, onClose, onSaved, onSessionExpired }) {
    useLanguage();
  const dialog = useRef(null);
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(product?.image || '');
  const previewObject = useRef(null);
  const [specs, setSpecs] = useState(() => product?.specifications?.length ? product.specifications.map(item => ({ ...item })) : [{ name: '', value: '' }]);
  const changeSpec = (index, key, value) => setSpecs(current => current.map((item, i) => i === index ? { ...item, [key]: value } : item));
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => { element.close(); if (previewObject.current) URL.revokeObjectURL(previewObject.current); };
  }, []);
  function changePhoto(event) {
    if (previewObject.current) URL.revokeObjectURL(previewObject.current);
    const file = event.target.files[0];
    previewObject.current = file ? URL.createObjectURL(file) : null;
    setPreview(previewObject.current || product?.image || '');
  }
  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const values = new FormData(event.currentTarget);
    const file = values.get('photo');
    setError('');
    if (file?.size && (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024)) {
      setError(t("Выберите фото JPG, PNG или WebP размером до 2 МБ.")); return;
    }
    const filledSpecs = specs.map(item => ({ name: item.name.trim(), value: item.value.trim() })).filter(item => item.name || item.value);
    if (filledSpecs.some(item => !item.name || !item.value)) { setError(t("В характеристиках заполните и название, и значение (или удалите пустую строку).")); return; }
    submitting.current = true;
    setBusy(true);
    try {
      const imageData = file?.size ? await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error(t("Не удалось прочитать фото.")));
        reader.readAsDataURL(file);
      }) : undefined;
      const saved = await saveSellerProduct(product?.id, {
        name: values.get('name').trim(), category: values.get('category'),
        shortDescription: values.get('shortDescription').trim(), description: values.get('description').trim(), specifications: filledSpecs,
        price: Number(values.get('price')), stock: Number(values.get('stock')), imageData,
      });
      onSaved(saved);
    } catch (err) {
      if (err.status === 401) onSessionExpired();
      else setError(err.message);
    } finally { submitting.current = false; setBusy(false); }
  }
  const categories = [...new Set([...CATEGORIES, ...(product?.category ? [product.category] : [])])];
  return <dialog ref={dialog} className="seller-dialog" aria-labelledby="seller-editor-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="seller-editor-top"><h2 id="seller-editor-title">{product ? t("Изменить товар") : t("Новый товар")}</h2><button className="seller-close" type="button" aria-label={t("Закрыть")} disabled={busy} onClick={onClose}>×</button></div>
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        <label>{t("Фото товара")}{preview && <img className="seller-preview" src={preview} alt={t("Фото товара")} />}<input name="photo" type="file" accept="image/png,image/jpeg,image/webp" required={!product} onChange={changePhoto} /><span className="seller-hint">{t("JPG, PNG или WebP, до 2 МБ.")}</span></label>
        <label>{t("Название")}<input name="name" required minLength={2} maxLength={160} defaultValue={product?.name || ''} placeholder={t("Название товара")} /></label>
        <label>{t("Категория")}<select name="category" required defaultValue={product?.category || ''}><option value="" disabled>{t("Выберите категорию")}</option>{categories.map(category => <option key={category}>{t(category)}</option>)}</select></label>
        <label>{t("Краткое описание")}<textarea name="shortDescription" required minLength={5} maxLength={300} rows={2} defaultValue={product?.shortDescription || ''} placeholder={t("Одна-две фразы: что это за товар")} /></label>
        <label>{t("Полное описание")}<textarea name="description" required minLength={5} maxLength={5000} rows={5} defaultValue={product?.description || ''} placeholder={t("Подробно расскажите о товаре: назначение, комплектация, особенности")} /></label>
        <div className="seller-specs">
          <div className="seller-specs-head"><span>{t("Характеристики")}</span><span className="seller-hint">{t("Например: Бренд — AJAZZ, Цвет — Чёрный")}</span></div>
          {specs.map((item, index) => <div className="seller-spec-row" key={index}>
            <input value={item.name} maxLength={80} placeholder={t("Название")} aria-label={t("Название характеристики {0}", [index + 1])} onChange={event => changeSpec(index, 'name', event.target.value)} />
            <input value={item.value} maxLength={300} placeholder={t("Значение")} aria-label={t("Значение характеристики {0}", [index + 1])} onChange={event => changeSpec(index, 'value', event.target.value)} />
            <button type="button" className="seller-spec-remove" aria-label={t("Удалить характеристику")} disabled={specs.length === 1 && !item.name && !item.value} onClick={() => setSpecs(current => current.length > 1 ? current.filter((_, i) => i !== index) : [{ name: '', value: '' }])}>×</button>
          </div>)}
          {specs.length < 40 && <button type="button" className="seller-secondary seller-spec-add" onClick={() => setSpecs(current => [...current, { name: '', value: '' }])}>{t("+ Добавить характеристику")}</button>}
        </div>
        <div className="seller-form-row">
          <label>{t("Цена (сум)")}<input name="price" type="number" required min="0.01" max="1000000000000" step="0.01" defaultValue={product?.price ?? ''} /></label>
          <label>{t("Количество товара (шт.)")}<input name="stock" type="number" required min="0" max="10000000" step="1" defaultValue={product?.stock ?? 1} /></label>
        </div>
        {error && <p className="seller-error" role="alert">{error}</p>}
        <div className="seller-actions"><button type="button" className="seller-secondary" onClick={onClose}>{t("Отмена")}</button><button type="submit" className="seller-primary">{busy ? t("Сохранение…") : product ? t("Сохранить изменения") : t("Опубликовать товар")}</button></div>
      </fieldset>
    </form>
  </dialog>;
}

function SellerDashboard({ seller, onSignedOut }) {
    useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editor, setEditor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  function sessionExpired() { clearSellerSession(); onSignedOut(); }
  useEffect(() => {
    let active = true;
    getSellerProducts().then(data => { if (active) { setProducts(data); setError(''); } }).catch(err => {
      if (active) {
        if (err.status === 401) { clearSellerSession(); onSignedOut(); }
        else setError(err.message);
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry, onSignedOut]);
  async function remove(product) {
    if (busy || !window.confirm(t("Удалить «{0}» из каталога?", [product.name]))) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await deleteSellerProduct(product.id);
      setProducts(current => current.filter(item => item.id !== product.id));
      setMessage(t("Товар удалён из каталога."));
    } catch (err) { if (err.status === 401) sessionExpired(); else setError(err.message); }
    finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true);
    try { await sellerSignOut(); onSignedOut(); }
    catch (err) { if (err.status === 401) sessionExpired(); else setError(err.message); }
    finally { setBusy(false); }
  }
  return <>
    <div className="seller-heading"><div><span className="seller-eyebrow">{t("КАБИНЕТ ПРОДАВЦА")}</span><h1>{seller.storeName}</h1><p className="seller-muted">{seller.email} · {seller.phone}</p></div><button className="seller-secondary" disabled={busy} onClick={logout}>{t("Выйти")}</button></div>
    <div className="seller-stats"><div><span>{t("Мои товары")}</span><strong>{loading ? '—' : products.length}</strong></div><div><span>{t("В наличии")}</span><strong>{loading ? '—' : products.filter(product => product.stock > 0).length}</strong></div><div><span>{t("Нет в наличии")}</span><strong>{loading ? '—' : products.filter(product => product.stock === 0).length}</strong></div></div>
    <section className="seller-panel seller-products">
      <div className="seller-section-top"><div><h2>{t("Товары магазина")}</h2><p className="seller-muted">{t("После публикации товар появится в общем каталоге.")}</p></div><button className="seller-primary" disabled={busy || loading} onClick={() => { setEditor({ product: null }); setMessage(''); }}>{t("+ Добавить товар")}</button></div>
      {error && <div className="seller-error" role="alert">{error} <button type="button" className="seller-text-button" onClick={() => { setLoading(true); setRetry(value => value + 1); }}>{t("Повторить")}</button></div>}
      {message && <p className="seller-success" role="status">{message}</p>}
      {loading ? <p className="seller-empty">{t("Загрузка товаров…")}</p> : !products.length ? <div className="seller-empty"><h3>{t("Добавьте первый товар")}</h3><p>{t("Фото, описание и цена помогут покупателям сделать выбор.")}</p></div> : <div className="seller-product-list">{products.map(product => <article className="seller-product" key={product.id}>
        <img src={product.image} alt={product.name} />
        <div className="seller-product-info"><span className="seller-muted">{product.category}</span><Link to={`/product/${encodeURIComponent(product.id)}`}>{product.name}</Link><span className={product.stock > 0 ? 'seller-stock' : 'seller-muted'}>{product.stock > 0 ? t("В наличии: {0} шт.", [product.stock]) : t("Нет в наличии")}</span></div>
        <strong className="seller-price">{money(product.price)} {t("сум")}</strong>
        <div className="seller-product-actions"><button className="seller-secondary" disabled={busy} onClick={() => setEditor({ product })}>{t("Изменить")}</button><button className="seller-delete" disabled={busy} onClick={() => remove(product)}>{t("Удалить")}</button></div>
      </article>)}</div>}
    </section>
    {editor && <ProductEditor product={editor.product} onClose={() => setEditor(null)} onSessionExpired={sessionExpired} onSaved={product => {
      setProducts(current => current.some(item => item.id === product.id) ? current.map(item => item.id === product.id ? product : item) : [...current, product]);
      setEditor(null); setError(''); setMessage(t("Товар сохранён и доступен в каталоге."));
    }} />}
  </>;
}

export default function SellerPage() {
    useLanguage();
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(hasSellerSession);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const signedOut = useCallback(() => setSeller(null), []);
  useEffect(() => {
    let active = true;
    if (!hasSellerSession()) return;
    getSeller().then(value => { if (active) { setSeller(value); setError(''); } }).catch(err => {
      if (active) { if (err.status === 401) clearSellerSession(); else setError(err.message); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);
  return <div className="seller-page"><div className="seller-container">
    <nav className="seller-top" aria-label={t("Кабинет продавца")}><Link className="seller-brand" to="/">Juz <span>Market</span></Link><Link className="seller-back" to="/">{t("← В магазин")}</Link></nav>
    <main>{loading ? <p className="seller-empty">{t("Открываем кабинет…")}</p> : error ? <div className="seller-panel seller-empty"><p role="alert">{error}</p><button className="seller-secondary" onClick={() => { setLoading(true); setRetry(value => value + 1); }}>{t("Повторить")}</button></div> : seller ? <SellerDashboard key={seller.id} seller={seller} onSignedOut={signedOut} /> : <SellerAuth onSignedIn={setSeller} />}</main>
  </div></div>;
}
