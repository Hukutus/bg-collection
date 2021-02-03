import * as firebase from 'firebase/app';
import '@firebase/firestore';
import {firebaseConfig} from "../config";

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app(); // if already initialized, use that one
}

export { firebase };
