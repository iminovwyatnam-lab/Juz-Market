import { Link } from "react-router-dom"
import "./svaz-s-nami.css"

export default function Svazsnami() {
  return (
    <div>
      <div className="info-button">
        <Link to="/o-nas">
          <button>←</button>
        </Link>

        <h1>Связь с нами</h1>

        <Link to="/zadat-vopros">
          <button>→</button>
        </Link>
      </div>

      <div className="info-block">
        <h1>Связь с нами</h1>

        <ul>
          <li>Мы всегда рады помочь вам, ответить на любые вопросы и выслушать ваши предложения! Вы можете связаться с нами любым удобным для вас способом.</li>
        </ul>

        <h3 className="nashi">Наши контакты</h3>

        <ul>
          <li>Электронная почта: juzsupport@gmail.com</li>
          <li>Telegram-канал / Чат: <Link to={"https://t.me/i_m_i_n_o_v"}>@i_m_i_n_o_v</Link></li>
        </ul>

        <h3 className="nashi">Режим работы</h3>

        <ul>
          <li>Ежедневно с 09:00 до 21:00 без выходных.</li>
        </ul>

        <h2 className="forma-text">Форма обратной связи</h2>

        <p>Если у вас возникли вопросы по заказу, оплате или доставке, заполните форму ниже, и наши специалисты свяжутся с вами в ближайшее время:</p>

        <div className="forma">
          <ul>
            <li>Ваше имя</li>

            <li>Номер телефона / Email</li>

            <li>Сообщение</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
