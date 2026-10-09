import { translate as t, useLanguage } from '../../preferences/preferences';
import { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import './products.css';
import { Link } from 'react-router-dom';

import { getCatalogProducts, productImageUrl } from '../../products/catalogApi';
import { searchProducts } from '../../products/searchProducts';
import { getRatings } from '../../market/marketApi';

export default function Products({ category = null, query = '' }) {
    useLanguage();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ratings, setRatings] = useState({});
    const { addToCart, toggleFavorite, isFavorite } = useCart();

    useEffect(() => {
        let cancelled = false;

        async function loadProducts() {
            setLoading(true);
            setError(null);
            try {
                const data = await getCatalogProducts();
                if (cancelled) return;

                setProducts(data);
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        loadProducts();

        // если пользователь быстро кликнул другую категорию — старый ответ игнорируем
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        getRatings(controller.signal).then(data => { if (!controller.signal.aborted) setRatings(data); }).catch(() => {});
        return () => controller.abort();
    }, []);

    const wanted = category?.trim().toLowerCase();
    const visible = searchProducts(wanted ? products.filter(p => (p.category || '').trim().toLowerCase() === wanted) : products, query);

    if (loading) return <p className="products-status">{t("Загрузка товаров...")}</p>;
    if (error) return <p className="products-status">{t("Не удалось загрузить товары. Проверь, что API-сервер запущен (localhost:4000).")}</p>;
    if (visible.length === 0) return <p className="products-status" role="status">{query ? t("По запросу «{0}»{1} ничего не найдено. Попробуйте другое название или категорию.", [query, category ? t(" в категории «{0}»", [t(category)]) : '']) : category ? t("В категории «{0}» пока нет товаров.", [category]) : t("Товаров пока нет.")}</p>;

    return (
        <>
        {query && <p className="catalog-search-count" role="status">{t("Найдено товаров:")} {visible.length}</p>}
        <div className="products-grid">
            {visible.map((p) => {
                const favorite = isFavorite(p.id);
                return (
                    <div className="product-card" key={p.id}>
                        <div className="product-image-wrap">
                            {p.category && <span className="product-badge">{t(p.category)}</span>}

                            <button
                                className={`product-fav${favorite ? ' is-active' : ''}`}
                                aria-label={t("В избранное")}
                                onClick={() => toggleFavorite(p)}
                            >
                                <svg viewBox="0 0 24 24" width="14" height="14" fill={favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                                    <path d="M12 21s-7.5-4.6-10-9.1C.5 8.4 2 4.5 6 4c2.1-.3 3.8.8 6 3 2.2-2.2 3.9-3.3 6-3 4 .5 5.5 4.4 4 7.9-2.5 4.5-10 9.1-10 9.1z" />
                                </svg>
                            </button>

                            {p.image ? (
                                <img className="product-image" src={productImageUrl(p.image)} alt={p.name} />
                            ) : (
                                <div className="product-image-placeholder" />
                            )}
                        </div>

                        <div className="product-info">
                            <p className="product-name">
                                <Link className="product-details-link" to={`/product/${encodeURIComponent(p.id)}`} state={{ product: p }}>
                                    <span className="product-brand">{t(p.category)}</span> &gt; {p.name}
                                </Link>
                            </p>

                            <div className="product-price-row">
                                <span className="product-price">{p.price.toLocaleString('ru-RU')}</span>
                                <div className="product-rating">
                                    <svg viewBox="0 0 20 20" width="14" height="14" fill="#22C55E">
                                        <path d="M10 1.5l2.6 5.6 6 .6-4.5 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.5-4.1 6-.6z" />
                                    </svg>
                                    <span>{Number(ratings[String(p.id)]?.average || 0).toFixed(1)}</span>
                                </div>
                            </div>

                            <div className="product-bottom">
                                <Link className='link' to="/karzina">
                                    <button className="product-add-btn" onClick={() => addToCart(p)}>
                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M12 5v14M5 12h14" />
                                        </svg>{t("купить сейчас")}</button>
                                </Link>
                                <button className="product-cart-btn" aria-label={t("Добавить в корзину")} onClick={() => addToCart(p)}>
                                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M6 2l1.5 4M18 2l-1.5 4M3 7h18l-1.5 9.5a2 2 0 0 1-2 1.5H6.5a2 2 0 0 1-2-1.5L3 7z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
        </>
    );
}
