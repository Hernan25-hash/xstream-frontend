// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ---------------------------
// Main Firebase App (Auth + Firestore)
// ---------------------------
const mainConfig = {
  apiKey: "AIzaSyAfLY0MrsseTHJ7yZg8uxwUvRPXKehd73Y",
  authDomain: "xstream1-60177.firebaseapp.com",
  projectId: "xstream1-60177",
  storageBucket: "xstream1-60177.appspot.com", // Needed internally for Firestore
  messagingSenderId: "672677425882",
  appId: "1:672677425882:web:c4aa610cf2b4b5e4c72be3",
  measurementId: "G-BCBZQMP2FD",
};

// Initialize main app
export const app = initializeApp(mainConfig);

// Analytics only if supported
export let analytics: typeof getAnalytics | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) analytics = getAnalytics(app);
  });
}

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// ---------------------------
// Storage Firebase App (Playmo project)
// ---------------------------
const storageConfig = {
  apiKey: "AIzaSyCrOYe5uVvaH24xqFFm4cHgILI5Jup0JRw",
  authDomain: "playmo-app-53e1b.firebaseapp.com",
  projectId: "playmo-app-53e1b",
  storageBucket: "playmo-app-53e1b.firebasestorage.app",
  messagingSenderId: "194609039855",
  appId: "1:194609039855:web:06212b88c2e33b95880e1a",
  measurementId: "G-TSP9RL0EYD",
};

// Initialize separate app for storage
const storageApp = initializeApp(storageConfig, "storageApp");

// Export the storage instance
export const otherStorage = getStorage(storageApp);
