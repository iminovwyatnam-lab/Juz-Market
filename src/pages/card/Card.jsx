import { translate as t, useLanguage } from '../../preferences/preferences';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import CheckoutDialog from '../../components/checkout/CheckoutDialog';
import { detectLocation, getSavedLocation, saveLocation } from '../../orders/ordersStore';
import './card.css';
import ProductReviews from '../../reviews/ProductReviews';
import { marketRequest } from '../../market/marketApi';
import { getCatalogProduct } from '../../products/catalogApi';

const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || 'http://localhost:4000').replace(/\/$/, '');
const formatPrice = (value) => Number(value).toLocaleString('ru-RU');

function imageUrl(image) {
    const path = typeof image === 'string' ? image : image?.url;
    if (!path) return null;
    if (/^(https?:|data:|blob:)/i.test(path)) return path;
    return `${API_ORIGIN}/${path.replace(/^\/+/, '')}`;
}

function getSpecifications(product) {
    const source = product.specifications || product.characteristics;
    const entries = Array.isArray(source)
        ? source.map((item) => [item.name || item.label, item.value])
        : source && typeof source === 'object' ? Object.entries(source) : [];
    if (entries.length) return entries.filter(([name, value]) => name && value != null);
    return [
        [t("Бренд"), product.brand], [t("Модель"), product.model], [t("Категория"), product.category],
        [t("Цвет"), product.color], [t("Подключение"), product.connection], [t("Тип сенсора"), product.sensor],
        ['DPI', product.dpi], [t("Особенности"), product.features],
    ].filter(([, value]) => value != null && value !== '');
}

function Stars({ rating = 0 }) {
    useLanguage();
    return <span className="pd-stars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => <span key={star} className={star <= Math.round(rating) ? 'pd-star-filled' : ''}>★</span>)}
    </span>;
}

function ProductImage({ src, alt }) {
    useLanguage();
    const [failed, setFailed] = useState(false);
    return src && !failed
        ? <img src={src} alt={alt} onError={() => setFailed(true)} />
        : <div className="pd-image-placeholder">{t("Фото пока нет")}</div>;
}

function ProductDetails({ product }) {
    useLanguage();
    const { addToCart } = useCart();
    const [activeImage, setActiveImage] = useState(0);
    const [added, setAdded] = useState(false);
    const [address, setAddress] = useState(() => {
        try { return localStorage.getItem('jm_delivery_address') || ''; }
        catch { return ''; }
    });
    const addressDialog = useRef(null);
    const [coords, setCoords] = useState(getSavedLocation);
    const [locMessage, setLocMessage] = useState('');
    const [locLoading, setLocLoading] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const specifications = getSpecifications(product);
    // Для товаров продавцов в полном списке показываем всё: категорию, характеристики, остаток и продавца
    const fullSpecifications = product.sellerId ? [
        [t("Категория"), product.category],
        ...specifications.filter(([name]) => name !== t("Категория")),
        [t("Количество в наличии"), product.stock != null ? t("{0} шт.", [product.stock]) : ''],
        [t("Продавец"), product.sellerName],
    ].filter(([, value]) => value != null && value !== '') : specifications;
    const images = [...new Set([product.image, ...(Array.isArray(product.images) ? product.images : [])].map(imageUrl).filter(Boolean))];
    const currentImage = Math.min(activeImage, Math.max(0, images.length - 1));
    const [savedReviews, setSavedReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [reviewsError, setReviewsError] = useState('');
    const [reviewsRevision, setReviewsRevision] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        marketRequest(`/reviews/${encodeURIComponent(product.id)}`, { signal: controller.signal }).then(data => {
            if (!controller.signal.aborted) { setSavedReviews(data); setReviewsError(''); }
        }).catch(err => { if (!controller.signal.aborted) setReviewsError(err.message); }).finally(() => { if (!controller.signal.aborted) setReviewsLoading(false); });
        return () => controller.abort();
    }, [product.id, reviewsRevision]);
    const reviews = [...savedReviews, ...(Array.isArray(product.reviews) ? product.reviews : []).filter(r => !savedReviews.some(s => s.id === r.id))];
    const ratedReviews = reviews.filter(review => Number(review.rating) >= 1 && Number(review.rating) <= 5);
    const reviewCount = reviews.length;
    const rating = ratedReviews.length ? ratedReviews.reduce((sum, review) => sum + Number(review.rating), 0) / ratedReviews.length : 0;
    const price = Number(product.price) || 0;
    const oldPrice = Number(product.oldPrice ?? product.old_price);
    const hasDiscount = oldPrice > price;
    const outOfStock = product.stock != null && Number(product.stock) <= 0;

    function saveAddress(event) {
        event.preventDefault();
        const nextAddress = new FormData(event.currentTarget).get('address').trim();
        if (!nextAddress && !coords) {
            setLocMessage(t("Введите адрес или определите локацию"));
            return;
        }
        setAddress(nextAddress);
        try { localStorage.setItem('jm_delivery_address', nextAddress); }
        catch { /* Keep the address for this visit if storage is unavailable. */ }
        saveLocation(coords);
        addressDialog.current.close();
    }

    async function handleDetectLocation() {
        setLocLoading(true);
        setLocMessage('');
        try { setCoords(await detectLocation()); }
        catch (err) { setLocMessage(err.message); }
        finally { setLocLoading(false); }
    }

    return <main className="pd-page">
        <div className="pd-layout">
            <div className="pd-left">
            <section className="pd-gallery" aria-label={t("Фотографии товара")}>
                <div className="pd-main-image">
                    <ProductImage key={images[currentImage] || 'empty'} src={images[currentImage]} alt={product.name} />
                    {images.length > 1 && <>
                        <button type="button" className="pd-gallery-arrow pd-gallery-prev" onClick={() => setActiveImage((currentImage - 1 + images.length) % images.length)} aria-label={t("Предыдущее фото")}>‹</button>
                        <button type="button" className="pd-gallery-arrow pd-gallery-next" onClick={() => setActiveImage((currentImage + 1) % images.length)} aria-label={t("Следующее фото")}>›</button>
                    </>}
                </div>
                {images.length > 0 && <div className="pd-thumbnails">
                    {images.map((src, index) => <button type="button" className={`pd-thumbnail${currentImage === index ? ' is-active' : ''}`} key={src}
                        onClick={() => setActiveImage(index)} aria-label={t("Фото {0}", [index + 1])} aria-pressed={currentImage === index}>
                        <ProductImage src={src} alt={t("{0}, фото {1}", [product.name, index + 1])} />
                    </button>)}
                </div>}
            </section>


            </div>
            <div className="pd-center">
            <section className="pd-summary" aria-labelledby="pd-title">
                <h1 id="pd-title">
                    {(product.brand || product.category) && <><span className="pd-brand">{product.brand || product.category}</span> &gt; </>}
                    {product.name}
                </h1>
                <a className="pd-rating-link" href="#pd-reviews">
                    <Stars rating={rating} /><strong>{rating ? rating.toFixed(1) : '—'}</strong>
                    <span>{reviewCount ? t("({0} отзывов)", [reviewCount]) : t("(пока нет отзывов)")}</span>
                </a>
                {product.shortDescription && <p className="pd-short-description">{product.shortDescription}</p>}
                {product.sellerName && <p className="pd-stock">{t("Продавец:")} {product.sellerName}{product.sellerPhone && <> · {product.sellerPhone}</>}</p>}
                {product.soldCount != null && <p className="pd-sold">{t("Количество проданных товаров:")} {product.soldCount}</p>}
                {product.stock != null && <p className="pd-stock">{outOfStock ? t("Нет в наличии") : t("В наличии: {0} шт.", [product.stock])}</p>}
                <div className="pd-summary-specs">
                    <dl>{specifications.slice(0, 6).map(([name, value]) => <div key={name}><dt>{name}:</dt><dd>{String(value)}</dd></div>)}</dl>
                    <a className="pd-specs-link" href="#pd-specifications">{t("все характеристики")}</a>
                </div>
            </section>

            <section className="pd-description" aria-label={t("Описание и характеристики")}>
                <div className="pd-description-text">{product.description || t("Описание этого товара пока не добавлено.")}</div>
                <div className="pd-full-specs" id="pd-specifications">
                    <h2>{t("Характеристики")}</h2>
                    {fullSpecifications.length > 0 ? <dl>{fullSpecifications.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{String(value)}</dd></div>)}</dl>
                        : <p>{t("Характеристики пока не добавлены.")}</p>}
                </div>
            </section>
            </div>
            <aside className="pd-purchase" aria-label={t("Цена и покупка")}>
                <div className="pd-price-row">
                    <p className="pd-price">{formatPrice(price)}<span> {t("сум")}</span></p>
                    {hasDiscount && <div className="pd-old-price">
                        <span className="pd-discount">−{Math.round((1 - price / oldPrice) * 100)}%</span><del>{formatPrice(oldPrice)}</del>
                    </div>}
                </div>
                <div className="pd-purchase-actions">
                    <button type="button" className="pd-buy" onClick={() => setCheckoutOpen(true)}>{t("купить сейчас")}</button>
                    <button type="button" className="pd-add" onClick={() => { addToCart(product); setAdded(true); }}>
                        {added ? t("ещё в корзину") : t("в корзину")}
                    </button>
                </div>
                {added && <p className="pd-added" role="status">{t("Товар добавлен в корзину")}</p>}
                <div className="pd-delivery"><p>{t("Доставка по вашему адресу")}</p><p>{t("Ориентировочный срок прибытия: 2–3 дня")}</p></div>
                <button type="button" className="pd-location" onClick={() => addressDialog.current.showModal()}>
                    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" />
                    </svg><span>{address || (coords ? t("Локация определена") : t("укажите локацию"))}</span>
                </button>
            </aside>


        </div>

        <ProductReviews productId={product.id} reviews={reviews} loading={reviewsLoading} error={reviewsError}
            onChange={setSavedReviews} onRetry={() => { setReviewsLoading(true); setReviewsRevision(value => value + 1); }} />

        <dialog className="pd-address-dialog" ref={addressDialog} onClick={(event) => {
            if (event.target === event.currentTarget) event.currentTarget.close();
        }} aria-labelledby="pd-address-title">
            <form onSubmit={saveAddress}>
                <h2 id="pd-address-title">{t("Адрес доставки")}</h2>
                <label htmlFor="pd-address">{t("Город, улица, дом")}</label>
                <input id="pd-address" name="address" defaultValue={address} maxLength={250} placeholder={t("Например: Ташкент, улица…")} />
                <button type="button" className="pd-detect" onClick={handleDetectLocation} disabled={locLoading}>
                    📍 {locLoading ? t("Определяем...") : t("Определить мою локацию")}
                </button>
                {(coords || locMessage) && <p className="pd-loc-note">{locMessage || t("Локация определена: {0}, {1}", [coords.lat.toFixed(4), coords.lng.toFixed(4)])}</p>}
                <div className="pd-address-actions"><button type="button" onClick={() => addressDialog.current.close()}>{t("Отмена")}</button><button type="submit" className="pd-buy">{t("Сохранить")}</button></div>
            </form>
        </dialog>

        {checkoutOpen && <CheckoutDialog
            items={[{ id: product.id, name: product.name, price, qty: 1, sellerId: product.sellerId, sellerName: product.sellerName, sellerPhone: product.sellerPhone }]}
            onClose={() => setCheckoutOpen(false)}
        />}
    </main>;
}

function ProductLoader({ id, initialProduct }) {
    useLanguage();
    const [product, setProduct] = useState(initialProduct);
    const [loading, setLoading] = useState(Boolean(id) && !initialProduct);
    const [error, setError] = useState('');
    const [retry, setRetry] = useState(0);
    useEffect(() => { window.scrollTo(0, 0); }, [id]);
    useEffect(() => {
        if (!id) return;
        const controller = new AbortController();
        async function loadProduct() {
            try {
                const found = await getCatalogProduct(id, controller.signal);
                if (!controller.signal.aborted) {
                    setProduct(found || null);
                    setError(found ? '' : t("Товар не найден. Возможно, он был удалён из каталога."));
                }
            } catch (err) {
                if (!controller.signal.aborted) setError(err.message || t("Не удалось загрузить товар."));
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }
        loadProduct();
        return () => controller.abort();
    }, [id, retry]);
    if (product) return <ProductDetails product={product} />;
    return <main className="pd-page pd-status" aria-live="polite">
        <p>{loading ? t("Загрузка товара…") : error || t("Выберите товар в каталоге.")}</p>
        {!loading && <div>
            {error && <button type="button" className="pd-buy" onClick={() => { setLoading(true); setError(''); setRetry((value) => value + 1); }}>{t("Повторить")}</button>}
            <Link to="/catalog">{t("Перейти в каталог")}</Link>
        </div>}
    </main>;
}

export default function Card() {
    useLanguage();
    const { id } = useParams();
    const { state } = useLocation();
    const initialProduct = state?.product && String(state.product.id) === id ? state.product : null;
    return <ProductLoader key={id || 'no-product'} id={id} initialProduct={initialProduct} />;
}
