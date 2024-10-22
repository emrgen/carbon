// Import the functions you need from the SDKs you need
import {FirebaseApp, initializeApp} from "@firebase/app";
// import { getAnalytics } from "firebase/analytics";
import {useMemo} from "react";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDX8KVx277H_yUmwzy9bvQd8BfBy3C_bI4",
  authDomain: "tinyquizio.firebaseapp.com",
  projectId: "tinyquizio",
  storageBucket: "tinyquizio.appspot.com",
  messagingSenderId: "55044959139",
  appId: "1:55044959139:web:7a23bd947775e0bc2f0816",
  measurementId: "G-EKW2TKGKW1"
};
// singleton pattern to initialize firebase app
let firebaseApp: FirebaseApp = null as any;

export const useFirebase = () => {
  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
  }

  return useMemo(() => firebaseApp, []);
};
