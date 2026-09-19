## HIST-20260919-001

- **날짜**: 2026-09-19
- **수정 범위**: 사용자 프론트엔드 / 패치노트 목록
- **수정 개요**: 릴리즈 카드 안에 유형별 패치 항목 배지와 요약을 표시하고 legacy 본문 fallback을 유지했습니다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `frontend/src/types/index.ts` | 수정 | 패치 항목 응답 타입을 추가했습니다. |
| `frontend/src/app/user/patch-notes/page.tsx` | 수정 | 항목 유형별 배지·요약 목록과 content fallback을 렌더링합니다. |
| `frontend/src/app/user/patch-notes/page.test.tsx` | 수정 | 버전별 카드, 배지, 요약, legacy fallback을 검증했습니다. |

### 수정 상세

#### `frontend/src/types/index.ts`
- 변경 전: `PatchNote`에 중첩 패치 항목 타입이 없었습니다.
- 변경 후: 선택적인 `items`와 항목 유형 유니온을 추가했습니다.
- 이유: 항목이 포함된 신규 응답과 항목이 없는 기존 응답을 함께 처리하기 위해서입니다.

#### `frontend/src/app/user/patch-notes/page.tsx`
- 변경 전: 모든 릴리즈 카드에서 HTML 본문을 렌더링했습니다.
- 변경 후: 항목이 있으면 displayOrder 순서로 유형 배지와 요약 목록을 표시하고, 항목이 없으면 기존 `RichContent` 본문을 표시합니다.
- 이유: 신규 버전별 목록 UI를 제공하면서 기존 패치노트가 사라지지 않게 하기 위해서입니다.

### 복원 방법

이 항목의 수정 상세에 따라 사용자 카드의 항목 분기와 패치 항목 타입을 되돌립니다. 복원 후 `frontend`에서 사용자 패치노트 테스트와 전체 Jest 테스트를 실행해 legacy 본문 표시를 확인합니다.
