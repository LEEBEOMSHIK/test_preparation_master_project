## HIST-20260426-008

- **날짜**: 2026-04-26
- **수정 범위**: 사용자 백엔드 / 1:1 문의
- **수정 개요**: 이미지 URL 직접 처리 → 첨부파일 테이블(attachments) 연동으로 전환 — InquiryRequest.imageUrls → attachmentIds, InquiryService.uploadImage() → AttachmentService 위임, Controller 응답 `{url}` → `{id, url}`

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `dto/request/InquiryRequest.java` | 수정 | `imageUrls: List<String>` → `attachmentIds: List<Long>` |
| `dto/response/InquiryResponse.java` | 수정 | `fromWithUrls()` 정적 팩토리 추가, `from()`이 내부 위임하도록 변경 |
| `service/InquiryService.java` | 수정 | `AttachmentService` 주입, `uploadImage()` 반환 타입 `UploadResult` 레코드로 변경, `create()` attachmentIds 처리, `toResponse()` 첨부파일 테이블 우선 조회 |
| `controller/UserInquiryController.java` | 수정 | `uploadImage` 반환 타입 `Map<String,String>` → `Map<String,Object>`, 응답 `{url}` → `{id, url}` |

### 수정 상세

#### `dto/request/InquiryRequest.java`
- **변경 전**:
  ```java
  public record InquiryRequest(
          @NotBlank @Size(max = 200) String title,
          @NotBlank String content,
          @NotNull Inquiry.InquiryType inquiryType,
          @Size(max = 3) List<String> imageUrls
  ) {}
  ```
- **변경 후**:
  ```java
  public record InquiryRequest(
          @NotBlank @Size(max = 200) String title,
          @NotBlank String content,
          @NotNull Inquiry.InquiryType inquiryType,
          @Size(max = 3) List<Long> attachmentIds
  ) {}
  ```
- **이유**: 프론트엔드가 업로드 직후 받은 attachment ID를 전송, 서버는 ID로 첨부파일 테이블에서 조회·연결

#### `dto/response/InquiryResponse.java`
- **변경 전**: `from(Inquiry)` 단일 팩토리만 존재
  ```java
  public static InquiryResponse from(Inquiry inquiry) {
      List<String> urls = (inquiry.getImageUrls() != null && !inquiry.getImageUrls().isBlank())
              ? Arrays.stream(inquiry.getImageUrls().split(","))
                      .map(String::trim).filter(s -> !s.isEmpty()).toList()
              : Collections.emptyList();
      return new InquiryResponse(
              inquiry.getId(), inquiry.getTitle(), inquiry.getContent(),
              inquiry.getStatus().name(), inquiry.getInquiryType().name(), urls,
              inquiry.getReply(), inquiry.getRepliedAt(), inquiry.getCreatedAt(),
              inquiry.getUser().getId(), inquiry.getUser().getName());
  }
  ```
- **변경 후**: `fromWithUrls()` 정적 팩토리 추가, `from()`은 내부적으로 `fromWithUrls()` 호출
  ```java
  public static InquiryResponse from(Inquiry inquiry) {
      List<String> urls = (inquiry.getImageUrls() != null && !inquiry.getImageUrls().isBlank())
              ? Arrays.stream(inquiry.getImageUrls().split(","))
                      .map(String::trim).filter(s -> !s.isEmpty()).toList()
              : Collections.emptyList();
      return fromWithUrls(inquiry, urls);
  }

  public static InquiryResponse fromWithUrls(Inquiry inquiry, List<String> imageUrls) {
      return new InquiryResponse(
              inquiry.getId(), inquiry.getTitle(), inquiry.getContent(),
              inquiry.getStatus().name(), inquiry.getInquiryType().name(), imageUrls,
              inquiry.getReply(), inquiry.getRepliedAt(), inquiry.getCreatedAt(),
              inquiry.getUser().getId(), inquiry.getUser().getName());
  }
  ```
- **이유**: InquiryService.toResponse()에서 외부에서 구성한 imageUrls를 주입할 수 있도록 팩토리 분리

#### `service/InquiryService.java`
- **변경 전**:
  - `@Value("${app.upload.path}") private String uploadPath` 필드 존재
  - `ALLOWED_IMAGE_MIME` Set 상수 존재
  - `create()`: `request.imageUrls()`를 comma-join하여 `Inquiry.imageUrls` TEXT 필드에 저장
  - `uploadImage()`: 직접 파일 IO (UUID 파일명, `/uploads/images/` 저장, URL 반환)
  - `toResponse()`: `InquiryResponse.from(inquiry)` 단순 호출 (legacy TEXT 파싱)
  ```java
  public String uploadImage(MultipartFile image) {
      if (image.isEmpty()) throw new BusinessException(ErrorCode.INVALID_INPUT);
      String mime = image.getContentType();
      if (mime == null || !ALLOWED_IMAGE_MIME.contains(mime))
          throw new BusinessException(ErrorCode.UNSUPPORTED_FILE_TYPE);
      String origName = image.getOriginalFilename();
      String ext = (origName != null && origName.contains("."))
              ? origName.substring(origName.lastIndexOf('.') + 1).toLowerCase() : "jpg";
      String filename = UUID.randomUUID() + "." + ext;
      Path dest = Paths.get(uploadPath, "images", filename);
      try {
          Files.createDirectories(dest.getParent());
          image.transferTo(dest);
      } catch (IOException e) {
          throw new BusinessException(ErrorCode.FILE_PARSE_FAILED);
      }
      return "/uploads/images/" + filename;
  }
  ```
- **변경 후**:
  - `attachmentService` 의존성 주입 (`final AttachmentService attachmentService`)
  - `@Value`, `ALLOWED_IMAGE_MIME` 제거
  - `create()`: `attachmentIds`로 첨부파일 조회 → URL comma-join → `Inquiry.imageUrls` TEXT 저장 후, `linkAttachments()`로 attachments.refId 업데이트
  - `UploadResult(Long id, String url)` 내부 레코드 정의
  - `uploadImage()`: AttachmentService에 위임, `UploadResult` 반환
  - `toResponse()`: 첨부파일 테이블 우선 조회, 없으면 legacy TEXT 폴백
  ```java
  public record UploadResult(Long id, String url) {}

  @Transactional
  public UploadResult uploadImage(MultipartFile image) {
      Attachment attachment = attachmentService.saveImage(image, Attachment.RefType.INQUIRY);
      return new UploadResult(attachment.getId(), attachment.getFileUrl());
  }

  private InquiryResponse toResponse(Inquiry inquiry) {
      List<Attachment> attachments = attachmentService.findByRef(Attachment.RefType.INQUIRY, inquiry.getId());
      List<String> imageUrls;
      if (!attachments.isEmpty()) {
          imageUrls = attachments.stream().map(Attachment::getFileUrl).toList();
      } else if (inquiry.getImageUrls() != null && !inquiry.getImageUrls().isBlank()) {
          imageUrls = Arrays.stream(inquiry.getImageUrls().split(","))
                  .map(String::trim).filter(s -> !s.isEmpty()).toList();
      } else {
          imageUrls = List.of();
      }
      return InquiryResponse.fromWithUrls(inquiry, imageUrls);
  }
  ```

#### `controller/UserInquiryController.java`
- **변경 전**:
  ```java
  @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(
          @RequestPart("image") MultipartFile image) {
      String url = inquiryService.uploadImage(image);
      return ResponseEntity.ok(ApiResponse.success(Map.of("url", url)));
  }
  ```
- **변경 후**:
  ```java
  @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<ApiResponse<Map<String, Object>>> uploadImage(
          @RequestPart("image") MultipartFile image) {
      InquiryService.UploadResult result = inquiryService.uploadImage(image);
      return ResponseEntity.ok(ApiResponse.success(Map.of("id", result.id(), "url", result.url())));
  }
  ```
- **이유**: 프론트엔드가 attachment ID를 저장해 두었다가 문의 등록 시 `attachmentIds`로 전송하기 위해 `id` 필드 추가

### 복원 방법

HIST-20260426-008 복원 시:
- `InquiryRequest.java`: `attachmentIds: List<Long>` → `imageUrls: List<String>` 복원
- `InquiryResponse.java`: `fromWithUrls()` 메서드 제거, `from()` 단독 팩토리로 복원 (URL 파싱 로직 `from()` 내부에 포함)
- `InquiryService.java`:
  - `attachmentService` 의존성 제거
  - `@Value("${app.upload.path}") private String uploadPath` + `ALLOWED_IMAGE_MIME` 상수 복원
  - `UploadResult` 레코드 제거
  - `uploadImage()` 직접 파일 IO 구현으로 복원 (위의 "변경 전" 코드)
  - `create()`: `request.attachmentIds()` → `request.imageUrls()` comma-join으로 복원
  - `toResponse()`: `InquiryResponse.from(inquiry)` 단순 호출로 복원
- `UserInquiryController.java`: `uploadImage()` 반환 타입 `Map<String,String>`, 응답 `Map.of("url", url)` 복원

---

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
