/**
 * Firebase Admin SDK Configuration
 * Server-side only - DO NOT import in client components
 *
 * Used for authenticated operations that bypass user auth:
 * - File uploads to Storage
 * - Database admin operations
 */

import * as admin from 'firebase-admin';

// Singleton pattern - prevent multiple initializations
let adminApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 * Uses service account credentials from environment variables
 */
export function getAdminApp(): admin.app.App {
  if (adminApp) {
    return adminApp;
  }

  try {
    // Check if already initialized (Next.js hot reload)
    if (admin.apps.length > 0) {
      adminApp = admin.apps[0] as admin.app.App;
      return adminApp;
    }

    // Get service account from environment
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccount) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_KEY is not set. ' +
        'Please add it to .env.local (see .env.local.example)'
      );
    }

    // Parse service account JSON
    const serviceAccountJson = JSON.parse(serviceAccount);

    // Initialize Admin SDK
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountJson),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'fibreflow-app.firebasestorage.app',
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return adminApp;

  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error);
    throw error;
  }
}

/**
 * Get Firebase Admin Storage bucket
 */
export function getAdminStorage() {
  const app = getAdminApp();
  return admin.storage(app).bucket();
}

/**
 * Get Firebase Admin Firestore (if needed)
 */
export function getAdminFirestore() {
  const app = getAdminApp();
  return admin.firestore(app);
}

// Export admin namespace for direct access if needed
export { admin };
