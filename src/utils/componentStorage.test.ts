import { beforeEach, describe, expect, it } from 'vitest';
import type { GeneratedComponent } from '../types';
import {
  COMPONENTS_STORAGE_KEY,
  loadStoredComponents,
  saveComponents,
} from './componentStorage';

const component: GeneratedComponent = {
  id: 'component-1',
  prompt: '프로필 카드',
  code: 'render(<div />);',
  createdAt: new Date('2026-10-08T00:00:00.000Z'),
};

describe('componentStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('생성 컴포넌트를 저장하고 Date를 복원한다', () => {
    saveComponents([component]);

    expect(localStorage.getItem(COMPONENTS_STORAGE_KEY)).toBeTruthy();
    expect(loadStoredComponents()).toEqual([component]);
  });

  it('손상된 저장값은 빈 목록으로 처리한다', () => {
    localStorage.setItem(COMPONENTS_STORAGE_KEY, '{not-json');

    expect(loadStoredComponents()).toEqual([]);
  });

  it('빈 목록을 저장하면 기존 저장값을 제거한다', () => {
    saveComponents([component]);

    saveComponents([]);

    expect(localStorage.getItem(COMPONENTS_STORAGE_KEY)).toBeNull();
  });
});
