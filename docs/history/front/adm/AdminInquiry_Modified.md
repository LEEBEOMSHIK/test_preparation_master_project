## HIST-20260831-001

- **날짜**: 2026-08-31
- **수정 범위**: 관리자 프론트엔드 / 문의 답변 작성 문맥
- **수정 개요**: 관리자 상세의 중복 제목을 제거하고, 공용 작성기에서 관리자 답변의 제목·안내·첨부 제목·전송 버튼·오류 문구를 분리했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/InquiryMessageComposer.tsx` | 수정 | 관리자 답변 전용 문구 적용 |
| `frontend/src/components/ui/InquiryImageUploader.tsx` | 수정 | 답변 첨부 이미지 제목 지원 |
| `frontend/src/components/ui/InquiryMessageComposer.test.tsx` | 수정 | 관리자 문맥 접근성 회귀 검증 |
| `frontend/src/app/admin/inquiries/[id]/page.tsx` | 수정 | 작성기와 중복되던 관리자 답변 제목 제거 |

### 수정 상세

- 변경 전: 관리자가 사용자와 동일한 일반 메시지 등록 용어를 보았고 상세 화면에 답변 제목이 중복 노출됐다.
- 변경 후: 관리자는 사용자 답변 작성, 답변 첨부 이미지, 답변 보내기 용어와 답변 전송 오류 안내를 보고 상세에서는 제목을 한 번만 본다.
- 이유: 답변 행위와 사용자 후속 문의를 명확히 구분하고 중복된 화면 정보를 제거하기 위해서다.

### 검증

- 관리자 문의 상세과 설정 화면 focused Jest 실행: 2 suites, 10 tests 통과.
- 전체 프론트엔드 `npx tsc --noEmit` 오류 0, Jest 26 suites/124 tests 실패 0, `npm run build` 성공 및 정적 페이지 55개 생성을 확인했다. 기존 Next build viewport metadata 경고는 성공 결과와 별개다.
- root `git diff --check` 성공: 오류 0(CRLF 변환 경고는 공백 오류가 아님).

### 복원 방법

`AdminInquiry_Modified.md`의 HIST-20260831-001 복원 시 공용 작성기의 관리자 문맥 문구와 상세 화면의 중복 제목 렌더링을 이전 상태로 되돌린다.
