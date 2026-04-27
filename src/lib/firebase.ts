import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCCd3di38JT8i1CYoa7XmkXnY-tvTq7tRg",
  authDomain: "taskflow-lab.firebaseapp.com",
  projectId: "taskflow-lab",
  storageBucket: "taskflow-lab.firebasestorage.app",
  messagingSenderId: "163720611809",
  appId: "1:163720611809:web:84a72c32e64e98afa0b4a0",
  measurementId: "G-5GF1KX9S97"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);

/**
 * NOTE: Firebase Dynamic Links (FDL) are deprecated as of 2025.
 * If adding "Email Link Authentication" or "OAuth" for mobile in the future,
 * ensure you use the new Firebase App Check and updated SDK patterns 
 * instead of legacy Dynamic Links to avoid breakages.
 */

export default app;
