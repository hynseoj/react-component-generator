import { describe, expect, it } from 'vitest';
import { isPromptWithinLimit, PROMPT_MAX_LENGTH } from './prompt';

describe('isPromptWithinLimit', () => {
  it('500자 이하 프롬프트는 유효하다', () => {
    expect(isPromptWithinLimit('a'.repeat(PROMPT_MAX_LENGTH))).toBe(true);
  });

  it('500자를 초과한 프롬프트는 유효하지 않다', () => {
    expect(isPromptWithinLimit('a'.repeat(PROMPT_MAX_LENGTH + 1))).toBe(false);
  });
});
