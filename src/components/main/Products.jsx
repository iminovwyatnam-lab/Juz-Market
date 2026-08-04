import { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import './products.css';

const API_URL = 'http://localhost:4000/api/products';
const API_ORIGIN = 'http://localhost:4000';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { addToCart, toggleFavorite, isFavorite } = useCart();

    useEffect(() => {
        async function loadProducts() {
            try {
                const res = await fetch(API_URL);
                if (!res.ok) throw new Error('Не удалось загрузить товары');
                const data = await res.json();
                setProducts(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadProducts();
    }, []);

    if (loading) return <p className="products-status">Загрузка товаров...</p>;
    if (error) return <p className="products-status">Не удалось загрузить товары. Проверь, что API-сервер запущен (localhost:4000).</p>;
    if (products.length === 0) return <p className="products-status">Товаров пока нет.</p>;

    return (
        <div className="products-grid">
            {products.map((p) => {
                const favorite = isFavorite(p.id);
                return (
                    <div className="product-card" key={p.id}>
                        <div className="product-image-wrap">
                            {p.category && <span className="product-badge">{p.category}</span>}

                            <button
                                className={`product-fav${favorite ? ' is-active' : ''}`}
                                aria-label="В избранное"
                                onClick={() => toggleFavorite(p)}
                            >
                                <svg viewBox="0 0 24 24" width="14" height="14" fill={favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                                    <path d="M12 21s-7.5-4.6-10-9.1C.5 8.4 2 4.5 6 4c2.1-.3 3.8.8 6 3 2.2-2.2 3.9-3.3 6-3 4 .5 5.5 4.4 4 7.9-2.5 4.5-10 9.1-10 9.1z" />
                                </svg>
                            </button>

                            {p.image ? (
                                <img className="product-image" src={`${API_ORIGIN}${p.image}`} alt={p.name} />
                            ) : (
                                <div className="product-image-placeholder" />
                            )}
                        </div>

                        <div className="product-info">
                            <p className="product-name">
                                <span className="product-brand">{p.category}</span> &gt; {p.name}
                            </p>

                            <div className="product-price-row">
                                <span className="product-price">{p.price.toLocaleString('ru-RU')}</span>
                                <div className="product-rating">
                                    <svg viewBox="0 0 20 20" width="14" height="14" fill="#22C55E">
                                        <path d="M10 1.5l2.6 5.6 6 .6-4.5 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.5-4.1 6-.6z" />
                                    </svg>
                                    <span>4.7</span>
                                </div>
                            </div>

                            <div className="product-bottom">
                                <button className="product-add-btn" onClick={() => addToCart(p)}>
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M12 5v14M5 12h14" />
                                    </svg>
                                    купить сейчас
                                </button>
                                <button className="product-cart-btn" aria-label="Добавить в корзину" onClick={() => addToCart(p)}>
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
    );
}
