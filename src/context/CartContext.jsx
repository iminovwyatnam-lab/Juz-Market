import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);

function readStorage(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState(() => readStorage('jm_cart'));
    const [favorites, setFavorites] = useState(() => readStorage('jm_favorites'));

    useEffect(() => {
        localStorage.setItem('jm_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    useEffect(() => {
        localStorage.setItem('jm_favorites', JSON.stringify(favorites));
    }, [favorites]);

    function addToCart(product) {
        setCartItems((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id ? { ...item, qty: item.qty + 1 } : item
                );
            }
            return [...prev, { ...product, qty: 1, selected: true }];
        });
    }

    function removeFromCart(id) {
        setCartItems((prev) => prev.filter((item) => item.id !== id));
    }

    function updateQty(id, qty) {
        if (qty < 1) return;
        setCartItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, qty } : item))
        );
    }

    function toggleSelected(id) {
        setCartItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
        );
    }

    function toggleFavorite(product) {
        setFavorites((prev) => {
            const exists = prev.find((item) => item.id === product.id);
            if (exists) return prev.filter((item) => item.id !== product.id);
            return [...prev, product];
        });
    }

    function isFavorite(id) {
        return favorites.some((item) => item.id === id);
    }

    const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
    const favoritesCount = favorites.length;

    return (
        <CartContext.Provider
            value={{
                cartItems,
                favorites,
                addToCart,
                removeFromCart,
                updateQty,
                toggleSelected,
                toggleFavorite,
                isFavorite,
                cartCount,
                favoritesCount,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}
