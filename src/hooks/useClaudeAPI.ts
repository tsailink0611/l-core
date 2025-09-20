'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ClaudeRequest, ClaudeResponse } from '@/lib/schemas';

interface UseClaudeAPIReturn {
  generateProposals: (request: string, shop: any) => Promise<ClaudeResponse | null>;
  loading: boolean;
  error: string | null;
}

export function useClaudeAPI(): UseClaudeAPIReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthToken } = useAuth();

  const generateProposals = async (request: string, shop: any): Promise<ClaudeResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('認証トークンを取得できませんでした');
      }

      const requestBody: ClaudeRequest = {
        request,
        shop
      };

      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: ClaudeResponse = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI提案の生成に失敗しました';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateProposals,
    loading,
    error
  };
}