## HIST-20260615-003

- **날짜**: 2026-06-15
- **수정 범위**: 사용자 프론트엔드 / 개념노트 Notion 연동 (골격)
- **수정 개요**: 개념노트 목록에 Notion 연동 상태 바(연결/해제) + 노트별 '노션으로 내보내기' 버튼 추가. 백엔드 NotionController와 연동.

### 수정 파일 목록

| 파일 경로 | 유형 | 설명 |
|-----------|------|------|
| `frontend/src/services/notionService.ts` | 신규 | status / authorize-url / disconnect / export API 클라이언트 |
| `frontend/src/app/user/concepts/page.tsx` | 수정 | Notion 상태 바, 연결/해제·내보내기 핸들러, 콜백 피드백(`?notion=`), 노트별 내보내기 버튼 |

### 수정 상세
- 마운트 시 `notionService.getStatus()` 호출. 상태 바 분기: `!configured`→"서버 설정 필요" 안내 / `configured&&!connected`→"Notion 연결" 버튼(authorize-url로 이동) / `connected`→워크스페이스명+"연동 해제".
- 노트 카드: `connected`일 때만 "노션으로 내보내기" 버튼 노출 → `exportNote(id)` → 성공 시 Notion 페이지 열기 확인.
- 콜백 후 `?notion=connected|failed` 쿼리로 성공/실패 배너 표시.
- **검증**: `npx tsc --noEmit` 통과. 크롬 — 시크릿 미설정 상태에서 상태 바가 "Notion 연동 — 서버 설정 필요" 로 정상 렌더 확인. (연결/내보내기 버튼은 서버에 client id/secret 주입 후 노출·검증)

### 복원 방법
이 ID(HIST-20260615-003)로 복원 시 `notionService.ts` 제거 + concepts 페이지의 Notion 상태 바·핸들러·내보내기 버튼·콜백 피드백을 제거한다.

---

## HIST-20260615-002

- **날짜**: 2026-06-15
- **수정 범위**: 사용자 프론트엔드 / 개념노트 목록
- **수정 개요**: 문제 미리보기 박스의 `line-clamp-1`이 세로 패딩(`py-1.5`) 영역으로 2번째 줄 윗부분을 비치게 해 "중간에 잘린" 듯 보이던 UI 문제를 `truncate`(한 줄 + 말줄임)로 변경해 해결.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/concepts/page.tsx` | 수정 | 문제 미리보기 `<p>`의 `line-clamp-1` → `truncate` |

### 수정 상세

#### `app/user/concepts/page.tsx`
- **문제**: `line-clamp-1`은 `-webkit-box` 클램프라 박스 하단 패딩 영역으로 다음 줄 상단이 비쳐, 2번째 줄이 중간에서 잘린 것처럼 보였음.
- **변경**: `truncate`(= `overflow-hidden text-ellipsis whitespace-nowrap`)로 변경 → 2번째 줄 자체가 생기지 않고 한 줄 끝에 말줄임표(…) 표시. 부모 `min-w-0`로 폭 제약돼 정상 동작.
- **검증**: 크롬 스크린샷 — 한 줄로 깔끔히 잘리고 2번째 줄 비침 사라짐 확인.

### 복원 방법
이 ID(HIST-20260615-002)로 복원 시 `truncate`를 `line-clamp-1`로 되돌린다.

---

## HIST-20260615-001

- **날짜**: 2026-06-15
- **수정 범위**: 사용자 프론트엔드 / 개념노트 목록
- **수정 개요**: 개념노트 목록(`/user/concepts`)에서 연결된 문제 미리보기가 HTML 태그 그대로 노출되던 문제 수정 — `stripHtml`로 순수 텍스트화.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/concepts/page.tsx` | 수정 | 문제 미리보기 `{note.questionContent \|\| note.questionBankContent}` → `stripHtml(...)` 적용, `stripHtml` import 추가 |

### 수정 상세

#### `app/user/concepts/page.tsx`
- **문제**: 목록 카드의 "문제:" 미리보기가 `questionContent`/`questionBankContent`(HTML)를 그대로 출력해 `<p>`, `<table>` 등 태그가 노출됨. (상세 화면은 `RichContent`로 정상 렌더 중, 목록만 누락)
- **변경**: `line-clamp-1` 한 줄 미리보기이므로 `stripHtml(note.questionContent || note.questionBankContent || '')`로 순수 텍스트만 표시.
- **참고**: 노트 본문(`note.content`)은 textarea 기반 순수 텍스트라 기존 출력 유지. 즐겨찾기 목록(`/user/bookmarks`)은 이미 `stripHtml` 사용 중이라 동일 이슈 없음(크롬으로 추가·표시 정상 확인).
- **검증**: `npx tsc --noEmit` 통과. 크롬 — `/user/concepts` 문제 미리보기 태그 사라지고 텍스트로 표시 확인. `/user/bookmarks` 즐겨찾기 추가→목록 정상 렌더 확인.

### 복원 방법
이 ID(HIST-20260615-001)로 복원 시 미리보기를 `{note.questionContent || note.questionBankContent}`로 되돌린다.

---

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
