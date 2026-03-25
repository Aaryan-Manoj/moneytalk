import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAbxMCG8yfONe2KMQjAdZqx_bKqKKlFeBw",
  authDomain: "moneytalk-6cbed.firebaseapp.com",
  projectId: "moneytalk-6cbed",
  storageBucket: "moneytalk-6cbed.firebasestorage.app",
  messagingSenderId: "412223129306",
  appId: "1:412223129306:web:8dae7af6463ef025db87e3",
  measurementId: "G-38KC7BS16T"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);