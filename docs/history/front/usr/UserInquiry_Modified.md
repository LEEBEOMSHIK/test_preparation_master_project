## HIST-20260426-002

- **날짜**: 2026-04-26
- **수정 범위**: 사용자 프론트엔드 / 1:1 문의
- **수정 개요**: 문의 이미지 업로드 응답을 `{id, url}` 구조로 변경 — 제출 시 imageUrls 대신 attachmentIds 전송, types/index.ts에 신규 타입 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/inquiryService.ts` | 수정 | `InquiryRequest.imageUrls` → `attachmentIds: number[]`, `UploadImageResult {id, url}` 인터페이스 추가, uploadImage 응답 타입 변경 |
| `frontend/src/app/user/inquiries/new/page.tsx` | 수정 | `imageUrls: string[]` 상태 → `uploadedImages: {id, url}[]` 상태로 변경, 제출 시 attachmentIds 전송 |
| `frontend/src/types/index.ts` | 수정 | Attachment, PermissionMaster, PermissionDetail, MenuConfig 타입 추가 |

### 수정 상세

#### `services/inquiryService.ts`
- **변경 전**:
  ```typescript
  export interface InquiryRequest {
    title: string;
    content: string;
    inquiryType: InquiryType;
    imageUrls: string[];
  }

  // UploadImageResult 인터페이스 없음

  uploadImage: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return apiClient.post<ApiResponse<{ url: string }>>('/user/inquiries/images', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  ```
- **변경 후**:
  ```typescript
  export interface InquiryRequest {
    title: string;
    content: string;
    inquiryType: InquiryType;
    attachmentIds: number[];
  }

  export interface UploadImageResult {
    id: number;
    url: string;
  }

  uploadImage: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return apiClient.post<ApiResponse<UploadImageResult>>('/user/inquiries/images', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  ```
- **이유**: 백엔드가 attachment ID를 반환하므로 프론트엔드도 ID를 보존해야 문의 등록 시 attachmentIds로 전송 가능

#### `app/user/inquiries/new/page.tsx`
- **변경 전**:
  ```typescript
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // 업로드 핸들러 내부:
  const url = res.data.data?.url;
  if (url) setImageUrls((prev) => [...prev, url]);

  // 제출 시:
  await inquiryService.create({
    title: title.trim(),
    content: content.trim(),
    inquiryType,
    imageUrls,
  });

  // 이미지 미리보기:
  {imageUrls.map((url, idx) => (
    <div key={url} className="relative w-20 h-20 ...">
      <img src={url} alt={`첨부 이미지 ${idx + 1}`} />
      <button onClick={() => removeImage(idx)}>×</button>
    </div>
  ))}
  ```
- **변경 후**:
  ```typescript
  interface UploadedImage { id: number; url: string; }
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  // 업로드 핸들러 내부:
  if (res.data.success && res.data.data) {
    setUploadedImages((prev) => [...prev, { id: res.data.data!.id, url: res.data.data!.url }]);
  }

  // 제출 시:
  await inquiryService.create({
    title: title.trim(),
    content: content.trim(),
    inquiryType,
    attachmentIds: uploadedImages.map((img) => img.id),
  });

  // 이미지 미리보기:
  {uploadedImages.map((img, idx) => (
    <div key={img.id} className="relative w-20 h-20 ...">
      <img src={img.url} alt={`첨부 이미지 ${idx + 1}`} />
      <button onClick={() => removeImage(idx)}>×</button>
    </div>
  ))}
  ```
- **이유**: 업로드 시 서버로부터 받은 attachment ID를 보존해야 문의 등록 시 첨부파일 테이블에 연결 가능

### 복원 방법

HIST-20260426-002 복원 시:
- `inquiryService.ts`:
  - `InquiryRequest.attachmentIds: number[]` → `imageUrls: string[]`
  - `UploadImageResult` 인터페이스 삭제
  - `uploadImage()` 반환 타입 `ApiResponse<{ url: string }>`로 복원
- `new/page.tsx`:
  - `uploadedImages: UploadedImage[]` 상태 → `imageUrls: string[]` 상태로 복원
  - 업로드 핸들러: `res.data.data?.url` 저장으로 복원
  - 제출: `imageUrls` 필드 전송으로 복원
  - 미리보기: `key={url}` 기반 렌더링으로 복원

---

## HIST-20260422-006

- **날짜**: 2026-04-22
- **수정 범위**: 사용자 프론트엔드 / 1:1 문의 + FAQ
- **수정 개요**: 1:1 문의 목록·등록·상세 페이지 전면 구현, FAQ 페이지(아코디언) 신규 추가, 레이아웃에 FAQ 메뉴 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `InquiryStatus`에 `ON_HOLD` 추가, `InquiryType` 추가, `INQUIRY_STATUS_LABEL`/`INQUIRY_TYPE_LABEL` 상수 추가, `Inquiry` 인터페이스 확장, `Faq` 인터페이스 추가 |
| `frontend/src/services/inquiryService.ts` | 추가 | 사용자/관리자 문의 API + 이미지 업로드 서비스 |
| `frontend/src/services/faqService.ts` | 추가 | 사용자/관리자 FAQ API 서비스 |
| `frontend/src/app/user/inquiries/page.tsx` | 수정 | 플레이스홀더 → 상태 탭 필터 + 페이징 + 목록 테이블 |
| `frontend/src/app/user/inquiries/new/page.tsx` | 추가 | 문의 등록 폼 (유형 선택, 제목, 내용, 이미지 최대 3개) |
| `frontend/src/app/user/inquiries/[id]/page.tsx` | 추가 | 문의 상세 (이미지·답변 표시, PENDING만 삭제 버튼) |
| `frontend/src/app/user/faq/page.tsx` | 추가 | FAQ 아코디언 목록 |
| `frontend/src/components/layout/UserLayoutShell.tsx` | 수정 | NAV_ITEMS에 `FAQ` 항목 추가 (`/user/faq`) |

### 수정 상세

#### `types/index.ts`
- 변경 전: `InquiryStatus = 'PENDING' | 'ANSWERED'`, `Inquiry` 기본 필드만
- 변경 후: `InquiryStatus = 'PENDING' | 'ON_HOLD' | 'ANSWERED'`, `InquiryType` 유니온, 레이블 상수, `Faq` 인터페이스 추가

#### `user/inquiries/page.tsx`
- 변경 전: "준비 중입니다." 플레이스홀더
- 변경 후: 상태 탭 필터(전체/답변 대기/답변 보류/답변 완료), 페이지 크기(10/20/50), 테이블 목록, "+ 문의 등록" 버튼

#### `user/inquiries/new/page.tsx` (신규)
- 문의 유형 select (시험/개념노트/데일리 퀴즈/기타)
- 제목(maxLength 200) + 내용 입력
- 이미지 첨부: 최대 3개, 업로드 즉시 미리보기, ×로 제거

#### `user/inquiries/[id]/page.tsx` (신규)
- 유형·상태 배지, 등록일 표시
- 이미지 썸네일 클릭 시 원본 새 탭 열기
- 답변 완료 시 관리자 답변 파란 박스로 표시
- PENDING 상태에서만 "문의 삭제" 버튼 표시

#### `user/faq/page.tsx` (신규)
- Q/A 아코디언 형식, 클릭 시 화살표 회전 + 답변 펼치기

### 복원 방법

HIST-20260422-006 복원 시:
- `types/index.ts` Inquiry/FAQ 관련 변경 사항 이전 상태로 복원
- `user/inquiries/page.tsx`를 플레이스홀더로 복원
- `user/inquiries/new/page.tsx`, `user/inquiries/[id]/page.tsx`, `user/faq/page.tsx` 삭제
- `inquiryService.ts`, `faqService.ts` 삭제
- `UserLayoutShell.tsx`에서 FAQ NAV_ITEMS 제거
