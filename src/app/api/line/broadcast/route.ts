import { NextRequest, NextResponse } from 'next/server';
import { getShop } from '@/lib/db-mock';
import { decryptLineCredentials } from '@/lib/crypto';
import { broadcastLineMessage } from '@/lib/line';
import { assertAuth } from '@/lib/auth-mock';
import { getClientIP, sanitizeLogData } from '@/lib/security';
import { validateAndParse, LineMessageSchema } from '@/lib/schemas';
import { logger } from '@/lib/monitoring';

export const runtime = 'nodejs';
export const preferredRegion = ['hnd1'];

interface BroadcastRequest {
  shopId: string;
  message: {
    type: 'text';
    text: string;
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = getClientIP(request);

  try {
    // 認証チェック
    const authUser = await assertAuth(request);

    // リクエストボディの解析
    const body = await request.json();
    const { shopId, message } = body as BroadcastRequest;

    // 基本バリデーション
    if (!shopId || !message) {
      logger.warn('LINE broadcast: Missing parameters', {
        ip: clientIP,
        userId: authUser.uid,
        hasShopId: !!shopId,
        hasMessage: !!message
      });
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // メッセージバリデーション
    const messageValidation = validateAndParse(LineMessageSchema, message);
    if (!messageValidation.success) {
      logger.warn('LINE broadcast: Invalid message format', {
        ip: clientIP,
        userId: authUser.uid,
        shopId,
        errors: messageValidation.errors
      });
      return NextResponse.json(
        { error: 'Invalid message format', details: messageValidation.errors },
        { status: 400 }
      );
    }

    // 店舗情報を取得
    const shopDoc = await getShop(shopId);
    if (!shopDoc.exists()) {
      logger.warn('LINE broadcast: Shop not found', {
        ip: clientIP,
        userId: authUser.uid,
        shopId
      });
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const shop = shopDoc.data();

    // 店舗所有者チェック
    if (shop.ownerId !== authUser.uid) {
      logger.warn('LINE broadcast: Unauthorized shop access', {
        ip: clientIP,
        userId: authUser.uid,
        shopId,
        shopOwnerId: shop.ownerId
      });
      return NextResponse.json(
        { error: 'Unauthorized access to shop' },
        { status: 403 }
      );
    }

    // 暗号化されたLINE設定を復号
    let lineCredentials;
    try {
      lineCredentials = decryptLineCredentials(
        shop.line.accessToken,
        shop.line.channelSecret
      );
    } catch (error) {
      logger.error('LINE broadcast: Failed to decrypt credentials', {
        shopId,
        userId: authUser.uid,
        error: sanitizeLogData(error)
      });
      return NextResponse.json(
        { error: 'LINE configuration error' },
        { status: 500 }
      );
    }

    // LINE配信実行
    const success = await broadcastLineMessage(
      lineCredentials.accessToken,
      messageValidation.data.text
    );

    const duration = Date.now() - startTime;

    if (success) {
      logger.info('LINE broadcast sent successfully', {
        ip: clientIP,
        userId: authUser.uid,
        shopId,
        messageLength: messageValidation.data.text.length,
        duration: `${duration}ms`
      });

      return NextResponse.json({
        success: true,
        messageId: `broadcast_${Date.now()}`,
        sentAt: new Date().toISOString()
      }, {
        headers: {
          'X-Response-Time': `${duration}ms`
        }
      });
    } else {
      logger.error('LINE broadcast failed', {
        ip: clientIP,
        userId: authUser.uid,
        shopId,
        duration: `${duration}ms`
      });

      return NextResponse.json(
        { error: 'Failed to send broadcast message' },
        { status: 500 }
      );
    }

  } catch (error) {
    const duration = Date.now() - startTime;

    // 認証エラーハンドリング
    if (error instanceof Error && error.message.includes('authorization')) {
      logger.warn('LINE broadcast: Unauthorized access', {
        ip: clientIP,
        error: error.message,
        duration: `${duration}ms`
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    logger.error('LINE broadcast route error', {
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