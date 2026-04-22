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
