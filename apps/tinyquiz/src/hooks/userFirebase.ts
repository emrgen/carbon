// Import the functions you need from the SDKs you need
import {FirebaseApp, initializeApp} from "@firebase/app";
// import { getAnalytics } from "firebase/analytics";
import {useMemo} from "react";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBMAtvrWUxR38jTyp9o7G3qg9cmZ1j_Fl0",
  authDomain: "selo-93606.firebaseapp.com",
  projectId: "selo-93606",
  storageBucket: "selo-93606.appspot.com",
  messagingSenderId: "725569073423",
  appId: "1:725569073423:web:c18f08e115b74377870e7a",
  measurementId: "G-GQED5CX2KJ",
};

// singleton pattern to initialize firebase app
let firebaseApp: FirebaseApp;

export const useFirebase = () => {
  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
  }

  return useMemo(() => firebaseApp, []);
};
