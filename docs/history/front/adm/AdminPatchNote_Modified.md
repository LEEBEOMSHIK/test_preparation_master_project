## HIST-20260920-001

- **날짜**: 2026-09-20
- **수정 범위**: 관리자 프론트엔드 / 패치노트 항목 중심 등록·수정
- **수정 개요**: 본문 에디터와 본문 필수 검증을 제거하고, 항목 요약을 줄바꿈한 순수 텍스트를 호환용 `content`로 자동 생성하도록 변경했습니다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `frontend/src/components/admin/PatchNoteForm.tsx` | 수정 | RichTextEditor를 제거하고 항목 요약 기반 content 생성 및 legacy 본문 보존을 구현했습니다. |
| `frontend/src/components/admin/PatchNoteForm.test.tsx` | 수정 | 본문 입력 의존성을 제거하고 자동 content·항목 검증·중복 제출을 검증했습니다. |

### 수정 상세

#### `frontend/src/components/admin/PatchNoteForm.tsx`
- 변경 전: RichTextEditor와 본문 필수 검증을 사용하고 입력된 HTML 본문을 payload에 전달했습니다.
- 변경 후: 항목 요약을 `\\n`으로 연결한 순수 텍스트를 `content`로 생성합니다. 기존 legacy 응답을 수정할 때 항목을 변경하지 않으면 기존 본문을 보존합니다.
- 이유: 패치노트의 표시 단위를 항목 중심으로 단순화하면서 기존 API의 `content` 필드 호환성을 유지하기 위해서입니다.

#### `frontend/src/components/admin/PatchNoteForm.test.tsx`
- 변경 전: 본문 에디터를 채워야 제출할 수 있고 빈 본문 오류를 검증했습니다.
- 변경 후: 본문 입력 없이 항목 요약만으로 제출하며 줄바꿈된 `content`, 행별 항목 검증, 중복 제출 방지를 검증합니다.
- 이유: 사용자 결정에 맞는 항목 중심 UX와 API payload 계약을 고정하기 위해서입니다.

### 복원 방법

이 항목의 수정 상세에 따라 폼의 자동 content 생성과 legacy 보존 분기를 제거하고 RichTextEditor 및 본문 필수 검증을 복원합니다. 복원 후 `frontend`에서 `npx tsc --noEmit`과 `PatchNoteForm.test.tsx`를 실행합니다.

## HIST-20260919-001

- **날짜**: 2026-09-19
- **수정 범위**: 관리자 프론트엔드 / 패치노트 등록·수정
- **수정 개요**: 버전별 패치 항목을 유형·요약·순서 단위로 편집하고 저장 payload에 포함하도록 관리자 폼을 확장했습니다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `frontend/src/types/index.ts` | 수정 | 패치 항목 유형·응답·요청 타입을 추가했습니다. |
| `frontend/src/components/admin/PatchNoteForm.tsx` | 수정 | 기본 항목 행, 추가·삭제·순서 이동, 행별 검증, payload 매핑을 구현했습니다. |
| `frontend/src/components/admin/PatchNoteForm.test.tsx` | 수정 | 항목 편집·검증·중복 제출 방지 동작을 검증했습니다. |
| `frontend/src/app/admin/patch-notes/[id]/edit/page.tsx` | 수정 | 수정 화면에서 기존 항목 목록을 폼 초기값으로 전달합니다. |

### 수정 상세

#### `frontend/src/types/index.ts`
- 변경 전: 패치노트 요청·응답에 하위 항목 타입이 없었습니다.
- 변경 후: `PatchNoteItemType`, `PatchNoteItem`, `PatchNoteRequest.items`, `PatchNote.items`를 정의했습니다.
- 이유: 관리자와 사용자 화면이 동일한 API 중첩 항목 계약을 타입 안전하게 사용하도록 하기 위해서입니다.

#### `frontend/src/components/admin/PatchNoteForm.tsx`
- 변경 전: 제목·버전·본문·게시 여부만 편집하고 기존 content payload만 제출했습니다.
- 변경 후: 첫 항목을 기본 표시하고, 유형 선택·요약 입력·항목 추가/삭제·위/아래 이동을 제공하며 `displayOrder`를 재계산해 제출합니다. 버전 형식과 빈/초과 요약을 검증하고 해당 행에 오류 상태를 표시합니다.
- 이유: 한 릴리즈에 여러 변경 항목을 등록하면서 기존 본문 호환성을 유지하기 위해서입니다.

#### `frontend/src/app/admin/patch-notes/[id]/edit/page.tsx`
- 변경 전: 기존 릴리즈의 제목·버전·본문·게시 여부만 폼에 전달했습니다.
- 변경 후: API 응답의 `items`를 수정 폼 초기값에 전달합니다.
- 이유: 기존 항목의 유형·요약·순서를 수정할 수 있도록 하기 위해서입니다.

### 복원 방법

이 항목의 수정 상세에 따라 위 파일에서 패치 항목 상태·타입·초기값 전달 변경을 되돌립니다. 복원 후 `frontend`에서 `npx tsc --noEmit`과 관련 Jest 테스트를 실행해 기존 폼 계약을 확인합니다.
