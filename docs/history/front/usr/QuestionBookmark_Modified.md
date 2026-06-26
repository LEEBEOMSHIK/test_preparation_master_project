## HIST-20260626-001

- **날짜**: 2026-06-26
- **수정 범위**: 사용자 프론트엔드 / 복습 표시(즐겨찾기 문구 통일)
- **수정 개요**: 사용자에게 보이는 "즐겨찾기" 한글 문구를 "복습 표시"로 전역 통일. URL·변수명·iconKey는 유지.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| frontend/src/app/user/bookmarks/page.tsx | 수정 | 페이지 제목·빈 상태 문구·해제 버튼 title 5곳 교체 |
| frontend/src/components/layout/UserLayoutShell.tsx | 수정 | USER_FALLBACK_NAV 즐겨찾기 → 복습 표시 (name만 변경) |

### 수정 상세

#### `app/user/bookmarks/page.tsx`
- 변경 전: 로딩/빈상태/정상 헤더 `즐겨찾기`, 빈 상태 본문 `즐겨찾기한 문항이 없습니다` / `문항을 즐겨찾기해보세요.`, 버튼 title `즐겨찾기 해제`
- 변경 후: 헤더 3곳 → `복습 표시`, 본문 → `복습 표시한 문항이 없습니다` / `복습 표시해보세요.`, title → `복습 표시 해제`
- 이유: 퀴즈·시험 토글 버튼 문구가 이미 "복습 표시"로 변경됨에 따라 목록 페이지 문구 일관성 확보

#### `components/layout/UserLayoutShell.tsx`
- 변경 전: `leaf(108, '즐겨찾기', '/user/bookmarks', 'bookmark', 3)`
- 변경 후: `leaf(108, '복습 표시', '/user/bookmarks', 'bookmark', 3)` — id·url·iconKey·order 유지
- 이유: API 실패 시 fallback 네비도 문구를 DB(menu_config)와 일치시키기 위함

### 복원 방법
이 ID(HIST-20260626-001)만으로 복원 시: 위 "변경 전" 문자열을 각 파일에 재적용한다.

---

## HIST-20260612-001

- **날짜**: 2026-06-12
- **수정 범위**: 사용자 프론트엔드 / 문항 즐겨찾기
- **수정 개요**: 즐겨찾기 목록 페이지 신규 구현, 퀴즈 화면에 북마크 토글 버튼 추가, QuestionDetailModal hideEditLink prop 추가, 내비게이션 메뉴 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| frontend/src/types/index.ts | 수정 | BookmarkQuestion 인터페이스 추가 |
| frontend/src/services/bookmarkService.ts | 추가 | toggle / getBookmarks / getBookmarkedIds API 클라이언트 |
| frontend/src/app/user/bookmarks/page.tsx | 추가 | 즐겨찾기 목록 페이지 — CardListSkeleton, stripHtml, QuestionDetailModal(hideEditLink), 낙관적 해제 |
| frontend/src/components/ui/QuestionDetailModal.tsx | 수정 | hideEditLink?: boolean prop 추가 — true 시 /admin/.../edit 링크 숨김 |
| frontend/src/app/user/quiz/[categoryId]/page.tsx | 수정 | 북마크 상태(bookmarkedIds Set) 초기화, handleToggleBookmark, 피드백 영역 하단 별 토글 버튼 |
| frontend/src/components/layout/UserLayoutShell.tsx | 수정 | ICON_MAP에 bookmark SVG 추가, USER_FALLBACK_NAV에 즐겨찾기(id:108, /user/bookmarks) 추가 |

### 수정 상세

#### `components/ui/QuestionDetailModal.tsx`
- 변경 전: `interface Props { question, onClose }` — 수정 링크 항상 표시
- 변경 후: `hideEditLink?: boolean` prop 추가. `{!hideEditLink && <Link href="/admin/...">수정</Link>}` 조건 렌더링
- 이유: 사용자 북마크 페이지에서 관리자 편집 링크 노출 방지. 기존 admin 호출부는 prop 미전달로 기존 동작 유지(기본값 false).

#### `app/user/bookmarks/page.tsx`
- 변경 전: 없음
- 변경 후: `useState(true)`로 초기 loading, `finally(() => setLoading(false))` 해제. loading → CardListSkeleton, 빈 목록 → 데일리 퀴즈 유도 UI. 카드 클릭 → QuestionDetailModal(hideEditLink). 해제 버튼 → toggle API 후 false 응답 시 낙관적 제거.
- 이유: 즐겨찾기 목록 기능 신규 구현

#### `app/user/quiz/[categoryId]/page.tsx`
- 변경 전: 북마크 관련 상태/로직 없음
- 변경 후: `bookmarkedIds: Set<number>` 상태 추가. 마운트 시 getBookmarkedIds() 호출(catch → 빈 Set 폴백). 피드백 블록 하단에 별 아이콘 토글 버튼 — filled(북마크됨)/outline(미북마크). toggle 응답으로 Set 갱신.
- 이유: 퀴즈 풀이 중 즐겨찾기 등록/해제 편의성 제공

#### `components/layout/UserLayoutShell.tsx`
- 변경 전: bookmark iconKey/fallback 없음
- 변경 후: `ICON_MAP.bookmark` 별 SVG 추가. `USER_FALLBACK_NAV[8]` — id:108, name:'즐겨찾기', url:'/user/bookmarks', iconKey:'bookmark', displayOrder:8
- 이유: API 메뉴 미등록 시에도 폴백 내비게이션으로 즐겨찾기 접근 가능

### 주의사항
- **MenuConfig DB 등록 별도 필요**: 즐겨찾기 메뉴를 MenuConfig 테이블에 INSERT해야 API 기반 내비게이션에 표시됨. 미등록 시 `USER_FALLBACK_NAV`로 폴백(기능 동작은 정상이나 권한 제어가 적용되지 않음).
- **QuestionDetailModal 기존 사용처**: hideEditLink prop을 전달하지 않으면 기본값 `false`이므로 기존 admin 화면의 수정 링크 동작 그대로 유지됨.

### 복원 방법
이 ID(HIST-20260612-001)만으로 복원 시: bookmarks/page.tsx 삭제, bookmarkService.ts 삭제, types/index.ts에서 BookmarkQuestion 인터페이스 블록 제거, QuestionDetailModal.tsx에서 hideEditLink 관련 코드 제거, quiz/[categoryId]/page.tsx에서 북마크 import·상태·useEffect·handleToggleBookmark·버튼 UI 제거, UserLayoutShell.tsx에서 bookmark ICON_MAP 항목 및 FALLBACK_NAV[8] 제거.
