// Firebase Admin SDK - Lean & Safe Implementation
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { NextRequest } from 'next/server';

// Firebase Admin初期化（シングルトン）
function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!privateKey || !clientEmail || !projectId) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Firebase Admin not configured - using development mode');
      return null;
    }
    throw new Error('Firebase Admin configuration missing');
  }

  try {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'), // 改行文字を正規化
      }),
      projectId,
    });
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
    throw new Error('Failed to initialize Firebase Admin');
  }
}

// Admin SDKインスタンス
export const adminApp = initializeFirebaseAdmin();
export const adminAuth = adminApp ? getAuth(adminApp) : null;
export const adminDb = adminApp ? getFirestore(adminApp) : null;

/**
 * API認証ガード - Bearer Token検証
 */
export async function assertAuth(request: NextRequest): Promise<{
  uid: string;
  email: string;
  verified: boolean;
}> {
  if (!adminAuth) {
    throw new Error('Firebase Admin not initialized');
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const idToken = authHeader.substring(7); // "Bearer " を除去

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      verified: decodedToken.email_verified || false
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * 店舗アクセス権限チェック
 */
export async function assertShopAccess(uid: string, shopId: string): Promise<void> {
  if (!adminDb) {
    throw new Error('Firestore Admin not initialized');
  }

  // シンプル権限モデル: uid === shopId (店舗オーナー)
  if (uid !== shopId) {
    throw new Error('Access denied: Not shop owner');
  }

  // 店舗存在確認
  const shopDoc = await adminDb.collection('shops').doc(shopId).get();
  if (!shopDoc.exists) {
    throw new Error('Shop not found');
  }
}

/**
 * 開発環境用認証バイパス
 */
export function getDevAuth(): {
  uid: string;
  email: string;
  verified: boolean;
} | null {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return {
    uid: 'dev-user-001',
    email: 'dev@example.com',
    verified: true
  };
}

/**
 * 認証ヘルパー - 開発環境対応
 */
export async function getAuthUser(request: NextRequest) {
  // 開発環境でのバイパス
  if (process.env.NODE_ENV === 'development' && process.env.USE_DEV_AUTH === 'true') {
    const devAuth = getDevAuth();
    if (devAuth) {
      console.warn('Using development auth bypass');
      return devAuth;
    }
  }

  return await assertAuth(request);
}