import React from 'react'
import { createRoot } from 'react-dom/client'
import BookingAdmin from './components/BookingAdminNew2'
import { ToastProvider } from './components/Toast'
import './index.css'

createRoot(document.getElementById('admin-root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <BookingAdmin />
    </ToastProvider>
  </React.StrictMode>,
)