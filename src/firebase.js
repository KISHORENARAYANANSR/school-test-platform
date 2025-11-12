// Import the functions you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCIkhMbg0sj3_VPWFMCUcVbTIzXYgf0e-8",
  authDomain: "school-test-platform-4d876.firebaseapp.com",
  projectId: "school-test-platform-4d876",
  storageBucket: "school-test-platform-4d876.firebasestorage.app",
  messagingSenderId: "173201682",
  appId: "1:173201682:web:cfa742e9f32217d472fbcb",
  measurementId: "G-68N6BZ57W0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// ✅ Export everything needed
export { app, analytics, db, auth };
