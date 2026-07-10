## HIST-20260710-001

- **날짜**: 2026-07-10
- **수정 범위**: 사용자 프론트엔드 / 복습 표시(북마크) — 재풀이 모드 추가
- **수정 개요**: 복습 표시 목록 화면에서 카드를 클릭하면 정답·해설까지 즉시 노출되어 회상 연습이 불가능하던 문제를 해결했다. 목록 팝업(`QuestionDetailModal`)은 그대로 유지하되 신규 prop `hideAnswerInitially`를 전달해 정답·해설을 "정답 보기" 버튼으로 가리도록 했고, 헤더에 "복습 시작" 버튼을 추가해 데일리 퀴즈 풀이 화면(`/user/quiz/bookmarks`)으로 이동해 실제로 답을 입력하고 채점받을 수 있도록 했다. 퀴즈 풀이 화면 자체의 북마크 재풀이 모드 구현은 `docs/history/front/usr/DailyQuiz_Modified.md`, 백엔드 신규 엔드포인트는 `docs/history/back/usr/UserQuiz_Modified.md`에 기록.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/bookmarks/page.tsx` | 수정 | 헤더에 "복습 시작" 버튼 추가(문항 1개 이상일 때만 노출), `QuestionDetailModal`에 `hideAnswerInitially` 전달 |
| `frontend/src/components/ui/QuestionDetailModal.tsx` | 수정 | 신규 prop `hideAnswerInitially?: boolean`(기본 false) 추가 — true면 정답·해설 영역을 "정답 보기" 버튼으로 가림 |

### 수정 상세

#### `app/user/bookmarks/page.tsx`
- 변경 전: 헤더에 제목 + 문항 수만 표시, `<QuestionDetailModal question onClose hideEditLink />`
- 변경 후: 헤더를 `flex items-center justify-between gap-3`로 재구성, `bookmarks.length > 0`일 때 우측에 "복습 시작" 버튼 추가 — 클릭 시 `router.push('/user/quiz/bookmarks?name=' + encodeURIComponent('복습 표시'))`. `<QuestionDetailModal ... hideAnswerInitially />` 추가
- 이유: 목록 팝업에서 실제 회상 연습(답 입력→채점)이 불가능한 문제를 데일리 퀴즈 풀이 화면 재사용으로 해결

#### `components/ui/QuestionDetailModal.tsx`
- 변경 전: props `{ question, onClose, hideEditLink }`, 정답·해설·객관식 정답 하이라이트가 항상 노출
- 변경 후: props에 `hideAnswerInitially?: boolean`(기본 false) 추가. 내부 `revealed` state(문항 id 변경 시 useEffect로 false 초기화) + `showAnswer = !hideAnswerInitially || revealed`. 객관식 선택지의 정답 하이라이트(`isCorrect`)·정답(비객관식) 섹션·해설 섹션 모두 `showAnswer` 조건으로 감싸고, 가려진 상태에서는 "정답 보기" 버튼(인디고 테마, 다크모드 대응)을 렌더해 클릭 시 `revealed=true`로 공개
- 이유: 계획서 스펙 그대로 구현(기존 관리자 화면 등 다른 사용처는 prop 기본값 false라 동작 불변, 회귀 없음)

### 복원 방법
이 ID(HIST-20260710-001)만으로 복원 시: `bookmarks/page.tsx`에서 "복습 시작" 버튼과 `hideAnswerInitially` prop 전달을 제거하고, `QuestionDetailModal.tsx`에서 `hideAnswerInitially` prop과 관련 `revealed` state·"정답 보기" 버튼·`showAnswer` 조건부 렌더링을 제거해 원래의 항상-노출 동작으로 되돌린다.

## HIST-20260709-001

- **날짜**: 2026-07-09
- **수정 범위**: 사용자 프론트엔드 / 복습 표시(즐겨찾기) 목록 — 신규 문항 유형 SQL 배지 지원
- **수정 개요**: 문항 유형에 `SQL`이 신설됨에 따라 복습 표시 목록의 유형 배지 `TYPE_LABEL`/`TYPE_COLOR` Record에 SQL 키를 추가했다(공용 `QuestionType` 유니온을 사용하므로 SCHEDULING 선례와 동일하게 누락 시 컴파일 에러). 기존 SCHEDULING과 마찬가지로 `bookmarkToDetailItem`은 `sqlData`를 상세 모달로 전달하지 않는 기존 구조를 그대로 유지했다(별도 확장 범위 아님).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/bookmarks/page.tsx` | 수정 | `TYPE_LABEL.SQL = 'SQL'`, `TYPE_COLOR.SQL = 'bg-cyan-50 text-cyan-600'` 추가 |

### 수정 상세

#### `app/user/bookmarks/page.tsx`
- 변경 전: `TYPE_LABEL`/`TYPE_COLOR` Record에 `MULTIPLE_CHOICE`/`SHORT_ANSWER`/`OX`/`CODE`/`SCHEDULING` 5개 키만 존재
- 변경 후: 두 Record 모두에 `SQL` 키 추가
- 이유: `types/index.ts`의 `QuestionType` 유니온에 `'SQL'`을 추가하면서 `Record<QuestionType, string>` 타입이 컴파일 에러가 되는 것을 막기 위함(`npx tsc --noEmit`로 확인)

### 복원 방법
이 ID(HIST-20260709-001)만으로 복원 시: `TYPE_LABEL`/`TYPE_COLOR`에서 `SQL` 키를 제거한다.

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
