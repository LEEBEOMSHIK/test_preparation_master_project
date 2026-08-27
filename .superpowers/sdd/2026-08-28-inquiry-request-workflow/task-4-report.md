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
