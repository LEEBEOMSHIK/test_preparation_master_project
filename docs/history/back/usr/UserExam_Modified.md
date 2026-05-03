## HIST-20260430-013

- **날짜**: 2026-04-30
- **수정 범위**: 사용자 백엔드 / 시험 관리, 퀴즈
- **수정 개요**: Exam 엔티티에 del_yn 소프트 삭제 추가, ExamService/ExamRepository를 del_yn 필터링으로 전환, UserQuizController 정답 확인 시 삭제된 문항 방어 처리

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/Exam.java` | 수정 | `del_yn` 컬럼 필드 및 `softDelete()` 메서드 추가 |
| `backend/src/main/java/com/tpmp/testprep/repository/ExamRepository.java` | 수정 | `findAllByDelYn`, `findByIdAndDelYn` 메서드 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/ExamService.java` | 수정 | `getExams`, `getExamDetail`, `deleteExam` del_yn 필터링 적용 |
| `backend/src/main/java/com/tpmp/testprep/controller/UserQuizController.java` | 수정 | `checkAnswer`에서 삭제된 문항(`del_yn=Y`) 방어 처리 추가 |

### 수정 상세

#### `entity/Exam.java`
- 변경 전: `del_yn` 컬럼 없음, `deleteExam`은 실제 DB 삭제
- 변경 후: `@Column(name = "del_yn") private String delYn = "N"` 추가, `softDelete()` 메서드 추가
- 이유: 소프트 삭제 지원으로 데이터 복원 가능성 확보

#### `repository/ExamRepository.java`
- 변경 전: `findAll(Pageable)` 단일 메서드
- 변경 후: `findAllByDelYn(String, Pageable)`, `findByIdAndDelYn(Long, String)` 추가
- 이유: del_yn 조건부 조회를 위한 JPA derived query

#### `service/ExamService.java`
- 변경 전: `findAll(pageable)`, `findById(id)`, `examRepository.delete(exam)`
- 변경 후: `findAllByDelYn("N", pageable)`, `findByIdAndDelYn(id, "N")`, `exam.softDelete()`
- 이유: 삭제된 시험이 목록/상세 조회에 노출되지 않도록 하고 물리 삭제를 소프트 삭제로 전환

#### `controller/UserQuizController.java`
- 변경 전: `questionBankRepository.findById(request.questionId()).orElseThrow()`
- 변경 후: `.filter(q -> "N".equals(q.getDelYn()))` 체인 추가
- 이유: 삭제된 문항으로 정답 확인 요청이 오는 경우 방어

### 복원 방법

이 ID(HIST-20260430-013)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다.

---
