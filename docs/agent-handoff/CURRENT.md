# Agent Handoff - CURRENT

이 파일은 세션 종료, 컨텍스트 압축, 다른 AI 또는 다른 세션 인계를 위한 현재 작업 상태 기록이다.
작업 단계 경계마다 갱신하고, 완료 후에도 마지막 커밋과 남은 이슈를 간단히 남긴다.
누적 로그가 아니라 최신 작업 1개의 상태 스냅샷으로 운영한다.

## Current Goal

- 데일리 퀴즈: AI 커스텀 문제가 있는 카테고리를 CODE 언어 필터 선례처럼 나눠, "AI 커스텀만"(및 기출만/전체) 골라 풀 수 있게 하는 풀스택 기능. **구현 완료, 검증 완료, 커밋 전(미커밋).**

## 완료한 작업

- BE: `QuestionBankRepository`에 `findDistinctCategoryIdsWithAiCustomQuestions()` 신규 쿼리 추가, `findRandomByCategory`에 `source` 파라미터 추가(native query). `DomainSlaveResponse`에 `hasAiCustomQuestions` 필드 추가(3-arg `from`, 1-arg 하위 호환 유지). `UserQuizService.getCategories`에 `aiCustomCategoryIds` 조회·전달, `getQuizQuestions` 4-arg(`categoryId, limit, language, source`)로 확장 + `normalizeSource` 신규. `UserQuizController`에 `source` 쿼리 파라미터 추가. `UserQuizServiceTest`에 source 정규화 테스트 6개 추가(기존 language 테스트 4개 유지, 헬퍼 4-arg로 갱신).
- FE: `DomainSlave` 타입에 `hasAiCustomQuestions?` 추가. `quizService.getQuestions`에 `source` 파라미터 추가. `CodeLanguageModal`을 `showLanguage`/`showSource` props로 확장 — 둘 다 true면 언어+출처 두 섹션을 함께 보여주고 "시작" 버튼으로 확정(`onSelect({ language?, source? })` 시그니처로 변경). `user/quiz/page.tsx`의 `handleSelect`/`handleSelectScope`(구 `handleSelectLanguage`)에 출처 분기 추가. `user/quiz/[categoryId]/page.tsx`에 `source` 쿼리 읽기·`loadBatch` 반영·헤더 출처 배지 추가.
- 문서: `CLAUDE.md`/`AGENTS.md`의 `CodeLanguageModal` 행 갱신. 히스토리 prepend: `docs/history/back/usr/UserQuiz_Modified.md`(HIST-20260710-001), `docs/history/front/usr/DailyQuiz_Modified.md`(HIST-20260710-001).

## 검증 결과

- `cd backend && ./gradlew test` → BUILD SUCCESSFUL (전체 통과)
- `cd frontend && npx tsc --noEmit` → 오류 없음
- `npm run build` 미실행(정책상 금지).
- **백엔드 재기동 완료 + E2E 통과** (메인 에이전트 직접 실행):
  - `/api/user/quiz/categories`: 운영체제 hasAiCustom=true, 프로그래밍 언어 hasAiCustom=true+hasCode=true(복합 모달 케이스 실존), 나머지 false — 데이터와 일치
  - `source=AI_CUSTOM`(운영체제): 5문항 전부 연도·회차 null / `source=EXAM`: 5문항 전부 연도·회차 있음 / source 없음: 혼합 10문항

## Warnings / Notes

- 백엔드 코드 변경했으므로 사용자가 dev 서버 재시작 필요(클래스로더 불일치 사고 이력, 이번 세션에서는 재시작하지 않음).
- 히스토리 prepend만, `references/` 미추적 유지.
- 아직 git commit/push 하지 않음 — 사용자 확인 후 커밋 필요.

## Last Commit

- `0412589 [FE] fix: AI 커스텀 문항 판정을 연도·회차 기준으로 변경(문항번호 병기)` (이번 작업분은 아직 미커밋)
