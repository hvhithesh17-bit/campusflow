// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCTFyL5m6TN0hsVOqlcBGCOgyJYjbvqBpc",
  authDomain: "campusflowco.firebaseapp.com",
  projectId: "campusflowco",
  storageBucket: "campusflowco.firebasestorage.app",
  messagingSenderId: "1035025180595",
  appId: "1:1035025180595:web:6a21f4b769fb26b86f8dc6",
  measurementId: "G-SYYTJQ2D66"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
