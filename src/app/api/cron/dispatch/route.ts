import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, updateDoc, doc, getFirestore } from 'firebase/firestore';
import { nowJST, isTimeToSend, timestampToDate } from '@/lib/time';
import { decryptLineCredentials } from '@/lib/crypto';
import { broadcastLineMessage } from '@/lib/line';
import { performanceMonitor, logger } from '@/lib/monitoring';

export const runtime = 'nodejs';
export const preferredRegion = ['hnd1'];

// Vercel Cron認証
const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Cron認証チェック
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      logger.warn('Unauthorized cron access attempt', {
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentTime = nowJST();
    logger.info('Cron dispatch started', { 
      currentTime: currentTime.toISOString(),
      timezone: 'Asia/Tokyo'
    });

    const db = getFirestore();
    let totalProcessed = 0;
    let successCount = 0;
    let errorCount = 0;

    // 全店舗のキューイング済みキャンペーンを取得
    const shopsSnapshot = await getDocs(collection(db, 'shops'));
    
    for (const shopDoc of shopsSnapshot.docs) {
      const shopId = shopDoc.id;
      const shopData = shopDoc.data();
      
      try {
        // 配信予定のキャンペーンを検索
        const campaignsQuery = query(
          collection(db, 'shops', shopId, 'campaigns'),
          where('status', '==', 'queued'),
          where('sendAt', '!=', null)
        );
        
        const campaignsSnapshot = await getDocs(campaignsQuery);
        
        for (const campaignDoc of campaignsSnapshot.docs) {
          const campaignData = campaignDoc.data();
          const sendAt = timestampToDate(campaignData.sendAt);
          
          // 配信時間チェック
          if (isTimeToSend(sendAt, currentTime)) {
            totalProcessed++;
            
            try {
              // キャンペーンステータスを「配信中」に更新
              await updateDoc(doc(db, 'shops', shopId, 'campaigns', campaignDoc.id), {
                status: 'sending',
                lastAttemptAt: new Date()
              });

              // LINEトークンを復号化
              const lineCredentials = decryptLineCredentials(
                shopData.line.accessToken,
                shopData.line.channelSecret
              );

              // LINE配信実行
              const success = await broadcastLineMessage(
                lineCredentials.accessToken,
                campaignData.content
              );

              if (success) {
                // 配信成功
                await updateDoc(doc(db, 'shops', shopId, 'campaigns', campaignDoc.id), {
                  status: 'sent',
                  result: {
                    lineMessageId: `msg_${Date.now()}` // 実際のIDはLINE APIから取得
                  }
                });
                
                successCount++;
                logger.info('Campaign sent successfully', {
                  shopId,
                  campaignId: campaignDoc.id,
                  title: campaignData.title
                });
              } else {
                throw new Error('LINE API failed');
              }
              
            } catch (error) {
              errorCount++;
              
              // 配信失敗
              await updateDoc(doc(db, 'shops', shopId, 'campaigns', campaignDoc.id), {
                status: 'failed',
                result: {
                  error: error instanceof Error ? error.message : 'Unknown error'
                }
              });
              
              logger.error('Campaign send failed', {
                shopId,
                campaignId: campaignDoc.id,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          }
        }
        
      } catch (error) {
        logger.error('Error processing shop campaigns', {
          shopId,
          shopName: shopData.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // メトリクス記録
    const duration = Date.now() - startTime;
    performanceMonitor.recordMetric('cron_execution_time', duration, 'ms');
    performanceMonitor.recordMetric('campaigns_processed', totalProcessed, 'count');
    performanceMonitor.recordMetric('campaigns_success', successCount, 'count');
    performanceMonitor.recordMetric('campaigns_failed', errorCount, 'count');

    logger.info('Cron dispatch completed', {
      duration: `${duration}ms`,
      totalProcessed,
      successCount,
      errorCount
    });

    return NextResponse.json({
      success: true,
      processed: totalProcessed,
      successful: successCount,
      failed: errorCount,
      duration: `${duration}ms`,
      timestamp: currentTime.toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Cron dispatch failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration}ms`
    });

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      duration: `${duration}ms`
    }, { status: 500 });
  }
}

// POSTメソッドは手動実行用（テスト目的）
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Manual execution not allowed in production' }, { status: 403 });
  }
  
  logger.info('Manual cron execution triggered');
  return GET(request);
}