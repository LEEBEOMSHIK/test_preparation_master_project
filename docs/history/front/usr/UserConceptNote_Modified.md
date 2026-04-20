## HIST-20260421-031

- **날짜**: 2026-04-21
- **수정 범위**: 사용자 프론트엔드 + 백엔드 / 개념노트 상세
- **수정 개요**: 연결된 문제가 코드 문항이면 Darcula 코드 블록 표시, 이미지 포함 시 `<img>` 렌더링

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| backend/.../dto/response/ConceptNoteResponse.java | 수정 | questionCode, questionLanguage, questionBankCode, questionBankLanguage 필드 추가 |
| frontend/src/types/index.ts | 수정 | ConceptNote에 questionCode?, questionLanguage?, questionBankCode?, questionBankLanguage? 추가 |
| frontend/src/app/user/concepts/[id]/page.tsx | 수정 | LinkedQuestionBox에 QuestionContent(img 지원) + CodeBlock(Darcula) 컴포넌트 추가 |

### 수정 상세

#### `LinkedQuestionBox`
- `QuestionContent`: content에 `<img>` 태그 포함 시 `dangerouslySetInnerHTML` 렌더링, 없으면 `whitespace-pre-wrap`
- `CodeBlock`: IntelliJ Darcula 스타일 (bg `#2b2b2b`, text `#a9b7c6`, macOS 트래픽 라이트 버튼, language 레이블)
- code 필드가 있을 때만 CodeBlock 렌더링 (CODE 유형 외 문항에는 표시 안 됨)

### 복원 방법

HIST-20260421-031 복원 시:
- `ConceptNoteResponse.java`에서 code/language 4개 필드 제거
- `types/index.ts`에서 같은 4개 필드 제거
- `[id]/page.tsx`에서 `QuestionContent`, `CodeBlock` 컴포넌트 제거, `LinkedQuestionBox`를 단순 텍스트 버전으로 복원

---

## HIST-20260421-029

- **날짜**: 2026-04-21
- **수정 범위**: 사용자 프론트엔드 / 개념노트 관리
- **수정 개요**: 개념노트 목록·상세 화면에 연결된 문제(시험/퀴즈) 정보 표시 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| frontend/src/app/user/concepts/page.tsx | 수정 | 카드에 "시험문제"/"퀴즈문제" 뱃지 + 문제 내용 미리보기 추가 |
| frontend/src/app/user/concepts/[id]/page.tsx | 수정 | 상세 화면 상단에 LinkedQuestionBox 컴포넌트로 원본 문제 표시 |
| frontend/src/services/conceptNoteService.ts | 수정 | ConceptNoteRequest에 questionId?, questionBankId? 추가 |
| frontend/src/types/index.ts | 수정 | ConceptNote에 questionId, questionContent, questionType, questionBankId, questionBankContent, questionBankType 추가 |

### 수정 상세

#### 목록 카드
- 시험 문항에서 등록된 경우 "시험문제" 파란 뱃지 표시
- 퀴즈 문항에서 등록된 경우 "퀴즈문제" 보라 뱃지 표시
- 연결된 문제 내용 `line-clamp-1` 인디고 박스로 표시 (없으면 숨김)

#### 상세 화면 `LinkedQuestionBox`
- 문제 출처 뱃지 + "이 문제에서 작성된 개념노트" 레이블
- 원본 문제 전문을 `whitespace-pre-wrap`으로 표시
- 조회 모드·편집 모드 모두에서 표시

### 복원 방법

HIST-20260421-029 복원 시:
- `user/concepts/page.tsx`에서 뱃지·문제 미리보기 제거
- `user/concepts/[id]/page.tsx`에서 `LinkedQuestionBox` 및 뱃지 제거
- `conceptNoteService.ts`에서 `questionId?`, `questionBankId?` 제거
- `types/index.ts`에서 추가된 question 관련 필드 제거

---

## HIST-20260421-025

- **날짜**: 2026-04-21
- **수정 범위**: 사용자 프론트엔드 / 개념노트 관리
- **수정 개요**: 개념노트 목록 페이지(검색·페이징·삭제), 상세/작성/수정 페이지 신규 구현

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| frontend/src/app/user/concepts/page.tsx | 수정 | 플레이스홀더 → 목록 페이지 (검색, 10/20/50 페이징, 삭제) |
| frontend/src/app/user/concepts/[id]/page.tsx | 추가 | 상세 조회 / 수정 / 신규 작성 통합 페이지 (id=new 분기) |
| frontend/src/services/conceptNoteService.ts | 추가 | 사용자·관리자 CRUD API 클라이언트 |
| frontend/src/types/index.ts | 수정 | ConceptNote에 userId?, userName? 필드 추가 |

### 수정 상세

#### `frontend/src/app/user/concepts/page.tsx`
- 변경 전: "준비 중입니다." 플레이스홀더
- 변경 후:
  - 상단: 제목 + "새 노트 작성" 버튼
  - 검색 입력(Enter/버튼) + 페이지 크기 선택(10/20/50)
  - 카드 목록: 제목, 공개/비공개 뱃지, 내용 미리보기, 수정일, 삭제 버튼
  - 하단 페이지네이션 + 전체 개수 표시

#### `frontend/src/app/user/concepts/[id]/page.tsx` (신규)
- 변경 전: 파일 없음
- 변경 후:
  - id === 'new': 바로 편집 모드로 진입 (제목, 내용 textarea, 공개 체크박스)
  - id가 숫자: 상세 조회 모드 → 수정/삭제 버튼으로 편집 전환
  - 저장 후 목록 페이지로 이동

#### `frontend/src/services/conceptNoteService.ts` (신규)
- User: getMyNotes, getMyNote, create, update, delete
- Admin: adminGetAll, adminTogglePublic, adminDelete

#### `frontend/src/types/index.ts`
- 변경 전: `ConceptNote { id, title, content, isPublic, createdAt, updatedAt }`
- 변경 후: `userId?`, `userName?` 필드 추가

### 복원 방법

HIST-20260421-025 복원 시:
- `user/concepts/page.tsx`를 플레이스홀더 내용으로 복원
- `user/concepts/[id]/page.tsx` 삭제
- `services/conceptNoteService.ts` 삭제
- `types/index.ts`에서 `userId?`, `userName?` 제거
