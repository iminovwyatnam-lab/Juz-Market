import "./header.css"
import { Link } from "react-router-dom"
import { useCart } from "../../context/CartContext"
import juz_logo from "../../assets/Juz-Market-Photo/juz-market-logo-for-header.png"
import category from "../../assets/Juz-Market-Photo/Category.png"
import favorite from "../../assets/Juz-Market-Photo/favorite.png"
import search from "../../assets/Juz-Market-Photo/search.png"

export default function Header() {
    const { cartCount, favoritesCount } = useCart();
    return (
        <div>
            <div className="countainer">
                <header>
                    <img className="juz-market" src={juz_logo} alt="" />

                    <div className="header-flex">

                        <div className="search">
                            <img className="fa-solid" src={search} alt="" />

                            <input className="inp" type="text" name="" id="" placeholder="search" />
                        </div>


                        <Link to="/favorites" className="butt">
                            <img className="obshiy" src={favorite} alt="" />
                            Избранное
                            {favoritesCount > 0 && <span className="header-badge">{favoritesCount}</span>}
                        </Link>


                        <button className="butt1">
                            <img className="obshiy" src={category} alt="" />
                            Каталог
                        </button>


                        <Link to="/karzina" className="butt1">
                            <svg className="obshiy" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 2l1.5 4M18 2l-1.5 4M3 7h18l-1.5 9.5a2 2 0 0 1-2 1.5H6.5a2 2 0 0 1-2-1.5L3 7z" />
                            </svg>
                            Карзина
                            {cartCount > 0 && <span className="header-badge">{cartCount}</span>}
                        </Link>

                        <p>
                            <span><i className="fa-solid fa-arrow-right-from-bracket"></i></span>
                            Вход
                        </p>
                    </div>
                </header>
            </div>
        </div>
    )
}
