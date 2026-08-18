// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
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
