import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore'; // <-- Add this


const firebaseConfig = {
  apiKey: "AIzaSyBjs5vNSmJK_E7nYzt1NFt94z2cRGcLzxE",
  authDomain: "carminder-f0fe1.firebaseapp.com",
  projectId: "carminder-f0fe1",
  storageBucket: "carminder-f0fe1.firebasestorage.app",
  messagingSenderId: "434129142322",
  appId: "1:434129142322:web:8ce8ab7b16d33afb19322b",
  measurementId: "G-ZSB5LNB9LM"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore(); // <-- Add this
export default firebase;
