import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Determine if the loaded config is placeholder
const isPlaceholder = !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('placeholder');

let app;
let auth: any = null;
let db: any = null;
let googleProvider: any = null;

if (!isPlaceholder) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
    googleProvider = new GoogleAuthProvider();
    
    // Validate connection to Firestore as per critical constraint
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  } catch (err) {
    console.warn("Firebase initialization failed:", err);
  }
}

export { auth, db, googleProvider, signInWithPopup, signOut, isPlaceholder };
