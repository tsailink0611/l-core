import { NextResponse } from 'next/server';
import { healthCheckHandler } from '@/lib/health';
import { performanceMonitor, logger } from '@/lib/monitoring';

export const runtime = 'nodejs';
export const preferredRegion = ['hnd1'];

export async function GET() {
  const startTime = Date.now();
  
  try {
    const result = await healthCheckHandler();
    
    // メトリクス記録
    performanceMonitor.recordMetric(
      'health_check_duration',
      Date.now() - startTime,
      'ms'
    );

    logger.info('Health check completed', {
      status: result.data.overall,
      duration: Date.now() - startTime
    });

    return NextResponse.json(result.data, { 
      status: result.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'true'
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration
    });

    return NextResponse.json(
      {
        overall: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}