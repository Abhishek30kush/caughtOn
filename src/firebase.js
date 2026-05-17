import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBN2Ec3O-wX2edx3KH0c7vXDTLigcC_TVA",
  authDomain: "caughton-c3900.firebaseapp.com",
  projectId: "caughton-c3900",
  storageBucket: "caughton-c3900.firebasestorage.app",
  messagingSenderId: "517220216889",
  appId: "1:517220216889:web:1dc920b08ad8315ab79de8",
  measurementId: "G-C0RYFVD33J"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
