import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { SiteProvider } from './store/site'
import './styles/index.css'

const container = document.getElementById('root')!

createRoot(container).render(
  <StrictMode>
    <SiteProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SiteProvider>
  </StrictMode>,
)
