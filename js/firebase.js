import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, browserLocalPersistence, setPersistence } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAKqZ2PULMP4OFlcLOZH9vzF9qssjWhKvk",
  authDomain: "dark-odyssey.firebaseapp.com",
  databaseURL: "https://dark-odyssey-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dark-odyssey",
  storageBucket: "dark-odyssey.firebasestorage.app",
  messagingSenderId: "792578906518",
  appId: "1:792578906518:web:cf982f5e5bd748025ba5b7",
  measurementId: "G-PV7TXD0BZH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn("Auth persistence setup failed:", error);
});

const analyticsPromise = isSupported()
  .then((supported) => (supported ? getAnalytics(app) : null))
  .catch(() => null);

export { app, auth, db, rtdb, analyticsPromise };

