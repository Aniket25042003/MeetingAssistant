import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCW1JgFzLRm5cShljiCvU1RNPgTM8vuxB4",
  authDomain: "meetingassistant-4f53e.firebaseapp.com",
  projectId: "meetingassistant-4f53e",
  storageBucket: "meetingassistant-4f53e.firebasestorage.app",
  messagingSenderId: "861055197412",
  appId: "1:861055197412:web:2f24bf8a0acbdb760a0cf1",
  measurementId: "G-XJC4594X3W"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const firestore = firebase.firestore();
export const storage = firebase.storage();
export default firebase;
