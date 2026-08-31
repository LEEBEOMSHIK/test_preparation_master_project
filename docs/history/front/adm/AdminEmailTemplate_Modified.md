## HIST-20260831-001

- **날짜**: 2026-08-31
- **수정 범위**: 관리자 프론트엔드 / 이메일 템플릿 관리
- **수정 개요**: 이메일 템플릿 목록·편집·미리보기·테스트 발송과 이벤트 연결 관리 화면을 추가하고 공용 HTML 에디터의 이미지 차단·커서 삽입 계약을 확장했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | Task 3 이메일 템플릿·연결·미리보기 계약과 API error details 타입 추가 |
| `frontend/src/services/emailTemplateService.ts` | 추가 | 관리자 템플릿 CRUD·미리보기·테스트 발송·이벤트 연결 API 클라이언트 추가 |
| `frontend/src/components/ui/RichTextEditor.tsx` | 수정 | `allowImages`와 `insertText` ref를 추가하고 이미지 paste/drop 차단 지원 |
| `frontend/src/components/ui/RichTextEditor.test.tsx` | 추가 | 이미지 비허용과 커서 변수 삽입 회귀 테스트 추가 |
| `frontend/src/components/admin/EmailTemplateListPanel.tsx` | 추가 | 검색·상태 필터·페이지·복제·초기화·삭제 경합 안내 목록 추가 |
| `frontend/src/components/admin/EmailTemplateListPanel.test.tsx` | 추가 | 목록 Skeleton·삭제 불가·409 참조 이벤트 안내 테스트 추가 |
| `frontend/src/components/admin/EmailTemplateBindingsPanel.tsx` | 추가 | 이벤트별 템플릿 연결·해제와 비활성 발송 중지 상태 UI 추가 |
| `frontend/src/components/admin/EmailTemplateBindingsPanel.test.tsx` | 추가 | 비활성 연결 유지·연결 해제 상태 테스트 추가 |
| `frontend/src/components/admin/EmailTemplateForm.tsx` | 추가 | 편집 조회·변수 삽입·서버 미리보기·저장 정화 반영·관리자 테스트 발송 폼 추가 |
| `frontend/src/components/admin/EmailTemplateForm.test.tsx` | 추가 | 서버 미리보기·읽기 전용 수신자·폼 Skeleton·저장 정화 반영 테스트 추가 |
| `frontend/src/app/admin/email-templates/page.tsx` | 추가 | 템플릿·연결 탭과 `?tab=bindings` 딥링크 추가 |
| `frontend/src/app/admin/email-templates/page.test.tsx` | 추가 | 연결 탭 딥링크와 탭 URL 고정 테스트 추가 |
| `frontend/src/app/admin/email-templates/new/page.tsx` | 추가 | 신규 템플릿 페이지 추가 |
| `frontend/src/app/admin/email-templates/[id]/edit/page.tsx` | 추가 | 템플릿 편집 페이지와 ID 검증 추가 |
| `frontend/src/app/admin/email-templates/[id]/edit/page.test.tsx` | 추가 | URL ID의 편집 폼 전달 테스트 추가 |
| `AGENTS.md` | 수정 | RichTextEditor 공개 인터페이스 설명 갱신 |
| `docs/agent-handoff/CURRENT.md` | 수정 | Task 5 구현·검증 상태 스냅샷 갱신 |

### 수정 상세

#### `frontend/src/types/index.ts`, `frontend/src/services/emailTemplateService.ts`
- 변경 전: 관리자 이메일 템플릿 API를 호출하거나 응답을 엄격 타입으로 다룰 프론트 계약이 없었다.
- 변경 후: 백엔드 Task 3 DTO와 동일한 템플릿·9필드 연결·미리보기 타입 및 전체 API 메서드를 추가했다.
- 이유: 목록·편집·연결 화면이 서버 계약을 추측 없이 타입 안전하게 소비하도록 하기 위해서다.

#### `frontend/src/components/ui/RichTextEditor.tsx`
- 변경 전: 이미지 업로드가 항상 활성화되고 외부에서 현재 커서에 텍스트를 넣을 수 없었으며 내부 ref가 `any`였다.
- 변경 후: 기본값 true인 `allowImages`, 엄격 Quill 인터페이스, ref `insertText(text)`를 추가하고 false에서 이미지 툴바·입력·paste/drop·업로드를 차단했다.
- 이유: 이메일 HTML 정책상 이미지를 허용하지 않으면서 기존 문항 편집기의 이미지 동작을 보존하기 위해서다.

#### `frontend/src/components/admin/EmailTemplateListPanel.tsx`, `frontend/src/components/admin/EmailTemplateBindingsPanel.tsx`
- 변경 전: 관리자가 템플릿과 이메일 이벤트 연결을 확인하거나 변경할 화면이 없었다.
- 변경 후: 공용 TableSkeleton을 사용하는 목록·연결 조회, CRUD 보조 동작, 연결 해제, 비활성 유지 안내와 409 `referencedEvents` runtime guard를 추가했다.
- 이유: 삭제·비활성·연결 경합을 서버 상태 그대로 안전하게 관리하기 위해서다.

#### `frontend/src/components/admin/EmailTemplateForm.tsx`, 관리자 이메일 템플릿 라우트
- 변경 전: 템플릿 신규·편집·미리보기·테스트 발송 경로가 없었다.
- 변경 후: 서버 `/preview` HTML만 RichContent로 표시하고, 로그인 관리자 이메일을 읽기 전용으로 보여 주며, 저장 응답의 정화 HTML을 편집 상태에 반영하는 폼과 탭 딥링크 라우트를 추가했다.
- 이유: 브라우저에서 안전한 템플릿 작성·확인·운영 연결 흐름을 제공하기 위해서다.

### 복원 방법

이 ID(`AdminEmailTemplate_Modified.md` 기준 HIST-20260831-001)로 복원 시 추가된 이메일 템플릿 서비스·컴포넌트·페이지·테스트를 제거하고 `types/index.ts`, `RichTextEditor.tsx`, `AGENTS.md`, `CURRENT.md`를 변경 전 상태로 되돌린다. (순번은 파일별이므로 복원 시 파일명도 함께 지정한다.)
