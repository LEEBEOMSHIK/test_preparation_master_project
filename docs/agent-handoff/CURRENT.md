# 현재 작업 인계

## 현재 목표와 사용자 결정 사항

- 목표: Task 7 글로벌 관리자 메뉴·DB 설명·운영 문서와 Tasks 1~7 최종 검증을 완료한다.
- 관리자 메뉴 계약: `이메일 템플릿 관리`, `/admin/email-templates`, `iconKey=email`, `displayOrder=15`, 전역 ADMIN 메뉴다.
- 운영 `ddl-auto=validate`에서는 `docs/db-migration/20260831_01_admin_email_template_management.sql`을 애플리케이션보다 먼저 적용한다.

## 완료한 작업

- DataInitializer 메뉴 생성·반복 실행 중복 방지 테스트를 RED에서 GREEN으로 구현했다.
- AdminLayoutShell API/fallback 메뉴·email 아이콘·base/new/edit 제목을 구현하고 fallback 편집 경로 테스트를 RED에서 GREEN으로 전환했다.
- `tableComments.ts`, 프로젝트 개요, DB 가이드에 신규 테이블·감사/FK·HTML 스냅샷·문의 6상태·운영 적용 순서를 기록했다.
- PostgreSQL 실제 목록 API에서 발견한 null keyword 500을 회귀 테스트 RED 후 빈 문자열 정규화로 수정해 GREEN 및 실제 200/3건을 확인했다.
- 로컬 PostgreSQL 15에 마이그레이션 SQL을 두 번 적용하고 시드/바인딩 멱등성, 6상태 제약, unbind 재기동 비복구, 메뉴 단일 시드를 확인했다.
- 실제 API로 PENDING/IN_PROGRESS/ON_HOLD/ANSWERED/COMPLETED/UNABLE_TO_PROCESS, QUEUED/missing/inactive outcome, 상태 보존, 설정 URL, 상태 HTML 스냅샷을 확인했다. BUG_REPORT 완료 전후 메시지 수도 2건으로 유지됐다.

## 미완료 작업

- 없음. Task 7 완료 커밋은 현재 HEAD의 `[INFRA] feat: 이메일 템플릿 메뉴와 운영 문서 반영`이다.

## 수정한 파일 목록

- `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java`
- `backend/src/test/java/com/tpmp/testprep/config/DataInitializerTest.java`
- `backend/src/main/java/com/tpmp/testprep/service/EmailTemplateService.java`
- `backend/src/test/java/com/tpmp/testprep/service/EmailTemplateServiceTest.java`
- `frontend/src/components/layout/AdminLayoutShell.tsx`
- `frontend/src/components/layout/AdminLayoutShell.test.tsx`
- `frontend/src/data/tableComments.ts`
- `docs/project-overview.md`
- `docs/db-guidelines.md`
- `docs/history/back/adm/AdminInit_Modified.md`
- `docs/history/back/adm/AdminEmailTemplate_Modified.md`
- `docs/history/front/adm/AdminLayout_Modified.md`
- `docs/history/front/adm/AdminEmailTemplate_Modified.md`
- `docs/agent-handoff/CURRENT.md`

## 실행한 검증 명령과 결과

- RED backend: `DataInitializerTest` 7개 중 신규 2개 `WantedButNotInvoked` 실패; PostgreSQL 호환 service 테스트는 실제 null 전달로 실패.
- RED frontend: `AdminLayoutShell.test.tsx` 2개 중 fallback 편집 경로 링크 미발견 1개 실패.
- focused GREEN: `DataInitializerTest` 7개, AdminLayoutShell 2개, PostgreSQL 호환 service 테스트 모두 성공.
- backend 전체: PostgreSQL 수정 후 최종 재실행, 49 suites/446 tests, 실패·오류·skip 0, `BUILD SUCCESSFUL`.
- frontend: `npx tsc --noEmit` 성공, Jest 33 suites/161 tests 성공, `npm run build` 성공.
- PostgreSQL: `tpmp-db-local-55432`(`postgres:15-alpine`, PostgreSQL 15.18, DB/user `tpmp/tpmp`, host port 55432)에 SQL 2회 성공. 기본 템플릿·binding 각각 3개/중복 없음, 6상태 check, unbind 후 재기동 비복구, 메뉴 1건을 확인했다.
- 실제 API: keyword 없는 템플릿 목록 200/3건, 6상태 수용, COMPLETED/ANSWERED/UNABLE_TO_PROCESS `QUEUED`, 미바인딩 `SKIPPED_TEMPLATE_MISSING`, 비활성 `SKIPPED_TEMPLATE_INACTIVE`, 두 skip 모두 상태 저장 및 `/admin/email-templates?tab=bindings` 반환을 확인했다.
- delivery: NEW_INQUIRY/USER_MESSAGE/ADMIN_MESSAGE는 body가 있고 `html_body`는 없으며, 상태 템플릿 delivery는 body와 `html_body`가 모두 있다. 사용자·관리자 타임라인 메시지 각 1건도 확인했다. 수동 회귀 데이터는 정확한 ID/제목 조건으로 정리했다.

## 실패·경고·주의사항

- 로컬 SMTP가 구성되지 않아 수신자 body 없는 `POST /api/admin/email-templates/2/test-send`는 계약대로 요청됐지만 실제 발송은 502 `EMAIL_TEMPLATE_TEST_SEND_FAILED`였다.
- frontend build의 기존 viewport metadata 경고가 남아 있다.
- SQL 선행 적용 없이 운영 애플리케이션을 기동하면 `ddl-auto=validate`가 실패한다.

## 다음 세션이 바로 실행할 명령

`git status --short; git log -1 --oneline`

## 건드리면 안 되는 파일 또는 기존 미추적 파일

- Task 1~6 이메일 템플릿·문의 상태 기능과 관련 커밋 전체.
- Task 7 명시 경로 밖의 사용자 변경.
