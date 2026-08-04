import React, { useRef, useState } from 'react';
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import juz_banner from "../../assets/Juz-Market-Photo/Juz-Market-Banner.png"
import juz_banner65 from "../../assets/Juz-Market-Photo/Juz-Market-Banner-65.png"
import juz_banner65_1 from "../../assets/Juz-Market-Photo/Juz-Market-Banner-65.1.png"

import './main.css';
import Products from './Products';

// import required modules
import { Keyboard, Pagination, Navigation } from 'swiper/modules';

export default function App() {
    return (
        <>
            <div className='countainer'>
                <main>
                    <Swiper
                        slidesPerView={1}
                        spaceBetween={30}
                        keyboard={{
                            enabled: true,
                        }}
                        pagination={{
                            clickable: true,
                        }}
                        navigation={true}
                        modules={[Keyboard, Pagination, Navigation]}
                        className="mySwiper"
                    >
                        <SwiperSlide>
                            <img className="banner" src={juz_banner} alt="" />
                        </SwiperSlide>

                        <SwiperSlide>
                            <img className='banner1' src={juz_banner65} alt="" />
                        </SwiperSlide>

                        <SwiperSlide>
                            <img className="banner" src={juz_banner65_1} alt="" />
                        </SwiperSlide>

                        <SwiperSlide>
                            {/* <img src={} alt="" /> */}
                        </SwiperSlide>

                        <SwiperSlide>
                            {/* <img src={} alt="" /> */}
                        </SwiperSlide>

                        <SwiperSlide>
                            {/* <img src={} alt="" /> */}
                        </SwiperSlide>

                        <SwiperSlide>
                            {/* <img src={} alt="" /> */}
                        </SwiperSlide>

                        <SwiperSlide>
                            {/* <img src={} alt="" /> */}
                        </SwiperSlide>

                        <SwiperSlide>
                            {/* <img src={} alt="" /> */}
                        </SwiperSlide>
                    </Swiper>

                    <h1 className='hh1'>все товары</h1>

                    <Products />
                </main>
            </div>
        </>
    );
}
