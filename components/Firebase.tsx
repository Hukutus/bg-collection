import * as firebase from 'firebase';
import '@firebase/firestore';

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDYRRP5-xRd4PXn0gCR2CgnJiWQ0A3sQEc",
  authDomain: "bg-collection-app.firebaseapp.com",
  databaseURL: "https://bg-collection-app-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "bg-collection-app",
  storageBucket: "bg-collection-app.appspot.com",
  messagingSenderId: "515100894425",
  appId: "1:515100894425:web:9a10dfe7c2a58b4ade0ac8"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app(); // if already initialized, use that one
}

export { firebase };
