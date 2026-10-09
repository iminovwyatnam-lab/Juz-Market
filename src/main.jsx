import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './preferences/preferences'
import './preferences/theme.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import './responsive.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
