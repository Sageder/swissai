import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBdOCQZENHcKx73ER8AWD-LMKPCEHa8PnE",
  authDomain: "swissrehack.firebaseapp.com",
  projectId: "swissrehack",
  storageBucket: "swissrehack.firebasestorage.app",
  messagingSenderId: "434152564537",
  appId: "1:434152564537:web:94c496e9e67d8c66b66ae8",
  measurementId: "G-R0C3LHV3J8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
