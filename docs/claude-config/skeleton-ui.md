# Skeleton UI Convention

데이터 페칭이 있는 모든 화면은 반드시 스켈레톤 UI를 구현한다.
텍스트("불러오는 중...") 또는 스피너(`animate-spin`)를 단독으로 사용하지 않는다.

모든 스켈레톤은 `src/components/ui/Skeleton.tsx`에서 import한다.

---

## 구현 패턴

```tsx
import { TableSkeleton, CardListSkeleton } from '@/components/ui/Skeleton';

// ✅ 테이블 페이지
<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
  {loading ? (
    <TableSkeleton rows={5} cols={5} />
  ) : data.length === 0 ? (
    <EmptyState />
  ) : (
    <table>...</table>
  )}
</div>

// ✅ 카드 목록 페이지
{loading ? (
  <CardListSkeleton rows={6} />
) : items.length === 0 ? (
  <EmptyState />
) : (
  <div className="grid gap-3">...</div>
)}

// ❌ 금지
{loading && <div className="text-center text-gray-400">불러오는 중...</div>}
{loading && <div className="animate-spin ..." />}
```

---

## 새 화면 추가 체크리스트

- `useState(true)` — 초기 `loading` 상태를 `true`로 설정
- `finally(() => setLoading(false))` — fetch 완료 후 반드시 해제
- 데이터 구조에 맞는 Skeleton 컴포넌트 사용
- 빈 상태(empty state) 별도 처리 (`loading === false && data.length === 0`)
- 새 레이아웃은 `Skeleton.tsx`에 신규 컴포넌트 추가 후 CLAUDE.md 표 갱신

---

## 신규 Skeleton 컴포넌트 추가

`Skeleton.tsx`에 named export로 추가하고, CLAUDE.md의 컴포넌트 표에 행을 추가한다.

```tsx
export function MyNewSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="...">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
```
