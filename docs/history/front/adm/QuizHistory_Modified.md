## HIST-20260804-002

- **날짜**: 2026-08-04
- **수정 범위**: 관리자 프론트엔드 / 퀴즈 이력 — 컬럼 겹침 수정 + 도메인별 풀이량 차트 추가
- **수정 개요**: 사용자가 두 가지를 지적 — (1) "퀴즈 풀이 이력 데이터 컬럼의 겹침 현상이 있다", (2) "어떤 카테고리를 많이 푸는지 통계가 확인이 안 된다". (1)은 "유형" 컬럼에 `MULTIPLE_CHOICE`/`SHORT_ANSWER` 같은 원본 enum 문자열을 `whitespace-nowrap`으로만 표시하고 `overflow-hidden`이 없어, 컬럼 너비(90px)보다 텍스트가 길 때 옆 "정답" 컬럼 위로 겹쳐 보이는 문제였다. (2)는 `user/dashboard/page.tsx`의 "도메인별 풀이량" 수평 BarChart 패턴을 그대로 이식해 화면 상단에 추가했다(→ 백엔드 `docs/history/back/adm/QuizHistory_Modified.md` HIST-20260804-003).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/adminQuizHistoryService.ts` | 수정 | `QuizDomainStat`/`QuizDomainStatParams` 타입 + `getDomainStats(params)` 추가 (`GET /admin/quiz-history/domain-stats`) |
| `frontend/src/app/admin/quiz/history/page.tsx` | 수정 | (1) "유형" 컬럼을 `admin/exams/questions/page.tsx`와 동일한 `TYPE_LABEL`/`TYPE_COLOR` 배지로 교체(짧은 한글 라벨 + 색상 칩) — 겹침 원인인 긴 enum 문자열 노출 제거. 모든 `td`/`th`에 `overflow-hidden` 방어적으로 추가(향후 유사 겹침 재발 방지). (2) 검색 폼 아래·목록 위에 recharts 수평 BarChart("도메인별 풀이량") 섹션 추가 — 날짜 필터(`dateFrom`/`dateTo`)와 연동되어 검색/초기화 시 함께 갱신. `useColumnResize` 키 `v1`→`v2`(컬럼 너비 값 변경) |

### 수정 상세

#### `frontend/src/services/adminQuizHistoryService.ts`
- 변경 전: `getList`만 존재
- 변경 후: `getDomainStats({from, to})` 추가, `QuizDomainStat { domainName, totalQuestions }` 타입 추가
- 이유: 신규 백엔드 통계 엔드포인트 연동

#### `frontend/src/app/admin/quiz/history/page.tsx`
- 변경 전: "유형" `td`가 `<td ... whitespace-nowrap>{item.questionType}</td>`로 원본 문자열을 그대로 노출해 좁은 컬럼에서 옆 컬럼과 겹쳐 보임
- 변경 후: `TYPE_LABEL`(`MULTIPLE_CHOICE`→"객관식" 등)·`TYPE_COLOR` 상수를 로컬에 정의(다른 화면과 동일한 라벨·색상 매핑, 공용 유틸 추출 기준인 "2곳 이상 동일 로직"에는 아직 못 미쳐 로컬 유지)해 배지로 렌더. 도메인별 풀이량 BarChart는 `quizDomainMaxCount`/`quizDomainChartData` 계산 방식(오름차순 정렬 후 vertical layout — 많이 푼 도메인이 위로 오도록)까지 `user/dashboard/page.tsx`와 동일하게 이식
- 이유: 짧은 라벨로 겹침 원인 제거 + 기존 통계 시각화 컨벤션과 일관성 유지

### 검증

- `npx tsc --noEmit` 통과
- 브라우저 확인: 테이블 전 행에서 "유형" 배지가 옆 "정답" 컬럼과 겹치지 않고 정상 표시됨을 확인(스크롤하며 10건 전체 확인). 상단 "도메인별 풀이량" 차트가 풀이수 내림차순(차트상으로는 오름차순 정렬 후 위로 갈수록 많음)으로 정상 렌더링되고, 날짜 필터 적용 시 차트도 함께 좁혀짐을 확인

---

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
