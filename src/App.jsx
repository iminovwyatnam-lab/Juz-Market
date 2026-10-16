import React from 'react'
import BannersPage from './admin/pages/BannersPage'
import { Routes, Route, Link } from 'react-router-dom'
import Main from './components/main/Main'
import Header from './components/header/Header'
import Footer from './components/footer/Footer'
import Karzina from './pages/karzina/Karzina'
import Favorites from './pages/favorites/Favorites'
import Catalog from './pages/catalog/Catalog'
import { CartProvider } from './context/CartContext'

import AdminLayout from './admin/AdminLayout'
import Dashboard from './admin/pages/Dashboard'
import OrdersPage from './admin/pages/OrdersPage'
import ProductsPage from './admin/pages/ProductsPage'
import UsersPage from './admin/pages/UsersPage'
import ApplicationsPage from './admin/pages/ApplicationsPage'
import Card from './pages/card/Card'
import Auth from './pages/auth/Auth'
import Profile from './pages/profile/Profile'
import SellerPage from './seller/SellerPage'
import SellerAccountPage from './admin/pages/SellerAccountPage'
import SupportPage from './admin/pages/SupportPage'
import Settings from './pages/settings/Settings'
import ONas from './pages/footer-info/o-nas/Onas'
import Svazsnami from './pages/footer-info/svaz-s-nami/Svaz-s-nami'
import Zadat from './pages/footer-info/zadat-vopros/Zadat'
import SotSet from './pages/footer-info/sot-set/SotSet'
import Kontakt from './pages/footer-info/kontakt/Kontakt'
import NotFound from './pages/notFound/NotFound'

export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={
          <div>
            <Header />
            <Main />
            <Footer />
          </div>
        } />

        <Route path="/karzina" element={
          <div>
            <Header />
            <Karzina />
            <Footer />
          </div>
        } />

        <Route path="/catalog" element={
          <div>
            <Header />
            <Catalog />
            <Footer />
          </div>
        } />

        <Route path="/favorites" element={
          <div>
            <Header />
            <Favorites />
            <Footer />
          </div>
        } />

        <Route path='/product/:id?' element={
          <div>
            <Header />
            <Card />
            <Footer />
          </div>
        } />

        <Route path="/login" element={<Auth />} />
        <Route path="/seller" element={<SellerPage />} />

        <Route path="/profile" element={
          <div>
            <Header />
            <Profile />
            <Footer />
          </div>
        } />

        <Route path="/settings" element={
          <div>
            <Header />
            <Settings />
            <Footer />
          </div>
        } />

        <Route path="/o-nas" element={
          <div>
            <Header />
            <ONas />
            <Footer />
          </div>
        } />

        <Route path="/svaz-s-nami" element={
          <div>
            <Header />
            <Svazsnami />
            <Footer />
          </div>
        } />

        <Route path="/zadat-vopros" element={
          <div>
            <Header />
            <Zadat />
            <Footer />
          </div>
        } />

        <Route path='/sot-seti' element={
          <div>
            <Header />
            <SotSet />
            <Footer />
          </div>
        } />

        <Route path='*' element={
          <div>
            <Header />
            <NotFound />
          </div>
        } />

        <Route path='/kontakt' element={
          <div>
            <Header />
            <Kontakt />
            <Footer />
          </div>
        } />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="sellers/:sellerId" element={<SellerAccountPage />} />
          <Route path="banners" element={<BannersPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
        </Route>
      </Routes>
    </CartProvider>
  )
}
