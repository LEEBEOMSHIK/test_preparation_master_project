## HIST-20260717-001

- **날짜**: 2026-07-17
- **수정 범위**: 사용자 백엔드 / 퀴즈 채점 공통(`AnswerGrader`) — 열거 마커 확장 + 괄호 대체 표기 인정
- **수정 개요**: `AnswerGrader`의 다중값 채점에 한글 자모(`ㄱ.`)·원문자(`①`)·라틴 문자(`a.`) 열거 마커 인식과 괄호 대체 표기(`비동기 균형 모드(ABM)` ↔ `ABM`) 1:1 매칭을 추가했다. 데일리 퀴즈(`UserQuizService`)와 시험 채점이 같은 경로를 쓰므로 퀴즈에도 동일 적용되며, `question_bank` id=6(HDLC)·id=10(외래키) 정답 데이터에도 대체 표기를 반영했다. 상세는 [back/usr/UserExamination_Modified.md HIST-20260717-001] 참조.

## HIST-20260714-002

- **날짜**: 2026-07-14
- **수정 범위**: 사용자 백엔드 / 데일리 퀴즈 — 문항별 카테고리명 응답 추가
- **수정 개요**: "AI 커스텀 전체" 모드에서 여러 카테고리 문항이 섞여 출제될 때 프론트가 문항별 카테고리를 배지로 표시할 수 있도록, `QuizQuestionView`에 `categoryName` 필드를 추가하고 `from(QuestionBank qb)`에서 `qb.getCategory()`(DomainSlave, 없으면 null)의 이름으로 채웠다. `getQuizQuestions`가 `@Transactional(readOnly=true)` 안에서 호출되므로 지연 로딩 문제 없음.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/main/java/com/tpmp/testprep/dto/response/QuizQuestionView.java | 수정 | record에 `String categoryName` 필드 추가, `from()`에서 `qb.getCategory().getName()`으로 채움 |

### 수정 상세

#### `src/main/java/com/tpmp/testprep/dto/response/QuizQuestionView.java`
- 변경 전: record 필드가 `sqlResultColumns`까지, 생성자도 그에 맞춤
- 변경 후: 필드 목록 끝에 `String categoryName` 추가, 생성자 마지막 인자로 `qb.getCategory() != null ? qb.getCategory().getName() : null` 전달
- 이유: 프론트 문항 카드에 카테고리 배지를 표시하기 위한 응답 필드 필요

### 복원 방법
이 ID(HIST-20260714-002)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다.

## HIST-20260714-001

- **날짜**: 2026-07-14
- **수정 범위**: 사용자 백엔드 / 데일리 퀴즈 — CODE 프로그래밍 언어 선택창 노출 대상에서 SQL 전용 카테고리 제외
- **수정 개요**: 데일리 퀴즈는 카테고리에 CODE 유형 문항이 있으면 프로그래밍 언어(전체/Java/Python/C) 선택창을 띄운다. 곧 SQL 카테고리에 `language='sql'`인 CODE 유형(SQL 빈칸 채우기) 문항이 추가될 예정인데, 기존 로직은 CODE 유형 존재 여부만 보고 언어 선택창 노출 대상 카테고리를 판별해 SQL 카테고리에도 Java/Python/C 선택창이 뜨는 부작용이 있었다. `QuestionBankRepository.findDistinctCategoryIdsByQuestionType`의 JPQL에 `language`가 NULL이거나 `SQL`이 아닌 경우로 조건을 추가해, language='sql'인 CODE 문항만 있는 카테고리는 이 메서드의 반환 목록(→ `UserQuizService.getCategories`의 `codeCategoryIds` → `DomainSlaveResponse.hasCodeQuestions`)에서 제외되도록 했다. language가 NULL·java·python·c인 CODE 문항은 기존과 동일하게 카테고리를 flag한다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/repository/QuestionBankRepository.java` | 수정 | `findDistinctCategoryIdsByQuestionType`의 JPQL WHERE 절에 `AND (qb.language IS NULL OR UPPER(qb.language) <> 'SQL')` 조건 추가. 메서드 상단 주석에 "language='sql'인 CODE 문항은 제외(언어 선택창 미대상)" 취지 보강 |
| `backend/src/test/java/com/tpmp/testprep/service/UserQuizServiceTest.java` | 수정 | `getCategories_sqlOnlyCodeCategory_hasCodeQuestionsFalse` 테스트 추가 — `findDistinctCategoryIdsByQuestionType(CODE)`가 sql 전용 카테고리(id=2)를 제외하고 java 등 일반 언어 카테고리(id=1)만 반환한다고 스터빙한 뒤, `getCategories`가 이를 각각 `hasCodeQuestions=false`/`true`로 올바르게 매핑하는지 검증(리포지토리 JPQL 자체가 아닌 서비스 매핑 로직 검증). `DomainMasterResponse`/`DomainSlaveResponse`/`DomainMaster`/`DomainSlave`/`ReflectionTestUtils` import 추가(엔티티 id는 `@GeneratedValue`라 빌더로 세팅 불가해 `ReflectionTestUtils.setField`로 주입) |

### 수정 상세

#### `repository/QuestionBankRepository.java`
- 변경 전: `SELECT DISTINCT qb.category.id FROM QuestionBank qb WHERE qb.questionType = :questionType AND qb.delYn = 'N' AND qb.category IS NOT NULL`
- 변경 후: `SELECT DISTINCT qb.category.id FROM QuestionBank qb WHERE qb.questionType = :questionType AND qb.delYn = 'N' AND qb.category IS NOT NULL AND (qb.language IS NULL OR UPPER(qb.language) <> 'SQL')`
- 이유: SQL 전용 CODE 카테고리에 Java/Python/C 언어 선택창이 뜨는 부작용을 막기 위해, 언어 선택창 노출 판별용 카테고리 목록에서 language='sql' CODE 문항을 제외해야 함.

#### `service/UserQuizServiceTest.java`
- 변경 전: `getCategories`/`hasCodeQuestions` 관련 테스트 없음.
- 변경 후: sql 전용 카테고리와 일반 언어 카테고리가 섞인 상황에서 `hasCodeQuestions` 플래그가 리포지토리 반환값을 올바르게 반영하는지 검증하는 테스트 1건 추가.
- 이유: 리포지토리 쿼리 변경이 서비스 응답(DomainSlaveResponse.hasCodeQuestions)에 올바르게 반영되는지 회귀 방지.

### 검증 결과
- `./gradlew compileJava`: 통과
- `./gradlew test --tests "com.tpmp.testprep.service.UserQuizServiceTest"`: 통과 (14 tests, 0 failures, 0 errors)

### 복원 방법
이 ID(HIST-20260714-001)만으로 복원 시:
1. `QuestionBankRepository.java`의 `findDistinctCategoryIdsByQuestionType` JPQL에서 `AND (qb.language IS NULL OR UPPER(qb.language) <> 'SQL')` 조건과 보강된 주석을 제거해 원래 쿼리로 되돌린다.
2. `UserQuizServiceTest.java`에서 `getCategories_sqlOnlyCodeCategory_hasCodeQuestionsFalse` 테스트 메서드와 관련 import(`DomainMasterResponse`, `DomainSlaveResponse`, `DomainMaster`, `DomainSlave`, `ReflectionTestUtils`)를 제거한다.

## HIST-20260713-004

- **날짜**: 2026-07-13
- **수정 범위**: 사용자 백엔드 / 채점 공통 유틸 — 대체 정답(`||`) 지원
- **수정 개요**: `AnswerGrader`에 대체 정답 계층을 추가했다. DB에 저장된 정답 문자열에 `" || "` 구분자로 여러 후보를 나열하면(예: `"팩토리 메서드 || 팩토리 메소드 || factory method"`), 사용자 답안이 그중 하나와만 일치해도 정답으로 인정한다. 기존 콤마·슬래시 다중값 비교(모든 값을 다 입력해야 정답)와는 완전히 별도의 상위 계층으로, `isCorrect` 3-인자·4-인자 오버로드 진입부에서 정답 문자열을 `\s*\|\|\s*` 정규식으로 먼저 분리한 뒤 각 후보에 기존 유형별·보기 채점 로직을 그대로 적용해 하나라도 true면 true를 반환한다. 대체 정답이 1개뿐이면(구분자 없음) 기존과 완전히 동일하게 동작하며, 단일 `|` 문자(SQL 결과 테이블 셀 구분자 등)는 이 구분자와 무관해 전혀 영향받지 않는다. `isSqlResultTableCorrect`(SQL 결과 테이블 채점)는 별도 경로라 변경하지 않았다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/support/AnswerGrader.java` | 수정 | `splitAlternatives(correctAnswer)` 신규 private 헬퍼 추가(`\s*\|\|\s*` split → trim → 빈 항목 제거). 3-인자 `isCorrect`는 기존 유형별 dispatch 본체를 `isCorrectSingle`로 추출 후, 대체 정답 목록을 순회하며 하나라도 true면 true 반환하도록 재구성. 4-인자 `isCorrect`의 options 분기도 동일하게 본체를 `isCorrectWithOptionsSingle`로 추출 후 대체 정답 순회 적용(non-options 분기는 3-인자로 위임하므로 자동으로 대체 정답 지원됨). 클래스 javadoc에 "대체 정답(`\|\|`)" 단락 추가 |
| `backend/src/test/java/com/tpmp/testprep/service/support/AnswerGraderTest.java` | 수정 | "대체 정답 (\|\|)" 섹션 신규 추가 — SHORT_ANSWER 대체 정답 중 1개 일치/모두 불일치, CODE 유형 대체 정답, 단일 `\|` 포함 정답이 기존처럼 통째로 비교되는 회귀 확인, 대체 정답이 1개뿐일 때 기존 동작과 동일함, 대체 정답 안에 콤마 다중값 조합(`a, b \|\| c, d`), 4-인자(options 있음) 대체 정답 — 총 7개 테스트 추가 |

### 수정 상세

#### `service/support/AnswerGrader.java`
- 변경 전: 3-인자 `isCorrect`는 correctAnswer를 그대로 유형별 dispatch 로직에 전달. 4-인자 `isCorrect`의 options 분기도 correctAnswer를 그대로 `tokenizeOrdered`에 전달.
- 변경 후: 두 오버로드 모두 진입부에서 `splitAlternatives(correctAnswer)`로 대체 정답 목록을 만든 뒤 각 후보를 기존 로직(각각 `isCorrectSingle`, `isCorrectWithOptionsSingle`로 추출)에 적용해 하나라도 true면 true.
- 이유: 같은 의미의 정답을 여러 표기로 인정해야 하는 SHORT_ANSWER류 문항(동의어·번역어 등)에서 관리자가 콤마 구분(모든 값 요구)이 아닌 "OR" 의미의 대체 정답을 입력할 수 있어야 함.

### 검증 결과
- `./gradlew test --tests "com.tpmp.testprep.service.support.AnswerGraderTest"`: 통과 (80 tests, 0 failures, 0 errors)

### 복원 방법
이 ID(HIST-20260713-004)만으로 복원 시:
1. `AnswerGrader.java`에서 `splitAlternatives` 메서드를 제거한다.
2. 3-인자 `isCorrect`를 `isCorrectSingle`의 본문 그대로 되돌리고(대체 정답 순회 제거) `isCorrectSingle`을 삭제한다.
3. 4-인자 `isCorrect`의 options 분기를 `isCorrectWithOptionsSingle`의 본문 그대로 되돌리고(대체 정답 순회 제거) `isCorrectWithOptionsSingle`을 삭제한다.
4. 클래스 javadoc의 "대체 정답(`\|\|`)" 단락을 제거한다.

## HIST-20260713-003

- **날짜**: 2026-07-13
- **수정 범위**: 사용자 백엔드 / 데일리 퀴즈 — 세션 내 라운드 간 문항 중복 출제 방지
- **수정 개요**: 데일리 퀴즈는 10문제 단위 라운드로 `GET /api/user/quiz/questions`를 반복 호출하는데, 매 라운드 독립 랜덤 추출이라 직전 라운드와 문항이 자주 중복되는 문제가 있었다. `getQuizQuestions`에 `excludeIds`(콤마 구분 문항 ID 목록) 파라미터를 추가해 프론트가 세션 동안 이미 출제된 문항 ID를 누적 전송하면 다음 라운드 랜덤 추출에서 제외하도록 했다. native query에서 빈 리스트 `IN ()` 문법 오류를 피하기 위해, excludeIds가 있을 때만 사용하는 `...Excluding` 오버로드 리포지토리 메서드를 별도로 추가하고 서비스 계층에서 빈 목록이면 기존 메서드를 그대로 호출하도록 분기했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/repository/QuestionBankRepository.java` | 수정 | `findRandomByCategoryExcluding`, `findRandomBySourceOnlyExcluding` 신규 추가 — 기존 쿼리에 `AND id NOT IN (:excludeIds)` 조건만 더한 오버로드, excludeIds가 비어있으면 호출 금지(빈 IN() 오류) |
| `backend/src/main/java/com/tpmp/testprep/controller/UserQuizController.java` | 수정 | `getQuizQuestions`에 `@RequestParam(required = false) String excludeIds`(콤마 구분) 추가, 서비스로 그대로 전달 |
| `backend/src/main/java/com/tpmp/testprep/service/UserQuizService.java` | 수정 | `getQuizQuestions`에 `excludeIds` 파라미터 추가, `parseExcludeIds`로 문자열→`List<Long>` 파싱(공백·비정상 토큰 무시, 중복 제거, 최대 500개), 빈 목록이면 기존 `findRandomByCategory`/`findRandomBySourceOnly` 호출, 있으면 `...Excluding` 오버로드 호출로 분기 |
| `backend/src/test/java/com/tpmp/testprep/service/UserQuizServiceTest.java` | 수정 | 시그니처 변경(`getQuizQuestions(..., excludeIds)`)에 맞춰 기존 헬퍼 호출부에 `null` 인자 추가, `excludeIds` 있을 때 `findRandomByCategoryExcluding` 호출 + 토큰 파싱(공백·비정상값 무시·중복제거) 검증 테스트, `excludeIds` 공백일 때 기존 `findRandomByCategory` 호출 검증 테스트 신규 추가 |

### 수정 상세

#### `repository/QuestionBankRepository.java`
- 변경 전: `findRandomByCategory(categoryId, limit, language, source)`, `findRandomBySourceOnly(limit, language, source)`만 존재.
- 변경 후: 각각에 `excludeIds` 파라미터를 추가한 `findRandomByCategoryExcluding`, `findRandomBySourceOnlyExcluding`을 신규 메서드로 추가(`AND id NOT IN (:excludeIds)` 조건만 더함). 기존 두 메서드는 시그니처 변경 없이 그대로 유지.
- 이유: Spring Data JPA는 List 파라미터를 `IN` 절로 확장해주지만, 빈 리스트를 그대로 바인딩하면 native query에서 `IN ()` 문법 오류가 발생한다. excludeIds가 없는 경우와 있는 경우를 메서드 자체로 분리해 항상 안전하게 호출하도록 했다.

#### `controller/UserQuizController.java`
- 변경 전: `getQuizQuestions(categoryId, limit, language, source)`.
- 변경 후: `excludeIds`(`@RequestParam(required = false) String`) 파라미터 추가, `userQuizService.getQuizQuestions(categoryId, limit, language, source, excludeIds)` 호출.
- 이유: 프론트가 세션 내 누적 출제 ID 목록을 콤마 구분 문자열로 전달할 수 있어야 함.

#### `service/UserQuizService.java`
- 변경 전: `getQuizQuestions(Long categoryId, int limit, String language, String source)` — 항상 `findRandomByCategory`/`findRandomBySourceOnly` 호출.
- 변경 후: `excludeIds` 파라미터 추가, `parseExcludeIds(excludeIds)`로 `List<Long>` 변환(공백·비정상 토큰 무시, `distinct()`, `limit(500)`) 후 목록이 비어있으면 기존 메서드, 비어있지 않으면 `...Excluding` 오버로드로 분기 호출.
- 이유: 매 라운드 독립 랜덤 추출로 인한 직전 라운드와의 문항 중복을 세션 단위로 방지하되, 무제한 ID 목록 전달로 인한 쿼리 성능 저하나 파싱 오류로 인한 500 에러를 막기 위해 상한과 방어적 파싱을 둠.

### 검증 결과
- `./gradlew compileJava compileTestJava`: 통과
- `./gradlew test --tests "com.tpmp.testprep.service.UserQuizServiceTest"`: 통과 (13 tests, 0 failures, 0 errors)

### 복원 방법
이 ID(HIST-20260713-003)만으로 복원 시:
1. `UserQuizService.java`의 `getQuizQuestions`에서 `excludeIds` 파라미터·`parseExcludeIds`/`parseLongOrNull` 메서드를 제거하고 항상 `findRandomByCategory`/`findRandomBySourceOnly`만 호출하도록 되돌린다.
2. `UserQuizController.java`의 `getQuizQuestions`에서 `excludeIds` 파라미터를 제거한다.
3. `QuestionBankRepository.java`에서 `findRandomByCategoryExcluding`, `findRandomBySourceOnlyExcluding` 메서드를 제거한다.
4. `UserQuizServiceTest.java`에서 `capturedLanguage`/`capturedSource`의 `getQuizQuestions` 호출 인자에서 마지막 `null`을 제거하고, `excludeIds_withValues_usesExcludingMethod_andParsesTokens`·`excludeIds_blank_usesFindRandomByCategory` 테스트를 제거한다.

## HIST-20260713-002

- **날짜**: 2026-07-13
- **수정 범위**: 사용자 백엔드 / 데일리 퀴즈 — 카테고리 구분 없는 AI 커스텀 통합 출제 지원
- **수정 개요**: 데일리 퀴즈 홈의 신규 "AI 커스텀 전체" 카드(프론트 변경: `docs/history/front/usr/UserQuiz_Modified.md` HIST-20260713-001)가 카테고리 구분 없이 전체 AI 커스텀 문항(exam_year·exam_round 모두 null)을 랜덤 연속 출제할 수 있도록 `GET /api/user/quiz/questions`의 `categoryId`를 optional로 열었다. categoryId가 null인 nullable Long native query 파라미터는 PostgreSQL 타입 추론 오류 위험이 있어, category 조건 자체를 제거한 별도 리포지토리 메서드(`findRandomBySourceOnly`)로 분리했다. 서비스 계층에는 categoryId가 null인데 source도 필터 없음(null)이면 전체 문항 무제한 랜덤 출제가 되어버리는 것을 막기 위해 `BusinessException(ErrorCode.INVALID_INPUT)`을 던지는 가드를 추가했다(이 진입은 AI 커스텀 전용이므로 정상 흐름에서는 프론트가 항상 `source=AI_CUSTOM`을 함께 보낸다).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/repository/QuestionBankRepository.java` | 수정 | 신규 `findRandomBySourceOnly(limit, language, source)` native query 메서드 추가 — category_id/exam_type_id 조건 없이 del_yn·language·source만 필터 |
| `backend/src/main/java/com/tpmp/testprep/controller/UserQuizController.java` | 수정 | `getQuizQuestions`의 `categoryId` 파라미터를 `@RequestParam(required = false) Long categoryId`로 변경 |
| `backend/src/main/java/com/tpmp/testprep/service/UserQuizService.java` | 수정 | `getQuizQuestions`에서 categoryId null이면 `findRandomBySourceOnly` 호출로 분기, 이때 normalizedSource도 null이면 `BusinessException(ErrorCode.INVALID_INPUT)` throw |

### 수정 상세

#### `repository/QuestionBankRepository.java`
- 변경 전: `findRandomByCategory(categoryId, limit, language, source)` 단일 메서드만 존재, categoryId는 필수(non-null) 전제.
- 변경 후: 기존 메서드는 그대로 유지하고, category_id/exam_type_id 조건이 없는 `findRandomBySourceOnly(limit, language, source)`를 신규 추가(del_yn='N', language·source 조건은 기존 쿼리와 동일 패턴 재사용).
- 이유: nullable Long 파라미터를 `(:categoryId IS NULL OR category_id = :categoryId OR exam_type_id = :categoryId)` 형태로 native query에 남기면 PostgreSQL이 파라미터 타입을 추론하지 못해 오류가 날 수 있어, categoryId 조건 자체가 없는 별도 메서드로 안전하게 분리.

#### `controller/UserQuizController.java`
- 변경 전: `@RequestParam Long categoryId` (필수)
- 변경 후: `@RequestParam(required = false) Long categoryId` (선택, 미전달 시 null)
- 이유: 프론트에서 "AI 커스텀 전체" 카드 클릭 시 categoryId 없이 요청을 보낼 수 있어야 함.

#### `service/UserQuizService.java`
- 변경 전: `getQuizQuestions`는 항상 `findRandomByCategory(categoryId, ...)` 호출.
- 변경 후: `categoryId == null`이면 `normalizedSource == null`일 때 `BusinessException(ErrorCode.INVALID_INPUT)`을 던지고, 그렇지 않으면 `findRandomBySourceOnly(limit, normalizedLanguage, normalizedSource)` 호출. `categoryId != null`이면 기존 `findRandomByCategory` 그대로.
- 이유: categoryId·source 둘 다 없는 진입을 허용하면 전체 문항(수천 건 규모) 무제한 랜덤 출제가 되어버려 AI 커스텀 전용이라는 의도를 벗어남 — 명시적으로 차단.

### 검증 결과
- `./gradlew compileJava`: 통과
- `./gradlew test --tests "com.tpmp.testprep.service.UserQuizServiceTest"`: 통과 (11 tests, 0 failures, 0 errors)

### 복원 방법
이 ID(HIST-20260713-002)만으로 복원 시:
1. `UserQuizService.java`의 `getQuizQuestions`를 categoryId 분기 없이 항상 `findRandomByCategory(categoryId, ...)`를 호출하도록 되돌린다.
2. `UserQuizController.java`의 `getQuizQuestions`에서 `@RequestParam(required = false) Long categoryId`를 `@RequestParam Long categoryId`로 되돌린다.
3. `QuestionBankRepository.java`에서 `findRandomBySourceOnly` 메서드를 제거한다.

## HIST-20260713-001

- **날짜**: 2026-07-13
- **수정 범위**: 사용자 백엔드 / 데일리 퀴즈·시험 채점 공통 — SHORT_ANSWER·SCHEDULING·SQL 텍스트 정답 따옴표 정규화
- **수정 개요**: SHORT_ANSWER·SCHEDULING·SQL 유형의 텍스트 정답 채점에서 작은따옴표(`'`)·큰따옴표(`"`)·모바일 IME 타이포그래피 따옴표(`‘` `’` `“` `”`) 차이를 무시하도록 `AnswerGrader`의 토큰 정규화 로직을 강화했다. 예: 정답 `과목코드='DB'`에 사용자가 `과목코드="DB"`로 입력해도 정답 처리된다. `AnswerGrader`는 데일리 퀴즈(`UserQuizService`)와 시험 채점(`UserExaminationService`) 양쪽에서 공용으로 쓰이므로 두 채점 경로 모두에 영향을 준다. CODE 유형(통문자열 비교)·MULTIPLE_CHOICE/OX·options 채점(`normalizeOptionToken`)·SQL 결과 테이블 채점(`normalizeSqlCell`)은 변경하지 않았다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/support/AnswerGrader.java` | 수정 | `normalizeToken`·`normalizeLoose`에 신규 `normalizeQuotes` 호출 추가, 클래스 상단 javadoc에 따옴표 정규화 설명 추가 |
| `backend/src/test/java/com/tpmp/testprep/service/support/AnswerGraderTest.java` | 수정 | SQL 2건(직선 따옴표 혼용, 타이포그래피 따옴표) + SHORT_ANSWER 1건 정답 인정 테스트, CODE 1건 따옴표 차이는 여전히 오답인 회귀 테스트 추가 |

### 수정 상세

#### `service/support/AnswerGrader.java`
- 변경 전: `normalizeToken`은 trim→소문자화→공백축약→괄호제거, `normalizeLoose`는 소문자화→괄호제거→구분자제거. 따옴표 종류 차이는 정규화되지 않아 `'DB'`와 `"DB"`가 다른 토큰으로 취급됨.
- 변경 후: 두 메서드 모두 소문자화 직후 신규 `private static String normalizeQuotes(String s)`(`s.replaceAll("[\"“”‘’]", "'")`)를 호출해 `"` `“` `”` `‘` `’`를 전부 `'`로 통일. 클래스 상단 javadoc(25~29행 부근)에 이 정규화를 설명하는 문단 추가. `normalizeOptionToken`·`normalizeCode`·`normalizeSqlCell`은 변경하지 않음(options 채점은 프론트 `parseAnswerToSlots`와 정규화 규칙 동기화 계약이 있어 의도적으로 미적용, CODE는 따옴표가 코드 문법의 일부이므로 미적용).
- 이유: 사용자가 SQL/단답형 정답에서 작은따옴표 대신 큰따옴표나 모바일 IME 자동 변환 따옴표를 입력해도 오답 처리되던 문제를 해소하기 위함.

### 복원 방법
이 ID(HIST-20260713-001)만으로 복원 시 `AnswerGrader.java`에서 `normalizeQuotes` 메서드를 제거하고 `normalizeToken`·`normalizeLoose` 내 `normalizeQuotes(s)` 호출 줄을 삭제하며, 클래스 상단 javadoc의 따옴표 정규화 설명 문단을 제거한다. `AnswerGraderTest.java`의 신규 따옴표 관련 테스트 4건(`sql_quoteStyleDiff_straightDoubleVsSingle_correct`, `sql_quoteStyleDiff_typographicQuote_correct`, `shortAnswer_quoteStyleDiff_correct`, `code_quoteStyleDiff_stillIncorrect`)을 삭제한다.

## HIST-20260710-002

- **날짜**: 2026-07-10
- **수정 범위**: 사용자 백엔드 / 데일리 퀴즈 — 복습 표시(북마크) 재풀이용 신규 엔드포인트 추가
- **수정 개요**: 복습 표시(북마크) 목록 화면의 "복습 시작" 버튼이 실제로 답을 입력하고 채점받을 수 있도록, 데일리 퀴즈 풀이 화면에서 사용자의 북마크 문항 전체를 정답 미노출 상태로 가져오는 `GET /api/user/quiz/bookmarked-questions` 엔드포인트를 추가했다. 기존 북마크 조회 구조(`UserQuestionBookmarkRepository.findAllByUserIdWithQuestion` — 소프트 삭제 문항 제외, 최신순)를 그대로 재사용해 `QuestionBank` 엔티티 목록을 얻고 `QuizQuestionView.from`으로 매핑(정답 미노출, 상한 100)했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/UserQuizService.java` | 수정 | `UserQuestionBookmarkRepository` 의존성 추가, `getBookmarkedQuestions(String email)` 신규 메서드 추가 |
| `backend/src/main/java/com/tpmp/testprep/controller/UserQuizController.java` | 수정 | `GET /bookmarked-questions` 엔드포인트 추가 |
| `backend/src/test/java/com/tpmp/testprep/service/UserQuizServiceTest.java` | 수정 | `UserQuestionBookmarkRepository`/`User` 목 추가, 생성자 호출을 5-arg로 갱신, 기존 `findRandomByCategory` 스텁을 `lenient()`로 전환(새 테스트에서 미사용으로 인한 strict-stub 실패 방지), 북마크 관련 테스트 2건 신규 추가 |

### 수정 상세

#### `service/UserQuizService.java`
- 변경 전: 필드 4개(`domainMasterRepository`, `questionBankRepository`, `userRepository`, `quizHistoryRecorder`), 북마크 관련 메서드 없음
- 변경 후: `private final UserQuestionBookmarkRepository userQuestionBookmarkRepository;` 필드 추가(5번째, `@RequiredArgsConstructor`로 생성자 자동 5-arg 확장). `getBookmarkedQuestions(String email)` 신규: 이메일로 `User` 조회 후 `userQuestionBookmarkRepository.findAllByUserIdWithQuestion(user.getId())` → `.map(UserQuestionBookmark::getQuestionBank)` → `.limit(100)` → `.map(QuizQuestionView::from)` → `.toList()`
- 이유: 계획서 스펙 그대로 구현. 기존 북마크 조회 리포지토리 쿼리가 이미 `qb.delYn = 'N'`·`ORDER BY b.createdAt DESC`(최신순)를 보장하므로 별도 필터·정렬 로직 추가 없이 재사용

#### `controller/UserQuizController.java`
- 변경 전: `/categories`·`/questions`·`/check` 3개 엔드포인트만 존재
- 변경 후: `@GetMapping("/bookmarked-questions")` 신규 — `@AuthenticationPrincipal String email`만 받아 `userQuizService.getBookmarkedQuestions(email)` 결과를 `List<QuizQuestionView>`로 반환
- 이유: 프론트엔드 `quizService.getBookmarkedQuestions()` 호출 대상

#### `test/UserQuizServiceTest.java`
- 변경 전: 생성자 4-arg 호출, `findRandomByCategory` 스텁이 strict(`when(...)`)
- 변경 후: `@Mock UserQuestionBookmarkRepository`·`@Mock User mockUser` 추가, 생성자 5-arg로 갱신, `findRandomByCategory` 스텁을 `lenient()`로 전환(북마크 테스트에서는 호출되지 않으므로 strict-stub 미사용 예외 방지), `userRepository.findByEmail(USER_EMAIL)`/`mockUser.getId()` lenient 스텁 추가. 신규 테스트 2건: 북마크 없음 → 빈 목록, 북마크 있음 → `QuizQuestionView`로 매핑되고 `content`가 정확히 전달됨(정답 필드는 `QuizQuestionView`에 애초에 없으므로 별도 미노출 검증 불필요, record 필드 자체로 보장됨)
- 이유: 신규 서비스 메서드 단위 테스트 커버리지 확보. `./gradlew test --tests UserQuizServiceTest` 11개 전체 통과, 전체 `./gradlew test` 스위트도 실패 없이 통과 확인

### 복원 방법
이 ID(HIST-20260710-002)만으로 복원 시: `UserQuizService.java`에서 `userQuestionBookmarkRepository` 필드와 `getBookmarkedQuestions` 메서드를 제거(4-arg 생성자로 복귀), `UserQuizController.java`에서 `/bookmarked-questions` 엔드포인트를 제거, `UserQuizServiceTest.java`에서 북마크 관련 목·테스트·5-arg 생성자 호출을 제거하고 4-arg로 되돌린다.

## HIST-20260710-001

- **날짜**: 2026-07-10
- **수정 범위**: 사용자 백엔드 / 데일리 퀴즈 — 출처(전체/기출/AI 커스텀) 필터 추가
- **수정 개요**: 기존 CODE 언어 필터(HIST 관련 e715088)와 동일한 패턴으로, 데일리 퀴즈 카테고리별 랜덤 문항 조회에 문항 출처 필터(`source`: "EXAM"=기출, "AI_CUSTOM"=AI 커스텀)를 추가했다. AI 커스텀 문항 판정 기준은 `examYear IS NULL AND examRound IS NULL`(관리자 문항관리 화면과 동일 기준). `QuestionBankRepository.findRandomByCategory` native query에 `source` 파라미터를 추가하고, 신규 `findDistinctCategoryIdsWithAiCustomQuestions()`로 AI 커스텀 문항이 존재하는 카테고리 ID를 구해 `DomainSlaveResponse.hasAiCustomQuestions`로 프론트에 노출한다. `UserQuizService.getQuizQuestions`는 4-arg(`categoryId, limit, language, source`)로 확장, `normalizeSource(source)`가 null/공백/"ALL"(대소문자 무시)/정의되지 않은 값을 모두 null(필터 없음)로 정규화하고 "AI_CUSTOM"/"EXAM"만 대소문자 무시 정규화해 통과시킨다. `UserQuizController.getQuizQuestions`에 `source` 쿼리 파라미터 추가.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/repository/QuestionBankRepository.java` | 수정 | `findRandomByCategory`에 `source` 파라미터 추가(native query 조건 확장), `findDistinctCategoryIdsWithAiCustomQuestions()` 신규 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/DomainSlaveResponse.java` | 수정 | `hasAiCustomQuestions` 필드 추가, `from(slave, hasCodeQuestions, hasAiCustomQuestions)` 3-arg로 확장(1-arg 하위 호환 유지) |
| `backend/src/main/java/com/tpmp/testprep/service/UserQuizService.java` | 수정 | `getCategories`에 `aiCustomCategoryIds` 조회·전달 추가, `getQuizQuestions`를 4-arg로 확장하고 `normalizeSource` 신규 추가 |
| `backend/src/main/java/com/tpmp/testprep/controller/UserQuizController.java` | 수정 | `getQuizQuestions`에 `source` 쿼리 파라미터 추가 |
| `backend/src/test/java/com/tpmp/testprep/service/UserQuizServiceTest.java` | 수정 | `findRandomByCategory` stub·캡처 헬퍼를 4-arg로 갱신, `capturedSource` 헬퍼 및 source 정규화 테스트 6개 신규 추가(기존 language 테스트 4개는 그대로 유지) |

### 수정 상세

#### `repository/QuestionBankRepository.java`
- 변경 전: `findRandomByCategory(categoryId, limit, language)` 3-arg, source 조건 없음
- 변경 후: `findRandomByCategory(categoryId, limit, language, source)` 4-arg. native query에 `AND (:source IS NULL OR (:source = 'AI_CUSTOM' AND exam_year IS NULL AND exam_round IS NULL) OR (:source = 'EXAM' AND (exam_year IS NOT NULL OR exam_round IS NOT NULL)))` 조건 추가. `findDistinctCategoryIdsWithAiCustomQuestions()` 신규: `qb.examYear IS NULL AND qb.examRound IS NULL AND qb.delYn = 'N' AND qb.category IS NOT NULL` 조건으로 category ID distinct 조회
- 이유: 데일리 퀴즈 문항 출처 필터링 지원 및 필터 노출 대상 카테고리 판별

#### `dto/response/DomainSlaveResponse.java`
- 변경 전: `record(id, masterId, name, displayOrder, hasCodeQuestions)`, `from(slave)`/`from(slave, hasCodeQuestions)` 2종
- 변경 후: `record(id, masterId, name, displayOrder, hasCodeQuestions, hasAiCustomQuestions)`, `from(slave)`(둘 다 false)/`from(slave, hasCodeQuestions, hasAiCustomQuestions)` 2종. 2-arg 호출부는 `UserQuizService.java` 한 곳뿐(사전 확인 완료)이라 그 호출부만 3-arg로 변경, 나머지 1-arg 호출부(`DomainService` 등)는 무변경으로 컴파일됨
- 이유: AI 커스텀 필터 노출 여부를 프론트에 전달

#### `service/UserQuizService.java`
- 변경 전: `getQuizQuestions(categoryId, limit, language)` 3-arg, `getCategories`는 `codeCategoryIds`만 조회
- 변경 후: `getCategories`에 `aiCustomCategoryIds` 조회 추가 후 `DomainSlaveResponse.from(s, codeCategoryIds.contains(...), aiCustomCategoryIds.contains(...))` 3-arg 호출로 변경. `getQuizQuestions(categoryId, limit, language, source)` 4-arg로 확장, `normalizeSource(source)` 신규 private 메서드 추가(null/공백/"ALL"→null, "AI_CUSTOM"/"EXAM" 대소문자 무시 정규화, 그 외 값→null)
- 이유: 계획서 스펙 그대로 구현. 계획과 다른 점 없음

#### `controller/UserQuizController.java`
- 변경 전: `getQuizQuestions(categoryId, limit, language)` — `source` 파라미터 없음
- 변경 후: `@RequestParam(required = false) String source` 추가, `userQuizService.getQuizQuestions(categoryId, limit, language, source)` 호출로 전달. 주석에 source 설명 한 줄 추가
- 이유: 프론트에서 출처 필터 쿼리 전달 지원

#### `test/UserQuizServiceTest.java`
- 변경 전: `findRandomByCategory` stub이 3-arg(`anyLong(), anyInt(), any()`), `capturedLanguage` 헬퍼가 3-arg 호출·3-arg captor
- 변경 후: stub을 4-arg(`anyLong(), anyInt(), any(), any()`)로 변경. `capturedLanguage`는 `service.getQuizQuestions(categoryId, limit, language, null)` 호출로 변경(source 인자는 `any()`로 매칭). 신규 `capturedSource(categoryId, limit, source)` 헬퍼(language는 null 고정, source만 캡처) 추가. source 정규화 테스트 6개(null→null, 공백→null, "ALL"/"all"→null, "ai_custom"/"AI_CUSTOM"/"exam"/"EXAM"→정규화값, "INVALID"→null) 신규 추가. 기존 language 테스트 4개는 헬퍼 내부만 4-arg로 갱신되고 테스트 로직·검증 내용은 그대로 유지
- 이유: 시그니처 확장에 따른 컴파일 정합성 확보 + source 정규화 로직 커버리지 확보

### 복원 방법
이 ID(HIST-20260710-001)만으로 복원 시: `QuestionBankRepository.findRandomByCategory`를 3-arg(language만)로, `findDistinctCategoryIdsWithAiCustomQuestions()` 제거. `DomainSlaveResponse`를 `hasCodeQuestions` 단일 필드·2-arg `from`으로 되돌리고 `UserQuizService.java:71` 호출부도 2-arg로 되돌린다. `UserQuizService.getQuizQuestions`를 3-arg(language만)로, `normalizeSource` 제거. `UserQuizController.getQuizQuestions`에서 `source` 파라미터 제거. `UserQuizServiceTest`는 HIST-20260707-003 시점(3-arg stub, `capturedLanguage`만 존재, source 테스트 없음) 상태로 되돌린다.

## HIST-20260707-003

- **날짜**: 2026-07-07
- **수정 범위**: 사용자 백엔드 / 퀴즈 테스트 — `UserQuizServiceTest` 선재 결함 수정 (테스트 코드만, 제품 코드 무변경)
- **수정 개요**: 직전 커밋(e715088, 데일리 퀴즈 CODE 언어 필터)에서 유래한 `UserQuizServiceTest`의 선재 결함을 수정했다. 헬퍼 `capturedLanguage(...)`가 매 호출마다 `verify(questionBankRepository).findRandomByCategory(anyLong(), anyInt(), captor.capture())`로 **정확히 1회 호출**을 강제했는데, `language_all_caseInsensitive_normalizesToNull`(한 테스트 메서드 안에서 3회 호출)·`language_java_passesThrough`(2회 호출) 케이스는 누적 호출 수가 1을 초과해 `TooManyActualInvocations`로 실패했다. 이번 보기(options) 채점 기능과는 무관한 결함이며, 전체 테스트 실행 중 발견되어 사용자 승인 하에 즉시 수정했다. `verify(..., atLeastOnce())`로 완화하고 `ArgumentCaptor.getValue()`(누적 캡처의 마지막 값 = 가장 최근 호출의 language)를 그대로 반환하도록 해 4개 테스트 케이스를 모두 유지하면서 통과시켰다. 제품 코드(`UserQuizService`, `AnswerGrader` 등)는 전혀 변경하지 않았다. 백엔드 전체 테스트(80건) 재실행 결과 실패 0건 확인.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/test/java/com/tpmp/testprep/service/UserQuizServiceTest.java` | 수정 | `capturedLanguage(...)` 헬퍼의 `verify()`를 `verify(questionBankRepository, atLeastOnce())`로 완화, `import static org.mockito.Mockito.atLeastOnce;` 추가 |

### 수정 상세

#### `service/UserQuizServiceTest.java`
- 변경 전:
  ```java
  private String capturedLanguage(Long categoryId, int limit, String language) {
      service.getQuizQuestions(categoryId, limit, language);
      ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
      verify(questionBankRepository).findRandomByCategory(anyLong(), anyInt(), captor.capture());
      return captor.getValue();
  }
  ```
- 변경 후:
  ```java
  private String capturedLanguage(Long categoryId, int limit, String language) {
      service.getQuizQuestions(categoryId, limit, language);
      ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
      verify(questionBankRepository, atLeastOnce()).findRandomByCategory(anyLong(), anyInt(), captor.capture());
      return captor.getValue();
  }
  ```
- 이유: 한 테스트 메서드 안에서 헬퍼를 여러 번 호출하는 케이스(`language_all_caseInsensitive_normalizesToNull`, `language_java_passesThrough`)가 누적 호출 검증(`atLeastOnce`) 없이는 `TooManyActualInvocations`로 실패하기 때문. `getValue()`는 누적 캡처 중 마지막 값을 반환하므로 각 호출 직후 검증하는 현재 구조에서 이번 호출의 language가 그대로 반환된다.

### 복원 방법
이 ID(HIST-20260707-003)만으로 복원 시 `UserQuizServiceTest.java`의 `capturedLanguage(...)` 헬퍼에서 `verify(questionBankRepository, atLeastOnce())`를 `verify(questionBankRepository)`로 되돌리고 `import static org.mockito.Mockito.atLeastOnce;`를 제거한다(단, 이 경우 `language_all_caseInsensitive_normalizesToNull`·`language_java_passesThrough` 테스트가 다시 실패하므로 권장하지 않음).

## HIST-20260707-002

- **날짜**: 2026-07-07
- **수정 범위**: 사용자 백엔드 / 퀴즈 채점 — 보기(options) 기반 번호 직접 입력 채점
- **수정 개요**: 문항에 보기(options)가 있으면 유형(questionType)과 무관하게 사용자가 입력한 보기 번호 문자열을 정답과 비교해 채점하는 기능을 추가했다. `AnswerGrader`에 4-인자 오버로드 `isCorrect(questionType, correctAnswer, userAnswer, options)`를 신규 추가했고, `hasMeaningfulOptions(options)`(null/empty 아니고 trim 후 비어있지 않은 항목 1개 이상)로 보기 유무를 판정해 보기가 있으면 유형 무시하고 `correctAnswer`/`userAnswer` trim·대소문자 무시 비교(MULTIPLE_CHOICE와 동일 경로)로, 없으면 기존 3-인자 `isCorrect(questionType, correctAnswer, userAnswer)`로 위임한다. 기존 3-인자 메서드의 본문·시그니처는 변경하지 않아 회귀 없음. `UserQuizService.checkAnswer`가 이 4-인자 오버로드로 전환되어 `qb.getOptions()`를 함께 전달한다. 시험 채점(`UserExaminationService`) 쪽 반영은 [back/usr/UserExamination_Modified.md HIST-20260707-001] 참조, 관리자 등록 화면(유형 무관 보기 등록)은 [front/adm/AdminQuestion_Modified.md HIST-20260707-002], 사용자 풀이 화면(보기 참고표시+번호입력 UI) 반영은 [front/usr/UserQuizExam_Modified.md HIST-20260707-001] 참조.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/support/AnswerGrader.java` | 수정 | 4-인자 오버로드 `isCorrect(type, correct, user, options)` + private `hasMeaningfulOptions(options)` 헬퍼 추가, 클래스 Javadoc에 보기 우선 채점 규칙 명시. 기존 3-인자 메서드는 변경 없음 |
| `backend/src/test/java/com/tpmp/testprep/service/support/AnswerGraderTest.java` | 수정 | 4-인자 오버로드 테스트 추가(SHORT_ANSWER/CODE/OX + options 있음 → 번호 비교, options 빈 배열·전부 공백·null → 기존 3-인자와 동일 동작) |
| `backend/src/main/java/com/tpmp/testprep/service/UserQuizService.java` | 수정 | `checkAnswer`의 `AnswerGrader.isCorrect(...)` 호출을 4-인자로 변경, `qb.getOptions()` 전달 |

### 수정 상세

#### `service/support/AnswerGrader.java`
- 변경 전: `isCorrect(String questionType, String correctAnswer, String userAnswer)` 3-인자만 존재
- 변경 후: 3-인자 메서드는 그대로 유지하고, 아래 4-인자 오버로드를 추가
  ```java
  public static boolean isCorrect(String questionType, String correctAnswer, String userAnswer, List<String> options) {
      if (hasMeaningfulOptions(options)) {
          if (correctAnswer == null || userAnswer == null) return false;
          return correctAnswer.trim().equalsIgnoreCase(userAnswer.trim());
      }
      return isCorrect(questionType, correctAnswer, userAnswer);
  }

  private static boolean hasMeaningfulOptions(List<String> options) {
      if (options == null || options.isEmpty()) return false;
      return options.stream().anyMatch(o -> o != null && !o.trim().isEmpty());
  }
  ```
- 이유: 보기가 있는 문항은 유형과 무관하게 "보기 참고 + 번호 직접 입력" 방식으로 통일 채점하기 위함(TPMP 신규 기능 요구사항)

#### `service/UserQuizService.java`
- 변경 전: `AnswerGrader.isCorrect(qb.getQuestionType().name(), qb.getAnswer(), request.userAnswer())`
- 변경 후: `AnswerGrader.isCorrect(qb.getQuestionType().name(), qb.getAnswer(), request.userAnswer(), qb.getOptions())`
- 이유: 퀴즈 문항도 보기 유무에 따라 유형 무관 번호 채점을 적용하기 위함

### 복원 방법
이 ID(HIST-20260707-002)만으로 복원 시: `AnswerGrader.java`에서 4-인자 오버로드와 `hasMeaningfulOptions` 헬퍼를 제거하고 클래스 Javadoc의 보기 관련 문장을 되돌린다. `AnswerGraderTest.java`에서 4-인자 오버로드 테스트 블록을 제거한다. `UserQuizService.java`의 `checkAnswer` 호출을 3-인자 `AnswerGrader.isCorrect(qb.getQuestionType().name(), qb.getAnswer(), request.userAnswer())`로 되돌린다.

## HIST-20260707-001

- **날짜**: 2026-07-07
- **수정 범위**: 사용자 백엔드 / 데일리 퀴즈 — CODE(프로그래밍 언어) 카테고리 언어 필터
- **수정 개요**: 데일리 퀴즈에서 CODE 유형 문항 카테고리를 풀 때 Java/Python/C/전체 중 언어를 선택해 해당 언어 문항만 출제받을 수 있도록 `/api/user/quiz/questions`에 `language` 파라미터를 추가하고, `/api/user/quiz/categories` 응답에 카테고리별 `hasCodeQuestions` 플래그를 추가해 FE가 언어 선택 모달 노출 여부를 판단할 수 있게 했다. `language`가 null/공백/"ALL"(대소문자 무시)이면 기존과 동일하게 필터 없이 전체 반환(회귀 없음). 언어 필터는 반드시 `question_type = 'CODE'` 조건과 함께 걸어 CODE가 아닌 문항에 언어 값이 실려 있어도 섞이지 않도록 함.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/repository/QuestionBankRepository.java` | 수정 | `findRandomByCategory`에 `language` 파라미터 추가(네이티브 쿼리 WHERE절 확장), `findDistinctCategoryIdsByQuestionType` 신규 메서드 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/UserQuizService.java` | 수정 | `getQuizQuestions`에 `language` 파라미터 추가 + 정규화(null/공백/"ALL"→null), `getCategories`에서 QUESTION_TYPE 슬레이브에 `hasCodeQuestions` 플래그 부여 |
| `backend/src/main/java/com/tpmp/testprep/controller/UserQuizController.java` | 수정 | `/questions`에 `@RequestParam(required=false) String language` 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/DomainSlaveResponse.java` | 수정 | `hasCodeQuestions` 필드 추가, `from(slave, hasCodeQuestions)` 오버로드 추가(기존 `from(slave)`는 하위 호환 위해 유지, 내부적으로 false 전달) |
| `backend/src/test/java/com/tpmp/testprep/service/UserQuizServiceTest.java` | 추가 | `getQuizQuestions` language 정규화 단위 테스트(null/공백/"ALL" 대소문자/"java") |

### 수정 상세

#### `repository/QuestionBankRepository.java`
- 변경 전:
  ```java
  @Query(value = "SELECT * FROM question_bank WHERE (category_id = :categoryId OR exam_type_id = :categoryId) AND del_yn = 'N' ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
  List<QuestionBank> findRandomByCategory(@Param("categoryId") Long categoryId, @Param("limit") int limit);
  ```
- 변경 후:
  ```java
  @Query(value = "SELECT * FROM question_bank " +
      "WHERE (category_id = :categoryId OR exam_type_id = :categoryId) " +
      "AND del_yn = 'N' " +
      "AND (:language IS NULL OR (question_type = 'CODE' AND LOWER(language) = LOWER(:language))) " +
      "ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
  List<QuestionBank> findRandomByCategory(@Param("categoryId") Long categoryId, @Param("limit") int limit, @Param("language") String language);
  ```
  신규: `findDistinctCategoryIdsByQuestionType(QuestionBank.QuestionType questionType)` — CODE 유형 문항이 존재하는 category ID 목록 조회(JPQL, `findDistinctCategoryIdsByExamTypeIds`와 동일 패턴)
- 이유: `language`가 null이면 조건 전체가 TRUE가 되어 기존 동작과 100% 동일. CODE 조건을 명시적으로 함께 걸어, 관리자 등록 폼 버그로 CODE가 아닌 문항에 language 값이 남아 있어도 잘못 필터링되지 않도록 함.

#### `service/UserQuizService.java`
- 변경 전: `getQuizQuestions(Long categoryId, int limit)` — language 없음. `getCategories`는 QUESTION_TYPE 슬레이브를 `DomainSlaveResponse::from`으로 매핑(examTypeIds 필터가 있을 때만 별도 분기).
- 변경 후: `getQuizQuestions(Long categoryId, int limit, String language)` — `normalizedLanguage = (language == null || language.isBlank() || "ALL".equalsIgnoreCase(language)) ? null : language.trim()` 정규화 후 리포지토리 호출. `getCategories`는 `findDistinctCategoryIdsByQuestionType(CODE)`로 codeCategoryIds Set을 조회해, QUESTION_TYPE 슬레이브 매핑 시 `DomainSlaveResponse.from(s, codeCategoryIds.contains(s.getId()))`로 `hasCodeQuestions` 부여. examTypeIds 필터 유무와 무관하게 항상 계산(필터 로직은 `finalAllowedIds == null || finalAllowedIds.contains(...)`로 단순화, 결과는 기존과 동일).
- 이유: CODE 유형 문항이 실제로 있는 카테고리만 FE에서 언어 선택 모달을 띄우도록 서버가 명시적으로 알려줌.

#### `controller/UserQuizController.java`
- 변경 전: `getQuizQuestions(@RequestParam Long categoryId, @RequestParam(defaultValue="10") int limit)`
- 변경 후: `@RequestParam(required = false) String language` 추가, 서비스에 그대로 전달
- 이유: FE에서 선택한 언어를 전달받기 위함(미전달 시 기존과 동일)

#### `dto/response/DomainSlaveResponse.java`
- 변경 전: `record DomainSlaveResponse(Long id, Long masterId, String name, Integer displayOrder)`, `from(slave)` 단일 팩토리
- 변경 후: `record DomainSlaveResponse(Long id, Long masterId, String name, Integer displayOrder, boolean hasCodeQuestions)`. `from(slave)`는 `from(slave, false)` 위임(기존 호출부 전부 무변경 동작 유지 — DomainService, ExamInfoService, DomainMasterResponse 등), `from(slave, boolean hasCodeQuestions)` 신규 오버로드 추가
- 이유: 프로그래밍 언어 필터 모달 노출 여부를 FE에 전달. 다른 도메인(시험 유형 등)은 항상 false로 무영향.

### 복원 방법
이 ID(HIST-20260707-001)만으로 복원 시:
1. `QuestionBankRepository.java`: `findRandomByCategory`를 `language` 파라미터 없는 원래 시그니처/쿼리로 복원, `findDistinctCategoryIdsByQuestionType` 삭제
2. `UserQuizService.java`: `getQuizQuestions(Long categoryId, int limit)`로 복원(정규화 로직 제거), `getCategories`의 `codeCategoryIds` 계산 및 `hasCodeQuestions` 부여 로직 제거하고 원래의 `finalAllowedIds != null` 분기 형태로 복원
3. `UserQuizController.java`: `/questions`에서 `language` 파라미터 제거
4. `DomainSlaveResponse.java`: `hasCodeQuestions` 필드 제거, `from(slave, boolean)` 오버로드 삭제, `from(slave)`를 원래 5-arg 없는 형태로 복원
5. `UserQuizServiceTest.java` 삭제

---

## HIST-20260706-001

- **날짜**: 2026-07-06
- **수정 범위**: 사용자 백엔드 / 퀴즈 채점 (SHORT_ANSWER·SCHEDULING 채점 완화)
- **수정 개요**: `AnswerGrader`의 SHORT_ANSWER·SCHEDULING 토큰 정규화를 강화(구분자에 슬래시 추가, 내부 연속 공백 축약, 말미 괄호 부연 설명 제거)하고, 정확 일치(`multiSetMatch`)가 실패할 경우 구분자·괄호·공백을 모두 제거해 전체 문자열을 비교하는 느슨 폴백을 추가함. 퀴즈 채점(`UserQuizService.checkAnswer`)에 자동 반영됨(퀴즈 서비스 코드 변경 없음). 시험 제출 채점도 동일 헬퍼를 사용하므로 함께 적용됨 — 상세는 [back/usr/UserExamination_Modified.md HIST-20260706-001] 참조.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/support/AnswerGrader.java` | 수정 | tokenize 정규화 강화(슬래시 구분자·공백 축약·괄호 제거) + 느슨 폴백(`looseEqualsIgnoringPunctuation`) 추가 |
| `backend/src/test/java/com/tpmp/testprep/service/support/AnswerGraderTest.java` | 수정 | 괄호 부연·슬래시 구분·느슨 폴백·오탐 방지 테스트 8건 추가(SHORT_ANSWER 6건, SCHEDULING 1건 등) |

### 수정 상세

#### `service/support/AnswerGrader.java`
- 변경 전: `tokenize`는 콤마(`,`)만으로 분리 후 trim·소문자화만 수행. `multiSetMatch` 실패 시 바로 오답 처리.
- 변경 후:
  - `tokenize`: `split("[,/]")`로 콤마·슬래시 모두 구분자로 인식. 각 토큰은 trim → 소문자화 → 연속 공백 단일 공백 축약(`replaceAll("\\s+"," ")`) → 말미 괄호 부연 제거(`replaceAll("\\s*\\([^)]*\\)\\s*$","")`) → 재-trim 순으로 정규화(`normalizeToken`).
  - `multiSetMatch` 실패 시 `looseEqualsIgnoringPunctuation` 폴백 실행: 양쪽 문자열을 소문자화 → 괄호 부연 전체 제거 → 공백·콤마·슬래시 전부 제거 후 동등 비교. 정규화 결과가 한쪽이라도 빈 문자열이면 폴백 미적용(오답 유지).
  - MULTIPLE_CHOICE·OX·CODE 분기는 변경 없음.
- 이유: 사용자가 정답의 괄호 부연 설명(예: `워터링 홀 (Watering Hole)`)을 빼고 입력하거나, 구분자 없이 답을 나열(예: `1. pwd 2. ls 3. cd 4. cp` vs 정답 `1. pwd / 2. ls / 3. cd / 4. cp`)해도 정답 처리되도록 채점을 완화. 기존 정확 일치·부분 입력 오답 케이스는 유지되도록 폴백은 정확 일치 실패 후에만 적용.

### 복원 방법
이 ID(HIST-20260706-001)만으로 복원 시: `AnswerGrader.java`의 `tokenize`를 콤마 단일 분리 + trim + 소문자화만 남기고, `normalizeToken`·`looseEqualsIgnoringPunctuation`·`normalizeLoose` 메서드 제거, `isCorrect`의 SHORT_ANSWER·SCHEDULING 분기에서 폴백 호출부 제거(`multiSetMatch` 결과만 반환). 테스트 추가 케이스 8건 삭제.

---

## HIST-20260629-002

- **날짜**: 2026-06-29
- **수정 범위**: 사용자 백엔드 / 퀴즈 채점 (CODE 유형 정규화)
- **수정 개요**: `AnswerGrader.isCorrect` CODE 분기에 보수안 정규화(CRLF→LF·줄 끝 공백 제거·앞뒤 빈 줄 제거)를 추가하여, 퀴즈 채점(`UserQuizService.checkAnswer`)에서도 코드 답안의 줄 끝 공백·줄바꿈 차이가 정답으로 처리됨. 들여쓰기는 정답의 일부로 보존. 상세는 동일 변경을 다룬 [back/usr/UserExamination_Modified.md HIST-20260629-002] 참조.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/support/AnswerGrader.java` | 수정 | CODE 분기 분리 + `normalizeCode` 정규화 추가 (퀴즈·시험 공용) |
| `backend/src/test/java/com/tpmp/testprep/service/support/AnswerGraderTest.java` | 수정 | CODE 정규화 케이스 6개 추가 |

### 수정 상세

#### `service/support/AnswerGrader.java`
- `UserQuizService.checkAnswer`는 `AnswerGrader.isCorrect(qb.getQuestionType().name(), qb.getAnswer(), request.userAnswer())`를 호출하므로, CODE 분기 정규화 추가만으로 퀴즈 채점에 자동 반영됨(퀴즈 서비스 코드 자체 변경 없음)
- 정규화 내용: CRLF→LF, 각 줄 `stripTrailing`, 전체 `strip`. 줄 내부 들여쓰기는 보존
- 이유: 코드 문항을 멀티라인으로 입력하면서 발생하는 줄 끝 공백·줄바꿈 차이로 인한 오채점 해소

### 복원 방법
이 ID(HIST-20260629-002)만으로 복원 시: `AnswerGrader.java`의 CODE 분기·`normalizeCode` 제거(시험 채점 복원과 동일), 테스트 추가 케이스 6개 삭제.

---

## HIST-20260629-001

- **날짜**: 2026-06-29
- **수정 범위**: 사용자 백엔드 / 퀴즈 채점
- **수정 개요**: `UserQuizService.checkAnswer` 채점 로직을 `AnswerGrader.isCorrect`로 교체 — SHORT_ANSWER 복수 정답(콤마 구분) 지원

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/support/AnswerGrader.java` | 추가 | 문항 유형별 채점 공통 헬퍼 신설 |
| `backend/src/main/java/com/tpmp/testprep/service/UserQuizService.java` | 수정 | `checkAnswer` 채점식을 `AnswerGrader.isCorrect` 호출로 교체, import 추가 |
| `backend/src/test/java/com/tpmp/testprep/service/support/AnswerGraderTest.java` | 추가 | `AnswerGrader` 단위 테스트 (Spring 컨텍스트 없음, 17케이스) |

### 수정 상세

#### `service/support/AnswerGrader.java` (신규)
- 변경 전: 없음
- 변경 후: `public final class AnswerGrader` — `isCorrect(String questionType, String correctAnswer, String userAnswer)` 정적 메서드. SHORT_ANSWER일 때 콤마 분리 → trim/소문자/빈토큰제거 → Set 동일성 검사. 그 외 타입은 기존 `equalsIgnoreCase` 통문자열 비교.
- 이유: 퀴즈·시험 공통 채점 로직을 단일 지점으로 집중, SHORT_ANSWER 복수 정답 지원

#### `service/UserQuizService.java`
- 변경 전:
  ```java
  boolean correct = qb.getAnswer() != null
          && qb.getAnswer().trim().equalsIgnoreCase(request.userAnswer().trim());
  ```
- 변경 후:
  ```java
  boolean correct = AnswerGrader.isCorrect(
          qb.getQuestionType().name(), qb.getAnswer(), request.userAnswer());
  ```
- 이유: 공통 헬퍼로 교체. null 안전 처리 및 복수 정답 지원을 헬퍼에서 일괄 처리.

### 복원 방법
이 ID(HIST-20260629-001)만으로 복원 시:
1. `service/support/AnswerGrader.java` 삭제
2. `test/.../service/support/AnswerGraderTest.java` 삭제
3. `UserQuizService.java`에서 `AnswerGrader.isCorrect` 호출을 `qb.getAnswer() != null && qb.getAnswer().trim().equalsIgnoreCase(request.userAnswer().trim())` 로 복원, `import com.tpmp.testprep.service.support.AnswerGrader` 제거

---

## HIST-20260625-001

- **날짜**: 2026-06-25
- **수정 범위**: 사용자 백엔드 / 퀴즈
- **수정 개요**: `QuizQuestionView` record에 `String title` 필드 추가 — 관리용 문항 제목을 퀴즈 응답에 포함

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuizQuestionView.java` | 수정 | `String title` 필드 추가(id 다음, content 앞), `from()` 팩토리에 `qb.getTitle()` 매핑 추가 |

### 수정 상세

#### `dto/response/QuizQuestionView.java`
- 변경 전:
  ```java
  public record QuizQuestionView(
          Long id,
          String content,
          String questionType,
          List<String> options,
          String code,
          String language,
          Integer examYear,
          Integer examRound) { ... }
  ```
- 변경 후:
  ```java
  public record QuizQuestionView(
          Long id,
          String title,
          String content,
          String questionType,
          List<String> options,
          String code,
          String language,
          Integer examYear,
          Integer examRound) { ... }
  ```
  `from()` 내부 두 번째 인자로 `qb.getTitle()` 추가.
- 이유: FE 퀴즈 플레이 화면에서 관리용 제목(QuestionBank.title)을 문제 카드 상단 헤더로 노출하기 위해 DTO에 필드 포함.

### 복원 방법
이 ID(HIST-20260625-001)만으로 복원 시 `QuizQuestionView` record에서 `String title` 필드 제거, `from()` 메서드의 두 번째 인자 `qb.getTitle()` 제거.

---

## HIST-20260622-002

- **날짜**: 2026-06-22
- **수정 범위**: 사용자 백엔드 / 퀴즈
- **수정 개요**: `checkAnswer` 트랜잭션 격리 결함 수정 — `QuizHistory` 저장을 `QuizHistoryRecorder`(REQUIRES_NEW)로 분리하여 `UnexpectedRollbackException` 방지

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/QuizHistoryRecorder.java` | 추가 | REQUIRES_NEW 독립 트랜잭션으로 QuizHistory 저장하는 전담 컴포넌트 |
| `backend/src/main/java/com/tpmp/testprep/service/UserQuizService.java` | 수정 | 메서드 레벨 `@Transactional` 제거, `QuizHistoryRecorder` 주입·호출, `QuizHistoryRepository`·`QuizHistory`·`User` import 제거 |

### 수정 상세

#### `service/QuizHistoryRecorder.java` (신규)
- 변경 전: 없음
- 변경 후: `@Service @RequiredArgsConstructor @Slf4j`. `QuizHistoryRepository`·`UserRepository` 주입. `record(Long userId, Long questionBankId, Long categoryId, String domainName, String questionType, String userAnswer, boolean correct)` — `@Transactional(propagation = Propagation.REQUIRES_NEW)`, 내부에서 `userRepository.getReferenceById(userId)`로 User 프록시 생성 후 `QuizHistory.builder()`·`save()`.
- 이유: REQUIRES_NEW를 같은 클래스 메서드로 두면 Spring AOP 프록시 우회로 동작하지 않으므로 별도 Spring 빈으로 분리.

#### `service/UserQuizService.java` (수정)
- 변경 전:
  - `checkAnswer`에 `@Transactional` (쓰기) 메서드 레벨 어노테이션 존재
  - `QuizHistoryRepository`, `User`, `QuizHistory` import 및 필드 `quizHistoryRepository` 존재
  - try-catch 내부에서 `User` 엔티티 조회 → `QuizHistory.builder()` → `quizHistoryRepository.save()` 직접 호출
- 변경 후:
  - `checkAnswer` 메서드 레벨 `@Transactional` 제거 (클래스 레벨 readOnly 트랜잭션만 적용)
  - `quizHistoryRepository` 필드 → `quizHistoryRecorder` 필드로 교체
  - `QuizHistory`, `User`, `QuizHistoryRepository` import 제거
  - try-catch 내부에서 userId·categoryId·domainName·questionType 스칼라 값 추출 후 `quizHistoryRecorder.record(...)` 호출
- 이유: 메서드 레벨 `@Transactional`(쓰기) 안에서 `save()`가 예외를 던지면 바깥 트랜잭션이 rollback-only 마킹되어 커밋 시 `UnexpectedRollbackException` 발생 — try-catch가 실제로 격리 역할을 하지 못함. REQUIRES_NEW 별도 빈으로 분리해야 물리 트랜잭션이 분리되고 격리가 실제 동작함.

#### User 파라미터를 userId(Long)로 받는 이유
호출측 readOnly tx에서 넘어온 User 엔티티는 해당 영속성 컨텍스트에 귀속되어 REQUIRES_NEW 내부에서 detached 상태가 될 수 있다. userId만 받아 `userRepository.getReferenceById(userId)`로 REQUIRES_NEW tx 내부에서 프록시를 생성하면 LazyInitialization·detached 양쪽 문제를 모두 회피할 수 있다.

### 복원 방법
이 ID(HIST-20260622-002)만으로 복원 시:
1. `service/QuizHistoryRecorder.java` 삭제
2. `UserQuizService.java`: `checkAnswer`에 `@Transactional` 쓰기 어노테이션 복원, `quizHistoryRecorder` 필드 → `quizHistoryRepository` 복원, try-catch 내부를 User 엔티티 직접 조회 → `QuizHistory.builder()` → `quizHistoryRepository.save()` 직접 호출로 복원, `QuizHistory`·`User`·`QuizHistoryRepository` import 복원

---

## HIST-20260622-001

- **날짜**: 2026-06-22
- **수정 범위**: 사용자 백엔드 / 퀴즈
- **수정 개요**: 퀴즈 풀이 이력 영속화 — `checkAnswer`에 email 파라미터 추가, `QuizHistory` 저장 로직 삽입 (저장 실패 시 격리)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/QuizHistory.java` | 추가 | 퀴즈 풀이 이력 엔티티 (quiz_history 테이블, BaseEntity 미상속 자체 created_at) |
| `backend/src/main/java/com/tpmp/testprep/repository/QuizHistoryRepository.java` | 추가 | 사용자별 집계 JPQL 3종 (sumTotal, aggregateDomain, aggregateDaily) |
| `backend/src/main/java/com/tpmp/testprep/service/UserQuizService.java` | 수정 | `checkAnswer(CheckRequest, String email)` 시그니처 변경, `@Transactional` 쓰기 추가, `QuizHistory` 저장 로직 삽입, `@Slf4j` 추가, `UserRepository`·`QuizHistoryRepository` 주입 |
| `backend/src/main/java/com/tpmp/testprep/controller/UserQuizController.java` | 수정 | `checkAnswer` 핸들러에 `@AuthenticationPrincipal String email` 파라미터 추가, 서비스에 전달 |

### 수정 상세

#### `entity/QuizHistory.java` (신규)
- 변경 전: 없음
- 변경 후: `@Entity @Table(name="quiz_history")`, 인덱스 3개(user_id, created_at, category_id), 필드: id, user(ManyToOne LAZY), questionBankId, categoryId, domainName, questionType, userAnswer, correct(boolean), createdAt(@PrePersist), `@Builder`, `@Getter`, `@NoArgsConstructor(PROTECTED)`
- 이유: 퀴즈 채점 이력을 영속화하여 대시보드 통계에 퀴즈 풀이 데이터를 반영하기 위함

#### `repository/QuizHistoryRepository.java` (신규)
- 변경 전: 없음
- 변경 후: `sumTotalAndCorrectByUserAndPeriod`, `aggregateDomainStatsByUserAndPeriod`, `aggregateDailyStatsByUserAndPeriod` JPQL 집계 메서드 3종. ExamHistoryRepository 패턴 준수.
- 이유: UserDashboardService에서 퀴즈 이력 기반 통계를 조회하기 위함

#### `service/UserQuizService.java` (수정)
- 변경 전: `checkAnswer(CheckRequest request)` — 채점만 수행, email 파라미터 없음
- 변경 후: `checkAnswer(CheckRequest request, String email)` — 채점 후 `QuizHistory` 저장, try-catch로 저장 실패 격리(log.warn), `DomainSlave category = qb.getCategory()`로 categoryId/domainName 비정규화, `@Transactional` 쓰기 어노테이션 추가
- 이유: 퀴즈 이력 영속화. 저장 실패가 채점 응답을 막으면 안 되므로 격리 처리.

#### `controller/UserQuizController.java` (수정)
- 변경 전: `checkAnswer(@RequestBody CheckRequest request)` — email 없음
- 변경 후: `checkAnswer(@RequestBody CheckRequest request, @AuthenticationPrincipal String email)` — 서비스에 email 전달
- 이유: 서비스가 이력 저장 시 User를 찾기 위한 이메일 파라미터 전달

### 복원 방법
이 ID(HIST-20260622-001)만으로 복원 시:
1. `entity/QuizHistory.java`, `repository/QuizHistoryRepository.java` 삭제
2. `UserQuizService.java`: `checkAnswer(CheckRequest request, String email)` → `checkAnswer(CheckRequest request)`, `@Transactional` 메서드 어노테이션 제거, try-catch 이력 저장 블록 제거, `@Slf4j`·`UserRepository`·`QuizHistoryRepository` 제거
3. `UserQuizController.java`: `checkAnswer` 핸들러에서 `@AuthenticationPrincipal String email` 파라미터 제거, `import org.springframework.security.core.annotation.AuthenticationPrincipal` 제거

---

## HIST-20260621-001

- **날짜**: 2026-06-21
- **수정 범위**: 사용자 백엔드 / 퀴즈
- **수정 개요**: `UserQuizService.checkAnswer`의 `orElseThrow()` 인자 없는 형태를 `BusinessException(ErrorCode.QUESTION_NOT_FOUND)`로 교체 — `NoSuchElementException` 500 오류 방지

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/UserQuizService.java` | 수정 | `checkAnswer` 내 `.orElseThrow()` → `.orElseThrow(() -> new BusinessException(ErrorCode.QUESTION_NOT_FOUND))`, `BusinessException`·`ErrorCode` import 추가 |

### 수정 상세

#### `service/UserQuizService.java`
- 변경 전:
  ```java
  QuestionBank qb = questionBankRepository.findById(request.questionId())
          .filter(q -> "N".equals(q.getDelYn()))
          .orElseThrow();
  ```
- 변경 후:
  ```java
  QuestionBank qb = questionBankRepository.findById(request.questionId())
          .filter(q -> "N".equals(q.getDelYn()))
          .orElseThrow(() -> new BusinessException(ErrorCode.QUESTION_NOT_FOUND));
  ```
- 이유: 인자 없는 `orElseThrow()`는 `NoSuchElementException`을 던지는데, `GlobalExceptionHandler`에 등록된 핸들러가 없어 `handleUnexpected`(500)로 처리됨. `ErrorCode.QUESTION_NOT_FOUND`(404)로 교체하여 4xx로 정상 응답.

### 복원 방법
이 ID(HIST-20260621-001)만으로 복원 시 `UserQuizService.checkAnswer`의 `.orElseThrow(() -> ...)` 람다를 `.orElseThrow()`로 되돌리고, `BusinessException`·`ErrorCode` import 제거.

---

## HIST-20260614-001

- **날짜**: 2026-06-14
- **수정 범위**: 사용자 백엔드 / 퀴즈
- **수정 개요**: `UserQuizController` 3레이어 분리 — 내부 record를 DTO 패키지로 이동, `UserQuizService` 신규 추가, 컨트롤러는 서비스 위임만 담당하도록 리팩토링 (동작 보존)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuizQuestionView.java` | 추가 | 컨트롤러 내부 record → DTO 패키지 이동, `from(QuestionBank)` 팩토리 포함 |
| `backend/src/main/java/com/tpmp/testprep/dto/request/CheckRequest.java` | 추가 | 컨트롤러 내부 record → DTO 패키지 이동 (`questionId`, `userAnswer`) |
| `backend/src/main/java/com/tpmp/testprep/dto/response/CheckResult.java` | 추가 | 컨트롤러 내부 record → DTO 패키지 이동 (`correct`, `answer`, `explanation`) |
| `backend/src/main/java/com/tpmp/testprep/service/UserQuizService.java` | 추가 | 퀴즈 비즈니스 로직 전담 서비스 신규 생성 (`getCategories`, `getQuizQuestions`, `checkAnswer`) |
| `backend/src/main/java/com/tpmp/testprep/controller/UserQuizController.java` | 수정 | Repository 직접 의존 제거, `UserQuizService` 주입, 내부 record 삭제, import 갱신 |

### 수정 상세

#### `dto/response/QuizQuestionView.java` (신규)
- 변경 전: `UserQuizController` 내부 `public record QuizQuestionView(...)`
- 변경 후: `com.tpmp.testprep.dto.response` 패키지의 독립 파일
- 이유: 레이어 역전 방지 — 서비스가 컨트롤러 내부 타입에 의존하지 않도록 분리

#### `dto/request/CheckRequest.java` (신규)
- 변경 전: `UserQuizController` 내부 `public record CheckRequest(Long questionId, String userAnswer)`
- 변경 후: `com.tpmp.testprep.dto.request` 패키지의 독립 파일
- 이유: 서비스 레이어에서 참조 가능하도록 요청 DTO 분리

#### `dto/response/CheckResult.java` (신규)
- 변경 전: `UserQuizController` 내부 `public record CheckResult(boolean correct, String answer, String explanation)`
- 변경 후: `com.tpmp.testprep.dto.response` 패키지의 독립 파일
- 이유: 응답 DTO를 서비스 반환 타입으로 사용하기 위해 분리

#### `service/UserQuizService.java` (신규)
- 변경 전: 파일 없음 (로직이 컨트롤러에 인라인)
- 변경 후: `@Service @RequiredArgsConstructor @Transactional(readOnly = true)` 클래스. `DomainMasterRepository`, `QuestionBankRepository` 주입. 메서드 3개: `getCategories`, `getQuizQuestions`, `checkAnswer`. `checkAnswer`의 `orElseThrow()` 인자 없는 형태 그대로 유지 (동작 보존).
- 이유: Controller → Service 레이어 분리

#### `controller/UserQuizController.java` (수정)
- 변경 전: `DomainMasterRepository`, `QuestionBankRepository` 직접 주입 + 비즈니스 로직 인라인 + 내부 record 3개 선언
- 변경 후: `UserQuizService`만 주입. 핸들러 3개는 service 위임만 수행. 내부 record 삭제, import를 dto 패키지로 갱신. `@RequestMapping`/경로/파라미터/반환 타입 무변경.
- 이유: 컨트롤러를 얇은 레이어로 정리

### 복원 방법
이 ID(HIST-20260614-001)만으로 복원 시:
1. `dto/response/QuizQuestionView.java`, `dto/request/CheckRequest.java`, `dto/response/CheckResult.java`, `service/UserQuizService.java` 삭제
2. `UserQuizController.java`를 변경 전 상태로 복원 — `DomainMasterRepository`, `QuestionBankRepository` 직접 주입, 비즈니스 로직 핸들러 인라인, 내부 record 3개(`QuizQuestionView`, `CheckRequest`, `CheckResult`) 클래스 내부 선언

---

## HIST-20260613-001

- **날짜**: 2026-06-13
- **수정 범위**: 사용자 백엔드 / 데일리 퀴즈
- **수정 개요**: `QuizQuestionView` record에 `examYear`, `examRound` 필드 추가 — 문항의 연도·회차 정보를 FE로 전달

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/controller/UserQuizController.java` | 수정 | `QuizQuestionView` record에 `Integer examYear`, `Integer examRound` 추가 및 `from()` 매핑 추가 |

### 수정 상세

#### `UserQuizController.java` — `QuizQuestionView`
- 변경 전:
  ```java
  public record QuizQuestionView(
          Long id, String content, String questionType,
          List<String> options, String code, String language) {

      public static QuizQuestionView from(QuestionBank qb) {
          return new QuizQuestionView(
                  qb.getId(), qb.getContent(), qb.getQuestionType().name(),
                  qb.getOptions(), qb.getCode(), qb.getLanguage());
      }
  }
  ```
- 변경 후:
  ```java
  public record QuizQuestionView(
          Long id, String content, String questionType,
          List<String> options, String code, String language,
          Integer examYear, Integer examRound) {

      public static QuizQuestionView from(QuestionBank qb) {
          return new QuizQuestionView(
                  qb.getId(), qb.getContent(), qb.getQuestionType().name(),
                  qb.getOptions(), qb.getCode(), qb.getLanguage(),
                  qb.getExamYear(), qb.getExamRound());
      }
  }
  ```
- 이유: `QuestionBank` 엔티티에 `examYear`, `examRound` 필드(nullable)가 있으나 퀴즈 응답 DTO에서 누락되어 FE에 전달되지 않았음. nullable 그대로 `Integer`로 선언.

### 복원 방법
이 ID(HIST-20260613-001)로 복원 시: `QuizQuestionView` record에서 `Integer examYear, Integer examRound` 필드 제거, `from()` 메서드의 마지막 두 인자(`qb.getExamYear(), qb.getExamRound()`) 제거.

---

## HIST-20260501-003

- **날짜**: 2026-05-01
- **수정 범위**: 사용자 백엔드 / 데일리 퀴즈
- **수정 개요**: `findRandomByCategory` 쿼리가 `category_id`만 검색하던 것을 `exam_type_id`도 함께 검색하도록 수정 — 시험 유형 카테고리 선택 시 문제가 표시되지 않던 버그 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/repository/QuestionBankRepository.java` | 수정 | `findRandomByCategory` WHERE절 `category_id = :categoryId` → `(category_id = :categoryId OR exam_type_id = :categoryId)` |

### 수정 상세

#### `QuestionBankRepository.java`
- 변경 전: `WHERE category_id = :categoryId AND del_yn = 'N'`
- 변경 후: `WHERE (category_id = :categoryId OR exam_type_id = :categoryId) AND del_yn = 'N'`
- 이유: 퀴즈 카테고리 페이지에서 "시험 유형" 마스터의 슬레이브를 선택하면 해당 슬레이브 ID가 `categoryId` 파라미터로 전달되는데, `question_bank`에서 시험 유형은 `exam_type_id` 컬럼에 저장된다. 이전 쿼리는 `category_id`만 조회해 시험 유형 기반 문항이 한 건도 반환되지 않았음.

### 복원 방법

이 ID(HIST-20260501-003)만으로 복원 시:
- `findRandomByCategory` 쿼리의 WHERE절을 `category_id = :categoryId AND del_yn = 'N'`으로 되돌림

---

## HIST-20260422-007

- **날짜**: 2026-04-22
- **수정 범위**: 사용자 백엔드 / 데일리 퀴즈
- **수정 개요**: `/api/user/quiz/categories` 카테고리 없을 때 500 오류 수정 (LazyInitializationException)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../controller/UserQuizController.java` | 수정 | `findAll()` → `findAllWithSlaves()` 로 변경 |

### 수정 상세

#### `UserQuizController.java`
- 변경 전: `domainMasterRepository.findAll().stream()`
- 변경 후: `domainMasterRepository.findAllWithSlaves().stream()`
- 이유: `findAll()`은 `slaves`를 지연 로딩(lazy)으로 가져오는데, 레포지토리 호출 후 JPA 세션이 닫혀 `getSlaves()` 호출 시 `LazyInitializationException` → 500 발생. 이미 존재하는 `findAllWithSlaves()`(LEFT JOIN FETCH)를 사용해 세션 내에서 슬레이브까지 한 번에 로드.

### 복원 방법

`UserQuizController.java` 의 `findAllWithSlaves()` 를 `findAll()` 로 되돌린다.

---

## HIST-20260422-005

- **날짜**: 2026-04-22
- **수정 범위**: 사용자 백엔드 / 데일리 퀴즈
- **수정 개요**: 퀴즈 카테고리 목록 API가 전체 DomainMaster를 반환하던 것을 "문제 유형", "시험 유형"만 반환하도록 필터 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/controller/UserQuizController.java` | 수정 | `getCategories()`에 name 기반 필터 추가 |

### 수정 상세

#### `UserQuizController.java`
- 변경 전: `domainMasterRepository.findAll()` 전체 반환
- 변경 후: `List.of("문제 유형", "시험 유형")`에 해당하는 마스터만 stream filter 후 반환
- 이유: 관리자가 시험 분류 등 다른 목적으로 DomainMaster를 추가해도 퀴즈 화면에 노출되지 않도록 분리

### 복원 방법

HIST-20260422-005 복원 시:
- `UserQuizController.getCategories()`에서 `filter(m -> quizMasterNames.contains(m.getName()))` 라인과 `quizMasterNames` 변수 제거

---

## HIST-20260421-022

- **날짜**: 2026-04-21
- **수정 범위**: 사용자 백엔드 / 시험 응시 API
- **수정 개요**: `UserExaminationController.QuestionView`에 `code`·`language` 필드 추가 — 코드 문항의 코드 본문이 응시 화면에 전달되도록 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/main/java/.../controller/UserExaminationController.java | 수정 | QuestionView record에 code, language 추가 |

### 수정 상세

#### `UserExaminationController.QuestionView`
- 변경 전: `record QuestionView(Long id, int seq, String content, String questionType, List<String> options)`
- 변경 후: `record QuestionView(Long id, int seq, String content, String questionType, List<String> options, String code, String language)`

### 복원 방법

HIST-20260421-022 복원 시:
- `QuestionView` record에서 `code`, `language` 필드 제거

---

## HIST-20260421-019

- **날짜**: 2026-04-21
- **수정 범위**: 사용자 백엔드 / 시험 응시 API
- **수정 개요**: 사용자용 시험(Examination) 목록·상세·제출 API 신규 추가 (`/api/user/examinations`), `ExaminationRepository`에 단건 페치 조인 쿼리 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/main/java/.../controller/UserExaminationController.java | 추가 | GET 목록·상세, POST 제출 3개 엔드포인트 |
| src/main/java/.../repository/ExaminationRepository.java | 수정 | `findByIdWithPaper` 페치 조인 쿼리 추가 |

### 수정 상세

#### `UserExaminationController.java` (신규)
- 변경 전: 파일 없음
- 변경 후:
  - `GET /api/user/examinations` — `findAllWithDetails` 페이지 목록 반환
  - `GET /api/user/examinations/{id}` — `findByIdWithPaper` 조회 후 시험지 문항(RANDOM이면 shuffle) 포함한 `ExaminationDetailView` 반환
  - `POST /api/user/examinations/{id}/submit` — 시험지 문항 채점 후 `SubmitResult(total, correct, score)` 반환
  - 내부 레코드: `ExaminationDetailView`, `QuestionView`, `SubmitResult`

#### `ExaminationRepository.java`
- 변경 전: `findAllWithDetails` 쿼리만 존재
- 변경 후: `findByIdWithPaper` — examPaper·category 페치 조인 단건 조회 쿼리 추가

### 복원 방법

HIST-20260421-019 복원 시:
- `UserExaminationController.java` 삭제
- `ExaminationRepository.java`에서 `findByIdWithPaper` 메서드 제거

---

## HIST-20260420-008

- **날짜**: 2026-04-20
- **수정 범위**: 사용자 백엔드 / 데일리 퀴즈 + 시험 응시
- **수정 개요**: 데일리 퀴즈 API (카테고리 목록·랜덤 문항·단건 채점) 및 시험 제출·채점 API 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| controller/UserQuizController.java | 추가 | 퀴즈 카테고리 조회, 랜덤 문항, 단건 채점 |
| controller/UserExamController.java | 수정 | POST /{id}/submit — 시험 제출·채점 엔드포인트 추가 |
| repository/QuestionBankRepository.java | 수정 | findRandomByCategory() 네이티브 쿼리 추가 |

### API 엔드포인트 (신규)

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/user/quiz/categories` | 도메인 마스터 전체 (카테고리 선택용) |
| GET | `/api/user/quiz/questions?categoryId={id}&limit={n}` | 카테고리별 랜덤 문항 (최대 30개) |
| POST | `/api/user/quiz/check` | `{ questionId, userAnswer }` → 정오 판정 |
| POST | `/api/user/exams/{id}/submit` | `{ questionId: userAnswer }` map → score 반환 |

### 복원 방법

HIST-20260420-008 복원 시:
- UserQuizController.java 삭제
- UserExamController.java에서 submitExam 메서드 및 SubmitResult record 제거, QuestionRepository 의존 제거
- QuestionBankRepository.java에서 findRandomByCategory 제거
