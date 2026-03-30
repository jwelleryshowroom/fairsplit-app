import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, indexedDBLocalPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getEnv } from "./utils/env";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: getEnv("VITE_FIREBASE_API_KEY"),
    authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: getEnv("VITE_FIREBASE_APP_ID"),
    measurementId: getEnv("VITE_FIREBASE_MEASUREMENT_ID")
};

import { Capacitor } from '@capacitor/core';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let authInstance;
if (Capacitor.isNativePlatform()) {
    // initializeAuth is preferred over getAuth for specifically setting persistence in webviews
    authInstance = initializeAuth(app, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence]
    });
} else {
    // getAuth automatically includes browserPopupRedirectResolver which is required for signInWithPopup
    authInstance = getAuth(app);
}

export const auth = authInstance;

export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export default app;
