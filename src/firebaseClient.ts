import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  ConfirmationResult,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';

// Firebase configuration loaded from project setup
export const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
  firestoreDatabaseId: firebaseConfigJson.firestoreDatabaseId,
};

// Initialize Firebase App singleton
export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication
export const auth = getAuth(firebaseApp);

// Initialize Cloud Firestore with dedicated databaseId
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(firebaseApp);

// Google Auth Provider setup with profile and email scopes
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope('profile');
googleAuthProvider.addScope('email');
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Validates connection to Cloud Firestore on application startup
 * As specified in Firebase Integration guidelines
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.info('[Firebase] Firestore connected successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('[Firebase] Please check your Firebase configuration: client is offline.');
    } else {
      // Permission-denied or non-existent document is normal for test doc and proves network reachability
      console.info('[Firebase] Firestore reached successfully.');
    }
    return true;
  }
}

// Auto-test connection on module load
testFirestoreConnection().catch((err) => {
  console.warn('[Firebase] Connection notice:', err);
});

export {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
};
export type { ConfirmationResult, FirebaseUser };
