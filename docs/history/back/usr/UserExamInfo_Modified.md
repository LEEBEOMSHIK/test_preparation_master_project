## HIST-20260505-017

- **날짜**: 2026-05-05
- **수정 범위**: 사용자 백엔드 / 관심 시험
- **수정 개요**: `updateInterests` PUT 호출 시 UK 제약 위반(409) 버그 수정 — `deleteByUser` 파생 삭제를 `@Modifying @Query` JPQL로 교체

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../repository/UserInterestedExamRepository.java` | 수정 | `deleteByUser` → `@Modifying(clearAutomatically=true) @Query(DELETE JPQL)` |

### 수정 상세

#### `UserInterestedExamRepository.java`
- **근본 원인**: Hibernate의 flush 실행 순서는 **INSERT → UPDATE → DELETE**. 파생 삭제 메서드(`deleteByUser`)는 삭제를 영속성 컨텍스트에 pending 등록만 하고, 이후 `saveAll()`의 INSERT가 먼저 DB에 실행되어 `(user_id, domain_slave_id)` UK 제약을 위반함.
- 변경 전: `void deleteByUser(User user);` — 파생 메서드, SELECT→delete() 루프, flush 순서 미보장
- 변경 후:
  ```java
  @Modifying(clearAutomatically = true)
  @Query("DELETE FROM UserInterestedExam e WHERE e.user = :user")
  void deleteByUser(@Param("user") User user);
  ```
  JPQL DELETE 쿼리가 호출 즉시 DB에 실행(flush)되어, 이후 saveAll() INSERT와 UK 충돌 없음.

### 복원 방법

HIST-20260505-017 복원 시: `@Modifying`, `@Query`, `@Param` 어노테이션과 import를 제거하고 `void deleteByUser(User user);` 파생 메서드로 복원 (단, UK 409 버그 재발).

---

## HIST-20260505-015

- **날짜**: 2026-05-05
- **수정 범위**: 사용자 백엔드 / 관심 시험, 온보딩, 인증
- **수정 개요**: 관심 시험을 `User.interestedExamTypes` 문자열 컬럼 → 별도 `user_interested_exam` 테이블(FK → domain_slave)로 정규화, 슬레이브 ID 기반 저장

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../entity/UserInterestedExam.java` | 추가 | user_id + domain_slave_id 연결 테이블 엔티티 (UK 제약) |
| `backend/.../repository/UserInterestedExamRepository.java` | 추가 | `findByUser`, `deleteByUser` 제공 |
| `backend/.../entity/User.java` | 수정 | `interestedExamTypes` String 컬럼 제거; `completeOnboarding()` → `isFirstLogin = false`만 수행 |
| `backend/.../dto/request/OnboardingRequest.java` | 수정 | `List<String> examTypes` → `List<Long> slaveIds` |
| `backend/.../dto/response/UserResponse.java` | 수정 | `interestedExamSlaveIds` 필드 추가; `from(User, List<UserInterestedExam>)` 오버로드 추가 |
| `backend/.../repository/DomainSlaveRepository.java` | 수정 | `findByMasterCode(String code)` JPQL 추가 |
| `backend/.../service/ExamInfoService.java` | 수정 | `UserInterestedExamRepository`, `DomainSlaveRepository` 주입; `getExamTypes()`, `saveInterests()` 추가; 온보딩/관심 업데이트 로직 재작성 |
| `backend/.../service/AuthService.java` | 수정 | `UserInterestedExamRepository` 주입; login/refresh/me 응답에 관심 시험 포함 |
| `backend/.../controller/UserExamInfoController.java` | 수정 | `GET /api/user/exam-types` 엔드포인트 추가 |

### 수정 상세

#### `UserInterestedExam.java` (신규)
- 테이블: `user_interested_exam` (UK: user_id + domain_slave_id)
- `user`: `@ManyToOne LAZY`
- `domainSlave`: `@ManyToOne EAGER` (이름 조회 최적화)

#### `User.java`
- 변경 전: `@Column(name = "interested_exam_types", length = 500) String interestedExamTypes`; `completeOnboarding(String)`, `updateInterests(String)` 메서드
- 변경 후: String 컬럼 및 관련 메서드 제거; `completeOnboarding()` — `isFirstLogin = false`만 수행

#### `OnboardingRequest.java`
- 변경 전: `List<String> examTypes`
- 변경 후: `List<Long> slaveIds`

#### `UserResponse.java`
- 변경 전: `List<String> interestedExamTypes` (User String split)
- 변경 후: `List<String> interestedExamTypes` (슬레이브 name 목록), `List<Long> interestedExamSlaveIds` (슬레이브 ID 목록) 추가; `from(User, List<UserInterestedExam>)` 팩토리 추가

#### `ExamInfoService.java`
- `getExamTypes()`: `DomainSlaveRepository.findByMasterCode("EXAM_TYPE")` → `DomainSlaveResponse` 목록 반환
- `completeOnboarding()`: `user.completeOnboarding()` + `saveInterests()` 호출
- `updateInterests()`: `saveInterests()` 호출
- `saveInterests(user, slaveIds)`: 기존 관심 삭제 → slaveId로 슬레이브 조회 → `UserInterestedExam` 일괄 저장
- `getForUser()`: `userInterestedExamRepository.findByUser()` → 슬레이브 이름 추출 → `examType IN (names)` 필터

#### `AuthService.java`
- `UserInterestedExamRepository` 의존성 추가
- `login()`, `refresh()`, `me()`: `UserResponse.from(user, interests)` 호출로 관심 시험 포함

### 복원 방법

HIST-20260505-015 복원 시:
- `UserInterestedExam.java`, `UserInterestedExamRepository.java` 삭제
- `User.java`: `interestedExamTypes` String 필드 복원, `completeOnboarding(String)`, `updateInterests(String)` 메서드 복원
- `OnboardingRequest.java`: `List<Long> slaveIds` → `List<String> examTypes`
- `UserResponse.java`: `interestedExamSlaveIds` 제거, `from(User)` 단일 팩토리 복원 (String split 방식)
- `DomainSlaveRepository.java`: `findByMasterCode()` 제거
- `ExamInfoService.java`: `UserInterestedExamRepository`, `DomainSlaveRepository` 제거; `getExamTypes()`, `saveInterests()` 제거; 기존 String 기반 로직 복원
- `AuthService.java`: `UserInterestedExamRepository` 제거; `UserResponse.from(user)` 단일 인자 형태로 복원
- `UserExamInfoController.java`: `GET /exam-types` 엔드포인트 제거
