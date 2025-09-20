// Mock認証システム（MVP用）
import { NextRequest } from 'next/server';

export async function assertAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  // MVP: 固定ユーザーIDを返す（実際はJWT検証）
  return {
    uid: 'demo-user-123',
    email: 'demo@example.com',
    verified: true
  };
}