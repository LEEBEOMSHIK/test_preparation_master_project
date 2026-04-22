## HIST-20260422-006

- **날짜**: 2026-04-22
- **수정 범위**: 사용자/관리자 백엔드 / 1:1 문의 + FAQ
- **수정 개요**: 1:1 문의 시스템 전면 구현(문의 유형·보류 상태·이미지 첨부) 및 FAQ 신규 도입

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/Inquiry.java` | 수정 | `InquiryType` enum 추가, `Status`에 `ON_HOLD` 추가, `imageUrls` 필드 추가, `toggleHold()` 메서드 추가 |
| `backend/src/main/java/com/tpmp/testprep/repository/InquiryRepository.java` | 수정 | `findByUserIdAndStatus` 메서드 추가 |
| `backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java` | 수정 | `INQUIRY_ACCESS_DENIED`, `FAQ_NOT_FOUND` 코드 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/request/InquiryRequest.java` | 추가 | 문의 등록 요청 DTO (title, content, inquiryType, imageUrls) |
| `backend/src/main/java/com/tpmp/testprep/dto/request/InquiryReplyRequest.java` | 추가 | 관리자 답변 요청 DTO |
| `backend/src/main/java/com/tpmp/testprep/dto/response/InquiryResponse.java` | 추가 | 문의 응답 DTO (imageUrls 파싱, userId/userName 포함) |
| `backend/src/main/java/com/tpmp/testprep/service/InquiryService.java` | 추가 | 사용자/관리자 문의 CRUD + 이미지 업로드 |
| `backend/src/main/java/com/tpmp/testprep/controller/UserInquiryController.java` | 추가 | `/api/user/inquiries` — 목록·상세·등록·삭제·이미지 업로드 |
| `backend/src/main/java/com/tpmp/testprep/controller/AdminInquiryController.java` | 추가 | `/api/admin/inquiries` — 전체 목록·답변·보류 토글 |
| `backend/src/main/java/com/tpmp/testprep/entity/Faq.java` | 추가 | FAQ 엔티티 (question, answer, isActive, displayOrder) |
| `backend/src/main/java/com/tpmp/testprep/repository/FaqRepository.java` | 추가 | `findByIsActiveTrueOrderByDisplayOrderAscCreatedAtAsc` |
| `backend/src/main/java/com/tpmp/testprep/dto/request/FaqRequest.java` | 추가 | FAQ 등록/수정 요청 DTO |
| `backend/src/main/java/com/tpmp/testprep/dto/response/FaqResponse.java` | 추가 | FAQ 응답 DTO |
| `backend/src/main/java/com/tpmp/testprep/service/FaqService.java` | 추가 | 활성 FAQ 조회, 관리자 CRUD, 공개전환 |
| `backend/src/main/java/com/tpmp/testprep/controller/UserFaqController.java` | 추가 | `GET /api/user/faq` — 공개 FAQ 목록 |
| `backend/src/main/java/com/tpmp/testprep/controller/AdminFaqController.java` | 추가 | `/api/admin/faq` — 전체 목록·등록·수정·공개전환·삭제 |
| `backend/src/main/java/com/tpmp/testprep/config/SecurityConfig.java` | 수정 | CORS allowedMethods에 `PATCH` 추가 |

### 수정 상세

#### `Inquiry.java`
- 변경 전: `Status` = {PENDING, ANSWERED}, `imageUrls` 없음
- 변경 후: `InquiryType` enum {EXAM, CONCEPT_NOTE, DAILY_QUIZ, OTHER}, `Status` = {PENDING, ON_HOLD, ANSWERED}, `imageUrls TEXT` 필드, `toggleHold()` 메서드

#### `InquiryService.java`
- 변경 전: 파일 없음
- 변경 후:
  - `getMyInquiries(email, status, pageable)` — 본인 문의 목록 (상태 필터)
  - `create(request, email)` — 문의 등록, imageUrls comma-join
  - `delete(id, email)` — PENDING 상태만 삭제 허용
  - `uploadImage(file)` — /uploads/images 저장
  - `adminGetAll(status, pageable)`, `adminReply`, `adminToggleHold`

#### `Faq.java` (신규)
- question, answer, isActive, displayOrder 필드
- `toggleActive()`, `update()` 메서드

### API 엔드포인트 (신규)

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/user/inquiries` | 내 문의 목록 (상태 필터, 페이징) |
| GET | `/api/user/inquiries/{id}` | 내 문의 상세 |
| POST | `/api/user/inquiries` | 문의 등록 |
| DELETE | `/api/user/inquiries/{id}` | 문의 삭제 (PENDING만) |
| POST | `/api/user/inquiries/images` | 이미지 업로드 |
| GET | `/api/admin/inquiries` | 전체 문의 목록 |
| PUT | `/api/admin/inquiries/{id}/reply` | 답변 등록 (→ ANSWERED) |
| PATCH | `/api/admin/inquiries/{id}/hold` | 보류 토글 (PENDING↔ON_HOLD) |
| GET | `/api/user/faq` | 공개 FAQ 목록 |
| GET | `/api/admin/faq` | 전체 FAQ 목록 |
| POST | `/api/admin/faq` | FAQ 등록 |
| PUT | `/api/admin/faq/{id}` | FAQ 수정 |
| PATCH | `/api/admin/faq/{id}/toggle-active` | 공개 전환 |
| DELETE | `/api/admin/faq/{id}` | FAQ 삭제 |

### 복원 방법

HIST-20260422-006 복원 시:
- `Inquiry.java`에서 `InquiryType` 제거, `Status.ON_HOLD` 제거, `imageUrls` 제거, `toggleHold()` 제거
- `InquiryRepository.java`에서 `findByUserIdAndStatus` 제거
- `ErrorCode.java`에서 `INQUIRY_ACCESS_DENIED`, `FAQ_NOT_FOUND` 제거
- `InquiryRequest.java`, `InquiryReplyRequest.java`, `InquiryResponse.java`, `InquiryService.java`, `UserInquiryController.java`, `AdminInquiryController.java` 삭제
- `Faq.java`, `FaqRepository.java`, `FaqRequest.java`, `FaqResponse.java`, `FaqService.java`, `UserFaqController.java`, `AdminFaqController.java` 삭제
- `SecurityConfig.java` allowedMethods에서 `PATCH` 제거
