import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

const firebaseEnv = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
};

const hasPlaceholderFirebaseConfig = [
  firebaseEnv.apiKey === 'your_firebase_api_key',
  firebaseEnv.authDomain === 'your_project.firebaseapp.com',
  firebaseEnv.projectId === 'your_project_id',
  firebaseEnv.storageBucket === 'your_project.appspot.com',
  firebaseEnv.messagingSenderId === 'your_sender_id',
  firebaseEnv.appId === 'your_app_id',
  firebaseEnv.databaseURL === 'https://your_project-default-rtdb.firebaseio.com',
].some(Boolean);

export const FIREBASE_CONFIGURED =
  Boolean(firebaseEnv.projectId && firebaseEnv.apiKey && firebaseEnv.appId) && !hasPlaceholderFirebaseConfig;

const firebaseConfig = {
  ...firebaseEnv,
};

const app = initializeApp(firebaseConfig);

export const db = FIREBASE_CONFIGURED ? getFirestore(app) : null;
export const rtdb = FIREBASE_CONFIGURED && firebaseConfig.databaseURL ? getDatabase(app) : null;
export const auth = FIREBASE_CONFIGURED ? getAuth(app) : null;
export default app;
