# Agent Handoff - CURRENT

> 최종 갱신: 2026-08-04

## 현재 목표와 사용자 결정 사항

- 퀴즈·시험 화면 버그 신고 기능(커밋 `fd4040b`)에 이어, 사용자가 "개념노트에도 추가해"라고 요청 → 같은 `BugReportModal`을 개념노트 상세 화면(내 노트·공개 탐색) 2곳에도 확대 적용.
- 중간에 "복습에도 있나?" 질문 → 복습(북마크 재풀이)은 `user/quiz/[categoryId]/page.tsx`를 그대로 재사용하는 화면이라 이미 적용되어 있음을 확인·답변(추가 작업 불필요).

## 완료한 작업

1. `frontend/src/components/ui/BugReportModal.tsx` — `BugReportContext.source`에 `'CONCEPT_NOTE'` 추가, 라벨 매핑 추가.
2. `frontend/src/app/user/concepts/[id]/page.tsx` — 내 노트 상세 화면 뷰 모드 헤더(수정·삭제 버튼 옆)에 버그 신고 아이콘 추가. `toBugReportContext(note)` 헬퍼로 연결 문항 유무에 따라 컨텍스트 자동 구성.
3. `frontend/src/app/user/concepts/explore/[id]/page.tsx` — 공개 탐색 상세 화면 제목 행에 동일 아이콘 추가.
4. `CLAUDE.md` — `BugReportModal` 표 설명 갱신.
5. 문서화: `docs/history/front/usr/UserConceptNote_Modified.md`(HIST-20260804-001, 신규 최상단).

## 실행한 검증과 결과

| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | 통과 |
| 브라우저 확인 | 퀴즈 문항에 연결된 노트 상세에서 아이콘 클릭 → "개념노트 · [제목]" + 연결 문항 내용 정상 표시 → 제출 → `GET /api/admin/inquiries`에서 BUG 유형 정상 등록 확인(문항 ID 83) 후 삭제 |

## 미완료 작업

- 변경 파일 **미커밋** — 사용자 승인 필요:
  - 수정: `frontend/src/components/ui/BugReportModal.tsx`, `frontend/src/app/user/concepts/[id]/page.tsx`, `frontend/src/app/user/concepts/explore/[id]/page.tsx`, `CLAUDE.md`, `docs/history/front/usr/UserConceptNote_Modified.md`
  - 본 파일(`docs/agent-handoff/CURRENT.md`)도 함께 커밋 대상

## 다음 세션이 바로 실행할 명령

```powershell
git status --short

# 사용자 승인 후
git add frontend/src/components/ui/BugReportModal.tsx `
        "frontend/src/app/user/concepts/[id]/page.tsx" `
        "frontend/src/app/user/concepts/explore/[id]/page.tsx" `
        CLAUDE.md `
        docs/history/front/usr/UserConceptNote_Modified.md `
        docs/agent-handoff/CURRENT.md
git commit -m "[FE] feat: 개념노트 화면에도 버그 신고 기능 확대 적용"
git push origin main
```

## 현재 실행 중인 프로세스

- `tpmp-db-local` (docker, 포트 5432)
- 백엔드 gradle bootRun (nohup, 포트 8080) — 이번 작업은 프론트엔드 전용이라 재기동 불필요
- 프론트 `next dev` (nohup, 포트 3000)

## 주의사항 / 건드리면 안 되는 것

- `docs/db-migration/`의 기존 델타 34개 — 수정·삭제 금지.
- 브라우저 자동화 시 `confirm()`/`alert()`를 띄우는 버튼(삭제 등)은 클릭 금지 — 필요하면 API로 직접 처리.
- `.env`의 `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` 라인은 주석 처리된 채로 둘 것(로컬 전용).
- **로컬 DB에서 raw SQL로 타임스탬프 테스트 데이터를 넣을 때는 postgres 세션 TimeZone(이 컨테이너는 UTC)과 호스트/JVM 로컬시간대(KST, UTC+9)의 9시간 차이를 반드시 보정할 것.**
- `quiz_history` 테이블에 시연용 테스트 데이터 10건이 남아있음(id 4~13, user_id=2). 운영 배포 전 정리 필요 — `DELETE FROM quiz_history WHERE user_id = 2 AND id BETWEEN 4 AND 13;`.
- 브라우저 자동화: "Multiple Chrome browsers connected" 프롬프트가 뜨면 **Browser 2**를 선택할 것(Browser 1은 `localhost:3000` 접근 불가). 이 원격 브라우저는 스크린샷 좌표와 실제 클릭 좌표가 간헐적으로 어긋나는 경우가 있어(뷰포트 스케일링 이슈로 추정), 클릭이 반영 안 되면 `computer` 좌표 클릭 대신 `find`로 요소 ref를 얻어 `ref` 기반 클릭을 사용할 것.
