import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import Settings from './Settings'
import MatrixBackground from './MatrixBackground'
import LanguageProvider from './LanguageProvider'
import 'virtual:tokens.css'
import './style.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MatrixBackground />
    <LanguageProvider>
      {window.location.pathname.endsWith('/settings.html') ? (
        <Settings />
      ) : (
        <App />
      )}
    </LanguageProvider>
  </React.StrictMode>,
)
