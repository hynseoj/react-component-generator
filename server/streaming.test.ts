import { expect, it } from 'vitest';
import { collectProviderStream } from './streaming';

function response(events: unknown[]) {
  return new Response(events.map(event => `data: ${JSON.stringify(event)}\n\n`).join(''));
}

it('emits Anthropic text chunks before completion', async () => {
  const chunks: string[] = [];
  const code = await collectProviderStream(response([
    { type: 'content_block_delta', delta: { type: 'text_delta', text: 'const A' } },
    { type: 'content_block_delta', delta: { type: 'text_delta', text: ' = () => null;' } },
    { type: 'message_stop' },
  ]), 'anthropic', text => chunks.push(text));
  expect(chunks).toEqual(['const A', ' = () => null;']);
  expect(code).toBe(chunks.join(''));
});

it('emits Google text but excludes thought parts', async () => {
  const chunks: string[] = [];
  const code = await collectProviderStream(response([
    { candidates: [{ content: { parts: [{ text: 'secret thought', thought: true }, { text: 'const A' }] } }] },
    { candidates: [{ content: { parts: [{ text: ' = () => null;' }] }, finishReason: 'STOP' }] },
  ]), 'google', text => chunks.push(text));
  expect(chunks).toEqual(['const A', ' = () => null;']);
  expect(code).toBe(chunks.join(''));
});

it('rejects truncated, empty, and provider error streams', async () => {
  await expect(collectProviderStream(response([
    { candidates: [{ content: { parts: [{ text: 'const A' }] }, finishReason: 'MAX_TOKENS' }] },
  ]), 'google', () => {})).rejects.toThrow('잘렸습니다');
  await expect(collectProviderStream(response([
    { type: 'content_block_delta', delta: { type: 'text_delta', text: 'partial' } },
  ]), 'anthropic', () => {})).rejects.toThrow('중단');
  await expect(collectProviderStream(response([{ type: 'message_stop' }]), 'anthropic', () => {})).rejects.toThrow('비어');
  await expect(collectProviderStream(response([{ type: 'error', error: { type: 'overloaded_error' } }]), 'anthropic', () => {})).rejects.toThrow('503');
});
