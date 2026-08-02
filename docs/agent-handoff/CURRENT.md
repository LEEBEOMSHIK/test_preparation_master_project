# Agent Handoff - CURRENT

> 최종 갱신: 2026-08-02

## 현재 목표와 사용자 결정 사항

- DB 마이그 적용(완료) → 커밋/푸시 + 서버 기동(완료) → 로그인 후 체감 지연 원인 진단 요청에 답변 → 그 과정에서 발견한 관리자 대시보드 추이 API의 N+1성 쿼리를 "최적화해줘" 요청받아 수정.

## 완료한 작업

1. DB 마이그(베이스라인+콘텐츠 덤프) 및 베이스라인 스크립트 CHECK 제약 버그 수정 — 커밋 `93fe746`, push 완료.
2. 로컬 서버 기동(DB/백엔드/프론트) — `.env`의 빈 `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`가 OAuth2 client 등록을 깨서 주석 처리(로컬 전용, 미커밋 대상).
3. "로그인이 느리다" 문의 진단: 실제 원인은 `next dev`의 라우트별 최초 컴파일 지연(dev 전용, 프로덕션 `next build`/Dockerfile에는 해당 없음)이었음. 다만 진단 과정에서 `AdminDashboardController`의 `getTrend()`가 day-loop로 3개 COUNT 쿼리를 반복 실행(90일 조회 시 270쿼리, 0.71s)하는 **운영에도 남는 실제 비효율**을 발견해 사용자 요청으로 최적화.
4. **최적화(미커밋)**: `getTrend()`를 GROUP BY 집계 3쿼리로 재작성.
   - `LoginHistoryRepository.countDailyByLoginAtBetween`, `ExamHistoryRepository.countDailyByTakenAtBetween`, `InquiryRepository.countDailyByCreatedAtBetween` 신규 추가(`GROUP BY CAST(... AS date)`).
   - `DashboardService.getTrend()` — 일별 루프+개별 쿼리 → 3쿼리 결과를 `Map<LocalDate,Long>`으로 모은 뒤 날짜 순회(누락일 0). `toDailyCountMap()` 헬퍼로 Hibernate의 `java.sql.Date`/`LocalDate` 반환 타입 차이 처리(`UserDashboardService`의 기존 패턴과 동일 이유).
   - `docs/history/back/adm/Dashboard_Modified.md`에 `HIST-20260802-006` 추가.

## 실행한 검증과 결과

| 항목 | 결과 |
|------|------|
| `./gradlew compileJava` / `./gradlew test` | 통과(기존 테스트에 DashboardService 테스트 없음) |
| 재기동 후 trend 응답시간 | days=7 0.37s(첫 호출) / days=30 0.15s / days=90 0.13s — days에 비례해 느려지던 문제 해소(기존 90일 0.71s 대비 약 5.5배 개선) |
| 데이터 정합성 | `login_history`의 유일한 실데이터(2026-07-17)가 `days=30` 조회에서 `07/17: count 1`로 정확히 집계됨 확인 |

## 미완료 작업

- 이번 최적화 변경 4개 파일 + 히스토리 파일 — **미커밋** (사용자에게 커밋/푸시 여부 확인 필요).
- `docs/agent-handoff/CURRENT.md` 자체도 미커밋(이전 턴부터 누적).

## 다음 세션이 바로 실행할 명령

```powershell
git status --short
git diff backend/src/main/java/com/tpmp/testprep/service/DashboardService.java

# 사용자 승인 후
git add backend/src/main/java/com/tpmp/testprep/repository/ExamHistoryRepository.java `
        backend/src/main/java/com/tpmp/testprep/repository/InquiryRepository.java `
        backend/src/main/java/com/tpmp/testprep/repository/LoginHistoryRepository.java `
        backend/src/main/java/com/tpmp/testprep/service/DashboardService.java `
        docs/history/back/adm/Dashboard_Modified.md
git commit -m "[BE] perf: 관리자 대시보드 추이 API N+1 쿼리를 GROUP BY 집계로 최적화"
```

## 현재 실행 중인 프로세스 (다음 세션 참고)

- `tpmp-db-local` (docker, 포트 5432)
- 백엔드 gradle bootRun (nohup, 포트 8080) — 최적화 반영 후 재기동 완료, 로그 `/tmp/backend3.log`
- 프론트 `next dev` (nohup, 포트 3000) — 로그 `/tmp/frontend.log` (이번 백엔드 재기동과 무관, 계속 실행 중)

## 주의사항 / 건드리면 안 되는 것

- `docs/db-migration/`의 델타 34개 파일 — 수정·삭제 금지.
- `.env`의 `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` 라인은 주석 처리된 채로 둘 것(이 로컬 전용, 실제 구글 로그인 테스트 시에만 값 채우고 주석 해제).
- `getStats()`가 쓰는 기존 `count*Between` 파생 메서드(오늘 하루 카운트용)는 그대로 유지 — 이번 최적화는 `getTrend()` 전용 신규 메서드만 추가한 것이라 기존 코드 경로와 충돌 없음.
