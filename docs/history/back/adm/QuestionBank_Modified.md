## HIST-20260717-001

- **날짜**: 2026-07-17
- **수정 범위**: 콘텐츠 데이터 / 2026년 1회 3번(DB 설계 절차)·18번(SQL JOIN·서브쿼리) — 이미지 → 구조·데이터 치환 (코드 변경 없음)
- **수정 개요**: 두 문항이 스크린샷 이미지(`<img src="/uploads/...">`)와 흰색 글씨 SQL(`<span style="color: rgb(255,255,255)">`) 형태로 등록돼 있던 것을 구조화 데이터로 치환했다. 문제은행(`question_bank` id=3·18)과 시험 문항(`questions` id=83·98, exam_id=5 seq 3·18) 양쪽 모두 적용, `docs/sql/tpmp_content_data.sql` 덤프 동기화.

### 변경 내용

| 문항 | 변경 |
|------|------|
| 3번 (DB 설계 절차) | content를 세로 흐름 HTML(`( ㄱ )<br>↓<br>( ㄴ )…`)로, [보기] 5개를 `options` JSON(`["구현","개념적 설계","논리적 설계","요구사항 분석","물리적 설계"]`)으로, 정답을 보기 번호 슬롯 `4,2,3,5,1`로 전환(빈칸 순서 채점 적용 — 절차 문제라 순서까지 채점), 해설 추가 |
| 18번 (SQL JOIN·서브쿼리) | employee/dept 테이블을 content의 HTML `<table>`로, SQL을 `code` 컬럼(`language='sql'` — CodeBlock 구문강조)으로 이동, 해설 추가(AVG=200 → 부서 20 → 사원 2명 → COUNT(*)=2). 정답 `2` 유지 |

- 사용 화면 확인: 시험 응시(`app/exam/[id]`)·퀴즈 풀이(`user/quiz/[categoryId]`) 모두 `q.code` 존재 시 유형 무관 CodeBlock 렌더, options 존재 시 읽기 전용 보기 목록 + 번호 입력 UI(HIST-20260707 계열 기능) 사용.
- 이전 이미지 파일(`/uploads/images/8eb3a757-…`, `187bb124-…`)은 삭제하지 않고 미참조 상태로 남김.

### 복원 방법
이 ID(HIST-20260717-001)로 복원 시 git에서 `docs/sql/tpmp_content_data.sql`의 해당 4개 INSERT를 이전 커밋으로 되돌리고 그 값으로 DB를 UPDATE한다.

## HIST-20260713-001

- **날짜**: 2026-07-13
- **수정 범위**: 백엔드 / 문항은행(QuestionBank) — AI 커스텀 문항 문항번호(questionNo) 자동 채번 지원
- **수정 개요**: 문항 등록/수정/일괄등록 시 questionNo를 비워두면 기출 문항(examTypeId+examYear+examRound 완전)뿐 아니라 **AI 커스텀 문항(examYear·examRound 모두 null, categoryId 존재)** 도 "같은 카테고리의 AI 커스텀 문항" 그룹 내 최대 questionNo + 1로 자동 채번되도록 확장했다. 한쪽만 null인 어중간한 경우(예: examYear만 null)는 기존처럼 어느 그룹에도 속하지 않아 자동 채번 없이 null을 유지한다(기출/AI 커스텀 분류 기준인 "examYear·examRound 모두 null"과 동일 기준을 사용).
- `QuestionBankService`의 채번 그룹 키 `QuestionNoGroup` record를 `(examTypeId, examYear, examRound, categoryId, aiCustom)`으로 확장하고, 정적 팩토리 `examGroup`/`aiCustomGroup` 두 개로 분리했다. 그룹 판정을 `resolveGroupOrNull(request)` 단일 메서드로 통일해 `resolveQuestionNo`(단건)·`resolveQuestionNosForBulk`(일괄) 양쪽이 동일한 판정 로직을 재사용하도록 리팩토링했다 — 기출 그룹 판정(`hasCompleteQuestionNoGroup`)과 그 채번 쿼리(`findMaxQuestionNo`)는 전혀 건드리지 않아 기존 기출 자동채번 동작은 100% 동일하게 유지된다.
- `validateQuestionNoDuplicate`도 두 그룹을 모두 처리하도록 확장 — questionNo를 명시한 경우 기출 그룹이면 기존 `existsActiveQuestionNo(ExcludingId)`, AI 커스텀 그룹이면 신규 `existsActiveAiCustomQuestionNo(ExcludingId)`로 같은 카테고리의 AI 커스텀 문항 내 중복만 검사한다(수정 시 자기 자신 제외 규칙 동일 유지).
- 수정(`updateQuestion`) 경로는 기존과 동일하게 `resolveQuestionNo(request, id)`를 그대로 호출하므로 이번 확장이 자동으로 적용된다 — 별도 코드 변경 없이 동작 확인만 수행(테스트로 커버).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/repository/QuestionBankRepository.java` | 수정 | `findMaxAiCustomQuestionNo(categoryId)`, `existsActiveAiCustomQuestionNo(categoryId, questionNo)`, `existsActiveAiCustomQuestionNoExcludingId(questionId, categoryId, questionNo)` 3개 JPQL 쿼리 메서드 추가(모두 `examYear IS NULL AND examRound IS NULL AND delYn = 'N'` 조건) |
| `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java` | 수정 | `QuestionNoGroup` record에 `categoryId`·`aiCustom` 필드 추가(`examGroup`/`aiCustomGroup` 팩토리 분리), `resolveGroupOrNull` 신규 private 메서드 추가, `resolveQuestionNo`·`resolveQuestionNosForBulk`·`loadNextQuestionNo`·`validateQuestionNoDuplicate`가 두 그룹을 함께 처리하도록 수정, `isAiCustomGroup` 신규 판정 메서드 추가 |
| `backend/src/test/java/com/tpmp/testprep/service/QuestionBankServiceTest.java` | 추가 | AI 커스텀 채번 테스트 6종 추가(최대+1 부여, 기존 번호 없으면 1번, 명시 번호 중복 거부, 수정 시 자기 자신 제외, 일괄등록 순차 증가, 일괄등록에서 기출·AI 커스텀 그룹 혼재 시 독립 채번) |

### 수정 상세

#### `backend/src/main/java/com/tpmp/testprep/repository/QuestionBankRepository.java`
- 변경 전: AI 커스텀 문항 전용 최대번호/중복조회 쿼리 없음(기출 그룹 전용 `findMaxQuestionNo`·`existsActiveQuestionNo(ExcludingId)`만 존재)
- 변경 후: 카테고리+`examYear IS NULL AND examRound IS NULL`+`delYn='N'` 조건의 `findMaxAiCustomQuestionNo`/`existsActiveAiCustomQuestionNo`/`existsActiveAiCustomQuestionNoExcludingId` 3개 메서드 추가
- 이유: AI 커스텀 문항 그룹의 최대 문항번호 조회·중복 검증을 위한 전용 쿼리 필요.

#### `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java`
- 변경 전: `QuestionNoGroup(examTypeId, examYear, examRound)` — 기출 그룹만 표현, `hasCompleteQuestionNoGroup`이 아니면 questionNo는 항상 null
- 변경 후: `QuestionNoGroup(examTypeId, examYear, examRound, categoryId, aiCustom)`으로 확장, `resolveGroupOrNull(request)`가 기출 그룹 우선 판정 후 AI 커스텀 그룹(`isAiCustomGroup`: examYear·examRound 모두 null && categoryId 존재)을 판정. `resolveQuestionNo`/`resolveQuestionNosForBulk`/`loadNextQuestionNo`/`validateQuestionNoDuplicate` 모두 이 통일된 판정을 사용하도록 리팩토링
- 이유: AI 커스텀 문항도 카테고리 단위로 자동 채번되도록 지원하되, 기출 채번 로직과 판정 흐름을 하나의 메서드로 통일해 중복 없이 안전하게 확장하기 위함.

### 복원 방법
이 ID(HIST-20260713-001)만으로 복원 시: `QuestionBankRepository`에서 3개 AI 커스텀 전용 쿼리 메서드를 제거하고, `QuestionBankService`의 `QuestionNoGroup`을 `(examTypeId, examYear, examRound)` 3-필드로 되돌리며 `from(request)` 팩토리 하나로 복원, `resolveQuestionNo`/`resolveQuestionNosForBulk`/`loadNextQuestionNo`를 `hasCompleteQuestionNoGroup` 기준 단일 분기로 되돌리고 `validateQuestionNoDuplicate`의 AI 커스텀 분기 제거, `isAiCustomGroup`/`resolveGroupOrNull` 메서드 삭제, `QuestionBankServiceTest`에 추가된 AI 커스텀 채번 테스트 6종 제거.

## HIST-20260711-001

- **날짜**: 2026-07-11
- **수정 범위**: 백엔드 / 문항은행(QuestionBank) — SQL 유형 "결과 테이블(컬럼×튜플) 정답" 채점 지원
- **수정 개요**: SQL 유형(QuestionBank 전용) 중 "실행 결과를 쓰시오"류 문항을 채점할 수 있도록 `SqlData`에 선택 필드 `expectedResult { columns: List<String>, rows: List<List<String>>, orderedRows: boolean }`를 추가했다(JSONB 컬럼 내부 필드라 DB 마이그레이션 불필요). 등록 검증(`QuestionBankService.validateSqlData`)에 expectedResult 규칙(컬럼 비어있으면 오류, rows 비어있으면 오류(0행 정답 미지원), 각 행 길이=컬럼 수 검증)을 추가했다. 채점은 `AnswerGrader.isSqlResultTableCorrect(expected, userAnswer)` 신설 — 사용자 답안을 줄바꿈(행)·`\|`(셀)로 파싱해 trim·소문자화·공백축약·숫자 동치(3.0=3)·NULL 대소문자 무시로 정규화한 뒤, `orderedRows=false`면 다중집합(중복 행 카운트 포함) 비교, `true`면 위치별 비교한다. `UserQuizService.checkAnswer`는 **보기(options)가 없고** SQL 유형이며 `sqlData.expectedResult`가 존재할 때만 이 신규 채점으로 분기하고, 그 외(보기 있음 등)는 기존 4-인자 `AnswerGrader.isCorrect` 경로를 그대로 유지해 "보기 있으면 번호 채점" 전역 불변식을 깨지 않는다.
- **정답 유출 방지(핵심)**: 퀴즈 문제 노출 DTO `QuizQuestionView`는 `sqlData`를 `SqlData.withoutExpectedResult()`(expectedResult를 null로 치환한 사본)로 매핑하고, 대신 컬럼명만 담은 `sqlResultColumns` 필드를 신설해 FE 그리드 헤더용으로 노출한다. 관리자 응답 `QuestionBankResponse`는 기존 그대로 `qb.getSqlData()`를 매핑하므로 expectedResult 전체(정답 포함)가 노출된다 — 이 비대칭이 정답 유출 방지의 핵심이다.
- `SqlData`는 record 컴포넌트가 하나 늘어나 canonical 생성자가 2-인자(`tables, expectedResult`)로 바뀌므로, 하위 호환용 1-인자 편의 생성자(`SqlData(List<SqlTable> tables)` → `this(tables, null)`)를 추가해 기존 `new SqlData(List.of(...))` 호출부(테스트 포함)를 그대로 컴파일되게 했다.
- `AnswerGrader.hasMeaningfulOptions(options)`를 private → public으로 변경해 `UserQuizService`가 "보기 있음" 판정을 동일 기준으로 재사용하도록 했다(로직 중복 없이 판단 순서를 통일).
- **(코드 리뷰 반영)** `toCanonicalMultiset`이 다중집합 키를 만들 때 셀들을 구분자 없이 `String.join`으로 이어붙이면, 서로 다른 셀 경계를 가진 행(예: `["12","3"]`과 `["1","23"]`)이 둘 다 `"123"`으로 뭉개져 오답을 정답으로 오판할 수 있는 정합성 결함이 있었다. 실제로는 구분자 파라미터 자리에 사람이 입력할 수 없는 제어문자(U+0001)를 이미 쓰고 있어 이 충돌은 발생하지 않는 상태였지만, 소스에 리터럴 제어문자가 그대로 박혀 있어 코드 리뷰(육안·grep)로는 "빈 문자열 구분자"처럼 보여 실제로 두 개의 별도 세션에서 버그로 오인되는 혼동이 있었다. 재발 방지를 위해 이 구분자를 `CANONICAL_ROW_DELIMITER`라는 명시적 이스케이프 상수로 선언해 가독성을 확보했다(동작 자체는 기존과 동일, U+0001 구분자 유지). 셀 경계 충돌을 정확히 잡아내는 회귀 테스트도 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/support/SqlData.java` | 수정 | 중첩 record `SqlExpectedResult(columns, rows, orderedRows)` 추가, `SqlData`에 `expectedResult` 필드 추가, 1-인자 하위호환 생성자 추가, `withoutExpectedResult()` 헬퍼 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java` | 수정 | `validateSqlData`에서 `validateSqlExpectedResult` 호출 추가, 신규 private 메서드 `validateSqlExpectedResult` 추가(컬럼/행 비어있음·행 길이 불일치 시 `SQL_DATA_INVALID`) |
| `backend/src/main/java/com/tpmp/testprep/service/support/AnswerGrader.java` | 수정 | `isSqlResultTableCorrect(expected, userAnswer)` 신규 public 메서드 추가(정규화·다중집합/순서 비교 helper 포함), `hasMeaningfulOptions`를 public으로 변경, 클래스 Javadoc에 SQL 결과 테이블 채점 경로 설명 추가. **(코드 리뷰 반영)** `toCanonicalMultiset`의 행 join 구분자를 `CANONICAL_ROW_DELIMITER`(U+0001) 명시적 상수로 선언(가독성 개선, 동작 동일) |
| `backend/src/main/java/com/tpmp/testprep/service/UserQuizService.java` | 수정 | `checkAnswer`에서 보기 없음+SQL+expectedResult 존재 시 `isSqlResultTableCorrect`로 분기, 그 외 기존 4-인자 `isCorrect` 유지 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuizQuestionView.java` | 수정 | `sqlResultColumns: List<String>` 필드 추가, `sqlData`는 `withoutExpectedResult()` 사본으로 매핑 |
| `backend/src/test/java/com/tpmp/testprep/service/support/AnswerGraderTest.java` | 추가 | `isSqlResultTableCorrect` 단위 테스트 12종 추가(순서무관 일치, 순서 채점 오답/정답, 셀 수 불일치, 행 수 불일치, 숫자 동치, NULL 대소문자 무시, 다중집합 중복 행, **다중집합 셀 경계 충돌 회귀**, 공백·대소문자 정규화, expected/userAnswer null) |
| `backend/src/test/java/com/tpmp/testprep/service/QuestionBankServiceTest.java` | 추가 | `expectedResult` 검증 테스트 4종 추가(빈 컬럼/빈 행/행 길이 불일치/유효 저장) |

### 수정 상세

#### `backend/src/main/java/com/tpmp/testprep/entity/support/SqlData.java`
- 변경 전: `public record SqlData(List<SqlTable> tables) { ... }` (tables만 보유, SqlExpectedResult 없음)
- 변경 후: `public record SqlData(List<SqlTable> tables, SqlExpectedResult expectedResult) { public SqlData(List<SqlTable> tables) { this(tables, null); } public SqlData withoutExpectedResult() {...} public record SqlExpectedResult(List<String> columns, List<List<String>> rows, boolean orderedRows) {} }`
- 이유: "실행 결과를 쓰시오"류 SQL 문항의 정답을 컬럼×튜플 표 형태로 저장·채점하기 위함. 기존 answer 텍스트 비교로는 표현·채점이 불가능했음.

#### `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java`
- 변경 전: `validateSqlData`가 tables·rows 길이만 검증
- 변경 후: `validateSqlData` 말미에 `validateSqlExpectedResult(data.expectedResult())` 호출 추가. 신규 메서드가 expectedResult != null일 때 columns/rows 비어있음·행 길이 불일치를 `SQL_DATA_INVALID`로 거부
- 이유: 결과 테이블 정답 저장 시에도 기존 SQL 데이터와 동일한 정합성 보장 필요.

#### `backend/src/main/java/com/tpmp/testprep/service/support/AnswerGrader.java`
- 변경 전: SQL 유형은 3-인자 `isCorrect`에서 SHORT_ANSWER와 동일한 콤마 다중값 Set 비교만 지원
- 변경 후: `isSqlResultTableCorrect(SqlData.SqlExpectedResult, String)` 신규 public 메서드 추가 — 줄바꿈으로 행 분리, `\|`로 셀 분리, 셀 정규화(trim·소문자·공백축약·숫자 재정규화), orderedRows 여부에 따라 위치 비교/다중집합 비교. `hasMeaningfulOptions`를 public으로 변경
- 이유: 결과 테이블 형태 정답을 정확히 채점하기 위한 별도 채점 경로 필요. 기존 dispatch(`isCorrect`)는 이 신규 메서드로 라우팅하지 않고 호출부(`UserQuizService`)가 직접 분기.
- **(코드 리뷰 반영, 추가 수정)** `toCanonicalMultiset`의 `String.join(구분자, row)` 호출부 — 구분자가 소스에 리터럴 제어문자(U+0001)로 박혀 있어 육안·grep으로는 빈 문자열처럼 보임. `private static final String CANONICAL_ROW_DELIMITER = "";` 상수를 선언하고 `String.join(CANONICAL_ROW_DELIMITER, row)`로 변경해 구분자의 존재와 의도를 코드에서 명시적으로 드러냈다. 다중집합 키 충돌(셀 경계 뭉개짐)을 검증하는 회귀 테스트 `sqlResultTable_unordered_cellBoundaryCollision_incorrect`를 추가.
- 이유: 동일 로직을 서로 다른 세션이 코드 리뷰했을 때 "구분자가 없다(버그)"와 "구분자가 있다(정상)"로 상반되게 판단하는 혼동이 실제로 발생했다. 상수화로 이런 오판 가능성 자체를 제거.

#### `backend/src/main/java/com/tpmp/testprep/service/UserQuizService.java`
- 변경 전: `boolean correct = AnswerGrader.isCorrect(qb.getQuestionType().name(), qb.getAnswer(), request.userAnswer(), qb.getOptions());` 단일 경로
- 변경 후: SQL 유형이고 `qb.getSqlData().expectedResult() != null`이고 보기가 없을 때만 `isSqlResultTableCorrect`로 분기, 그 외는 기존 4-인자 `isCorrect` 그대로 호출
- 이유: "보기 있으면 번호 채점" 전역 불변식을 유지하면서, expectedResult가 있는 SQL 결과 테이블 문항만 신규 채점 경로를 타도록 하기 위함.

#### `backend/src/main/java/com/tpmp/testprep/dto/response/QuizQuestionView.java`
- 변경 전: `sqlData` 필드에 `qb.getSqlData()`를 그대로 매핑(expectedResult 포함 시 정답이 그대로 노출됨)
- 변경 후: `sqlData`는 `qb.getSqlData().withoutExpectedResult()` 사본으로 매핑, 신규 `sqlResultColumns` 필드에 `expectedResult.columns()`만 노출
- 이유: 퀴즈 풀이 화면에 정답(expectedResult.rows)이 유출되지 않도록 하기 위함 — 컬럼명(문제 구조)만 필요.

### 복원 방법
이 ID(HIST-20260711-001)만으로 복원 시:
1. `SqlData.java`를 `public record SqlData(List<SqlTable> tables) { public record SqlTable(...) {} public record SqlColumn(...) {} }` (expectedResult·withoutExpectedResult·SqlExpectedResult 전부 제거)로 되돌린다.
2. `QuestionBankService.validateSqlData`에서 `validateSqlExpectedResult` 호출과 해당 private 메서드를 제거한다.
3. `AnswerGrader.java`에서 `isSqlResultTableCorrect`, `CANONICAL_ROW_DELIMITER` 상수, 관련 private helper(`normalizeSqlRows`/`toCanonicalMultiset`/`normalizeSqlCell`/`tryParseDouble`)를 제거하고, `hasMeaningfulOptions`를 다시 private으로 되돌린다.
4. `UserQuizService.checkAnswer`를 `AnswerGrader.isCorrect(qb.getQuestionType().name(), qb.getAnswer(), request.userAnswer(), qb.getOptions())` 단일 호출로 되돌린다.
5. `QuizQuestionView`에서 `sqlResultColumns` 필드를 제거하고 `sqlData`를 `qb.getSqlData()`로 직접 매핑한다.
6. 위 테스트 추가분(`AnswerGraderTest`의 SQL 결과 테이블 12종, `QuestionBankServiceTest`의 expectedResult 4종)을 제거한다.

## HIST-20260710-001

- **날짜**: 2026-07-10
- **수정 범위**: 백엔드 공통(`AnswerGrader`) — 보기(options) 있는 문항 채점을 "빈칸 순서 비교"로 재작성
- **수정 개요**: `AnswerGrader.isCorrect(type, correct, user, options)` 4-인자 오버로드가 options 존재 시 정답·사용자 답안 전체를 통문자열 1회 비교(`trim().equalsIgnoreCase`)만 하던 것을, 문제 본문에 빈칸이 여러 개 있고 각 빈칸을 보기에서 찾아 답하는 형식(예: QuestionBank id=23, `options=["ls","cd","cp","pwd"]`, `answer="1. pwd / 2. ls / 3. cd / 4. cp"`)을 지원하도록 재작성했다. 정답·사용자 답안을 각각 콤마(,)·슬래시(/)로 분리해 **순서를 보존한** 토큰 리스트로 만들고(Set이 아닌 List), 토큰 수가 다르면 즉시 오답 처리한다. 같은 위치의 토큰끼리 비교하며, 각 토큰은 선행 열거 접두("1. ", "2) " 등)를 제거한 뒤 1..options.size() 범위의 순수 숫자면 해당 위치 보기 텍스트로, 아니면 정규화된 원문 그대로 취급해 **번호와 보기 텍스트를 상호 인정**한다(`"4"` == `"pwd"` == `"4. pwd"`). 전 위치가 일치해야만 정답(부분 점수 없음)이며, 같은 보기 번호를 여러 위치에 **중복 지정**하는 것도 허용한다. 알려진 한계: 보기 텍스트 자체에 콤마/슬래시가 포함되면 분리가 왜곡될 수 있음(이 경우 번호로 입력해야 함) — Javadoc에 명시.
- 신규 private 헬퍼: `tokenizeOrdered(raw)`(순서 보존 토큰화), `normalizeOptionToken(raw)`(trim·소문자화·공백축약·열거 접두 제거 — 기존 SHORT_ANSWER용 `normalizeToken`과 별개), `resolveOptionToken(raw, options)`(번호→보기 텍스트 치환 또는 원문 정규화), `tokenEquals(correctTok, userTok, options)`.
- 프론트엔드 `frontend/src/lib/answer.ts`의 `parseAnswerToSlots`/`slotsToAnswer`가 동일한 정규화 규칙을 사용하므로 두 구현이 어긋나지 않도록 유지해야 한다(어긋나면 화면상 정답으로 보이는 답이 백엔드에서 오답 처리되는 문제 발생).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/support/AnswerGrader.java` | 수정 | 4-인자 오버로드의 options 분기를 "빈칸 순서 비교"로 재작성, 신규 private 헬퍼 4개 추가, 클래스/메서드 Javadoc 갱신 |
| `backend/src/test/java/com/tpmp/testprep/service/support/AnswerGraderTest.java` | 추가 | 빈칸 순서 비교 신규 테스트 13종 추가(단일 번호 회귀, 번호↔텍스트 혼용, 다중 빈칸 정순/오순, 열거 접두 레거시 호환, 중복 정답, 토큰 수 불일치 등). 기존 테스트(전체) 그대로 유지, 전부 통과 확인 |

### 수정 상세

#### `backend/src/main/java/com/tpmp/testprep/service/support/AnswerGrader.java`
- 변경 전: `isCorrect(String, String, String, List<String>)`가 options 존재 시 `correctAnswer.trim().equalsIgnoreCase(userAnswer.trim())` 통문자열 1회 비교만 수행.
- 변경 후: 순서 보존 토큰 리스트로 분리 → 토큰 수 일치 확인 → 위치별 `tokenEquals`(번호↔텍스트 상호 인정) 비교 → 전 위치 일치 시에만 true.
- 이유: 빈칸이 여러 개인 문항(예: id=23)에서 사용자 안내("정답 보기 번호 입력")와 실제 채점 로직이 모순되던 버그 수정.

### 복원 방법
이 ID(HIST-20260710-001)만으로 복원 시, `isCorrect(String, String, String, List<String>)`의 options 분기를 다시 `correctAnswer.trim().equalsIgnoreCase(userAnswer.trim())` 단일 비교로 되돌리고, 신규 private 헬퍼 4개(`tokenizeOrdered`, `normalizeOptionToken`, `resolveOptionToken`, `tokenEquals`)와 관련 테스트 13종을 제거한다.

## HIST-20260709-002

- **날짜**: 2026-07-09
- **수정 범위**: 백엔드 공통(`config/DataInitializer`) — `question_bank`/`questions` question_type CHECK 제약 자동 재생성 로직 결함 수정
- **수정 개요**: `DataInitializer.fixQuestionTypeConstraints()`가 매 앱 기동 시 `questions`와 `question_bank` 두 테이블에 **동일한** 4개 값(`MULTIPLE_CHOICE, SHORT_ANSWER, OX, CODE`)짜리 CHECK 제약을 강제로 재생성하고 있었다. `question_bank`는 SCHEDULING(2026-07-06)·SQL(2026-07-09, HIST-20260709-001) 유형을 지원하므로 이 제약과 값이 어긋나며, 기동 시 기존 SCHEDULING/SQL 행이 있으면 ADD가 위반으로 실패해(예외는 캐치되어 WARN 로그만 남고 앱은 정상 기동) `question_bank`에 CHECK 제약이 아예 없는 상태로 남는다. 더 심각한 잠재 결함은, DB를 새로 초기화하거나 우연히 SCHEDULING/SQL 행이 하나도 없는 시점에 재기동하면 이 ADD가 **성공**해 잘못된 4개 값 제약이 실제로 걸려버리고, 이후 SCHEDULING/SQL 문항 저장이 전부 DB 제약 위반(500)으로 실패하게 된다. 발견 경위: 사용자가 SQL 문항 기능 구현 직후 데일리 퀴즈 화면에서 카테고리 무관 500 에러를 신고 — 직접 원인은 별개로 재기동 전 백엔드 프로세스가 어제자 컴파일 클래스를 메모리에 들고 있던 클래스로더 불일치(`NoSuchMethodError: QuestionBank.getSqlData()`)였고 백엔드 재기동으로 해결됐으나, 재기동 로그에서 이 CHECK 제약 실패 경고를 추가로 발견해 근본 수정했다.
- **수정 내용**: `fixQuestionTypeConstraints()`를 테이블별로 분리 — `questions`는 기존 4개 값 유지(구조화 유형 미지원, 설계대로), `question_bank`는 `SCHEDULING`·`SQL`을 포함한 6개 값으로 CHECK 제약을 재생성하도록 `fixQuestionTypeConstraint(table, allowedValues)` 헬퍼로 추출.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java` | 수정 | `fixQuestionTypeConstraints()`를 테이블별 허용값 분리 호출로 변경, `fixQuestionTypeConstraint(table, allowedValues)` private 헬퍼 신규 추출 |

### 재현·검증
- 백엔드 재기동 후 로그: `question_bank.question_type_check 제약 재생성 완료`(이전엔 `재생성 실패`)로 확인.
- `curl` E2E: `/api/user/quiz/questions?categoryId=3&language=c`(프로그래밍 언어/C), `categoryId=2`(SQL), `categoryId=1`(운영체제) 모두 HTTP 200 정상 응답 확인(이전엔 전체 카테고리 500).

### 복원 방법
이 ID(HIST-20260709-002)만으로 복원 시 `fixQuestionTypeConstraints()`를 단일 루프(`{"questions","question_bank"}` + 4개 값 공통 CHECK)로 되돌린다. 단, 되돌리면 위에서 설명한 잠재 결함이 재발한다.

## HIST-20260709-001

- **날짜**: 2026-07-09
- **수정 범위**: 관리자 백엔드 / 문항(QuestionBank) — 신규 문항 유형 SQL 추가
- **수정 개요**: 새 `QuestionType.SQL` 추가. SQL 데이터(테이블명·컬럼 목록·샘플 데이터 행)를 JSONB 컬럼 `sql_data` 하나에 구조화 저장(`entity/support/SqlData.java` 신규 record — `SqlTable`/`SqlColumn` 중첩). 등록(단건/일괄)·수정 3개 경로 모두 sqlData 반영 + `validateSqlData` 신규 검증(테이블 목록 비어있음/행의 셀 수가 컬럼 수와 불일치 시 `SQL_DATA_INVALID`). 채점은 SHORT_ANSWER·SCHEDULING과 동일한 콤마 다중값 비교로 라우팅(AnswerGrader). SQL 실행·자동 채점은 하지 않음(정답 수동 입력). QuizQuestionView에도 sqlData를 반영해 퀴즈 풀이 화면에 문제 구조를 전달한다(정답은 계속 미노출). 지원 범위는 QuestionBank(데일리 퀴즈)만이며 Question(시험) enum은 변경하지 않았다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/support/SqlData.java` | 추가 | `SqlData(tables)` record + 중첩 `SqlTable(name,columns,rows?)`/`SqlColumn(name,dataType?,primaryKey)` record, Bean Validation 포함 |
| `docs/db-migration/20260709_01_question_bank_sql_data.sql` | 추가 | `question_bank.sql_data JSONB` 컬럼 추가 + `question_type` CHECK 제약에 SQL 포함 6개 값으로 재생성 DDL (dev는 ddl-auto=update 자동 반영, 운영 수동 적용 필요) |
| `backend/src/main/java/com/tpmp/testprep/entity/QuestionBank.java` | 수정 | `QuestionType`에 `SQL` 추가; `sqlData` 필드(@JdbcTypeCode JSONB, schedulingData와 동일 패턴) 추가; @Builder·update()에 sqlData 파라미터 추가 |
| `backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java` | 수정 | `SQL_DATA_INVALID(BAD_REQUEST)` 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionBankRequest.java` | 수정 | `@Valid SqlData sqlData`(선택) 필드 추가, 클래스 상단 SQL Injection 무관 주석에 sqlData 한 줄 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuestionBankResponse.java` | 수정 | `sqlData` 필드 추가 + from() 매핑 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuizQuestionView.java` | 수정 | `sqlData` 필드 추가 + from() 매핑 (정답은 계속 미노출) |
| `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java` | 수정 | createQuestion/createQuestionsBulk/updateQuestion 3곳 모두 sqlData 전달; private `validateSqlData(request)` 신규 — SQL 유형일 때만 sqlData null·빈 테이블 목록 체크, 테이블별 rows가 있으면 각 행의 셀 수가 columns 개수와 일치하는지 검증 |
| `backend/src/main/java/com/tpmp/testprep/service/support/AnswerGrader.java` | 수정 | `"SHORT_ANSWER".equals(questionType) \|\| "SCHEDULING".equals(questionType)` 분기에 `\|\| "SQL".equals(questionType)` 추가 — multiSetMatch로 동일 라우팅, 클래스 Javadoc 한 줄 보강 |
| `backend/src/test/java/com/tpmp/testprep/service/QuestionBankServiceTest.java` | 수정 | 기존 4개 `QuestionBankRequest` 생성 헬퍼/호출부에 신설된 마지막 파라미터(sqlData) `null` 추가, `requestOfSql(sqlData)` 헬퍼 신규 + SQL 유형 검증 테스트 6건 추가(null/빈 테이블/행 길이 불일치/정상 저장/rows 없음/비-SQL 회귀) |
| `backend/src/test/java/com/tpmp/testprep/service/support/AnswerGraderTest.java` | 수정 | SQL 라우팅 테스트 4건 추가(순서 무관 일치·개수 불일치·대소문자 공백 무시·단일 불일치) |
| `docs/db-guidelines.md` | 수정 | question_bank ERD·컬럼 코멘트·question_type 값 목록에 `sql_data`/SQL 추가 |
| `frontend/src/data/tableComments.ts` | 수정 | question_bank.sql_data 코멘트 추가 |

### 수정 상세

#### `QuestionBank.java`
- 변경 전: `enum QuestionType { MULTIPLE_CHOICE, SHORT_ANSWER, OX, CODE, SCHEDULING }`
- 변경 후: `enum QuestionType { MULTIPLE_CHOICE, SHORT_ANSWER, OX, CODE, SCHEDULING, SQL }`; `@JdbcTypeCode(SqlTypes.JSON) @Column(name="sql_data", columnDefinition="jsonb") private SqlData sqlData;` 추가, @Builder·update() 마지막 도메인 파라미터(schedulingData 다음)로 추가

#### `QuestionBankService.java`
- 변경 전: 3곳 모두 `.schedulingData(request.schedulingData())`만 전달, `validateSchedulingData(request)`만 호출.
- 변경 후: 3곳 모두 `.sqlData(request.sqlData())` 추가 전달; 각 메서드 진입 시 `validateSchedulingData` 다음에 `validateSqlData(request)`(bulk는 `.forEach`) 호출.

#### `AnswerGrader.java`
- 변경 전: `if ("SHORT_ANSWER".equals(questionType) || "SCHEDULING".equals(questionType)) { ... }`
- 변경 후: `if ("SHORT_ANSWER".equals(questionType) || "SCHEDULING".equals(questionType) || "SQL".equals(questionType)) { ... }` — SQL 실행 없이 수동 정답을 SHORT_ANSWER와 동일 다중값 비교로 채점.

#### `docs/db-migration/20260709_01_question_bank_sql_data.sql`
```sql
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS sql_data JSONB;
-- question_type CHECK 제약 재생성 (SQL 포함 6개 값)
```
- 롤백: `ALTER TABLE question_bank DROP COLUMN sql_data;` + 제약을 이전 5개 값(SQL 제외)으로 재생성.

### 복원 방법

이 ID(HIST-20260709-001)만으로 복원 시:
- DB: 롤백 SQL 실행(sql_data 컬럼 DROP, question_type CHECK 제약을 SQL 제외 5개 값으로 재생성)
- `entity/support/SqlData.java`: 파일 삭제
- `QuestionBank.java`: QuestionType에서 SQL 제거, sqlData 필드·builder/update 파라미터 제거
- `ErrorCode.java`: SQL_DATA_INVALID 제거
- `QuestionBankRequest.java`/`QuestionBankResponse.java`/`QuizQuestionView.java`: sqlData 필드·매핑 제거
- `QuestionBankService.java`: sqlData 전달·validateSqlData() 제거
- `AnswerGrader.java`: `|| "SQL".equals(questionType)` 제거
- `QuestionBankServiceTest.java`: `requestOfSql` 헬퍼·SQL 검증 테스트 6건 삭제, 기존 4개 헬퍼 마지막 `null` 인자 제거
- `AnswerGraderTest.java`: SQL 라우팅 테스트 4건 삭제
- `docs/db-guidelines.md`/`frontend/src/data/tableComments.ts`: sql_data 코멘트 제거

## HIST-20260707-003

- **날짜**: 2026-07-07
- **수정 범위**: 관리자 백엔드 / 문항(QuestionBank) — 문항번호 DB 문서 보정
- **수정 개요**: `question_bank.question_no` 마이그레이션 파일 상단에 목적/적용/롤백 주석을 추가하고, `docs/db-guidelines.md`의 `question_bank` ERD 및 주요 컬럼 설명에 `question_no`를 반영했다. 출처 그룹 컬럼 이해를 위해 `exam_year`, `exam_round`, `exam_type_id`, `instruction`도 ERD 요약에 함께 보강했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `docs/db-migration/20260707_01_question_bank_question_no.sql` | 수정 | 기존 마이그레이션 스타일에 맞춰 목적/적용/롤백 주석 추가 |
| `docs/db-guidelines.md` | 수정 | `question_bank` ERD와 주요 컬럼 코멘트에 `question_no` 및 관련 그룹 컬럼 설명 추가 |

### 수정 상세

- 변경 전: 마이그레이션 파일에 SQL만 있고 목적/적용/롤백 안내가 없었으며, DB 가이드의 `question_bank` 설명에 `question_no`가 누락되어 있었다.
- 변경 후: 운영 적용 전 확인할 수 있도록 주석을 추가하고, 문항번호 중복 기준이 되는 컬럼 설명을 문서화했다.
- 이유: DB 변경 사항을 운영 적용·롤백·관리자 DB 조회 문서와 일관되게 유지하기 위함.

### 복원 방법

이 ID(HIST-20260707-003)만으로 복원 시: `20260707_01_question_bank_question_no.sql` 상단 주석을 제거하고, `docs/db-guidelines.md`의 `question_no` 및 함께 추가한 `question_bank` 컬럼 설명 행을 제거한다.

## HIST-20260707-002

- **날짜**: 2026-07-07
- **수정 범위**: 관리자 백엔드 / 문항(QuestionBank) — 하이브리드 문항번호 저장·중복 검증·자동 부여
- **수정 개요**: `question_bank.question_no`에 대응하는 nullable `questionNo` 필드를 엔티티·요청 DTO·응답 DTO에 추가했다. 단건 등록·일괄 등록·수정에서 관리자가 입력한 문항번호를 우선 저장하고, 같은 `examTypeId + examYear + examRound + questionNo` 조합의 활성 문항이 있으면 `QUESTION_NO_DUPLICATE` 예외로 거부한다. 문항번호가 비어 있고 시험 그룹이 완전하면 같은 그룹의 `MAX(questionNo) + 1`을 자동 부여하며, 일괄 등록에서는 같은 요청 내 자동 번호를 순차 배정한다. DB 수동 적용용 마이그레이션 파일도 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/QuestionBank.java` | 수정 | nullable `questionNo` 필드와 builder/update 매핑 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionBankRequest.java` | 수정 | `@Positive Integer questionNo` 요청 필드 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuestionBankResponse.java` | 수정 | `questionNo` 응답 필드 추가 |
| `backend/src/main/java/com/tpmp/testprep/repository/QuestionBankRepository.java` | 수정 | 그룹별 최대 문항번호 조회, 활성 중복 조회, 수정 자기 제외 중복 조회 JPQL 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java` | 수정 | 단건/수정/일괄 등록의 명시 번호 우선, 중복 검증, 자동 번호 부여 구현 |
| `backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java` | 수정 | `QUESTION_NO_DUPLICATE` 추가 |
| `backend/src/test/java/com/tpmp/testprep/service/QuestionBankServiceTest.java` | 수정 | RED 확인 후 자동부여·명시번호·중복·수정 자기 제외·일괄 순차 부여 테스트 추가 |
| `docs/db-migration/20260707_01_question_bank_question_no.sql` | 추가 | `question_no` 컬럼, 양수 check, 활성·그룹완전·문항번호 non-null 부분 유니크 인덱스 |

### 수정 상세

- 변경 전: 문항은행에는 원본 시험지 문항번호 필드가 없어 `examYear`/`examRound`와 별개로 번호를 저장하거나 중복 검증할 수 없었다.
- 변경 후: `QuestionBank.questionNo`를 독립 필드로 저장하고, `questions.seq`는 재사용하지 않는다. 명시 번호는 우선 저장, 비어 있으면 시험 그룹이 완전한 경우에만 자동 부여한다.
- 이유: 시험지 내부 순서와 원본 시험 문항번호를 분리해 관리자 문항은행에서 출처 기준 정렬·중복 방지를 가능하게 하기 위함.

### 복원 방법

이 ID(HIST-20260707-002)만으로 복원 시: `QuestionBank`/`QuestionBankRequest`/`QuestionBankResponse`의 `questionNo` 필드와 매핑을 제거한다. `QuestionBankRepository`의 문항번호 조회 메서드 3개를 제거한다. `QuestionBankService`의 `resolveQuestionNo*`, `validateQuestionNo*`, `QuestionNoGroup`, `QuestionNoKey` 및 builder/update의 `questionNo` 전달을 제거한다. `ErrorCode.QUESTION_NO_DUPLICATE`를 제거하고, 테스트의 문항번호 관련 케이스를 삭제한다. 운영 DB에는 별도 역마이그레이션으로 인덱스/제약/컬럼을 제거한다.

## HIST-20260707-001

- **날짜**: 2026-07-07
- **수정 범위**: 관리자 백엔드 / 문항(QuestionBank) — 발문·내용 "둘 중 하나 필수" 규칙 통일
- **수정 개요**: 발문(instruction)과 문항 내용(content)의 필수 규칙을 통일했다. 기존에는 `content`에 `@NotBlank`가 걸려 있어 항상 필수였으나, CODE·스케줄링 유형처럼 발문+코드/표만으로도 문항을 구성할 수 있도록 `content`의 `@NotBlank`를 해제하고 대신 "발문 또는 내용 중 적어도 하나는 있어야 한다"는 규칙을 서비스단에서 검증한다. 둘 다 blank이면 신규 `QUESTION_BODY_REQUIRED` 예외로 저장을 거부한다. `content` DB 컬럼은 NOT NULL 제약이 유지되므로(운영 마이그레이션 불필요), null 입력 시 엔티티 저장 직전 빈 문자열로 coalesce한다. 기존에 내용만 있던 문항 데이터는 그대로 유효하다.
- **DB 컬럼 nullable 확인**: `docker exec tpmp-db psql -U tpmp -d tpmp -c "SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='question_bank' AND column_name IN ('content','instruction');"` 결과 `content`는 `is_nullable = NO`(NOT NULL), `instruction`은 `YES`. 스키마 변경(마이그레이션) 대신 엔티티에서 null→"" coalesce 처리를 택함 — 컬럼 제약을 완화하는 것보다 안전하고 되돌리기 쉬우며, 운영 DB에 별도 마이그레이션 적용이 불필요하기 때문.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionBankRequest.java` | 수정 | `content` 필드에서 `@NotBlank` 제거(미사용된 `NotBlank` import도 삭제), `@Size(max=5000)`는 유지 |
| `backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java` | 수정 | `QUESTION_BODY_REQUIRED(HttpStatus.BAD_REQUEST, "발문 또는 문항 내용 중 하나는 입력해야 합니다.")` 신규 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java` | 수정 | `createQuestion`/`createQuestionsBulk`(각 문항마다)/`updateQuestion` 3경로 모두에서 `validateSchedulingData` 옆에 신규 `validateBody(request)` private 메서드를 추가 호출 — 발문·내용 둘 다 blank면 `QUESTION_BODY_REQUIRED` 예외 |
| `backend/src/main/java/com/tpmp/testprep/entity/QuestionBank.java` | 수정 | `@Builder` 생성자·`update()` 메서드에서 `content == null ? "" : content`로 coalesce하여 DB NOT NULL 제약 위반 방지 |
| `backend/src/test/java/com/tpmp/testprep/service/QuestionBankServiceTest.java` | 수정 | `bodyRequestOf(content, instruction)` 헬퍼 추가 + 발문·내용 필수 규칙 테스트 3건 추가: (a) content blank + instruction 있음 → 저장 OK(content는 빈 문자열로 coalesce됨), (b) 둘 다 blank → `QUESTION_BODY_REQUIRED` 예외, (c) content 있음 + instruction blank → OK(회귀) |

### 수정 상세

#### `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionBankRequest.java`
- 변경 전: `content` 필드에 `@NotBlank(message = "문항 내용은 필수입니다.") @Size(max = 5000, ...)` — 항상 필수.
- 변경 후: `@NotBlank` 제거, `@Size(max = 5000, ...)`만 유지(선택 필드). 미사용된 `import jakarta.validation.constraints.NotBlank;`도 삭제.
- 이유: CODE·스케줄링처럼 발문(지시문)+코드/표만으로도 문항을 구성할 수 있게 하기 위함. 대신 "발문 또는 내용 중 하나 필수" 규칙은 서비스단에서 검증.

#### `backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java`
- 변경 전: `QUESTION_BODY_REQUIRED` 없음.
- 변경 후: `SCHEDULING_DATA_INVALID` 다음에 `QUESTION_BODY_REQUIRED(HttpStatus.BAD_REQUEST, "발문 또는 문항 내용 중 하나는 입력해야 합니다.")` 추가.
- 이유: 발문·내용 필수 규칙 위반 시 전용 에러코드로 명확히 응답하기 위함.

#### `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java`
- 변경 전: `createQuestion`/`createQuestionsBulk`/`updateQuestion`에서 `validateSchedulingData`만 호출. 발문·내용 필수 규칙 없음.
- 변경 후: 3경로 모두에서 `validateSchedulingData` 다음에 `validateBody(request)`(bulk는 각 문항마다 `forEach`)를 추가 호출. `validateBody`는 `instruction`·`content`가 각각 null 또는 blank(trim 후 빈 문자열)인지 판정해 둘 다 blank이면 `BusinessException(ErrorCode.QUESTION_BODY_REQUIRED)`를 던진다.
- 이유: 발문·내용 "둘 중 하나 필수" 규칙을 한 곳(private 헬퍼)에서 일관되게 검증하기 위함(3경로 누락 방지).

#### `backend/src/main/java/com/tpmp/testprep/entity/QuestionBank.java`
- 변경 전: `@Builder` 생성자·`update()` 모두 `this.content = content;` — null이 그대로 들어오면 DB `NOT NULL` 제약(`content`) 위반으로 저장 실패.
- 변경 후: 두 곳 모두 `this.content = content == null ? "" : content;`로 coalesce.
- 이유: `content`가 이제 요청 DTO에서 선택 필드가 되어 null이 들어올 수 있으나, DB 컬럼은 여전히 NOT NULL(마이그레이션 없이 유지)이므로 저장 직전 빈 문자열로 안전하게 치환.

### 복원 방법
이 ID(HIST-20260707-001)만으로 복원 시: `QuestionBankRequest.content`에 `@NotBlank(message = "문항 내용은 필수입니다.")`를 다시 추가하고 `import jakarta.validation.constraints.NotBlank;`를 복원한다. `ErrorCode.QUESTION_BODY_REQUIRED` 항목을 제거한다. `QuestionBankService`의 3경로에서 `validateBody(request)` 호출과 `validateBody` 메서드 자체를 제거한다. `QuestionBank` 엔티티의 `content == null ? "" : content` coalesce를 `content`로 되돌린다. `QuestionBankServiceTest`에서 `bodyRequestOf` 헬퍼와 관련 테스트 3건을 제거한다.

## HIST-20260706-003

- **날짜**: 2026-07-06
- **수정 범위**: 관리자 백엔드 / 문항(QuestionBank) — 발문(지시문) 필드 신설
- **수정 개요**: 문항의 "다음 설명을 보고 알맞은 용어를 작성하시오." 같은 발문(지시문)을 문항 내용(content, 문제 본문)과 분리 저장하기 위해 `instruction` 컬럼을 신설했다. 모든 문항 유형 공용(선택) plain TEXT 필드이며 enum·CHECK 제약과 무관하다. 등록(단건/일괄)·수정 3개 경로 모두 반영. 범위는 QuestionBank(문제은행)까지이며 Question(시험지)/exam 풀이는 이번 범위가 아니다(후속 예정).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/QuestionBank.java` | 수정 | `instruction`(TEXT, nullable) 컬럼 추가, `@Builder` 생성자·`update()` 메서드 파라미터 마지막(`createdByUno`/`modifiedByUno` 직전)에 `instruction` 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionBankRequest.java` | 수정 | `content` 다음에 `@Size(max=1000) String instruction` 필드(선택) 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuestionBankResponse.java` | 수정 | `content` 다음에 `instruction` 필드 추가 + `from()` 매핑에 `qb.getInstruction()` 반영 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuizQuestionView.java` | 수정 | `content` 다음에 `instruction` 필드 추가 + `from()` 매핑에 `qb.getInstruction()` 반영 |
| `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java` | 수정 | `createQuestion`/`createQuestionsBulk`/`updateQuestion` 3경로 모두 builder·`update()` 호출에 `instruction` 전달 |
| `backend/src/test/java/com/tpmp/testprep/service/QuestionBankServiceTest.java` | 수정 | `QuestionBankRequest` positional 생성자 헬퍼(`requestOf`)에 신규 `instruction`(null) 인자 위치 추가 |
| `docs/db-migration/20260706_02_question_bank_instruction.sql` | 추가 | `ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS instruction TEXT;` — dev/local은 ddl-auto=update 자동 반영, 운영은 기동 전 수동 적용 필요 |

### 수정 상세

#### `backend/src/main/java/com/tpmp/testprep/entity/QuestionBank.java`
- 변경 전: `content` 컬럼 바로 위에 발문 관련 필드 없음. `@Builder` 생성자·`update()` 파라미터에 `instruction` 없음.
- 변경 후: `content` 위에 `@Column(columnDefinition = "TEXT") private String instruction;` 추가. `@Builder` 생성자와 `update()` 메서드 모두 파라미터 목록 마지막(각각 `createdByUno`/`modifiedByUno` 직전)에 `String instruction`을 추가하고 필드 대입(`this.instruction = instruction;`)을 본문에 반영.
- 이유: 발문(지시문)을 문제 본문(content)과 분리 저장해 사용자 화면에서 시각적으로 구분 표시하기 위함.

#### `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionBankRequest.java`
- 변경 전: `content` 필드 다음이 바로 `questionType`.
- 변경 후: `content` 다음에 `@Size(max = 1000, message = "발문은 1000자를 초과할 수 없습니다.") String instruction` (선택, `@NotBlank` 없음) 추가.
- 이유: 등록/수정 요청에서 발문을 선택적으로 받기 위함.

#### `backend/src/main/java/com/tpmp/testprep/dto/response/QuestionBankResponse.java`
- 변경 전: record 필드에 `instruction` 없음, `from()`도 매핑 없음.
- 변경 후: `content` 다음에 `String instruction` 필드 추가, `from()`에서 `qb.getInstruction()` 전달.
- 이유: 관리자 화면(목록/상세/수정 폼)에서 발문을 조회하기 위함.

#### `backend/src/main/java/com/tpmp/testprep/dto/response/QuizQuestionView.java`
- 변경 전: record 필드에 `instruction` 없음, `from()`도 매핑 없음.
- 변경 후: `content` 다음에 `String instruction` 필드 추가, `from()`에서 `qb.getInstruction()` 전달. 정답(answer)은 기존과 동일하게 계속 미노출.
- 이유: 퀴즈 화면에서 발문을 본문 위에 강조 표시하기 위함.

#### `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java`
- 변경 전: `createQuestion`/`createQuestionsBulk`(스트림 map)/`updateQuestion` 3곳 모두 builder·`update()` 호출에 `instruction` 전달 없음.
- 변경 후: 3곳 모두 `.instruction(request.instruction())`(또는 `req.instruction()`) / `update(...)` 호출 인자에 `request.instruction()`을 추가.
- 이유: 등록(단건/일괄)·수정 어느 경로로 저장해도 발문이 누락되지 않도록 함.

#### `backend/src/test/java/com/tpmp/testprep/service/QuestionBankServiceTest.java`
- 변경 전: `requestOf()` 헬퍼가 `QuestionBankRequest`를 15개 positional 인자로 생성(`content` 다음 바로 `type`).
- 변경 후: `content` 다음에 `null`(instruction) 인자를 추가해 필드 개수 증가에 맞춤.
- 이유: record에 필드가 추가되어 기존 positional 생성자 호출이 컴파일 실패하므로 테스트 헬퍼를 동기화.

#### `docs/db-migration/20260706_02_question_bank_instruction.sql`
- 변경 전: 파일 없음.
- 변경 후: `ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS instruction TEXT;` 신규 작성. 목적/롤백(`DROP COLUMN instruction`) 주석 포함.
- 이유: dev/local은 Hibernate `ddl-auto=update`로 자동 반영되지만 운영은 `ddl-auto=validate`라 기동 전 수동 DDL 적용이 필요함.

### 복원 방법
이 ID(HIST-20260706-003)만으로 복원 시: `QuestionBank.java`에서 `instruction` 필드·생성자/`update()` 파라미터를 제거, `QuestionBankRequest`/`QuestionBankResponse`/`QuizQuestionView`에서 `instruction` 필드와 관련 매핑을 제거, `QuestionBankService`의 3개 호출부에서 `instruction` 전달 인자를 제거, `QuestionBankServiceTest.requestOf()`에서 추가한 `null` 인자를 제거, `docs/db-migration/20260706_02_question_bank_instruction.sql` 파일을 삭제한다(단, 운영 DB에 이미 컬럼을 적용했다면 별도로 `DROP COLUMN instruction` 실행 필요).

## HIST-20260706-002

- **날짜**: 2026-07-06
- **수정 범위**: 관리자 백엔드 / 문항(QuestionBank) — SCHEDULING 저장 400 수정(CHECK 제약) + 검증 실패 로그
- **수정 개요**: SCHEDULING 유형 문항 저장 시 `question_bank.question_type` 컬럼의 기존 CHECK 제약(MULTIPLE_CHOICE/SHORT_ANSWER/OX/CODE만 허용)이 새 값 SCHEDULING을 막아 `DataIntegrityViolationException`(400)이 발생하던 문제 수정. Hibernate ddl-auto=update가 enum 컬럼의 기존 CHECK 제약을 자동 갱신하지 않는 것이 원인. 마이그레이션 SQL에 제약 재생성(SCHEDULING 포함)을 추가하고 dev DB에 즉시 적용. 아울러 `GlobalExceptionHandler.handleValidationException`이 검증 실패 사유(필드=메시지)를 로그로 남기도록 보강(향후 400 원인 진단 용이).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `docs/db-migration/20260706_01_question_bank_scheduling_data.sql` | 수정 | `question_bank_question_type_check` 제약을 DROP 후 SCHEDULING 포함 5개 값으로 재생성하는 DDL 추가(재실행 안전, `IF EXISTS`). 운영 배포 시 필수 적용 |
| `backend/src/main/java/com/tpmp/testprep/exception/GlobalExceptionHandler.java` | 수정 | `handleValidationException`에 `log.warn("Validation failed: 필드=메시지")` 추가 |

### 되돌림 방법

이 ID(HIST-20260706-002)로 복원 시: 마이그레이션 SQL에서 CHECK 제약 재생성 블록 제거(제약을 이전 4개 값으로 되돌리려면 별도 SQL 필요), GlobalExceptionHandler의 log.warn 라인 제거.

---

## HIST-20260706-001

- **날짜**: 2026-07-06
- **수정 범위**: 관리자 백엔드 / 문항(QuestionBank) — CPU 스케줄링 구조화 문항(SCHEDULING 유형) 신설
- **수정 개요**: 새 `QuestionType.SCHEDULING` 추가. 스케줄링 데이터(알고리즘·타임퀀텀·프로세스 목록)를 JSONB 컬럼 `scheduling_data` 하나에 구조화 저장(entity/support/SchedulingData.java 신규 record). 등록(단건/일괄)·수정 3개 경로 모두 schedulingData 반영 + RR/PRIORITY 계열 필수값 검증(SCHEDULING_DATA_INVALID). 채점은 SHORT_ANSWER와 동일한 콤마 다중값 비교로 라우팅(AnswerGrader). 자동 스케줄링 계산·채점은 하지 않음(정답 수동 입력).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/support/SchedulingData.java` | 추가 | `SchedulingAlgorithm`(FCFS/SJF/SRTF/PRIORITY_NON_PREEMPTIVE/PRIORITY_PREEMPTIVE/RR) enum + `ProcessRow`(pid,arrivalTime,burstTime,priority?) record + `SchedulingData`(algorithm,timeQuantum?,processes) record, Bean Validation 포함 |
| `docs/db-migration/20260706_01_question_bank_scheduling_data.sql` | 추가 | `question_bank.scheduling_data JSONB` 컬럼 추가 DDL (dev는 ddl-auto=update 자동 반영, 운영 수동 적용 필요) |
| `backend/src/main/java/com/tpmp/testprep/entity/QuestionBank.java` | 수정 | `QuestionType`에 `SCHEDULING` 추가; `schedulingData` 필드(@JdbcTypeCode JSONB, 기존 options 패턴과 동일) 추가; @Builder·update()에 schedulingData 파라미터 추가 |
| `backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java` | 수정 | `SCHEDULING_DATA_INVALID(BAD_REQUEST)` 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionBankRequest.java` | 수정 | `@Valid SchedulingData schedulingData`(선택) 필드 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuestionBankResponse.java` | 수정 | `schedulingData` 필드 추가 + from() 매핑 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuizQuestionView.java` | 수정 | `schedulingData` 필드 추가 + from() 매핑 (정답은 계속 미노출) |
| `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java` | 수정 | createQuestion/createQuestionsBulk/updateQuestion 3곳 모두 schedulingData 전달; private `validateSchedulingData(request)` 신규 — SCHEDULING 유형일 때만 schedulingData null 체크, RR은 timeQuantum>0, PRIORITY 계열은 모든 행 priority 필수 검증 |
| `backend/src/main/java/com/tpmp/testprep/service/support/AnswerGrader.java` | 수정 | `"SHORT_ANSWER".equals(questionType)` 분기에 `\|\| "SCHEDULING".equals(questionType)` 추가 — multiSetMatch로 동일 라우팅 |
| `docs/db-guidelines.md` | 수정 | question_bank ERD·컬럼 코멘트에 `scheduling_data JSONB nullable` 추가 |
| `frontend/src/data/tableComments.ts` | 수정 | question_bank.scheduling_data 코멘트 추가 |

### 수정 상세

#### `QuestionBank.java`
- 변경 전: `enum QuestionType { MULTIPLE_CHOICE, SHORT_ANSWER, OX, CODE }`; schedulingData 필드 없음
- 변경 후: `enum QuestionType { MULTIPLE_CHOICE, SHORT_ANSWER, OX, CODE, SCHEDULING }`; `@JdbcTypeCode(SqlTypes.JSON) @Column(name="scheduling_data", columnDefinition="jsonb") private SchedulingData schedulingData;` 추가, @Builder·update() 마지막 도메인 파라미터로 추가

#### `QuestionBankService.java`
- 변경 전: create/createBulk/update 3곳 builder·update 호출에 schedulingData 없음; 검증 로직 없음
- 변경 후: 3곳 모두 `.schedulingData(request.schedulingData())` / `qb.update(..., request.schedulingData(), adminId)` 전달; 각 메서드 진입 시 `validateSchedulingData(request)`(bulk는 `.forEach`) 호출

#### `AnswerGrader.java`
- 변경 전: `if ("SHORT_ANSWER".equals(questionType)) return multiSetMatch(...)`
- 변경 후: `if ("SHORT_ANSWER".equals(questionType) || "SCHEDULING".equals(questionType)) return multiSetMatch(...)` — SHORT_ANSWER 기존 동작 영향 없음

### 마이그레이션 SQL 경로
`docs/db-migration/20260706_01_question_bank_scheduling_data.sql`

롤백:
```sql
ALTER TABLE question_bank DROP COLUMN scheduling_data;
```

### 복원 방법
이 ID(HIST-20260706-001)만으로 복원 시:
- DB: 롤백 SQL 실행(scheduling_data 컬럼 DROP)
- `entity/support/SchedulingData.java`: 파일 삭제
- `QuestionBank.java`: QuestionType에서 SCHEDULING 제거, schedulingData 필드·builder/update 파라미터 제거
- `ErrorCode.java`: SCHEDULING_DATA_INVALID 제거
- `QuestionBankRequest.java`/`QuestionBankResponse.java`/`QuizQuestionView.java`: schedulingData 필드·매핑 제거
- `QuestionBankService.java`: schedulingData 전달·validateSchedulingData() 제거
- `AnswerGrader.java`: `|| "SCHEDULING".equals(questionType)` 제거
- `docs/db-guidelines.md`/`frontend/src/data/tableComments.ts`: scheduling_data 코멘트 제거

## HIST-20260701-001

- **날짜**: 2026-07-01
- **수정 범위**: 관리자 백엔드 / 문항 AI 분석 결과 영속화 — ai_* 컬럼 추가, 즉시저장 API(PATCH), 등록·수정 시 ai 필드 포함
- **수정 개요**: question_bank 테이블에 ai_keywords/ai_domains/ai_difficulty/ai_summary 4컬럼 추가(JSONB·TEXT). 수정 화면 "분석 시작" 후 PATCH /api/admin/questions/{id}/analysis 즉시저장. 문항 등록·수정 submit 시에도 ai 필드 함께 저장. 재분석 시 덮어쓰기 보장.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `docs/db-migration/20260701_02_question_bank_ai_analysis.sql` | 추가 | ai_keywords JSONB, ai_domains JSONB, ai_difficulty VARCHAR(10), ai_summary TEXT 컬럼 추가 DDL |
| `backend/src/main/java/com/tpmp/testprep/entity/QuestionBank.java` | 수정 | ai* 필드 4개 추가(@JdbcTypeCode JSONB·TEXT); @Builder에 4필드 추가; update()에 4파라미터 추가; updateAnalysis() 신규(ai 4컬럼만 갱신) |
| `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionBankRequest.java` | 수정 | aiKeywords/aiDomains/aiDifficulty/aiSummary optional 필드 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuestionBankResponse.java` | 수정 | aiKeywords/aiDomains/aiDifficulty/aiSummary 필드 추가 + from() 매핑 |
| `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionAnalysisSaveRequest.java` | 추가 | PATCH 즉시저장 전용 record(keywords@NotNull, domains@NotNull, difficulty@NotBlank, summary) |
| `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java` | 수정 | createQuestion/createQuestionsBulk/updateQuestion에 ai 4필드 반영; saveAnalysis() 신규 @Transactional 메서드 |
| `backend/src/main/java/com/tpmp/testprep/controller/AdminQuestionController.java` | 수정 | PATCH /{id}/analysis 엔드포인트 추가; QuestionAnalysisSaveRequest import 추가 |

### 마이그레이션 SQL 경로
`docs/db-migration/20260701_02_question_bank_ai_analysis.sql`

롤백:
```sql
ALTER TABLE question_bank DROP COLUMN ai_keywords, ai_domains, ai_difficulty, ai_summary;
```

### 수정 상세

#### `QuestionBank.java`
- 변경 전: 필드 title·examYear·examRound·content·questionType·category·examType·options·answer·code·language·explanation
- 변경 후: 위 필드 유지 + aiKeywords(JSONB)·aiDomains(JSONB)·aiDifficulty(VARCHAR10)·aiSummary(TEXT) 추가. @JdbcTypeCode(SqlTypes.JSON)+@Column(columnDefinition="jsonb") 패턴은 기존 options 필드와 동일. @Builder/update()에 4파라미터 추가. updateAnalysis(keywords,domains,difficulty,summary,modifiedByUno) 신규 — ai 4컬럼+updateAudit만 갱신.

#### `QuestionBankRequest.java`
- 변경 전: 12필드(title~explanation)
- 변경 후: aiKeywords/aiDomains/aiDifficulty/aiSummary 4필드 추가(검증 없음, 모두 선택)

#### `QuestionBankResponse.java`
- 변경 전: 17필드
- 변경 후: aiKeywords/aiDomains/aiDifficulty/aiSummary 4필드 추가 + from(qb) 매핑 추가

#### `QuestionAnalysisSaveRequest.java` (신규)
- keywords: @NotNull List<String>
- domains: @NotNull List<String>
- difficulty: @NotBlank String
- summary: String

#### `QuestionBankService.java`
- createQuestion: builder에 .aiKeywords/.aiDomains/.aiDifficulty/.aiSummary 추가
- createQuestionsBulk: 각 req.ai*() 호출 추가
- updateQuestion: qb.update()에 4파라미터 추가
- saveAnalysis(Long id, QuestionAnalysisSaveRequest req, String adminEmail): 신규 @Transactional 메서드. findActive → updateAnalysis → from 반환. 재분석 호출 시 기존값 덮어씀.

#### `AdminQuestionController.java`
- 변경 전: GET/POST(bulk)/PUT/DELETE + analyze/regenerate 6엔드포인트
- 변경 후: PATCH /{id}/analysis 추가. @PreAuthorize 클래스 레벨 유지. QuestionAnalysisSaveRequest import 추가.

### 복원 방법
이 ID(HIST-20260701-001)만으로 복원 시:
- DB: 롤백 SQL 실행(ai_* 4컬럼 DROP)
- QuestionBank.java: ai* 4필드 제거, @Builder/update() 파라미터 제거, updateAnalysis() 제거
- QuestionBankRequest.java: ai 4필드 제거
- QuestionBankResponse.java: ai 4필드 제거, from() 매핑 4줄 제거
- QuestionAnalysisSaveRequest.java: 파일 삭제
- QuestionBankService.java: builder/update의 ai 파라미터 제거, saveAnalysis() 제거, import 제거
- AdminQuestionController.java: PATCH 엔드포인트 제거, import 제거
