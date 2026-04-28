import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBxuMEFjkz11gCF7GTKq64BbBFsQ8gYY9M",
  authDomain: "qa-dashboard-gustavo.firebaseapp.com",
  databaseURL: "https://qa-dashboard-gustavo-default-rtdb.firebaseio.com",
  projectId: "qa-dashboard-gustavo",
  storageBucket: "qa-dashboard-gustavo.firebasestorage.app",
  messagingSenderId: "25703842619",
  appId: "1:25703842619:web:38f0089bd5574e6a4bad1e",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
