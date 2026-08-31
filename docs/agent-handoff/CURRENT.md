# 현재 작업 인계

## 현재 목표와 사용자 결정 사항

- 목표: Task 2 Fix round 2의 토큰 제거/생성 상쇄와 두 자리 placeholder prefix 충돌 finding을 해결한다.
- 고정 결정: raw HTML의 각 유효 토큰은 jsoup 파싱 전에 호출별 예측 불가능하고 끝 경계가 있는 sentinel로 보호한다.
- 고정 결정: sanitizer용 `TPMP_TOKEN_{index}` 형식은 유지하되 regex matcher가 반환한 완전한 placeholder 키별로 계수·복원한다.
- 고정 결정: Fix round 1의 brace 경계, 단계별 placeholder 검증과 가시 본문 검증을 그대로 유지한다.

## 완료한 작업

- production 수정 전에 정확한 DOCTYPE/엔티티 상쇄 재현과 정상 11개 토큰 테스트를 추가하고 21 tests 중 2 failures로 RED를 확인했다.
- 유효 raw 토큰마다 UUID nonce·순번·`_END` 경계로 구성된 sentinel을 할당해 jsoup 파싱 전에 보호했다.
- 파싱된 body에 등록된 각 raw sentinel이 정확히 1회 남는지 검사해 구조 밖 토큰 소실을 독립 탐지했다.
- raw 토큰이 보호된 상태에서 파싱 결과에 직접 `{{...}}` 문법이 나타나면 엔티티 등으로 새 토큰이 생성된 것으로 보고 거부했다.
- jsoup 구조 검증 후 raw sentinel을 원래 토큰으로 복원하고 기존 속성·sanitizer 보호 경계를 적용했다.
- sanitizer 일반 placeholder를 `TPMP_TOKEN_[0-9]+` exact matcher 결과로 계수하고 같은 matcher로 복원해 `1`/`10` prefix 충돌을 제거했다.
- 관리자 백엔드 히스토리 `HIST-20260831-004`를 작성했다.
- Fix round 2 변경을 `[BE] fix: 이메일 템플릿 토큰 경계 검증 보강` 커밋 단위로 정리했다.

## 미완료 작업

- 없음. Fix round 2 구현·검증·히스토리·커밋·보고서 작성을 완료했다.

## 수정한 파일 목록

- `backend/src/main/java/com/tpmp/testprep/service/EmailTemplateRenderer.java`
- `backend/src/test/java/com/tpmp/testprep/service/EmailTemplateRendererTest.java`
- `docs/history/back/adm/AdminEmailTemplate_Modified.md`
- `docs/agent-handoff/CURRENT.md`

## 실행한 검증 명령과 결과

- RED: `cd backend; .\gradlew.bat test --tests com.tpmp.testprep.service.EmailTemplateRendererTest --rerun-tasks`
  - 결과: 21 tests, 2 failures, 0 errors; DOCTYPE 토큰 소실/엔티티 토큰 생성 상쇄는 예외가 없었고 정상 11개 토큰은 `EmailTemplateRenderingException`으로 실패했다.
- focused GREEN: 동일 명령
  - 결과: 21 tests, failures 0, errors 0, skipped 0, `BUILD SUCCESSFUL in 13s`.
- backend 전체 회귀: `cd backend; .\gradlew.bat test --rerun-tasks`
  - 결과: 모든 backend 테스트 태스크 재실행, `BUILD SUCCESSFUL in 1m 4s`.
- 정적 점검: `git diff --check`, 대상 Java 120자 초과 검색
  - 결과: 오류 없음.

## 실패·경고·주의사항

- raw sentinel은 호출마다 `UUID.randomUUID()`로 생성되지만 최종 저장 HTML에는 모두 원래 토큰으로 복원되므로 출력 계약은 결정적이다.
- Gradle 9 호환 deprecated 경고, 기존 `ExamQuestionSyncServiceTest` unchecked 경고, JVM class sharing 경고가 있으나 테스트 실패는 없다.
- 다른 Task 파일, `frontend/node_modules`, `backend/uploads`, DB 볼륨은 건드리지 않았다.

## 다음 세션이 바로 실행할 명령

Task 3 brief 확인: `Get-Content -Raw .superpowers/sdd/2026-08-31-admin-email-template-management/task-3-brief.md`
