# Server Module Guide

## Module Context

`server`는 Bun HTTP API에서 제공자별 AI 호출을 수행하고, 생성된 코드를 브라우저 미리보기 규격으로 정규화한다. 클라이언트는 `/api` 프록시로만 이 서버에 접근한다.

## Tech Stack and Constraints

- Bun의 전역 `fetch`와 `Bun.serve`를 사용한다. HTTP 클라이언트 라이브러리를 추가하지 않는다. 근거: [index.ts](./index.ts#L68-L82), [index.ts](./index.ts#L98-L109), [index.ts](./index.ts#L138-L220).
- 제공자 타입은 `anthropic | google`으로 제한한다. 새 제공자는 환경 키, 호출 분기, 클라이언트 선택지를 함께 추가한다. 근거: [index.ts](./index.ts#L57-L66), [index.ts](./index.ts#L159-L186).

## Implementation Patterns

- 모델 호출 실패 시 Google 요청만 선언된 순서대로 폴백한다. 폴백 여부를 호출자마다 재구현하지 않는다. 근거: [index.ts](./index.ts#L4-L5), [index.ts](./index.ts#L134-L136), [fallback.ts](./fallback.ts#L3-L20).
- 사용자에게 반환할 코드는 코드펜스 제거 후 `render(...)` 호출을 보장한다. 근거: [index.ts](./index.ts#L188-L190), [generator.ts](./generator.ts#L5-L23).

## Testing Strategy

- 정규화와 폴백 변경은 `bun run test`로 검증한다.
- 서버 시작 없이 테스트 가능한 로직은 `generator.ts`, `fallback.ts` 같은 순수 함수로 분리한다. 근거: [generator.ts](./generator.ts#L1-L2), [generator.test.ts](./generator.test.ts#L4-L40), [fallback.test.ts](./fallback.test.ts#L4-L41).

## Local Golden Rules

- API 키는 `resolveApiKey` 내부에서만 서버 환경변수와 요청 키를 결합하고, `/api/config`에서는 존재 여부만 응답한다. 근거: [index.ts](./index.ts#L59-L66), [index.ts](./index.ts#L147-L156), [index.ts](./index.ts#L167-L172).
- 429와 503은 일반 500으로 합치지 않는다. 현재 상태 코드별 사용자 메시지를 유지한다. 근거: [index.ts](./index.ts#L191-L211).
