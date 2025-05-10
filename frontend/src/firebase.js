// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";  // Add this import

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDs6PG4W4712y5LbF1cW7qCbxDjoJJ5uhw",
  authDomain: "scalovate-4c9d8.firebaseapp.com",
  projectId: "scalovate-4c9d8",
  storageBucket: "scalovate-4c9d8.firebasestorage.app",
  messagingSenderId: "1017180731219",
  appId: "1:1017180731219:web:126e776b57b46d29da53a6",
  measurementId: "G-P1K3VDWQWN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firestore
const db = getFirestore(app);

// Export db for use in other files
export { db };
