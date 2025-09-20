'use client';

import { useState } from 'react';
import { useClaudeAPI } from '@/hooks/useClaudeAPI';
import { Proposal } from '@/lib/schemas';

interface AIProposalGeneratorProps {
  shop: any; // 本来はShop型を使用
  onProposalSelect?: (proposal: Proposal) => void;
}

export default function AIProposalGenerator({ shop, onProposalSelect }: AIProposalGeneratorProps) {
  const [request, setRequest] = useState('');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const { generateProposals, loading, error } = useClaudeAPI();

  const handleGenerate = async () => {
    if (!request.trim()) return;

    const result = await generateProposals(request, shop);
    if (result) {
      setProposals(result.proposals);
    }
  };

  const handleProposalClick = (proposal: Proposal) => {
    if (onProposalSelect) {
      onProposalSelect(proposal);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          AI提案生成
        </h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="request" className="block text-sm font-medium text-gray-700">
              リクエスト内容
            </label>
            <textarea
              id="request"
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="例: 季節限定メニューの宣伝キャンペーンを作成したい"
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
                AI提案を生成中...
              </div>
            ) : (
              'AI提案を生成'
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
      </div>

      {proposals.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">
            AI提案結果
          </h4>

          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {proposals.map((proposal, index) => (
              <div
                key={index}
                className="bg-white shadow rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleProposalClick(proposal)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h5 className="text-sm font-medium text-gray-900">
                    {proposal.title}
                  </h5>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500">
                      信頼度: {Math.round(proposal.confidence * 100)}%
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                  {proposal.content}
                </p>

                <div className="border-t pt-3">
                  <p className="text-xs text-gray-600 mb-2">
                    理由: {proposal.reasoning}
                  </p>

                  {proposal.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {proposal.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t">
                  <button className="text-xs text-indigo-600 hover:text-indigo-900">
                    この提案を使用 →
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