import "./footer.css"
import juz_logo from "../../assets/Juz-Market-Photo/juz-market-logo-for-header.png"
import j_logo from "../../assets/Juz-Market-Photo/J-logo.png"
import juzz_logo from "../../assets/Juz-Market-Photo/Juz-logo.png"
import gmail from "../../assets/Juz-Market-Photo/gmail.png"
import telegram from "../../assets/Juz-Market-Photo/telegram.png"
import instagram from "../../assets/Juz-Market-Photo/instagram.png"

export default function Footer() {
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
                <p>о нас</p>
                <p>связь с нами</p>
                <p>задать вопрос</p>
              </div>

              <div className="footer-text">
                <p>соц сети</p>
                <p>контакты</p>
                <p>сотрудничество</p>
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

          <hr className="hr1" />

          <p className="bottom-text">©2026 OOO JUZ MARKET | juzsupport@gmail.com | все права защищены</p>
        </footer>
      </div>
    </div>
  )
}
