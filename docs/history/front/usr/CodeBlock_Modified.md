## HIST-20260629-001

- **날짜**: 2026-06-29
- **수정 범위**: 사용자 프론트엔드 / 공용 CodeBlock 구문강조 컴포넌트
- **수정 개요**: 긴 코드 줄 가로 스크롤 → 줄바꿈(wrap)으로 교체 (`wrapLongLines` 활성화 + `whiteSpace: 'pre-wrap'`)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/CodeBlock.tsx` | 수정 | `wrapLongLines` prop 추가, `customStyle`·`codeTagProps` 에 `whiteSpace: 'pre-wrap'`, `wordBreak: 'break-word'` 적용, `overflowX: 'auto'` 제거 |

### 수정 상세

#### `frontend/src/components/ui/CodeBlock.tsx`

- 변경 전:
  ```ts
  customStyle={{
    background:    '#2b2b2b',
    margin:        0,
    padding:       '1rem',
    overflowX:     'auto',
    lineHeight:    '1.625',
    whiteSpace:    'pre',
  }}
  codeTagProps={{
    style: {
      fontFamily: '...',
      fontSize,
    },
  }}
  ```
- 변경 후:
  ```ts
  wrapLongLines
  customStyle={{
    background:    '#2b2b2b',
    margin:        0,
    padding:       '1rem',
    lineHeight:    '1.625',
    whiteSpace:    'pre-wrap',
    wordBreak:     'break-word',
  }}
  codeTagProps={{
    style: {
      fontFamily: '...',
      fontSize,
      whiteSpace:  'pre-wrap',
      wordBreak:   'break-word',
    },
  }}
  ```
- 이유: `whiteSpace: 'pre'` + `overflowX: 'auto'`조합은 긴 줄을 가로 스크롤로 처리한다. `wrapLongLines`(react-syntax-highlighter가 각 토큰 span에 inline-wrap 스타일 적용) + `pre-wrap`(공백·개행 보존, 컨테이너 초과 시 줄바꿈) + `break-word`(단어 경계 없어도 강제 줄바꿈)로 교체하여 박스 안에서 wrap되게 한다. 들여쓰기·공백은 `pre-wrap`이 보존하므로 서식 손상 없음. 줄 번호·헤더·Darcula 테마는 영향 없음.

### 복원 방법

이 ID(HIST-20260629-001)만으로 복원 시, `frontend/src/components/ui/CodeBlock.tsx`에서:
1. `wrapLongLines` prop 제거
2. `customStyle`의 `whiteSpace: 'pre-wrap'`, `wordBreak: 'break-word'` → `whiteSpace: 'pre'`로, `overflowX: 'auto'` 다시 추가
3. `codeTagProps.style`의 `whiteSpace`, `wordBreak` 항목 제거

---

## HIST-20260623-002

- **날짜**: 2026-06-23
- **수정 범위**: 사용자 프론트엔드 / CodeBlock 구문강조 컴포넌트
- **수정 개요**: hljs Light 빌드 import를 PrismLight 빌드로 교체하여 프리렌더 단계 TypeError 해소

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/CodeBlock.tsx` | 수정 | import 경로 1줄 교체: `dist/esm/light` → `dist/esm/prism-light` |

### 수정 상세

#### `frontend/src/components/ui/CodeBlock.tsx`
- 변경 전:
  ```ts
  import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/light';
  ```
- 변경 후:
  ```ts
  import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light';
  ```
- 이유: `dist/esm/light`는 hljs(highlight.js) Light 빌드이며 `Prism.languages.extend`, `refractor.register` 같은 Prism 전용 API를 노출하지 않는다. Prism 언어 모듈(`dist/esm/languages/prism/*`)과 Prism 테마(`dist/esm/styles/prism/darcula`)를 함께 사용하려면 반드시 `dist/esm/prism-light`(PrismLight 빌드)를 사용해야 한다. 잘못된 조합으로 인해 `npm run build` 프리렌더 단계에서 `TypeError: Cannot read properties of undefined (reading 'extend')`, `TypeError: e.register is not a function` 등이 언어별로 반복 발생했다. 설치 버전: react-syntax-highlighter ^15.6.6.

### 복원 방법
HIST-20260623-002 복원 시: `src/components/ui/CodeBlock.tsx` 1번째 import를 `react-syntax-highlighter/dist/esm/light`로 되돌린다(주의: 프리렌더 TypeError 재발).

---

## HIST-20260623-001

- **날짜**: 2026-06-23
- **수정 범위**: 사용자 프론트엔드 / 공용 구문강조 코드 블록 (CodeBlock) 도입 및 4개 화면 교체
- **수정 개요**: react-syntax-highlighter Light 빌드 기반 공용 CodeBlock 컴포넌트를 신규 생성하고, 기존 로컬/인라인 코드 블록 4곳을 공용 컴포넌트로 교체. 퀴즈 화면은 bg-gray-900→Darcula 테마로 시각 변경.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/CodeBlock.tsx` | 추가 | 공용 구문강조 코드 블록 컴포넌트 신규 생성 |
| `frontend/src/app/exam/[id]/page.tsx` | 수정 | 로컬 CodeBlock 함수 제거 → 공용 import |
| `frontend/src/components/ui/LinkedQuestionBox.tsx` | 수정 | 로컬 CodeBlock 함수 제거 → 공용 import (className="mt-3" 유지) |
| `frontend/src/components/ui/QuestionDetailModal.tsx` | 수정 | 인라인 pre + 중복 라벨 p 제거 → CodeBlock size="xs" |
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | 인라인 pre(bg-gray-900) 제거 → CodeBlock(Darcula, 의도적 시각 변경) |
| `frontend/package.json` | 수정 | react-syntax-highlighter@^15.5.0, @types/react-syntax-highlighter@^15.5.13 추가 |
| `CLAUDE.md` | 수정 | Shared Utilities 표에 CodeBlock 행 추가 |

### 수정 상세

#### `frontend/src/components/ui/CodeBlock.tsx` (신규)
- 변경 전: 파일 없음
- 변경 후:
  - `react-syntax-highlighter/dist/esm/light` Light 빌드 import (번들 최소화)
  - Prism 14개 언어 개별 등록: javascript, typescript, python, java, c, cpp, csharp, go, rust, kotlin, swift, sql, markup(html), css
  - LANG_MAP 상수: TPMP language id → Prism id (html→markup, c#→csharp 등 별칭 포함)
  - darculaCustom 테마: 기존 darcula 스타일 + 배경 #2b2b2b / 기본 텍스트 #a9b7c6 덮어쓰기
  - Props: `code`, `language?`, `size?('sm'|'xs')`, `showHeader?(boolean)`, `className?`
  - 신호등 점 3개 헤더 + language 라벨 (showHeader=true일 때)
  - 미매핑 language는 SyntaxHighlighter에 language prop 없이 plain 폴백
- 이유: 로컬/인라인 코드 블록 중복 제거, 구문강조 기능 통일 도입

#### `frontend/src/app/exam/[id]/page.tsx`
- 변경 전: 파일 내 로컬 `function CodeBlock` 정의(L28~L44), plain pre 렌더
- 변경 후: 로컬 함수 제거, `import { CodeBlock } from '@/components/ui/CodeBlock'` 추가. 호출부 `<CodeBlock code={q.code} language={q.language} />` 그대로 유지
- 이유: 공용 컴포넌트 일원화

#### `frontend/src/components/ui/LinkedQuestionBox.tsx`
- 변경 전: 파일 내 로컬 `function CodeBlock` 정의(L6~L22), plain pre 렌더
- 변경 후: 로컬 함수 제거, 공용 import. `<CodeBlock code={code} language={language} className="mt-3" />`로 margin 유지
- 이유: 공용 컴포넌트 일원화

#### `frontend/src/components/ui/QuestionDetailModal.tsx`
- 변경 전: `<div>` 래퍼 + `<p>코드 (language)</p>` 라벨 + `<pre className="bg-[#2b2b2b] text-[#a9b7c6] text-xs ...">` 인라인 블록
- 변경 후: `<CodeBlock code={question.code} language={question.language} size="xs" />` 단일 교체 (CodeBlock 헤더가 language 표시를 포함하므로 중복 라벨 p 제거)
- 이유: 인라인 스타일 제거, 구문강조 도입, 라벨 중복 방지

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx`
- 변경 전: `<pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-xl overflow-x-auto">{q.code}</pre>` (green-on-black 스타일)
- 변경 후: `<CodeBlock code={q.code} language={q.language} />` (Darcula 테마로 통일)
- 이유: 코드 블록 시각 일관성 확보. bg-gray-900 green 스타일은 의도적으로 Darcula로 교체.

### 복원 방법
이 ID(HIST-20260623-001)만으로 복원 시:
1. `CodeBlock.tsx` 삭제
2. `exam/[id]/page.tsx` — import 제거, 로컬 CodeBlock 함수 L27~L44 복원
3. `LinkedQuestionBox.tsx` — import 제거, 로컬 CodeBlock 함수 L6~L22 복원, `<CodeBlock>` 호출 → `<CodeBlock code={code} language={language} />`(className 없음)
4. `QuestionDetailModal.tsx` — `<CodeBlock>` 교체 → div+p+pre 블록 복원
5. `quiz/[categoryId]/page.tsx` — `<CodeBlock>` → `<pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-xl overflow-x-auto">{q.code}</pre>` 복원
6. `package.json` — react-syntax-highlighter, @types/react-syntax-highlighter 의존성 제거
7. `CLAUDE.md` — CodeBlock 행 제거
