## HIST-20260804-001

- **날짜**: 2026-08-04
- **수정 범위**: 관리자 프론트엔드 / 퀴즈 이력
- **수정 개요**: `/admin/quiz/history` 전용 퀴즈 풀이 이력 목록 화면 신규 구현. `frontend/src/app/admin/exams/history/page.tsx`(시험 이력 관리)와 동일한 구조(검색 폼 + `useColumnResize` 테이블 + `Pagination`)로 작성했고, 검색 유형은 시험명 대신 도메인명(name/email/domain)을 사용한다. `menu_config`에 별도 등록하지 않음(`/admin/exams/history`와 동일하게 대시보드 카드 링크로만 진입).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/adminQuizHistoryService.ts` | 추가 | `QuizHistoryItem`/`QuizHistoryPage`/`QuizHistoryParams` 타입 + `getList(params)` — `GET /admin/quiz-history` 호출 |
| `frontend/src/app/admin/quiz/history/page.tsx` | 추가 | 퀴즈 풀이 이력 목록 화면 — 검색(이름/이메일/도메인 + 기간), 컬럼(No/회원 이름/이메일/도메인/문항 내용/유형/정답/제출 답안/풀이 일시), `stripHtml`로 문항 HTML 제거 후 표시, 문항 삭제 시 "(삭제된 문항)" 표시, 정답/오답 배지 |
| `frontend/src/app/admin/dashboard/page.tsx` | 수정 | "오늘 퀴즈 풀이" `StatCard`의 `href`를 범용 `/admin/tables/data`에서 전용 `/admin/quiz/history`로 변경 |

### 수정 상세

#### `frontend/src/services/adminQuizHistoryService.ts`
- 변경 전: 파일 없음
- 변경 후: `adminExamHistoryService`와 동일한 형태의 axios 래퍼
- 이유: 신규 API 연동을 위한 서비스 레이어 분리

#### `frontend/src/app/admin/quiz/history/page.tsx`
- 변경 전: 파일 없음
- 변경 후: `admin/exams/history/page.tsx` 구조를 이식하되, 검색 타입 셀렉트를 name/email/exam → name/email/domain으로 교체하고 "시험명" 컬럼 대신 "도메인"·"문항 내용"·"유형"·"제출 답안" 컬럼을 추가. `questionContent`가 null(문항 삭제됨)이면 회색 "(삭제된 문항)" 텍스트로 폴백
- 이유: 사용자가 지적한 "퀴즈 카드가 카테고리 무관하게 범용 DB 조회 화면으로 연결되는" 문제(→ `docs/history/back/adm/QuizHistory_Modified.md` HIST-20260804-001)를 해결하기 위해 목적에 맞는 전용 화면 필요

#### `frontend/src/app/admin/dashboard/page.tsx`
- 변경 전: `href="/admin/tables/data"`
- 변경 후: `href="/admin/quiz/history"`
- 이유: 신규 전용 화면으로 카드 링크 연결

### 검증

- `npx tsc --noEmit` 통과(에러 없음)
- 백엔드 재기동 후 브라우저로 `/admin/quiz/history` 직접 접근 확인(빈 데이터 상태 "풀이 이력이 없습니다." 정상 표시), 대시보드 → 퀴즈 카드 링크가 새 경로로 연결됨을 확인
