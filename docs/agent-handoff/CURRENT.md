# 현재 작업 인계

## 현재 목표와 사용자 결정 사항

- 목표: Task 6에서 관리자 문의 상세의 사용자 답변 등록과 처리 상태 변경 UI를 분리한다.
- 상태 API 계약은 `{status,sendEmail}` 요청과 `{inquiry,emailOutcome,emailMessage,templateSettingsUrl}` 응답이다.
- 상태 변경은 `InquiryMessage`를 만들지 않으며, 답변 내용 이메일과 상태 안내 이메일은 서로 다른 checkbox와 API를 사용한다.
- 종료 상태 이메일은 해당 9필드 binding의 `sendable=true`일 때만 선택할 수 있다.

## 완료한 작업

- `statusMessage`, 종료 안내 textarea와 필수 검증을 제거하고 상태 API 호출을 새 계약으로 전환했다.
- 답변 카드를 `사용자에게 답변`으로 바꾸고 타임라인 추가·상태 불변을 명시했다.
- 관리자 답변이 없는 종료에 `role="dialog"` 확인 절차를 추가했다.
- 종료 상태와 이메일 이벤트 mapping, binding 가용성 사유, 템플릿 관리 딥링크를 추가했다.
- SKIPPED에서 상태 성공과 이메일 경고를 함께 표시하고 QUEUED에서 발송 이력을 갱신한다.
- production 수정 전 문의 상세·composer 테스트 RED를 확인한 뒤 focused GREEN과 문의 회귀, 타입체크를 통과했다.
- 관리자 문의·이메일 템플릿 히스토리를 각각 `HIST-20260831-002`, `HIST-20260831-003`으로 기록했다.

## 미완료 작업

- Task 6 코드·문서·검증은 완료했다. 부모 작업의 Task 1~6 통합 확인만 남았다.

## 수정한 파일 목록

- `frontend/src/services/inquiryService.ts`
- `frontend/src/app/admin/inquiries/[id]/page.tsx`
- `frontend/src/app/admin/inquiries/[id]/page.test.tsx`
- `frontend/src/components/ui/InquiryMessageComposer.tsx`
- `frontend/src/components/ui/InquiryMessageComposer.test.tsx`
- `docs/history/front/adm/AdminInquiry_Modified.md`
- `docs/history/front/adm/AdminEmailTemplate_Modified.md`
- `docs/agent-handoff/CURRENT.md`

## 실행한 검증 명령과 결과

- RED 문의 상세: 1 suite, 11 tests 중 9 failed/2 passed. 종료 안내·이전 API 응답 처리·confirm/binding/알림 미구현으로 예상 실패했다.
- RED composer: 1 suite, 9 tests 중 4 failed/5 passed. 새 제목·설명·checkbox label 미구현으로 예상 실패했다.
- 첫 GREEN 시도: production 동작과 무관한 미지원 `jest-dom` matcher 6건을 기존 matcher 관례로 수정했다.
- focused GREEN: 2 suites, 20 tests passed.
- `npx tsc --noEmit`: exit 0.
- 문의 상세·목록·설정·composer·uploader·timeline 회귀: 6 suites, 38 tests passed.
- `git diff --check`: 공백 오류 0, Windows LF→CRLF 안내만 확인했다.

## 실패·경고·주의사항

- 이 저장소 Jest 환경은 `jest-dom` 확장 matcher를 전역 제공하지 않아 DOM 프로퍼티와 기본 matcher를 사용했다.
- 상태 버튼 문구는 brief 계약대로 `INQUIRY_STATUS_LABEL[selectedStatus] + "로 변경"`을 그대로 적용했다.
- 이메일 binding 조회 실패 시 상태 변경은 유지하되 이메일 선택을 막고 템플릿 관리 링크를 제공한다.
- 다른 Task의 변경은 수정하거나 되돌리지 않았다.

## 다음 세션이 바로 실행할 명령

`git show --stat --oneline HEAD; git status --short`

## 다음 Task

- 부모 작업에서 Task 1~6 통합 회귀와 브랜치 최종 상태를 확인한다.

## 건드리면 안 되는 파일 또는 기존 미추적 파일

- Task 1~5에서 커밋된 백엔드·이메일 템플릿 관리 변경을 되돌리지 않는다.
