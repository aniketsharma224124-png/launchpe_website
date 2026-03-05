/* ─────────────────────────────────────────
   firebase-config.js — Firebase Init

   ⚠️  REPLACE placeholders below with your
       actual Firebase config from:
       Firebase Console → Project Settings →
       General → Your apps → Web app config
───────────────────────────────────────── */

const firebaseConfig = {
    apiKey: "AIzaSyAudXOXTmJ2fDFX3KZh_-cua12RTnMJbtE",
    authDomain: "launchpe.firebaseapp.com",
    projectId: "launchpe",
    storageBucket: "launchpe.firebasestorage.app",
    messagingSenderId: "428742001146",
    appId: "1:428742001146:web:a84b193d96e390476ae443"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Global references
const auth = firebase.auth();
const db = firebase.firestore();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();

console.log('✅ Firebase initialized — project:', firebaseConfig.projectId);
