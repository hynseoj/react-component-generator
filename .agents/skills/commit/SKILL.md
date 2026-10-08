---
name: commit
description: Analyze repository changes and prepare convention-aligned Korean Git commits when the user asks to commit, save changes, or says "커밋해줘".
---

# Commit

변경사항을 논리적인 커밋 단위로 정리하고, 사용자의 커밋 요청을 승인으로 간주해 Git 커밋을 만든다.

## Workflow

1. `git status --short`와 `git diff`로 staged/unstaged 변경사항을 확인한다. 필요하면 `git diff --cached`와 최근 커밋 로그를 확인해 현재 저장소의 메시지 관례를 따른다.
2. 한 변경 목적을 기준으로 파일을 묶는다. 서로 독립적으로 되돌리거나 리뷰할 수 있는 변경은 별도 커밋으로 제안한다. 사용자 변경이나 관련 없는 변경은 포함하지 않는다.
3. 각 단위에 한국어 Conventional Commit 메시지를 작성한다. 형식은 `feat: 요약`, `fix: 요약`, `refactor: 요약`, `chore: 요약`을 사용한다. 가장 적합한 타입을 선택하며, 의미가 불명확한 포괄적 메시지는 피한다.
4. 분류한 단위별로 필요한 파일만 stage하고 바로 커밋한다. 커밋 요청에 포함되지 않은 사용자 변경이나 관련 없는 변경은 stage하지 않는다.
5. 커밋 후 `git status --short`로 결과를 확인하고 커밋 해시와 남은 변경사항을 알린다.

## Authorization

사용자가 이 스킬의 트리거에 해당하는 방식으로 커밋 또는 변경사항 저장을 요청하면, 그 요청을 `git add`와 `git commit` 실행의 명시적 승인으로 간주한다. 별도의 승인 질문은 하지 않는다. 커밋과 무관한 작업 요청만으로는 커밋하지 않는다.
