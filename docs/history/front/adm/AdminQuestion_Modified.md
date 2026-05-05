## HIST-20260505-002

- **날짜**: 2026-05-05
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 문항 관리 테이블에 '상세' 버튼 추가 — 클릭 시 `QuestionDetailModal`로 전체 내용 확인 가능

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | 문항 테이블 관리 컬럼에 '상세' 버튼 추가 (수정·삭제 버튼 좌측) |

### 수정 상세

#### `admin/exams/questions/page.tsx`
- 변경 전: 관리 컬럼 = [수정, 삭제]
- 변경 후: 관리 컬럼 = [상세, 수정, 삭제]
- 이유: 문항 내용이 에디터 HTML이라 테이블 셀에서 전체 확인 불가 → 모달로 상세 보기 제공

### 복원 방법

이 ID(HIST-20260505-002)만으로 복원 시 `questions/page.tsx`에서 '상세' 버튼과 `detailQ` 관련 코드를 제거한다.

---

## HIST-20260504-008

- **날짜**: 2026-05-04
- **수정 범위**: 관리자 프론트엔드 / 문제 관리
- **수정 개요**: 문제 등록 화면의 문제 목록 미리보기에서 HTML 태그 노출 수정 → `.replace(/<[^>]+>/g, '')` 적용

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/questions/new/page.tsx` | 수정 | 가져온 문제 목록 미리보기 `q.content` HTML 태그 제거 |

### 수정 상세

#### `frontend/src/app/admin/exams/questions/new/page.tsx` (line 705)
- 변경 전: `{q.content}`
- 변경 후: `{q.content.replace(/<[^>]+>/g, '')}`
- 이유: 가져온 문제 목록 미리보기에 HTML 태그가 노출됨

### 복원 방법

이 ID(HIST-20260504-008)만으로 복원 시 위 "변경 전" 내용을 각 파일에 적용한다.

---

## HIST-20260504-005

- **날짜**: 2026-05-04
- **수정 범위**: INFRA / Next.js 설정 분리
- **수정 개요**: `next.config.js`를 공통·개발·프로덕션 3블록으로 분리

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/next.config.js` | 수정 | `sharedConfig` / `devConfig` / `prodConfig` 분리, `NODE_ENV`로 병합 |

### 수정 상세

#### `next.config.js` 구조 변경

| 블록 | 내용 |
|------|------|
| `sharedConfig` | `reactStrictMode`, `transpilePackages`, `webpack` — 환경 무관 공통 |
| `devConfig` | `rewrites()` — `/api/`, `/uploads/` → 백엔드 직접 프록시 (Nginx 없는 개발 환경) |
| `prodConfig` | 현재 비어 있음 — 향후 프로덕션 전용 설정 추가 지점 |

`module.exports = { ...sharedConfig, ...(isDev ? devConfig : prodConfig) }`

### 복원 방법

HIST-20260504-005 복원 시:
- 단일 `nextConfig` 객체로 병합, `module.exports = nextConfig`로 복원

---

## HIST-20260504-004

- **날짜**: 2026-05-04
- **수정 범위**: INFRA / Next.js 개발 프록시 — 업로드 이미지 404 수정 (로컬 개발 환경)
- **수정 개요**: `next.config.js` rewrites에 `/uploads/` 프록시 추가 — 개발 서버에서 이미지 404 해결

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/next.config.js` | 수정 | `rewrites()`에 `/uploads/:path*` → 백엔드 origin 프록시 항목 추가 |

### 수정 상세

#### 근본 원인

로컬 개발 환경에서 Nginx 없이 Next.js dev server가 직접 실행된다. `next.config.js`의 `rewrites`가 `/api/:path*`만 백엔드(`http://localhost:8080`)로 프록시하고, `/uploads/:path*`는 설정이 없었다. 백엔드가 반환한 `/uploads/images/...` URL을 브라우저가 요청하면 Next.js dev server로 가고 404가 발생했다.

#### `next.config.js`

- 변경 전: `/api/:path*` 프록시 1개
- 변경 후: `apiBase`에서 `backendOrigin`(`http://localhost:8080`)을 파싱해 `/uploads/:path*` 프록시 추가

```js
const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
const backendOrigin = apiBase.replace(/\/api\/?$/, '');
// /uploads/:path* → http://localhost:8080/uploads/:path*
```

### 복원 방법

HIST-20260504-004 복원 시:
- `next.config.js` `rewrites()`에서 `backendOrigin` 변수 선언과 `/uploads/:path*` 항목 제거, `apiBase` 변수를 인라인으로 복원

---

## HIST-20260504-003

- **날짜**: 2026-05-04
- **수정 범위**: INFRA / Nginx — 업로드 이미지 404 수정
- **수정 개요**: Nginx에 `/uploads/` 경로 프록시 블록 추가 — 에디터 이미지 삽입 후 broken image 현상 해결

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `nginx/nginx.conf` | 수정 | `location /uploads/` 블록 추가 — 백엔드 정적 파일 서빙으로 프록시 |

### 수정 상세

#### 근본 원인

백엔드 `AttachmentService`는 이미지를 저장한 뒤 `/uploads/images/{uuid}.{ext}` 형태의 **상대 경로**를 반환한다.
Quill 에디터는 이 URL을 `<img src="/uploads/images/...">` 로 삽입한다.
브라우저가 해당 경로를 요청하면 Nginx가 처리하는데, 기존 nginx.conf에는 `/uploads/` 라우팅이 없었으므로 `location /` → Next.js(프론트엔드)로 전달되어 404가 발생했다.

백엔드 `WebMvcConfig`는 이미 `/uploads/**`를 파일 시스템으로 서빙하도록 설정되어 있으므로, Nginx에 라우팅만 추가하면 된다.

#### `nginx/nginx.conf`

- 변경 전: `/api/` → 백엔드, `/` → 프론트엔드 2개 블록만 존재
- 변경 후: `/uploads/` → 백엔드 프록시 블록 추가

```nginx
# 추가된 블록
location /uploads/ {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 복원 방법

HIST-20260504-003 복원 시:
- `nginx/nginx.conf`에서 `location /uploads/ { ... }` 블록 제거

---

## HIST-20260504-002

- **날짜**: 2026-05-04
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: RichTextEditor — `dynamic()` 래퍼로 인한 React ref 경고 및 Quill 인스턴스 미확보 문제 근본 해결

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/RichTextEditor.tsx` | 수정 | `dynamic()` 제거 → `useState` + `useEffect`로 클라이언트에서 react-quill 클래스 직접 로드; 폴링 의존성을 `RQ` 상태로 변경; 로딩 중 스켈레톤 플레이스홀더 추가 |

### 수정 상세

#### 근본 원인

`dynamic()`은 내부적으로 **함수 컴포넌트 래퍼**를 반환한다. 함수 컴포넌트에 `ref`를 전달하려면 `React.forwardRef`가 필요한데, `dynamic()` 래퍼 자체는 이를 적용하지 않는다. 팩토리 안에서 `React.forwardRef`로 감싸도 `dynamic()` 바깥 래퍼가 함수 컴포넌트이기 때문에 경고가 사라지지 않고, 결과적으로 `quillRef.current`가 항상 `null`이 된다. `quillRef.current`가 `null`이면 폴링이 Quill 인스턴스를 찾지 못해 이미지 삽입 자체가 동작하지 않는다.

#### `RichTextEditor.tsx`

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 로드 방식 | `dynamic()` + 팩토리 내 `React.forwardRef` 래퍼 | `useState<any>(null)` + `useEffect(() => import('react-quill'))` |
| ref 수신자 | `dynamic()` 함수 컴포넌트 래퍼 (→ 항상 null) | react-quill 클래스 컴포넌트 직접 (→ 정상 동작) |
| 폴링 트리거 | 마운트 1회 (`[]`) | `RQ` 상태 변경 시 (`[RQ]`) — 모듈 로드 전 폴링 시작 방지 |
| 로딩 UI | 없음 (빈 공간) | `animate-pulse` 스켈레톤 플레이스홀더 |

- 변경 이유: `dynamic()` 래퍼를 거치지 않고 클래스를 직접 렌더하면 React가 ref를 클래스 인스턴스에 정상 전달하므로 경고도 없고 `quillRef.current.getEditor()` 호출도 성공한다.

### 복원 방법

HIST-20260504-002 복원 시:
- `RQ` state 제거, `useState` import 제거
- `dynamic` import 추가, 팩토리 + `React.forwardRef` 래퍼 패턴 복원
- 폴링 `useEffect` 의존성을 `[]`로 복원
- 로딩 스켈레톤 div 제거, `<ReactQuill ref={quillRef} ... />` 무조건 렌더로 복원

---

## HIST-20260504-001

- **날짜**: 2026-05-04
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: RichTextEditor — 이미지 등록 시 에디터 미준비 알림 시점 개선 + 하이퍼링크 팝업 좌측 정렬 고정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/RichTextEditor.tsx` | 수정 | 이미지 핸들러(툴바)에 에디터 준비 여부 사전 검사 추가, `handleImageChange` 내 중복 alert 제거 |
| `frontend/src/app/globals.css` | 수정 | `.ql-tooltip`에 `left: 0 !important` 추가 — 링크 팝업 좌측 정렬 고정 |

### 수정 상세

#### `RichTextEditor.tsx` — 이미지 핸들러
- 변경 전: 툴바 이미지 버튼 클릭 시 에디터 준비 여부를 확인하지 않고 파일 다이얼로그를 바로 열었다. 사용자가 파일을 선택한 뒤 `handleImageChange`에서 `editorRef.current`가 null이면 "에디터가 아직 준비되지 않았습니다." alert가 표시됐다.
- 변경 후: 툴바 핸들러에서 `editorRef.current`를 먼저 확인하고, null이면 alert를 즉시 표시하고 파일 다이얼로그를 열지 않는다. `handleImageChange` 내의 중복 alert는 `return`만 남긴다.
- 이유: 파일을 선택한 후 알림이 뜨면 사용자가 업로드가 됐는지 안 됐는지 혼동한다. 파일 선택 전에 알리는 것이 자연스러운 UX다.

#### `globals.css` — `.ql-tooltip`
- 변경 전: Quill이 JS로 계산한 `left` 값을 그대로 사용 → 선택 영역 위치에 따라 팝업이 이동
- 변경 후: `left: 0 !important` 추가 → 링크 팝업이 항상 에디터 컨테이너 좌측에 고정
- 이유: 선택 위치에 따라 팝업이 좌우로 이동하면 가독성이 떨어지고 화면 밖으로 잘릴 수 있다. 좌측 고정으로 일관된 위치 보장.

### 복원 방법

HIST-20260504-001 복원 시:
- `RichTextEditor.tsx` 이미지 핸들러: `if (!quill) { alert(...); return; }` 라인 제거, `handleImageChange` 안의 `if (!quill) return;`을 `if (!quill) { alert('에디터가 아직 준비되지 않았습니다.'); return; }`로 되돌림
- `globals.css` `.ql-tooltip`: `left: 0 !important;` 라인 제거

---

## HIST-20260503-011

- **날짜**: 2026-05-03
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: RichTextEditor 이미지 삽입 불가("에디터가 아직 준비되지 않았습니다") 수정 + 하이퍼링크 툴팁 잘림 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/RichTextEditor.tsx` | 수정 | `useEffect`(매 렌더) → 폴링 방식(마운트 1회, 150ms 간격)으로 editorRef 초기화 방식 변경 |
| `frontend/src/app/admin/exams/questions/new/page.tsx` | 수정 | ManualQuestionCard 래퍼 div에서 `overflow-hidden` 제거 |
| `frontend/src/app/admin/exams/questions/[id]/edit/page.tsx` | 수정 | 폼 카드 래퍼 div에서 `overflow-hidden` 제거 |

### 수정 상세

#### `RichTextEditor.tsx`
- 변경 전: 매 렌더마다 실행되는 `useEffect`에서 `quillRef.current?.getEditor?.()`로 editorRef 설정 시도
- 변경 후: 마운트 시 1회만 등록되는 `useEffect` 내부에서 150ms 간격 폴링으로 Quill 인스턴스가 준비될 때까지 재시도; 언마운트 시 `cancelled = true` + `editorRef.current = null`로 정리
- 이유: `dynamic()` 비동기 로드 완료 시점이 마운트보다 늦을 수 있어, 매 렌더 방식으로도 타이밍을 맞추지 못하는 경우 발생

#### `new/page.tsx` (ManualQuestionCard)
- 변경 전: `<div className="... overflow-hidden">`
- 변경 후: `<div className="... ">`(overflow-hidden 제거)
- 이유: `overflow-hidden`이 Quill `.ql-tooltip`(절대위치 팝업)을 카드 경계에서 잘라냄

#### `[id]/edit/page.tsx` (폼 카드)
- 변경 전: `<div className="... overflow-hidden">`
- 변경 후: `<div className="... ">`(overflow-hidden 제거)
- 이유: 동일 — 하이퍼링크/색상 팝업이 카드 밖으로 나오지 못해 잘림

### 복원 방법

이 ID(HIST-20260503-011)만으로 복원 시:
- `RichTextEditor.tsx`: 폴링 `useEffect`를 매 렌더 실행 `useEffect`(의존 배열 없음, `if (editorRef.current) return;` 가드)로 교체
- `new/page.tsx` ManualQuestionCard 래퍼: `overflow-hidden` 다시 추가
- `[id]/edit/page.tsx` 폼 카드: `overflow-hidden` 다시 추가

---

## HIST-20260503-010

- **날짜**: 2026-05-03
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: RichTextEditor — `dynamic()` 래퍼로 인한 "Function components cannot be given refs" 스크립트 오류 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/RichTextEditor.tsx` | 수정 | `dynamic()` 반환 컴포넌트를 `React.forwardRef`로 감싸 ref 전달 경로 확보 |

### 수정 상세

#### `RichTextEditor.tsx`
- **오류 원인**: `dynamic(() => import('react-quill'), { ssr: false })`는 내부적으로 함수 컴포넌트 래퍼를 생성하는데, 함수 컴포넌트는 `React.forwardRef` 없이 `ref`를 받을 수 없음 → `<ReactQuill ref={quillRef} />`에서 런타임 경고·ref null 발생
- **변경 전**: `const ReactQuill = dynamic(() => import('react-quill'), { ssr: false }) as any`
- **변경 후**:
  ```tsx
  const ReactQuill = dynamic<any>(
    async () => {
      const { default: RQ } = await import('react-quill');
      const Fwd = React.forwardRef<any, any>((props, ref) => <RQ {...props} ref={ref} />);
      Fwd.displayName = 'ReactQuill';
      return Fwd;
    },
    { ssr: false },
  );
  ```
  - async 팩토리 함수 내에서 `React.forwardRef`로 ReactQuill을 감싼 뒤 반환
  - `ref`가 dynamic 래퍼 → forwardRef 래퍼 → ReactQuill 클래스 인스턴스까지 정확히 전달됨
  - `quillRef.current.getEditor()` 호출 가능 → `editorRef.current`에 원시 Quill 인스턴스 저장 성공

### 복원 방법

HIST-20260503-010 복원 시:
- `dynamic` 호출을 단순 `dynamic(() => import('react-quill'), { ssr: false }) as any` 형태로 되돌림
- `React` import에서 default export 제거 (`import { useRef, useMemo, useEffect } from 'react'`)

---

## HIST-20260503-009

- **날짜**: 2026-05-03
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: RichTextEditor 이미지 삽입 완전 수정 + 링크 팝업 잘림 수정 + 글자 크기·색상 기능 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/RichTextEditor.tsx` | 수정 | editorRef 분리(useEffect 마운트 후 저장), JSX 파일인풋 도입, 이미지 핸들러 안정화, 글자 크기·색상·배경색 툴바 추가 |
| `frontend/src/app/globals.css` | 수정 | overflow-hidden 제거→ql-container overflow:visible, 링크 tooltip z-index·border-radius 추가, 사이즈 피커 한국어 레이블, 다크모드 tooltip·picker 스타일 보완 |

### 수정 상세

#### `RichTextEditor.tsx`
- **이미지 미삽입 근본 원인**: `dynamic()` 래퍼를 통한 ref에서 `getEditor()`의 반환 타이밍이 불확실 → `useMemo` 핸들러 내에서 호출 시 null 가능성
- **수정 방법**:
  - `editorRef` 별도 추가 — `useEffect`(매 렌더 후 실행, 이미 설정 시 즉시 반환)로 `quillRef.current?.getEditor?.()`를 호출해 원시 Quill 인스턴스 저장
  - `fileRef` (JSX `<input type="file">`) 추가 — `createElement` 방식 제거, React 이벤트 시스템 내에서 파일 선택·업로드 처리
  - 이미지 핸들러: `editorRef.current` 사용, 커서 위치를 `savedIdx.current`에 저장 후 `fileRef.current?.click()`
  - `handleImageChange`: 파일 선택 → 업로드 → `quill.insertEmbed(idx, 'image', url)` → `setSelection(idx+1)`
- **기능 추가**: 툴바에 `size`(small/보통/large/huge), `color`, `background` 피커 추가; formats에 `'size', 'color', 'background'` 추가

#### `globals.css`
- **링크 팝업 잘림 수정**: 래퍼 div의 `overflow-hidden`(Tailwind 클래스) 제거, `.ql-container.ql-snow`에 `overflow: visible` 적용, `.ql-editor`에 `overflow-y: auto` 유지
- `.ql-toolbar`: `border-radius: 0.5rem 0.5rem 0 0` (상단 모서리)
- `.ql-container`: `border-radius: 0 0 0.5rem 0.5rem` (하단 모서리)
- `.ql-tooltip`: `z-index: 50`, `border-radius`, `box-shadow` 추가
- `.ql-picker-options`: `z-index: 50`, `border-radius`, `box-shadow` 추가
- 사이즈 피커 한국어 레이블: 작게/보통/크게/매우 크게
- 다크모드: tooltip 배경·테두리·텍스트·input 스타일, picker-item hover 추가

### 복원 방법

HIST-20260503-009 복원 시:
- `RichTextEditor.tsx`: `editorRef`/`fileRef`/`savedIdx` 제거, `useEffect` 제거, `modules`를 이전 핸들러(createElement 방식)로 복원, 툴바에서 size/color/background 제거, `handleImageChange` 제거
- `globals.css`: HIST-20260503-007 시점의 Quill 스타일 블록으로 복원

---

## HIST-20260503-008

- **날짜**: 2026-05-03
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 리치텍스트 에디터(react-quill) 이미지 삽입 버그 수정 — 파일 다이얼로그 오픈 시 포커스 소실로 selection null 반환하여 삽입이 무시되던 문제

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/RichTextEditor.tsx` | 수정 | 이미지 핸들러: 다이얼로그 열기 전 selection index 저장, 파일 선택 후 저장된 index에 insertEmbed |

### 수정 상세

#### `components/ui/RichTextEditor.tsx` — image handler
- **변경 전**: `input.click()` 후 `onchange`에서 `quill.getSelection(true)` 호출 → 파일 다이얼로그로 포커스 이동으로 selection이 null → `if (quill && range)` 조건 실패 → 이미지 삽입 무시
- **변경 후**:
  1. `input.click()` 호출 **전**에 `quill.getSelection()?.index` 저장 (`savedIndex`)
  2. `input.onchange` → `input.addEventListener('change', ...)` 변경
  3. 파일 선택 후 `savedIndex`로 `quill.insertEmbed(savedIndex, 'image', url)` 호출
  4. `getEditor` 존재 여부 방어적 처리: `rq?.getEditor ? rq.getEditor() : null`
  5. `url` 빈 문자열 guard 추가 (`if (!url) return`)

### 복원 방법

HIST-20260503-008 복원 시:
- `imageHandler`를 변경 전 방식(savedIndex 없이 onchange 안에서 getSelection)으로 되돌림

---

## HIST-20260503-007

- **날짜**: 2026-05-03
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 문항 내용 입력 필드를 textarea+ImageUploadButton에서 react-quill 기반 리치텍스트 에디터(`RichTextEditor`)로 교체 — 이미지 업로드 인라인 미리보기, 서식(굵게·기울임·목록 등) 지원

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/RichTextEditor.tsx` | 수정 | Tiptap 의존 제거 → react-quill 기반으로 전면 재작성, 이미지 업로드 핸들러 내장 |
| `frontend/src/app/globals.css` | 수정 | Quill `.rte-quill-wrapper` 스타일 통합 (테두리·다크모드·이미지 미리보기 등) |
| `frontend/src/app/admin/exams/questions/new/page.tsx` | 수정 | `ImageUploadButton` import 제거 → `RichTextEditor` import; ManualQuestionCard의 content 필드 textarea→RichTextEditor 교체; `stripHtml` 헬퍼 추가로 유효성 검사 개선 |
| `frontend/src/app/admin/exams/questions/[id]/edit/page.tsx` | 수정 | `ImageUploadButton` import 제거 → `RichTextEditor` import; 문항 내용 textarea→RichTextEditor 교체; `stripHtml` 유효성 검사 적용 |
| `frontend/package.json` | 수정 | `react-quill` 패키지 설치 (`npm install react-quill`) |

### 수정 상세

#### `components/ui/RichTextEditor.tsx`
- **변경 전**: Tiptap(`@tiptap/react`, `@tiptap/starter-kit` 등) 의존 — package.json에 없어 빌드 불가
- **변경 후**: `react-quill` 동적 import (`ssr: false`), `quill.snow.css` import
  - 툴바: 제목(H1~H3), 굵게·기울임·밑줄·취소선, 순서 있는/없는 목록, 링크, 이미지, 서식 초기화
  - 이미지 핸들러: 파일 선택 → `examService.adminUploadQuestionImage()` → Quill에 `insertEmbed`로 삽입, 업로드 즉시 인라인 미리보기
  - `modules` `useMemo` 안정화로 Quill 툴바 재설치 방지
  - Props: `value`, `onChange(html)`, `placeholder`, `minHeight`

#### `globals.css`
- `.rte-quill-wrapper` 래퍼 클래스 스타일 추가
  - `.ql-toolbar`, `.ql-container` 기본 border 제거 (부모 div border·ring으로 통합)
  - 툴바 배경: `#f9fafb`, 하단 구분선 유지
  - 에디터 폰트: Noto Sans KR 상속, `0.875rem`
  - 이미지: `max-width: 100%`, `border-radius: 6px`, 블록 표시로 미리보기 형태
  - 다크모드: `.dark .rte-quill-wrapper` 배경·아이콘·텍스트 색상 오버라이드

#### `new/page.tsx`
- **변경 전**: `ImageUploadButton` 버튼 + `<textarea>` (마크다운 텍스트 삽입 방식)
- **변경 후**: `<RichTextEditor value onChange placeholder minHeight />` (WYSIWYG 방식)
- `stripHtml` 헬퍼 함수 추가 — `manualFilledCount`, `handleSubmit` 양쪽에서 HTML 태그 제거 후 비어있는지 검사

#### `[id]/edit/page.tsx`
- **변경 전**: `ImageUploadButton` 버튼 + `<textarea>`
- **변경 후**: `<RichTextEditor value onChange placeholder minHeight />`
- `handleSubmit` 유효성 검사: `form.content.trim()` → `stripHtml(form.content)`

### 복원 방법

HIST-20260503-007 복원 시:
- `RichTextEditor.tsx`: Tiptap 기반 구현으로 복원 (HIST-20260420-005 이전 미존재, Tiptap 패키지 재설치 필요)
- `globals.css`: `.rte-quill-wrapper` 이하 Quill 스타일 블록 제거
- `new/page.tsx`: `RichTextEditor` → `ImageUploadButton` import 교체; `stripHtml` 제거; ManualQuestionCard content 필드를 textarea+ImageUploadButton으로 복원
- `[id]/edit/page.tsx`: 동일하게 textarea+ImageUploadButton 복원, `stripHtml` 제거
- `react-quill` 언인스톨: `npm uninstall react-quill`

---

## HIST-20260501-002

- **날짜**: 2026-05-01
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 문항 목록 테이블에 "수정일" 컬럼 추가, 등록일·수정일 기준 클릭 정렬 지원 (기본: 최근 수정일 내림차순)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `QuestionSummary`에 `updatedAt?: string` 옵셔널 필드 추가 |
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | `SortField` 타입·`SortIcon` 컴포넌트 추가, `sortField`/`sortDir` 상태, `handleSort()`, filtered useMemo에 정렬 로직 추가, "수정일" 컬럼 추가, 테이블 스켈레톤 cols 5→6 |

### 수정 상세

#### `types/index.ts`
- 변경 전: `QuestionSummary.createdAt: string` 이후 필드 없음
- 변경 후: `updatedAt?: string` 추가 (옵셔널 — 이전 API 응답과 하위 호환 유지)
- 이유: 백엔드가 반환하는 `updatedAt`(modifiedDt)을 타입으로 수용

#### `admin/exams/questions/page.tsx`
- 변경 전: 정렬 기능 없음, "등록일" 컬럼만 존재
- 변경 후:
  - `SortField = 'createdAt' | 'updatedAt'` 타입 정의
  - `SortIcon` 컴포넌트: 활성 여부·방향에 따라 인디고/회색 화살표 SVG
  - `sortField` 상태(기본 `'updatedAt'`), `sortDir` 상태(기본 `'desc'`)
  - `handleSort(field)`: 같은 필드 클릭 시 방향 토글, 다른 필드 클릭 시 해당 필드로 전환 + 내림차순 초기화
  - `filtered` useMemo: 필터 후 `[...base].sort(...)` 로 정렬 (updatedAt은 없을 때 createdAt으로 fallback)
  - 테이블 헤더: "등록일" / "수정일" 버튼화, `SortIcon` 포함
  - 테이블 행: `updatedAt` 있으면 한국 날짜 포맷, 없으면 `-`
  - `TableSkeleton cols={5}` → `cols={6}` (컬럼 수 증가)
- 이유: 최근 수정된 문항을 우선 확인할 수 있도록 기본 정렬 제공

### 복원 방법

이 ID(HIST-20260501-002)만으로 복원 시:
- `types/index.ts`: `updatedAt?: string` 제거
- `page.tsx`: `SortField` 타입, `SortIcon` 컴포넌트, `sortField`/`sortDir` 상태, `handleSort` 제거; "수정일" `<th>`/`<td>` 제거; `filtered` useMemo에서 sort 로직 제거; `TableSkeleton cols={6}` → `cols={5}` 복원

---

## HIST-20260430-015

- **날짜**: 2026-04-30
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 문항 등록/수정 화면에 시험 유형 + 문항 유형 드롭다운 추가, 카테고리 필수 해제, 편집 화면 로딩 스켈레톤 적용

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `QuestionSummary`에 `examTypeId`, `examTypeName` 옵셔널 필드 추가 |
| `frontend/src/services/examService.ts` | 수정 | `adminCreateQuestionsBulk` categoryId 선택 필드로 변경, examTypeId 추가; `adminUpdateQuestion` categoryId/examTypeId 추가 |
| `frontend/src/app/admin/exams/questions/new/page.tsx` | 수정 | `QuestionDraft`에 `examTypeId` 추가, `ManualQuestionCard` props를 `examTypeSlaves`/`questionTypeSlaves`로 분리, 가져오기 탭에 시험 유형 셀렉터 추가, 필수 categoryId 체크 제거 |
| `frontend/src/app/admin/exams/questions/[id]/edit/page.tsx` | 수정 | `FormState`에 `categoryId`/`examTypeId` 추가, 도메인 로드 useEffect 추가, 시험 유형/문항 유형 드롭다운 추가, 로딩 스켈레톤으로 교체 |

### 수정 상세

#### `types/index.ts`
- 변경 전: `QuestionSummary`에 `categoryName?: string` 이후 `createdAt`
- 변경 후: `examTypeId?: number`, `examTypeName?: string` 두 필드 추가
- 이유: 백엔드 응답의 examTypeId/examTypeName을 타입으로 수용

#### `services/examService.ts`
- 변경 전: `adminCreateQuestionsBulk`의 `categoryId: number` (필수), `adminUpdateQuestion` categoryId 없음
- 변경 후: `categoryId?: number`, `examTypeId?: number` 선택 필드로 변경
- 이유: 두 드롭다운 모두 선택 사항이므로 타입을 옵셔널로 완화

#### `questions/new/page.tsx`
- 변경 전: `QuestionDraft`에 `categoryId`만, `ManualQuestionCard`의 `allSlaves` 단일 prop, 카테고리 필수 체크 존재
- 변경 후: `examTypeId: number | null` 추가, `examTypeSlaves`/`questionTypeSlaves` 두 prop으로 분리, 가져오기 탭에 시험 유형/문항 유형 셀렉터 2개, `categoryId !== null` 필수 체크 제거
- 이유: 시험 유형과 문항 유형을 별도 드롭다운으로 선택하도록 UX 개선

#### `questions/[id]/edit/page.tsx`
- 변경 전: `FormState`에 categoryId/examTypeId 없음, 로딩 시 스피너
- 변경 후: `categoryId: number | null`, `examTypeId: number | null` 추가, 도메인 useEffect로 슬레이브 목록 로드, 시험 유형/문항 유형 드롭다운 추가, `TableSkeleton rows={5} cols={2}` 로딩 스켈레톤 적용
- 이유: 수정 화면에서도 시험/문항 유형 편집 지원 및 스켈레톤 UI 컨벤션 준수

### 복원 방법

이 ID(HIST-20260430-015)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다.

---

## HIST-20260430-001

- **날짜**: 2026-04-30
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 검색 조건(유형, 등록일)이 변경 즉시 반영되던 것을 검색 버튼 클릭 시에만 적용되도록 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | 입력 상태와 적용 상태 분리, 검색 버튼 클릭 시 일괄 반영 |

### 수정 상세

#### `admin/exams/questions/page.tsx`
- **변경 전**: `typeFilter`, `dateFrom`, `dateTo` onChange 시 `setPage(0)` 호출 → 즉시 필터링 반영. `useMemo`가 입력 상태 직접 구독
- **변경 후**: `appliedKeyword`, `appliedTypeFilter`, `appliedDateFrom`, `appliedDateTo` 별도 상태 추가. `useMemo`는 applied 상태만 구독. `handleSearch()`에서 모든 applied 상태 일괄 갱신. 초기화 버튼도 applied 상태 함께 리셋
- **이유**: 검색 버튼을 누를 때까지 조건이 반영되지 않아야 한다는 UX 요구 사항

### 복원 방법

이 ID(HIST-20260430-001)로 복원 시:
- `appliedKeyword/appliedTypeFilter/appliedDateFrom/appliedDateTo` 상태 4개 제거
- `useMemo` deps를 `[allQuestions, keyword, typeFilter, dateFrom, dateTo]`로 복원
- `typeFilter` onChange에 `setPage(0)` 추가, `dateFrom`/`dateTo` onChange에 `setPage(0)` 추가
- `handleSearch = () => setPage(0)`으로 복원
- 초기화 버튼 조건 및 onClick에서 applied 상태 제거

---

## HIST-20260422-002

- **날짜**: 2026-04-22
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 문항 목록 내용 미리보기에서 HTML 태그가 그대로 표시되던 현상 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | 목록 테이블 content 셀의 `{q.content}` → `{q.content.replace(/<[^>]+>/g, '')}` |

### 수정 상세

#### `frontend/src/app/admin/exams/questions/page.tsx`
- 변경 전: `<p className="truncate">{q.content}</p>` — `<img>` 등 태그 문자 그대로 표시
- 변경 후: `<p className="truncate">{q.content.replace(/<[^>]+>/g, '')}</p>` — HTML 태그 제거 후 순수 텍스트 표시
- 이유: 이미지 업로드 버튼으로 삽입된 `<img>` 태그가 미리보기 셀에 원문으로 노출되던 버그 수정

### 복원 방법

HIST-20260422-002 복원 시:
- `{q.content.replace(/<[^>]+>/g, '')}` → `{q.content}` 으로 되돌림

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
