import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const missingFirebaseEnvVars: readonly string[] = [];
export const firebaseEnvIssue: string | null = null;

const firebaseConfig = {
  apiKey: 'AIzaSyChQlKpNuvihHXB3s37HiuaKpcMm9pjz_M',
  authDomain: 'cards-cb43a.firebaseapp.com',
  projectId: 'cards-cb43a',
  storageBucket: 'cards-cb43a.firebasestorage.app',
  messagingSenderId: '850105888035',
  appId: '1:850105888035:web:8ffc67dfefdfe7556ab096',
  measurementId: 'G-CMLMCH49FJ',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
