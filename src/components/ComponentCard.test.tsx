import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ComponentCard } from './ComponentCard';

vi.mock('./LivePreview', () => ({ LivePreview: ({ code }: { code: string }) => <div data-testid="preview">{code}</div> }));

it('opens code during generation and switches to preview after completion', () => {
  const component = { id: 'one', prompt: 'button', code: '', createdAt: new Date() };
  const props = { component, isLoading: true, isGenerating: true, onRemove: vi.fn(), onRegenerate: vi.fn() };
  const { rerender } = render(<ComponentCard {...props} />);
  expect(screen.getByRole('tab', { name: '코드' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: '미리보기' })).toBeDisabled();
  expect(screen.queryByTestId('preview')).not.toBeInTheDocument();
  rerender(<ComponentCard {...props} component={{ ...component, code: 'const Button' }} />);
  expect(screen.getByText('const Button')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '복사' })).toBeDisabled();
  rerender(<ComponentCard {...props} component={{ ...component, code: 'final code' }} isLoading={false} isGenerating={false} />);
  expect(screen.getByRole('tab', { name: '미리보기' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByTestId('preview')).toHaveTextContent('final code');
  fireEvent.click(screen.getByRole('tab', { name: '코드' }));
  expect(screen.getByText('final code')).toBeInTheDocument();
});
