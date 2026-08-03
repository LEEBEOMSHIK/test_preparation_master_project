# Agent Handoff - CURRENT

> 최종 갱신: 2026-08-03

## 현재 목표와 사용자 결정 사항

- "사용자에서 관심 시험에 리눅스 2급을 추가했는데 시험정보 탭 필터에 안 나온다 — 원인 파악해서 수정" 요청 처리.
- 중간에 사용자 지시 추가: "데이터가 없어서 안 보이는 거라면, 탭에서 아예 안 보이는 게 아니라 화면에 '시험정보가 없다'고 표시하는 게 알기 쉽다" → 근본 데이터 보강 + UI 견고성 개선 둘 다 반영.

## 완료한 작업

1. **원인 진단**: 두 가지가 겹친 문제였음.
   - (a) `exam_info`에 "리눅스마스터 2급" 데이터가 0건(f55fea5 마이그에서 domain_slave만 추가하고 exam_info 시드는 누락).
   - (b) `/user/exam-info` 필터 탭 목록(`allTypes`)이 서버가 반환한 `items`(이미 관심시험으로 필터링된 결과)에서만 뽑혀서, 데이터가 0건인 관심 유형은 탭 자체가 생성 안 됨.
2. **데이터 보강**: 리눅스마스터 1급/SQLD와 동일한 패턴(`DataInitializer` idempotent 시더)으로 `ensureLinuxMaster2ExamInfo()` 추가 — ihd.or.kr 공식 2026년 일정 8건(4회차 × 1차 필기60분·2차 필기100분).
   - 처음에는 `docs/db-migration/` SQL 마이그레이션 파일로 접근했다가, 기존 exam_info 시드가 전부 `DataInitializer` Java 코드 방식임을 뒤늦게 발견하고 SQL 파일은 삭제, Java 메서드로 다시 구현(일관성).
3. **UI 견고성 개선**: `allTypes`를 `userInterests`(관심 시험 유형, 있으면 우선) ∪ `items`의 examType 기준으로 변경 — 데이터가 없어도 탭은 항상 보이고, 클릭 시 기존 빈 상태 메시지("표시할 시험 정보가 없습니다")로 안내.
4. **콘텐츠 덤프 동기화**: `docs/sql/tpmp_content_data.sql`에 새 exam_info 8건 추가(append-only, 기존 11건 변경 없음).
5. **문서화**: `docs/history/back/adm/AdminExamInfo_Modified.md`(HIST-20260803-001), `docs/history/front/usr/UserExamInfo_Modified.md`(HIST-20260803-001), `docs/sql/README.md` 갱신.

## 실행한 검증과 결과

| 항목 | 결과 |
|------|------|
| `./gradlew compileJava`/`./gradlew test` | 통과 |
| `npx tsc --noEmit` | 통과 |
| 백엔드 재기동 후 로그 | 8건 모두 "이미 존재 — 건너뜀"(멱등성 확인, 신규 DB에서는 정상 생성) |
| 브라우저 e2e(사용자 계정, 관심시험에 리눅스마스터 2급 포함) | 필터 탭에 "리눅스마스터 2급" 정상 노출, 클릭 시 실제 카드(접수 2026.01.26~02.04, 시험일정 2026.01.27~02.05 범위 포함) 정상 렌더링 확인 |
| 임시 검증 DB e2e | 베이스라인+콘텐츠 덤프 재현, ERROR 0건, exam_info 리눅스마스터 2급 8건 반영 확인 후 삭제 |

## 미완료 작업

- 변경 파일 전부 **미커밋** — 사용자 승인 필요:
  - `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java`
  - `frontend/src/app/user/exam-info/page.tsx`
  - `docs/sql/tpmp_content_data.sql`
  - `docs/sql/README.md`
  - `docs/history/back/adm/AdminExamInfo_Modified.md`
  - `docs/history/front/usr/UserExamInfo_Modified.md`
  - `docs/agent-handoff/CURRENT.md` (본 파일)

## 다음 세션이 바로 실행할 명령

```powershell
git status --short

# 사용자 승인 후
git add backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java `
        frontend/src/app/user/exam-info/page.tsx `
        docs/sql/tpmp_content_data.sql docs/sql/README.md `
        docs/history/back/adm/AdminExamInfo_Modified.md `
        docs/history/front/usr/UserExamInfo_Modified.md `
        docs/agent-handoff/CURRENT.md
git commit -m "[FE][BE] fix: 리눅스마스터 2급 시험정보 필터 탭 미노출 수정"
git push origin main
```

## 현재 실행 중인 프로세스

- `tpmp-db-local` (docker, 포트 5432)
- 백엔드 gradle bootRun (nohup, 포트 8080) — 이번 변경 반영 재기동 완료, 로그 `/tmp/backend5.log`
- 프론트 `next dev` (nohup, 포트 3000) — 로그 `/tmp/frontend.log`

## 주의사항 / 건드리면 안 되는 것

- `docs/db-migration/`의 기존 델타 34개 — 수정·삭제 금지. (이번에 만들었다가 지운 `20260803_01_seed_linux2_exam_info.sql`은 최종적으로 저장소에 없음 — DataInitializer 방식으로 대체됐기 때문에 정상)
- exam_info류 시드 데이터는 `docs/db-migration/` SQL이 아니라 **`DataInitializer.java`의 `ensure*ExamInfo()` 메서드**로 관리하는 것이 이 프로젝트의 확립된 패턴 — 향후 시험 일정 데이터를 추가할 때 이 패턴을 따를 것.
- `.env`의 `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` 라인은 주석 처리된 채로 둘 것(로컬 전용, 이전 세션에서 처리).
