## HIST-20260422-006

- **날짜**: 2026-04-22
- **수정 범위**: 관리자 프론트엔드 / 1:1 문의 관리 + FAQ 관리
- **수정 개요**: 관리자 문의 관리 페이지 전면 구현, FAQ 관리(목록·등록·수정) 신규 추가, 사이드바에 FAQ 관리 메뉴 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/inquiries/page.tsx` | 수정 | 플레이스홀더 → 전체 목록 테이블 (상태 탭, 행 클릭 인라인 상세, 답변·보류 관리) |
| `frontend/src/app/admin/faq/page.tsx` | 추가 | FAQ 목록 (공개전환, 수정, 삭제, 페이징) |
| `frontend/src/app/admin/faq/new/page.tsx` | 추가 | FAQ 등록 폼 |
| `frontend/src/app/admin/faq/[id]/edit/page.tsx` | 추가 | FAQ 수정 폼 |
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | 사이드바에 `FAQ 관리` 메뉴 (`/admin/faq`) 추가 |

### 수정 상세

#### `admin/inquiries/page.tsx`
- 변경 전: "준비 중입니다." 플레이스홀더
- 변경 후:
  - 상태 탭 필터 (전체/답변 대기/답변 보류/답변 완료)
  - 테이블: 번호, 제목, 유형, 작성자, 상태, 등록일, 관리
  - 행 클릭 시 인라인 확장 — 문의 내용·이미지 표시, 답변 작성 폼
  - 관리 컬럼: "보류" 버튼(PENDING↔ON_HOLD 토글), "대기로" 버튼(ON_HOLD→PENDING)
  - 답변 등록 시 상태 즉시 ANSWERED로 갱신, 행 상태 배지 업데이트

#### `admin/faq/page.tsx` (신규)
- 테이블: 번호, 질문(+답변 미리보기), 순서, 공개 여부, 등록일, 관리
- 수정(→ edit 페이지), 공개전환(즉시 배지 업데이트), 삭제

#### `admin/faq/new/page.tsx` (신규)
- 질문·답변 입력, 표시 순서, 공개 여부 토글 스위치

#### `admin/faq/[id]/edit/page.tsx` (신규)
- 기존 데이터 로드 후 수정 폼 (new 페이지와 동일 구조)

### 복원 방법

HIST-20260422-006 복원 시:
- `admin/inquiries/page.tsx`를 플레이스홀더로 복원
- `admin/faq/page.tsx`, `admin/faq/new/page.tsx`, `admin/faq/[id]/edit/page.tsx` 삭제
- `AdminLayoutShell.tsx`에서 FAQ 관리 NAV_ITEM 제거
