# RichTextEditor 콘텐츠 표시 규칙

RichTextEditor(react-quill)는 항상 HTML 문자열을 출력한다.

| 용도 | 사용 방법 | Import |
|------|----------|--------|
| **본문 표시** (문제·개념노트 등 전체) | `<RichContent html={content} className="..." />` | `@/components/ui/RichContent` |
| **목록 미리보기** (테이블·피커·line-clamp) | `{stripHtml(content)}` | `@/lib/html` |

---

## RichContent 컴포넌트

`src/components/ui/RichContent.tsx` — 에디터 HTML을 올바르게 렌더링.
내부적으로 `dangerouslySetInnerHTML`을 사용하며 이미지·리스트·링크·헤딩 스타일 기본 제공.

```tsx
import { RichContent } from '@/components/ui/RichContent';

// ✅ 올바른 패턴
<RichContent html={q.content} className="text-gray-800 text-sm" />

// ❌ 금지
<div dangerouslySetInnerHTML={{ __html: q.content }} />
<p>{q.content}</p>
```

---

## stripHtml 유틸리티

`src/lib/html.ts` — HTML 태그를 제거하고 순수 텍스트 반환.
테이블·피커 미리보기, 검색·정렬 등 텍스트만 필요한 곳에서 사용.

```tsx
import { stripHtml } from '@/lib/html';

// ✅ 올바른 패턴
<p className="line-clamp-2">{stripHtml(q.content)}</p>

// ❌ 금지
<p>{q.content.replace(/<[^>]+>/g, '')}</p>
```

---

## 새 화면 추가 체크리스트

- 에디터 필드를 **전체 표시** → `<RichContent>` 사용
- 에디터 필드를 **잘라서 미리보기** → `stripHtml()` 사용
- `dangerouslySetInnerHTML` 직접 사용 금지
- 인라인 `.replace(/<[^>]+>/g, '')` 작성 금지
