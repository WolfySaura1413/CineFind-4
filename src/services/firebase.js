// Firebase Initialisation
// All Firebase SDK imports use the CDN ES module build — no bundler required.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyApoNj1bvDbyNQrtiJb1SWd5651wyuA-xU",
  authDomain:        "cinefind-alaskapayurbills12.firebaseapp.com",
  projectId:         "cinefind-alaskapayurbills12",
  storageBucket:     "cinefind-alaskapayurbills12.firebasestorage.app",
  messagingSenderId: "804783115290",
  appId:             "1:804783115290:web:cabe6f463da24f9e8ad5a3",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);
