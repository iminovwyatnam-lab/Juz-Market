import { translate as t, useLanguage } from '../../preferences/preferences';
import "./footer.css"
import juz_logo from "../../assets/Juz-Market-Photo/juz-market-logo-for-header.png"
import j_logo from "../../assets/Juz-Market-Photo/J-logo.png"
import juzz_logo from "../../assets/Juz-Market-Photo/Juz-logo.png"
import gmail from "../../assets/Juz-Market-Photo/gmail.png"
import telegram from "../../assets/Juz-Market-Photo/telegram.png"
import instagram from "../../assets/Juz-Market-Photo/instagram.png"
import home from "../../assets/Juz-Market-Photo/home.png"
import favorite from "../../assets/Juz-Market-Photo/favorite.png"
import корзина from "../../assets/Juz-Market-Photo/Корзина.png"
import profile from "../../assets/Juz-Market-Photo/profile.png"
import search from "../../assets/Juz-Market-Photo/search.png"
import { Link } from "react-router-dom"

export default function Footer() {
  useLanguage();
  return (
    <div>
      <div className="cointainer">
        <footer>
          <div className="flex">
            <div className="full">
              <div className="footer-flex">
                <img className="juz" src={juz_logo} alt="" />
              </div>

              <div className="footer-text">
                <Link className='footer-bottom-text' to="/o-nas">
                  <p>{t("о нас")}</p>
                </Link>

                <Link className='footer-bottom-text' to="/svaz-s-nami">
                  <p>{t("связь с нами")}</p>
                </Link>

                <Link className='footer-bottom-text' to="/zadat-vopros">
                  <p>{t("задать вопрос")}</p>
                </Link>
              </div>

              <div className="footer-text1">
                <Link className='footer-bottom-text' to="/sot-seti">
                  <p>{t("соц сети")}</p>
                </Link>

                <Link className='footer-bottom-text' to="/kontakt">
                  <p>{t("контакты")}</p>
                </Link>

                <p><Link to="/seller" style={{ color: "inherit", textDecoration: "none" }}>{t("Продавать на Juz Market")}</Link></p>
              </div>
            </div>

            <div className="logo-flex">
              <img className="sot-logo" src={gmail} alt="" />
              <img className="sot-logo" src={telegram} alt="" />
              <img className="sot-logo" src={instagram} alt="" />
            </div>
          </div>
          <img className="j-logo" src={j_logo} alt="" />
          <img className="j-logo1" src={juzz_logo} alt="" />

          <div className="bottom-footer">
            <hr className="hr1" />

            <p className="bottom-text">{t("©2026 OOO JUZ MARKET | juzsupport@gmail.com | все права защищены")}</p>
          </div>
        </footer>

        <footer className="mobile-button">
          <Link to="/">
            <button>
              <img src={home} alt="" />
            </button>
          </Link>

          <Link to="/favorites">
            <button>
              <img src={favorite} alt="" />
            </button>
          </Link>

          <Link to="/karzina">
            <button>
              <img src={корзина} alt="" />
            </button>
          </Link>

          <Link to="/catalog" state={{ focusSearch: true }} onClick={() => window.dispatchEvent(new Event('jm-open-search'))}>
            <button aria-label={t("Поиск товаров")}>
              <img className="ser" src={search} alt="" />
            </button>
          </Link>

          <Link to="/profile" aria-label={t("Профиль")}>
            <button>
              <img src={profile} alt="" />
            </button>
          </Link>
        </footer>
        <br className="brr" />
        <br className="brr" />
        <br className="brr" />
      </div>
    </div>
  )
}
