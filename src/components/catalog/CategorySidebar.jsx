import { translate as t, useLanguage } from '../../preferences/preferences';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Mousewheel, Scrollbar } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/scrollbar';
import { CATEGORIES } from './categories';
import './catalog.css';

// Вертикальная карусель категорий: крутится колесиком мыши,
// пальцем (на телефоне) или перетаскиванием.
export default function CategorySidebar({ active, onSelect }) {
    useLanguage();
    return (
        <aside className="cat-box">
            <div className="cat-mobile-groups">
                {[CATEGORIES.slice(0, 14), CATEGORIES.slice(14)].map((group, index) => (
                    <div className="cat-mobile-group" key={index}>
                        {group.map(name => (
                            <button
                                type="button"
                                className={`cat-item${active === name ? ' is-active' : ''}`}
                                key={name}
                                aria-pressed={active === name}
                                onClick={() => onSelect(active === name ? null : name)}
                            >{t(name)}</button>
                        ))}
                    </div>
                ))}
            </div>
            <div className="cat-card">
                <Swiper
                    className="cat-swiper"
                    direction="vertical"
                    slidesPerView="auto"
                    spaceBetween={0}
                    freeMode={true}
                    mousewheel={{ forceToAxis: true, releaseOnEdges: true }}
                    scrollbar={{ draggable: true }}
                    modules={[FreeMode, Mousewheel, Scrollbar]}
                >
                    {CATEGORIES.map((name) => (
                        <SwiperSlide className="cat-slide" key={t(name)}>
                            <button
                                type="button"
                                className={`cat-item${active === name ? ' is-active' : ''}`}
                                onClick={() => onSelect(active === name ? null : name)}
                            >
                                {t(name)}
                            </button>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </aside>
    );
}
