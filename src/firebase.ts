import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAfLY0MrsseTHJ7yZg8uxwUvRPXKehd73Y",
  authDomain: "xstream1-60177.firebaseapp.com",
  projectId: "xstream1-60177",
  storageBucket: "xstream1-60177.appspot.com", // still needed for Firestore’s internal use
  messagingSenderId: "672677425882",
  appId: "1:672677425882:web:c4aa610cf2b4b5e4c72be3",
  measurementId: "G-BCBZQMP2FD",
};

// ✅ Initialize Firebase app
export const app = initializeApp(firebaseConfig);

// ✅ Analytics only if supported (avoids local/SSR error)
export let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// ✅ Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
