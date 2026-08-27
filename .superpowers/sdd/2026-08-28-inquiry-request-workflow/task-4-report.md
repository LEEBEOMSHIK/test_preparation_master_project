# Task 4 보고서 — 사용자 문의·요청 프론트

## RED

- `inquiry.test.ts`, `InquiryTimeline.test.tsx`, `InquiryMessageComposer.test.tsx`를 먼저 추가했다.
- 명세의 직접 파일 인자 Jest 명령은 Windows 경로 구분자를 정규식으로 해석해 테스트를 찾지 못했다. 동등한 `--testPathPattern` 선택 실행으로 3개 테스트를 발견·검증했다.

## GREEN

- 백엔드 `InquiryRequest`, `InquirySummaryResponse`, `InquiryDetailResponse`, `InquiryMessageResponse` 계약에 맞춰 요청 유형 5개, 상태 6개, 메시지·첨부 타입과 API를 갱신했다.
- 유형별 영역 규칙, 시간순 타임라인, 열린 접수 메시지 작성기, 조건부 신규 접수, 빠른 버그 신고의 영역/상세 위치 전달을 구현했다.
- 목록·상세·도메인 로딩에 공통 Skeleton과 모바일/다크모드 스타일을 적용했다.

## 검증

- `node_modules\\.bin\\jest --runInBand --testPathPattern="(inquiry\\.test|InquiryTimeline\\.test|InquiryMessageComposer\\.test)"` — 3 suites, 4 tests 통과
- `node_modules\\.bin\\tsc --noEmit` — 통과
- `git diff --check` — 통과

## 우려사항

- 명세의 파일 인자 형태 Jest 명령은 Windows Jest에서 경로를 testPathPattern 정규식으로 바꾸어 테스트가 0건으로 종료된다. 선택 실행은 동등한 정규식 패턴을 사용했다.

## 리뷰 수정 Round 1

- `BUG_REPORT`의 시험 영역을 `EXAM_SOLVING_RESULT` 정식 코드로 고치고, 발생 영역 fallback을 서버 시드와 일치시켰다.
- 목록 DTO와 상세 DTO를 분리하고 백엔드 summary에 작성자 식별자·이름을 포함했다.
- 시험 개설 요청은 상세 위치를 노출·전송하지 않게 했다.
- `tsc --noEmit` 통과. Gradle 선택 테스트는 sandbox 네트워크 제한으로 Gradle 배포판 다운로드 단계에서 중단됐다.

## Fix Round 2

### 핵심 payload 회귀 테스트 보강

- `NewInquiryPage`에서 다섯 접수 유형의 실제 폼 입력을 수행하고 `requestType`·`targetArea`·`detailLocation` 포함/제외 규칙을 hand-derived literal payload로 검증했다.
- `BugReportModal`의 EXAM 문맥이 `targetArea: 'EXAM_SOLVING_RESULT'`와 자동 첨부 본문·상세 위치를 정확히 전송하는지 검증했다.
- 종료 상태 상세에서 추가 메시지 작성기가 렌더링되지 않는지 실제 페이지와 API mock으로 검증했다.
- 메시지 이미지 업로드 응답 ID 77이 사용자 메시지 API의 `attachmentIds: [77]`로 전달되는지 실제 작성기로 검증했다.
- 사용자 핵심 동작은 리뷰 Round 1에서 이미 구현되어 신규 테스트가 곧바로 계약을 만족했다. 최초 선택 실행의 실패는 제품 결함이 아니라 글자 수가 포함된 label 접근자와 저장소에 없는 `jest-dom` matcher 사용 때문이었고, DOM 근거에 맞춰 테스트 접근자만 수정했다.

### 최종 정리

- `UserLayoutShell`은 서버 메뉴에 오래된 이름이 남아 있어도 문의 경로 제목을 `문의·요청`으로 표시한다.
- `UserInquiry_Modified.md` 사용자 프론트/백엔드 이력을 각각 `HIST-20260828-002`, `HIST-20260828-005`로 보강했다.

### 검증

- `node_modules\.bin\jest.cmd --runTestsByPath ... --runInBand` — 문의 관련 9 suites, 23 tests 통과.
- `node_modules\.bin\tsc.cmd --noEmit` — 통과.
- `git diff --check` — 통과.
