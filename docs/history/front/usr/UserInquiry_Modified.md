## HIST-20260828-002

- **날짜**: 2026-08-28
- **수정 범위**: 사용자 프론트엔드 / 문의·요청 워크플로 최종 통합
- **수정 개요**: 사용자 문의·요청의 유형별 접수, 대화형 상세, 메시지 이미지 첨부, 빠른 버그 신고와 메뉴 표시명을 최종 계약으로 통합하고 실제 API payload 회귀 테스트를 보강했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/inquiries/new/page.tsx` | 수정 | 유형별 `requestType`·`targetArea`·`detailLocation` 접수와 시험 개설 조건부 입력 구현 |
| `frontend/src/app/user/inquiries/new/page.test.tsx` | 추가 | 다섯 유형의 최종 등록 payload literal 검증 |
| `frontend/src/app/user/inquiries/[id]/page.tsx` | 수정 | 상세 타임라인과 열린 문의 작성기, 종료 문의 작성기 차단 적용 |
| `frontend/src/app/user/inquiries/[id]/page.test.tsx` | 추가 | 종료 상태의 추가 작성기 미표시 검증 |
| `frontend/src/components/ui/BugReportModal.tsx` | 수정 | 시험 신고를 `EXAM_SOLVING_RESULT` 영역으로 접수 |
| `frontend/src/components/ui/BugReportModal.test.tsx` | 추가 | EXAM 문맥에서 생성되는 전체 접수 payload literal 검증 |
| `frontend/src/components/ui/InquiryMessageComposer.test.tsx` | 수정 | 메시지 이미지 업로드 결과 ID가 `attachmentIds`로 전달되는지 검증 |
| `frontend/src/components/layout/UserLayoutShell.tsx` | 수정 | 문의 경로의 fallback·화면 표시명을 `문의·요청`으로 고정 |

### 수정 상세

- 변경 전: 핵심 사용자 흐름은 구현되어 있었지만 컴포넌트 테스트가 실제 폼 입력에서 생성되는 요청 인자를 직접 보장하지 않았고, 서버 메뉴명이 오래된 경우 화면 제목도 그 값을 따를 수 있었다.
- 변경 후: 일반 문의·버그 신고·시험 개설·기능 요청·기타의 요청 필드 포함 규칙을 hand-derived literal로 검증하고, 종료 상태에서는 작성기가 렌더링되지 않으며 업로드된 메시지 이미지 ID가 메시지 API에 전달됨을 검증한다.
- 이유: 유형별 계약과 첨부 소유권이 프론트 리팩터링 뒤에도 조용히 변하지 않도록 실제 사용자 입력부터 API 호출 경계까지 보호하기 위해서다.

### 복원 방법

`UserInquiry_Modified.md`의 HIST-20260828-002 복원 시 새 사용자 문의 페이지·모달·작성기 테스트를 제거하고 `UserLayoutShell`의 문의 전용 표시명 고정을 이전 메뉴명 기반 처리로 되돌린다.

---

## HIST-20260828-001

- **날짜**: 2026-08-28
- **수정 범위**: 사용자 프론트엔드 / 문의·요청
- **수정 개요**: 문의 목적·발생 영역·처리 상태를 분리하고, 최초 접수와 후속 대화를 하나의 타임라인으로 표시하도록 사용자 문의 화면을 전환했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | 백엔드 요청 유형·상태·대화 DTO 계약 반영 |
| `frontend/src/lib/inquiry.ts` | 추가 | 문의 종료/발생 영역/관리자 상태 규칙 공통화 |
| `frontend/src/components/ui/InquiryTimeline.tsx` | 추가 | 초기 접수와 메시지 시간순 타임라인 |
| `frontend/src/components/ui/InquiryMessageComposer.tsx` | 추가 | 열린 접수의 후속 메시지·이미지 첨부 작성기 |
| `frontend/src/app/user/inquiries/**` | 수정 | 목록, 조건부 접수, 상세 대화 UI 및 Skeleton 적용 |
| `frontend/src/components/ui/BugReportModal.tsx` | 수정 | 빠른 신고를 `BUG_REPORT`와 영역/상세 위치로 전송 |

### 수정 상세

- 변경 전: 단일 `inquiryType`과 관리자 답변 한 건만 사용자 상세에 표시했다.
- 변경 후: `requestType`, `targetArea`, `detailLocation`, `messages`를 백엔드 계약과 맞추고 종료 전 사용자 추가 메시지를 허용한다.
- 이유: 일반 문의와 처리형 요청의 상태 규칙 및 다중 대화 요구사항을 지원하기 위해서다.

### 복원 방법

- 이력의 수정 파일을 이전 커밋 버전으로 되돌리고, 신규 `inquiry.ts`, `InquiryTimeline.tsx`, `InquiryMessageComposer.tsx` 및 각 테스트를 제거한다.

---

## HIST-20260803-001

- **날짜**: 2026-08-03
- **수정 범위**: 사용자 프론트엔드 / 1:1 문의 — "버그 신고" 카테고리 추가
- **수정 개요**: 버그 리포트 창구로 1:1 문의를 재사용하되, 다른 문의와 구분되도록 `InquiryType`에 `BUG`("버그 신고")를 추가했다(→ `docs/history/back/adm/AdminInquiry_Modified.md` HIST-20260803-001 참고). 문의 유형 콤보박스는 DB 도메인 값을 동적 로딩하므로(HIST-20260512-002) 백엔드 시더가 카테고리를 추가하면 화면은 자동 반영되고, API 실패 시의 하드코딩 폴백 배열만 프론트에서 함께 갱신했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `InquiryType`에 `'BUG'` 추가, `INQUIRY_TYPE_LABEL`에 `BUG: '버그 신고'` 추가 |
| `frontend/src/app/user/inquiries/new/page.tsx` | 수정 | 도메인 API 실패 시 폴백 배열에 `'BUG'` 추가 |

### 검증

- `npx tsc --noEmit` 통과.
- 브라우저 e2e: 문의 등록 화면 유형 콤보박스에 "버그 신고" 노출 → 선택해 등록 → 내 문의 목록·상세, 관리자 문의 관리 목록 모두에서 "버그 신고"로 정상 표시 확인(공용 `INQUIRY_TYPE_LABEL` 사용 화면들이라 별도 수정 불필요).

---

## HIST-20260512-002

- **날짜**: 2026-05-12
- **수정 범위**: 사용자 프론트엔드 / 1:1 문의
- **수정 개요**: 문의 등록 유형 콤보박스를 DB 도메인 값 기반으로 동적 로딩으로 전환

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/domainService.ts` | 수정 | `getSlavesByCode(code)` 메서드 추가 — `GET /api/domains/slaves?code={code}` 호출 |
| `frontend/src/app/user/inquiries/new/page.tsx` | 수정 | 하드코딩 `INQUIRY_TYPES` 배열 제거, `useEffect`로 DB에서 동적 로딩; 로딩 중 select 비활성화; 실패 시 기본값 fallback |

### 수정 상세

#### `domainService.ts`
- 변경 전: `getDomains()` (관리자 전체 조회)만 존재
- 변경 후: `getSlavesByCode(code: string)` 추가 — `GET /api/domains/slaves?code=` 호출

#### `new/page.tsx`
- 변경 전: `const INQUIRY_TYPES: InquiryType[] = ['EXAM', 'CONCEPT_NOTE', 'DAILY_QUIZ', 'PRACTICE', 'OTHER']` 하드코딩
- 변경 후: `useState<InquiryType[]>([])` + `useEffect`로 `domainService.getSlavesByCode('INQUIRY_CATEGORY')` 호출 → `slave.name`을 `InquiryType`으로 사용; API 실패 시 기본 5개 fallback; 로딩 중 `disabled` 처리

### 복원 방법

HIST-20260512-002 복원 시:
- `domainService.ts` — `getSlavesByCode` 메서드 제거
- `new/page.tsx` — `inquiryTypes`/`typesLoading` 상태 제거, `useEffect` 제거, `INQUIRY_TYPES` 하드코딩 배열로 복원, `domainService` import 제거

---

## HIST-20260512-001

- **날짜**: 2026-05-12
- **수정 범위**: 사용자 프론트엔드 / 1:1 문의
- **수정 개요**: 문의 유형 콤보박스에 '연습장(PRACTICE)' 항목 추가, types/index.ts InquiryType 확장

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `InquiryType`에 `'PRACTICE'` 추가, `INQUIRY_TYPE_LABEL`에 `PRACTICE: '연습장'` 추가 |
| `frontend/src/app/user/inquiries/new/page.tsx` | 수정 | `INQUIRY_TYPES` 배열에 `'PRACTICE'` 추가 (DAILY_QUIZ 뒤, OTHER 앞) |

### 수정 상세

#### `types/index.ts`
- 변경 전: `InquiryType = 'EXAM' | 'CONCEPT_NOTE' | 'DAILY_QUIZ' | 'OTHER'`
- 변경 후: `InquiryType = 'EXAM' | 'CONCEPT_NOTE' | 'DAILY_QUIZ' | 'PRACTICE' | 'OTHER'`
- `INQUIRY_TYPE_LABEL` 변경 전: `{ EXAM, CONCEPT_NOTE, DAILY_QUIZ, OTHER }` 4개
- `INQUIRY_TYPE_LABEL` 변경 후: `{ EXAM, CONCEPT_NOTE, DAILY_QUIZ, PRACTICE: '연습장', OTHER }` 5개

#### `app/user/inquiries/new/page.tsx`
- 변경 전: `const INQUIRY_TYPES: InquiryType[] = ['EXAM', 'CONCEPT_NOTE', 'DAILY_QUIZ', 'OTHER'];`
- 변경 후: `const INQUIRY_TYPES: InquiryType[] = ['EXAM', 'CONCEPT_NOTE', 'DAILY_QUIZ', 'PRACTICE', 'OTHER'];`

### 복원 방법

HIST-20260512-001 복원 시:
- `types/index.ts` — `InquiryType`에서 `'PRACTICE'` 제거, `INQUIRY_TYPE_LABEL`에서 `PRACTICE` 항목 제거
- `new/page.tsx` — `INQUIRY_TYPES` 배열에서 `'PRACTICE'` 제거

---

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
