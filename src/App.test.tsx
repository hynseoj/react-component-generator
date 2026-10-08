import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import App from './App';
import { COMPONENTS_STORAGE_KEY } from './utils/componentStorage';

afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });

it('streams in the result card, then renders and archives the completed component', async () => {
  localStorage.clear();
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({ start(c) { controller = c; } });
  vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve(url === '/api/config'
    ? Response.json({ envKeys: { google: true, anthropic: false } })
    : new Response(body, { headers: { 'Content-Type': 'text/event-stream' } }))));
  render(<App />);
  await screen.findByText('.env 키가 연결되어 있습니다.');
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a button' } });
  fireEvent.click(screen.getByRole('button', { name: '컴포넌트 생성' }));
  expect(screen.getByRole('heading', { name: '생성된 컴포넌트' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: '코드' })).toHaveAttribute('aria-selected', 'true');
  const send = (data: object) => controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
  await act(async () => { send({ type: 'code', code: 'const Button = () => <button>' }); });
  expect(screen.getByText('const Button = () => <button>')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Generated button' })).not.toBeInTheDocument();
  expect(localStorage.getItem(COMPONENTS_STORAGE_KEY)).toBeNull();
  await act(async () => {
    send({ type: 'complete', code: 'const Button = () => <button>Generated button</button>; render(<Button />);' });
    controller.close();
  });
  expect(await screen.findByRole('button', { name: 'Generated button' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: '미리보기' })).toHaveAttribute('aria-selected', 'true');
  await waitFor(() => expect(JSON.parse(localStorage.getItem(COMPONENTS_STORAGE_KEY)!)).toHaveLength(1));
});
