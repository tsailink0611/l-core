import { render, screen } from '@testing-library/react';
import LoadingSpinner from '@/components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('デフォルトサイズで表示される', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  it('指定されたサイズで表示される', () => {
    render(<LoadingSpinner size="lg" />);
    
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveClass('w-12', 'h-12');
  });

  it('テキストが表示される', () => {
    const testText = 'Loading data...';
    render(<LoadingSpinner text={testText} />);
    
    expect(screen.getByText(testText)).toBeInTheDocument();
  });

  it('テキストなしでも正常に表示される', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toBeInTheDocument();
    expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
  });

  it('異なるサイズクラスが正しく適用される', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    let spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveClass('w-4', 'h-4');

    rerender(<LoadingSpinner size="md" />);
    spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveClass('w-8', 'h-8');

    rerender(<LoadingSpinner size="lg" />);
    spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveClass('w-12', 'h-12');
  });
});