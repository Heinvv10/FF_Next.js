import { initializeApp, getApps, getApp } from 'firebase/app';
// Auth imports commented out as we're using Clerk
// import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence 
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
// Analytics and Performance disabled to prevent API key errors
// import { getAnalytics, isSupported } from 'firebase/analytics';
// import { getPerformance } from 'firebase/performance';

// Firebase configuration
// Note: These are public keys protected by Firebase Security Rules
// Updated Oct 30, 2025: Correct fibreflow-app config with Storage enabled
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDaifRDsiYn9anSrWlznHZiWdiLPvk4abY',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'fibreflow-app.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'fibreflow-app',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'fibreflow-app.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '9040732203',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:9040732203:web:af9b44055f6696c68e4a6e',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-3S74XHZ49B'
};

// Initialize Firebase (singleton pattern to prevent duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
// Note: Auth service commented out as we're using Clerk for authentication
// export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics and Performance Monitoring disabled to prevent installation errors
// These features require additional API enablement in Google Cloud Console
const analytics = null;
const performance = null;

// Uncomment when APIs are enabled:
// if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true') {
//   isSupported().then((supported) => {
//     if (supported) {
//       analytics = getAnalytics(app);
//     }
//   });
// }
// if (process.env.NEXT_PUBLIC_APP_ENV === 'production') {
//   performance = getPerformance(app);
// }

// Offline persistence - disable in server environment
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_OFFLINE === 'true') {
  // Enable multi-tab persistence
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('Firebase persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // The current browser doesn't support persistence
      console.warn('Firebase persistence not available in this browser');
    }
  });
}

// Emulator configuration for development
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_APP_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
  // Emulator ports from Firebase emulators configuration
  // Auth emulator commented out as we're using Clerk
  // const authEmulatorUrl = 'http://localhost:9099';
  const firestoreEmulatorHost = 'localhost';
  const firestoreEmulatorPort = 8080;
  const storageEmulatorHost = 'localhost';
  const storageEmulatorPort = 9199;

  try {
    // connectAuthEmulator(auth, authEmulatorUrl, { disableWarnings: true });
    connectFirestoreEmulator(db, firestoreEmulatorHost, firestoreEmulatorPort);
    connectStorageEmulator(storage, storageEmulatorHost, storageEmulatorPort);
    console.log('🔧 Connected to Firebase emulators (Firestore & Storage only)');
  } catch (error) {
    // Emulators might already be connected or not running
    console.debug('Firebase emulators connection skipped:', error);
  }
}

export { app, analytics, performance };

// Re-export types for convenience
// Firebase auth User type commented out as we're using Clerk
// export type { User } from 'firebase/auth';
export type { DocumentData, QuerySnapshot } from 'firebase/firestore';