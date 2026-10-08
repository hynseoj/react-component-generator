# Agent Guide

## Operational Commands

- 패키지 관리자와 런타임은 Bun으로 고정한다. npm, yarn, pnpm 명령은 사용하지 않는다.
- 개발 서버: `bun run dev`
- 프로덕션 빌드: `bun run build`
- 린트: `bun run lint`
- 전체 테스트: `bun run test`

## Golden Rules

### Immutable

- 서버 환경변수의 API 키 값을 클라이언트 응답, 로그, 상태에 노출하지 않는다. `/api/config`은 키 존재 여부만 반환하고, 생성 요청에서는 서버 키 또는 요청별 키를 해석한다. 근거: [server/index.ts](./server/index.ts#L59-L66), [server/index.ts](./server/index.ts#L147-L172).
- 생성 모델의 응답은 `stripCodeFences`와 `ensureRenderCall`을 거친 뒤에만 반환한다. `react-live`의 `noInline` 미리보기는 마지막 `render(...)` 호출이 필요하다. 근거: [server/index.ts](./server/index.ts#L188-L190), [server/generator.ts](./server/generator.ts#L12-L23), [src/components/LivePreview.tsx](./src/components/LivePreview.tsx#L15-L20).
- API 프록시와 Bun 서버 포트는 함께 변경한다. 프론트엔드는 `/api`를 `localhost:3002`로 프록시하고 서버도 포트 3002에서 수신한다. 근거: [vite.config.ts](./vite.config.ts#L8-L15), [server/index.ts](./server/index.ts#L138-L140).

### Do's and Don'ts

- Google 모델 목록의 순서와 폴백 흐름을 보존한다. `withModelFallback`은 첫 성공을 반환하고 모두 실패하면 마지막 오류를 던진다. 근거: [server/index.ts](./server/index.ts#L4-L5), [server/index.ts](./server/index.ts#L134-L136), [server/fallback.ts](./server/fallback.ts#L3-L20).
- 모델 응답 정규화나 폴백 동작을 수정할 때는 기존 순수 함수 테스트를 함께 갱신한다. 근거: [server/generator.test.ts](./server/generator.test.ts#L4-L40), [server/fallback.test.ts](./server/fallback.test.ts#L4-L41).
- 생성 진행 상태는 요청 시작, 성공·실패, 완료에서 각각 갱신한다. 실패 시 기존 결과를 지우지 않는다. 근거: [src/hooks/useComponentGenerator.ts](./src/hooks/useComponentGenerator.ts#L18-L48).

## TDD Rule

> **이 규칙은 Rigid — 상황에 맞게 변형하지 마라.**

### 적용 기준

- **TDD 필수:** 비즈니스 로직, API, 유틸리티, 버그 수정.
- **TDD 불필요:** 타입 정의, 설정 파일, 순수 UI, SQL.
- 하위 디렉토리의 `AGENTS.md`에 별도 TDD 규칙이 있으면 **그 규칙을 우선**한다. 이 섹션은 전역 기본값(fallback)이다.

### RED → GREEN → REFACTOR

1. **RED:** 하나의 동작마다 하나의 테스트를 작성한다. 반드시 실행해 실패를 확인하며, 실패 이유는 **기능 미구현**이어야 한다.
2. **GREEN:** 테스트를 통과시키는 최소한의 코드만 작성한다. **YAGNI**를 지키고, 신규·기존 테스트가 모두 통과하는지 확인한다.
3. **REFACTOR:** 중복 제거, 이름 개선, 헬퍼 추출만 수행한다. green 상태를 유지하고, **새 동작을 추가하지 않는다.**
4. **반복:** 다음 동작에 대한 RED로 돌아간다.

### 삭제 강제 규칙

- 테스트 전에 프로덕션 코드를 먼저 작성했다면 해당 코드를 **삭제하고 RED부터 재시작**한다.
- 이미 작성한 코드를 **“참고용”으로 남기는 것도 금지**한다.

### 변명 차단표

| 변명 | 반론 |
| --- | --- |
| 너무 단순해서 테스트 불필요 | 단순한 동작일수록 테스트 작성 비용이 작고 회귀 방지 효과가 즉시 생긴다. |
| 나중에 추가하겠다 | 테스트는 구현 이후의 할 일이 아니라 구현 순서 자체다. 지금 RED를 작성한다. |
| 시간이 없다 | 테스트 없이 생기는 디버깅·회귀 비용이 더 크다. 범위를 줄여서라도 RED부터 시작한다. |
| 삭제하면 낭비 | 잘못된 순서를 유지하는 비용이 더 크다. 삭제는 TDD 흐름을 복구하는 필수 작업이다. |
| 프로토타입이다 | 프로토타입도 동작을 검증해야 하며, 이후 변경의 기준점이 필요하다. |

## Project Context

프롬프트를 Anthropic 또는 Google 모델에 전달해 단일 React 컴포넌트를 생성하고, 브라우저에서 코드와 런타임 미리보기를 제공한다.

Tech stack: React 19, TypeScript, Vite, Bun, Vitest, react-live.

## Standards and References

- TypeScript와 React 코드에는 현재 ESLint flat config를 따른다. [eslint.config.js](./eslint.config.js)를 기준으로 한다.
- 커밋은 한국어 Conventional Commit 형식(`feat:`, `fix:`, `refactor:`, `chore:`)을 사용한다.
- 규칙과 코드의 괴리가 확인되면 해당 `AGENTS.md` 갱신을 제안한다.

## Context Map

- **[React 화면, 상태, 미리보기 수정](./src/AGENTS.md)** — 브라우저 런타임과 컴포넌트 생성 UX를 다룰 때.
- **[Bun API와 모델 연동 수정](./server/AGENTS.md)** — 키 해석, 모델 호출, 응답 정규화를 다룰 때.
