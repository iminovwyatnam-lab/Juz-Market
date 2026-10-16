import "./sotset.css"
import { Link } from 'react-router-dom'

export default function SotSet() {
    return (
        <div>
            <div className="info-button">
                <Link to="/svaz-s-nami">
                    <button>←</button>
                </Link>

                <h1>Соц сети</h1>

                <Link to="/kontakt">
                    <button>→</button>
                </Link>
            </div>

            <div className='info-block'>
                <h1>Соц сети</h1>

                <div className="atvet">
                    <ul>
                        <Link className='text-decor' to="https://www.instagram.com/juz.martek?utm_source=ig_web_button_share_sheet&vrfl=ZDNlZDc0MzIxNw==">
                            <li>Instagram</li>
                        </Link>

                        <Link className='text-decor' to="https://t.me/juz_market">
                            <li>Telegram</li>
                        </Link>
                    </ul>
                </div>

            </div>
        </div>
    )
}
