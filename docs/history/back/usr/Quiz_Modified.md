## HIST-20260715-002

- **날짜**: 2026-07-15
- **수정 범위**: 사용자 백엔드 / 퀴즈·시험 채점 공통 (SHORT_ANSWER·SCHEDULING·SQL·options 다중값)
- **수정 개요**: 정답이 콤마·슬래시 없이 번호 매김("1. FCFS 2. SJF 3. SRT")으로만 나열된 경우 사용자가 콤마로 구분해 입력해도 오답 처리되던 버그 수정 — 열거 마커를 구분자로 인식하는 헬퍼 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/support/AnswerGrader.java` | 수정 | 열거 마커→구분자 치환 헬퍼 `enumerationToSeparators` 추가, `tokenize`/`tokenizeOrdered`에 적용, 클래스 Javadoc 갱신 |

### 수정 상세

#### `AnswerGrader.java`
- 변경 전: `tokenize`(SHORT_ANSWER 등 Set 비교)와 `tokenizeOrdered`(options 순서 비교)가 `raw.split("[,/]")`로만 토큰을 분리. 정답이 "1. FCFS 2. SJF 3. SRT 4. RR 5. HRN"처럼 콤마·슬래시 없이 번호 매김으로만 나열되면 통째로 1개 토큰이 되어, 사용자가 "FCFS, SJF, SRT, RR, HRN"처럼 콤마로 구분해 정답을 입력해도 토큰 수 불일치(또는 Set 불일치)로 오답 처리됨. 느슨 폴백(`normalizeLoose`)도 열거 번호의 마침표를 소수점과 구분하지 않고 그대로 보존해 실패.
- 변경 후:
  1. `tokenizeOrdered` 메서드 바로 위에 `enumerationToSeparators(String raw)` 헬퍼 추가 — 정규식 `(^|\s)\d{1,2}[.)]\s+` → `$1/` 로, 문자열 선두 또는 공백 뒤에 오는 1~2자리 숫자+`.`/`)`+공백 1개 이상(열거 마커)을 슬래시 구분자로 치환. 소수점(`3.14`, `11.75`)이나 마커 뒤 공백이 없는 경우는 조건에 해당하지 않아 영향받지 않음.
  2. `tokenize(String raw)` — `raw.split("[,/]")` → `enumerationToSeparators(raw).split("[,/]")` 로 변경(SHORT_ANSWER·SCHEDULING·SQL Set 비교 토크나이저).
  3. `tokenizeOrdered(String raw)` — 동일하게 `enumerationToSeparators(raw).split("[,/]")` 로 변경(options 빈칸 순서 비교 토크나이저). 기존 `normalizeOptionToken`의 열거 접두 제거 로직과 중복돼도 결과는 동일하므로 회귀 없음.
  4. 클래스 상단 Javadoc의 SHORT_ANSWER 다중정답 설명 단락에 "콤마·슬래시가 없어도 번호 매김 열거는 항목 구분자로 인식한다(소수점은 영향 없음)" 취지 문장 추가.
- 이유: 열거형 정답(알고리즘 목록 등)을 관리자가 번호 매김 형식으로 등록한 경우, 사용자가 자연스러운 콤마 구분으로 답을 입력해도 오답 처리되는 채점 버그 수정.

### 복원 방법

이 ID(HIST-20260715-002)만으로 복원 시 `AnswerGrader.java`에서:
- `enumerationToSeparators(String raw)` 헬퍼 메서드를 삭제한다.
- `tokenize(String raw)`의 `enumerationToSeparators(raw).split("[,/]")`를 `raw.split("[,/]")`로 되돌린다.
- `tokenizeOrdered(String raw)`의 `enumerationToSeparators(raw).split("[,/]")`를 `raw.split("[,/]")`로 되돌린다.
- 클래스 Javadoc의 SHORT_ANSWER 다중정답 설명 단락에서 번호 매김 열거 관련 추가 문장을 제거한다.

## HIST-20260715-001

- **날짜**: 2026-07-15
- **수정 범위**: 사용자 백엔드 / 퀴즈·시험 채점 공통 (CODE 유형)
- **수정 개요**: CODE(코드 트레이싱) 채점 시 딕셔너리·리스트 출력의 콜론·콤마 뒤 공백 유무 차이로 오답 처리되던 버그 수정 — 엄격 비교 실패 시 구조 구분자 주변 가로 공백만 무시하는 느슨 폴백 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/support/AnswerGrader.java` | 수정 | CODE 유형 채점에 느슨 폴백 비교(`normalizeCodeLoose`) 추가, 클래스 Javadoc 갱신 |

### 수정 상세

#### `AnswerGrader.java`
- 변경 전: `isCorrectSingle`의 CODE 분기가 `normalizeCode(correctAnswer).equalsIgnoreCase(normalizeCode(userAnswer))` 한 번만 비교. `normalizeCode`는 줄 내부 공백(들여쓰기)을 보존하므로, 정답 `{2: 1, 4: 3, 5: 5}`와 사용자 답안 `{2:1, 4:3, 5:5}`처럼 콜론·콤마 뒤 공백 유무만 다른 경우 오답 처리됨.
- 변경 후:
  1. `isCorrectSingle`의 CODE 분기 — `normalizeCode` 엄격 비교가 실패하면, 신규 헬퍼 `normalizeCodeLoose(correctAnswer).equalsIgnoreCase(normalizeCodeLoose(userAnswer))`로 느슨 폴백 비교를 추가 수행.
  2. `normalizeCode(String)` 메서드 바로 아래에 `normalizeCodeLoose(String)` 헬퍼 추가 — `normalizeCode` 결과에서 구조 구분자(`: , ; { } [ ] ( )`) 주변의 가로 공백(스페이스·탭)만 정규식 `[ \t]*([:,;{}\[\]()])[ \t]*` → `$1`로 제거. `\s`가 아닌 `[ \t]`를 사용해 줄바꿈은 소비하지 않으므로 줄 구조·들여쓰기는 그대로 검사됨.
  3. 클래스 상단 Javadoc의 CODE 설명 단락에 느슨 폴백 적용 취지 한 문장 추가.
- 이유: 코드 트레이싱 CODE 유형 문항에서 딕셔너리/리스트 출력값의 공백 표기 차이만으로 정답이 오답 처리되는 버그 수정. 줄바꿈은 보존하므로 줄 구조가 다른 경우(예: 값 자체가 다른 줄에 있음)는 여전히 오답으로 정확히 판정됨.

### 복원 방법

이 ID(HIST-20260715-001)만으로 복원 시 `AnswerGrader.java`에서:
- `isCorrectSingle`의 CODE 분기를 `return normalizeCode(correctAnswer).equalsIgnoreCase(normalizeCode(userAnswer));` 단일 반환문으로 되돌린다.
- `normalizeCodeLoose(String)` 헬퍼 메서드를 삭제한다.
- 클래스 Javadoc의 CODE 설명 단락에서 느슨 폴백 관련 추가 문장을 제거한다.

## HIST-20260511-006

- **날짜**: 2026-05-11
- **수정 범위**: 사용자 백엔드 / 데일리 퀴즈
- **수정 개요**: `/api/user/quiz/categories` — `examTypeIds` 파라미터로 실제 문항 있는 문제 유형만 필터링 반환

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../repository/QuestionBankRepository.java` | 수정 | `findDistinctCategoryIdsByExamTypeIds` JPQL 쿼리 추가 |
| `backend/.../controller/UserQuizController.java` | 수정 | `getCategories`에 `examTypeIds` 파라미터 추가 + QUESTION_TYPE 슬레이브 필터링 |

### 수정 상세

#### `QuestionBankRepository.java`
- 신규 메서드 추가:
  ```java
  @Query("SELECT DISTINCT qb.category.id FROM QuestionBank qb WHERE qb.examType.id IN :examTypeIds AND qb.delYn = 'N' AND qb.category IS NOT NULL")
  List<Long> findDistinctCategoryIdsByExamTypeIds(@Param("examTypeIds") List<Long> examTypeIds);
  ```
- 용도: 주어진 시험 유형 ID 목록에 실제 문항이 존재하는 문제 유형(category) ID 집합 조회

#### `UserQuizController.java`
- `getCategories()` → `getCategories(@RequestParam(required=false) String examTypeIds)`
- `examTypeIds` 파라미터가 없으면 기존과 동일하게 전체 QUESTION_TYPE 슬레이브 반환
- `examTypeIds` 파라미터 있으면:
  1. 쉼표 구분 문자열을 `List<Long>`으로 파싱
  2. `findDistinctCategoryIdsByExamTypeIds` 호출 → 허용 category ID Set 구성
  3. QUESTION_TYPE 마스터의 슬레이브를 해당 Set으로 필터링 후 `DomainMasterResponse` 구성

### 복원 방법

HIST-20260511-006 복원 시:
- `QuestionBankRepository`에서 `findDistinctCategoryIdsByExamTypeIds` 메서드 삭제
- `UserQuizController.getCategories`를 파라미터·필터링 로직 없는 원래 형태로 복원:
  ```java
  public ResponseEntity<ApiResponse<List<DomainMasterResponse>>> getCategories() {
      List<String> quizMasterNames = List.of("문제 유형", "시험 유형");
      List<DomainMasterResponse> masters = domainMasterRepository.findAllWithSlaves().stream()
              .filter(m -> quizMasterNames.contains(m.getName()))
              .map(DomainMasterResponse::from)
              .toList();
      return ResponseEntity.ok(ApiResponse.success(masters));
  }
  ```
- import 중 `Arrays`, `HashSet`, `Set`, `Collectors`, `DomainSlaveResponse`, `DomainMaster` 제거
