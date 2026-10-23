import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './App'
import { SiteProvider } from './store/site'
import './styles/index.css'

const container = document.getElementById('root')!

createRoot(container).render(
  <StrictMode>
    <SiteProvider>
      <RouterProvider router={router} />
    </SiteProvider>
  </StrictMode>,
)
