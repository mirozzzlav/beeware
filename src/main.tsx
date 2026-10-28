import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './features/visit/App'
import Settings from './features/settings/Settings'
import MatrixBackground from './components/MatrixBackground/MatrixBackground'
import LanguageProvider from './features/language/LanguageProvider'
import 'virtual:tokens.css'
import './style.css'

const isSettingsPage = window.location.pathname.endsWith('/settings.html')

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {!isSettingsPage && <MatrixBackground />}
    <LanguageProvider>
      {isSettingsPage ? <Settings /> : <App />}
    </LanguageProvider>
  </React.StrictMode>,
)
