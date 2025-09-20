// JST時間管理システム（v0.1仕様対応）
import { Timestamp } from 'firebase/firestore';
import { SendTiming } from '@/types';

export const TIMEZONE = "Asia/Tokyo";

/**
 * 現在のJST時間を取得
 */
export function nowJST(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: TIMEZONE }));
}

/**
 * 日時に指定時間を加算
 */
export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + (hours * 60 * 60 * 1000));
}

/**
 * 日時に指定日数を加算
 */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + (days * 24 * 60 * 60 * 1000));
}

/**
 * 指定した日時の9時JST設定
 */
export function setTo9AM(date: Date): Date {
  const jstDate = new Date(date.toLocaleString("en-US", { timeZone: TIMEZONE }));
  jstDate.setHours(9, 0, 0, 0);
  return jstDate;
}

/**
 * SendTimingに基づいて配信予定時刻を計算
 */
export function calculateSendTime(timing: SendTiming, baseTime?: Date): Date | null {
  const base = baseTime || nowJST();
  
  switch (timing) {
    case 'now':
      return null; // 即時配信
      
    case 'in1hour':
      return addHours(base, 1);
      
    case 'tomorrow9am':
      const tomorrow = addDays(base, 1);
      return setTo9AM(tomorrow);
      
    default:
      throw new Error(`Invalid timing: ${timing}`);
  }
}

/**
 * Date to Firestore Timestamp変換
 */
export function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

/**
 * Firestore Timestamp to Date変換
 */
export function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

/**
 * JST時間文字列フォーマット
 */
export function formatJST(date: Date, format: 'datetime' | 'date' | 'time' = 'datetime'): string {
  const jstDate = new Date(date.toLocaleString("en-US", { timeZone: TIMEZONE }));
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  switch (format) {
    case 'date':
      return jstDate.toLocaleDateString('ja-JP');
    case 'time':
      return jstDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    case 'datetime':
    default:
      return jstDate.toLocaleString('ja-JP', options);
  }
}

/**
 * 営業時間チェック
 */
export function isBusinessHours(date: Date, businessHours: string): boolean {
  try {
    // "11:00-23:00" 形式をパース
    const [start, end] = businessHours.split('-');
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const jstDate = new Date(date.toLocaleString("en-US", { timeZone: TIMEZONE }));
    const currentHour = jstDate.getHours();
    const currentMin = jstDate.getMinutes();
    const currentMinutes = currentHour * 60 + currentMin;
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    // 深夜営業対応（23:00-02:00など）
    if (endMinutes < startMinutes) {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
    
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } catch (error) {
    console.error('Business hours check failed:', error);
    return false;
  }
}

/**
 * 配信可能時間の推奨チェック
 */
export function getRecommendedSendTime(businessHours: string, requestedTime?: Date): Date {
  const baseTime = requestedTime || nowJST();
  
  // 営業時間内なら即座に送信
  if (isBusinessHours(baseTime, businessHours)) {
    return baseTime;
  }
  
  // 営業時間外なら次の営業開始時間を推奨
  try {
    const [start] = businessHours.split('-');
    const [startHour, startMin] = start.split(':').map(Number);
    
    const tomorrow = addDays(baseTime, 1);
    const nextBusinessStart = new Date(tomorrow.toLocaleString("en-US", { timeZone: TIMEZONE }));
    nextBusinessStart.setHours(startHour, startMin, 0, 0);
    
    return nextBusinessStart;
  } catch (error) {
    console.error('Failed to calculate recommended send time:', error);
    return addHours(baseTime, 1); // フォールバック：1時間後
  }
}

/**
 * Cron実行用：現在時刻に配信すべきキャンペーンの時間範囲チェック
 */
export function isTimeToSend(scheduledTime: Date, currentTime?: Date): boolean {
  const now = currentTime || nowJST();
  const scheduled = new Date(scheduledTime.toLocaleString("en-US", { timeZone: TIMEZONE }));
  
  // 1分の誤差範囲内で配信対象とする
  const diff = Math.abs(now.getTime() - scheduled.getTime());
  return diff <= 60000; // 60秒以内
}

/**
 * デバッグ用：時間情報表示
 */
export function debugTimeInfo(date?: Date) {
  const target = date || nowJST();
  return {
    utc: target.toISOString(),
    jst: formatJST(target),
    unix: target.getTime(),
    timezone: TIMEZONE
  };
}