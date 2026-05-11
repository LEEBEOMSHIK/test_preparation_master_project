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
