import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Main from './components/main/Main'
import Header from './components/header/Header'
import Footer from './components/footer/Footer'
import Karzina from './pages/karzina/Karzina'
import Favorites from './pages/favorites/Favorites'
import { CartProvider } from './context/CartContext'

import AdminLayout from './admin/AdminLayout'
import Dashboard from './admin/pages/Dashboard'
import OrdersPage from './admin/pages/OrdersPage'
import ProductsPage from './admin/pages/ProductsPage'
import UsersPage from './admin/pages/UsersPage'

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

        <Route path="/favorites" element={
          <div>
            <Header />
            <Favorites />
            <Footer />
          </div>
        } />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>
      </Routes>
    </CartProvider>
  )
}