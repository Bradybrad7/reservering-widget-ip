/**
 * Firebase Configuration and Initialization
 * 
 * This file initializes Firebase services:
 * - Firestore: Database for events, reservations, settings
 * - Analytics: User behavior tracking
 */

import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import type { Analytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCaH8VZJZhuJtMKSjC44VX6QWmPfAdlJ80",
  authDomain: "dinner-theater-booking.firebaseapp.com",
  projectId: "dinner-theater-booking",
  storageBucket: "dinner-theater-booking.firebasestorage.app",
  messagingSenderId: "802367293541",
  appId: "1:802367293541:web:5d2928c0cb6fa2c8bbde8c",
  measurementId: "G-83WTWDTX7V"
};

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
let analytics: Analytics | null = null;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  
  // Initialize analytics only in browser environment (production only)
  if (typeof window !== 'undefined' && import.meta.env.PROD) {
    try {
      analytics = getAnalytics(app);
    } catch (analyticsError) {
      // Analytics failure should not block the app
      if (import.meta.env.DEV) {
        console.warn('⚠️ Firebase Analytics initialization failed (non-critical):', analyticsError);
      }
    }
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw new Error('Failed to initialize Firebase. Please check your configuration.');
}

// Export initialized services
export { app, db, analytics };
export default app;
