import { useCart } from '../../context/CartContext';
import { Link } from 'react-router-dom';
import './karzina.css';

const API_ORIGIN = 'http://localhost:4000';

export default function Karzina() {
    const { cartItems, removeFromCart, updateQty, toggleSelected, toggleFavorite, isFavorite } = useCart();

    const selectedItems = cartItems.filter((item) => item.selected);
    const totalQty = selectedItems.reduce((sum, item) => sum + item.qty, 0);
    const totalSum = selectedItems.reduce((sum, item) => sum + item.qty * item.price, 0);

    if (cartItems.length === 0) {
        return (
            <div className="countainer">
                <div className="karzina-empty">
                    <p>Корзина пока пуста</p>
                    <Link to="/" className="karzina-empty-link">Перейти к покупкам</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="countainer">
            <div className="karzina-layout">
                <div className="karzina-list">
                    {cartItems.map((item) => {
                        const favorite = isFavorite(item.id);
                        return (
                            <div className="karzina-card" key={item.id}>
                                <label className="karzina-select">
                                    <input
                                        type="checkbox"
                                        checked={!!item.selected}
                                        onChange={() => toggleSelected(item.id)}
                                    />
                                    выбрать
                                </label>

                                <hr className="karzina-hr" />

                                <div className="karzina-row">
                                    <div className="karzina-image-wrap">
                                        {item.image ? (
                                            <img src={`${API_ORIGIN}${item.image}`} alt={item.name} />
                                        ) : (
                                            <div className="karzina-image-placeholder" />
                                        )}
                                    </div>

                                    <div className="karzina-info">
                                        <p className="karzina-name">
                                            <span className="karzina-brand">{item.category}</span> &gt; {item.name}
                                        </p>
                                        <div className="karzina-rating">
                                            <svg viewBox="0 0 20 20" width="13" height="13" fill="#FFB800">
                                                <path d="M10 1.5l2.6 5.6 6 .6-4.5 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.5-4.1 6-.6z" />
                                            </svg>
                                            <span>5.0</span>
                                        </div>
                                        <p className="karzina-meta">категория: {item.category}</p>
                                    </div>

                                    <div className="karzina-qty">
                                        <button onClick={() => updateQty(item.id, item.qty - 1)}>-</button>
                                        <span>{item.qty}</span>
                                        <button onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                                    </div>

                                    <div className="karzina-price">
                                        {(item.price * item.qty).toLocaleString('ru-RU')}<span> сум</span>
                                    </div>
                                </div>

                                <div className="karzina-actions">
                                    <button className="karzina-delete" onClick={() => removeFromCart(item.id)} aria-label="Удалить">
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
                                        </svg>
                                    </button>
                                    <button
                                        className={`karzina-fav${favorite ? ' is-active' : ''}`}
                                        onClick={() => toggleFavorite(item)}
                                        aria-label="В избранное"
                                    >
                                        <svg viewBox="0 0 24 24" width="17" height="17" fill={favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                                            <path d="M12 21s-7.5-4.6-10-9.1C.5 8.4 2 4.5 6 4c2.1-.3 3.8.8 6 3 2.2-2.2 3.9-3.3 6-3 4 .5 5.5 4.4 4 7.9-2.5 4.5-10 9.1-10 9.1z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="karzina-summary">
                    <h2>Ваш заказ</h2>
                    <div className="karzina-summary-row">
                        <span>товар:</span>
                        <span>{totalQty}</span>
                    </div>
                    <div className="karzina-summary-row karzina-summary-total">
                        <span>общий:</span>
                        <span>{totalSum.toLocaleString('ru-RU')} сум</span>
                    </div>
                    <button className="karzina-checkout" disabled>
                        Оформить
                    </button>
                    <p className="karzina-note">Оплата подключится позже — сейчас можно только собрать заказ.</p>
                </div>
            </div>
        </div>
    );
}
