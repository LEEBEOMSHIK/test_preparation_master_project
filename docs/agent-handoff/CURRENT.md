# 현재 작업 인계

## 현재 목표와 사용자 결정 사항

- 목표: Task 5 관리자 이메일 템플릿 목록·편집·이벤트 연결 UI를 Task 3 API 계약에 맞춰 제공한다.
- Binding은 `eventCode,eventLabel,scope,templateId,templateName,templateActive,configured,sendable,unavailableReason` 9필드다.
- 미리보기 본문은 서버 `/preview` 결과만 `RichContent`로 표시하고 테스트 수신자는 로그인 관리자 이메일만 읽기 전용 표시한다.
- 연결 해제·비활성 연결 유지·삭제 409 참조 이벤트와 `?tab=bindings` 딥링크를 지원한다.

## 완료한 작업

- exact TypeScript 계약과 관리자 템플릿·연결 API service를 추가했다.
- RichTextEditor에 기본 true `allowImages`와 ref `insertText(text)`를 추가하고 false에서 모든 이미지 입력 경로를 막았다.
- 목록·연결 패널, 신규·편집 폼, 탭·신규·편집 라우트를 구현했다.
- brief 테스트를 production 이전에 작성해 RED를 확인하고 자가 검토 보강까지 14개 Task 5 테스트를 GREEN으로 전환했다.
- `npx tsc --noEmit` 1차 오류(테스트 jest-dom 타입)를 수정하고 exit 0을 확인했다.
- AGENTS 공개 인터페이스와 관리자 프론트 히스토리 `HIST-20260831-001`을 기록했다.

## 미완료 작업

- Task 5 코드·문서·검증은 완료했다. 남은 절차는 task-5-report 작성과 지정 커밋뿐이다.

## 수정한 파일 목록

- `frontend/src/types/index.ts`
- `frontend/src/services/emailTemplateService.ts`
- `frontend/src/components/ui/RichTextEditor.tsx`
- `frontend/src/components/ui/RichTextEditor.test.tsx`
- `frontend/src/components/admin/EmailTemplateListPanel.tsx` 및 테스트
- `frontend/src/components/admin/EmailTemplateBindingsPanel.tsx` 및 테스트
- `frontend/src/components/admin/EmailTemplateForm.tsx` 및 테스트
- `frontend/src/app/admin/email-templates/page.tsx` 및 테스트
- `frontend/src/app/admin/email-templates/new/page.tsx`
- `frontend/src/app/admin/email-templates/[id]/edit/page.tsx` 및 테스트
- `AGENTS.md`
- `docs/history/front/adm/AdminEmailTemplate_Modified.md`
- `docs/agent-handoff/CURRENT.md`

## 실행한 검증 명령과 결과

- RED: 5 suites failed(신규 모듈 부재), RichTextEditor 2 tests failed(`allowImages`/ref 부재). bracket edit 테스트는 cmd quoting으로 최초 묶음에서 제외되었다.
- RichTextEditor GREEN: 1 suite, 2 tests passed.
- 목록·연결 GREEN: 2 suites, 4 tests passed.
- 폼 GREEN: 1 suite, 4 tests passed.
- 탭·편집 페이지 GREEN: 2 suites, 3 tests passed.
- `cd frontend; npx tsc --noEmit`: 최초 테스트 matcher 타입 오류 후 `@testing-library/jest-dom/jest-globals`로 수정, 재실행 exit 0.
- 자가 검토 preview 경계 RED: 저장 후 `/preview` 재호출 부재로 1 failure, 예상대로 실패.
- 최종 focused + RichTextEditor 소비자 회귀: 7 suites, 17 tests passed.
- 최종 `npx tsc --noEmit`: exit 0.
- `npm run build`: exit 0, `/admin/email-templates`, 신규, 편집 라우트 생성 확인.
- `git diff --check`: exit 0, Windows LF→CRLF 안내만 출력.

## 실패·경고·주의사항

- 최초 RED 묶음의 bracket 경로는 Windows cmd quoting으로 인식되지 않아 이후 정확한 경로로 별도 GREEN 확인했다.
- 테스트 외 production 코드에 `any`를 추가하지 않았고 기존 RichTextEditor 소비자는 `allowImages` 기본 true 동작을 유지한다.
- 빌드는 성공했지만 기존 공통 metadata의 viewport 경고가 여러 라우트에서 반복되며 새 라우트에도 상속된다.
- 다른 Task의 백엔드·히스토리 파일은 건드리지 않았다.

## 다음 세션이 바로 실행할 명령

`git show --stat --oneline HEAD; git status --short`

## 다음 Task

- Task 5가 마지막 brief이므로 부모 작업에서 Task 1~5 통합 상태와 최종 회귀를 확인한다.

## 건드리면 안 되는 파일 또는 기존 미추적 파일

- Task 1~4의 백엔드·문서 변경과 다른 에이전트 작업 파일은 수정하거나 되돌리지 않는다.
