## HIST-20260624-001

- **날짜**: 2026-06-24
- **수정 범위**: 관리자 백엔드 / 시험 정보
- **수정 개요**: ExamInfo에 원서접수 URL(`applicationUrl`) 필드 추가 — officialUrl 패턴 미러링

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/ExamInfo.java` | 수정 | `application_url` 컬럼 필드 추가, 빌더/update 메서드 파라미터에 applicationUrl 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/request/ExamInfoRequest.java` | 수정 | record에 `@Size(max=500) String applicationUrl` 필드 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/ExamInfoResponse.java` | 수정 | record에 `String applicationUrl` 필드 추가, `from()`에서 `e.getApplicationUrl()` 매핑 |
| `backend/src/main/java/com/tpmp/testprep/service/ExamInfoService.java` | 수정 | `create()` 빌더, `update()` 호출에 `applicationUrl` 추가 |
| `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java` | 수정 | `ensureExamInfo()` 시그니처에 `applicationUrl` 파라미터 추가, 기존 3개 호출부에 `null` 전달 |

### 수정 상세

#### `entity/ExamInfo.java`
- 변경 전: `officialUrl` 필드 바로 다음에 `isActive` 필드
- 변경 후: `@Column(name = "application_url", length = 500) private String applicationUrl;` 삽입, 빌더 생성자와 `update()` 메서드 파라미터에 `String applicationUrl` 추가 및 할당 (`ddl-auto=update`로 컬럼 자동 생성)
- 이유: 원서접수 사이트 URL을 별도 필드로 관리, officialUrl(상시 공식 홈페이지)과 명확히 분리

#### `dto/request/ExamInfoRequest.java`
- 변경 전: `officialUrl` 다음 바로 `isActive`, `displayOrder`
- 변경 후: `@Size(max = 500) String applicationUrl` 필드를 `officialUrl` 바로 다음에 추가

#### `dto/response/ExamInfoResponse.java`
- 변경 전: record 필드 `officialUrl, isActive, displayOrder, createdAt, updatedAt`, `from()`에서 10개 인자
- 변경 후: `applicationUrl` 필드 추가 (officialUrl 다음), `from()`에 `e.getApplicationUrl()` 인자 추가

#### `service/ExamInfoService.java`
- 변경 전: `create()` builder에 `.officialUrl()` 다음 바로 `.isActive()`, `update()` 호출 9개 인자
- 변경 후: `.applicationUrl(request.applicationUrl())` 추가, `update()` 호출에 `request.applicationUrl()` 추가

#### `config/DataInitializer.java`
- 변경 전: `ensureExamInfo()` 8개 파라미터 (officialUrl, displayOrder 포함)
- 변경 후: `String applicationUrl` 파라미터 추가(9개), 기존 3개 호출부에 `null` 전달 (시드 데이터는 접수 URL 미확정)

### 복원 방법
HIST-20260624-001 복원 시:
- `ExamInfo.java`: `applicationUrl` 필드 제거, 빌더/update 파라미터에서 제거
- `ExamInfoRequest.java`: `applicationUrl` record 필드 제거
- `ExamInfoResponse.java`: `applicationUrl` record 필드 및 `from()` 인자 제거
- `ExamInfoService.java`: builder `.applicationUrl()` 제거, `update()` 호출 인자에서 제거
- `DataInitializer.java`: `ensureExamInfo()` 파라미터 `applicationUrl` 제거, 3개 호출부 `null` 인자 제거
- DB: `ALTER TABLE exam_info DROP COLUMN application_url;` (필요 시)

---

## HIST-20260602-001

- **날짜**: 2026-06-02
- **수정 범위**: 관리자 백엔드 / 시험 정보
- **수정 개요**: Q-Net 정보처리기사 실기 2026년 시험정보를 애플리케이션 시작 시 `exam_info` 테이블에 자동 시드하도록 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java` | 수정 | 정보처리기사 실기 2026년 정기 기사 1~3회 시험정보 자동 삽입 로직 추가 |
| `backend/src/main/java/com/tpmp/testprep/repository/ExamInfoRepository.java` | 수정 | 중복 삽입 방지를 위한 `findByTitle` 조회 메서드 추가 |
| `backend/src/test/java/com/tpmp/testprep/config/DataInitializerTest.java` | 추가 | Q-Net 시험정보 시드 생성 및 중복 방지 동작 테스트 추가 |

### 수정 상세

#### `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java`
- 변경 전: 앱 시작 시 시험 정보 메뉴만 보정하고, Q-Net 기반 시험정보 데이터는 자동 삽입하지 않음
- 변경 후: `ensureQnetPracticalExamInfo()`를 실행해 정보처리기사 실기 2026년 정기 기사 1~3회 행을 `exam_info`에 삽입
- 이유: 관리자 수동 입력 없이도 Q-Net에서 확인한 실기 접수기간, 시험일정, 발표일, 과목/검정방법/합격기준/출제경향 요약을 시스템 DB에 반영하기 위함

#### `backend/src/main/java/com/tpmp/testprep/repository/ExamInfoRepository.java`
- 변경 전: 목록 조회용 메서드만 존재해 특정 제목의 기존 데이터 존재 여부를 확인할 수 없음
- 변경 후: `Optional<ExamInfo> findByTitle(String title)` 추가
- 이유: 동일 시험정보가 애플리케이션 재시작마다 중복 생성되지 않도록 하기 위함

#### `backend/src/test/java/com/tpmp/testprep/config/DataInitializerTest.java`
- 변경 전: `DataInitializer`의 시험정보 시드 동작을 검증하는 테스트 없음
- 변경 후: 신규 행 3건 생성과 기존 제목 중복 생성 방지를 검증
- 이유: Q-Net 시험정보 시드 데이터가 유지되고 중복 삽입되지 않도록 회귀 테스트를 확보하기 위함

### 복원 방법

HIST-20260602-001 복원 시:
- `DataInitializer.java`: `examInfoRepository` 필드, `run()`의 `ensureQnetPracticalExamInfo()` 호출, `ensureQnetPracticalExamInfo()`/`ensureExamInfo()` 메서드 제거
- `ExamInfoRepository.java`: `findByTitle(String title)` 메서드와 `Optional` import 제거
- `DataInitializerTest.java`: 파일 삭제
- DB: 필요 시 `exam_info`에서 제목이 `정보처리기사 실기 2026년 정기 기사%`인 행 삭제

## HIST-20260427-001

- **날짜**: 2026-04-27
- **수정 범위**: 관리자/사용자 백엔드 / 시험 정보 + 온보딩
- **수정 개요**: 시험 정보 도메인 신규 구현 — ExamInfo 엔티티, 관리자 CRUD API, 사용자 조회/온보딩 API, User 엔티티에 첫 로그인 및 관심 시험 유형 필드 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `entity/User.java` | 수정 | `isFirstLogin: Boolean`, `interestedExamTypes: String` 필드 추가 + `completeOnboarding()`, `updateInterests()` 메서드 추가 |
| `dto/response/UserResponse.java` | 수정 | `isFirstLogin: boolean`, `interestedExamTypes: List<String>` 필드 추가 |
| `entity/ExamInfo.java` | 추가 | 시험 정보 엔티티 (examType, title, description, applicationPeriod, examSchedule, resultDate, officialUrl, isActive, displayOrder) |
| `repository/ExamInfoRepository.java` | 추가 | 활성화 필터, examType IN 필터 쿼리 메서드 |
| `dto/request/OnboardingRequest.java` | 추가 | `List<String> examTypes` |
| `dto/request/ExamInfoRequest.java` | 추가 | 시험 정보 관리자 CRUD 요청 DTO |
| `dto/response/ExamInfoResponse.java` | 추가 | 시험 정보 응답 DTO |
| `service/ExamInfoService.java` | 추가 | 관리자 CRUD + 사용자 조회 (관심 필터) + 온보딩/관심 업데이트 |
| `controller/AdminExamInfoController.java` | 추가 | `GET/POST/PUT/DELETE /api/admin/exam-info` |
| `controller/UserExamInfoController.java` | 추가 | `GET /api/user/exam-info`, `POST /api/user/onboarding`, `PUT /api/user/exam-info/interests` |
| `config/DataInitializer.java` | 수정 | `ensureExamInfoMenus()` 추가 — 관리자/사용자 시험 정보 메뉴 등록 |

### 수정 상세

#### `entity/User.java`
- **변경 전**: `isFirstLogin`, `interestedExamTypes` 없음
- **변경 후**: 두 필드 추가 (nullable)
  - `isFirstLogin = true` — 신규 회원가입 시 `@Builder`에서 자동 설정
  - `interestedExamTypes` — 쉼표 구분 시험 유형 문자열

#### `entity/ExamInfo.java` (신규)
- `exam_info` 테이블, `@PrePersist`/`@PreUpdate` 타임스탬프 자동 관리
- `update()` 메서드로 전체 필드 갱신

#### 신규 API 엔드포인트

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/admin/exam-info` | 전체 목록 (관리자) |
| POST | `/api/admin/exam-info` | 시험 정보 등록 |
| PUT | `/api/admin/exam-info/{id}` | 시험 정보 수정 |
| DELETE | `/api/admin/exam-info/{id}` | 시험 정보 삭제 |
| GET | `/api/user/exam-info` | 사용자 시험 정보 (관심 유형 필터) |
| POST | `/api/user/onboarding` | 첫 로그인 온보딩 — 관심 유형 저장 + isFirstLogin=false |
| PUT | `/api/user/exam-info/interests` | 관심 유형 업데이트 |

#### `DataInitializer`
- `ensureExamInfoMenus()`: `/admin/exam-info` (displayOrder:10), `/user/exam-info` (displayOrder:0) 미등록 시 추가

### 복원 방법

HIST-20260427-001 복원 시:
- `User.java`: `isFirstLogin`, `interestedExamTypes` 필드 제거, `completeOnboarding`/`updateInterests` 제거, `@Builder`에서 `isFirstLogin` 초기화 제거
- `UserResponse.java`: `isFirstLogin`, `interestedExamTypes` 제거, `from()` 복원
- `ExamInfo.java` 삭제
- `ExamInfoRepository.java` 삭제
- `OnboardingRequest.java` 삭제
- `ExamInfoRequest.java` 삭제
- `ExamInfoResponse.java` 삭제
- `ExamInfoService.java` 삭제
- `AdminExamInfoController.java` 삭제
- `UserExamInfoController.java` 삭제
- `DataInitializer.java`: `ensureExamInfoMenus()` 호출 및 메서드 제거
- DB: `exam_info` 테이블 DROP, `users.is_first_login` / `users.interested_exam_types` 컬럼 DROP
