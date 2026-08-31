# 현재 작업 인계

## 현재 목표와 사용자 결정 사항

- 목표: Task 3 Fix round 1의 Important finding 2건만 TDD로 해결한다.
- 삭제 충돌 오류는 `error.details.referencedEvents[]` 고정 객체 계약을 사용한다.
- 현재 ADMIN 테스트 발송의 실제 SMTP 호출은 DB transaction 밖에서 실행해야 한다.
- Minor 권한 테스트 제안은 ledger에 deferred 되었으므로 이번 loop에서 제외한다.
- 기존 Task 3의 9필드 binding Ruling, 최초 시드 unbind 비복구, 현재 ADMIN 전용 수신자 규칙은 유지한다.

## 완료한 작업

- WebMvc 기대 경로를 `$.error.details.referencedEvents[0].eventCode`로 변경하고 raw 배열 응답의 `PathNotFoundException` RED를 확인했다.
- `EmailTemplateInUseDetails(referencedEvents)` record를 추가해 삭제 충돌 details를 고정 객체로 감쌌다.
- service 예외 타입과 WebMvc JSON 계약 focused GREEN을 확인했다.
- 실제 Spring proxy·JPA repository·mock JavaMailSender를 사용하는 transaction 통합 테스트를 추가했다.
- 수정 전 `mailSender.send` 시 transaction 활성 assertion RED를 확인했다.
- public `EmailTemplateService.testSend`에 `Propagation.NOT_SUPPORTED`를 적용했다.
- 수정 후 실제 SMTP 호출 시 transaction 비활성 GREEN을 확인했다.
- 관리자 백엔드 히스토리 `HIST-20260831-007`을 작성했다.
- Fix round 1 focused 통합과 backend 전체 429개 테스트 회귀를 통과했다.
- 신규 transaction 테스트를 전역 Boot configuration 후보가 아닌 `@SpringJUnitConfig`로 격리했다.

## 미완료 작업

- 없음. Fix round 1 구현·TDD·히스토리·focused 및 전체 회귀를 완료했으며 이 스냅샷은 지정 커밋에 포함된다.

## 수정한 파일 목록

- `backend/src/main/java/com/tpmp/testprep/dto/response/EmailTemplateInUseDetails.java`
- `backend/src/main/java/com/tpmp/testprep/service/EmailTemplateService.java`
- `backend/src/test/java/com/tpmp/testprep/controller/AdminEmailTemplateControllerWebMvcTest.java`
- `backend/src/test/java/com/tpmp/testprep/service/EmailTemplateServiceTest.java`
- `backend/src/test/java/com/tpmp/testprep/service/EmailTemplateTestSendTransactionIntegrationTest.java`
- `docs/history/back/adm/AdminEmailTemplate_Modified.md`
- `docs/agent-handoff/CURRENT.md`

## 실행한 검증 명령과 결과

- Finding 1 RED: `cd backend; .\gradlew.bat test --tests "com.tpmp.testprep.controller.AdminEmailTemplateControllerWebMvcTest.deleteReturnsDetailedConflict" --rerun-tasks`
  - 결과: 1 test, 1 failure, `PathNotFoundException`, `BUILD FAILED in 23s`.
- Finding 1 GREEN: WebMvc 삭제 충돌 + service 삭제 충돌 2개 method focused 실행.
  - 결과: `BUILD SUCCESSFUL in 25s`.
- Finding 2 RED: `cd backend; .\gradlew.bat test --tests "com.tpmp.testprep.service.EmailTemplateTestSendTransactionIntegrationTest" --rerun-tasks`
  - 결과: 1 test, 1 failure. `JavaMailSender.send` Answer에서 실제 transaction active라 `isFalse()` assertion 실패, `BUILD FAILED in 38s`.
- Finding 2 GREEN: 동일 통합 테스트 재실행.
  - 결과: 1 test 통과, `BUILD SUCCESSFUL in 38s`.
- Fix round 1 focused 통합: Controller·service·sender·transaction integration 동시 재실행.
  - 결과: `BUILD SUCCESSFUL in 42s`.
- 첫 backend 전체 회귀: 427 tests 중 기존 `InquiryEmailDeliveryProcessorTest` bootstrap 1 failure, `BUILD FAILED in 1m 10s`.
  - 원인: 신규 테스트가 같은 package에 두 번째 nested `@SpringBootConfiguration`을 추가해 기존 `@DataJpaTest`의 자동 탐색 후보가 2개가 됐다.
  - 수정: 신규 테스트를 `@SpringJUnitConfig`와 일반 `@Configuration`·명시적 mock bean으로 격리했다.
- bootstrap 회귀 focused: 신규 transaction integration + 기존 실패 DataJpaTest 동시 실행.
  - 결과: `BUILD SUCCESSFUL in 40s`.
- 최종 backend 전체 회귀: `cd backend; .\gradlew.bat test --rerun-tasks`.
  - 결과: 48 suites·429 tests·0 failures·0 errors·0 skipped, `BUILD SUCCESSFUL in 1m 11s`.
- 120자 formatting refactor 후 transaction integration 재실행: `BUILD SUCCESSFUL in 36s`.
- 정적 검증: `git diff --check`, 120자 초과, 신규 테스트의 `@SpringBootConfiguration` 부재 확인 결과 오류 없음.

## 실패·경고·주의사항

- `NOT_SUPPORTED` 검증은 annotation 텍스트가 아니라 실제 Spring AOP proxy를 통과한 SMTP 호출 시점의 transaction 상태를 검사한다.
- Gradle 9 deprecated 경고, 기존 `ExamQuestionSyncServiceTest` unchecked 경고, JVM class sharing 경고가 유지된다.
- 다른 Task 변경과 deferred Minor 권한 테스트는 건드리지 않는다.

## 다음 세션이 바로 실행할 명령

후속 Task 4 brief 확인: `Get-Content -Raw .superpowers/sdd/2026-08-31-admin-email-template-management/task-4-brief.md`
