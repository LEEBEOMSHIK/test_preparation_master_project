# Agent Handoff - CURRENT

## 현재 목표와 사용자 결정 사항

- 5회차 시험지의 기존 Question 100행을 유지하면서 QuestionBank 100행과 연결·동기화한다.
- Question/응시/결과/이력에서 6종 문항을 지원하며 SQL expectedResult는 응시 전 숨긴다.
- 2026-1 Q4 정답은 `3,5,6`으로 보정하고 2025-2 Q20 정답 원문은 정확히 보존한다.
- 사용자 전체 동기화 요청에 따라 대상 시험의 활성 응시 세션을 정리한 뒤 백필을 적용한다.

## 완료한 작업

- Question과 ExamHistoryDetail에 scheduling_data/sql_data JSONB 및 TEXT 답안 매핑 추가.
- 관리자 생성·수정·동기화 경로에서 SCHEDULING/SQL 지원, 시험유형 ID를 후보 키에 추가.
- 응시 전 SQL 기대결과 제거 및 결과 입력 컬럼 제공, 제출 시 SQL 결과 테이블 채점과 구조화 이력 저장.
- 관리자/사용자 FE에서 구조화 문제 선택·표시·입력·결과 재현 지원.
- 문제은행과 수동 시험지 문항이 `StructuredQuestionValidator`를 공유하도록 구조 검증 통일.
- SQL 결과 입력 value 복원, 외부 변경 동기화 및 관련 회귀 테스트 보완.
- DDL02와 100행 명시 매핑 DDL03을 실제 DB에 적용하고 데이터 무결성을 확인.
- 관련 BE/FE 회귀 테스트와 DB 문서, 관리자·사용자 FE/BE 히스토리 작성.

## 실제 DB 적용 결과

- `20260717_02_expand_question_structured_types.sql` 적용 성공.
- `20260717_03_backfill_all_exam_question_sources.sql` 적용 성공: `UPDATE 100`, `COMMIT`.
- 최초 적용 시 활성 세션 ID 20~23이 확인됨:
  - 2025년 1회, 2025년 2회, 2025년 3회, 2026년 1회.
  - 사용자 전체 동기화 요청에 따라 해당 세션을 삭제했고 최종 `active=0` 확인.
- DB 스키마 확인:
  - Question/ExamHistoryDetail 답안 계열은 TEXT.
  - `scheduling_data`, `sql_data`는 JSONB.
  - questions question_type CHECK는 6종(MULTIPLE_CHOICE/SHORT_ANSWER/OX/CODE/SCHEDULING/SQL).

## 데이터 검증 결과

- 회차별 연결: 2024-3, 2025-1, 2025-2, 2025-3, 2026-1 각각 `20/20 linked`.
- 전체 연결: `100/100`, 원본 대비 `drift=0`.
- 2025년 2회 13번 SCHEDULING 문항에 구조화 데이터 존재.
- 2026년 1회 4번 정답은 `3,5,6`.
- 2025년 2회 20번 정답은 원본 `1. TTL,2. 부장, 3. 대리, 4. 과장, 5. 차장` 유지.
- `exam_history_details=60`으로 적용 전후 불변.

## 실행한 검증과 결과

- 백엔드 전체 테스트: `186/186` 통과.
- 프론트엔드 TypeScript: `tsc` 통과.
- 프론트엔드 Jest: `5 suites / 17 tests` 통과.
- Next.js build: 정적 페이지 `48/48` 통과.
- 기존 viewport metadata 경고는 남아 있으나 이번 변경으로 발생한 오류는 아님.
- `git diff --check` 통과. Windows CRLF 변환 예정 경고만 발생.

## 서버 재시작·접속 확인

- 백엔드 재시작 완료: `Started` 로그 확인, 비인증 API 요청은 예상대로 `401`.
- 프론트엔드 재시작 완료: HTTP `200` 확인.
- in-app browser 도구가 unavailable(`[]`) 상태여서 실제 클릭 화면 검증은 실행하지 못함.

## 미완료 작업

- 필요 시 브라우저에서 관리자 시험지 동기화 화면과 사용자 SCHEDULING/SQL 응시·결과 화면을 수동 확인.

## 수정한 파일 목록

- 백엔드: `Question.java`, `ExamHistoryDetail.java`, `DataInitializer.java`, 관련 request/response DTO, `ExamService.java`, `ExamQuestionSyncService.java`, `UserExaminationService.java`, 관련 Repository/ErrorCode.
- 백엔드 테스트: `ExamQuestionSyncServiceTest.java`, `UserExaminationSessionLifecycleTest.java`.
- 정적 검증 보완: `StructuredQuestionValidator.java`, `ExamServiceStructuredQuestionTest.java`, `SqlResultAnswerInput.tsx` 및 테스트, `frontend/src/lib/sql.ts`, 100문항 백필 SQL.
- 프론트엔드: 관리자 시험지 신규/수정 페이지, 사용자 시험 페이지, `ExamResultDisplay.tsx`, exam 서비스/공용 타입/테이블 설명.
- 프론트엔드 테스트: `frontend/src/lib/sql.test.ts`.
- DB: `20260717_02_expand_question_structured_types.sql`, `20260717_03_backfill_all_exam_question_sources.sql`, `docs/db-guidelines.md`.
- 이력: 관리자·사용자 FE/BE 4개 Modified 문서.

## 실패·경고·주의사항

- in-app browser 미사용으로 클릭 기반 UI 확인만 남아 있다.
- 기존 viewport metadata 경고가 있다.
- 기존 미커밋 traceNotation 코드·테스트·히스토리는 건드리지 않고 보존했다.

## 다음 세션이 바로 실행할 명령

```powershell
cd C:\project\tpmp\test_preparation_master_project
git status --short
```

- 필요 시 브라우저에서 주요 관리자/사용자 화면을 수동 확인한다.

## 건드리면 안 되는 파일 또는 기존 미추적 파일

- `frontend/src/lib/traceNotation.ts`, `frontend/src/lib/traceNotation.test.ts`와 기존 관련 히스토리 내용.
- `.env`, `references/images/*`, 기타 이번 작업과 무관한 사용자 변경.
