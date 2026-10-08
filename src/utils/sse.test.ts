import { expect, it } from 'vitest';
import { readSSE } from './sse';

it('decodes split UTF-8, CRLF and multiline SSE data', async () => {
  const bytes = new TextEncoder().encode(': ping\r\ndata: {"text":\r\ndata: "한글"}\r\n\r\n');
  const body = new ReadableStream<Uint8Array>({ start(c) {
    for (const byte of bytes) c.enqueue(new Uint8Array([byte]));
    c.close();
  } });
  const values = [];
  for await (const data of readSSE(body)) values.push(JSON.parse(data));
  expect(values).toEqual([{ text: '한글' }]);
});
