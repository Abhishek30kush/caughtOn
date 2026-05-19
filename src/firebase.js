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

export const DEFAULT_SETTINGS = {
  heroBadge: "EXCLUSIVELY CRAFTED DROPS AVAILABLE",
  heroHeading: "Premium Everyday Comfort Track Pants.",
  heroSubheading: "Unmatched freedom of movement meets ultimate street-ready aesthetics. Experience structural premium tailoring designed for your daily street aesthetic.",
  heroTrustBadge1: "Free COD Delivery India",
  heroTrustBadge2: "100% Street Premium Fabric",
  heroTrustBadge3: "7-Day Easy Returns",
  heroTrustBadge4: "Proudly Made in India",
  catalogTitle: "Anatomy of Premium Comfort",
  aboutTitle: "About caughtOn",
  aboutTagline: "Engineering the perfect everyday wear for ultimate comfort and motion.",
  aboutParagraphs: [
    "Welcome to caughtOn. We are a premium apparel brand based in Prayagraj, Uttar Pradesh, born from a singular, obsessive mission: to create the perfect everyday track pant.",
    "Our journey started with a simple observation: finding a track pant that perfectly balances comfort, durability, and a modern aesthetic is incredibly difficult. Most options out there either compromise on the fabric quality or fail to provide a tailored, stylish fit.",
    "That's why we engineered our signature track pants. We use premium, high-density, breathable fabrics designed for endless motion—whether you're hitting the gym, lounging at home, or navigating active city streets. Every stitch is carefully crafted to ensure longevity and ultimate comfort.",
    "At caughtOn, we believe in keeping things simple. We focus on one core product and we make sure it's the absolute best one you'll ever wear. No distractions, just pure quality."
  ],
  contactAddress: "Prayagraj, Uttar Pradesh\nPin - 211011",
  contactPhone: "7275977711",
  contactEmail: "coughton@gmail.com",
  socialInstagram: "https://instagram.com/coughton",
  socialFacebook: "https://facebook.com/coughton",
  socialTwitter: "https://twitter.com/coughton",
  policyPrivacy: "At caughtOn, we prioritize your privacy. We collect basic information like your name, phone number, and address strictly for fulfilling your orders. We do not sell or share your personal data with third-party marketing agencies. Your information is securely stored and only accessible by authorized personnel for delivery purposes.",
  policyTerms: "By using the caughtOn website, you agree to our terms. All products and prices are subject to change without prior notice. We reserve the right to refuse service or cancel orders if fraudulent activity is suspected. The content, logo, and images on this site are the property of caughtOn and may not be used without permission.",
  policyReturn: "We offer a 7-day return and exchange policy from the date of delivery. Items must be unused, unwashed, and in their original packaging with tags intact. If you received a defective item or the wrong size, please contact us immediately at coughton@gmail.com with photos of the product. Refunds (if applicable) will be processed once the returned item is inspected.",
  policyShipping: "We ship all orders from our base in Prayagraj. Orders are typically processed within 24-48 hours. Delivery takes 3-7 business days depending on your location. We offer Cash on Delivery (COD) as our primary payment method for your convenience. Free delivery is available on all standard orders."
};


