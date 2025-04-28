// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// ✅ Paste your Firebase config from the screenshot:
const firebaseConfig = {
  apiKey: "AIzaSyDFgj0pnKDjnwAAuUx_-_jU4rT_6HtAdjo",
  authDomain: "taskmanager-5dc74.firebaseapp.com",
  projectId: "taskmanager-5dc74",
  storageBucket: "taskmanager-5dc74.appspot.com",
  messagingSenderId: "983537645385",
  appId: "1:983537645385:web:5ab0192951efadc6cf8c98",
  measurementId: "G-98TSBVJ71S" 
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
