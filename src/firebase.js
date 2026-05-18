import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize standard Firebase App (for Firestore, Auth, etc.)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Firebase Storage (can be from a different project if configured)
let storageInstance;
const storageBucket = import.meta.env.VITE_STORAGE_STORAGE_BUCKET || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;

if (import.meta.env.VITE_STORAGE_API_KEY && import.meta.env.VITE_STORAGE_PROJECT_ID) {
  // Option 1: Full credentials for a separate Storage project (Recommended for secure access)
  const storageConfig = {
    apiKey: import.meta.env.VITE_STORAGE_API_KEY,
    authDomain: import.meta.env.VITE_STORAGE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_STORAGE_PROJECT_ID,
    storageBucket: storageBucket,
    appId: import.meta.env.VITE_STORAGE_APP_ID
  };
  const storageApp = initializeApp(storageConfig, "storageApp");
  storageInstance = getStorage(storageApp);
} else {
  // Option 2: Fallback to the main app (with bucket override if provided)
  storageInstance = storageBucket ? getStorage(app, `gs://${storageBucket}`) : getStorage(app);
}

// Fail fast (10 seconds) on connection/permission issues instead of spinning forever (SDK default is 10 mins)
storageInstance.maxUploadRetryTime = 10000;
storageInstance.maxOperationRetryTime = 10000;

export const storage = storageInstance;

