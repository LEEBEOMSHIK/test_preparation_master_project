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
  - 좌측 사이드바 (w-56, fixed): TPMP 로고 + "관리자" 뱃지, 시험관리/개념노트관리/1:1문의관리 아이콘+레이블 네비게이션 (활성 항목 인디케이터 dot), 하단 사용자 아바타+이름+이메일+로그아웃
  - 상단 헤더 (h-16, sticky): 현재 페이지 제목(pathname 기반 자동) + 서브타이틀 + 알림 벨 + 아바타+이름
  - 메인 콘텐츠 영역: ml-56 (사이드바 폭), pt는 헤더 sticky로 자연스럽게 처리
  - Zustand `useAuthStore`로 관리자 정보 표시 및 로그아웃 처리
- **이유**: 관리자 전용 레이아웃 분리 (사용자 레이아웃과 독립적으로 유지보수), 레퍼런스 이미지(dashboard 스타일) 기반 설계

#### `frontend/src/app/admin/layout.tsx`
- **변경 전**: 파일 없음
- **변경 후**: 신규 생성
  - `AdminLayoutShell` import 후 `/admin/**` 라우트 전체에 적용하는 Next.js 레이아웃

### 레이아웃 구조 요약

```
Admin:
┌──────────────────────────────────────────┐
│  [Sidebar w-56]  │  [Header h-16 sticky]  │
│  Logo + 관리자   │  PageTitle | 🔔 | 👤   │
│  ─────────────   ├────────────────────────┤
│  시험 관리       │                        │
│  개념노트 관리   │   children (p-6)       │
│  1:1 문의 관리   │                        │
│  ─────────────   │                        │
│  [User info]     │                        │
└──────────────────┴────────────────────────┘

User:
┌──────────────────────────────────────────┐
│  TPMP  [시험][개념노트][1:1문의]   [👤▼]  │  Header h-14 (fixed)
├──────────────────────────────────────────┤
│                                          │
│   children (max-w-5xl, px-6, py-6)      │
│                                          │
├──────────────────────────────────────────┤
│  [시험]      [개념노트]    [1:1문의]      │  Mobile bottom tab (sm:hidden)
└──────────────────────────────────────────┘
```

### 복원 방법

이 ID(HIST-20260418-002)로 복원 시:
- `frontend/src/components/layout/AdminLayoutShell.tsx` 삭제
- `frontend/src/app/admin/layout.tsx` 삭제
