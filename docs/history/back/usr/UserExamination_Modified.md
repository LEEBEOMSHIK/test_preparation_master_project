## HIST-20260720-001

- **날짜**: 2026-07-20
- **수정 범위**: 콘텐츠 데이터 / "2026년 1회 정보처리기사 실기 (AI 커스텀)" 시험 신규 생성
- **수정 개요**: 저작권 문제로 서비스에 활용하기 어려운 2026년 1회 기출 20문항을, 동일 개념만 유지하고 코드 로직·문제 구성·값을 모두 새로 설계한 AI 커스텀 20문항으로 재구성해 신규 시험(`exams`, order_no 6, 제목 "2026년 1회 정보처리기사 실기 (AI 커스텀)")으로 등록했다. **특히 CODE 7문항은 원본 코드 골격을 재사용하지 않고 전혀 다른 코드로 같은 개념을 검증**한다(값만 바꾼 초안을 폐기하고 재작성). CODE 실행 결과 정답은 직접 계산·검증했고, 단답 13문항은 기존 채점 규칙(콤마/슬래시 다중값·열거 마커·괄호 대체표기·`||` 대체정답)에 맞춰 작성했다. 기존 데이터(question_bank·exams id 5)는 일절 건드리지 않았다. (재적용 시 IDENTITY로 exam id가 달라질 수 있어 제목으로 식별.)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `docs/db-migration/20260720_01_ai_custom_exam_2026_r1.sql` | 신규 | exams 1행 + questions 20행 삽입. 동일 제목 시험/문항 존재 시 미삽입(재실행 안전), id는 IDENTITY 자동 생성 |
| (로컬 tpmp-db) | 데이터 | 위 마이그레이션 적용(exams 1건 + questions 20건) |

### 복원 방법
이 ID(HIST-20260720-001)만으로 복원 시, exams의 해당 제목 행과 그 exam_id의 questions 20행을 삭제한다(또는 del_yn='Y'). 기존 5개 시험·question_bank에는 영향 없음.

## HIST-20260718-002

- **날짜**: 2026-07-18
- **수정 범위**: 콘텐츠 데이터 / 2025년 1회 7번(SQL 조인 실행 결과) 문항을 SQL 결과표 유형으로 전환
- **수정 개요**: SHORT_ANSWER로 등록돼 한 줄 텍스트로만 답할 수 있던 SQL 실행결과 문항을 `question_type=SQL` + `sql_data`(tables `emp`·`sal` + `expectedResult` 컬럼 [name, incentives]·정답 행 [이순신, 1000], `orderedRows=false`)로 전환했다. 이제 시험/퀴즈 풀이에서 `SqlResultAnswerInput` 컬럼×행 격자로 입력하고, 채점은 `AnswerGrader.isSqlResultTableCorrect`(행 순서 무시 다중집합 비교)로 라우팅된다. content의 문제 표 이미지는 제거하고 query만 남겨, 표는 `SqlProblemView`가 구조화 렌더한다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `docs/db-migration/20260718_03_q7_sql_result_table.sql` | 신규 | question_bank(id 67)·questions(id 27 스냅샷)를 고유 이미지 UUID로 매칭해 SQL 유형+sql_data로 전환. `question_type='SHORT_ANSWER'` 가드로 재실행 안전 |
| (로컬 tpmp-db) | 데이터 | 위 마이그레이션 적용(question_bank·questions 각 1건 UPDATE) |

### 복원 방법
이 ID(HIST-20260718-002)만으로 복원 시, 해당 두 행을 다시 `question_type='SHORT_ANSWER'`로 되돌리고 `sql_data=NULL`, content를 원래 이미지+query HTML로, answer를 `name=이순신 / incentives=1000`으로 복구한다(콘텐츠 덤프 재적재 권장). 마이그레이션 파일은 삭제한다.

## HIST-20260718-001

- **날짜**: 2026-07-18
- **수정 범위**: 사용자 백엔드 / 시험 결과 복습 표시 원본 ID 스냅샷
- **수정 개요**: 시험 제출 결과와 과거 이력에 nullable `questionBankId`를 제공하고, 제출 시점 원본 문제은행 ID를 FK 없이 이력 상세에 보존한다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `backend/src/main/java/com/tpmp/testprep/entity/Question.java` | 수정 | 원본 문제은행 ID null-safe 접근자 추가 |
| `backend/src/main/java/com/tpmp/testprep/entity/ExamHistoryDetail.java` | 수정 | `question_bank_id` nullable 스냅샷 매핑 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuestionResultResponse.java` | 수정 | 제출 직후·이력 결과에 `questionBankId` 응답 |
| `backend/src/main/java/com/tpmp/testprep/service/UserExaminationService.java` | 수정 | 제출 시 원본 문제은행 ID 저장 |
| `backend/src/test/java/com/tpmp/testprep/service/UserExaminationSessionLifecycleTest.java` | 수정 | 원본 있음/없음·이력·저장 회귀 테스트 |
| `docs/db-migration/20260718_01_add_exam_history_question_bank_id.sql` | 추가 | 컬럼 추가·NULL 한정 보강·검증·롤백 SQL |
| `docs/db-guidelines.md` | 수정 | 이력 상세 스냅샷 컬럼 문서화 |

### 수정 상세

- `questionId`는 시험지 문항 ID이므로 문제은행 ID로 추정하지 않고, `Question.sourceQuestionBank.id`를 별도 필드로 전달한다.
- 과거 데이터는 `exam_history_details.question_id → questions.source_question_bank_id`로 연결되는 NULL 행만 보강하며, 이후 원본 삭제·변경과 무관하게 제출 시점 값을 유지하도록 FK를 두지 않는다.
- 마이그레이션 검증에서 보강 가능한 NULL 행이 하나라도 남으면 `RAISE EXCEPTION`으로 트랜잭션 전체를 롤백한다.
- 원본 연결이 없는 수동 문항과 보강할 수 없는 기존 이력은 `questionBankId = null`로 정상 응답한다.

---

## HIST-20260717-004

- **날짜**: 2026-07-17
- **수정 범위**: 사용자 백엔드 / 시험 결과 제목 스냅샷·주관식 재채점
- **수정 개요**: 제출 결과와 과거 이력에 원본 문항 제목을 보존하고, 2025년 2회 Q11·Q19·Q20의 유효 답안을 엄격한 정규화와 명시적 대체 정답으로 채점·보정한다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `backend/src/main/java/com/tpmp/testprep/entity/ExamHistoryDetail.java` 외 | 수정 | nullable 제목 스냅샷과 결과 DTO 전달 |
| `backend/src/main/java/com/tpmp/testprep/service/support/AnswerGrader.java` | 수정 | 구분자 직후 마커·영문 단어 dash 정규화와 느슨 비교 오탐 제한 |
| `backend/src/test/java/com/tpmp/testprep/service/UserExaminationSessionLifecycleTest.java` 외 | 수정 | 즉시/과거 제목과 Q11·Q19·Q20 회귀 테스트 |
| `docs/db-migration/20260717_04_add_exam_history_detail_title.sql` | 추가 | 제목 컬럼·기존 이력 백필 |
| `docs/db-migration/20260717_05_regrade_2025_round2_q11_q19_q20.sql` | 추가 | Q11 정답 데이터 및 Q11·Q19·Q20 이력 제한 재채점 |

### 수정 상세

- `Question#getResultTitle()`을 즉시 응답과 이력 builder가 함께 사용하며 제출 쿼리가 원본을 fetch한다.
- Q11은 올바른 두 분기 경로를 첫 canonical 후보로 두고 기존 콤마·파이프 표기를 `||` 대체답으로 한정 인정한다. 단일 `|` 그룹과 콤마로 나열한 숫자-하이픈 경로는 그룹/경로 수·순서와 내부 노드 순서를 모두 보존해 중복 노드 제거로 인한 부분 경로 오탐을 차단한다.
- Q19는 영문자 사이 dash만 공백과 동치로, Q20은 숫자 열거 마커·공백 차이만 동치로 처리한다. `1.TTL` 같은 무공백 마커는 허용하지만 다음 문자가 숫자인 `11.75`는 마커로 보지 않으며, 숫자/수식 하이픈과 무구분 영문도 보존한다.
- 재채점 SQL은 `EXAM_TYPE` 도메인의 `정보처리기사 실기` 연결과 연도·회차·문항번호로 식별하며 Q11/Q19/Q20 원본이 각각 정확히 1개인지 검증한다. 이후 대상 상한과 범위 외 변경을 확인하고 영향 이력의 정답 수·점수를 상세 합계로 재계산한다.

---

## HIST-20260717-003

- **날짜**: 2026-07-17
- **수정 범위**: 사용자 백엔드 / 구조화 시험 문항 응시·채점·이력
- **수정 개요**: SCHEDULING·SQL 데이터를 응시 응답과 제출 이력에 보존하고, SQL 기대 결과 문항을 결과 테이블 채점기로 판정한다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `backend/src/main/java/com/tpmp/testprep/dto/response/ExaminationQuestionView.java` 외 | 수정 | 응시 시 SQL 정답 제거·결과 컬럼 제공, 제출 후 전체 구조 반환 |
| `backend/src/main/java/com/tpmp/testprep/service/UserExaminationService.java` | 수정 | SQL 결과 테이블 채점과 구조화 이력 저장 |
| `backend/src/main/java/com/tpmp/testprep/entity/ExamHistoryDetail.java` | 수정 | JSONB 스냅샷·TEXT 답안 저장 |
| `backend/src/test/java/com/tpmp/testprep/service/UserExaminationSessionLifecycleTest.java` | 수정 | SQL 채점·구조화 결과 회귀 테스트 |

### 수정 상세

- 응시 전에는 sqlData.expectedResult를 제거하고 입력 그리드 생성용 컬럼만 노출한다. 제출 후에는 정답·해설과 함께 구조화 문제를 재현한다.
- 이유: 정답 유출 없이 SQL 결과형 문항을 실제 시험에서도 채점하고 과거 결과를 보존하기 위함.

---

## HIST-20260717-002

- **날짜**: 2026-07-17
- **수정 범위**: 사용자 백엔드 / 시험 응시·결과 — 발문 제출 이력 스냅샷
- **수정 개요**: 시험 상세·제출 결과 응답에 Question instruction을 포함하고, 제출 시 `exam_history_details.instruction`에 저장해 원본/시험지 변경 후에도 과거 이력 발문을 유지한다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `backend/src/main/java/com/tpmp/testprep/entity/ExamHistoryDetail.java` | 수정 | instruction 스냅샷 컬럼 매핑 |
| `backend/src/main/java/com/tpmp/testprep/service/UserExaminationService.java` | 수정 | 제출 시 발문 스냅샷 저장 |
| `backend/src/test/java/com/tpmp/testprep/service/UserExaminationSessionLifecycleTest.java` | 추가 | 시험 시작 시 Exam 행 잠금 순서와 제출 성공 시 세션 삭제 검증 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/ExaminationQuestionView.java` | 수정 | 응시 상세 발문 응답 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuestionResultResponse.java` | 수정 | 제출/이력 결과 발문 응답 |

### 수정 상세

- 변경 전: 이력 상세에는 content·정답·해설만 저장되어 발문을 재현할 수 없었다.
- 변경 후: 제출 시점 instruction을 별도 TEXT 스냅샷으로 저장하고 현재 응시/과거 결과 응답에 포함한다. 시험 시작은 시험지 Exam 행을 잠근 뒤 세션을 조회/생성하고, 제출 이력 저장 성공 시 같은 트랜잭션에서 해당 응시 세션을 삭제한다.
- 이유: 시험지 동기화 이후에도 이미 제출된 결과의 문맥을 불변으로 보존하기 위함.

### 복원 방법

이 ID(`UserExamination_Modified.md` 기준 HIST-20260717-002)로 복원 시 instruction 응답·저장 매핑과 DDL 컬럼을 제거한다.

---

## HIST-20260717-001

- **날짜**: 2026-07-17
- **수정 범위**: 사용자 백엔드 / 시험·퀴즈 채점 공통(`AnswerGrader`) — 열거 마커 확장 + 괄호 대체 표기 인정
- **수정 개요**: 시험(exam_id=5) 오답 4건이 실제로는 정답인데 오답 처리되는 채점 버그 수정. 원인은 (1) 정답 문자열의 열거 마커 중 숫자(`1.`)만 인식하고 한글 자모(`ㄱ.`)·원문자(`①`)·라틴 문자(`a.`)는 미인식 → 마커가 토큰에 섞여 사용자 답안과 불일치, (2) 정답 값 내부의 `/`(CIDR `…/23`)와 슬래시 구분자 충돌, (3) 약어↔한글 명칭(`ABM`↔`비동기 균형 모드`)은 코드로 판단 불가. (1)(2)는 `AnswerGrader` 코드 수정으로, (3)은 괄호 대체 표기 기능 신설 + 문항 정답 데이터 수정으로 해결.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/support/AnswerGrader.java` | 수정 | `extendedEnumerationToSeparators` 신설(자모·라틴·원문자 마커), 괄호 대체 표기 1:1 완전 매칭(`tokenVariants`+백트래킹), 느슨 폴백에도 마커 제거 적용 |
| `backend/src/test/java/com/tpmp/testprep/service/support/AnswerGraderTest.java` | 수정 | 이미지 사례 4건 재현 테스트 + 회귀 테스트 11건 추가, 기존 실패 테스트 1건(`code_commaSeparatedNotSplit_incorrect`)을 `10b44a5` 정책(구분자 주변 공백 허용)에 맞게 갱신 |
| DB `questions` id=86·90, `question_bank` id=6·10 | 데이터 | HDLC 문항 정답에 `정보 프레임(정보)`·`비동기 균형 모드(ABM)` 등 괄호 대체 표기, 외래키 문항에 `FOREIGN(FOREIGN KEY)` 추가 |
| `docs/sql/tpmp_content_data.sql` | 수정 | 위 데이터 변경을 공유용 덤프에도 동기화(4개 INSERT) |

### 수정 상세

#### 열거 마커 확장 (SHORT_ANSWER·SCHEDULING·SQL 다중값 비교 + 느슨 폴백 전용)
- `ㄱ. `·`a. `(구두점+공백 필수 — `a.b`·`i.e.` 같은 본문 표기는 무영향), `①`~`⑳`(구두점·공백 불필요)을 구분자로 치환.
- 예: 정답 `ㄱ. Bridge / ㄴ. Observer` + 사용자 `Bridge, Observer` → 정답. 정답 `a. 192.168.10.0/23 / b. 192.168.12.0/23` + 사용자 `192.168.10.0/23, 192.168.12.0/23` → 정답(CIDR `/`는 양쪽에서 대칭 분리).
- options 채점(빈칸 순서 비교)은 프론트 `lib/answer.ts`와 규칙 동기화가 필요하므로 기존 숫자 마커만 유지(변경 없음).

#### 괄호 대체 표기 (기존 "괄호 부연 제거" → "상호 인정"으로 의미 변경)
- 정답 토큰 `비동기 균형 모드(ABM)`이면 사용자 입력 `비동기 균형 모드`·`ABM` 모두 인정. Set 동일성 비교를 "토큰별 표기 집합 + 1:1 완전 매칭(백트래킹, 10만 스텝 상한)"으로 재구성 — 괄호 없는 토큰끼리는 기존과 동일 동작.
- 기존에도 정답 측 괄호는 제거되어 본체만 인정됐으므로 이 변경으로 오답이 되는 케이스 없음(인정 범위가 넓어지기만 함).

### 검증 결과
- `.\gradlew.bat test --tests "*.AnswerGraderTest"`: 통과
- `.\gradlew.bat test` (전체): BUILD SUCCESSFUL — 기존 실패 1건(위 테스트 갱신)까지 포함 전부 통과

### 복원 방법
이 ID(HIST-20260717-001)로 복원 시 `AnswerGrader.java`의 `extendedEnumerationToSeparators`·`tokenVariants`·`hasPerfectMatching`을 제거하고 `multiSetMatch`를 Set 동일성 비교(`tokenize`/`normalizeToken`)로 되돌린다. DB 정답은 위 표의 4개 행에서 괄호 표기를 제거한다.

## HIST-20260707-001

- **날짜**: 2026-07-07
- **수정 범위**: 사용자 백엔드 / 시험 채점 — 보기(options) 기반 번호 직접 입력 채점
- **수정 개요**: 문항에 보기(options)가 있으면 유형(questionType)과 무관하게 사용자가 입력한 보기 번호 문자열을 정답과 비교해 채점하는 기능을 시험 제출 채점에도 적용했다. `AnswerGrader`에 4-인자 오버로드 `isCorrect(questionType, correctAnswer, userAnswer, options)`를 신규 추가(상세는 [back/usr/UserQuiz_Modified.md HIST-20260707-002] 참조)했고, `UserExaminationService.submitExam` 내 채점 호출 2곳(점수 집계용 · 문항별 스냅샷 저장용)을 모두 4-인자로 전환해 `q.getOptions()`를 전달한다. 기존 3-인자 메서드는 변경 없어 회귀 없음. 관리자 등록 화면 반영은 [front/adm/AdminQuestion_Modified.md HIST-20260707-002], 사용자 풀이 화면(시험) 반영은 [front/usr/UserQuizExam_Modified.md HIST-20260707-001] 참조.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/support/AnswerGrader.java` | 수정 | 4-인자 오버로드 `isCorrect(type, correct, user, options)` 추가(상세는 UserQuiz_Modified.md 참조) |
| `backend/src/main/java/com/tpmp/testprep/service/UserExaminationService.java` | 수정 | `submitExam`의 채점 호출 2곳을 4-인자로 변경, `q.getOptions()` 전달 |

### 수정 상세

#### `service/UserExaminationService.java`
- 변경 전(점수 집계용):
  ```java
  boolean isCorrect = AnswerGrader.isCorrect(
          q.getQuestionType().name(), q.getAnswer(), userAnswer);
  ```
- 변경 후:
  ```java
  boolean isCorrect = AnswerGrader.isCorrect(
          q.getQuestionType().name(), q.getAnswer(), userAnswer, q.getOptions());
  ```
- 동일한 변경을 문항별 스냅샷(`ExamHistoryDetail`) 저장용 채점 호출에도 적용
- 이유: 시험 문항도 보기 유무에 따라 유형 무관 번호 채점을 적용하기 위함

### 복원 방법
이 ID(HIST-20260707-001)만으로 복원 시: `UserExaminationService.java`의 `submitExam` 내 채점 호출 2곳을 모두 3-인자 `AnswerGrader.isCorrect(q.getQuestionType().name(), q.getAnswer(), userAnswer)`로 되돌린다. `AnswerGrader.java`의 4-인자 오버로드 제거는 [back/usr/UserQuiz_Modified.md HIST-20260707-002]의 복원 방법을 따른다(UserQuizService도 함께 되돌려야 함).

## HIST-20260706-001

- **날짜**: 2026-07-06
- **수정 범위**: 사용자 백엔드 / 시험 채점 (SHORT_ANSWER·SCHEDULING 채점 완화)
- **수정 개요**: `AnswerGrader`의 SHORT_ANSWER·SCHEDULING 토큰 정규화 강화(슬래시 구분자 추가·공백 축약·말미 괄호 부연 제거) 및 정확 일치 실패 시 구분자·괄호·공백을 모두 제거한 느슨 폴백 비교 추가. 시험 제출 채점(`UserExaminationService.submitExam`)이 이 헬퍼를 통해 동일 적용됨. 퀴즈 채점도 공용이며 상세는 [back/usr/UserQuiz_Modified.md HIST-20260706-001] 참조.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/support/AnswerGrader.java` | 수정 | tokenize 정규화 강화(슬래시 구분자·공백 축약·괄호 제거) + 느슨 폴백(`looseEqualsIgnoringPunctuation`) 추가 |
| `backend/src/test/java/com/tpmp/testprep/service/support/AnswerGraderTest.java` | 수정 | 괄호 부연·슬래시 구분·느슨 폴백·오탐 방지 테스트 8건 추가 |

### 수정 상세

#### `service/support/AnswerGrader.java`
- `UserExaminationService.submitExam`은 `AnswerGrader.isCorrect(...)`를 호출하므로 헬퍼 정규화 강화만으로 시험 채점에도 자동 반영됨(시험 서비스 코드 변경 없음)
- 정규화 상세는 [back/usr/UserQuiz_Modified.md HIST-20260706-001] 동일 내용 참조
- 이유: 정답의 괄호 부연 설명·구분자 유무 차이로 발생하는 오채점 해소

### 복원 방법
이 ID(HIST-20260706-001)만으로 복원 시: `AnswerGrader.java`의 `tokenize`를 콤마 단일 분리 + trim + 소문자화만 남기고, `normalizeToken`·`looseEqualsIgnoringPunctuation`·`normalizeLoose` 제거, `isCorrect`의 SHORT_ANSWER·SCHEDULING 분기 폴백 호출 제거(시험 채점 복원과 동일), 테스트 추가 케이스 8건 삭제.

---

## HIST-20260629-002

- **날짜**: 2026-06-29
- **수정 범위**: 사용자 백엔드 / 채점 (CODE 유형 정규화)
- **수정 개요**: `AnswerGrader.isCorrect`에서 CODE 유형을 별도 분기로 분리하고 보수안 정규화(CRLF→LF·줄 끝 공백 제거·앞뒤 빈 줄 제거) 후 `equalsIgnoreCase` 비교. 줄 내부 연속 공백(들여쓰기)은 정답의 일부로 보존. SHORT_ANSWER·MULTIPLE_CHOICE·OX 경로 무변경. 시험 제출 채점(`UserExaminationService.submitExam`)이 이 헬퍼를 통해 동일 적용됨.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/support/AnswerGrader.java` | 수정 | CODE 분기 분리 + `normalizeCode` 정규화 추가 |
| `backend/src/test/java/com/tpmp/testprep/service/support/AnswerGraderTest.java` | 수정 | CODE 정규화 케이스 6개 추가 (기존 17케이스 무변경) |

### 수정 상세

#### `service/support/AnswerGrader.java`
- `isCorrect`: 기존 `// MULTIPLE_CHOICE, OX, CODE 통문자열 비교` 폴스루에서 CODE만 분리 →
  ```java
  if ("CODE".equals(questionType)) {
      return normalizeCode(correctAnswer).equalsIgnoreCase(normalizeCode(userAnswer));
  }
  ```
- `private static String normalizeCode(String s)` 추가 (보수안):
  1. CRLF→LF, 단독 CR→LF
  2. `split("\n", -1)` 후 각 줄 `stripTrailing()`로 줄 끝 공백 제거
  3. 전체 `strip()`으로 앞뒤 빈 줄/공백 제거
  - 줄 내부 연속 공백(들여쓰기)은 건드리지 않음
- 이유: 코드 답안에서 줄 끝 공백·CRLF·앞뒤 빈 줄 차이로 정답이 오답 처리되던 문제 해소. 들여쓰기는 정답의 일부이므로 보존(적극 정규화는 오채점 위험으로 기각)

#### `test/.../AnswerGraderTest.java`
- 추가 케이스 6개: 줄 끝 공백/CRLF/앞뒤 빈 줄 차이 → 정답, 내부 빈 줄 차이·들여쓰기(연속 스페이스) 차이 → 오답, 복합 → 정답

### 복원 방법
이 ID(HIST-20260629-002)만으로 복원 시: `AnswerGrader.java`의 CODE 분기와 `normalizeCode` 메서드를 제거하고 CODE를 다시 MULTIPLE_CHOICE/OX 폴스루(`trim().equalsIgnoreCase`)로 되돌림, `AnswerGraderTest.java`에서 추가한 6개 케이스 삭제.

---

## HIST-20260629-001

- **날짜**: 2026-06-29
- **수정 범위**: 사용자 백엔드 / 시험 채점
- **수정 개요**: `UserExaminationService.submitExam` 두 곳 채점식을 `AnswerGrader.isCorrect`로 교체 — SHORT_ANSWER 복수 정답(콤마 구분) 지원

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/UserExaminationService.java` | 수정 | `submitExam` 내 results 집계·detail 스냅샷 2곳 채점식 교체, import 추가 |

### 수정 상세

#### `service/UserExaminationService.java`
- 변경 전 (results 집계, 구 L124-125):
  ```java
  boolean isCorrect = userAnswer != null && q.getAnswer() != null
          && userAnswer.trim().equalsIgnoreCase(q.getAnswer().trim());
  ```
- 변경 후:
  ```java
  boolean isCorrect = AnswerGrader.isCorrect(
          q.getQuestionType().name(), q.getAnswer(), userAnswer);
  ```
- 변경 전 (detail 스냅샷, 구 L147-148): 동일한 인라인 비교식
- 변경 후: 동일하게 `AnswerGrader.isCorrect` 호출로 교체
- 이유: `AnswerGrader` 공통 헬퍼로 교체하여 SHORT_ANSWER 복수 정답 지원. null 처리(userAnswer=null → false)는 헬퍼 내부에서 동일하게 보장.

### 복원 방법
이 ID(HIST-20260629-001)만으로 복원 시:
1. `UserExaminationService.java` import에서 `import com.tpmp.testprep.service.support.AnswerGrader` 제거
2. results 집계 `AnswerGrader.isCorrect` 호출을 `userAnswer != null && q.getAnswer() != null && userAnswer.trim().equalsIgnoreCase(q.getAnswer().trim())` 로 복원
3. detail 스냅샷 `AnswerGrader.isCorrect` 호출도 동일하게 복원

---

## HIST-20260626-001

- **날짜**: 2026-06-26
- **수정 범위**: 사용자 백엔드 / 시험 응시 횟수(attemptCount) 응답 보강
- **수정 개요**: getLatestResult API 응답에 해당 시험의 총 응시 횟수(attemptCount)를 포함하도록 Repository·DTO·Service 보강

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../repository/ExamHistoryRepository.java` | 수정 | `countByUser_IdAndExamination_Id` 메서드 추가 |
| `backend/.../dto/response/ExamHistoryDetailResponse.java` | 수정 | `attemptCount` 필드 추가(long), `of()` 오버로드 2개로 분리 |
| `backend/.../service/UserExaminationService.java` | 수정 | `getLatestResult`에서 count 조회 후 DTO에 포함 |

### 수정 상세

#### `ExamHistoryRepository.java`
- 변경 전: `countByUser_IdAndExamination_Id` 없음
- 변경 후: `long countByUser_IdAndExamination_Id(Long userId, Long examinationId);` 추가
- 이유: 특정 사용자·시험 조합의 총 응시 횟수를 JPA derived query로 조회

#### `ExamHistoryDetailResponse.java`
- 변경 전: record 6필드(historyId/total/correct/score/takenAt/results), `of(ExamHistory, List<ExamHistoryDetail>)` 단일 팩토리
- 변경 후: `long attemptCount` 필드 추가(7필드), `of(history, details)` → 내부적으로 `attemptCount=1` 위임, `of(history, details, long attemptCount)` 오버로드 추가
- 이유: 기존 회차별 결과 조회(`getHistoryResult`)는 호출 방식 유지(attemptCount=1), 최신 결과 조회만 실제 횟수를 채워 반환

#### `UserExaminationService.java`
- 변경 전: `getLatestResult` → `ExamHistoryDetailResponse.of(history, details)` 4인자(실제론 2인자)
- 변경 후: `long attemptCount = examHistoryRepository.countByUser_IdAndExamination_Id(user.getId(), examinationId);` 추가 → `ExamHistoryDetailResponse.of(history, details, attemptCount)` 3인자 호출
- 이유: 프론트 게이트 화면에 "총 N회 응시" 표기를 지원하기 위해 서버에서 횟수를 집계해 반환

### 영향 범위 확인

| 호출처 | 영향 |
|--------|------|
| `GET /user/examinations/{id}/result` (getLatestResult) | attemptCount 필드 추가 (기존 필드 무변경) |
| `GET /user/examinations/history/{historyId}` (getHistoryResult) | `of(history, details)` 2인자 사용 → attemptCount=1로 자동 설정 (무영향) |
| 프론트 `ExamHistoryDetailResult` 타입 | `attemptCount?: number` optional 추가 — 하위 호환 |

### 복원 방법
이 ID(HIST-20260626-001)만으로 복원 시:
1. `ExamHistoryRepository.java`에서 `countByUser_IdAndExamination_Id` 메서드 제거
2. `ExamHistoryDetailResponse.java`에서 `attemptCount` 필드 제거, `of(history, details, long)` 오버로드 제거, `of(history, details)` 를 직접 생성자 호출로 복원
3. `UserExaminationService.java`에서 `long attemptCount = examHistoryRepository.countByUser_IdAndExamination_Id(...)` 라인 제거, `of()` 호출을 2인자로 복원

---

## HIST-20260623-001

- **날짜**: 2026-06-23
- **수정 범위**: 사용자 백엔드 / 시험 응시 제한시간 타이머 보강 (서버 시작시각 기록)
- **수정 개요**: ExamSession 엔티티를 신설해 응시 시작시각을 서버에 영속화하고, POST /{id}/start API로 서버 기준 남은 시간을 반환함. 재응시(reset=true) 시 세션 교체 지원.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../entity/ExamSession.java` | 추가 | 응시 세션 엔티티 (exam_session 테이블, user+examination unique) |
| `backend/.../repository/ExamSessionRepository.java` | 추가 | ExamSession JPA Repository (findBy, deleteBy JPQL) |
| `backend/.../dto/response/ExamSessionResponse.java` | 추가 | 세션 응답 record (examinationId, startedAt, remainingSeconds) |
| `backend/.../service/UserExaminationService.java` | 수정 | startExam() 메서드 추가, ExamSessionRepository 의존성 추가, Duration import 추가 |
| `backend/.../controller/UserExaminationController.java` | 수정 | POST /{id}/start 엔드포인트 추가, ExamSessionResponse import 추가 |

### 수정 상세

#### `ExamSession.java` (신규)
- 변경 전: 존재하지 않음
- 변경 후: `@Entity @Table(name="exam_session")`, idx_exam_session_user_exam unique 인덱스. 필드: id(IDENTITY), user(ManyToOne LAZY), examination(ManyToOne LAZY), startedAt(nullable=false, updatable=false). `@PrePersist`로 startedAt 자동 세팅. Lombok @Getter @NoArgsConstructor(PROTECTED) @Builder.
- 이유: 서버 기준 응시 시작 시각 영속화

#### `ExamSessionRepository.java` (신규)
- 변경 전: 존재하지 않음
- 변경 후: `findByUser_IdAndExamination_Id`, `deleteByUser_IdAndExamination_Id(@Modifying JPQL)`
- 이유: 세션 조회·삭제(재응시)

#### `ExamSessionResponse.java` (신규)
- 변경 전: 존재하지 않음
- 변경 후: `record(Long examinationId, LocalDateTime startedAt, int remainingSeconds)` + `static of(ExamSession, int)`
- 이유: 세션 시작 응답 DTO

#### `UserExaminationService.java`
- 변경 전: ExamSessionRepository 없음, startExam 없음
- 변경 후: `ExamSessionRepository examSessionRepository` final 필드 추가; `startExam(Long examinationId, String email, boolean reset)` 추가 — Examination/User 조회, reset 시 세션 삭제, 세션 조회/생성, remainingSeconds 계산(Math.max(0, timeLimit*60 - Duration.between.getSeconds()))
- 이유: 서버 기준 남은 시간 계산 로직

#### `UserExaminationController.java`
- 변경 전: /{id}/start 없음
- 변경 후: `@PostMapping("/{id}/start")` — `@PathVariable Long id`, `@RequestParam(defaultValue="false") boolean reset`, `@AuthenticationPrincipal String email` → `ApiResponse.success(service.startExam(...))`
- 이유: 세션 시작 API 노출

### 복원 방법
이 ID(HIST-20260623-001)만으로 복원 시:
1. `ExamSession.java` 삭제
2. `ExamSessionRepository.java` 삭제
3. `ExamSessionResponse.java` 삭제
4. `UserExaminationService.java`에서 `examSessionRepository` 필드, `startExam()` 메서드, Duration/LocalDateTime import 제거
5. `UserExaminationController.java`에서 `POST /{id}/start` 핸들러 및 ExamSessionResponse import 제거

---

## HIST-20260614-001

- **날짜**: 2026-06-14
- **수정 범위**: 사용자 백엔드 / 시험 결과 문항별 상세 영속화
- **수정 개요**: 시험 제출 시 점수(ExamHistory)만 저장하던 것을 문항별 답안 스냅샷(ExamHistoryDetail)까지 저장하고, GET /{id}/result 엔드포인트로 재조회 가능하게 구현

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../entity/ExamHistoryDetail.java` | 추가 | 문항별 스냅샷 엔티티 신설 (exam_history_details 테이블) |
| `backend/.../entity/ExamHistory.java` | 수정 | details OneToMany 컬렉션 + addDetail() 편의 메서드 추가 |
| `backend/.../repository/ExamHistoryDetailRepository.java` | 추가 | ExamHistoryDetail JPA Repository 신설 |
| `backend/.../repository/ExamHistoryRepository.java` | 수정 | findTopByUser_IdAndExamination_IdOrderByTakenAtDesc 메서드 추가 |
| `backend/.../exception/ErrorCode.java` | 수정 | EXAM_HISTORY_NOT_FOUND 에러 코드 추가 |
| `backend/.../dto/response/ExamHistoryDetailResponse.java` | 추가 | 재조회 응답 DTO (historyId·total·correct·score·takenAt·results) |
| `backend/.../dto/response/QuestionResultResponse.java` | 수정 | code·language 필드 추가 + ExamHistoryDetail 기반 of() 오버로드 추가 |
| `backend/.../dto/response/ExaminationSubmitResponse.java` | 수정 | historyId 필드 추가, of() 팩토리 시그니처 갱신 |
| `backend/.../service/UserExaminationService.java` | 수정 | submitExam — 문항별 ExamHistoryDetail 저장 추가; getLatestResult 신규 메서드 추가 |
| `backend/.../controller/UserExaminationController.java` | 수정 | GET /{id}/result 핸들러 추가 |

### 수정 상세

#### `ExamHistoryDetail.java` (신규)
- 변경 전: 존재하지 않음
- 변경 후: `@Entity @Table(name="exam_history_details")`, ExamHistory ManyToOne(LAZY), questionId(Long nullable), seq/content/questionType/options(jsonb)/userAnswer/correctAnswer/correct/explanation/code/language 필드, `setExamHistory()` 패키지 가시성 메서드
- 이유: 문항별 결과를 영속화하여 재조회 지원

#### `ExamHistory.java`
- 변경 전: details 필드 없음
- 변경 후: `@OneToMany(mappedBy="examHistory", cascade=ALL, orphanRemoval=true) List<ExamHistoryDetail> details` + `addDetail()` 편의 메서드 추가
- 이유: cascade 저장 + 양방향 연관 관리

#### `ExamHistoryDetailRepository.java` (신규)
- 변경 전: 존재하지 않음
- 변경 후: `JpaRepository<ExamHistoryDetail, Long>` + `findByExamHistory_IdOrderBySeqAsc(Long)`
- 이유: 문항별 스냅샷 seq 순 조회

#### `ExamHistoryRepository.java`
- 변경 전: `findTopByUser_IdAndExamination_IdOrderByTakenAtDesc` 없음
- 변경 후: 해당 메서드 추가 (`Optional<ExamHistory>` 반환)
- 이유: 본인·시험 기준 최신 이력 단건 조회

#### `ErrorCode.java`
- 변경 전: `EXAM_HISTORY_NOT_FOUND` 없음
- 변경 후: Exam 구역에 `EXAM_HISTORY_NOT_FOUND(HttpStatus.NOT_FOUND, "시험 응시 이력을 찾을 수 없습니다.")` 추가
- 이유: getLatestResult 미응시 케이스 예외 처리

#### `ExamHistoryDetailResponse.java` (신규)
- 변경 전: 존재하지 않음
- 변경 후: record 6필드 + `of(ExamHistory, List<ExamHistoryDetail>)` 정적 팩토리
- 이유: 재조회 전용 응답 DTO

#### `QuestionResultResponse.java`
- 변경 전: record 9필드(questionId~explanation), `of(Question, String, boolean)` 팩토리 1개
- 변경 후: code·language 2필드 추가(총 11필드), `of(ExamHistoryDetail)` 오버로드 추가
- 이유: 스냅샷 기반 재조회 지원 + code/language 응답 포함

#### `ExaminationSubmitResponse.java`
- 변경 전: 4필드(total/correct/score/results), `of()` 4인자
- 변경 후: `Long historyId` 필드 추가(5필드), `of()` 5인자
- 이유: 제출 직후 프론트에 historyId 전달(결과 재조회 준비)

#### `UserExaminationService.java`
- 변경 전: `submitExam`이 ExamHistory만 저장, `ExaminationSubmitResponse.of(total,correct,score,results)` 4인자
- 변경 후: ExamHistoryDetail 스냅샷 루프 추가 → `history.addDetail(detail)` → cascade 저장. `of()` 5인자(historyId 포함). `getLatestResult()` 신규 (user 조회 → history 조회 → detail 목록 조회 → 응답 반환)
- 이유: 문항별 영속화 + 재조회 API 구현

#### `UserExaminationController.java`
- 변경 전: GET /{id}/result 없음
- 변경 후: `@GetMapping("/{id}/result")` 추가, `@AuthenticationPrincipal String email` 사용, `service.getLatestResult(id, email)` 위임
- 이유: 재조회 엔드포인트 노출

### 복원 방법
이 ID(HIST-20260614-001)만으로 복원 시:
1. `ExamHistoryDetail.java` 삭제
2. `ExamHistoryDetailRepository.java` 삭제
3. `ExamHistoryDetailResponse.java` 삭제
4. `ExamHistory.java`에서 details 필드·addDetail() 제거
5. `ExamHistoryRepository.java`에서 findTopByUser_Id... 메서드 제거
6. `ErrorCode.java`에서 EXAM_HISTORY_NOT_FOUND 제거
7. `QuestionResultResponse.java`에서 code·language 필드 제거, `of(ExamHistoryDetail)` 오버로드 제거
8. `ExaminationSubmitResponse.java`에서 historyId 필드·of() 5인자 복원(4인자로)
9. `UserExaminationService.java`에서 ExamHistoryDetail 저장 루프 제거, `getLatestResult` 제거, `ExaminationSubmitResponse.of()` 4인자로 복원
10. `UserExaminationController.java`에서 GET /{id}/result 핸들러 제거

---

## HIST-20260613-002

- **날짜**: 2026-06-13
- **수정 범위**: 사용자 백엔드 / 시험 상세 DTO
- **수정 개요**: Service→Controller 레이어 역전 해소 — inner record(ExaminationDetailView, QuestionView)를 dto/response 패키지로 이동(ExaminationDetailResponse, ExaminationQuestionView)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../dto/response/ExaminationDetailResponse.java` | 추가 | ExaminationDetailView record를 dto/response로 이동, 클래스명 변경 |
| `backend/.../dto/response/ExaminationQuestionView.java` | 추가 | QuestionView record를 dto/response로 이동, 클래스명 변경 |
| `backend/.../service/UserExaminationService.java` | 수정 | controller import 제거, ExaminationDetailResponse 반환 타입으로 교체 |
| `backend/.../controller/UserExaminationController.java` | 수정 | inner record(ExaminationDetailView·QuestionView) 제거, ExaminationDetailResponse import 추가, 핸들러 반환 타입 갱신 |

### 수정 상세

#### `ExaminationDetailResponse.java` (신규)
- 변경 전: 존재하지 않음 (UserExaminationController의 inner record ExaminationDetailView)
- 변경 후: `dto/response` 패키지 record, 7개 필드(id/title/examPaperId/examPaperTitle/categoryName/timeLimit/questions) + 정적 팩토리 `of(Examination, List<Question>)` 동일 유지
- 이유: Service가 Controller 타입에 의존하는 레이어 역전 해소

#### `ExaminationQuestionView.java` (신규)
- 변경 전: 존재하지 않음 (UserExaminationController의 inner record QuestionView)
- 변경 후: `dto/response` 패키지 record, 7개 필드(id/seq/content/questionType/options/code/language) + 정적 팩토리 `from(Question)` 동일 유지
- 이유: 동반 타입(ExaminationDetailResponse.questions 요소)도 dto/response로 일관 이동

#### `UserExaminationService.java`
- 변경 전: `import com.tpmp.testprep.controller.UserExaminationController.ExaminationDetailView;` / 반환타입 `ExaminationDetailView`
- 변경 후: `import com.tpmp.testprep.dto.response.ExaminationDetailResponse;` / 반환타입 `ExaminationDetailResponse`
- 이유: controller 패키지 의존 제거

#### `UserExaminationController.java`
- 변경 전: inner record `ExaminationDetailView`, `QuestionView` 정의 포함 / 핸들러 반환 `ApiResponse<ExaminationDetailView>`
- 변경 후: inner record 제거 / `import ExaminationDetailResponse` / 핸들러 반환 `ApiResponse<ExaminationDetailResponse>` / 미사용 import(Examination·Question·List) 제거
- 이유: 레이어 역전 해소 + 미사용 entity import 정리

### 동작 보존 확인 포인트

| 항목 | 보존 여부 |
|------|-----------|
| 응답 JSON 필드 7개(id/title/examPaperId/examPaperTitle/categoryName/timeLimit/questions[]) | 동일 |
| questions[] 내 필드 7개(id/seq/content/questionType/options/code/language) | 동일 |
| RANDOM 모드 Collections.shuffle — Service에 유지 | 동일 |
| `of` / `from` 정적 팩토리 생성 로직 | 동일 |
| 채점·이력저장·예외처리 로직 | 무변경 |

### 복원 방법
이 ID(HIST-20260613-002)만으로 복원 시:
1. `ExaminationDetailResponse.java`, `ExaminationQuestionView.java` 삭제
2. `UserExaminationController.java`에 inner record `ExaminationDetailView`·`QuestionView` 복원 및 관련 import 복원
3. `UserExaminationService.java`의 import를 `controller.UserExaminationController.ExaminationDetailView`로, 반환 타입을 `ExaminationDetailView`로 복원

---

## HIST-20260613-001

- **날짜**: 2026-06-13
- **수정 범위**: 사용자 백엔드 / 시험 조회·상세·제출
- **수정 개요**: UserExaminationController의 3레이어 분리 위반 해소 — Repository 직접 주입 제거, 비즈니스 로직을 UserExaminationService로 이전 (동작 100% 보존)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/UserExaminationService.java` | 추가 | 사용자 전용 시험 Service 신설 (목록·상세·제출 로직 이전) |
| `backend/src/main/java/com/tpmp/testprep/controller/UserExaminationController.java` | 수정 | Repository 4개 직접 주입 제거, UserExaminationService 단독 주입으로 전환, @Transactional 제거 |

### Service 구조 선택 근거

**`UserExaminationService` 신설** (기존 `ExaminationService` 확장 아님)

- `ExaminationService`는 관리자 CRUD 전담 (`AdminExaminationController`에서만 사용)
- 프로젝트 패턴: 사용자 전용 기능은 별도 Service로 분리 (`UserDashboardService`, `PracticeService` 등 다수 존재)
- 사용자용 제출/채점/이력저장은 `ExamHistoryRepository`, `UserRepository` 추가 의존이 필요해 관심사가 명확히 다름
- `ExaminationService` 기존 메서드 시그니처 무변경 보장

### 수정 상세

#### `UserExaminationController.java`
- 변경 전:
  - `ExaminationRepository`, `QuestionRepository`, `UserRepository`, `ExamHistoryRepository` 4개 Repository 직접 주입
  - `getExaminationDetail`: examinationRepository·questionRepository 직접 호출 + 셔플 + DTO 조립 인라인
  - `submitExam`: 조회·채점·점수계산·이력저장 전체 인라인, `@Transactional` 컨트롤러에 선언
  - `getExaminations`: `examinationRepository.findAllWithDetails().map(...)` 인라인
- 변경 후:
  - `UserExaminationService` 단독 주입
  - 각 핸들러: 파라미터 수신 → Service 호출 → `ApiResponse.success(result)` 반환만 수행
  - `@Transactional` 제거 (Service 레이어로 이동)
  - `ExaminationDetailView`, `QuestionView` record를 dto/response로 이동(레이어 역전 해소) → `ExaminationDetailResponse`, `ExaminationQuestionView` ※ HIST-20260613-001 정정: 최초 기술("record 위치 유지")은 이후 HIST-20260613-002 작업으로 해소됨
- 이유: CLAUDE.md "Controller → Service → Repository" 3레이어 원칙 준수

#### `UserExaminationService.java` (신규)
- 변경 전: 존재하지 않음
- 변경 후:
  - `getExaminations(Pageable)` → `Page<ExaminationResponse>` 반환
  - `getExaminationDetail(Long id)` → `ExaminationDetailView` 반환 (RANDOM 모드 셔플 포함)
  - `submitExam(Long id, Map<Long,String> answers, String email)` → `ExaminationSubmitResponse` 반환
  - `@Transactional(readOnly = true)` 클래스 기본, `submitExam`에 `@Transactional` 오버라이드
  - `ExamHistory` 저장 로직 동일하게 이전 (user 조회 → builder 패턴 → save)
- 이유: 비즈니스 로직을 Service 레이어로 분리

### 동작 보존 확인 포인트

| 항목 | 보존 여부 |
|------|-----------|
| `GET /api/user/examinations` 응답 (`Page<ExaminationResponse>`) | 동일 |
| `GET /api/user/examinations/{id}` 응답 (`ExaminationDetailView` 필드) | 동일 |
| RANDOM 모드 시 `Collections.shuffle(questions)` | 동일 |
| `POST /api/user/examinations/{id}/submit` 채점 로직 | 동일 |
| 점수 계산식 (`Math.round(correct * 100.0 / total)`) | 동일 |
| `ExamHistory` 저장 (user·examination·totalQuestions·correctCount·score) | 동일 |
| `ErrorCode.EXAMINATION_NOT_FOUND`, `USER_NOT_FOUND` 예외 | 동일 |
| `@AuthenticationPrincipal String email` → Service에 인자 전달 | 동일 |

### 컨트롤러에서 제거된 Repository 주입

- `ExaminationRepository` 제거
- `QuestionRepository` 제거
- `UserRepository` 제거
- `ExamHistoryRepository` 제거

### 복원 방법
이 ID(HIST-20260613-001)만으로 복원 시:
1. `UserExaminationService.java` 파일 삭제
2. `UserExaminationController.java`를 변경 전 상태(Repository 4개 직접 주입, 로직 인라인)로 복원
