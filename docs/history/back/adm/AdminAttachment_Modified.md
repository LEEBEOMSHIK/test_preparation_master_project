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
