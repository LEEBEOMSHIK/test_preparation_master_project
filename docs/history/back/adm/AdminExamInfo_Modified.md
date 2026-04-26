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
