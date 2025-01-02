import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBYSAhstX5INt2xkwOlGmg3wAruQBEZ3AI",
  authDomain: "mydayplanner-e2f6b.firebaseapp.com",
  projectId: "mydayplanner-e2f6b",
  storageBucket: "mydayplanner-e2f6b.firebasestorage.app",
  messagingSenderId: "504906871040",
  appId: "1:504906871040:web:f4b5523b133d873e4f43e5",
  measurementId: "G-3PX2KQGC03"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
