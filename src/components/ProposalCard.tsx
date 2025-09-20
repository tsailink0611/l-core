import { Proposal } from '@/types';

interface ProposalCardProps {
  proposal: Proposal;
  isSelected: boolean;
  onSelect: () => void;
}

export default function ProposalCard({ proposal, isSelected, onSelect }: ProposalCardProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case '王道':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case '挑戦':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case '限定感':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Type Badge */}
      <div className="flex justify-between items-start mb-3">
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(proposal.type)}`}>
          {proposal.type}
        </span>
        {isSelected && (
          <div className="text-blue-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="font-medium text-gray-900 mb-2">{proposal.title}</h3>

      {/* Content */}
      <p className="text-gray-700 text-sm mb-3 leading-relaxed">{proposal.content}</p>

      {/* Meta Info */}
      <div className="space-y-2">
        <div className="flex items-center text-xs text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          推奨配信時間: {proposal.timing}
        </div>
        <div className="flex items-start text-xs text-gray-500">
          <svg className="w-4 h-4 mr-1 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="leading-relaxed">{proposal.reason}</span>
        </div>
      </div>
    </div>
  );
}