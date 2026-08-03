# Agent Handoff - CURRENT

> 최종 갱신: 2026-08-04

## 현재 목표와 사용자 결정 사항

- "1대1문의에 버그 신고할 수 있도록 추가했는데, 각 문항에서도 간단하게 추가할 수 있도록 해야 할거 같아... 퀴즈, 시험, 풀이 스크래치패드에서 버그 신고가 예상이 되는데" 요청.
- 처음엔 공용 `ScratchPadPanel`(퀴즈·시험 화면에 이미 존재) 안에 버그 신고 진입점을 두는 안을 제안했으나, 사용자가 "스크래치패드를 열고 사용하지 않는 사람은 확인하기 힘들텐데?"라고 지적 → 문제 풀이 화면에 항상 보이는 아이콘으로 변경. AskUserQuestion으로 배치 위치 3안 제시 → "문제 카드 우상단 아이콘" 선택받아 그 위치로 구현 완료.

## 완료한 작업

1. 신규 공용 모달 `frontend/src/components/ui/BugReportModal.tsx` — 문항 컨텍스트(화면 출처·문항 ID·문항 내용) 자동 첨부, 설명만 입력하면 기존 `POST /user/inquiries`(inquiryType=BUG)로 즉시 등록. 백엔드 신규 API 없음(기존 엔드포인트 재사용).
2. `frontend/src/app/user/quiz/[categoryId]/page.tsx` — 문제 카드 우측 상단(연도/회차 배지 옆)에 버그 신고 아이콘 추가, `pr-24`→`pr-28` 3곳 조정, Alt 단축키 가드에 `showBugReport` 반영.
3. `frontend/src/app/exam/[id]/page.tsx` — 문제 번호 행(진행률 표시 옆)에 동일 디자인 아이콘 추가, Alt 단축키 가드에 `showBugReport` 반영.
4. `CLAUDE.md` Shared Utilities 표에 `BugReportModal` 행 추가.
5. 문서화: `docs/history/front/usr/UserQuizExam_Modified.md`(HIST-20260804-001, 신규 최상단 항목).

## 실행한 검증과 결과

| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | 통과 |
| 브라우저 확인(퀴즈) | 테스트 사용자로 로그인 → 퀴즈 풀이 화면 아이콘 클릭 → 모달에 "데일리 퀴즈 · 운영체제" + 문항 내용 정상 표시 → 제출 → `GET /api/admin/inquiries`에서 `[버그신고] 데일리 퀴즈 - 운영체제`(inquiryType=BUG) 정상 등록 확인 후 삭제 |
| 브라우저 확인(시험) | `2026년 제60회 SQLD` 응시 화면에서 아이콘 클릭 → "시험 · 2026년 제60회 SQLD" 컨텍스트 정상 → 제출 → 정상 등록 확인 후 삭제 |

## 미완료 작업

- 변경 파일 **미커밋** — 사용자 승인 필요:
  - 신규: `frontend/src/components/ui/BugReportModal.tsx`
  - 수정: `frontend/src/app/user/quiz/[categoryId]/page.tsx`, `frontend/src/app/exam/[id]/page.tsx`, `CLAUDE.md`, `docs/history/front/usr/UserQuizExam_Modified.md`
  - 본 파일(`docs/agent-handoff/CURRENT.md`)도 함께 커밋 대상
- 개념노트 상세 화면(`user/concepts/[id]`, `user/concepts/explore/[id]`)도 같은 `ScratchPadPanel`을 쓰지만, 이번 버그 신고 아이콘은 퀴즈·시험에만 추가했고 개념노트 화면에는 넣지 않음(사용자가 명시적으로 범위를 퀴즈/시험/스크래치패드로 한정, 확인 질문에 명확한 답 없었음 — 추가 필요 시 별도 요청 대기).

## 다음 세션이 바로 실행할 명령

```powershell
git status --short

# 사용자 승인 후
git add frontend/src/components/ui/BugReportModal.tsx `
        frontend/src/app/user/quiz/[categoryId]/page.tsx `
        frontend/src/app/exam/[id]/page.tsx `
        CLAUDE.md `
        docs/history/front/usr/UserQuizExam_Modified.md `
        docs/agent-handoff/CURRENT.md
git commit -m "[FE] feat: 퀴즈·시험 풀이 화면에 문항 단위 버그 신고 기능 추가"
git push origin main
```

## 현재 실행 중인 프로세스

- `tpmp-db-local` (docker, 포트 5432)
- 백엔드 gradle bootRun (nohup, 포트 8080), 로그 `/tmp/backend_domain_stats.log` — 이번 작업은 프론트엔드 전용이라 백엔드 재기동 불필요(변경 없음)
- 프론트 `next dev` (nohup, 포트 3000)

## 주의사항 / 건드리면 안 되는 것

- `docs/db-migration/`의 기존 델타 34개 — 수정·삭제 금지.
- 브라우저 자동화 시 `confirm()`/`alert()`를 띄우는 버튼(삭제 등)은 클릭 금지 — 필요하면 API로 직접 처리.
- `.env`의 `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` 라인은 주석 처리된 채로 둘 것(로컬 전용).
- **로컬 DB에서 raw SQL로 타임스탬프 테스트 데이터를 넣을 때는 postgres 세션 TimeZone(이 컨테이너는 UTC)과 호스트/JVM 로컬시간대(KST, UTC+9)의 9시간 차이를 반드시 보정할 것.**
- `quiz_history` 테이블에 시연용 테스트 데이터 10건이 남아있음(id 4~13, user_id=2, `created_at` KST로 보정 완료). 실제 사용자 데이터가 아니므로 운영 배포 전 정리 필요 — `DELETE FROM quiz_history WHERE user_id = 2 AND id BETWEEN 4 AND 13;`.
- 이번 세션에서 브라우저 자동화 중 "Multiple Chrome browsers connected" 프롬프트가 발생 — "Browser 1"은 `localhost:3000`에 접근 불가(원격/다른 머신 추정), "Browser 2"가 로컬 dev 서버에 정상 접근 가능. 다음 세션에서 같은 프롬프트가 뜨면 Browser 2를 선택할 것.
