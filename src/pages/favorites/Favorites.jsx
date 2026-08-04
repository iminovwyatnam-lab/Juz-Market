import { useCart } from '../../context/CartContext';
import { Link } from 'react-router-dom';
import '../../components/main/products.css';

const API_ORIGIN = 'http://localhost:4000';

export default function Favorites() {
    const { favorites, toggleFavorite, addToCart } = useCart();

    if (favorites.length === 0) {
        return (
            <div className="countainer">
                <div className="karzina-empty" style={{ padding: '100px 0', textAlign: 'center', color: '#6B7280' }}>
                    <p style={{ marginBottom: 14, fontSize: 15 }}>В избранном пока пусто</p>
                    <Link to="/" style={{
                        display: 'inline-block', background: '#7C6BF5', color: 'white',
                        padding: '10px 22px', borderRadius: 10, textDecoration: 'none',
                        fontFamily: 'var(--Rubik)', fontSize: 13.5, fontWeight: 500
                    }}>
                        Перейти к покупкам
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="countainer">
            <h1 style={{ fontFamily: 'var(--Rubik)', fontSize: 22, margin: '30px 0 10px' }}>Избранное</h1>
            <div className="products-grid">
                {favorites.map((p) => (
                    <div className="product-card" key={p.id}>
                        <div className="product-image-wrap">
                            {p.category && <span className="product-badge">{p.category}</span>}
                            <button className="product-fav is-active" onClick={() => toggleFavorite(p)} aria-label="Убрать из избранного">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" stroke="currentColor" strokeWidth="2">
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
                            </div>
                            <div className="product-bottom">
                                <button className="product-add-btn" onClick={() => addToCart(p)}>
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M12 5v14M5 12h14" />
                                    </svg>
                                    купить сейчас
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
