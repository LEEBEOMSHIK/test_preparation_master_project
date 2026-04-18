## HIST-20260418-004

- **날짜**: 2026-04-18
- **수정 범위**: 관리자 프론트엔드 / 전체 페이지 레이아웃 적용
- **수정 개요**: 빈 page.tsx 파일에 default export 추가하여 AdminLayout이 모든 관리자 페이지에 즉시 적용되도록 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/page.tsx` | 수정 | 빈 파일 → placeholder 페이지 컴포넌트 추가 |
| `frontend/src/app/admin/concepts/page.tsx` | 수정 | 빈 파일 → placeholder 페이지 컴포넌트 추가 |
| `frontend/src/app/admin/inquiries/page.tsx` | 수정 | 빈 파일 → placeholder 페이지 컴포넌트 추가 |

### 수정 상세

#### 각 page.tsx 공통 패턴
- **변경 전**: 0 bytes (빈 파일)
- **변경 후**: 제목 + 설명 + "준비 중입니다." dashed 박스 placeholder 컴포넌트
- **이유**: Next.js App Router는 page.tsx에 default export가 없으면 라우트 오류 발생

### 적용 확인 결과

| 라우트 | HTTP | 레이아웃 요소 확인 |
|--------|------|-------------------|
| `http://localhost:3000/admin/exams` | 200 | TPMP 로고, 관리자, 시험관리/개념노트관리/1:1문의관리 사이드바 |
| `http://localhost:3000/admin/concepts` | 200 | 동일 |
| `http://localhost:3000/admin/inquiries` | 200 | 동일 |

### 복원 방법

이 ID(HIST-20260418-004)로 복원 시:
각 page.tsx를 빈 파일(0 bytes)로 되돌린다.

---

## HIST-20260418-002

- **날짜**: 2026-04-18
- **수정 범위**: 관리자 프론트엔드 / 레이아웃
- **수정 개요**: 관리자 전용 레이아웃(AdminLayoutShell) 신규 생성 및 Next.js App Router 라우트 레이아웃 적용

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 추가 | 관리자 레이아웃 Shell 컴포넌트 신규 생성 |
| `frontend/src/app/admin/layout.tsx` | 추가 | Next.js App Router 관리자 라우트 레이아웃 신규 생성 |

### 수정 상세

#### `frontend/src/components/layout/AdminLayoutShell.tsx`
- **변경 전**: 파일 없음
- **변경 후**: 신규 생성
  - 좌측 사이드바 (w-56, fixed): TPMP 로고+"관리자" 뱃지, 시험관리/개념노트관리/1:1문의관리 아이콘+레이블 (활성 dot), 하단 아바타+이름+이메일+로그아웃
  - 상단 헤더 (h-16, sticky): pathname 기반 자동 페이지 제목 + 알림벨 + 아바타+이름
  - 메인 콘텐츠: ml-56, p-6

#### `frontend/src/app/admin/layout.tsx`
- **변경 전**: 파일 없음
- **변경 후**: `AdminLayoutShell`을 `/admin/**` 라우트 전체에 적용

### 레이아웃 구조

```
Admin:
┌──────────────────────────────────────────┐
│  [Sidebar w-56]  │  [Header h-16 sticky]  │
│  TPMP  관리자    │  PageTitle | 🔔 | 👤   │
│  시험 관리       ├────────────────────────┤
│  개념노트 관리   │   children (p-6)       │
│  1:1 문의 관리   │                        │
│  [User info]     │                        │
└──────────────────┴────────────────────────┘

User:
┌──────────────────────────────────────────┐
│  TPMP  [시험][개념노트][1:1문의]   [👤▼]  │  Header h-14
│   children (max-w-5xl)                   │
│  [시험]   [개념노트]   [1:1문의]          │  Mobile bottom tab
└──────────────────────────────────────────┘
```

### 복원 방법

이 ID(HIST-20260418-002)로 복원 시:
- `frontend/src/components/layout/AdminLayoutShell.tsx` 삭제
- `frontend/src/app/admin/layout.tsx` 삭제
