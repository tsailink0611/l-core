import { render, screen } from '@testing-library/react';
import ErrorBoundary from '@/components/ErrorBoundary';

// テスト用のエラーを投げるコンポーネント
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Normal component</div>;
};

describe('ErrorBoundary', () => {
  // コンソールエラーを無効化（テスト中のノイズを防ぐ）
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('通常の子コンポーネントを正しく表示する', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal component')).toBeInTheDocument();
  });

  it('エラー発生時にフォールバックUIを表示する', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText(/申し訳ございません/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ページを再読み込み' })).toBeInTheDocument();
  });

  it('カスタムフォールバックを使用する', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('エラーが発生しました')).not.toBeInTheDocument();
  });

  it('再読み込みボタンがwindow.location.reloadを呼び出す', () => {
    const originalReload = window.location.reload;
    window.location.reload = jest.fn();

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByRole('button', { name: 'ページを再読み込み' });
    reloadButton.click();

    expect(window.location.reload).toHaveBeenCalled();

    window.location.reload = originalReload;
  });
});