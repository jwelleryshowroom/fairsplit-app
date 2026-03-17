import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getEnv } from "./utils/env";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: getEnv("VITE_FIREBASE_API_KEY"),
    authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),

    // You can leave these hardcoded or move them to .env as well:
    storageBucket: "fairsplit-ab339.firebasestorage.app",
    messagingSenderId: "935976689696",
    appId: "1:935976689696:web:d89f3a22886a8624e9dc45"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
