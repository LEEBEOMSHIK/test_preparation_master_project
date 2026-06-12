## HIST-20260612-001

- **날짜**: 2026-06-12
- **수정 범위**: 사용자 백엔드 / 시험 데이터 시드
- **수정 개요**: 시험 목록이 비어 있어 DataInitializer에 정보처리기사 실기 시험 데이터를 멱등 시드(2024~2026 × 각 3회 = 시험지 9개, 각 문항 5개 + Examination 1개)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java` | 수정 | `ensureExamData()` 추가, `run()`에서 호출, ExamRepository·QuestionRepository·ExaminationRepository 주입 |
| `backend/src/test/java/com/tpmp/testprep/config/DataInitializerTest.java` | 수정 | 생성자에 신규 Repository 3종 mock 추가 |

### 수정 상세

#### `DataInitializer.java`
- `ensureExamData()` 신규:
  - EXAM_TYPE 도메인의 DomainSlave "정보처리기사 실기" 및 admin 계정 조회. 없으면 로그 후 return.
  - 연도×회차 9종(2024·2025·2026 × 1·2·3회) 루프.
  - **멱등 가드**: `examinations` 테이블에 동일 제목(예: "정보처리기사 실기 2024년 1회") 존재 시 건너뜀 → 재기동 시 중복 생성 없음.
  - 각 시험: Exam(시험지, questionMode SEQUENTIAL, orderNo 자동) 생성 → 샘플 더미 문항 5개(MULTIPLE_CHOICE×2, SHORT_ANSWER, OX, CODE) 저장 → Examination(examPaper, category=정보처리기사 실기, timeLimit 150분) 생성.
  - 문항은 더미 학습용임을 content에 명시.
- 주입 추가: `ExamRepository`, `QuestionRepository`, `ExaminationRepository`.
- `run()`에 `ensureExamData()` 호출 추가.

#### `DataInitializerTest.java`
- DataInitializer 생성자 시그니처 변경에 맞춰 `mock(ExamRepository.class)`, `mock(QuestionRepository.class)`, `mock(ExaminationRepository.class)` 인자 추가.

### 적용 방법
시드는 **백엔드 재기동 시** ApplicationRunner(`DataInitializer.run`)에서 실행된다. 재기동 후 `/user/exams`·`/user/examinations` 목록에 9개 시험이 노출된다.

### 복원 방법
이 ID(HIST-20260612-001)로 복원 시 `ensureExamData()` 메서드와 `run()` 호출, 주입한 Repository 3종, 테스트의 mock 3종 추가를 제거한다.
