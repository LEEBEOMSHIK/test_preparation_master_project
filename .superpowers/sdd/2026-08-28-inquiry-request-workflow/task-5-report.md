# Task 5 보고서 — 관리자 문의·요청 통합

## RED

- `frontend\node_modules\.bin\jest --runInBand --testPathPattern=admin/inquiries`
  - 관리자 상세 3개, 설정 4개 테스트가 실패했다.
  - 상세은 `변경할 상태` UI가 없었고, 설정은 서버 응답의 `recipientEmails` 대신 구형 `recipients`를 읽어 로딩 오류가 발생했다.
  - 테스트 환경이나 오탈자가 아니라 새 상태 처리·설정 계약이 구현되지 않아 실패하는 것을 확인했다.
- `.\gradlew.bat test --tests com.tpmp.testprep.service.InquiryServiceTest`
  - 최초 sandbox 실행은 Gradle 8.5 다운로드 네트워크 차단으로 중단됐다.
  - 승인 실행에서는 `findAdminFiltered`와 `adminGetAll`에 keyword 인자가 없어 `compileTestJava`가 3건의 시그니처 오류로 실패하는 기대된 RED를 확인했다.

## GREEN

- 관리자 목록을 `InquirySummary`와 서버 `page/size/status/requestType/targetArea/keyword` 필터로 전환하고 `size=10000` 전체 조회·구형 보류 동작을 제거했다.
- 관리자 상세을 `InquiryDetail`, `InquiryTimeline`, `InquiryMessageComposer`, `adminAddMessage`, `adminUpdateStatus` 기반으로 전환했다.
- 일반 문의·기타에는 `ANSWERED`, 처리형에는 `COMPLETED`·`UNABLE_TO_PROCESS`만 종료 상태로 제공하고 종료 안내를 필수로 검사한다.
- 종료 상태는 `IN_PROGRESS`로 다시 열 수 있고, 이메일 발송 이력을 조회해 FAILED 건의 오류와 재발송 작업을 제공한다.
- 중간 답변과 종료 상태의 사용자 이메일 체크는 기본 false이며 성공 후 false로 초기화한다.
- 관리자 수신 설정은 `recipientEmails` GET/PUT 계약, 최대 10개, 이메일 형식, trim/lowercase 중복, 활성 최소 1개, 공통 Skeleton과 서버 오류 추출을 적용했다.
- 백엔드 목록 keyword를 바인딩 파라미터로 제목·본문·작성자명에 대소문자 무시 부분 검색하고 기존 구조화 필터와 결합했다.

## 수정 파일

- `frontend/src/services/inquiryService.ts`
- `frontend/src/app/admin/inquiries/page.tsx`
- `frontend/src/app/admin/inquiries/page.test.tsx`
- `frontend/src/app/admin/inquiries/[id]/page.tsx`
- `frontend/src/app/admin/inquiries/[id]/page.test.tsx`
- `frontend/src/app/admin/inquiries/settings/page.tsx`
- `frontend/src/app/admin/inquiries/settings/page.test.tsx`
- `frontend/src/components/ui/InquiryMessageComposer.test.tsx`
- `backend/src/main/java/com/tpmp/testprep/controller/AdminInquiryController.java`
- `backend/src/main/java/com/tpmp/testprep/service/InquiryService.java`
- `backend/src/main/java/com/tpmp/testprep/repository/InquiryRepository.java`
- `backend/src/test/java/com/tpmp/testprep/service/InquiryServiceTest.java`
- `docs/history/front/adm/AdminInquiryFaq_Modified.md`
- `docs/history/back/adm/AdminInquiry_Modified.md`

## 검증 명령과 결과

- `.\gradlew.bat test --tests com.tpmp.testprep.service.InquiryServiceTest` — 통과.
- `.\gradlew.bat test` — 전체 백엔드 테스트 통과, `BUILD SUCCESSFUL`.
- `frontend\node_modules\.bin\jest --runInBand --testPathPattern=admin/inquiries` — 3 suites, 10 tests 통과.
- `frontend\node_modules\.bin\jest --runInBand --testPathPattern=InquiryMessageComposer` — 1 suite, 2 tests 통과.
- `npm test -- --watch=false --runInBand` — 전체 프론트 14 suites, 70 tests 통과.
- `frontend\node_modules\.bin\tsc --noEmit` — 통과.
- `npm run build` — 52개 페이지 프로덕션 빌드 통과. 기존 전역 metadata viewport 경고는 남아 있다.
- `rg`로 `adminReply`, `adminToggleHold`, `/reply`, `/hold` 생산 코드 참조 0건 확인.
- `git diff --check` — 통과.

## 히스토리

- `docs/history/front/adm/AdminInquiryFaq_Modified.md`의 `HIST-20260828-001`
- `docs/history/back/adm/AdminInquiry_Modified.md`의 `HIST-20260828-005`

## 커밋

- `[FE][BE]_feat:_complete_inquiry_request_workflow`

## Fix Round 2

### RED

- `DashboardServiceTest.getStatsCountsAllOpenBugReportStatuses`를 먼저 추가했다.
- `\.\gradlew.bat test --tests com.tpmp.testprep.service.DashboardServiceTest`에서 `InquiryRepository.countByRequestTypeAndStatusIn(RequestType, List<Status>)`가 없어 `compileTestJava` 2건이 실패하는 기대된 RED를 확인했다.
- 최초 sandbox 실행은 Gradle 배포본·플러그인 네트워크 제한으로 코드 컴파일 전에 중단됐으며, 승인 실행에서 실제 계약 RED를 별도로 확보했다.

### GREEN

- 대시보드 미처리 버그 수를 `BUG_REPORT`이면서 `PENDING`·`IN_PROGRESS`·`ON_HOLD`인 전체 건수로 변경했다.
- `AdminLayoutShell` fallback과 화면 제목을 `문의·요청 관리`로 통일했다.
- `tableComments.ts`에 `inquiries`, `inquiry_messages`, `inquiry_notification_settings`, `inquiry_notification_recipients`, `inquiry_email_deliveries`의 컬럼·FK 설명을 완성했다.
- `docs/agent-handoff/CURRENT.md`를 Task 1~5 최종 상태로 교체했다.
- 관리자 프론트/백엔드 이력을 각각 `HIST-20260828-002`, `HIST-20260828-006`으로 보강했다.

### 검증

- `\.\gradlew.bat test --tests com.tpmp.testprep.service.InquiryServiceTest --tests com.tpmp.testprep.service.DashboardServiceTest` — `BUILD SUCCESSFUL`.
- `node_modules\.bin\jest.cmd --runTestsByPath ... --runInBand` — 문의 관련 9 suites, 23 tests 통과.
- `node_modules\.bin\tsc.cmd --noEmit` — 통과.
- `rg`로 `adminReply`, `adminToggleHold`, `/reply`, `/hold` 생산 코드 참조 0건 확인.
- `git diff --check` — 통과.

### 커밋

- `[FE][BE]_fix:_close_inquiry_workflow_review_gaps`
