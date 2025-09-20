'use client';

import { useState } from 'react';
import { useOpenAI, OpenAIConfig } from '@/hooks/useOpenAI';

interface OpenAIProposalGeneratorProps {
  shop: any;
  onProposalSelect?: (proposal: any) => void;
}

export default function OpenAIProposalGenerator({ shop, onProposalSelect }: OpenAIProposalGeneratorProps) {
  const [request, setRequest] = useState('');
  const [proposals, setProposals] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<'gpt-5-mini' | 'gpt-5' | 'gpt-4o-mini'>('gpt-5-mini');
  const [metadata, setMetadata] = useState<any>(null);
  const { generateProposals, loading, error } = useOpenAI();

  const handleGenerate = async () => {
    if (!request.trim()) return;

    const config: OpenAIConfig = {
      model: selectedModel,
      maxTokens: 1000,
      temperature: 0.7,
    };

    const result = await generateProposals(request, shop, config);
    if (result && result.success) {
      setProposals(result.proposals);
      setMetadata(result.metadata);
    }
  };

  const handleProposalClick = (proposal: any) => {
    if (onProposalSelect) {
      onProposalSelect(proposal);
    }
  };

  const getModelInfo = (model: string) => {
    switch (model) {
      case 'gpt-5-mini':
        return { color: 'bg-green-100 text-green-800', label: 'GPT-5 Mini (最新・高速)' };
      case 'gpt-5':
        return { color: 'bg-purple-100 text-purple-800', label: 'GPT-5 (最強モデル)' };
      case 'gpt-4o-mini':
        return { color: 'bg-blue-100 text-blue-800', label: 'GPT-4o Mini (従来)' };
      default:
        return { color: 'bg-gray-100 text-gray-800', label: model };
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            🤖 OpenAI AI提案生成
          </h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            2025年最新
          </span>
        </div>

        <div className="space-y-4">
          {/* モデル選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AIモデル選択
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['gpt-5-mini', 'gpt-5', 'gpt-4o-mini'] as const).map((model) => {
                const modelInfo = getModelInfo(model);
                return (
                  <label key={model} className="relative">
                    <input
                      type="radio"
                      name="model"
                      value={model}
                      checked={selectedModel === model}
                      onChange={(e) => setSelectedModel(e.target.value as any)}
                      className="sr-only"
                    />
                    <div className={`
                      p-3 rounded-lg border cursor-pointer transition-all
                      ${selectedModel === model
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {model === 'gpt-5-mini' ? 'GPT-5 Mini' :
                           model === 'gpt-5' ? 'GPT-5' : 'GPT-4o Mini'}
                        </span>
                        {selectedModel === model && (
                          <div className="w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {model === 'gpt-5-mini' ? '高速・最新・推奨' :
                         model === 'gpt-5' ? '最強性能・高精度' : '従来モデル'}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* リクエスト入力 */}
          <div>
            <label htmlFor="request" className="block text-sm font-medium text-gray-700">
              リクエスト内容
            </label>
            <textarea
              id="request"
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="例: 春限定メニューの宣伝キャンペーンを作成したい"
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              maxLength={1000}
            />
            <p className="mt-1 text-sm text-gray-500">
              {request.length}/1000文字
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !request.trim()}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {selectedModel} で生成中...
              </div>
            ) : (
              `${selectedModel} で AI提案を生成`
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {metadata && (
          <div className="mt-4 rounded-md bg-blue-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getModelInfo(metadata.model).color}`}>
                  {metadata.model}
                </span>
                {metadata.isDemo && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    デモモード
                  </span>
                )}
              </div>
              <div className="text-blue-700">
                生成時間: {metadata.duration}ms
                {metadata.usage && (
                  <span className="ml-2">
                    トークン: {metadata.usage.total_tokens}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {proposals.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">
            🎯 {selectedModel} AI提案結果
          </h4>

          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {proposals.map((proposal, index) => (
              <div
                key={proposal.id || index}
                className="bg-white shadow rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-indigo-400"
                onClick={() => handleProposalClick(proposal)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h5 className="text-sm font-medium text-gray-900">
                    {proposal.title}
                  </h5>
                  <div className="flex items-center">
                    <span className="text-xs text-green-600 font-medium">
                      信頼度: {Math.round(proposal.confidence * 100)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">💬 メッセージ内容:</p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {proposal.message}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 mb-1">⏰ 配信タイミング:</p>
                    <p className="text-xs text-gray-600">{proposal.timing}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 mb-1">🎯 期待効果:</p>
                    <p className="text-xs text-gray-600">{proposal.expectedEffect}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t">
                  <button className="text-xs text-indigo-600 hover:text-indigo-900 font-medium">
                    この提案をLINE配信で使用 →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}