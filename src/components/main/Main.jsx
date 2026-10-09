import { translate as t, useLanguage } from '../../preferences/preferences';
import React, { useEffect, useState } from 'react';
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import './main.css';
import Products from './Products';
import { getBanners, mediaUrl } from '../../market/marketApi';

// import required modules
import { Keyboard, Pagination, Navigation } from 'swiper/modules';

export default function App() {
    useLanguage();
    const [banners, setBanners] = useState([]);
    useEffect(() => {
        const controller = new AbortController();
        const refresh = () => getBanners(controller.signal).then(data => { if (!controller.signal.aborted) setBanners(data); }).catch(() => {});
        refresh(); window.addEventListener('focus', refresh);
        return () => { controller.abort(); window.removeEventListener('focus', refresh); };
    }, []);
    return (
        <>
            <div className='countainer'>
                <main>
                    <Swiper slidesPerView={1} spaceBetween={30} keyboard={{enabled: true,}} pagination={{clickable: true,}} navigation={true} modules={[Keyboard, Pagination, Navigation]} className="mySwiper">
                        {banners.map(banner => <SwiperSlide key={banner.id}>
                            {banner.link ? <a className="jm-ad-banner" href={banner.link}><img className="banner" src={mediaUrl(banner.image)} alt={banner.title} /></a>
                                : <img className="banner" src={mediaUrl(banner.image)} alt={banner.title} />}
                        </SwiperSlide>)}
                    </Swiper>

                    <h1 className='hh1'>{t("все товары")}</h1>

                    <Products />
                </main>
            </div>
        </>
    );
}
