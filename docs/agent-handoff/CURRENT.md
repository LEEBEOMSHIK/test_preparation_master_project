# Agent Handoff - CURRENT

> 최종 갱신: 2026-08-04

## 현재 목표와 사용자 결정 사항

- 퀴즈 이력 관리 사이드바 메뉴 추가는 커밋(`020571b`) 및 `main` 푸시 완료.
- 이어서 사용자가 요청한 퀴즈 이력 테스트 데이터 10건 삽입 후, "오늘 퀴즈 풀이" 카드가 0으로 나오는 것을 보고 "오늘 기준 시간대 문제도 확인해서 고쳐줘"라고 요청 → 조사 결과 **애플리케이션 자체에는 시간대 버그가 없음**을 확인. 원인은 테스트 데이터를 `psql` 세션에서 raw SQL `now()`로 직접 삽입했기 때문 — 해당 postgres 컨테이너의 세션 TimeZone이 UTC라 KST(호스트 로컬시간, UTC+9)보다 9시간 느린 값이 들어감. 반면 실제 앱은 `QuizHistory.java`의 `@PrePersist`에서 `LocalDateTime.now()`(JVM 로컬시간대=KST)를 그대로 저장하고, `DashboardService`의 "오늘" 판정도 동일 JVM 시각 기준이라 서로 일관됨 — 실제 API를 통해 방금 넣은 진짜 퀴즈 응시 1건은 즉시 "오늘 퀴즈 풀이"에 정상 반영됨을 curl로 확인.

## 완료한 작업

1. (진단용) `POST /api/user/quiz/check`를 실제로 호출해 진짜 앱 흐름으로 `quiz_history` 1행을 생성 → `created_at`이 호스트 로컬시각(KST)과 정확히 일치함을 확인, 대시보드 `todayQuizAttemptCount`가 즉시 1로 반영됨을 확인 → 진단 완료 후 해당 진단용 행(id=14)은 삭제.
2. 이전에 raw SQL로 넣었던 시연용 테스트 데이터 10건(id 4~13)의 `created_at`을 `+ interval '9 hours'`로 일괄 보정 — UTC 기준으로 삽입됐던 값을 KST 기준으로 맞춤. 이제 최근 4일(2026-07-31~08-04)에 걸쳐 정상 분산되고, 그중 2건이 "오늘"(2026-08-04, KST) 범위에 들어와 대시보드 "오늘 퀴즈 풀이"가 2로 정상 표시됨.
3. **코드 변경 없음** — 순수 로컬 DB 데이터 보정 작업이므로 히스토리 문서(`docs/history/`) 작성 대상 아님.

## 실행한 검증과 결과

| 항목 | 결과 |
|------|------|
| 실제 API로 진단용 행 삽입 | `created_at = 2026-08-04 05:14:32`(KST, 호스트 `date` 명령 결과와 일치) 확인 |
| `GET /api/admin/dashboard/stats` | 보정 전 `todayQuizAttemptCount:0` → 진단행 추가 시 `1` → 진단행 삭제·보정 후 최종 `2` |
| 브라우저 확인 | 대시보드 "오늘 퀴즈 풀이" 카드 2로 정상 표시 확인 |

## 미완료 작업

- 없음(코드 변경 없는 순수 데이터 보정 세션). `CURRENT.md` 본 파일만 갱신됨 — 원하면 커밋해도 되지만 의미 있는 코드 diff는 없음.

## 다음 세션이 바로 실행할 명령

없음(대기 중인 코드 변경 없음). 필요 시 `git status --short`로 확인.

## 현재 실행 중인 프로세스

- `tpmp-db-local` (docker, 포트 5432)
- 백엔드 gradle bootRun (nohup, 포트 8080), 로그 `/tmp/backend_quiz_menu.log`
- 프론트 `next dev` (nohup, 포트 3000)

## 주의사항 / 건드리면 안 되는 것

- `docs/db-migration/`의 기존 델타 34개 — 수정·삭제 금지.
- 브라우저 자동화 시 `confirm()`/`alert()`를 띄우는 버튼(삭제 등)은 클릭 금지 — 필요하면 API로 직접 처리.
- `.env`의 `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` 라인은 주석 처리된 채로 둘 것(로컬 전용).
- **로컬 DB에서 raw SQL로 타임스탬프 테스트 데이터를 넣을 때는 반드시 postgres 세션 TimeZone(이 컨테이너는 UTC)과 호스트/JVM 로컬시간대(KST, UTC+9)의 9시간 차이를 보정할 것.** `now()` 대신 `now() AT TIME ZONE 'Asia/Seoul'` 또는 직접 `+ interval '9 hours'`를 더해 삽입 — 그렇지 않으면 "오늘" 관련 통계·필터에서 실제 KST 기준과 어긋나 보인다(단, 이는 데이터 보정 이슈이지 애플리케이션 버그가 아님. 실제 API를 통해 들어오는 데이터는 JVM 로컬시간대로 일관되게 기록됨).
- `quiz_history` 테이블에 시연용 테스트 데이터 10건이 남아있음(id 4~13, user_id=2, `created_at` KST로 보정 완료). 실제 사용자 데이터가 아니므로 운영 배포 전 정리 필요 — `DELETE FROM quiz_history WHERE user_id = 2 AND id BETWEEN 4 AND 13;` (또는 전체 초기화 시 `TRUNCATE quiz_history;`).
