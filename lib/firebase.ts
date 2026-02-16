import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDnqqIGcLMrP98sZGXqIlUK5h74VZXbxZ8",
  authDomain: "gymbro-d9ca7.firebaseapp.com",
  projectId: "gymbro-d9ca7",
  storageBucket: "gymbro-d9ca7.firebasestorage.app",
  messagingSenderId: "206255407897",
  appId: "1:206255407897:web:346f30a3f394b40b763b88"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
