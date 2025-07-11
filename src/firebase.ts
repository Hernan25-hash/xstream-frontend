// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAfLY0MrsseTHJ7yZg8uxwUvRPXKehd73Y",
  authDomain: "xstream1-60177.firebaseapp.com",
  projectId: "xstream1-60177",
  storageBucket: "xstream1-60177.firebasestorage.app",
  messagingSenderId: "672677425882",
  appId: "1:672677425882:web:c4aa610cf2b4b5e4c72be3",
  measurementId: "G-BCBZQMP2FD"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
