import "./kontakt.css"
import { Link } from 'react-router-dom'

export default function Kontakt() {
    return (
        <div>
            <div className="info-button">
                <Link to="/sot-set">
                    <button>←</button>
                </Link>

                <h1>Контакты</h1>

                <button disabled={true}>→</button>
            </div>

            <div className='info-block'>
                <h1>Сделайте заказ или задайте вопрос — мы всегда на связи!</h1>

                <div className='atvet'>
                    <ul>
                        <li>В JUZ MARKET мы ценим быстрое и удобное общение. Если у вас возникли вопросы по ассортименту, оформлению заказа или предзаказу товаров, напишите нам — мы с радостью поможем!</li>
                    </ul>

                    <h3 className='hh3'>Связь и Предзаказ</h3>

                    <ul>
                        <li>Самый быстрый способ связаться с нами и оформить предзаказ любых товаров — наш Telegram:</li>
                        <p>Telegram: <Link className="text-decor" to="https://t.me/i_m_i_n_o_v">@i_m_i_n_o_v</Link></p>
                        <p>Канал / Сообщество: <Link className="text-decor" to="https://t.me/juz_market">juz market chanal</Link></p>
                    </ul>

                    <h3 className='hh3'>Разработчик и Основатель</h3>
                    <p className="pp1">По техническим вопросам, предложениям и сотрудничеству:</p>

                    <ul>
                        <li>Создатель & Web-Developer: Иминов Абдумуталлиб</li>
                        <li>Email: juzsupport@gmail.com</li>
                    </ul>

                    <h3 className='hh3'>Режим работы</h3>

                    <ul>
                        <li>Прием онлайн-заказов: 12:00 до 20:00, по выходным с 11:00 до 21:00</li>
                        <li>Поддержка и консультации в Telegram: с 09:00 до 20:00</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
