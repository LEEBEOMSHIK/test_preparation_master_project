## HIST-20260901-001

- **날짜**: 2026-09-01
- **수정 범위**: 관리자 프론트엔드 / 이메일 템플릿 관리 최종 상호작용
- **수정 개요**: 저장·미리보기·테스트 발송과 행별 mutation을 배타적으로 제어하고, HTML 편집기의 접근 가능한 이름과 비활성 연결 안내 문구를 회귀 테스트로 고정했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | RichTextEditor 비활성·접근성 props 계약 추가 |
| `frontend/src/components/ui/RichTextEditor.tsx` | 수정 | disabled를 Quill readOnly에 전달하고 실제 `.ql-editor` root에 접근 가능한 이름 적용 |
| `frontend/src/components/ui/RichTextEditor.test.tsx` | 수정 | 실제 Quill root의 aria-label 적용 회귀 테스트 추가 |
| `frontend/src/components/admin/EmailTemplateForm.tsx` | 수정 | 저장·미리보기·테스트 발송 단일 operation lock과 저장 중 전체 편집 잠금, HTML label 연결 적용 |
| `frontend/src/components/admin/EmailTemplateForm.test.tsx` | 수정 | deferred 저장 경합, 테스트 발송 차단, HTML 접근성 이름, 비활성 연결 문구 테스트 추가 |
| `frontend/src/components/admin/EmailTemplateListPanel.tsx` | 수정 | 목록 전체에서 동시에 하나의 복제·초기화·삭제 mutation만 허용 |
| `frontend/src/components/admin/EmailTemplateListPanel.test.tsx` | 수정 | 다른 행 복제·삭제까지 잠기는 deferred 회귀 테스트 추가 |
| `frontend/src/components/admin/EmailTemplateBindingsPanel.tsx` | 수정 | 이벤트 전체에서 동시에 하나의 bind/unbind만 허용하고 mutation 중 선택 잠금 |
| `frontend/src/components/admin/EmailTemplateBindingsPanel.test.tsx` | 수정 | 다른 이벤트 bind/unbind 경합 차단 deferred 테스트 추가 |

### 수정 상세

#### 비동기 operation 상호 배제
- 변경 전: 폼 저장 중 입력과 테스트 발송이 활성이고, 목록·연결 패널은 처리 중인 한 행만 비활성화해 다른 행 요청과 오래된 `finally`가 경합할 수 있었다.
- 변경 후: 폼은 ref와 state가 공유하는 단일 `save`/`preview`/`testSend` operation을 사용하고 저장 중 모든 입력·변수 삽입·에디터를 잠근다. 목록과 연결 패널도 전역 mutation lock으로 모든 관련 버튼을 비활성화한다.
- 이유: 늦은 서버 snapshot의 입력 덮어쓰기와 동시 mutation으로 인한 메시지·진행 상태 역전을 요청 시작점에서 차단하기 위해서다.

#### HTML 편집기 접근성과 안내 문구
- 변경 전: `HTML 본문` label이 실제 Quill `.ql-editor` root와 연결되지 않았고 비활성 연결 안내 문구를 보호하는 테스트가 없었다.
- 변경 후: `ariaLabel`/`ariaLabelledBy`를 실제 편집 root에 적용하고 폼 label ID를 연결한다. `연결은 유지되지만` 문구를 회귀 테스트로 고정한다.
- 이유: 보조기기가 편집 목적을 인식하고 최종 리뷰에서 확인한 한국어 안내 문구가 회귀하지 않게 하기 위해서다.

### 검증

- RED: 저장 중 첫 입력이 disabled가 아니어서 폼 신규 테스트가 실패했다.
- RED: 목록의 두 번째 행과 연결 패널의 다른 이벤트 버튼이 활성이라 mutation 신규 테스트 2개가 실패했다.
- GREEN: 이메일 템플릿·RichTextEditor·문의 상태 focused 5 suites, 43 tests 통과.
- 전체 Jest 33 suites/168 tests, `npx tsc --noEmit`, `npm run build`, `git diff --check` 통과. build의 기존 viewport metadata 경고만 재현됐다.

### 복원 방법

이 ID(`AdminEmailTemplate_Modified.md` 기준 HIST-20260901-001)로 복원 시 위 파일의 단일 operation/mutation lock, RichTextEditor disabled·aria props와 신규 회귀 테스트를 제거하고 기존 행별 진행 상태로 되돌린다. (순번은 파일별이므로 복원 시 파일명도 함께 지정한다.)

---

## HIST-20260831-004

- **날짜**: 2026-08-31
- **수정 범위**: 관리자 프론트엔드 / DB 테이블 설명
- **수정 개요**: 관리자 DB 조회에 이메일 템플릿·이벤트 연결과 HTML 발송 스냅샷 설명을 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/data/tableComments.ts` | 수정 | email_templates/email_template_bindings 및 html_body 감사·FK 설명 추가 |

### 수정 상세

#### `tableComments.ts`
- 변경 전: 신규 두 테이블과 `inquiry_email_deliveries.html_body` 설명·FK가 관리자 DB 조회에 없었다.
- 변경 후: `이메일 템플릿`, `이메일 이벤트별 템플릿 연결` 설명과 users/email_templates FK, 감사 관리자, 정화된 HTML 스냅샷 의미를 제공한다.
- 이유: 운영자가 관리자 DB 조회에서 최신 스키마 관계와 발송 저장값을 정확히 해석하도록 하기 위해서다.

### 복원 방법

이 ID(`AdminEmailTemplate_Modified.md` 기준 HIST-20260831-004)로 복원 시 `TABLE_COMMENTS`에서 신규 두 객체와 delivery의 `html_body` 설명을 제거한다.

---

## HIST-20260831-003

- **날짜**: 2026-08-31
- **수정 범위**: 관리자 프론트엔드 / 문의 상태 이메일 연결
- **수정 개요**: 문의 종료 상태별 이메일 binding 가용성을 상세 화면에 연결하고 QUEUED·SKIPPED 결과를 운영자가 확인할 수 있게 했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/inquiryService.ts` | 수정 | 상태 이메일 outcome·응답과 발송 이력 `htmlContent` 타입 추가 |
| `frontend/src/app/admin/inquiries/[id]/page.tsx` | 수정 | 종료 상태 이벤트 mapping, 9필드 binding 조회·가용성 안내·설정 링크 적용 |
| `frontend/src/app/admin/inquiries/[id]/page.test.tsx` | 수정 | binding 미설정, SKIPPED 병행 경고, QUEUED 이력 갱신 검증 |

### 수정 상세

#### 종료 상태 이메일 선택
- 변경 전: 모든 종료 상태에서 템플릿 연결 상태와 무관하게 이메일 알림 checkbox를 선택할 수 있었다.
- 변경 후: `ANSWERED`, `COMPLETED`, `UNABLE_TO_PROCESS`를 해당 이메일 이벤트에 연결하고 9필드 binding의 `sendable=true`일 때만 상태 이메일을 선택할 수 있다. 미사용 가능 상태에는 서버 사유와 `/admin/email-templates?tab=bindings` 링크를 표시한다.
- 이유: 미설정·비활성·유효하지 않은 템플릿으로 발송을 요청하기 전에 운영 상태를 정확히 안내하기 위해서다.

#### 상태 이메일 결과
- 변경 전: 상태 변경 응답을 문의 상세 하나로 처리해 이메일 대기열 등록 또는 건너뜀 결과를 구분하지 못했다.
- 변경 후: `InquiryStatusUpdateResult`의 `emailOutcome`, `emailMessage`, `templateSettingsUrl`을 처리하며 QUEUED이면 이력을 갱신하고 SKIPPED이면 상태 성공과 이메일 경고를 함께 표시한다.
- 이유: 상태 변경 성공과 부가 이메일 처리 결과를 독립적으로 전달하기 위해서다.

### 복원 방법

이 ID(`AdminEmailTemplate_Modified.md` 기준 HIST-20260831-003)로 복원 시 문의 상세의 binding 조회·종료 이벤트 mapping·이메일 가용성 안내·QUEUED/SKIPPED 결과 처리를 제거하고 이전 단순 이메일 checkbox 및 응답 타입으로 되돌린다. (순번은 파일별이므로 복원 시 파일명도 함께 지정한다.)

---

## HIST-20260831-002

- **날짜**: 2026-08-31
- **수정 범위**: 관리자 프론트엔드 / 이메일 템플릿 관리 상호작용
- **수정 개요**: 비동기 요청 경합, 비활성 연결 재저장, 전체 후보 조회와 이미지 HTML·URI 입력 차단을 보강했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/admin/EmailTemplateListPanel.tsx` | 수정 | 요청 generation으로 오래된 목록 응답의 state 반영 차단 |
| `frontend/src/components/admin/EmailTemplateListPanel.test.tsx` | 수정 | 필터 요청 역순 완료 경쟁 회귀 테스트 추가 |
| `frontend/src/components/admin/EmailTemplateForm.tsx` | 수정 | 입력 revision 기반 stale preview 차단과 save/preview 상호 배제 추가 |
| `frontend/src/components/admin/EmailTemplateForm.test.tsx` | 수정 | 미리보기 중 입력 변경·저장 차단 테스트 추가 |
| `frontend/src/components/admin/EmailTemplateBindingsPanel.tsx` | 수정 | 전체 활성 후보 page 병합·중복 제거와 비활성 현재 연결 재저장 차단 |
| `frontend/src/components/admin/EmailTemplateBindingsPanel.test.tsx` | 수정 | 비활성 option·활성 교체·101번째 후보 테스트 추가 |
| `frontend/src/components/ui/RichTextEditor.tsx` | 수정 | 이미지 HTML과 URI/data payload paste/drop 차단 추가 |
| `frontend/src/components/ui/RichTextEditor.test.tsx` | 수정 | 실제 paste/drop 이미지 차단과 일반 입력 허용 테스트 추가 |

### 수정 상세

#### 목록·폼 비동기 상태
- 변경 전: 이전 목록/미리보기 요청이 늦게 완료되면 최신 입력과 무관한 data·error·loading 상태를 반영할 수 있었다.
- 변경 후: 목록 request generation과 폼 input revision을 확인한 최신 요청만 상태에 반영하고 save/preview를 동시에 시작하지 못하게 했다.
- 이유: 네트워크 완료 순서와 빠른 관리자 입력에서도 화면이 최신 조건을 유지하도록 하기 위해서다.

#### 이벤트 연결 후보
- 변경 전: 활성 후보 첫 100개만 조회하고 현재 연결된 비활성 option도 다시 저장할 수 있었다.
- 변경 후: 첫 응답의 `totalPages` 전체를 조회해 ID 기준 병합하며, 비활성 현재 option은 disabled로 유지하고 활성 후보 membership을 저장 전 검증한다.
- 이유: 모든 활성 템플릿을 선택 가능하게 하면서 비활성 템플릿 재연결을 막기 위해서다.

#### `frontend/src/components/ui/RichTextEditor.tsx`
- 변경 전: `allowImages=false`가 File image만 차단해 HTML `<img>`와 image URI/data payload가 Quill 기본 처리로 전달될 수 있었다.
- 변경 후: `text/html`의 `<img>`와 `text/uri-list`의 image data/확장자 URI를 capture 단계에서 차단하고 일반 텍스트·비이미지 링크는 허용한다.
- 이유: 이메일 템플릿의 이미지 금지 정책을 모든 paste/drop 입력 경로에 적용하기 위해서다.

### 복원 방법

이 ID(`AdminEmailTemplate_Modified.md` 기준 HIST-20260831-002)로 복원 시 위 8개 프론트 파일의 request generation, input revision, 전체 page 병합, 비활성 option 및 HTML·URI 이미지 차단 변경과 대응 테스트를 제거한다. (순번은 파일별이므로 복원 시 파일명도 함께 지정한다.)

---

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
