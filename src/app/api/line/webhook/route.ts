import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/monitoring';
import { getClientIP } from '@/lib/security';

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);

  // v0.1では店舗別WebhookのみサポートするBREAKING CHANGE通知
  logger.warn('Legacy webhook endpoint accessed', {
    ip: clientIP,
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date().toISOString()
  });

  return NextResponse.json({
    error: 'This endpoint is deprecated',
    message: 'Please use shop-specific webhook: /api/line/webhook/[shopId]',
    migration_guide: {
      old_url: '/api/line/webhook',
      new_url: '/api/line/webhook/{your-shop-id}',
      note: 'Each shop must use their unique shopId in the webhook URL'
    }
  }, {
    status: 410, // Gone
    headers: {
      'X-Deprecated': 'true',
      'X-Migration-Guide': 'Use /api/line/webhook/[shopId]'
    }
  });
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'LINE Webhook API v0.1',
    endpoints: {
      webhook: '/api/line/webhook/[shopId]',
      method: 'POST',
      description: 'Shop-specific LINE webhook endpoint'
    },
    documentation: 'Each shop requires a unique webhook URL with their shopId'
  });
}