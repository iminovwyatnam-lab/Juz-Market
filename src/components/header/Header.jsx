import { translate as t, useLanguage } from '../../preferences/preferences';
import "./header.css"
import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useCart } from "../../context/CartContext"
import { useAuth } from "../../auth/authApi"
import juz_logo from "../../assets/Juz-Market-Photo/juz-market-logo-for-header.png"
import category from "../../assets/Juz-Market-Photo/Category.png"
import favorite from "../../assets/Juz-Market-Photo/favorite.png"
import search from "../../assets/Juz-Market-Photo/search.png"

export default function Header() {
    useLanguage();
    const { cartCount, favoritesCount } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const query = new URLSearchParams(location.search).get('q') || '';
    const [searchOpen, setSearchOpen] = useState(false);
    const [draft, setDraft] = useState({ query, value: query });
    if (draft.query !== query) setDraft({ query, value: query });
    const value = draft.query === query ? draft.value : query;
    const inputRef = useRef(null);
    useEffect(() => {
        const open = () => { setSearchOpen(true); inputRef.current?.focus(); };
        window.addEventListener('jm-open-search', open);
        return () => window.removeEventListener('jm-open-search', open);
    }, []);
    function openSearch() {
        setSearchOpen(true);
        if (location.pathname !== '/catalog') navigate('/catalog', { state: { focusSearch: true } });
        requestAnimationFrame(() => inputRef.current?.focus());
    }
    useEffect(() => {
        if (location.state?.focusSearch) { requestAnimationFrame(() => inputRef.current?.focus()); }
    }, [location.state]);
    return (
        <div>
            <div className="countainer">
                <header className="jm-site-header">

                    <Link to="/">
                        <img className="juz-market" src={juz_logo} alt="" />
                    </Link>

                    <div className="header-flex">

                        <form className={`search${searchOpen || query ? ' is-open' : ''}`} role="search" onSubmit={event => {
                            event.preventDefault();
                            if (!searchOpen && !value) { openSearch(); return; }
                            const next = new URLSearchParams();
                            if (value.trim()) next.set('q', value.trim());
                            navigate(`/catalog${next.size ? `?${next}` : ''}`, { state: { focusSearch: true } });
                            setSearchOpen(true);
                        }}>
                            <button type="submit" className="header-search-trigger" aria-label={t("Поиск товаров")}><img src={search} alt="" /></button>
                            <input ref={inputRef} id="header-search" className="inp" type="search" name="q" maxLength={160} aria-label={t("Поиск товаров")} placeholder={t("Поиск товаров")} value={value} onChange={event => setDraft({ query, value: event.target.value })} onFocus={openSearch} />
                        </form>



                        <Link to="/favorites" className="butt" aria-label={t("Избранное")}>
                            <img className="obshiy" src={favorite} alt="" />{t("Избранное")}{favoritesCount > 0 && <span className="header-badge">{favoritesCount}</span>}
                        </Link>


                        <Link to="/catalog" className="butt1">
                            <img className="obshiy" src={category} alt="" />{t("Каталог")}</Link>


                        <Link to="/karzina" className="butt1">
                            <svg className="obshiy" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 2l1.5 4M18 2l-1.5 4M3 7h18l-1.5 9.5a2 2 0 0 1-2 1.5H6.5a2 2 0 0 1-2-1.5L3 7z" />
                            </svg>{t("Карзина")}{cartCount > 0 && <span className="header-badge">{cartCount}</span>}
                        </Link>

                        {user ? (
                            <Link to="/profile" className="sign-up" style={{ color: "inherit", textDecoration: "none" }}>
                                <span><i className="fa-solid fa-user"></i></span>{t("Профиль")}</Link>
                        ) : (
                            <Link to="/login" className="sign-up" style={{ color: "inherit", textDecoration: "none" }}>
                                <span><i className="fa-solid fa-arrow-right-from-bracket"></i></span>{t("Вход")}</Link>
                        )}
                    </div>
                </header>
            </div>
        </div>
    )
}
