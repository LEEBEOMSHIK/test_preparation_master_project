## HIST-20260629-002

- **날짜**: 2026-06-29
- **수정 범위**: 사용자 프론트엔드 / 공용 RichContent 컴포넌트 (시험·퀴즈·개념노트·상세모달 등 본문 전반)
- **수정 개요**: `<pre>` 코드 블록 및 내부 `<code>` 긴 줄 가로 스크롤 → 줄바꿈(wrap)으로 교체

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/RichContent.tsx` | 수정 | `[&_pre]:overflow-x-auto` 제거 → `whitespace-pre-wrap break-words` 추가, `[&_pre_code]` 동일 적용 |

### 수정 상세

#### `frontend/src/components/ui/RichContent.tsx`

- 변경 전:
  ```
  '[&_pre]:overflow-x-auto [&_pre]:max-w-full',
  ```
- 변경 후:
  ```
  '[&_pre]:max-w-full [&_pre]:whitespace-pre-wrap [&_pre]:break-words',
  '[&_pre_code]:whitespace-pre-wrap [&_pre_code]:break-words',
  ```
- 이유: `overflow-x-auto`가 있으면 긴 코드 줄이 박스를 벗어나 가로 스크롤이 생겼음. `whitespace-pre-wrap`은 기존 공백·개행을 보존하면서 컨테이너 너비를 초과할 때만 줄바꿈하므로, 들여쓰기 등 서식을 유지한 채 스크롤 없이 박스 안에서 렌더된다. `[&_pre_code]`도 동일하게 적용하여 `<pre><code>` 중첩 구조에서도 보장. 다크 박스(bg-gray-900, p-3, rounded-lg 등)는 변경 없음.

### 복원 방법

이 ID(HIST-20260629-002)만으로 복원 시, `frontend/src/components/ui/RichContent.tsx`의 `<pre>` 관련 2줄을 아래 1줄로 되돌린다.

```
'[&_pre]:overflow-x-auto [&_pre]:max-w-full',
```

그리고 `[&_pre_code]:whitespace-pre-wrap [&_pre_code]:break-words` 행을 삭제한다.

---

## HIST-20260629-001

- **날짜**: 2026-06-29
- **수정 범위**: 사용자 프론트엔드 / 공용 RichContent 컴포넌트 (시험·퀴즈·개념노트·상세모달 등 본문 전반)
- **수정 개요**: RichContent 내 `<pre>` 코드 블록을 어두운 박스·여백으로 시각적으로 분리하여 지문과 코드가 한 덩어리로 붙어 보이는 문제 해결

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/RichContent.tsx` | 수정 | `<pre>` Tailwind arbitrary variant 스타일 강화 — 배경·패딩·여백·라운드·폰트 추가 |

### 수정 상세

#### `frontend/src/components/ui/RichContent.tsx`

- 변경 전:
  ```
  '[&_pre]:overflow-x-auto [&_pre]:max-w-full',
  ```
- 변경 후:
  ```
  '[&_pre]:overflow-x-auto [&_pre]:max-w-full',
  '[&_pre]:bg-gray-900 [&_pre]:text-gray-100',
  '[&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:my-3',
  '[&_pre]:text-sm [&_pre]:leading-relaxed [&_pre]:font-mono',
  ```
- 이유: 일부 문항 content가 `<p>지문</p><pre><code>SQL…</code></pre>` 형태로 저장될 때 `<pre>`에 배경·여백·라운드가 없어 지문 `<p>`와 바짝 붙어 보이는 문제(개행 없음으로 인지) 해결. `my-3`으로 상하 여백을 주고 `bg-gray-900 / text-gray-100`으로 어두운 박스를 형성하여 프로젝트 CodeBlock(Darcula 다크) 톤과 일관되게 맞춤. 인라인 `<code>`(pre 밖)는 별도 스타일 미적용(과한 변경 금지 방침 준수).

### 복원 방법

이 ID(HIST-20260629-001)만으로 복원 시, `frontend/src/components/ui/RichContent.tsx`의 `<pre>` 관련 4개 클래스 라인을 아래 1줄로 되돌린다.

```
'[&_pre]:overflow-x-auto [&_pre]:max-w-full',
```
