import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// 🔥 本番Firebase設定 - ai-line-step-prod
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// 🔥 本番Firebase初期化
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics (ブラウザ環境でのみ初期化)
let analytics: any = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}
export { analytics };

// 開発環境でのエミュレーター接続（オプション）
if (process.env.NODE_ENV === 'development' && process.env.FIREBASE_EMULATOR_ENABLED === 'true') {
  if (!auth.config.emulator) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099');
    } catch (error) {
      console.warn('Auth emulator connection failed:', error);
    }
  }

  if (db?._delegate?._databaseId?.database && !db._delegate._databaseId.database.includes('(default)')) {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
    } catch (error) {
      console.warn('Firestore emulator connection failed:', error);
    }
  }
}

export default app;