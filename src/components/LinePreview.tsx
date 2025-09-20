interface LinePreviewProps {
  message: string;
}

export default function LinePreview({ message }: LinePreviewProps) {
  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <div className="text-sm text-gray-600 mb-3 flex items-center">
        <div className="w-6 h-6 bg-green-500 rounded mr-2 flex items-center justify-center">
          <span className="text-white text-xs font-bold">L</span>
        </div>
        LINEプレビュー
      </div>

      <div className="bg-white rounded-lg shadow-sm max-w-sm">
        {/* LINE Header */}
        <div className="flex items-center p-3 border-b bg-gray-50 rounded-t-lg">
          <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
          <div>
            <div className="text-sm font-medium text-gray-900">あなたの店舗</div>
            <div className="text-xs text-gray-500">公式アカウント</div>
          </div>
        </div>

        {/* Message Bubble */}
        <div className="p-4">
          <div className="bg-green-500 text-white rounded-lg p-3 max-w-xs">
            <div className="text-sm whitespace-pre-wrap break-words">
              {message || 'メッセージを入力してください'}
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {new Date().toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    </div>
  );
}