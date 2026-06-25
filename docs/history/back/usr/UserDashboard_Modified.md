## HIST-20260625-001

- **날짜**: 2026-06-25
- **수정 범위**: 사용자 백엔드 / 통계 대시보드 · 시험 응시
- **수정 개요**: 약점 도메인 집계를 시험 카테고리(ExamHistory JOIN examination JOIN category) 기준에서 문항 카테고리(ExamHistoryDetail.categoryName 스냅샷) 기준으로 전환

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/Question.java` | 수정 | DomainSlave category FK(LAZY, nullable) 추가; @Builder·update() 파라미터 반영 |
| `backend/src/main/java/com/tpmp/testprep/entity/ExamHistoryDetail.java` | 수정 | categoryName 비정규화 스냅샷 필드(String, length=100) 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionRequest.java` | 수정 | categoryId(Long, nullable) 필드 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuestionDetailResponse.java` | 수정 | categoryId·categoryName 필드 추가; from()에서 null-safe 매핑 |
| `backend/src/main/java/com/tpmp/testprep/service/ExamService.java` | 수정 | DomainSlaveRepository 주입; addQuestion·addQuestionsBulk·createExamWithQuestions에 category 바인딩 추가 |
| `backend/src/main/java/com/tpmp/testprep/repository/QuestionRepository.java` | 수정 | findByExamIdOrderBySeqAscWithCategory (LEFT JOIN FETCH q.category) 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/UserExaminationService.java` | 수정 | submitExam에서 새 fetch join 쿼리 사용; ExamHistoryDetail.builder에 categoryName 스냅샷 추가 |
| `backend/src/main/java/com/tpmp/testprep/repository/ExamHistoryDetailRepository.java` | 수정 | aggregateDomainStatsByUserAndPeriod 집계 쿼리 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/UserDashboardService.java` | 수정 | ExamHistoryDetailRepository 주입; 도메인 집계 소스를 examHistoryRepository → examHistoryDetailRepository로 교체 |

### 수정 상세

#### `Question.java`
- 변경 전: category 필드 없음. Builder/update() 파라미터에 category 없음.
- 변경 후: `@ManyToOne(fetch=LAZY) @JoinColumn(name="category_id") private DomainSlave category;` 추가. Builder(category), update(…, category) 파라미터 추가.
- 이유: 문항에 카테고리를 연결해 채점 시점 스냅샷(ExamHistoryDetail.categoryName)에 반영하기 위함

#### `ExamHistoryDetail.java`
- 변경 전: categoryName 필드 없음.
- 변경 후: `@Column(name="category_name", length=100) private String categoryName;` 추가 (@Builder 포함).
- 이유: QuizHistory.domainName 패턴 동일. FK 없이 String 비정규화 — 카테고리 변경 시에도 과거 이력 불변 유지.

#### `QuestionRequest.java`
- 변경 전: language까지 7필드.
- 변경 후: `Long categoryId` 추가 (nullable, @Param 바인딩 사용).

#### `QuestionDetailResponse.java`
- 변경 전: 9필드 record (id~language).
- 변경 후: categoryId·categoryName 2필드 추가. from()에서 `q.getCategory() != null ? q.getCategory().getId() : null` null-safe 매핑.

#### `ExamService.java`
- 변경 전: DomainSlaveRepository 미주입. addQuestion/addQuestionsBulk/createExamWithQuestions의 Question.builder()에 category 없음.
- 변경 후: `private final DomainSlaveRepository domainSlaveRepository;` 추가. 각 메서드에서 `req.categoryId() != null ? domainSlaveRepository.findById(req.categoryId()).orElse(null) : null`로 category 조회 후 빌더에 전달. 파일업로드 경로(buildAndSaveQuestions 등)는 category=null 유지.

#### `QuestionRepository.java`
- 변경 전: `findByExamIdOrderBySeqAsc` 파생 쿼리만 존재 (category LAZY 로딩 → N+1 위험).
- 변경 후: `findByExamIdOrderBySeqAscWithCategory` 추가 (`LEFT JOIN FETCH q.category`). submitExam에서 해당 메서드 사용.

#### `UserExaminationService.java`
- 변경 전: submitExam에서 `questionRepository.findByExamIdOrderBySeqAsc` 사용. ExamHistoryDetail.builder에 categoryName 없음.
- 변경 후: `questionRepository.findByExamIdOrderBySeqAscWithCategory` 사용. detail 빌더에 `.categoryName(q.getCategory() != null ? q.getCategory().getName() : null)` 추가.

#### `ExamHistoryDetailRepository.java`
- 변경 전: `findByExamHistory_IdOrderBySeqAsc` 하나만 존재.
- 변경 후: `aggregateDomainStatsByUserAndPeriod(userId, from)` JPQL @Query 추가. SELECT categoryName·COUNT·SUM(correct). categoryName IS NOT NULL 필터. 정답률 ASC(CASE WHEN) 정렬.

#### `UserDashboardService.java`
- 변경 전: 도메인 집계가 `examHistoryRepository.aggregateDomainStatsByUserAndPeriod(시험 카테고리 기준)` 호출.
- 변경 후: `examHistoryDetailRepository.aggregateDomainStatsByUserAndPeriod(문항 카테고리 스냅샷 기준)` 호출로 교체. ExamHistoryDetailRepository 필드·import 추가. ExamHistoryRepository의 기존 메서드는 삭제 안 함(관리자 통계 재사용 가능성).

### 복원 방법
이 ID(HIST-20260625-001)만으로 복원 시:
1. Question.java: category 필드·Builder 파라미터·update 파라미터 제거; DomainSlave import 제거
2. ExamHistoryDetail.java: categoryName 필드 제거
3. QuestionRequest.java: categoryId 필드 제거
4. QuestionDetailResponse.java: categoryId·categoryName 필드 제거; from()에서 관련 매핑 제거
5. ExamService.java: DomainSlaveRepository 필드·import 제거; addQuestion/addQuestionsBulk/createExamWithQuestions에서 category 조회·빌더 전달 코드 제거
6. QuestionRepository.java: findByExamIdOrderBySeqAscWithCategory 메서드 제거
7. UserExaminationService.java: submitExam을 `findByExamIdOrderBySeqAsc`로 되돌리기; detail 빌더에서 categoryName 줄 제거
8. ExamHistoryDetailRepository.java: aggregateDomainStatsByUserAndPeriod 메서드·import 제거
9. UserDashboardService.java: ExamHistoryDetailRepository 필드·import 제거; 도메인 집계 호출을 examHistoryRepository로 원복

---

## HIST-20260624-001

- **날짜**: 2026-06-24
- **수정 범위**: 사용자 백엔드 / 통계 대시보드
- **수정 개요**: 연습장(PracticeHistory) 풀이 통계를 사용자 대시보드에 반영 — 총 실행수·성공수·성공률·날짜별 실행량 4필드 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/dto/response/PracticeDailyStatResponse.java` | 추가 | 연습장 날짜별 실행량 응답 record(date, totalExecutions) |
| `backend/src/main/java/com/tpmp/testprep/repository/PracticeHistoryRepository.java` | 수정 | 집계 메서드 2개 추가 — sumTotalAndSuccessByEmailAndPeriod, aggregateDailyStatsByEmailAndPeriod |
| `backend/src/main/java/com/tpmp/testprep/dto/response/UserDashboardResponse.java` | 수정 | practiceTotalExecutions, practiceSuccessCount, practiceSuccessRate, practiceDailyStats 4필드 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/UserDashboardService.java` | 수정 | PracticeHistoryRepository 주입, 연습장 집계 블록 추가, return에 4개 인수 추가 |

### 수정 상세

#### `PracticeDailyStatResponse.java` (신규)
- 변경 전: 없음
- 변경 후: `record(String date, long totalExecutions)` — QuizDailyStatResponse 패턴 동일
- 이유: 연습장 날짜별 실행량 응답 전용 DTO

#### `PracticeHistoryRepository.java`
- 변경 전: `JpaRepository<PracticeHistory, Long>, JpaSpecificationExecutor<PracticeHistory>` 상속만 존재.
- 변경 후: JPQL @Query 집계 메서드 2개 추가
  - `sumTotalAndSuccessByEmailAndPeriod(email, from)` — COUNT(p) + SUM(CASE WHEN resultType='ERROR' THEN 0 ELSE 1 END)
  - `aggregateDailyStatsByEmailAndPeriod(email, from)` — CAST(executedAt AS date) GROUP BY ASC
  - 식별자 전략: email String 직접 바인딩(FK 없음). `@Param("email")`, `@Param("from")` 사용.
- 이유: PracticeHistory에 userId FK 없으므로 userEmail String으로 직접 집계

#### `UserDashboardResponse.java`
- 변경 전: 9개 필드 record (totalQuestions ~ quizDailyStats)
- 변경 후: 4개 필드 추가 — `long practiceTotalExecutions, long practiceSuccessCount, double practiceSuccessRate, List<PracticeDailyStatResponse> practiceDailyStats`
- 이유: record 확장, 기존 9개 필드 순서 유지

#### `UserDashboardService.java`
- 변경 전: PracticeHistoryRepository 미주입. getDashboard()가 9개 인수로 return.
- 변경 후:
  - `PracticeHistoryRepository practiceHistoryRepository` 필드 추가 (@RequiredArgsConstructor 자동 주입)
  - import: `PracticeDailyStatResponse`, `PracticeHistoryRepository` 추가
  - quizDailyStats 블록 직후 연습장 집계 블록 추가:
    - `normalizeSingleAggregateRow(practiceHistoryRepository.sumTotalAndSuccessByEmailAndPeriod(email, from))` → totalExecutions/successCount
    - `practiceSuccessRate = totalExecutions > 0 ? successCount * 100.0 / totalExecutions : 0.0`
    - `aggregateDailyStatsByEmailAndPeriod(email, from)` → TreeMap(날짜 ASC) → PracticeDailyStatResponse 리스트
  - return에 4개 인수 추가 (기존 9개 뒤)
  - 기존 헬퍼(normalizeSingleAggregateRow, longValueAt, toDateString) 재사용
- 이유: 연습장 실행 현황을 대시보드에 통합 제공

### 복원 방법
이 ID(HIST-20260624-001)만으로 복원 시:
1. `PracticeDailyStatResponse.java` 파일 삭제
2. `PracticeHistoryRepository.java`에서 추가된 2개 @Query 메서드 및 import(Query, Param, LocalDateTime, List) 제거
3. `UserDashboardResponse.java`에서 추가된 4개 필드 제거
4. `UserDashboardService.java`에서 PracticeHistoryRepository 필드/import 제거, 연습장 집계 블록 제거, return 인수 9개로 복원

---

## HIST-20260622-002

- **날짜**: 2026-06-22
- **수정 범위**: 사용자 백엔드 / 통계 대시보드
- **수정 개요**: 대시보드 퀴즈 풀이량 별도 집계 추가 — 정답률 경로(시험 전용 환원) + 퀴즈 풀이량 3필드 신규 반환

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuizDomainStatResponse.java` | 추가 | 퀴즈 도메인별 풀이량 응답 record(domainName, totalQuestions) |
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuizDailyStatResponse.java` | 추가 | 퀴즈 날짜별 풀이량 응답 record(date, totalQuestions) |
| `backend/src/main/java/com/tpmp/testprep/dto/response/UserDashboardResponse.java` | 수정 | quizTotalQuestions, quizDomainStats, quizDailyStats 3필드 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/UserDashboardService.java` | 수정 | 정답률 경로를 시험 전용으로 환원; 퀴즈 풀이량 3필드 별도 집계 로직 추가 |

### 수정 상세

#### `QuizDomainStatResponse.java` (신규)
- 변경 전: 없음
- 변경 후: `record(String domainName, long totalQuestions)`
- 이유: 퀴즈 도메인별 풀이량 응답 전용 DTO(정답 정보 불필요)

#### `QuizDailyStatResponse.java` (신규)
- 변경 전: 없음
- 변경 후: `record(String date, long totalQuestions)`
- 이유: 퀴즈 날짜별 풀이량 응답 전용 DTO(정답률 불필요)

#### `UserDashboardResponse.java`
- 변경 전: `record(totalQuestions, totalCorrect, overallCorrectRate, domainStats, weakDomains, dailyTrend)`
- 변경 후: 맨 뒤에 3필드 추가 — `long quizTotalQuestions, List<QuizDomainStatResponse> quizDomainStats, List<QuizDailyStatResponse> quizDailyStats`
- 이유: record 불변 필드 확장, 기존 6필드 순서 유지

#### `UserDashboardService.java`
- 변경 전: 총 문항/정답/도메인별/날짜별 집계가 시험+퀴즈 병합(HIST-20260622-001 참조).
- 변경 후:
  - 정답률 경로 시험 전용 환원: `totalQuestions/totalCorrect` = examTotals만, `domainStats/weakDomains` = ExamHistory aggregateDomain만, `dailyTrend` = ExamHistory aggregateDaily만. 퀴즈 merge 블록 제거.
  - 퀴즈 풀이량 별도 집계:
    - `quizTotalQuestions`: quizHistoryRepository.sumTotalAndCorrectByUserAndPeriod → [0](COUNT)
    - `quizDomainStats`: quizHistoryRepository.aggregateDomainStatsByUserAndPeriod → QuizDomainStatResponse(row[0], row[1]) → 풀이수 내림차순 정렬
    - `quizDailyStats`: quizHistoryRepository.aggregateDailyStatsByUserAndPeriod → TreeMap(날짜 ASC) → QuizDailyStatResponse
  - 기존 `normalizeSingleAggregateRow/longValueAt/toDateString` 헬퍼 재사용
  - import 추가: QuizDomainStatResponse, QuizDailyStatResponse
- 이유: 시험 정답률과 퀴즈 풀이량을 동일 집계 경로에 합산하면 정답률이 왜곡됨. 두 메트릭을 완전히 분리하여 각각 의미 있는 값 제공.

### 복원 방법
이 ID(HIST-20260622-002)만으로 복원 시:
1. QuizDomainStatResponse.java, QuizDailyStatResponse.java 파일 삭제
2. UserDashboardResponse.java에서 추가된 3필드 제거
3. UserDashboardService.java를 HIST-20260622-001(시험+퀴즈 병합 버전)으로 되돌림:
   - 퀴즈 도메인/날짜 merge 블록 복원
   - quizTotalQuestions를 totalQuestions에 합산하는 코드 복원
   - QuizDomainStatResponse/QuizDailyStatResponse import 제거

---

## HIST-20260622-001

- **날짜**: 2026-06-22
- **수정 범위**: 사용자 백엔드 / 통계 대시보드
- **수정 개요**: 대시보드 통계에 퀴즈 이력 합산 — `QuizHistoryRepository` 주입, 총 문항·도메인별·날짜별 집계를 시험+퀴즈 병합 후 반환

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/UserDashboardService.java` | 수정 | `QuizHistoryRepository` 주입, `getDashboard`에 퀴즈 집계 병합 로직 추가, `toDateString` 헬퍼 추출 |

### 수정 상세

#### `UserDashboardService.java`
- 변경 전: `ExamHistoryRepository`만 집계. 총 문항/정답, 도메인별, 날짜별 모두 시험 이력만 반영.
- 변경 후:
  - 총 문항/정답: `examTotals + quizTotals` 합산
  - 도메인별: `examHistoryRepository.aggregateDomainStats` + `quizHistoryRepository.aggregateDomainStats`를 도메인명 기준 `Map<String, long[]>` 병합 → 정답률 ASC 정렬 (`DomainStatResponse::correctRate`)
  - 날짜별: `examHistoryRepository.aggregateDailyStats` + `quizHistoryRepository.aggregateDailyStats`를 날짜 문자열 기준 병합 → 날짜 ASC 정렬
  - `toDateString(Object)` 헬퍼 추출 (java.sql.Date/LocalDate 처리, 기존 인라인 코드 이동)
  - DTO·응답 구조 무변경 (`UserDashboardResponse`, `DomainStatResponse`, `DailyStatResponse`)
- 이유: 퀴즈 풀이 이력이 quiz_history에 쌓이기 시작하므로 대시보드 통계에 반영

### 복원 방법
이 ID(HIST-20260622-001)만으로 복원 시:
1. `UserDashboardService.java`에서 `QuizHistoryRepository quizHistoryRepository` 필드 제거, import 제거
2. `getDashboard`의 퀴즈 합산 부분 제거 — 기존 `examHistoryRepository` 단독 집계 로직으로 되돌림
3. `toDateString` 헬퍼 제거 후 날짜 변환 로직을 `dailyTrend` 스트림 내부에 인라인 복원

---

## HIST-20260613-001

- **날짜**: 2026-06-13
- **수정 범위**: 사용자 백엔드 / 통계 대시보드
- **수정 개요**: 집계 쿼리 결과 ClassCastException 수정 — exam_history에 데이터가 생기면 대시보드 통계 API가 500 나던 버그

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/UserDashboardService.java` | 수정 | 단일 행 집계 결과의 중첩 배열 언랩 헬퍼(`normalizeSingleAggregateRow`, `longValueAt`) 추가 |

### 수정 상세

#### `UserDashboardService.java`
- 증상: 시험 응시 결과(ExamHistory) 영속화 버그 수정 후 exam_history에 데이터가 쌓이자, `getDashboard`의 `sumTotalAndCorrectByUserAndPeriod` 결과를 `((Number) totals[0])`로 캐스팅하다 `ClassCastException: [Ljava.lang.Object; cannot be cast to Number` 발생(L48). 데이터가 없을 땐 `[null,null]`이라 안 터졌음.
- 원인: 단일 행 다중 컬럼 집계 쿼리(`Object[]` 반환)가 Hibernate 경로에 따라 `[[sum1,sum2]]`로 한 번 더 감싸져 반환됨. `totals[0]`이 Number가 아닌 `Object[]`.
- 수정: `normalizeSingleAggregateRow(row)`로 `length==1 && row[0] instanceof Object[]`이면 내부 배열을 꺼내고, `longValueAt(row, i)`로 안전하게 long 추출.

### 복원 방법
이 ID(HIST-20260613-001)로 복원 시 두 헬퍼를 제거하고 `totals[0]/totals[1]`을 직접 캐스팅하는 원래 코드로 되돌린다(단, exam_history에 데이터가 있으면 다시 500 발생).

---

## HIST-20260612-001

- **날짜**: 2026-06-12
- **수정 범위**: 사용자 백엔드 / 통계 대시보드
- **수정 개요**: DataInitializer에 `ensureDashboardMenu()` 추가 — `/user/dashboard` 메뉴를 MenuConfig DB에 멱등 시딩

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java` | 수정 | `ensureDashboardMenu()` 메서드 추가 및 `run()`에서 호출 |

### 수정 상세

#### `DataInitializer.java`
- 변경 전: `ensureDashboardMenu()` 없음. `run()` 내 `ensureBookmarkMenu()` 다음에 바로 `ensurePracticeAdminMenus()` 호출.
- 변경 후:
  - `ensureDashboardMenu()` 신규 추가 — `existsByUrl("/user/dashboard")` 체크 후 없으면 `saveMenu(null, "통계 대시보드", "/user/dashboard", "dashboard", -1, MenuConfig.MenuType.USER, "USER,ADMIN")` 실행
  - `run()` 내 `ensureBookmarkMenu()` 바로 아래 `ensureDashboardMenu()` 호출 추가 (ensurePermissionMenuAssociations 이전이므로 GENERAL_USER allowedRoles 자동 연결 적용됨)
- displayOrder 선택 근거: USER 메뉴 중 `/user/exam-info`가 displayOrder=0(최상단), 그 외 exams=1~inquiries=5, practice=7, bookmarks=8 순서. 프론트엔드 USER_FALLBACK_NAV에서 dashboard가 displayOrder=0으로 최상단에 위치. dashboard를 exam-info보다도 앞에 두기 위해 displayOrder=-1로 설정.
- 이유: frontend USER_FALLBACK_NAV에만 있던 dashboard 메뉴를 DB 기반 네비게이션과 일치시키기 위한 시딩 추가

### 복원 방법
이 ID(HIST-20260612-001)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 적용한다.
- `ensureDashboardMenu()` 메서드 삭제
- `run()` 내 `ensureDashboardMenu();` 호출 라인 삭제

---

## HIST-20260611-001

- **날짜**: 2026-06-11
- **수정 범위**: 사용자 백엔드 / 통계 대시보드
- **수정 개요**: 사용자 시험 응시 이력 기반 통계 대시보드 API 신규 구현 (총 풀이·정답률·도메인별·날짜별·약점 Top5)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/repository/ExamHistoryRepository.java` | 수정 | 사용자별 집계 JPQL 메서드 3개 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/DomainStatResponse.java` | 추가 | 도메인 통계 응답 record |
| `backend/src/main/java/com/tpmp/testprep/dto/response/DailyStatResponse.java` | 추가 | 날짜별 통계 응답 record |
| `backend/src/main/java/com/tpmp/testprep/dto/response/UserDashboardResponse.java` | 추가 | 사용자 대시보드 통합 응답 record |
| `backend/src/main/java/com/tpmp/testprep/service/UserDashboardService.java` | 추가 | 통계 집계 서비스 |
| `backend/src/main/java/com/tpmp/testprep/controller/UserDashboardController.java` | 추가 | GET /api/user/dashboard/stats 엔드포인트 |

### 수정 상세

#### `ExamHistoryRepository.java`
- 변경 전: 관리자용 집계 메서드만 존재 (countByTakenAtBetween 등)
- 변경 후: 사용자별 3개 집계 JPQL 추가
  - `sumTotalAndCorrectByUserAndPeriod` — 전체 문항/정답 SUM
  - `aggregateDomainStatsByUserAndPeriod` — 도메인별 GROUP BY, 정답률 ASC 정렬
  - `aggregateDailyStatsByUserAndPeriod` — 날짜별 GROUP BY, ASC 정렬
- 이유: DB 집계로 N+1/OOM 방지, category IS NOT NULL INNER JOIN으로 null 도메인 제외

#### `UserDashboardService.java` (신규)
- 변경 전: 없음
- 변경 후: `getDashboard(email, days)` 구현
  - days=0이면 from=2000-01-01 (전체), 아니면 now().minusDays(days)
  - Object[] 집계 결과를 DTO로 변환, java.sql.Date/LocalDate 모두 처리
  - weakDomains = domainStats (정답률 ASC 정렬) 앞 5개 추출
- 이유: @Transactional(readOnly=true)로 읽기 최적화

#### `UserDashboardController.java` (신규)
- 변경 전: 없음
- 변경 후: GET /api/user/dashboard/stats, @AuthenticationPrincipal String email, @RequestParam(defaultValue="30") int days
- 이유: /api/user/** 는 SecurityConfig에서 authenticated() 처리 완료되어 별도 보안 설정 불필요

### 복원 방법
이 ID(HIST-20260611-001)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다.
- ExamHistoryRepository.java: 추가된 3개 @Query 메서드 및 import 제거
- DomainStatResponse.java, DailyStatResponse.java, UserDashboardResponse.java: 파일 삭제
- UserDashboardService.java: 파일 삭제
- UserDashboardController.java: 파일 삭제

### 주의사항
- MenuConfig DB 테이블에 `/user/dashboard` 경로와 `dashboard` iconKey를 가진 항목을 관리자 메뉴 관리에서 별도 등록해야 API 기반 네비게이션이 정상 동작한다. (현재는 USER_FALLBACK_NAV에만 추가된 상태)
