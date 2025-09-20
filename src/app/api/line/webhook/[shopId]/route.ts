import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { decrypt } from '@/lib/crypto';
import { getClientIP, sanitizeLogData } from '@/lib/security';
import { validateLineMessage } from '@/lib/validation';
import { logger } from '@/lib/monitoring';
import { Shop } from '@/types';

export const runtime = 'nodejs';
export const preferredRegion = ['hnd1'];

interface RouteParams {
  params: Promise<{ shopId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  const clientIP = getClientIP(request);
  const resolvedParams = await params;
  const { shopId } = resolvedParams;

  try {
    // 店舗情報を取得
    const shopDoc = await getDoc(doc(db, 'shops', shopId));
    if (!shopDoc.exists()) {
      logger.warn('LINE webhook: Shop not found', { shopId, ip: clientIP });
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const shop = shopDoc.data() as Shop;

    // 暗号化されたLINE設定を復号
    let channelSecret: string;
    try {
      channelSecret = decrypt(shop.line.channelSecret);
    } catch (error) {
      logger.error('LINE webhook: Failed to decrypt channel secret', {
        shopId,
        error: sanitizeLogData(error)
      });
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    const body = await request.text();
    const signature = request.headers.get('x-line-signature');

    // 署名検証
    if (!signature) {
      logger.warn('LINE webhook: Missing signature', { shopId, ip: clientIP });
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // LINEシグネチャ検証（店舗固有のchannel secretを使用）
    const hash = crypto
      .createHmac('sha256', channelSecret)
      .update(body)
      .digest('base64');

    if (signature !== `${hash}`) {
      logger.warn('LINE webhook: Invalid signature', {
        shopId,
        ip: clientIP,
        receivedSignature: signature.substring(0, 10) + '...'
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // イベント処理
    const webhookData = JSON.parse(body);
    const events = webhookData.events || [];

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const messageText = event.message.text;
        const userId = event.source.userId;

        // メッセージの検証
        const validation = validateLineMessage(messageText);
        if (!validation.isValid) {
          logger.warn('LINE webhook: Invalid message', {
            shopId,
            userId: userId ? userId.substring(0, 8) + '...' : 'unknown',
            errors: validation.errors
          });
          continue;
        }

        // 店舗固有のメッセージ処理
        await processShopMessage(shopId, userId, messageText, shop);
      } else if (event.type === 'follow') {
        // フォローイベントの処理
        const userId = event.source.userId;
        await processFollowEvent(shopId, userId, shop);
      } else if (event.type === 'unfollow') {
        // アンフォローイベントの処理
        const userId = event.source.userId;
        await processUnfollowEvent(shopId, userId, shop);
      }
    }

    const duration = Date.now() - startTime;
    logger.info('LINE webhook processed successfully', {
      shopId,
      eventsCount: events.length,
      duration: `${duration}ms`,
      ip: clientIP
    });

    return NextResponse.json({ status: 'ok' }, {
      headers: {
        'X-Response-Time': `${duration}ms`
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('LINE webhook error', {
      shopId,
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

async function processShopMessage(
  shopId: string,
  userId: string,
  messageText: string,
  shop: Shop
): Promise<void> {
  logger.info('Processing shop message', {
    shopId,
    userId: userId ? userId.substring(0, 8) + '...' : 'unknown',
    messageLength: messageText.length,
    industry: shop.industry
  });

  // 業界別の自動応答ロジック
  const autoResponse = generateAutoResponse(messageText, shop);
  if (autoResponse) {
    // TODO: 自動応答メッセージの送信を実装
    logger.info('Auto response generated', {
      shopId,
      userId: userId ? userId.substring(0, 8) + '...' : 'unknown',
      responseType: autoResponse.type
    });
  }

  // 特定のキーワードでの処理
  if (messageText.includes('問い合わせ') || messageText.includes('予約')) {
    logger.info('Customer support notification triggered', {
      shopId,
      keyword: messageText.includes('問い合わせ') ? '問い合わせ' : '予約'
    });
  }
}

async function processFollowEvent(
  shopId: string,
  userId: string,
  shop: Shop
): Promise<void> {
  logger.info('Processing follow event', {
    shopId,
    userId: userId ? userId.substring(0, 8) + '...' : 'unknown',
    shopName: shop.name
  });

  // ウェルカムメッセージの送信ロジックをここに実装
  // TODO: 店舗固有のウェルカムメッセージを送信
}

async function processUnfollowEvent(
  shopId: string,
  userId: string,
  shop: Shop
): Promise<void> {
  logger.info('Processing unfollow event', {
    shopId,
    userId: userId ? userId.substring(0, 8) + '...' : 'unknown',
    shopName: shop.name
  });

  // アンフォロー時の処理ロジックをここに実装
}

function generateAutoResponse(messageText: string, shop: Shop): { type: string; content: string } | null {
  const industry = shop.industry;
  const businessHours = shop.config.businessHours;

  // 営業時間に関する問い合わせ
  if (messageText.includes('営業時間') || messageText.includes('何時') || messageText.includes('いつ')) {
    return {
      type: 'business_hours',
      content: `営業時間は${businessHours}です。お気軽にお越しください！`
    };
  }

  // 業界別の自動応答
  switch (industry) {
    case '飲食店':
      if (messageText.includes('メニュー') || messageText.includes('料理')) {
        return {
          type: 'menu_inquiry',
          content: '本日のおすすめメニューやコース料理について詳しくは、お電話またはご来店時にお尋ねください🍽️'
        };
      }
      break;

    case '美容院・サロン':
      if (messageText.includes('予約') || messageText.includes('空き')) {
        return {
          type: 'reservation_inquiry',
          content: 'ご予約承ります✨ お電話またはLINEでご希望の日時をお知らせください。'
        };
      }
      break;

    case 'エステ・リラクゼーション':
      if (messageText.includes('コース') || messageText.includes('料金')) {
        return {
          type: 'course_inquiry',
          content: '各種コースをご用意しております💆‍♀️ 詳細は店舗までお問い合わせください。'
        };
      }
      break;
  }

  return null;
}