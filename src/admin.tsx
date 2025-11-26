import React from 'react'
import { createRoot } from 'react-dom/client'
import BookingAdmin from './components/BookingAdmin'
import { ToastProvider } from './components/Toast'
import './index.css'
import './i18n' // Initialize i18n for admin

createRoot(document.getElementById('admin-root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <BookingAdmin />
    </ToastProvider>
  </React.StrictMode>,
)