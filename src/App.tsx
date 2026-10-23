import { createBrowserRouter } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Home } from './pages/Home'
import { Shop } from './pages/Shop'
import { ProductRedirect } from './pages/Product'
import { Checkout } from './pages/Checkout'
import { About } from './pages/About'
import { Contact } from './pages/Contact'
import { PolicyPage } from './pages/Policy'
import { NotFound } from './pages/NotFound'

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'shop', element: <Shop /> },
      { path: 'product/:slug', element: <ProductRedirect /> },
      { path: 'checkout', element: <Checkout /> },
      { path: 'about', element: <About /> },
      { path: 'contact', element: <Contact /> },
      { path: 'privacy', element: <PolicyPage doc="privacy" /> },
      { path: 'terms', element: <PolicyPage doc="terms" /> },
      { path: 'returns', element: <PolicyPage doc="returns" /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
