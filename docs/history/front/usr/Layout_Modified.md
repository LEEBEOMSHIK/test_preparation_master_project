## HIST-20260511-015

- **날짜**: 2026-05-11
- **수정 범위**: 사용자 프론트엔드 / 레이아웃 Shell
- **수정 개요**: 브라우저 탭 타이틀을 현재 메뉴명에 맞게 자동 변경

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/UserLayoutShell.tsx` | 수정 | `getUserPageTitle()` 헬퍼 추가, `document.title` 자동 설정 useEffect 추가 |

### 수정 상세

#### `UserLayoutShell.tsx`

**`getUserPageTitle()` 헬퍼 추가 (ThemeToggle 앞):**
```typescript
function getUserPageTitle(pathname: string, navItems: MenuConfig[]): string {
  for (const item of navItems) {
    if (pathname.startsWith(item.url)) return item.name;
  }
  return '';
}
```

**`useEffect` 추가 (기존 auth/menu 로딩 effect 앞):**
```typescript
useEffect(() => {
  if (pathname === '/user/login') {
    document.title = '로그인 | TPMP';
    return;
  }
  const name = getUserPageTitle(pathname, navItems);
  document.title = name ? `${name} | TPMP` : 'TPMP - 시험 준비 마스터';
}, [pathname, navItems]);
```

**타이틀 패턴:**
- `/user/login` → `로그인 | TPMP`
- `/user/exam-info` → `시험 정보 | TPMP`
- `/user/exams` → `시험 | TPMP`
- `/user/concepts` → `개념노트 | TPMP`
- `/user/quiz` → `데일리 퀴즈 | TPMP`
- `/user/faq` → `FAQ | TPMP`
- `/user/inquiries` → `1:1 문의 | TPMP`
- `/user/practice` → `연습장 | TPMP`
- 미매칭 → `TPMP - 시험 준비 마스터`

### 복원 방법

HIST-20260511-015 복원 시:
- `UserLayoutShell.tsx`에서 `getUserPageTitle()` 함수 제거
- `document.title` 설정 `useEffect` 제거
