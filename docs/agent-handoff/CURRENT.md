# Agent Handoff - CURRENT

이 파일은 세션 종료, 컨텍스트 압축, 다른 AI 또는 다른 세션 인계를 위한 현재 작업 상태 기록이다.
작업 단계 경계마다 갱신하고, 완료 후에도 마지막 커밋과 남은 이슈를 간단히 남긴다.
누적 로그가 아니라 최신 작업 1개의 상태 스냅샷으로 운영한다.

## Current Goal

- 사용자 신고: "AI 커스텀 문제(프로그래밍 언어) 등록 후 C언어 퀴즈 접근 시 500, 다른 카테고리도 동일" — 원인 조사 및 수정. **완료.**

## 원인 (2건, 둘 다 SQL 문항 기능(commit 344cb32) 배포 직후 발생)

1. **[해결] 백엔드 프로세스 클래스로더 불일치** — PID 72660(2026-07-08 15:18 시작, `bootRun` classpath가 `backend/build/classes/java/main` 직접 참조)이 재시작 없이 계속 떠 있던 상태에서, 오늘 SQL 기능 gradle 빌드가 디스크의 `.class`를 새 버전으로 덮어씀. 이미 로드된 구버전 `QuestionBank.class`(getSqlData() 없음)와 뒤늦게 지연 로딩된 신버전 `QuizQuestionView.class`(getSqlData() 호출)가 충돌 → 모든 퀴즈 조회(`UserQuizService.getQuizQuestions`)에서 `NoSuchMethodError` → 500. `app.log`에서 스택트레이스로 확정. **조치**: PID 72660 종료 → `./gradlew bootRun`으로 완전 재기동.
2. **[해결] `DataInitializer.fixQuestionTypeConstraints()` 결함** — 재기동 로그에서 추가 발견. 매 앱 기동 시 `questions`·`question_bank` 두 테이블에 동일한 구버전 4값 CHECK(`MULTIPLE_CHOICE,SHORT_ANSWER,OX,CODE`)를 강제 재생성하던 로직이 SCHEDULING(7/6)·SQL(7/9) 추가 이후 갱신되지 않아, `question_bank`에 대해 DROP은 성공·ADD는 위반으로 실패(예외 캐치돼 겉으론 안 보임) → 이후 SCHEDULING/SQL 행이 없는 시점에 재기동하면 ADD가 성공해버려 잘못된 4값 제약이 걸리고 이후 SCHEDULING/SQL 저장이 전부 500이 되는 잠재 결함. **조치**: `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java`의 `fixQuestionTypeConstraints()`를 테이블별로 분리(`questions`=4값 유지, `question_bank`=SCHEDULING·SQL 포함 6값)하도록 수정.

## 조치 내역

- 프로세스: PID 72660 종료 → 1차 재기동(PID 38540, sql_data 컬럼 자동 생성 확인) → DataInitializer 수정 후 PID 38540 종료 → 2차 재기동(PID 69952, question_bank 6값 CHECK 재생성 성공 확인).
- 코드 수정: `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java` — `fixQuestionTypeConstraints()`를 `fixQuestionTypeConstraint(table, allowedValues)` 헬퍼 호출로 분리.
- 히스토리: `docs/history/back/adm/QuestionBank_Modified.md` HIST-20260709-002 prepend (기존 항목 보존 확인).

## 검증

- `curl` E2E (테스트 계정 user@tpmp.com 로그인 후):
  - `GET /api/user/quiz/questions?categoryId=3&language=c`(프로그래밍 언어/C, 사용자 재현 시나리오) → **200**
  - `GET /api/user/quiz/questions?categoryId=2`(SQL 카테고리) → **200**
  - `GET /api/user/quiz/questions?categoryId=1`(운영체제) → **200**
  - `GET /api/user/quiz/categories` → **200**
- 재기동 로그: `question_bank.question_type_check 제약 재생성 완료`(수정 전엔 `재생성 실패`).

## Remaining

- **커밋되지 않음** — `DataInitializer.java` 수정 + 히스토리 파일. 사용자 요청 시 커밋.
- 운영 DB에는 여전히 `docs/db-migration/20260709_01_question_bank_sql_data.sql` 수동 적용 필요(미적용 상태로 추정, 로컬은 ddl-auto=update로 이미 반영됨).
- 백엔드는 현재 PID 69952로 포그라운드리스 실행 중(로그: `backend/logs/restart-bootrun2.out.log`). 세션 종료 시에도 계속 떠 있을 수 있음 — 다음 코드 변경 후에는 **반드시 이 프로세스를 재시작**해야 이번과 동일한 클래스로더 불일치 재발을 막을 수 있음.
- 후속 개선 후보(Low, 이번 범위 밖, SQL 기능 구현 시 이미 식별): BookmarkQuestion 타입에 sqlData·schedulingData 미포함, LinkedQuestionBox 구조 데이터 렌더 미지원.

## Warnings / Notes

- 기존 미추적 `references/`는 이번 작업과 무관하므로 건드리지 않았다.
- 로그 파일(`backend/logs/restart-bootrun*.log`)은 진단용 임시 산출물, 정리 불필요.

## Last Commit

- `344cb32 [FE|BE] feat: 데일리 퀴즈 SQL 문항 유형 추가` (이번 버그 수정은 아직 커밋 전)
