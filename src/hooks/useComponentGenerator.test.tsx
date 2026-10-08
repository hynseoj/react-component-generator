import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useComponentGenerator } from './useComponentGenerator';

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

function stream() {
  let controller: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({ start(c) { controller = c; } });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { headers: { 'Content-Type': 'text/event-stream' } })));
  return {
    send: (data: unknown) => controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)),
    close: () => controller.close(),
  };
}

it('shows incremental draft and only saves final code on completion', async () => {
  const s = stream();
  const { result } = renderHook(() => useComponentGenerator());
  let request: Promise<void>;
  act(() => { request = result.current.generate('button', undefined, 'google'); });
  expect(result.current.isLoading).toBe(true);
  expect(result.current.draft?.prompt).toBe('button');
  s.send({ type: 'code', code: 'const Button' });
  await waitFor(() => expect(result.current.draft?.code).toBe('const Button'));
  expect(result.current.components).toHaveLength(0);
  s.send({ type: 'complete', code: 'const Button = () => null; render(<Button />);' });
  s.close();
  await act(async () => { await request; });
  expect(result.current.draft).toBeNull();
  expect(result.current.isLoading).toBe(false);
  expect(result.current.components[0].code).toContain('render(<Button />)');
});

it('replaces a failed model draft when fallback restarts', async () => {
  const s = stream();
  const { result } = renderHook(() => useComponentGenerator());
  act(() => { void result.current.generate('button', undefined, 'google'); });
  s.send({ type: 'code', code: 'failed model' });
  await waitFor(() => expect(result.current.draft?.code).toBe('failed model'));
  s.send({ type: 'code', code: '' });
  await waitFor(() => expect(result.current.draft?.code).toBe(''));
  s.send({ type: 'complete', code: 'final' });
  s.close();
  await waitFor(() => expect(result.current.isLoading).toBe(false));
});

it('keeps previous results on interrupted streams without saving partial code', async () => {
  localStorage.setItem('react-component-generator:components', '[]');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 'old' }), { headers: { 'Content-Type': 'application/json' } })));
  const { result } = renderHook(() => useComponentGenerator());
  await act(async () => { await result.current.generate('old', undefined, 'google'); });
  const s = stream();
  let request: Promise<void>;
  act(() => { request = result.current.generate('new', undefined, 'google'); });
  s.send({ type: 'code', code: 'partial' });
  s.close();
  await act(async () => { await request; });
  expect(result.current.components.map(c => c.code)).toEqual(['old']);
  expect(result.current.error).toContain('중단');
  expect(result.current.isLoading).toBe(false);
  expect(result.current.draft).toBeNull();
});

it('shows a stream error and exits loading', async () => {
  const s = stream();
  const { result } = renderHook(() => useComponentGenerator());
  let request: Promise<void>;
  act(() => { request = result.current.generate('new', undefined, 'anthropic'); });
  s.send({ type: 'error', error: '요청이 너무 많습니다.' });
  s.close();
  await act(async () => { await request; });
  expect(result.current.error).toBe('요청이 너무 많습니다.');
  expect(result.current.components).toHaveLength(0);
  expect(result.current.isLoading).toBe(false);
});
