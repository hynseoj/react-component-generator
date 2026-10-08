import type { GeneratedComponent } from '../types';

export const COMPONENTS_STORAGE_KEY = 'react-component-generator:components';

interface StoredComponent {
  id: string;
  prompt: string;
  code: string;
  createdAt: string;
}

function isStoredComponent(value: unknown): value is StoredComponent {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const component = value as Record<string, unknown>;
  return ['id', 'prompt', 'code', 'createdAt'].every((key) => typeof component[key] === 'string');
}

export function loadStoredComponents(): GeneratedComponent[] {
  try {
    const storedValue = localStorage.getItem(COMPONENTS_STORAGE_KEY);
    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.flatMap((value) => {
      if (!isStoredComponent(value)) {
        return [];
      }

      const createdAt = new Date(value.createdAt);
      return Number.isNaN(createdAt.getTime())
        ? []
        : [{ ...value, createdAt }];
    });
  } catch {
    return [];
  }
}

export function saveComponents(components: GeneratedComponent[]): void {
  try {
    if (components.length === 0) {
      localStorage.removeItem(COMPONENTS_STORAGE_KEY);
      return;
    }

    localStorage.setItem(COMPONENTS_STORAGE_KEY, JSON.stringify(components));
  } catch {
    // localStorage를 사용할 수 없거나 저장 공간이 부족하면 현재 세션을 계속 사용한다.
  }
}
