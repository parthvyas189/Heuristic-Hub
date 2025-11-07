// --- PASTE YOUR FIREBASE CONFIG OBJECT HERE ---
const firebaseConfig = {
    apiKey: "AIzaSyAwKdSfmh9sL9dYqtBKk-BXS-v4Kut-pYM",
    authDomain: "heuristic-hub.firebaseapp.com",
    projectId: "heuristic-hub",
    storageBucket: "heuristic-hub.firebasestorage.app",
    messagingSenderId: "548471264301",
    appId: "1:548471264301:web:fdb0f7beeefccd827694a4"
  };



// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();