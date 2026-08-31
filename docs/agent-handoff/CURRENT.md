# 현재 작업 인계

## 현재 목표와 사용자 결정 사항

- 목표: Task 3 관리자 이메일 템플릿 기본 시드, CRUD, 이벤트 연결, 현재 ADMIN 전용 테스트 발송 API를 TDD로 구현한다.
- 시드: 세 `system_key`가 모두 없는 최초 설치에서만 기본 binding 3개를 생성한다. 하나라도 존재하는 재기동에서는 빠진 템플릿만 보완하고 binding은 생성하지 않아 관리자 unbind를 보존한다.
- 테스트 발송: request에 수신자를 받지 않고 인증된 현재 ADMIN의 DB 이메일만 사용한다. 비활성 템플릿도 테스트 발송할 수 있다.
- binding 응답: 원본 JSON과 후속 Task 5 타입에 정의된 9개 필드를 사용한다. brief의 “10개”는 상위 Ruling으로 단순 개수 오기로 확정됐다.

## 완료한 작업

- exact 기본 템플릿 3종 카탈로그와 단일 트랜잭션 멱등 시드 러너를 구현했다.
- 관리자 템플릿 목록·상세·생성·수정·복제·기본값 복원·논리 삭제·preview·테스트 발송 서비스를 구현했다.
- 고정 3개 이벤트 binding 조회·연결·해제 서비스를 구현했다.
- `BusinessException.details`, `ApiResponse.error.details`, 전역 오류 응답 전달을 하위 호환 overload와 함께 구현했다.
- 현재 ADMIN 전용 multipart HTML/평문 테스트 발송과 마스킹 로그·SMTP 502 변환을 구현했다.
- ADMIN 전용 두 Controller와 `@Valid`, principal 이메일 전달, unknown event 명시적 404를 구현했다.
- 각 단계에서 production 코드 전에 실패 테스트를 작성하고 RED를 확인한 뒤 focused GREEN을 확인했다.
- 관리자 백엔드 히스토리 `HIST-20260831-006`을 작성했다.
- Task 3 focused 통합과 backend 전체 428개 테스트 회귀를 통과했다.

## 미완료 작업

- 없음. Task 3 구현·TDD·히스토리·focused 및 전체 회귀를 완료했으며 이 스냅샷은 지정 커밋에 포함된다.

## 수정한 파일 목록

- `backend/src/main/java/com/tpmp/testprep/config/DefaultEmailTemplateCatalog.java`
- `backend/src/main/java/com/tpmp/testprep/config/EmailTemplateSeedRunner.java`
- `backend/src/main/java/com/tpmp/testprep/service/EmailTemplateService.java`
- `backend/src/main/java/com/tpmp/testprep/service/EmailTemplateBindingService.java`
- `backend/src/main/java/com/tpmp/testprep/service/EmailTemplateTestMailSender.java`
- `backend/src/main/java/com/tpmp/testprep/controller/AdminEmailTemplateController.java`
- `backend/src/main/java/com/tpmp/testprep/controller/AdminEmailTemplateBindingController.java`
- `backend/src/main/java/com/tpmp/testprep/dto/request/EmailTemplateCreateRequest.java`
- `backend/src/main/java/com/tpmp/testprep/dto/request/EmailTemplateUpdateRequest.java`
- `backend/src/main/java/com/tpmp/testprep/dto/request/EmailTemplatePreviewRequest.java`
- `backend/src/main/java/com/tpmp/testprep/dto/request/EmailTemplateBindingRequest.java`
- `backend/src/main/java/com/tpmp/testprep/dto/response/EmailTemplateSummaryResponse.java`
- `backend/src/main/java/com/tpmp/testprep/dto/response/EmailTemplateDetailResponse.java`
- `backend/src/main/java/com/tpmp/testprep/dto/response/EmailTemplateReferenceResponse.java`
- `backend/src/main/java/com/tpmp/testprep/dto/response/EmailTemplateVariableResponse.java`
- `backend/src/main/java/com/tpmp/testprep/dto/response/EmailTemplatePreviewResponse.java`
- `backend/src/main/java/com/tpmp/testprep/dto/response/EmailTemplateBindingResponse.java`
- `backend/src/main/java/com/tpmp/testprep/dto/response/EmailTemplateTestSendResponse.java`
- `backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java`
- `backend/src/main/java/com/tpmp/testprep/exception/BusinessException.java`
- `backend/src/main/java/com/tpmp/testprep/exception/GlobalExceptionHandler.java`
- `backend/src/main/java/com/tpmp/testprep/dto/response/ApiResponse.java`
- `backend/src/test/java/com/tpmp/testprep/config/EmailTemplateSeedRunnerTest.java`
- `backend/src/test/java/com/tpmp/testprep/service/EmailTemplateServiceTest.java`
- `backend/src/test/java/com/tpmp/testprep/service/EmailTemplateBindingServiceTest.java`
- `backend/src/test/java/com/tpmp/testprep/service/EmailTemplateTestMailSenderTest.java`
- `backend/src/test/java/com/tpmp/testprep/dto/response/ApiResponseContractTest.java`
- `backend/src/test/java/com/tpmp/testprep/controller/AdminEmailTemplateControllerWebMvcTest.java`
- `backend/src/test/java/com/tpmp/testprep/controller/AdminEmailTemplateBindingControllerWebMvcTest.java`
- `docs/history/back/adm/AdminEmailTemplate_Modified.md`
- `docs/agent-handoff/CURRENT.md`

## 실행한 검증 명령과 결과

- 기준선 `cd backend; .\gradlew.bat test`: `BUILD SUCCESSFUL in 56s`.
- 시드 RED: missing catalog/runner 6 compile errors, `BUILD FAILED in 17s`.
- 시드 GREEN: 3 tests, `BUILD SUCCESSFUL in 26s`.
- CRUD·binding RED: missing DTO/service/error contract 28 compile errors, 이후 최종 missing service 5 errors, `BUILD FAILED in 11s`.
- CRUD·binding GREEN: 13 tests, `BUILD SUCCESSFUL in 23s`.
- `error.details` RED: missing overload/accessor 3 compile errors, `BUILD FAILED in 12s`.
- `error.details` GREEN: 2 tests, `BUILD SUCCESSFUL in 13s`.
- 테스트 발송 RED: missing dependency constructor 1 compile error, `BUILD FAILED in 12s`.
- 테스트 발송 중간 실패: 4 tests 중 MIME test helper 1 failure. 실제 content가 multipart이나 mock transport가 헤더를 갱신하지 않은 것이 원인이었다.
- 테스트 발송 GREEN: 4 tests, `BUILD SUCCESSFUL in 18s`.
- Controller RED: missing Controller 2 compile errors, `BUILD FAILED in 11s`.
- Controller GREEN: 15 tests, `BUILD SUCCESSFUL in 27s`.
- Task 3 focused 통합: 7개 test suite 동시 재실행, `BUILD SUCCESSFUL in 29s`.
- backend 전체 회귀: `cd backend; .\gradlew.bat test --rerun-tasks`, 47 suites·428 tests·0 failures·0 errors·0 skipped, `BUILD SUCCESSFUL in 1m 10s`.
- 정적 검증: `git diff --check`, 120자 초과 검색, 테스트 메일 로그 민감정보 패턴 검색 결과 오류 없음.

## 실패·경고·주의사항

- 파일별 히스토리는 현재 `HIST-20260831-005`까지 있어 Task 3은 다음 순번 `006`을 사용한다.
- Gradle 9 deprecated 경고, 기존 `ExamQuestionSyncServiceTest` unchecked 경고, JVM class sharing 경고가 기준선부터 존재한다.
- 정의되지 않은 binding 열 번째 필드는 추가하지 않는다.
- 다른 Task 파일과 사용자 변경을 되돌리지 않는다.

## 다음 세션이 바로 실행할 명령

후속 Task 4 brief 확인: `Get-Content -Raw .superpowers/sdd/2026-08-31-admin-email-template-management/task-4-brief.md`
