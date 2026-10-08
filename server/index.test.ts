import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

async function handler() {
  let handle!: (req: Request) => Promise<Response>;
  vi.stubGlobal('Bun', { serve: (options: { fetch: typeof handle }) => {
    handle = options.fetch;
    return { port: 3002 };
  } });
  await import('./index');
  return handle;
}

function request(provider = 'anthropic') {
  return new Request('http://localhost/api/generate', { method: 'POST',
    body: JSON.stringify({ prompt: 'button', apiKey: 'test-key', provider }) });
}

function events(items: unknown[]) {
  return new Response(items.map(item => `data: ${JSON.stringify(item)}\n\n`).join(''));
}

it('requests Anthropic streaming and sends normalized incremental and final code', async () => {
  const upstream = vi.fn().mockResolvedValue(events([
    { type: 'content_block_delta', delta: { type: 'text_delta', text: '```jsx\nconst Button = () => null;' } },
    { type: 'content_block_delta', delta: { type: 'text_delta', text: '\n```' } },
    { type: 'message_stop' },
  ]));
  vi.stubGlobal('fetch', upstream);
  const handle = await handler();
  const response = await handle(request());
  expect(response.headers.get('Content-Type')).toContain('text/event-stream');
  const output = await response.text();
  expect(JSON.parse(upstream.mock.calls[0][1].body).stream).toBe(true);
  expect(output).toContain('"type":"code"');
  expect(output).toContain('"type":"complete"');
  expect(output).toContain('render(<Button />);');
  expect(output).not.toContain('```');
  expect(output).not.toContain('test-key');
});

it('resets partial Google code before trying the next model', async () => {
  const upstream = vi.fn()
    .mockResolvedValueOnce(events([{ candidates: [{ content: { parts: [{ text: 'const Failed = () => null;' }] } }] }]))
    .mockResolvedValueOnce(events([{ candidates: [{ content: { parts: [{ text: 'const Good = () => null;' }] }, finishReason: 'STOP' }] }]));
  vi.stubGlobal('fetch', upstream);
  const handle = await handler();
  const response = await handle(request('google'));
  const output = await response.text();
  expect(upstream.mock.calls[0][0]).toContain('gemini-3.1-flash-lite:streamGenerateContent?alt=sse');
  expect(upstream.mock.calls[1][0]).toContain('gemini-3.5-flash:streamGenerateContent?alt=sse');
  expect(output).toContain('"type":"code","code":""');
  const last = output.trim().split('\n\n').at(-1)!;
  expect(last).toContain('Good');
  expect(last).not.toContain('Failed');
});

it('keeps rate limit and overload messages in stream errors', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 429 })));
  const handle = await handler();
  const response = await handle(request());
  expect(await response.text()).toContain('요청이 너무 많습니다.');
});

it('forwards a code event while the upstream response is still open', async () => {
  let upstream!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({ start(c) { upstream = c; } });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body)));
  const handle = await handler();
  const response = await handle(request());
  const reader = response.body!.getReader();
  upstream.enqueue(new TextEncoder().encode('data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"const Button = () => null;"}}\n\n'));
  const first = await reader.read();
  expect(new TextDecoder().decode(first.value)).toContain('"type":"code"');
  expect(first.done).toBe(false);
  upstream.enqueue(new TextEncoder().encode('data: {"type":"message_stop"}\n\n'));
  upstream.close();
  const last = await reader.read();
  expect(new TextDecoder().decode(last.value)).toContain('"type":"complete"');
  await reader.cancel();
});
