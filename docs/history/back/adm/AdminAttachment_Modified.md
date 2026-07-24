## HIST-20260724-001

- **날짜**: 2026-07-24
- **수정 범위**: 관리자 백엔드 / 첨부파일 관리
- **수정 개요**: `docs/deployment-guide.md` §4-2 배포 전 보안 점검 "중요" 이슈 ⑤ 대응 — 이미지 업로드 시 MIME(스푸핑 가능한 클라이언트 헤더)만이 아니라 저장 확장자 자체도 화이트리스트로 검증

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/AttachmentService.java` | 수정 | `ALLOWED_IMAGE_EXTENSIONS` 상수 추가 + `saveImage()`에서 확장자 화이트리스트 검증 추가 |

### 수정 상세

#### `backend/src/main/java/com/tpmp/testprep/service/AttachmentService.java`
- **배경**: `saveImage()`는 `Content-Type` 헤더(`ALLOWED_IMAGE_MIME`)만 검사했는데, 이는 클라이언트가 임의로 지정 가능한 값이라 스푸핑될 수 있다. 저장 확장자는 원본 파일명에서 화이트리스트 없이 그대로 추출했다. `/uploads/**`가 `SecurityConfig`에서 permitAll로 정적 서빙되므로, MIME을 `image/jpeg`로 위장하고 파일명만 `evil.svg`로 업로드하면 `.svg`로 저장되어 stored XSS 벡터가 될 수 있었다. 이 서비스에는 `saveImage()` 외 다른 파일 저장 메서드가 없어(전체 84줄 확인) 이미지 확장자 화이트리스트만 추가하면 충분함을 확인함.
- **변경 전**:
  ```java
  private static final List<String> ALLOWED_IMAGE_MIME =
          List.of("image/jpeg", "image/png", "image/gif", "image/webp");

  @Transactional
  public Attachment saveImage(MultipartFile file, Attachment.RefType refType) {
      if (file.isEmpty()) throw new BusinessException(ErrorCode.INVALID_INPUT);
      String mime = file.getContentType();
      if (mime == null || !ALLOWED_IMAGE_MIME.contains(mime))
          throw new BusinessException(ErrorCode.UNSUPPORTED_FILE_TYPE);

      String original = file.getOriginalFilename();
      String ext = (original != null && original.contains("."))
              ? original.substring(original.lastIndexOf('.') + 1).toLowerCase()
              : "jpg";

      String storedFilename = UUID.randomUUID() + "." + ext;
  ```
- **변경 후**:
  ```java
  private static final List<String> ALLOWED_IMAGE_MIME =
          List.of("image/jpeg", "image/png", "image/gif", "image/webp");

  private static final List<String> ALLOWED_IMAGE_EXTENSIONS =
          List.of("jpg", "jpeg", "png", "gif", "webp");

  @Transactional
  public Attachment saveImage(MultipartFile file, Attachment.RefType refType) {
      if (file.isEmpty()) throw new BusinessException(ErrorCode.INVALID_INPUT);
      String mime = file.getContentType();
      if (mime == null || !ALLOWED_IMAGE_MIME.contains(mime))
          throw new BusinessException(ErrorCode.UNSUPPORTED_FILE_TYPE);

      String original = file.getOriginalFilename();
      String ext = (original != null && original.contains("."))
              ? original.substring(original.lastIndexOf('.') + 1).toLowerCase()
              : "jpg";
      if (!ALLOWED_IMAGE_EXTENSIONS.contains(ext))
          throw new BusinessException(ErrorCode.UNSUPPORTED_FILE_TYPE);

      String storedFilename = UUID.randomUUID() + "." + ext;
  ```
- **이유**: MIME 검사(기존)를 유지한 채 확장자 화이트리스트를 추가 방어선으로 병행. `evil.svg`처럼 MIME은 위장했지만 확장자가 화이트리스트 밖이면 `UNSUPPORTED_FILE_TYPE`으로 거부되어 `.svg` 등 비이미지 확장자로 저장되는 stored XSS 경로를 차단한다.

### 복원 방법

이 ID(HIST-20260724-001)만으로 복원 시 `AttachmentService.java`에서 `ALLOWED_IMAGE_EXTENSIONS` 상수와 `saveImage()`의 확장자 검증 블록(`if (!ALLOWED_IMAGE_EXTENSIONS.contains(ext)) ...`)을 제거해 "변경 전" 상태로 되돌린다.

## HIST-20260426-001

- **날짜**: 2026-04-26
- **수정 범위**: 관리자 백엔드 / 첨부파일 관리
- **수정 개요**: 이미지를 별도 첨부파일 테이블(attachments)에 저장하는 공통 서비스 신규 구현, QuestionBankService의 직접 파일 IO를 AttachmentService로 위임

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `entity/Attachment.java` | 추가 | 첨부파일 엔티티 신규 생성 (attachments 테이블) |
| `repository/AttachmentRepository.java` | 추가 | 첨부파일 Repository 신규 생성 |
| `dto/response/AttachmentResponse.java` | 추가 | 첨부파일 응답 DTO 신규 생성 |
| `service/AttachmentService.java` | 추가 | 이미지 저장·연결·조회 공통 서비스 신규 생성 |
| `service/QuestionBankService.java` | 수정 | uploadImage() 직접 파일 IO → AttachmentService 위임 |

### 수정 상세

#### `entity/Attachment.java`
- **변경 전**: 파일 없음
- **변경 후**: 신규 생성
  ```java
  @Entity @Table(name = "attachments")
  public class Attachment {
      @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
      private Long id;
      private String originalFilename;
      private String storedFilename;
      private String fileUrl;
      private Long fileSize;
      private String mimeType;
      @Enumerated(EnumType.STRING)
      private RefType refType;
      private Long refId;
      private LocalDateTime createdAt;

      public void linkTo(Long refId) { this.refId = refId; }

      public enum RefType { INQUIRY, QUESTION_BANK }
  }
  ```

#### `service/AttachmentService.java`
- **변경 전**: 파일 없음
- **변경 후**: 신규 생성
  ```java
  @Service
  @RequiredArgsConstructor
  public class AttachmentService {
      private final AttachmentRepository attachmentRepository;
      @Value("${app.upload.path}") private String uploadPath;

      private static final Set<String> ALLOWED_MIME = Set.of(
          "image/jpeg", "image/png", "image/gif", "image/webp");

      @Transactional
      public Attachment saveImage(MultipartFile file, Attachment.RefType refType) {
          // 확장자 검증, UUID 파일명 생성, 물리 파일 저장, Attachment 레코드 저장
      }

      @Transactional
      public void linkAttachments(List<Long> ids, Long refId) {
          attachmentRepository.findAllById(ids).forEach(a -> a.linkTo(refId));
      }

      public List<Attachment> findByRef(Attachment.RefType refType, Long refId) {
          return attachmentRepository.findByRefTypeAndRefId(refType, refId);
      }

      public List<Attachment> findByIds(List<Long> ids) {
          if (ids == null || ids.isEmpty()) return List.of();
          return attachmentRepository.findAllById(ids);
      }
  }
  ```

#### `service/QuestionBankService.java`
- **변경 전**: uploadImage() 직접 파일 처리 (약 30줄)
  ```java
  @Value("${app.upload.path}") private String uploadPath;

  private static final Set<String> ALLOWED_IMAGE_MIME = Set.of(
      "image/jpeg", "image/png", "image/gif", "image/webp");

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
  - 의존 필드: `@Value("${app.upload.path}") private String uploadPath` (생성자 주입 없이 @Value)
  - `AttachmentService` 의존성 없음

- **변경 후**: AttachmentService 위임 (3줄)
  ```java
  private final AttachmentService attachmentService;

  @Transactional
  public String uploadImage(MultipartFile image) {
      Attachment attachment = attachmentService.saveImage(image, Attachment.RefType.QUESTION_BANK);
      return attachment.getFileUrl();
  }
  ```
- **이유**: 파일 저장 로직을 AttachmentService로 집중, QuestionBankService에서 중복 제거

### 복원 방법

HIST-20260426-001 복원 시:
- `Attachment.java`, `AttachmentRepository.java`, `AttachmentResponse.java`, `AttachmentService.java` 삭제
- `QuestionBankService.java`: `attachmentService` 의존성 제거, 위의 "변경 전" `uploadImage()` 직접 구현으로 복원, `@Value("${app.upload.path}") private String uploadPath` + `ALLOWED_IMAGE_MIME` Set 복원
