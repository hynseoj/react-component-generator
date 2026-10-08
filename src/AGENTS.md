# Client Module Guide

## Module Context

`src`는 생성 요청, 결과 목록, `react-live` 미리보기를 브라우저에서 관리한다. API 호출은 Vite의 `/api` 프록시를 통해 Bun 서버로 전달된다.

## Tech Stack and Constraints

- React 19와 TypeScript를 사용한다.
- 생성 결과는 `react-live`의 `LiveProvider`에 `noInline`으로 전달한다. 생성 코드에 import를 추가하거나 모듈 CSS에 의존하게 만들지 않는다. 근거: [components/LivePreview.tsx](./components/LivePreview.tsx#L1-L20), [../server/index.ts](../server/index.ts#L7-L20).

## Implementation Patterns

- 생성, 오류, 로딩, 목록 변경은 `useComponentGenerator`를 통해 유지한다. 화면 컴포넌트에서 중복된 요청 상태를 만들지 않는다. 근거: [hooks/useComponentGenerator.ts](./hooks/useComponentGenerator.ts#L13-L59).
- 프로바이더를 바꿀 때 직접 입력한 키를 비운다. 근거: [App.tsx](./App.tsx#L41-L44).
- 환경 키 상태에는 Boolean 값만 보관한다. 근거: [App.tsx](./App.tsx#L17-L20), [App.tsx](./App.tsx#L24-L29).

## Testing Strategy

- UI 입력 동작을 바꾸면 `bun run test`를 실행한다.
- `PromptInput` 변경은 빈 입력, 제출, 로딩 상태의 접근성 역할 기반 테스트를 유지한다. 근거: [components/PromptInput.test.tsx](./components/PromptInput.test.tsx#L6-L28).

## Local Golden Rules

- 요청 실패 시 `components`를 지우거나 로딩 상태를 남기지 않는다. 훅의 `catch`와 `finally` 흐름을 보존한다. 근거: [hooks/useComponentGenerator.ts](./hooks/useComponentGenerator.ts#L42-L48).
- 새로고침은 카드의 미리보기만 재마운트한다. 목록 항목의 ID나 생성 시각을 변경하지 않는다. 근거: [components/ComponentCard.tsx](./components/ComponentCard.tsx#L15-L21), [components/ComponentCard.tsx](./components/ComponentCard.tsx#L31-L38), [components/ComponentCard.tsx](./components/ComponentCard.tsx#L68-L73).
