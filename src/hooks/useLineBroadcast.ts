'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface BroadcastResult {
  success: boolean;
  messageId?: string;
  sentAt?: string;
  error?: string;
}

interface UseLineBroadcastReturn {
  sendBroadcast: (shopId: string, message: string) => Promise<BroadcastResult>;
  loading: boolean;
  error: string | null;
}

export function useLineBroadcast(): UseLineBroadcastReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthToken } = useAuth();

  const sendBroadcast = async (shopId: string, message: string): Promise<BroadcastResult> => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('認証トークンを取得できませんでした');
      }

      const requestBody = {
        shopId,
        message: {
          type: 'text' as const,
          text: message
        }
      };

      const response = await fetch('/api/line/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return {
        success: true,
        messageId: data.messageId,
        sentAt: data.sentAt
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'メッセージの送信に失敗しました';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    sendBroadcast,
    loading,
    error
  };
}