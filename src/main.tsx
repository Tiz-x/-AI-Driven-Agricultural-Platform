import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/global.css'   // ← design system, imported ONCE here
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)