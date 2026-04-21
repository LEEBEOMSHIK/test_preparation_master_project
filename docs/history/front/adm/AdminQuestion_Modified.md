## HIST-20260422-001

- **날짜**: 2026-04-22
- **수정 범위**: 관리자 프론트엔드 / 문항 수정
- **수정 개요**: 문항 수정 저장 시 `categoryId` 누락으로 500 오류 발생 수정 — `handleSubmit`에 `categoryId` 추가 및 `as` 타입 캐스트 제거

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| frontend/src/app/admin/exams/questions/[id]/edit/page.tsx | 수정 | handleSubmit에 `categoryId` 추가, 불필요한 타입 캐스트 제거 |
| frontend/src/services/examService.ts | 수정 | `adminUpdateQuestion` 타입에 `categoryId`, `year`, `round` 추가 |

### 수정 상세

#### `edit/page.tsx`
- 변경 전: `examService.adminUpdateQuestion(id, { content, questionType, ... year, round } as ...)`에서 `categoryId` 미포함
- 변경 후: `categoryId: form.categoryId ?? undefined` 추가, `as` 캐스트 제거
- 이유: 백엔드 `QuestionBankRequest`에 `@NotNull categoryId` 검증이 있어 미전송 시 400 오류 발생

#### `examService.ts`
- 변경 전: `adminUpdateQuestion` 타입에 `categoryId`, `year`, `round` 없음
- 변경 후: `categoryId?: number`, `year?: number`, `round?: number` 추가

### 복원 방법

HIST-20260422-001 복원 시:
- `edit/page.tsx` handleSubmit에서 `categoryId` 라인 제거, `as Parameters<...> & { year?: number; round?: number }` 캐스트 복원
- `examService.ts` `adminUpdateQuestion` 타입에서 `categoryId`, `year`, `round` 제거

---

## HIST-20260421-038

- **날짜**: 2026-04-21
- **수정 범위**: 관리자 프론트엔드 / 문항 이미지, 인프라
- **수정 개요**: 업로드된 이미지(`/uploads/*`)가 에디터 및 사용자 화면에서 깨지는 문제 수정 — nginx와 Next.js rewrite에 `/uploads/` → backend 라우팅 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| nginx/nginx.conf | 수정 | `location /uploads/` 블록 추가 — backend로 프록시 |
| frontend/next.config.js | 수정 | rewrites에 `/uploads/:path*` → backend 항목 추가 (dev 환경) |

### 수정 상세

#### `nginx/nginx.conf`
- 변경 전: `/uploads/` 경로 없음 → `location /` (frontend) 로 라우팅되어 Next.js가 처리 → 404
- 변경 후: `location /uploads/` 블록 추가, `proxy_pass http://backend`
- 이유: Spring Boot가 `/uploads/images/{uuid}` 경로로 이미지를 제공하는데 nginx 라우팅이 없으면 Next.js로 전달되어 이미지를 찾을 수 없음

#### `frontend/next.config.js`
- 변경 전: `/api/:path*` rewrite만 존재
- 변경 후: `/uploads/:path*` → `${backendBase}/uploads/:path*` rewrite 추가. `backendBase`는 `NEXT_PUBLIC_API_URL`에서 `/api` 제거한 값(기본 `http://localhost:8080`)
- 이유: 로컬 개발 환경(nginx 없음)에서도 `/uploads/` 요청이 백엔드(8080)로 전달되도록

### 복원 방법

HIST-20260421-038 복원 시:
- `nginx.conf`에서 `location /uploads/` 블록 제거
- `next.config.js`의 rewrites에서 `/uploads/:path*` 항목 제거, `backendBase` 변수 제거하고 `/api/:path*` destination 원래 형태로 복원

---

## HIST-20260421-034

- **날짜**: 2026-04-21
- **수정 범위**: 관리자 프론트엔드 / 문항 등록·수정
- **수정 개요**: TipTap SSR 오류 수정, 주관식 (ㄱ)(ㄴ)(ㄷ) 서브답안 UI 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| frontend/src/components/ui/RichTextEditor.tsx | 수정 | immediatelyRender: false 추가 (SSR 하이드레이션 오류 해결) |
| frontend/src/components/ui/SubAnswerEditor.tsx | 추가 | (ㄱ)(ㄴ)(ㄷ) 레이블 서브답안 동적 관리 컴포넌트 |
| frontend/src/app/admin/exams/questions/new/page.tsx | 수정 | SHORT_ANSWER 정답 입력란을 SubAnswerEditor로 교체 |
| frontend/src/app/admin/exams/questions/[id]/edit/page.tsx | 수정 | SHORT_ANSWER 정답 입력란을 SubAnswerEditor로 교체 |

### 수정 상세

#### `RichTextEditor.tsx`
- 변경 전: `useEditor({extensions: [...], ...})`
- 변경 후: `useEditor({ immediatelyRender: false, extensions: [...], ...})`
- 이유: Next.js SSR 환경에서 TipTap이 `immediatelyRender` 미설정 시 하이드레이션 불일치 오류 발생

#### `SubAnswerEditor.tsx`
- 변경 전: 파일 없음
- 변경 후: (ㄱ)~(ㅊ) 최대 10개 서브답안 항목 관리, 직렬화 `(ㄱ) 값1\n(ㄴ) 값2`, 항목 1개일 때는 값만 직렬화
- 이유: 주관식 문항에서 빈칸 여러 개((ㄱ)(ㄴ)(ㄷ))를 독립적으로 입력/관리하기 위함

#### `new/page.tsx`, `edit/page.tsx`
- 변경 전: SHORT_ANSWER 정답이 단일 text input
- 변경 후: SubAnswerEditor 컴포넌트 사용 (key prop으로 타입 전환 시 재마운트 보장)

### 복원 방법

이 ID(HIST-20260421-034)만으로 복원 시:
- RichTextEditor.tsx에서 `immediatelyRender: false` 제거
- SubAnswerEditor.tsx 파일 삭제
- new/page.tsx, edit/page.tsx의 SubAnswerEditor import 및 사용 코드를 단일 text input으로 되돌림

---

## HIST-20260421-001

- **날짜**: 2026-04-21
- **수정 범위**: 관리자 프론트엔드 / 문항 등록·수정
- **수정 개요**: 문항 내용 입력란을 TipTap 리치 텍스트 에디터로 교체, 이미지 드래그앤드롭·클립보드 붙여넣기 지원, 카테고리를 문항 유형 마스터만 표시, 출제 연도·회차 콤보박스 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| frontend/src/components/ui/RichTextEditor.tsx | 추가 | TipTap 기반 리치 텍스트 에디터 컴포넌트 (드래그앤드롭·붙여넣기 이미지 업로드 포함) |
| frontend/src/app/admin/exams/questions/new/page.tsx | 수정 | 에디터 교체, 카테고리 필터링, 출제 연도·회차 필드 추가 |
| frontend/src/app/admin/exams/questions/[id]/edit/page.tsx | 수정 | 에디터 교체, 카테고리 필터링, 출제 연도·회차 필드 추가 |
| frontend/src/services/examService.ts | 수정 | adminCreateQuestionsBulk 타입에 year, round 필드 추가 |
| frontend/src/app/globals.css | 수정 | TipTap ProseMirror 스타일 추가 (.tpmp-editor) |

### 수정 상세

#### `frontend/src/components/ui/RichTextEditor.tsx`
- 변경 전: 파일 없음
- 변경 후: @tiptap/react 기반 에디터, StarterKit + Image + Placeholder 확장, 커스텀 ImageUploadExtension으로 drop/paste 이미지 업로드 처리, 서식 툴바(굵게·기울임·취소선·H2·H3·목록·코드·인용구·이미지) 포함
- 이유: 관리자가 문항 내용에 서식과 이미지를 쉽게 삽입할 수 있도록 리치 에디터 도입

#### `frontend/src/app/admin/exams/questions/new/page.tsx`
- 변경 전: 문항 내용 입력란이 plain textarea, ImageUploadButton 버튼 클릭 방식만 지원, 모든 DomainSlave 카테고리 표시, 연도·회차 필드 없음
- 변경 후: RichTextEditor 컴포넌트 사용, 카테고리를 getQuestionTypeSlaves()로 필터링(이름에 '유형'/'문항' 포함 마스터만), year/round 콤보박스 추가, QuestionDraft에 year·round 필드 포함
- 이유: 사용자 요구사항에 따른 기능 개선

#### `frontend/src/app/admin/exams/questions/[id]/edit/page.tsx`
- 변경 전: 문항 내용 입력란이 plain textarea, 카테고리·연도·회차 필드 없음
- 변경 후: RichTextEditor 사용, 카테고리·연도·회차 필드 추가, FormState에 categoryId·year·round 포함
- 이유: 등록과 동일한 UX를 수정 화면에도 적용

### 복원 방법

이 ID(HIST-20260421-001)만으로 복원 시:
- RichTextEditor.tsx 파일 삭제
- new/page.tsx, edit/page.tsx를 HIST-20260420-005 이전 상태로 되돌림 (textarea + ImageUploadButton 방식)
- examService.ts에서 year, round 필드 제거
- globals.css에서 .tpmp-editor 스타일 블록 제거

---

## HIST-20260420-005

- **날짜**: 2026-04-20
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 문항 등록/수정 화면에 이미지 업로드 버튼 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `src/components/ui/ImageUploadButton.tsx` | 추가 | 이미지 업로드 버튼 컴포넌트 — 업로드 후 `![이미지](url)` 마크다운 삽입 |
| `src/services/examService.ts` | 수정 | `adminUploadQuestionImage()` 추가 |
| `src/app/admin/exams/questions/[id]/edit/page.tsx` | 수정 | 문항 내용 라벨 옆에 ImageUploadButton 추가 |
| `src/app/admin/exams/questions/new/page.tsx` | 수정 | ManualQuestionCard 문항 내용 필드에 ImageUploadButton 추가 |

### 수정 상세

#### `ImageUploadButton.tsx`
- 변경 전: 없음
- 변경 후: 파일 선택 → `POST /api/admin/questions/images` → 반환 URL로 `![이미지](url)` 생성 → `onInsert` 콜백 호출
- 이유: 문항 내용에 이미지를 마크다운 참조 형태로 삽입하기 위한 재사용 컴포넌트

### 복원 방법

HIST-20260420-005 복원 시:
- `ImageUploadButton.tsx` 삭제
- `examService.ts`에서 `adminUploadQuestionImage` 제거
- 각 페이지에서 ImageUploadButton import 및 사용 코드 제거

---

## HIST-20260419-019

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 프론트엔드 / 문항 등록
- **수정 개요**: 문항 등록 화면에 카테고리(문제 유형) 필수 선택 콤보박스 추가, 입력 필드 maxLength 제한 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/app/admin/exams/questions/new/page.tsx | 수정 | 카테고리 select 추가, domainService 로드, importCategory 상태, maxLength 속성 추가 |
| src/app/admin/exams/papers/new/page.tsx | 수정 | title input에 maxLength={200} 추가 |
| src/services/examService.ts | 수정 | adminCreateQuestionsBulk 파라미터에 categoryId: number 추가 |
| src/types/index.ts | 수정 | QuestionSummary에 categoryId?, categoryName? 추가 |

### 수정 상세

#### `src/app/admin/exams/questions/new/page.tsx`
- 변경 전: QuestionDraft에 categoryId 없음, 카테고리 선택 UI 없음
- 변경 후: `categoryId: number | null` 필드 추가, ManualQuestionCard에 allSlaves prop 전달하여 카테고리 select 렌더링, Import 탭에 importCategory amber 선택기 추가, handleSubmit에서 미선택 시 오류 표시
- 이유: 문항의 문제 유형 분류를 필수값으로 지정

### 복원 방법

이 ID(HIST-20260419-019)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다.

---

## HIST-20260419-010

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 순번 컬럼 1줄 고정, 검색 조건(내용·유형·등록일), 페이지 크기 콤보박스(10·20·50), 페이지네이션 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | 검색 조건 영역, 페이지 크기 선택, 클라이언트 사이드 필터·페이지네이션 전면 개편 |

### 수정 상세

#### `app/admin/exams/questions/page.tsx`
- 변경 전: 고정 50건 표시, 검색·필터 없음, 순번 컬럼 줄바꿈 가능
- 변경 후:
  - `allQuestions` 최대 500건 1회 로딩 후 클라이언트 필터링
  - 검색 조건: 문항 내용 키워드(Enter 지원), 유형 select, 등록일 from/to date picker
  - 조건 초기화 버튼 (조건 있을 때만 표시)
  - 페이지 크기 콤보박스: 10 / 20 / 50개
  - 페이지네이션: 이전/다음 + 번호 버튼 (현재 ±2, 양 끝, … 생략)
  - 순번: `whitespace-nowrap` + `w-12` + `No.` 헤더로 1줄 고정
  - 순번 값: 전체 기준 연속 번호 (`page * pageSize + idx + 1`)

### 복원 방법

이 ID(HIST-20260419-010)만으로 복원 시:
- `page.tsx`를 HIST-20260419-009 이전 상태(단순 목록)로 되돌림

---

## HIST-20260419-009

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 문항 목록에 수정 버튼 추가, 문항 수정 페이지(`[id]/edit`) 신규 구현

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `QuestionSummary`에 `explanation?: string` 필드 추가 |
| `frontend/src/services/examService.ts` | 수정 | `adminGetQuestion(id)`, `adminUpdateQuestion(id, data)` 메서드 추가 |
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | 테이블에 "관리" 컬럼 추가, 행마다 "수정" 버튼 → `/admin/exams/questions/{id}/edit` 이동 |
| `frontend/src/app/admin/exams/questions/[id]/edit/page.tsx` | 추가 | 문항 수정 페이지 — 기존 데이터 로드 후 수정 폼, PUT 저장 |

### 수정 상세

#### `types/index.ts`
- 변경 전: `QuestionSummary`에 `explanation` 없음
- 변경 후: `explanation?: string` 추가 (백엔드 `QuestionBankResponse`와 일치)

#### `services/examService.ts`
- 변경 전: 단건 조회·수정 메서드 없음
- 변경 후:
  - `adminGetQuestion(id)` → `GET /admin/questions/{id}`
  - `adminUpdateQuestion(id, data)` → `PUT /admin/questions/{id}`

#### `app/admin/exams/questions/page.tsx`
- 변경 전: 문항 행 클릭/수정 기능 없음
- 변경 후: 테이블 우측 "관리" 컬럼에 "수정" 버튼 추가, 클릭 시 수정 페이지로 이동

#### `app/admin/exams/questions/[id]/edit/page.tsx`
- 변경 전: 파일 없음
- 변경 후: 문항 수정 페이지
  - 마운트 시 `adminGetQuestion(id)`로 기존 데이터 로드
  - 유형(MULTIPLE_CHOICE/SHORT_ANSWER/OX/CODE) 전환 가능
  - CODE 유형: 언어 선택 + CodeEditor + 정답/예상출력
  - MULTIPLE_CHOICE: 보기 편집 + 정답 번호 선택
  - OX/SHORT_ANSWER: 각 유형에 맞는 정답 입력
  - 해설 필드 공통 제공
  - 저장 시 `adminUpdateQuestion` 호출 → 목록 페이지로 이동

### 복원 방법

이 ID(HIST-20260419-009)만으로 복원 시:
- `types/index.ts`: `explanation` 필드 제거
- `examService.ts`: `adminGetQuestion`, `adminUpdateQuestion` 제거
- `page.tsx`: "관리" 컬럼 및 수정 버튼 제거, `useRouter` import 제거
- `[id]/edit/page.tsx`: 파일 삭제
