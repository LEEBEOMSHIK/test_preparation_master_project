# 현재 작업: 사용자 문의·요청 이미지 첨부 UX 및 legacy 스키마 409 수정

## 현재 목표와 사용자 결정 사항

- `inquiries.request_type`을 source of truth로 유지하고, 앱 시작 후 현재 schema의 legacy `inquiry_type` 컬럼만 멱등적으로 제거한다.
- 최초 문의와 후속 메시지에 동일한 공용 이미지 드롭존을 적용한다.
- 이미지는 최대 3장, 파일당 10MB 이하, JPG/JPEG/PNG/GIF/WebP만 허용하며 업로드 중 등록을 막는다.

## 완료한 작업

- 실제 H2 테이블에서 legacy 컬럼을 제거하고 `request_type` 데이터를 보존하는 `InquirySchemaMigrationRunner`와 schema 범위·멱등성 테스트를 추가했다.
- `InquiryImageUploader`를 추가해 클릭 선택·drag&drop 다중 첨부, 사전 검증, 썸네일·파일명·용량·업로드 상태·개별 삭제를 구현했다.
- 신규 문의와 후속 메시지에 공통 업로더를 적용하고, 업로드 중 등록 차단과 `extractApiErrorMessage` 기반 오류 표시를 반영했다.
- 정적 findings를 TDD로 보강했다: current schema 한정 DDL, preview URL 정리, 빈 MIME 차단·10MB 경계, 오류 alert/입력 이름, 업로드 중 두 제출 버튼 차단, 삭제/unmount 뒤 늦은 resolve/reject 무시, Jest strict 타입 mock 선언.
- 사용자 프론트엔드/백엔드 히스토리와 AGENTS Shared Utilities 표를 갱신했다.
- 정적 최종 검증은 GO 판정이다.

## 미완료 작업

- 기능·정적·동적 검증은 완료했다. 커밋 및 통합 방식 선택만 남았다.
- 커밋과 push는 수행하지 않았다.

## 수정한 파일 목록

- `backend/src/main/java/com/tpmp/testprep/config/InquirySchemaMigrationRunner.java`
- `backend/src/test/java/com/tpmp/testprep/config/InquirySchemaMigrationRunnerTest.java`
- `frontend/src/components/ui/InquiryImageUploader.tsx`
- `frontend/src/components/ui/InquiryImageUploader.test.tsx`
- `frontend/src/app/user/inquiries/new/page.tsx`
- `frontend/src/app/user/inquiries/new/page.test.tsx`
- `frontend/src/components/ui/InquiryMessageComposer.tsx`
- `frontend/src/components/ui/InquiryMessageComposer.test.tsx`
- `AGENTS.md`
- `docs/history/front/usr/UserInquiry_Modified.md`
- `docs/history/back/usr/UserInquiry_Modified.md`
- `docs/agent-handoff/CURRENT.md`

## 실행한 검증 명령과 결과

- TDD RED/GREEN과 mutation checks: runner 부재·schema 범위·DDL no-op, 업로더 모듈/drag 처리·빈 MIME·preview URL·접근성·업로드 중 제출 차단·늦은 resolve/reject 회귀를 각각 실패로 확인한 뒤 복원/구현했다.
- Tester 전체 결과:
  - Backend: 341 tests, 실패 0.
  - Frontend TypeScript: `npx tsc --noEmit` PASS.
  - Frontend Jest: 26 suites / 119 tests PASS.
  - Frontend build: 55 pages PASS.
  - `git diff --check` PASS.
- main 독립 재검증:
  - `InquirySchemaMigrationRunnerTest` `BUILD SUCCESSFUL`.
  - `npx tsc --noEmit` PASS.
  - 집중 Jest: 11 suites / 49 tests PASS.
- 브라우저 시각 확인: `http://localhost:3000/user/inquiries/new` 다크모드에서 버그 신고 선택 시 발생 영역 필수 표시, 큰 드롭존, “최대 3장 / 파일당 10MB / JPG/JPEG/PNG/GIF/WebP” 안내가 명확함을 확인했다.
- 런타임 확인:
  - worktree Frontend session 52234가 3000 포트에서 실행 중.
  - worktree Backend session 12270이 8080 포트에서 실행 중.
  - backend 기동 로그에서 legacy `inquiry_type` 제거를 확인했고, DB 조회 결과 `request_type:NO`만 남아 있다.

## 실패·경고·주의사항

- mutation check 실패는 테스트 유효성 확인을 위한 의도된 실패이며 즉시 복원됐다.
- 기존 Next viewport 경고, Gradle unchecked·CDS 경고, LF→CRLF 경고가 남아 있으며 이번 변경으로 발생한 오류는 아니다.
- 업로드가 완료된 뒤 UI에서 제거하면 서버에 먼저 저장된 파일을 정리하는 API는 아직 없다. 기존 범위 밖 사항이다.

## 다음 세션이 바로 실행할 명령

- 커밋 전 `git status --short`와 `git diff --check`를 확인한다.
- 사용자/상위 작업자의 지시에 따라 커밋 및 통합 방식을 선택한다. 승인 전에는 commit/push하지 않는다.

## 건드리면 안 되는 파일 또는 기존 미추적 파일

- 지정 worktree 밖 파일과 다른 작업자의 변경을 되돌리지 않는다.
- 위 수정 파일 외 파일은 이 작업에서 수정하지 않는다.
