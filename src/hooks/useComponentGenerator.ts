import { useState, useCallback, useEffect } from 'react';
import type { GeneratedComponent, Provider } from '../types';
import { loadStoredComponents, saveComponents } from '../utils/componentStorage';
import { readSSE } from '../utils/sse';

interface UseComponentGeneratorReturn {
  components: GeneratedComponent[];
  isLoading: boolean;
  error: string | null;
  draft: GeneratedComponent | null;
  generate: (prompt: string, apiKey: string | undefined, provider: Provider) => Promise<void>;
  removeComponent: (id: string) => void;
  clearAll: () => void;
}

export function useComponentGenerator(): UseComponentGeneratorReturn {
  const [components, setComponents] = useState<GeneratedComponent[]>(loadStoredComponents);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<GeneratedComponent | null>(null);

  useEffect(() => {
    saveComponents(components);
  }, [components]);

  const generate = useCallback(async (prompt: string, apiKey: string | undefined, provider: Provider) => {
    setIsLoading(true);
    setError(null);
    const newComponent: GeneratedComponent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      prompt, code: '', createdAt: new Date(),
    };
    setDraft(newComponent);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ...(apiKey && { apiKey }), provider }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate component');
      }

      if (res.headers.get('Content-Type')?.includes('text/event-stream')) {
        if (!res.body) throw new Error('생성 응답이 비어 있습니다.');
        let complete = false;
        let draftCode = '';
        for await (const data of readSSE(res.body)) {
          const event = JSON.parse(data) as { type: string; text?: string; code?: string; error?: string };
          if (event.type === 'error') throw new Error(event.error || 'Failed to generate component');
          if (event.type === 'reset') {
            draftCode = '';
            setDraft({ ...newComponent, code: '' });
          }
          if (event.type === 'delta' && typeof event.text === 'string') {
            draftCode += event.text;
            setDraft({ ...newComponent, code: draftCode });
          }
          if (event.type === 'complete' && event.code?.trim()) {
            newComponent.code = event.code;
            complete = true;
            break;
          }
        }
        if (!complete) throw new Error('코드 생성 연결이 중단되었습니다. 다시 시도해주세요.');
      } else {
        const data = await res.json();
        newComponent.code = data.code;
      }

      setComponents((prev) => [newComponent, ...prev]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setDraft(null);
      setIsLoading(false);
    }
  }, []);

  const removeComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setComponents([]);
  }, []);

  return { components, isLoading, error, draft, generate, removeComponent, clearAll };
}
