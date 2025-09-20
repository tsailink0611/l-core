// 本番環境監視システム
export interface MetricData {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

export class PerformanceMonitor {
  private metrics: MetricData[] = [];
  private readonly maxMetrics = 1000;

  recordMetric(name: string, value: number, unit: string, tags?: Record<string, string>) {
    const metric: MetricData = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      tags
    };

    this.metrics.push(metric);

    // 古いメトリクスを削除してメモリを管理
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // 本番環境では外部サービスに送信
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(metric);
    }
  }

  private async sendToMonitoringService(metric: MetricData) {
    // 実際の実装では Datadog, New Relic, CloudWatch などに送信
    try {
      // 例: await fetch('https://monitoring-service.com/metrics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(metric)
      // });
      console.log('Metric sent to monitoring service:', metric);
    } catch (error) {
      console.error('Failed to send metric:', error);
    }
  }

  getMetrics(name?: string): MetricData[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }

  getAverageMetric(name: string, timeWindow: number = 300000): number {
    const cutoff = new Date(Date.now() - timeWindow).toISOString();
    const recentMetrics = this.metrics.filter(
      m => m.name === name && m.timestamp > cutoff
    );

    if (recentMetrics.length === 0) return 0;

    const sum = recentMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / recentMetrics.length;
  }

  // アラート条件をチェック
  checkAlerts(): void {
    const avgResponseTime = this.getAverageMetric('api_response_time');
    const errorRate = this.getAverageMetric('error_rate');

    if (avgResponseTime > 5000) { // 5秒以上
      this.sendAlert('high_response_time', `Average response time: ${avgResponseTime}ms`);
    }

    if (errorRate > 0.05) { // 5%以上
      this.sendAlert('high_error_rate', `Error rate: ${(errorRate * 100).toFixed(2)}%`);
    }
  }

  private sendAlert(type: string, message: string) {
    console.error(`ALERT [${type}]: ${message}`);
    // 実際の実装では Slack, Discord, PagerDuty などに通知
  }
}

export class Logger {
  private logs: LogEntry[] = [];
  private readonly maxLogs = 5000;

  log(level: LogEntry['level'], message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context
    };

    this.logs.push(entry);

    // 古いログを削除
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // コンソール出力（開発環境）
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${entry.level.toUpperCase()}] ${entry.message}`, context);
    }

    // 本番環境では外部ログサービスに送信
    if (process.env.NODE_ENV === 'production') {
      this.sendToLogService(entry);
    }
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>) {
    this.log('error', message, context);
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }

  private async sendToLogService(entry: LogEntry) {
    // 実際の実装では Cloudflare Logs, Vercel Analytics などに送信
    try {
      // バッチ処理で効率化
      console.log('Log sent to service:', entry);
    } catch (error) {
      console.error('Failed to send log:', error);
    }
  }

  getLogs(level?: LogEntry['level'], limit: number = 100): LogEntry[] {
    let filteredLogs = level ? 
      this.logs.filter(log => log.level === level) : 
      this.logs;

    return filteredLogs.slice(-limit);
  }
}

// シングルトンインスタンス
export const performanceMonitor = new PerformanceMonitor();
export const logger = new Logger();

// Next.js API用のミドルウェア関数
export function withMonitoring<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  operationName: string
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    
    try {
      const result = await handler(...args);
      
      // 成功メトリクス
      performanceMonitor.recordMetric(
        'api_response_time',
        Date.now() - startTime,
        'ms',
        { operation: operationName, status: 'success' }
      );

      logger.info(`Operation completed: ${operationName}`, {
        duration: Date.now() - startTime,
        operation: operationName
      });

      return result;
    } catch (error) {
      // エラーメトリクス
      performanceMonitor.recordMetric(
        'api_response_time',
        Date.now() - startTime,
        'ms',
        { operation: operationName, status: 'error' }
      );

      performanceMonitor.recordMetric(
        'error_rate',
        1,
        'count',
        { operation: operationName }
      );

      logger.error(`Operation failed: ${operationName}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        operation: operationName
      });

      throw error;
    }
  };
}

// リソース使用量監視
export function startResourceMonitoring() {
  if (typeof window !== 'undefined') {
    // クライアントサイドでのパフォーマンス監視
    if ('performance' in window) {
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        performanceMonitor.recordMetric('page_load_time', perfData.loadEventEnd - perfData.fetchStart, 'ms');
        performanceMonitor.recordMetric('dom_content_loaded', perfData.domContentLoadedEventEnd - perfData.fetchStart, 'ms');
        
        logger.info('Page performance metrics recorded', {
          loadTime: perfData.loadEventEnd - perfData.fetchStart,
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart
        });
      });
    }
  }

  // 定期的なアラートチェック（5分間隔）
  setInterval(() => {
    performanceMonitor.checkAlerts();
  }, 300000);
}