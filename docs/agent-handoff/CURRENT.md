# Agent Handoff - CURRENT

이 파일은 세션 종료, 컨텍스트 압축, 다른 AI 또는 다른 세션 인계를 위한 현재 작업 상태 기록이다.
작업 단계 경계마다 갱신하고, 완료 후에도 마지막 커밋과 남은 이슈를 간단히 남긴다.
누적 로그가 아니라 최신 작업 1개의 상태 스냅샷으로 운영한다.

## Current Goal

- `/feature` SQL 문항 유형 추가: 관리자 문항 등록/수정에서 SQL용 구조화 데이터(테이블명·컬럼·행) 입력 에디터 제공, 사용자 풀이/상세에서 표 또는 SQL 스키마 형태 렌더링. SCHEDULING 유형 패턴 준용. QuestionBank(데일리 퀴즈)만 지원, Question(시험) enum은 변경하지 않음.

## Pipeline Status

- [x] 1단계 분석 (codebase-explorer) — 완료
- [x] 2단계 설계 (webapp-planner) — 완료
- [x] 승인 게이트 — 사용자 승인: 이대로 구현 진행
- [x] 3단계 구현 (webapp-developer) — **완료**
- [x] 4단계 검증(정적) — Low 결함 1건 발견 → **수정 완료** (아래 "정적 검증 수정 이력" 참조)
- [x] 5단계 테스트(동적, webapp-tester) — **전부 통과**: tsc 0 errors / jest 2 suites 4 tests 통과 / `gradlew test --rerun` 96건 0 실패(QuestionBankServiceTest SQL 6건 + AnswerGraderTest SQL 4건 실행 확인)

**파이프라인 완료 — 커밋 대기 상태.**

## 정적 검증 수정 이력

- **Low 결함 1건** (`frontend/src/lib/sql.ts` `toSqlDataPayload`): 컬럼을 이름 기준으로 `filter`하고 행은 `row.slice(0, columnCount)`로 위치 기준으로 잘라 인덱스 기준이 어긋남 — 중간 컬럼 이름만 비우면 값이 밀려서 저장됨(길이는 일치해 백엔드 검증 통과, 조용히 어긋난 데이터 저장). `keepIndices`(이름이 있는 컬럼의 원본 인덱스)를 먼저 구해 컬럼 필터링과 행 셀 선택 모두 동일 인덱스로 통일해 수정. `npx tsc --noEmit` 재확인 통과. 히스토리: `docs/history/front/adm/AdminQuestion_Modified.md` HIST-20260709-002.

## 구현 완료 내역

### 백엔드 (신규/수정)
- `entity/support/SqlData.java` (신규) — `SqlData(tables)` / `SqlTable(name,columns,rows?)` / `SqlColumn(name,dataType?,primaryKey)` record
- `entity/QuestionBank.java` — `QuestionType.SQL` 추가, `sqlData` 필드(JSONB) + builder/update 파라미터 추가
- `dto/request/QuestionBankRequest.java`, `dto/response/QuestionBankResponse.java`, `dto/response/QuizQuestionView.java` — `sqlData` 필드/매핑 추가
- `exception/ErrorCode.java` — `SQL_DATA_INVALID` 추가
- `service/QuestionBankService.java` — `validateSqlData()` 신규(테이블 없음/행 길이≠컬럼 수 검증), 등록(단건/일괄)·수정 3경로에 전달
- `service/support/AnswerGrader.java` — SQL을 SHORT_ANSWER·SCHEDULING과 동일한 콤마 다중값 비교 라우팅에 추가
- `docs/db-migration/20260709_01_question_bank_sql_data.sql` (신규) — `sql_data` JSONB 컬럼 + `question_type` CHECK 제약 6개 값 재생성 (운영 수동 적용 필요)
- 테스트: `QuestionBankServiceTest.java`(SQL 검증 6건 + 기존 4개 헬퍼에 sqlData 인자 보정), `AnswerGraderTest.java`(SQL 라우팅 4건)

### 프론트엔드 (신규/수정)
- 신규: `lib/sql.ts`(Draft 헬퍼), `components/ui/SqlProblemEditor.tsx`(cyan 계열 등록/수정 에디터), `components/ui/SqlProblemView.tsx`(표/스키마 DDL 토글)
- `types/index.ts` — `QuestionType`에 `'SQL'`, `SqlColumn`/`SqlTable`/`SqlData` 타입, `QuestionSummary.sqlData?`
- `services/examService.ts`, `services/quizService.ts` — `sqlData?: SqlData` 필드 추가
- `app/admin/exams/questions/new/page.tsx`, `[id]/edit/page.tsx` — QUESTION_TYPES·isSql 분기·에디터·payload 반영
- `app/admin/exams/questions/page.tsx`, `app/user/bookmarks/page.tsx`, `components/ui/QuestionDetailModal.tsx` — TYPE_LABEL/TYPE_COLOR SQL 키(cyan) + 렌더
- `app/user/quiz/[categoryId]/page.tsx` — SqlProblemView 렌더, 답안 입력을 `(isCode || isSql)`로 확장(CodeAnswerInput 재사용)
- 계획에 없었으나 컴파일 에러로 발견되어 추가 수정: `app/admin/exams/papers/new/page.tsx`, `app/admin/exams/papers/[id]/edit/page.tsx` (공용 `QuestionType` Record에 SQL 키 누락)
- 문서: `CLAUDE.md` Shared Utilities 표(3행), `docs/db-guidelines.md`, `frontend/src/data/tableComments.ts`에 sql_data 코멘트 추가

### 히스토리 기록 완료 (모두 prepend, 기존 항목 보존 확인함)
- `docs/history/back/adm/QuestionBank_Modified.md` — HIST-20260709-001
- `docs/history/front/adm/AdminQuestion_Modified.md` — HIST-20260709-001, HIST-20260709-002(정적 검증 Low 결함 수정)
- `docs/history/front/adm/AdminExamPaper_Modified.md` — HIST-20260709-001 (papers 페이지 SQL 키 추가분)
- `docs/history/front/usr/UserQuiz_Modified.md` — HIST-20260709-001
- `docs/history/front/usr/QuestionBookmark_Modified.md` — HIST-20260709-001

## Verification (구현 단계에서 직접 실행)

- `npx tsc --noEmit` (frontend): **통과** (0 errors)
- `./gradlew compileJava` (backend): **통과**
- `./gradlew compileTestJava` (backend): **통과** (QuestionBankServiceTest 기존 4개 헬퍼 positional record 인자 보정 필요했음 — 완료)
- `./gradlew test` (backend, 전체): **통과**
- `npm run lint`: 프로젝트에 ESLint 설정이 없어(대화형 초기 설정 프롬프트만 뜸) 실행하지 않음 — 기존에도 미구성 상태
- `npm run build`는 dev 서버 캐시 충돌 가능성 때문에 실행하지 않음(정책상 생략)

## Remaining

- 운영 DB에는 `docs/db-migration/20260709_01_question_bank_sql_data.sql`을 수동 적용해야 함(dev는 ddl-auto=update로 자동 반영, CHECK 제약은 수동 적용 필요).
- 커밋되지 않음 — 사용자 요청 시에만 커밋.
- 후속 개선 후보(Low, 이번 범위 제외): (1) validateSchedulingData/validateSqlData의 rows null 요소 NPE(500) — SCHEDULING 선례와 동일 노출, 관리자 전용 API. (2) BookmarkQuestion 타입에 sqlData·schedulingData·instruction 미포함 — 북마크 상세 모달에서 구조 데이터 미표시(기존 공통 갭). (3) LinkedQuestionBox의 SCHEDULING+SQL 구조 데이터 렌더 미지원(기존 갭).

## Warnings / Notes

- 기존 미추적 `references/`는 이번 작업과 무관하므로 건드리지 않았다.
- 히스토리 파일은 전부 Read 후 상단에 prepend만 했으며 기존 항목을 덮어쓰지 않았다(git diff로 확인 가능).

## Last Commit

- `f1f065b [INFRA] docs: 인계 스냅샷 완료 커밋 정보 갱신` (이번 SQL 유형 작업은 아직 커밋 전)
