'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface OpenAIProposal {
  id: string;
  title: string;
  message: string;
  timing: string;
  expectedEffect: string;
  confidence: number;
}

interface OpenAIResponse {
  success: boolean;
  proposals: OpenAIProposal[];
  metadata: {
    model: string;
    usage?: any;
    duration: number;
    isDemo: boolean;
    timestamp: string;
  };
}

export interface OpenAIConfig {
  model: 'gpt-5-mini' | 'gpt-5' | 'gpt-4o-mini';
  maxTokens?: number;
  temperature?: number;
}

export function useOpenAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthToken } = useAuth();

  const generateProposals = async (
    prompt: string,
    shop: any,
    config: OpenAIConfig = { model: 'gpt-5-mini' }
  ): Promise<OpenAIResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('認証が必要です');
      }

      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          shopId: shop?.id || 'demo-shop-1',
          model: config.model,
          maxTokens: config.maxTokens,
          temperature: config.temperature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `GPT-5 Mini API error: ${response.status}`);
      }

      const data: OpenAIResponse = await response.json();
      return data;

    } catch (err: any) {
      console.error('OpenAI API Error:', err);
      setError(err.message || 'GPT-5 Mini提案生成に失敗しました');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateProposalsWithModel = async (
    prompt: string,
    shop: any,
    model: 'gpt-5-mini' | 'gpt-5' | 'gpt-4o-mini' = 'gpt-5-mini'
  ) => {
    return generateProposals(prompt, shop, { model });
  };

  return {
    generateProposals,
    generateProposalsWithModel,
    loading,
    error,
  };
}