## HIST-20260909-001

- **날짜**: 2026-09-09
- **수정 범위**: 사용자 프론트엔드 / FAQ 목록 페이지네이션
- **수정 개요**: 배열 FAQ를 기본 10개씩 표시하고 5/10/20/50개 크기 선택, 전체 건수·현재 범위, 이동 시 목록 상단 스크롤을 적용했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/faq/page.tsx` | 수정 | FAQ 배열 페이지 분할과 열린 항목 초기화 적용 |
| `frontend/src/app/user/faq/page.test.tsx` | 추가 | 11개 FAQ의 10개 경계 및 아코디언 상태 회귀 테스트 |
| `frontend/src/components/ui/ListPagination.tsx` | 추가 | 목록 페이지네이션 공용 UI |
| `frontend/src/components/ui/ListLoadError.tsx` | 추가 | 조회 실패와 빈 상태를 구분하는 재시도 UI |
| `frontend/src/components/ui/ListPagination.test.tsx` | 추가 | 공용 페이지네이션 계약 테스트 |
| `AGENTS.md` | 수정 | 새 공용 UI 사용 표 등록 |

### 수정 상세

#### `frontend/src/app/user/faq/page.tsx`
- 변경 전: 활성 FAQ 전체를 한 화면에 렌더했다.
- 변경 후: 기본 10개 단위로 현재 페이지만 렌더하고 페이지·크기 변경 시 열려 있던 답변을 닫으며 크기 변경 시 첫 페이지로 복귀한다. 조회 실패에는 빈 FAQ 대신 재시도 UI를 표시한다.
- 이유: FAQ 수가 늘어날 때도 목록 길이를 일정하게 유지하고 페이지 간 아코디언 상태가 섞이지 않게 하기 위해서다.

### 복원 방법

이 ID(`UserFaq_Modified.md` 기준 HIST-20260909-001)로 복원 시 FAQ 페이지의 페이지 상태·배열 슬라이스·`ListPagination`을 제거하고 전체 `faqs` 렌더 방식으로 되돌린다. 공용 컴포넌트는 다른 메뉴에서도 사용하므로 함께 제거하지 않는다.
