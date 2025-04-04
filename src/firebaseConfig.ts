// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// Your web app's Firebase configuration
// TODO: Consider moving sensitive keys to environment variables for production builds
const firebaseConfig = {
  apiKey: "AIzaSyAVCn02NeIdTGXBOrQZChz7xDUGx02rgdQ",
  authDomain: "horoscopozap.firebaseapp.com",
  projectId: "horoscopozap",
  storageBucket: "horoscopozap.appspot.com", // Corrected storage bucket domain
  messagingSenderId: "440494941769",
  appId: "1:440494941769:web:77b41d6346b065d1ccc198"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Export the initialized app instance for use in other parts of the app
export { firebaseApp };
