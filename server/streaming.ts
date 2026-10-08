import { readSSE } from '../src/utils/sse';
import type { Provider } from '../src/types';

interface ProviderEvent {
  type?: string;
  delta?: { type?: string; text?: string; stop_reason?: string };
  error?: { type?: string; code?: number };
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    finishReason?: string;
  }>;
}

export async function collectProviderStream(
  response: Response, provider: Provider, onText: (text: string) => void,
): Promise<string> {
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  if (!response.body) throw new Error('생성 응답이 비어 있습니다.');
  let text = '';
  let complete = false;
  for await (const data of readSSE(response.body)) {
    const event = JSON.parse(data) as ProviderEvent;
    if (event.error || event.type === 'error') {
      const status = event.error?.code ?? (event.error?.type === 'overloaded_error' ? 503
        : event.error?.type === 'rate_limit_error' ? 429 : 500);
      throw new Error(`API error: ${status}`);
    }
    let chunk = '';
    if (provider === 'anthropic') {
      if (event.delta?.stop_reason === 'max_tokens') {
        throw new Error('생성된 코드가 너무 길어 잘렸습니다. 더 간단한 컴포넌트를 요청해주세요.');
      }
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        chunk = event.delta.text ?? '';
      }
      if (event.type === 'message_stop') complete = true;
    } else {
      const candidate = event.candidates?.[0];
      if (candidate?.finishReason === 'MAX_TOKENS') {
        throw new Error('생성된 코드가 너무 길어 잘렸습니다. 더 간단한 컴포넌트를 요청해주세요.');
      }
      if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
        throw new Error('컴포넌트 생성을 완료하지 못했습니다. 요청을 수정해주세요.');
      }
      chunk = candidate?.content?.parts?.filter(part => !part.thought).map(part => part.text ?? '').join('') ?? '';
      if (candidate?.finishReason === 'STOP') complete = true;
    }
    if (chunk) {
      text += chunk;
      onText(text);
    }
  }
  if (!complete) throw new Error('코드 생성 연결이 중단되었습니다. 다시 시도해주세요.');
  if (!text.trim()) throw new Error('생성 응답이 비어 있습니다.');
  return text;
}
