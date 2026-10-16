import { Link } from "react-router-dom"
import "./zadat.css"

export default function Zadat() {
  return (
    <div>
      <div className="info-button">
        <Link to="/svaz-s-nami">
          <button>←</button>
        </Link>

        <h1>Задать вопрос</h1>

        <Link className="link" to="/sot-seti">
          <button>→</button>
        </Link>
      </div>

      <div className="info-block">
        <h1>На вопросы - ответ</h1>

        <div className="atvet">
          <ul>
            <li>Как зарегестрироваться?</li>
            <p>если через телефон: с право внизу в углу кнопка (user) → зарегестрироваться</p>
            <p>если через компьютер: с лево вверху (вход) → зарегестрироваться</p>

            <li className="lii">Как заказать определенный продукт?</li>
            <p>если через телефон: выберете понравившися продукт и нажмите (купить сейчас) → заполните оформление → подтвердить заказ</p>
            <p>если через компьютер: выберете понравившися продукт и нажмите (купить сейчас) → с лево в блоке (оформить) → заполните оформление → подтвердить заказ</p>

            <h5 className="obaz">!ОБЕЗАТЕЛЬНО!</h5>
            <p>нажать на кнопку (Определить мою локацию)</p>
            <p>если вы не отправите ваше место нахождение при оформлении заказа вам не поступит заказ, <br /> если забыли то напишите в поддержку и отправте номер заказа и с google карты отправте локацию.</p>
          </ul>
        </div>

        <div className="atvet1">
          <h2 className="vopros">если есть вопросы пишите</h2>
          <textarea className="textary" name="" id=""></textarea>

          <button className="otpravit">Отправить</button>
        </div>
      </div>
    </div>
  )
}
