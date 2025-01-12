import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";

dotenv.config(); // Load environment variables from .env file

const firebaseConfig = {
  apiKey: "AIzaSyAQH-wAC_ivKww761TGEyWcHT5Omp8CB9w",
  authDomain: "mydayplanner-a6270.firebaseapp.com",
  projectId: "mydayplanner-a6270",
  storageBucket: "mydayplanner-a6270.firebasestorage.app",
  messagingSenderId: "773568755866",
  appId: "1:773568755866:web:e5c70331f78a71c1828723",
  measurementId: "G-CNX3BQTE17"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
