import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Home } from './pages/Home'
import { Shop } from './pages/Shop'
import { ProductPage } from './pages/Product'
import { Checkout } from './pages/Checkout'
import { About } from './pages/About'
import { Contact } from './pages/Contact'
import { PolicyPage } from './pages/Policy'
import { NotFound } from './pages/NotFound'

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="product/:slug" element={<ProductPage />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="privacy" element={<PolicyPage doc="privacy" />} />
        <Route path="terms" element={<PolicyPage doc="terms" />} />
        <Route path="returns" element={<PolicyPage doc="returns" />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
