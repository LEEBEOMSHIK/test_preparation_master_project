## HIST-20260420-006

- **날짜**: 2026-04-20
- **수정 범위**: 관리자 프론트엔드 / 도메인 테이블 관리
- **수정 개요**: "테이블 관리 > 도메인 관리" 메뉴 추가, 도메인 마스터/슬레이브 CRUD 화면 구현

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `src/components/layout/AdminLayoutShell.tsx` | 수정 | "테이블 관리" nav 항목 추가 (서브메뉴: 도메인 관리) |
| `src/services/domainService.ts` | 수정 | getDomains 외 createMaster/updateMaster/deleteMaster/createSlave/updateSlave/deleteSlave 추가 |
| `src/types/index.ts` | 수정 | `DomainSlave`에 `displayOrder?: number` 필드 추가 |
| `src/app/admin/tables/domains/page.tsx` | 추가 | 도메인 마스터·슬레이브 관리 화면 |

### 수정 상세

#### `AdminLayoutShell.tsx`
- 변경 전: 시험 관리, 개념노트 관리, 1:1 문의 관리
- 변경 후: 상기 3개 + "테이블 관리" (서브: 도메인 관리 `/admin/tables/domains`)

#### `src/app/admin/tables/domains/page.tsx`
- 변경 전: 없음
- 변경 후:
  - 마스터 목록 표시 (이름, 슬레이브 수, 수정/삭제 버튼)
  - 마스터 인라인 수정 (Enter 저장, Escape 취소)
  - 슬레이브 목록: displayOrder, 이름, 수정/삭제
  - 슬레이브 추가: 인라인 input + Enter 지원

### 복원 방법

HIST-20260420-006 복원 시:
- `AdminLayoutShell.tsx`에서 "테이블 관리" 항목 제거
- `domainService.ts`를 getDomains 전용으로 되돌림
- `types/index.ts`에서 `DomainSlave.displayOrder` 제거
- `src/app/admin/tables/` 디렉토리 삭제
