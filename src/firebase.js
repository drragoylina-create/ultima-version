import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCGOXJku6IeA82swYoRNlhwNA2g9rsNLuw",
  authDomain: "eternal-galaxy-e82c1.firebaseapp.com",
  projectId: "eternal-galaxy-e82c1",
  storageBucket: "eternal-galaxy-e82c1.firebasestorage.app",
  messagingSenderId: "1039864732982",
  appId: "1:1039864732982:web:31e27bd6ee06d2d8d62797"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);