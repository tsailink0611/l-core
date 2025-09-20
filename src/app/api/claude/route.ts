import { NextRequest, NextResponse } from 'next/server';
import { generateProposals } from '@/lib/claude';
import { validateLineMessage, sanitizeInput } from '@/lib/validation';
import { getClientIP, sanitizeLogData } from '@/lib/security';
import { assertAuth } from '@/lib/auth-mock';
import { ClaudeRequestSchema, validateAndParse } from '@/lib/schemas';
import { logger } from '@/lib/monitoring';

export const runtime = 'nodejs';
export const preferredRegion = ['hnd1'];

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = getClientIP(request);

  try {
    // 認証チェック
    const authUser = await assertAuth(request);

    // リクエストボディの解析
    const body = await request.json();

    // Zodバリデーション
    const validation = validateAndParse(ClaudeRequestSchema, body);
    if (!validation.success) {
      logger.warn('Claude API: Validation failed', {
        ip: clientIP,
        userId: authUser.uid,
        errors: validation.errors
      });
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.errors },
        { status: 400 }
      );
    }

    const { request: userRequest, shop } = validation.data;

    // 店舗所有者チェック
    if (shop.ownerId !== authUser.uid) {
      logger.warn('Claude API: Unauthorized shop access', {
        ip: clientIP,
        userId: authUser.uid,
        shopId: shop.id,
        shopOwnerId: shop.ownerId
      });
      return NextResponse.json(
        { error: 'Unauthorized access to shop' },
        { status: 403 }
      );
    }

    // Claude API呼び出し
    const response = await generateProposals(userRequest, shop);

    // レスポンス時間ログ
    const duration = Date.now() - startTime;
    logger.info('Claude API success', {
      ip: clientIP,
      userId: authUser.uid,
      shopId: shop.id,
      duration: `${duration}ms`,
      proposalsCount: response.proposals?.length || 0
    });

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Response-Time': `${duration}ms`
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    // 認証エラーハンドリング
    if (error instanceof Error && error.message.includes('authorization')) {
      logger.warn('Claude API: Unauthorized access', {
        ip: clientIP,
        error: error.message,
        duration: `${duration}ms`
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    logger.error('Claude API route error', {
      error: sanitizeLogData(error),
      ip: clientIP,
      duration: `${duration}ms`
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}