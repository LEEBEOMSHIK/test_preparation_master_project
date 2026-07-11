# Agent Handoff - CURRENT

이 파일은 세션 종료, 컨텍스트 압축, 다른 AI 또는 다른 세션 인계를 위한 현재 작업 상태 기록이다.
작업 단계 경계마다 갱신하고, 완료 후에도 마지막 커밋과 남은 이슈를 간단히 남긴다.
누적 로그가 아니라 최신 작업 1개의 상태 스냅샷으로 운영한다.

## Current Goal

- SQL 문항 "결과 테이블(컬럼×튜플) 정답" 지원 — **구현·검증·E2E 완료, 커밋 대기.**

## 메인 검증 결과 (완료)

- canonical 다중집합 키 구분자: 구현 중 원시 U+0001 제어문자가 소스에 박혀 두 세션이 다르게 판단하는 혼선 발생 → 명시적 U+0001 (backslash-u0001 escape) 이스케이프로 최종 통일(기능 동일), 셀 경계 충돌 회귀 테스트(["12","3"] vs ["1","23"]) 존재 확인.
- `./gradlew test --rerun` 전체 통과(AnswerGraderTest 69·QuestionBankServiceTest 26), `npx tsc --noEmit` 0 에러.
- 백엔드 재기동 후 E2E (테스트 문항 112 등록→검증→삭제 완료):
  - 관리자 응답: expectedResult 포함 / 퀴즈 응답: expectedResult·answer 미노출 + sqlResultColumns만 노출 ✅
  - 채점 6케이스: 정순·역순(순서무관)·대소문자+숫자동치(100.0=100) true / 값 틀림·행 부족·셀 수 불일치 false ✅

## 승인된 설계

1. **데이터 모델**: `sql_data` JSONB 안에 선택 필드 `expectedResult { columns: string[], rows: string[][], orderedRows: boolean }` (마이그레이션 불필요). rows 비어있으면 저장 불가(0행 정답은 범위 제외), 각 행 길이=컬럼 수 검증.
2. **채점 우선순위**: 보기(options) 있으면 기존 번호 채점 유지(전역 불변식 보존) → 그 외 expectedResult 있으면 결과 테이블 채점 → 그 외 기존 텍스트 채점. 결과 테이블 채점: userAnswer를 줄(행)·`|`(셀)로 파싱, 셀 정규화(trim·대소문자·공백축약·숫자 동치 3.0=3·NULL 대소문자 무시), 컬럼 수 불일치 오답, 행 비교는 orderedRows=false면 다중집합(중복 행 카운트), true면 위치 비교.
3. **정답 유출 방지 (핵심)**: QuizQuestionView는 sqlData에서 expectedResult를 **제거**하고, 대신 `sqlResultColumns`(컬럼명만)를 노출해 FE 그리드 헤더로 사용. 관리자 응답(QuestionBankResponse)은 전체 포함.
4. **관리자 에디터**: SqlProblemEditor에 "결과 테이블 정답 (선택)" 섹션(컬럼/행 그리드 + orderedRows 체크박스). expectedResult 입력 시 등록/수정 페이지의 정답 텍스트 입력 숨김, payload의 answer는 expectedResult 직렬화 문자열("c1 | c2\nv1 | v2")로 자동 세팅(채점 후 CheckResult.correctAnswer 표시 호환).
5. **사용자 입력**: 퀴즈 풀이에서 sqlResultColumns 있으면 표 그리드 입력(열=컬럼명 고정, 행 추가/삭제) → 제출 시 `셀|셀` + 줄바꿈 직렬화(기존 check API 문자열 계약 유지).
6. **하위 호환**: expectedResult 없는 기존 SQL 문항은 기존 채점 그대로.
7. **알려진 한계(문서화)**: 셀 값에 `|` 포함 시 왜곡, 0행 정답 미지원, 컬럼명 헤더 항상 노출(힌트 옵션은 후속).

## 구현 완료 내역 (미커밋)

- 백엔드: `SqlData`에 `expectedResult`(선택) 추가 + 1-인자 하위호환 생성자 + `withoutExpectedResult()`, `QuestionBankService.validateSqlExpectedResult` 신설, `AnswerGrader.isSqlResultTableCorrect` 신설(+ `hasMeaningfulOptions` public화), `UserQuizService.checkAnswer` 분기 추가, `QuizQuestionView.sqlResultColumns` 필드 추가(expectedResult는 항상 제거). `QuestionBankResponse`는 무변경(관리자는 expectedResult 전체 노출 유지).
- 프론트엔드: `types/index.ts`(`SqlExpectedResult` 타입), `lib/sql.ts`(Draft 확장 + `serializeSqlResult`), `SqlProblemEditor.tsx`(결과 테이블 정답 섹션), `SqlProblemView.tsx`(expectedResult 표 렌더 추가), 신규 `SqlResultAnswerInput.tsx`, 관리자 등록/수정 페이지 2곳(정답 입력 숨김+answer 자동 세팅), 퀴즈 풀이 페이지(`user/quiz/[categoryId]/page.tsx`) 그리드 입력 분기.
- 문서: `CLAUDE.md` Shared Utilities 표 갱신(SqlProblemEditor/SqlProblemView/lib/sql.ts 행 + SqlResultAnswerInput 신규 행). `AGENTS.md`는 해당 SQL 관련 행 자체가 없어(이미 CLAUDE.md와 불일치 상태) 갱신 대상에서 제외 — 별도 정리 필요 시 후속 작업.
- 히스토리(prepend 확인 완료, git diff --numstat 전부 순증가만): `docs/history/back/adm/QuestionBank_Modified.md`(HIST-20260711-001), `docs/history/front/adm/AdminQuestion_Modified.md`(HIST-20260711-001), `docs/history/front/usr/UserQuiz_Modified.md`(HIST-20260711-001).

## 검증 (webapp-developer 직접 수행)

- `./gradlew test` 전체 통과 (AnswerGraderTest 68건, QuestionBankServiceTest 26건 포함 — SQL 결과 테이블 채점 11종 + expectedResult 검증 4종 신규).
- `npx tsc --noEmit` 0 에러.
- `npm run build`·dev 서버 재시작은 수행하지 않음(정책) — **다음 세션/메인이 dev 서버 재시작 후 E2E(관리자 SQL 결과 테이블 정답 등록 → 퀴즈 풀이에서 그리드 채점 → 정답 유출 안 되는지 네트워크 탭 확인) 수행 필요.**

## Warnings / Notes

- 백엔드 변경 후 반드시 dev 서버 재시작 + E2E(관리자 등록→퀴즈 채점, sqlData.expectedResult가 퀴즈 응답에 절대 안 실리는지 network 탭으로 재확인) — 메인이 수행.
- 히스토리 prepend만, `npm run build` 금지, `references/` 미추적 유지.
- 아직 git add/commit 되지 않음 — 사용자 승인 후 커밋 필요.

## Last Commit

- `bea6f43 [FE] feat: 문항 관리 출처 조회조건 추가 및 조회조건 세션 유지` (이번 SQL 결과 테이블 작업은 아직 미커밋)
