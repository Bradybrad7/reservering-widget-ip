import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n' // Initialize i18n
import App from './App.tsx'

// Initialize Firebase
import './firebase'

// Initialize storage service (Firestore)
import { storageService } from './services/storageService'

// Initialize Firestore storage
storageService.initialize().then(() => {
  console.log('✅ Firestore storage initialized');
}).catch((error) => {
  console.error('❌ Firestore initialization failed:', error);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
