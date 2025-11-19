// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCKMhDqiPvaYn7KMVxk_YIjp8IdBQ0dRBE",
  authDomain: "bytedocker-64803.firebaseapp.com",
  databaseURL: "https://bytedocker-64803-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bytedocker-64803",
  storageBucket: "bytedocker-64803.firebasestorage.app",
  messagingSenderId: "343413923173",
  appId: "1:343413923173:web:47c2712cf51cfc355cd58c",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore DB
export const db = getFirestore(app);

// Firebase Storage
export const storage = getStorage(app);

export default app;
